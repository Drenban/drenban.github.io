const DEFAULT_CONFIG = {
    JSON_DATA_PATH: '/assets/data/data.json',
    CORPUS_PATH: '/assets/data/corpus.json',
    USER_DATA_PATH: '/assets/obfuscate/',
    TOKEN_EXPIRY_MS: 3600000,
    CACHE_LIMIT: 100,
    MAX_HISTORY: 10,
};

let CONFIG = null;
let supabaseClient = null;

const PASSWORD = window.ENCRYPTION_PASSWORD || 'border-radius: 280185px;';
const ENCRYPTION_KEY = CryptoJS.SHA256(PASSWORD).toString(CryptoJS.enc.Hex);

async function decryptSupabaseConfig() {
    try {
        const response = await fetch('/assets/data/supabase-config.json');
        if (!response.ok) throw new Error(`Failed to fetch supabase-config.json: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const { encrypted, iv } = data;
        if (!encrypted || !iv) throw new Error('Invalid supabase-config.json format');
        const encryptedWordArray = CryptoJS.enc.Hex.parse(encrypted);
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: encryptedWordArray },
            CryptoJS.enc.Hex.parse(ENCRYPTION_KEY),
            { iv: CryptoJS.enc.Hex.parse(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );
        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) throw new Error('Decryption failed: Empty result');
        window.SUPABASE_CONFIG = JSON.parse(decryptedText);
        return window.SUPABASE_CONFIG;
    } catch (error) {
        console.error('Decryption of supabase-config.json failed:', error);
        return null;
    }
}

async function loadConfig() {
    if (!window.SUPABASE_CONFIG) {
        console.error('SUPABASE_CONFIG is null or undefined');
        return null;
    }
    const { SUPABASE_URL, SUPABASE_KEY } = window.SUPABASE_CONFIG;

    if (!window.supabase?.createClient) {
        console.error('Supabase library not loaded or createClient is undefined');
        throw new Error('Supabase library not loaded');
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        const { data, error } = await supabase.storage
            .from('config-bucket')
            .download('config.json');
        
        if (error) {
            console.error('Download failed:', error);
            throw new Error(`Download error: ${error.message}`);
        }

        const configText = await data.text();
        const config = JSON.parse(configText);

        return { ...config, supabase };
    } catch (error) {
        console.error('Load CONFIG failed:', error);
        return null;
    }
}

async function loadDataFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to load file ${filePath}:`, error);
        return null;
    }
}

// async function initializeConfig() {
//     try {
//         await decryptSupabaseConfig();
//         const result = await loadConfig();
//         if (!result) throw new Error('Failed to initialize CONFIG');
//         CONFIG = result;
//         supabaseClient = result.supabase;
//     } catch (error) {
//         console.error('initializeConfig failed:', error);
//         throw error;
//     }
// }

async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`[CONFIG] Retry ${i + 1}/${retries} after ${delay}ms:`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function initializeConfig() {
    try {
        console.log('[CONFIG] 初始化配置...');
        const supabaseConfig = await withRetry(decryptSupabaseConfig);
        if (!supabaseConfig) throw new Error('解密 Supabase 配置失败');

        const result = await withRetry(loadConfig);
        if (!result) throw new Error('加载配置失败');

        CONFIG = result;
        supabaseClient = result.supabase;
        console.log('[CONFIG] 配置初始化成功');
    } catch (error) {
        console.error('[CONFIG] 配置初始化失败:', error);
        CONFIG = null;
        supabaseClient = null;
        throw new Error(`配置初始化失败: ${error.message}`);
    }
}

// async function initializeConfig() {
//     try {
//         console.log('[CONFIG] Decrypting config...');
//         const supabaseConfig = await withRetry(decryptSupabaseConfig);
//         if (!supabaseConfig) throw new Error('decryptSupabaseConfig returned null');

//         console.log('[CONFIG] Loading config...');
//         const result = await withRetry(loadConfig);
//         if (!result) throw new Error('loadConfig returned null or undefined');

//         CONFIG = { ...DEFAULT_CONFIG, ...result };
//         supabaseClient = CONFIG.supabase;

//         console.log('[CONFIG] Initialization successful:', CONFIG);
//     } catch (error) {
//         console.error('[CONFIG] Initialization failed:', error);

//         CONFIG = { ...DEFAULT_CONFIG };
//         supabaseClient = null;

//         try {
//             const jsonCheck = await fetch(CONFIG.JSON_DATA_PATH);
//             const corpusCheck = await fetch(CONFIG.CORPUS_PATH);
//             if (!jsonCheck.ok || !corpusCheck.ok) {
//                 console.warn('[CONFIG] Default paths may be invalid:', CONFIG.JSON_DATA_PATH, CONFIG.CORPUS_PATH);
//             }
//         } catch (fetchError) {
//             console.warn('[CONFIG] Default paths unavailable:', fetchError.message);
//         }

//         console.warn('[CONFIG] Using fallback default configuration:', CONFIG);
//     }
// }

const ELEMENTS = {
    signUpButton: document.getElementById('signUp'),
    signInButton: document.getElementById('signIn'),
    container: document.getElementById('auth-container'),
    searchPage: document.getElementById('search-page'),
    searchInput: document.getElementById('search-input'),
    resultsList: document.getElementById('results-list'),
    historyList: document.getElementById('history-list'),
    searchBar: document.querySelector('.search-bar'),
    historyButton: document.querySelector('.history-btn'),
    searchHistory: document.querySelector('.search-history'),
    logoutButton: document.querySelector('.logout-btn'),
    signInForm: document.querySelector('.sign-in-container form'),
    signUpForm: document.querySelector('.sign-up-container form'),
    searchButton: document.querySelector('.search-btn'),
    randomButton: document.querySelector('.random-btn')
};

if (Object.values(ELEMENTS).some(el => !el)) {
    console.error('DOM elements missing:', ELEMENTS);
    throw new Error('Initialization failed due to missing DOM elements');
}

const state = {
    userData: null,
    workbookData: null,
    corpus: null,
    fuse: null,
    searchCache: new Map(),
    searchHistory: [],
    randomCount: 0,
    maxRandomCount: 5,
    isAnimating: false
};

const utils = {
    decodeBase64UTF8(base64Str) {
        try {
            const binaryStr = atob(base64Str);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            return new TextDecoder('utf-8').decode(bytes);
        } catch (error) {
            throw new Error(`Base64 decode failed: ${error.message}`);
        }
    },

    async hashPassword(password) {
        const data = new TextEncoder().encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    generateToken(username) {
        const salt = crypto.randomUUID();
        const payload = { username, exp: Date.now() + DEFAULT_CONFIG.TOKEN_EXPIRY_MS, salt };
        localStorage.setItem('salt', salt);
        return btoa(JSON.stringify(payload));
    },

    verifyToken(token) {
        if (!token) {
            localStorage.removeItem('token');
            localStorage.removeItem('salt');
            return false;
        }
        try {
            const payload = JSON.parse(atob(token.includes('.') ? token.split('.')[1] : token));
            const exp = token.includes('.') ? payload.exp * 1000 : payload.exp;
            if (!exp || exp < Date.now()) {
                localStorage.removeItem('token');
                localStorage.removeItem('salt');
                return false;
            }
            if (!token.includes('.') && payload.salt !== localStorage.getItem('salt')) {
                localStorage.removeItem('token');
                localStorage.removeItem('salt');
                return false;
            }
            return true;
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('salt');
            return false;
        }
    },

    sanitizeInput(input) {
        return input.replace(/[&<>"'`;=()/\\]/g, '');
    },

    isMembershipValid(expiryDate) {
        const current = new Date().setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate).getTime();
        return expiry > current && !isNaN(expiry);
    }
};

const dataLoader = {
    async loadJSONData() {
        try {
            const response = await fetch(DEFAULT_CONFIG.JSON_DATA_PATH);
            if (!response.ok) throw new Error('Failed to load JSON data');
            state.workbookData = JSON.parse(utils.decodeBase64UTF8(await response.text()));
        } catch (error) {
            console.error('Load JSON failed:', error);
            ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
        }
    },

    async loadCorpus() {
        try {
            const response = await fetch(DEFAULT_CONFIG.CORPUS_PATH);
            if (!response.ok) throw new Error(`Failed to load corpus: ${response.status}`);
            state.corpus = JSON.parse(utils.decodeBase64UTF8(await response.text()));
            state.fuse = new Fuse(state.corpus, {
                keys: [
                    { name: 'question', weight: 0.5 },
                    { name: 'keywords', weight: 0.3 },
                    { name: 'synonyms', weight: 0.15 },
                    { name: 'tags', weight: 0.05 }
                ],
                threshold: 0.4,
                includeScore: true,
                includeMatches: true,
                minMatchCharLength: 2,
                shouldSort: true
            });
        } catch (error) {
            console.error('Load corpus failed:', error);
        }
    },

    async loadUserData(username) {
        if (!CONFIG) {
            console.error('CONFIG is not initialized, unable to load user data.');
            return null;
        }
        try {
            const response = await fetch(`${DEFAULT_CONFIG.USER_DATA_PATH}${username}.json`);
            console.log('Fetching user data:', response.status, response.statusText);
            if (response.status === 404) {
                console.warn(`User data file not found for ${username}`);
                return null;
            }
            if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
            const data = JSON.parse(utils.decodeBase64UTF8(await response.text()));
            console.log(`Loaded user data for ${username}`);
            state.userData = data;
            return data;
        } catch (error) {
            console.error(`Failed to load user data for ${username}:`, error);
            return null;
        }
    }
};

const search = {
    // json(query) {
    //     if (!state.workbookData) {
    //         ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
    //         return null;
    //     }
    
    //     const conditions = {};
    //     let isSimpleQuery = false;
    //     let name, age;
    //     query = query.trim().toLowerCase();
    
    //     if (query.includes(':')) {
    //         query.split(',').forEach(part => {
    //             const [key, value] = part.split(':').map(s => s.trim());
    //             if (key && value !== undefined) {
    //                 conditions[key] = value;
    //             }
    //         });
    //         name = conditions['celv'] || conditions['策略'];
    //         age = conditions['shoupanjia'] || conditions['收盘价'];
    //         if (name && age && Object.keys(conditions).length === 2) {
    //             isSimpleQuery = true;
    //         }
    //     }
    //     else if (/[，, ]/.test(query)) {
    //         const parts = query.split(/[，, ]+/).map(s => s.trim());
    //         if (parts.length === 2) {
    //             isSimpleQuery = true;
    //             [age, name] = /^\d+$/.test(parts[0]) ? [parts[0], parts[1]] : [parts[1], parts[0]];
    //             conditions['策略'] = name;
    //             conditions['收盘价'] = age;
    //         }
    //     }
    //     else if (/^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query) || /^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
    //         isSimpleQuery = true;
    //         if (/^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
    //             age = query.match(/\d+/)[0];
    //             name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
    //         } else {
    //             name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
    //             age = query.match(/\d+/)[0];
    //         }
    //         conditions['策略'] = name;
    //         conditions['收盘价'] = age;
    //     }
    //     else if (/^\d+$/.test(query)) {
    //         conditions['股票代码'] = query;
    //     }
    //     else {
    //         conditions[''] = query;
    //     }
    
    //     const matches = state.workbookData.filter(row => {
    //         if (conditions['']) {
    //             const result = Object.values(row).some(val => String(val).toLowerCase().includes(conditions['']));
    //             return result;
    //         }
    //         const result = Object.entries(conditions).every(([key, value]) => {
    //             const rowValue = String(row[key] || '').toLowerCase();
    //             if (!value) return true;
    //             if (value.includes('-')) {
    //                 const [min, max] = value.split('-').map(Number);
    //                 const numValue = Math.floor(Number(rowValue));
    //                 return numValue >= min && numValue <= max;
    //             }
    //             if (value.startsWith('>')) {
    //                 const compare = Math.floor(Number(rowValue)) > Number(value.slice(1));
    //                 return compare;
    //             }
    //             if (value.startsWith('<')) {
    //                 const compare = Math.floor(Number(rowValue)) < Number(value.slice(1));
    //                 return compare;
    //             }
    //             if (key.toLowerCase() === '收盘价') {
    //                 const compare = Math.floor(Number(rowValue)) === Math.floor(Number(value));
    //                 return compare;
    //             }
    //             const compare = rowValue === value;
    //             return compare;
    //         });
    //         return result;
    //     });
    
    //     if (!matches.length) {
    //         return null;
    //     }
    
    //     if (isSimpleQuery) {
    //         const codes = matches.map(row => row['股票代码']).filter(Boolean).join(', ');
    //         const result = [
    //             `<span class="field">全部代码:</span><br><span class="value">${codes}</span>`,
    //             `<span class="field">合计:</span> <span class="value">${matches.length}</span>`
    //         ];
    //         return result;
    //     } else {
    //         const result = matches.flatMap((result, index) => [
    //             ...Object.entries(result).map(([key, value]) => `<span class="field">${key}:</span> <span class="value">${value}</span>`),
    //             ...(index < matches.length - 1 ? ['<hr>'] : [])
    //         ]);
    //         return result;
    //     }
    // },

    json(query) {
        if (!state.workbookData) {
            ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
            return null;
        }
    
        const conditions = {};
        let isSimpleQuery = false;
        let strategy, price;
        query = query.trim().toLowerCase();
    
        // 解析输入
        if (query.includes(':')) {
            // 键值对：如 "策略:买入,收盘价:20"
            query.split(',').forEach(part => {
                const [key, value] = part.split(':').map(s => s.trim());
                if (key && value !== undefined) {
                    conditions[key] = value;
                }
            });
            strategy = conditions['celv'] || conditions['策略'];
            price = conditions['shoupanjia'] || conditions['收盘价'];
            if (strategy && price) {
                isSimpleQuery = true;
                conditions['策略'] = strategy;
                conditions['收盘价'] = price;
            }
        } else if (/[，, ]/.test(query)) {
            // 逗号/空格分隔：如 "买入 20" 或 "20,买入"
            const parts = query.split(/[，, ]+/).map(s => s.trim());
            if (parts.length === 2) {
                isSimpleQuery = true;
                if (/^\d+(\.\d+)?$/.test(parts[0])) {
                    [price, strategy] = parts;
                } else {
                    [strategy, price] = parts;
                }
                conditions['策略'] = strategy;
                conditions['收盘价'] = price;
            }
        } else if (/^[\u4e00-\u9fa5a-zA-Z]+\d+(\.\d+)?$/.test(query) || /^\d+(\.\d+)?[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
            // 连写：如 "买入20.5" 或 "20.5买入"
            isSimpleQuery = true;
            if (/^\d+(\.\d+)?[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
                price = query.match(/\d+(\.\d+)?/)[0];
                strategy = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
            } else {
                strategy = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
                price = query.match(/\d+(\.\d+)?/)[0];
            }
            conditions['策略'] = strategy;
            conditions['收盘价'] = price;
        } else if (/^\d+$/.test(query)) {
            // 纯数字：股票代码
            conditions['股票代码'] = query;
        } else {
            // 模糊搜索
            conditions[''] = query;
        }
    
        // 过滤数据
        const matches = state.workbookData.filter(row => {
            if (conditions['']) {
                return Object.values(row).some(val => String(val).toLowerCase().includes(conditions['']));
            }
            return Object.entries(conditions).every(([key, value]) => {
                const rowValue = String(row[key] || '').toLowerCase();
                if (!value) return true;
                if (key.toLowerCase() === '收盘价') {
                    // 放宽价格匹配，允许 ±0.1 容差
                    const rowPrice = Number(rowValue);
                    const queryPrice = Number(value);
                    return Math.abs(rowPrice - queryPrice) <= 0.5;
                }
                if (value.includes('-')) {
                    const [min, max] = value.split('-').map(Number);
                    const numValue = Number(rowValue);
                    return numValue >= min && numValue <= max;
                }
                if (value.startsWith('>')) {
                    return Number(rowValue) > Number(value.slice(1));
                }
                if (value.startsWith('<')) {
                    return Number(rowValue) < Number(value.slice(1));
                }
                return rowValue === value;
            });
        });
    
        if (!matches.length) {
            return null;
        }
    
        if (isSimpleQuery) {
            const codes = matches.map(row => row['股票代码']).filter(Boolean).join(', ');
            const result = [
                `<span class="field">全部代码:</span><br><span class="value">${codes}</span>`,
                `<span class="field">合计:</span> <span class="value">${matches.length}</span>`
            ];
            return result;
        } else {
            const result = matches.flatMap((result, index) => [
                ...Object.entries(result).map(([key, value]) => `<span class="field">${key}:</span> <span class="value">${value}</span>`),
                ...(index < matches.length - 1 ? ['<hr>'] : [])
            ]);
            return result;
        }
    },
    
    corpus(query) {
        if (!state.corpus || !state.fuse) return 'Corpus not loaded, please try again later';
        query = query.trim().toLowerCase();
        if (state.searchCache.has(query)) return state.searchCache.get(query);

        const results = state.fuse.search(query);
        const bestMatch = results.length && results[0].score < 0.6 ? results[0] : null;
        const intent = this.detectIntent(query);
        const answer = this.generateResponse(intent, bestMatch);

        if (state.searchCache.size >= DEFAULT_CONFIG.CACHE_LIMIT) state.searchCache.clear();
        state.searchCache.set(query, answer);
        return answer;
    },
    
    // corpus(query) {
    //     if (!state.corpus || !state.fuse) return 'Corpus not loaded, please try again later';
    //     query = query ? query.trim().toLowerCase() : '';
    //     if (!query) return 'Query cannot be empty';
    //     if (state.searchCache.has(query)) return state.searchCache.get(query);
    
    //     const results = state.fuse.search(query);
    //     const bestMatch = results.length && results[0].score < 0.6 ? results[0] : null;
    //     const intent = this.detectIntent(query);
    
    //     // 调用 MiniMind API
    //     const apiUrl = window.API_URL || 'http://localhost:5000/chat'; // 支持配置
    //     // 假设 corpus.json 使用 question 字段
    //     const prompt = bestMatch ? `基于以下内容回答：${bestMatch.item.question}\n问题：${query}` : query;
    //     try {
    //         const response = await axios.post(apiUrl, { query: prompt });
    //         const answer = response.data.response || 'No response from server';
    
    //         // LRU 缓存
    //         if (state.searchCache.size >= DEFAULT_CONFIG.CACHE_LIMIT) {
    //             const oldestKey = state.searchCache.keys().next().value;
    //             state.searchCache.delete(oldestKey);
    //         }
    //         state.searchCache.set(query, answer);
    //         return answer;
    //     } catch (error) {
    //         console.error('API call failed:', error.message);
    //         return error.code === 'ECONNREFUSED' ? 'Server is not responding, please try again later' : 'Sorry, something went wrong.';
    //     }
    // },

    detectIntent(input) {
        const intents = [
            { name: 'time', patterns: ['时间', '什么时候', '几点', '多久', '啥时候', '何时'], fallback: '您想知道什么的时间？可以告诉我更多细节吗？' },
            { name: 'price', patterns: ['价格', '多少钱', '费用', '成本', '价位', '花多少'], fallback: '您想了解哪方面的价格？可以具体一点吗？' },
            { name: 'howto', patterns: ['如何', '怎么', '怎样', '步骤', '方法', '怎么办'], fallback: '您想知道如何做什么？请告诉我具体操作！' },
            { name: 'psychology', patterns: ['心理', '心态', '情绪', '行为'], fallback: '您想了解交易中的什么心理因素？请具体点！' }
        ];
        return intents.find(intent => intent.patterns.some(pattern => input.includes(pattern))) || null;
    },

    // generateResponse(intent, match) {
    //     if (match) return (1 - match.score).toFixed(2) < 0.5 ? '抱歉，找不到准确答案，您可以换个说法试试！' : match.item.answer.trim();
    //     if (intent) {
    //         return {
    //             time: '我可以帮您查时间相关的信息，您具体想知道什么时间？',
    //             price: '价格信息可能因产品不同而异，您想了解哪个产品的价格？',
    //             howto: '我可以指导您完成操作，请告诉我您想做什么！'
    //         }[intent.name] || intent.fallback || '抱歉，我不太明白您的意思，可以换个说法试试吗？';
    //     }
    //     return '抱歉，我不太明白您的意思，可以换个说法试试吗？';
    // },

    generateResponse(intent, match) {
        if (match) return (1 - match.score).toFixed(2) < 0.5 ? '抱歉，找不到准确答案，您可以换个说法试试！' : match.item.answer.trim();
        if (intent) {
            return {
                time: '我可以帮您查时间相关的信息，您具体想知道什么时间？',
                price: '价格信息可能因产品不同而异，您想了解哪个产品的价格？',
                howto: '我可以指导您完成操作，请告诉我您想做什么！'
            }[intent.name] || intent.fallback || `抱歉，我没太明白您的意思。您可以试试以下方式提问：
            - 直接输入股票代码，如：600519
            - 输入交易策略+价格，如：买入10 或 卖出15
            - 不清楚术语（如“收盘价”“量化趋势”）？直接输入名称，我来解释！
            随时提问，我会尽力帮您！😊`;
        }
        return `抱歉，我没太明白您的意思。您可以试试以下方式提问：
        - 直接输入股票代码，如：600519
        - 输入交易策略+价格，如：买入10 或 卖出15
        - 不清楚术语（如“收盘价”“量化趋势”）？直接输入名称，我来解释！
        随时提问，我会尽力帮您！😊`;
    },

    typeLines(lines, element) {
        if (!element || !lines) return;
        if (state.isAnimating) return;

        state.isAnimating = true;
        ELEMENTS.searchButton.disabled = true;
        ELEMENTS.randomButton.disabled = true;
        ELEMENTS.historyButton.disabled = true;
        ELEMENTS.historyList.querySelectorAll('li').forEach(li => li.style.pointerEvents = 'none');

        element.innerHTML = '';
        let lineIndex = 0;

        const typeNextLine = () => {
            if (!state.isAnimating || lineIndex >= lines.length) {
                state.isAnimating = false;
                ELEMENTS.searchButton.disabled = false;
                ELEMENTS.randomButton.disabled = false;
                ELEMENTS.historyButton.disabled = false;
                ELEMENTS.historyList.querySelectorAll('li').forEach(li => li.style.pointerEvents = 'auto');
                return;
            }
            const line = document.createElement('div');
            line.className = 'line';
            element.appendChild(line);
            let charIndex = 0;
            const content = lines[lineIndex] || '';
            const typeChar = (timestamp, lastTime = 0) => {
                if (!state.isAnimating) return;
                if (charIndex < content.length && timestamp - lastTime > 20) {
                    line.innerHTML = content.slice(0, ++charIndex);
                    lastTime = timestamp;
                }
                if (charIndex < content.length) {
                    requestAnimationFrame(t => typeChar(t, lastTime));
                } else {
                    lineIndex++;
                    setTimeout(typeNextLine, 300);
                }
            };
            requestAnimationFrame(typeChar);
            element.scrollTop = element.scrollHeight;
        };
        typeNextLine();
    },
    
    random() {
        if (!state.workbookData) {
            this.typeLines(['Data not loaded, please try again later'], ELEMENTS.resultsList);
            return;
        }
        if (state.randomCount >= state.maxRandomCount) {
            this.typeLines([`随机策略已达上限 (${state.maxRandomCount}/${state.maxRandomCount})，无法继续使用`], ELEMENTS.resultsList);
            return;
        }
        const buyCandidates = state.workbookData.filter(row => row['策略'] === '买入');
        if (!buyCandidates.length) {
            this.typeLines(['没有符合“买入”策略的股票'], ELEMENTS.resultsList);
            return;
        }
        const item = buyCandidates[Math.floor(Math.random() * buyCandidates.length)];
        state.randomCount++;
        localStorage.setItem('randomCount', state.randomCount);
        const lines = [
            ...Object.entries(item).map(([k, v]) => `<span class="field">${k}:</span> <span class="value">${v}</span>`),
            `<span class="field">随机次数:</span> <span class="value">${state.randomCount}/${state.maxRandomCount}</span>`
        ];
        this.typeLines(lines, ELEMENTS.resultsList);
        state.searchHistory.unshift(`随机: ${item['股票代码']}`);        
        this.updateHistory();    
    },
    
    updateHistory() {
        ELEMENTS.historyList.innerHTML = state.searchHistory.slice(0, DEFAULT_CONFIG.MAX_HISTORY)
            .map(item => `<li>${item}</li>`).join('');
        ELEMENTS.historyList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                if (!state.isAnimating) {
                    ELEMENTS.searchInput.value = li.textContent;
                    PeekXAuth.search();
                }
            });
        });
    }
};

const PeekXAuth = {
    async login(event) {
        event.preventDefault();
        const email = utils.sanitizeInput(document.querySelector('.sign-in-container input[type="email"]').value.trim());
        const password = utils.sanitizeInput(document.querySelector('.sign-in-container input[type="password"]').value.trim());

        // 确保配置初始化
        if (!CONFIG || !supabaseClient) {
            try {
                await initializeConfig();
                if (!supabaseClient) {
                    console.warn('Supabase not initialized, attempting local login');
                }
            } catch (error) {
                console.error('Failed to initialize config during login:', error);
                alert('服务器初始化失败，请稍后再试');
                return;
            }
        }

        // 尝试Supabase认证
        if (supabaseClient) {
            try {
                console.log('Attempting Supabase login for', email);
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;

                const expiryDate = data.user.user_metadata?.expiry_date;
                if (!utils.isMembershipValid(expiryDate)) {
                    alert('你的会员已过期，正在跳转到付款页面...');
                    localStorage.setItem('expiredEmail', email);
                    setTimeout(() => window.location.href = '/assets/payment/index.html', 2000);
                    return;
                }

                localStorage.setItem('token', data.session.access_token);
                this.postLogin();
                alert('登录成功');
                return;
            } catch (error) {
                console.error('Supabase login failed:', error.message, error);
                if (error.message.includes('Email not confirmed')) {
                    ELEMENTS.signInForm.insertAdjacentHTML('beforeend', `
                      <p style="color: red;">请验证您的邮箱！未收到邮件？请检查垃圾邮件或<a href="mailto:support@peekx.com">联系支持</a>。</p>
                    `);
                  }
                alert(`Supabase登录失败: ${error.message}，尝试本地认证`);
            }
        } else {
            console.warn('Supabase client unavailable, falling back to local authentication');
        }

        // 本地JSON回退认证
        console.log('Attempting local JSON login for', email);
        const user = await dataLoader.loadUserData(email);
        if (!user) {
            alert('未找到用户或网络错误，请确认是否已注册或检查网络连接');
            return;
        }
        const hashedPassword = await utils.hashPassword(password);
        if (user.password !== hashedPassword) {
            alert('邮箱或密码错误');
            return;
        }
        if (!utils.isMembershipValid(user.expiry_date)) {
            alert('你的会员已过期，正在跳转到付款页面...');
            localStorage.setItem('expiredEmail', email);
            setTimeout(() => window.location.href = '/assets/payment/index.html', 2000);
            return;
        }
        localStorage.setItem('token', utils.generateToken(email));
        this.postLogin();
        alert('登录成功');
    },
    postLogin() {
    },

    // async register(event) {
    //     event.preventDefault();
    //     if (!this.supabaseClient) {
    //         alert('服务器未加载，注册功能不可用');
    //         return;
    //     }
    //     const name = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="text"]').value.trim());
    //     const email = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="email"]').value.trim());
    //     const password = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="password"]').value.trim());

    //     if (!name || !email || !password) {
    //         alert('请填写所有必填字段');
    //         return;
    //     }

    //     const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    //     try {
    //         const { data, error } = await this.supabaseClient.auth.signUp({
    //             email,
    //             password,
    //             options: { data: { expiry_date: expiryDate, full_name: name } }
    //         });
    //         if (error) throw error;
    //         alert(data.user ? `注册成功！用户 ID: ${data.user.id}, 到期时间: ${expiryDate}` : `注册成功，请验证你的邮箱！到期时间: ${expiryDate}`);
    //         ELEMENTS.container.classList.remove('right-panel-active');
    //     } catch (error) {
    //         alert(`注册失败: ${error.message}`);
    //     }
    // },

    async register(event) {
        event.preventDefault();

        // 确保配置已初始化
        if (!supabaseClient) {
            try {
                await initializeConfig();
                if (!supabaseClient) {
                    alert('无法连接到服务器，请稍后再试');
                    return;
                }
            } catch (error) {
                console.error('注册时初始化配置失败:', error);
                alert('服务器初始化失败，请稍后再试');
                return;
            }
        }

        const name = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="text"]').value.trim());
        const email = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="email"]').value.trim());
        const password = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="password"]').value.trim());

        if (!name || !email || !password) {
            alert('请填写所有必填字段');
            return;
        }

        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        try {
            // Supabase注册
            console.log('Registering user with Supabase:', email);
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { expiry_date: expiryDate, full_name: name } }
            });
            if (error) throw error;

            // 创建本地JSON用户数据
            const hashedPassword = await utils.hashPassword(password);
            const userData = {
                email,
                password: hashedPassword,
                expiry_date: expiryDate,
                full_name: name
            };
            try {
                console.log('Attempting to create local JSON for', email);
                const response = await fetch(`${DEFAULT_CONFIG.USER_DATA_PATH}${email}.json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                if (!response.ok) throw new Error(`Failed to create local JSON: ${response.status} ${response.statusText}`);
                console.log(`Created local user data for ${email}`);
            } catch (fetchError) {
                console.warn('Failed to create local JSON:', fetchError.message);
                // 继续注册流程，不阻塞
                alert('注册成功，但本地用户数据创建失败，可能影响离线登录');
            }

            alert(data.user ? `注册成功！用户 ID: ${data.user.id}, 到期时间: ${expiryDate}` : `注册成功，请验证你的邮箱！到期时间: ${expiryDate}`);
            ELEMENTS.container.classList.remove('right-panel-active');
        } catch (error) {
            console.error('Registration failed:', error.message, error);
            alert(`注册失败: ${error.message}`);
        }
    },


    async search() {
        if (!utils.verifyToken(localStorage.getItem('token'))) {
            ELEMENTS.container.classList.remove('hidden');
            ELEMENTS.searchPage.classList.remove('is-active');
            alert('请先登录');
            return;
        }

        const query = ELEMENTS.searchInput.value.trim();
        if (!query) return;

        const isJSONQuery = query.includes(':') || /^[\u4e00-\u9fa5A-Za-z]+\d+$|^\d+[\u4e00-\u9fa5A-Za-z]+$|^\d+$/.test(query) || (/[，, ]/.test(query) && query.split(/[，, ]+/).length === 2);
        const result = isJSONQuery ? search.json(query) : search.corpus(query);

        if (!result) {
            search.typeLines(['No results found'], ELEMENTS.resultsList);
            return;
        }
        search.typeLines(typeof result === 'string' ? result.split('\n').filter(Boolean) : result, ELEMENTS.resultsList);

        if (!state.searchHistory.includes(query)) {
            state.searchHistory.unshift(query);
            search.updateHistory();
        }
        adjustResultsWidth();
    },

    logout() {
        if (this.supabaseClient) this.supabaseClient.auth.signOut().catch(err => console.error('Supabase logout failed:', err));
        localStorage.clear();
        sessionStorage.clear();
        ELEMENTS.container.classList.remove('hidden');
        ELEMENTS.searchPage.classList.remove('is-active');
        ELEMENTS.searchHistory.classList.remove('visible');
        alert('已成功登出');
    },

    postLogin() {
        sessionStorage.setItem('isLoggedIn', 'true');
        ELEMENTS.container.classList.add('hidden');
        ELEMENTS.searchPage.classList.add('is-active');
        dataLoader.loadJSONData();
        dataLoader.loadCorpus();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ELEMENTS.signUpButton.addEventListener('click', () => ELEMENTS.container.classList.add('right-panel-active'));
    ELEMENTS.signInButton.addEventListener('click', () => ELEMENTS.container.classList.remove('right-panel-active'));
    ELEMENTS.historyButton.addEventListener('click', () => ELEMENTS.searchHistory.classList.toggle('visible'));
    ELEMENTS.logoutButton.addEventListener('click', PeekXAuth.logout.bind(PeekXAuth));
    ELEMENTS.signInForm.addEventListener('submit', PeekXAuth.login.bind(PeekXAuth));
    ELEMENTS.signUpForm.addEventListener('submit', PeekXAuth.register.bind(PeekXAuth));
    ELEMENTS.searchButton.addEventListener('click', PeekXAuth.search.bind(PeekXAuth));
    ELEMENTS.searchInput.addEventListener('keydown', e => e.key === 'Enter' && PeekXAuth.search());
    ELEMENTS.randomButton.addEventListener('click', () => {
        search.random();
    });

    if (sessionStorage.getItem('isLoggedIn') === 'true' && utils.verifyToken(localStorage.getItem('token'))) {
        PeekXAuth.postLogin();
    } else {
        ELEMENTS.container.classList.remove('hidden');
        ELEMENTS.searchPage.classList.remove('is-active');
    }

    adjustResultsWidth();
    window.addEventListener('resize', adjustResultsWidth);
});

function adjustResultsWidth() {
    if (ELEMENTS.searchBar && ELEMENTS.resultsList) {
        ELEMENTS.resultsList.style.width = `${ELEMENTS.searchBar.offsetWidth}px`;
    }
}

window.addEventListener('load', async () => {
    try {
        await initializeConfig();
    } catch (error) {
        console.error('Program startup failed:', error);
    }
});

window.PeekXAuth = PeekXAuth;
window.handleLogout = PeekXAuth.logout;
