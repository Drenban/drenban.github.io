let userData = null;
let workbookData = null;
let corpus = null;
let fuse = null;
const searchCache = new Map();
window.searchHistory = [];

let appState = 'login'; // 应用状态：login, register, search
let isLoggedIn = false;
let contents; // 全局定义 contents
let tabs; // 全局定义 tabs
let cm = null; // 假设 CodeMirror 实例，可能未初始化

// 假设的 triggerPeekxResize 函数（如果未定义则占位）
function triggerPeekxResize() {
    console.log("triggerPeekxResize called (placeholder)");
    // 如果有实际实现，请替换此处
}

// 加载 XLSX 数据
async function loadXLSXData() {
    try {
        const response = await fetch('/assets/data/data.xlsx');
        if (!response.ok) throw new Error('无法加载 XLSX 数据');
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        workbookData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        console.log('XLSX 数据加载完成');
    } catch (error) {
        console.error('加载 XLSX 数据失败:', error);
        const resultContainer = document.getElementById('result-container');
        if (resultContainer) resultContainer.textContent = '服务器繁忙，请稍后再试';
    }
}

// Base64 解码函数
function decodeBase64UTF8(base64Str) {
    try {
        const binaryStr = atob(base64Str);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
        throw new Error('Base64 解码失败: ' + error.message);
    }
}

// 加载语料库
async function loadCorpus() {
    try {
        const response = await fetch('data/obfuscated_corpus.json');
        if (!response.ok) throw new Error(`无法加载语料库: ${response.status}`);
        const obfuscatedData = await response.text();
        const decodedData = decodeBase64UTF8(obfuscatedData);
        corpus = JSON.parse(decodedData);

        fuse = new Fuse(corpus, {
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
        console.log('语料库加载完成');
    } catch (error) {
        console.error('加载语料库失败:', error);
    }
}

// 搜索 XLSX 数据
function searchXLSX(query) {
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) resultContainer.innerHTML = '';

    if (!workbookData) {
        if (resultContainer) resultContainer.textContent = '服务器繁忙，请稍后再试';
        return false;
    }

    const conditions = {};
    let isSimpleQuery = false;
    let name, age;

    query = query.trim().toLowerCase();
    if (query.includes(':')) {
        query.split(',').forEach(part => {
            const [key, value] = part.split(':').map(s => s.trim());
            if (key && value !== undefined) conditions[key] = value;
        });
        name = conditions['celv'] || conditions['策略'];
        age = conditions['shoupanjia'] || conditions['收盘价'];
        if (name && age && Object.keys(conditions).length === 2) isSimpleQuery = true;
    } else if (/[，, ]/.test(query)) {
        const parts = query.split(/[，, ]+/).map(s => s.trim());
        if (parts.length === 2) {
            isSimpleQuery = true;
            if (/^\d+$/.test(parts[0])) {
                age = parts[0];
                name = parts[1];
            } else {
                name = parts[0];
                age = parts[1];
            }
            conditions['策略'] = name;
            conditions['收盘价'] = age;
        }
    } else if (/^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query) || /^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
        isSimpleQuery = true;
        if (/^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query)) {
            name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
            age = query.match(/\d+/)[0];
        } else {
            age = query.match(/\d+/)[0];
            name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
        }
        conditions['策略'] = name;
        conditions['收盘价'] = age;
    } else if (/^\d+$/.test(query)) {
        conditions['股票代码'] = query;
    } else {
        conditions[''] = query;
    }

    const matches = workbookData.filter(row => {
        if (conditions['']) {
            return Object.values(row).some(val => 
                String(val).toLowerCase().includes(conditions[''])
            );
        }
        return Object.entries(conditions).every(([key, value]) => {
            const rowValue = String(row[key] || '').toLowerCase();
            if (!value) return true;
            if (value.includes('-')) {
                const [min, max] = value.split('-').map(Number);
                const numValue = Math.floor(Number(rowValue));
                return numValue >= min && numValue <= max;
            } else if (value.startsWith('>')) {
                return Math.floor(Number(rowValue)) > Number(value.slice(1));
            } else if (value.startsWith('<')) {
                return Math.floor(Number(rowValue)) < Number(value.slice(1));
            }
            if (key.toLowerCase() === '收盘价') {
                return Math.floor(Number(rowValue)) === Math.floor(Number(value));
            }
            return rowValue === value;
        });
    });

    if (matches.length === 0) {
        return false;
    }

    let lines;
    if (isSimpleQuery) {
        const cities = matches.map(row => row['股票代码']).filter(city => city !== undefined);
        lines = [
            `<span class="field">全部代码:</span><br><span class="value">${cities.join(', ')}</span>`,
            `<span class="field">合计:</span> <span class="value">${cities.length}</span>`
        ];
    } else {
        lines = matches.flatMap((result, index) => {
            const resultLines = Object.entries(result).map(([key, value]) => 
                `<span class="field">${key}:</span> <span class="value">${value}</span>`
            );
            return index < matches.length - 1 ? [...resultLines, '<hr>'] : resultLines;
        });
    }
    return lines;
}

// 搜索语料库
function searchCorpus(query) {
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) resultContainer.innerHTML = '';

    if (!corpus || !fuse) {
        return '语料库未加载，请稍后再试';
    }

    const input = query.trim().toLowerCase();

    if (searchCache.has(input)) {
        return searchCache.get(input);
    }

    const results = fuse.search(input);
    const bestMatch = results.length > 0 && results[0].score < 0.6 ? results[0] : null;
    const intent = detectIntent(input);
    const answer = generateResponse(intent, bestMatch);

    searchCache.set(input, answer);
    return answer;
}

// 检测意图
function detectIntent(input) {
    const lowerInput = input.toLowerCase().replace(/\s+/g, ' ').trim();
    const intents = [
        { name: 'time', patterns: ['时间', '什么时候', '几点', '多久', '啥时候', '何时'], fallback: '您想知道什么的时间？可以告诉我更多细节吗？' },
        { name: 'price', patterns: ['价格', '多少钱', '费用', '成本', '价位', '花多少'], fallback: '您想了解哪方面的价格？可以具体一点吗？' },
        { name: 'howto', patterns: ['如何', '怎么', '怎样', '步骤', '方法', '怎么办'], fallback: '您想知道如何做什么？请告诉我具体操作！' },
        { name: 'psychology', patterns: ['心理', '心态', '情绪', '行为'], fallback: '您想了解交易中的什么心理因素？请具体点！' }
    ];

    for (const intent of intents) {
        if (intent.patterns.some(pattern => lowerInput.includes(pattern))) {
            return intent;
        }
    }
    return null;
}

// 生成响应
function generateResponse(intent, match) {
    if (match) {
        const score = (1 - match.score).toFixed(2);
        if (score < 0.5) return '抱歉，找不到准确答案，您可以换个说法试试！';
        return `${match.item.answer.trim()}`;
    }
    if (intent) {
        switch (intent.name) {
            case 'time': return '我可以帮您查时间相关的信息，您具体想知道什么时间？';
            case 'price': return '价格信息可能因产品不同而异，您想了解哪个产品的价格？';
            case 'howto': return '我可以指导您完成操作，请告诉我您想做什么！';
            default: return intent.fallback || '抱歉，我不太明白您的意思，可以换个说法试试吗？';
        }
    }
    return '抱歉，我不太明白您的意思，可以换个说法试试吗？';
}

// 显示结果的打字效果
function typeLines(lines, element) {
    if (!element) {
        console.error('Result container element is null');
        return;
    }
    let lineIndex = 0;
    let charIndex = 0;

    function typeNext() {
        if (lineIndex < lines.length) {
            const lineDivs = element.querySelectorAll('.line');
            let currentLine = lineDivs[lineIndex];
            if (!currentLine) {
                currentLine = document.createElement('div');
                currentLine.className = 'line';
                element.appendChild(currentLine);
            }
            const lineContent = lines[lineIndex] || '';
            if (charIndex < lineContent.length) {
                currentLine.innerHTML = lineContent.slice(0, charIndex + 1);
                charIndex++;
                setTimeout(typeNext, 20);
                element.scrollTop = element.scrollHeight;
            } else {
                charIndex = 0;
                lineIndex++;
                setTimeout(typeNext, 300);
            }
        }
    }
    typeNext();
}

// 更新搜索历史
function updateHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    historyList.innerHTML = '';
    window.searchHistory.slice(0, 10).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.addEventListener('click', () => {
            document.getElementById('query-input').value = item;
            PeekXAuth.search();
        });
        historyList.appendChild(li);
    });
}

// 密码哈希
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 生成 token
function generateToken(username) {
    const salt = crypto.randomUUID();
    const payload = { username, exp: Date.now() + 3600000, salt }; // 1小时有效期
    localStorage.setItem('salt', salt);
    return btoa(JSON.stringify(payload));
}

// 检查会员有效期
function isMembershipValid(expiryDate) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return expiry.getTime() > currentDate.getTime() && !isNaN(expiry.getTime());
}

// 输入清理
function sanitizeInput(input) {
    return input.replace(/[<>&;"]/g, '');
}

// 验证 token
function verifyToken(token) {
    if (!token) {
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
        console.warn('Token 不存在，已清除');
        return false;
    }
    try {
        let payload;
        if (token.includes('.')) {
            const [, payloadBase64] = token.split('.');
            payload = JSON.parse(atob(payloadBase64));
            payload.exp = payload.exp * 1000;
        } else {
            payload = JSON.parse(atob(token));
        }

        if (!payload.exp || payload.exp < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('salt');
            console.info('Token 已过期或无效，已清除');
            return false;
        }

        if (!token.includes('.')) {
            const storedSalt = localStorage.getItem('salt');
            if (!payload.salt || payload.salt !== storedSalt) {
                localStorage.removeItem('token');
                localStorage.removeItem('salt');
                console.warn('Token 校验失败（盐值不匹配），已清除');
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Token 验证失败:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
        return false;
    }
}

// 加载用户数据
async function loadUserData(username) {
    try {
        const response = await fetch(`/assets/users/${username}.json`);
        if (response.status === 404) {
            console.warn(`用户 ${username} 不存在`);
            return false;
        }
        if (!response.ok) throw new Error(`Failed to fetch /assets/users/${username}.json`);
        const data = await response.json();
        console.log('用户数据加载成功:', data);
        return data;
    } catch (error) {
        console.error('加载用户数据失败:', error);
        return false;
    }
}

// Supabase 配置
const supabaseUrl = 'https://xupnsfldgnmeicumtqpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cG5zZmxkZ25tZWljdW10cXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1Mjc1OTUsImV4cCI6MjA1NzEwMzU5NX0.hOHdx2iFHqA6LX2T-8xP4fWuYxK3HxZtTV2zjBHD3ro';

function getSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase 未加载');
        return null;
    }
    return supabase.createClient(supabaseUrl, supabaseKey);
}

// 更新 UI 显示（与 switchContent 兼容）
function updateUI() {
    if (!contents) {
        console.error("contents 未定义，无法更新 UI");
        return;
    }
    const historyToggle = document.getElementById('history-toggle');
    const logoutBtn = document.getElementById('logout-btn');

    contents.login.style.display = appState === 'login' ? 'block' : 'none';
    contents.register.style.display = appState === 'register' ? 'block' : 'none';
    contents.search.style.display = appState === 'search' ? 'block' : 'none';
    if (historyToggle) historyToggle.style.display = appState === 'search' ? 'inline-block' : 'none';
    if (logoutBtn) logoutBtn.style.display = appState === 'search' ? 'inline-block' : 'none';
}

// 切换内容区域
const switchContent = (tab) => {
    if (!contents) {
        console.error("contents 未定义，无法切换内容");
        return;
    }

    Object.keys(contents).forEach(key => {
        const content = contents[key];
        if (content) {
            content.style.display = key === tab && (isLoggedIn || tab !== "search") ? "block" : "none";
            content.style.opacity = "1";
        }
    });

    if (!isLoggedIn && tab === "search") {
        contents.login.style.display = "block";
        if (tabs && tabs[1]) {
            tabs[1].classList.add("is-active");
            Array.from(tabs).forEach(t => {
                if (t.getAttribute("data-tab") === "search") t.classList.remove("is-active");
            });
        }
        console.log("未登录，强制显示登录界面");
    } else if (contents[tab]) {
        console.log("Switching to tab:", tab, "Content visible:", contents[tab]);
    } else {
        console.warn("Content for tab", tab, "not found");
    }

    triggerPeekxResize();
    if (cm) cm.setOption("readOnly", !isLoggedIn); // 更新 CodeMirror 只读状态
};

const PeekXAuth = {
    async login() {
        const loginBtn = document.getElementById('login-btn');
        const errorMessage = document.getElementById('error-message');
        if (loginBtn) loginBtn.disabled = true;
        if (errorMessage) errorMessage.textContent = '';

        const username = sanitizeInput(document.getElementById('login-username')?.value.trim() || '');
        const password = sanitizeInput(document.getElementById('login-password')?.value.trim() || '');

        const supabaseClient = getSupabaseClient();
        let supabaseFailed = false;
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: username,
                    password: password
                });

                if (!error) {
                    const expiryDate = data.user.user_metadata?.expiry_date;
                    if (!expiryDate || !isMembershipValid(expiryDate)) {
                        if (errorMessage) errorMessage.textContent = '您的会员已过期或未设置有效期，请续费';
                        localStorage.setItem('expiredEmail', username);
                        setTimeout(() => window.location.href = '/peekx/payment/index.html', 2000);
                        if (loginBtn) loginBtn.disabled = false;
                        return false;
                    }
                    if (errorMessage) {
                        errorMessage.style.color = 'green';
                        errorMessage.textContent = '登录成功（Supabase）！欢迎回来';
                    }
                    localStorage.setItem('session', JSON.stringify(data.session));
                    localStorage.setItem('token', data.session.access_token);
                    appState = 'search';
                    isLoggedIn = true;
                    updateUI();
                    loadXLSXData();
                    loadCorpus();
                    if (loginBtn) loginBtn.disabled = false;
                    return true;
                } else {
                    console.warn('Supabase 登录失败:', error.message);
                    supabaseFailed = true;
                }
            } catch (err) {
                console.error('Supabase 登录错误:', err);
                supabaseFailed = true;
            }
        }

        const userData = await loadUserData(username);
        if (!userData) {
            if (errorMessage) errorMessage.textContent = '用户不存在或网络错误';
            if (loginBtn) loginBtn.disabled = false;
            return false;
        }

        const hashedPassword = await hashPassword(password);
        if (userData.username === username && userData.password === hashedPassword) {
            const expiryDate = userData.expiry_date;
            if (!expiryDate || !isMembershipValid(expiryDate)) {
                if (errorMessage) errorMessage.textContent = '您的会员已过期或未设置有效期，请续费';
                localStorage.setItem('expiredEmail', username);
                setTimeout(() => window.location.href = '/peekx/payment/index.html', 2000);
                if (loginBtn) loginBtn.disabled = false;
                return false;
            }
            const token = generateToken(username);
            localStorage.setItem('token', token);
            if (errorMessage) {
                errorMessage.style.color = 'green';
                errorMessage.textContent = '登录成功（JSON）！欢迎回来';
            }
            appState = 'search';
            isLoggedIn = true;
            updateUI();
            loadXLSXData();
            loadCorpus();
            if (loginBtn) loginBtn.disabled = false;
            return true;
        } else {
            if (errorMessage) errorMessage.textContent = supabaseFailed ? '用户名或密码错误' : 'Supabase 登录失败，请检查凭据';
            if (loginBtn) loginBtn.disabled = false;
            return false;
        }
    },

    async register() {
        const signupBtn = document.getElementById('signup-btn');
        const errorMessage = document.getElementById('register-error-message');
        if (signupBtn) signupBtn.disabled = true;
        if (errorMessage) errorMessage.textContent = '';

        const email = sanitizeInput(document.getElementById('register-username')?.value.trim() || '');
        const password = sanitizeInput(document.getElementById('register-password')?.value.trim() || '');
        const confirmPassword = sanitizeInput(document.getElementById('register-confirm-password')?.value.trim() || '');

        if (password !== confirmPassword) {
            if (errorMessage) errorMessage.textContent = '密码和确认密码不匹配';
            if (signupBtn) signupBtn.disabled = false;
            return false;
        }

        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) {
            if (errorMessage) errorMessage.textContent = 'Supabase 未加载，无法注册';
            if (signupBtn) signupBtn.disabled = false;
            return false;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        const expiryDateString = expiryDate.toISOString().split('T')[0];

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { expiry_date: expiryDateString } }
            });
            if (error) {
                if (errorMessage) {
                    errorMessage.style.color = 'red';
                    errorMessage.textContent = '注册失败: ' + error.message;
                }
                if (signupBtn) signupBtn.disabled = false;
                return false;
            } else {
                if (errorMessage) {
                    errorMessage.style.color = 'green';
                    errorMessage.textContent = data.user
                        ? `注册成功！用户 ID: ${data.user.id}，7 天有效期已设置: ${expiryDateString}`
                        : `注册成功，请检查邮箱验证！7 天有效期已设置: ${expiryDateString}`;
                }
                appState = 'login';
                updateUI();
                if (signupBtn) signupBtn.disabled = false;
                return true;
            }
        } catch (err) {
            if (errorMessage) {
                errorMessage.style.color = 'red';
                errorMessage.textContent = '注册错误: ' + err.message;
            }
            if (signupBtn) signupBtn.disabled = false;
            return false;
        }
    },

    async search() {
        const token = localStorage.getItem('token');
        if (!verifyToken(token)) {
            appState = 'login';
            updateUI();
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) errorMessage.textContent = '请先登录';
            return;
        }

        const searchSection = document.getElementById('search-section');
        if (!searchSection) {
            console.error('Search section not found');
            return;
        }
        if (searchSection.style.display === 'none') {
            appState = 'search';
            updateUI();
        }

        const queryInput = document.getElementById('query-input');
        const resultContainer = document.getElementById('result-container');
        if (!queryInput || !resultContainer) {
            console.error('Query input or result container not found');
            return;
        }

        const query = queryInput.value.trim();
        if (!query) return;

        resultContainer.innerHTML = '';

        const isXlsxQuery = query.includes(':') ||
            (/[，, ]/.test(query) && query.split(/[，, ]+/).length === 2 &&
                (/\d/.test(query.split(/[，, ]+/)[0]) || /\d/.test(query.split(/[，, ]+/)[1]))) ||
            /^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query) ||
            /^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query) ||
            /^\d+$/.test(query);

        if (isXlsxQuery) {
            const xlsxResult = searchXLSX(query);
            if (xlsxResult) {
                typeLines(xlsxResult, resultContainer);
                setTimeout(() => {
                    if (window.innerWidth > 768) {
                        resultContainer.scrollTop = resultContainer.scrollHeight;
                    }
                }, xlsxResult.length * 320);
                if (!window.searchHistory.includes(query)) {
                    window.searchHistory.unshift(query);
                    if (window.searchHistory.length > 10) window.searchHistory.pop();
                    updateHistory();
                }
                return;
            }
        }

        const corpusResult = searchCorpus(query);
        if (typeof corpusResult !== 'string') {
            console.error('searchCorpus 返回的结果不是字符串:', corpusResult);
            typeLines(['抱歉，查询出错，请稍后再试'], resultContainer);
            return;
        }
        const lines = corpusResult.split('\n').filter(line => line.trim());
        typeLines(lines, resultContainer);
        setTimeout(() => {
            if (window.innerWidth > 768) {
                resultContainer.scrollTop = resultContainer.scrollHeight;
            }
        }, lines.length * 320);
        if (!window.searchHistory.includes(query)) {
            window.searchHistory.unshift(query);
            if (window.searchHistory.length > 10) window.searchHistory.pop();
            updateHistory();
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
        localStorage.removeItem('session');
        appState = 'login';
        isLoggedIn = false;
        switchContent('login');
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) errorMessage.textContent = '已退出登录';
    }
};

window.PeekXAuth = PeekXAuth;

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    const token = localStorage.getItem('token');

    const peekxContainer = document.querySelector('.layout');
    contents = {
        login: peekxContainer.querySelector('#login-section'),
        register: peekxContainer.querySelector('#register-section'),
        search: peekxContainer.querySelector('#search-section')
    };
    tabs = peekxContainer.querySelectorAll('.auth-section, .search-section'); // 定义 tabs

    if (token && verifyToken(token)) {
        appState = 'search';
        isLoggedIn = true;
        loadXLSXData();
        loadCorpus();
    } else {
        appState = 'login';
    }
    updateUI();

    // 登录表单提交
    const loginForm = contents.login.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const success = await PeekXAuth.login();
            if (success) {
                isLoggedIn = true;
                switchContent('search');
            }
        });
    }

    // 注册表单提交
    const registerForm = contents.register.querySelector('#register-form');
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = registerForm.querySelector("#register-password").value;
            const confirmPassword = registerForm.querySelector("#register-confirm-password").value;
            if (password !== confirmPassword) {
                const errorMessage = contents.register.querySelector('#register-error-message');
                if (errorMessage) errorMessage.textContent = "密码不匹配";
                return;
            }
            const success = await PeekXAuth.register();
            if (success) {
                switchContent('login');
            }
        });
    }

    // 搜索功能
    const searchInput = contents.search.querySelector("#query-input");
    const searchBtn = contents.search.querySelector("#search-btn");
    if (searchInput && searchBtn) {
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") PeekXAuth.search();
        });
        searchBtn.addEventListener("click", () => PeekXAuth.search());
    }

    // 选项卡切换
    const tabLinks = peekxContainer.querySelectorAll(".peekx__form-link a");
    tabLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute("data-tab");
            tabs.forEach(t => t.classList.remove("is-active"));
            tabs.forEach(t => {
                if (t.id === `${targetTab}-section`) t.classList.add("is-active");
            });
            switchContent(targetTab);
        });
    });

    // 历史切换
    const historyToggle = document.getElementById('history-toggle');
    if (historyToggle) {
        historyToggle.addEventListener('click', () => {
            document.getElementById('history-sidebar').classList.toggle('active');
        });
    }

    // 历史点击
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                document.getElementById('query-input').value = e.target.textContent;
                PeekXAuth.search();
                document.getElementById('history-sidebar').classList.remove('active');
            }
        });
    }

    // 退出
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', PeekXAuth.logout);
    }

    if (!contents.login || !contents.register || !contents.search) {
        console.warn("Content sections missing:", {
            login: !!contents.login,
            register: !!contents.register,
            search: !!contents.search
        });
    }

    updateHistory();
});
