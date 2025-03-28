let userData = null;
let workbookData = null;
let corpus = null;
let fuse = null;
const searchCache = new Map(); // 搜索结果缓存
window.searchHistory = []; // 全局搜索历史

// XLSX 数据加载
async function loadXLSXData() {
    try {
        const response = await fetch('/assets/data/data.json');
        if (!response.ok) throw new Error('无法加载 XLSX 数据');
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        workbookData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        console.log('XLSX 数据加载完成');
    } catch (error) {
        console.error('加载 XLSX 数据失败:', error);
        document.getElementById('result-container').textContent = '服务器繁忙，请稍后再试';
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
        const response = await fetch('/assets/data/obfuscated_corpus.json');
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
    resultContainer.innerHTML = '';

    if (!workbookData) {
        resultContainer.textContent = '服务器繁忙，请稍后再试';
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
    resultContainer.innerHTML = '';

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
        // ... 其他意图保持不变
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
            // ... 其他 case 保持不变
            default: return intent.fallback || '抱歉，我不太明白您的意思，可以换个说法试试吗？';
        }
    }
    return '抱歉，我不太明白您的意思，可以换个说法试试吗？';
}

// 打字效果显示结果
function typeLines(lines, element) {
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

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(username) {
    const salt = crypto.randomUUID();
    const payload = { username, exp: Date.now() + 3600000, salt };
    localStorage.setItem('salt', salt);
    return btoa(JSON.stringify(payload));
}

function isMembershipValid(expiryDate) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return expiry.getTime() > currentDate.getTime() && !isNaN(expiry.getTime());
}

function sanitizeInput(input) {
    return input.replace(/[<>&;"]/g, '');
}

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

const supabaseUrl = 'https://xupnsfldgnmeicumtqpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cG5zZmxkZ25tZWljdW10cXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1Mjc1OTUsImV4cCI6MjA1NzEwMzU5NX0.hOHdx2iFHqA6LX2T-8xP4fWuYxK3HxZtTV2zjBHD3ro';

function getSupabaseClient() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase 未加载');
        return null;
    }
    return supabase.createClient(supabaseUrl, supabaseKey);
}

const PeekXAuth = {
    async login() {
        const loginBtn = document.getElementById('login-btn');
        const errorMessage = document.getElementById('error-message');
        loginBtn.disabled = true;
        errorMessage.textContent = '';

        const username = sanitizeInput(document.getElementById('login-username').value.trim());
        const password = sanitizeInput(document.getElementById('login-password').value.trim());

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
                        errorMessage.textContent = '您的会员已过期或未设置有效期，请续费';
                        localStorage.setItem('expiredEmail', username);
                        setTimeout(() => window.location.href = '/assets/pay/index.html', 2000);
                        loginBtn.disabled = false;
                        return false;
                    }
                    errorMessage.style.color = 'green';
                    errorMessage.textContent = '登录成功（Supabase）！欢迎回来';
                    localStorage.setItem('session', JSON.stringify(data.session));
                    localStorage.setItem('token', data.session.access_token);
                    loginBtn.disabled = false;
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
            errorMessage.textContent = '用户不存在或网络错误';
            loginBtn.disabled = false;
            return false;
        }

        const hashedPassword = await hashPassword(password);
        if (userData.username === username && userData.password === hashedPassword) {
            const expiryDate = userData.expiry_date;
            if (!expiryDate || !isMembershipValid(expiryDate)) {
                errorMessage.textContent = '您的会员已过期或未设置有效期，请续费';
                localStorage.setItem('expiredEmail', username);
                setTimeout(() => window.location.href = '/assets/pay/index.html', 2000);
                loginBtn.disabled = false;
                return false;
            }
            const token = generateToken(username);
            localStorage.setItem('token', token);
            errorMessage.style.color = 'green';
            errorMessage.textContent = '登录成功（JSON）！欢迎回来';
            loginBtn.disabled = false;
            return true;
        } else {
            errorMessage.textContent = supabaseFailed ? '用户名或密码错误' : 'Supabase 登录失败，请检查凭据';
            loginBtn.disabled = false;
            return false;
        }
    },

    async register() {
        const signupBtn = document.getElementById('signup-btn');
        const errorMessage = document.getElementById('register-error-message');
        signupBtn.disabled = true;
        errorMessage.textContent = '';

        const email = sanitizeInput(document.getElementById('register-username').value.trim());
        const password = sanitizeInput(document.getElementById('register-password').value.trim());
        const confirmPassword = sanitizeInput(document.getElementById('register-confirm-password').value.trim());

        if (password !== confirmPassword) {
            errorMessage.textContent = '密码和确认密码不匹配';
            signupBtn.disabled = false;
            return false;
        }

        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) {
            errorMessage.textContent = 'Supabase 未加载，无法注册';
            signupBtn.disabled = false;
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
                errorMessage.style.color = 'red';
                errorMessage.textContent = '注册失败: ' + error.message;
                signupBtn.disabled = false;
                return false;
            } else {
                errorMessage.style.color = 'green';
                errorMessage.textContent = data.user
                    ? `注册成功！用户 ID: ${data.user.id}，7 天有效期已设置: ${expiryDateString}`
                    : `注册成功，请检查邮箱验证！7 天有效期已设置: ${expiryDateString}`;
                return true;
            }
        } catch (err) {
            errorMessage.style.color = 'red';
            errorMessage.textContent = '注册错误: ' + err.message;
            signupBtn.disabled = false;
            return false;
        }
    },

    async search() {
        const query = document.getElementById('query-input').value.trim();
        if (!query) return;

        const isXlsxQuery = query.includes(':') ||
            (/[，, ]/.test(query) && query.split(/[，, ]+/).length === 2 &&
                (/\d/.test(query.split(/[，, ]+/)[0]) || /\d/.test(query.split(/[，, ]+/)[1]))) ||
            /^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query) ||
            /^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query) ||
            /^\d+$/.test(query);

        const resultContainer = document.getElementById('result-container');
        resultContainer.innerHTML = '';

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
        window.location.href = '/';
    }
};

window.PeekXAuth = PeekXAuth;

document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname;
    const token = localStorage.getItem('token');

    const isIndexPage = pathname === '/' || pathname.endsWith('/')
    const isLoginPage = pathname.includes('');

    if (isIndexPage && !isLoginPage) {
        if (!token || !verifyToken(token)) {
            window.location.href = '/';
        } else {
            const loginSection = document.getElementById('login-section');
            const querySection = document.getElementById('query-section');
            if (loginSection && querySection) {
                loginSection.style.display = 'none';
                querySection.style.display = 'block';
            }
            loadXLSXData(); // 加载 XLSX 数据
            loadCorpus();   // 加载语料库
        }
    }

    const loginBtn = document.getElementById('login-btn');
    if (isLoginPage && loginBtn) {
        loginBtn.addEventListener('click', PeekXAuth.login);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (isIndexPage && logoutBtn) {
        logoutBtn.addEventListener('click', PeekXAuth.logout);
    }

    if (isIndexPage) {
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', PeekXAuth.search);
        }

        const historyToggle = document.getElementById('history-toggle');
        if (historyToggle) {
            historyToggle.addEventListener('click', () => {
                document.getElementById('history-sidebar').classList.toggle('active');
            });
        }

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

        updateHistory();
    }

    if (typeof supabase === 'undefined') {
        console.error('Supabase 未定义，请检查 CDN 加载');
        const errorMessage = document.getElementById('error-message');
        const registerErrorMessage = document.getElementById('register-error-message');
        if (errorMessage) errorMessage.textContent = 'Supabase 未加载，请刷新页面或检查网络';
        if (registerErrorMessage) registerErrorMessage.textContent = 'Supabase 未加载，请刷新页面或检查网络';
    }
});
