const CONFIG = {
    SUPABASE_URL: 'https://xupnsfldgnmeicumtqpp.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cG5zZmxkZ25tZWljdW10cXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1Mjc1OTUsImV4cCI6MjA1NzEwMzU5NX0.hOHdx2iFHqA6LX2T-8xP4fWuYxK3HxZtTV2zjBHD3ro',
    JSON_DATA_PATH: '/noise/assets/data/data.json',
    CORPUS_PATH: '/noise/assets/data/corpus.json',
    USER_DATA_PATH: '/noise/assets/obfuscate/',
    TOKEN_EXPIRY_MS: 3600000,
    MAX_HISTORY: 10,
    CACHE_LIMIT: 100
};

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
        const payload = { username, exp: Date.now() + CONFIG.TOKEN_EXPIRY_MS, salt };
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
            const response = await fetch(CONFIG.JSON_DATA_PATH);
            if (!response.ok) throw new Error('Failed to load JSON data');
            state.workbookData = JSON.parse(utils.decodeBase64UTF8(await response.text()));
            console.log('JSON data loaded');
        } catch (error) {
            console.error('Load JSON failed:', error);
            ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
        }
    },

    async loadCorpus() {
        try {
            const response = await fetch(CONFIG.CORPUS_PATH);
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
            console.log('Corpus loaded');
        } catch (error) {
            console.error('Load corpus failed:', error);
        }
    },

    async loadUserData(username) {
        try {
            const response = await fetch(`${CONFIG.USER_DATA_PATH}${username}.json`);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`Failed to fetch user data for ${username}`);
            state.userData = JSON.parse(utils.decodeBase64UTF8(await response.text()));
            return state.userData;
        } catch (error) {
            console.error('Load user data failed:', error);
            return null;
        }
    }
};

const search = {
    json(query) {
        if (!state.workbookData) {
            ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
            return null;
        }
    
        const conditions = {};
        let isSimpleQuery = false;
        let name, age;
        query = query.trim().toLowerCase();
    
        if (query.includes(':')) {
            query.split(',').forEach(part => {
                const [key, value] = part.split(':').map(s => s.trim());
                if (key && value !== undefined) {
                    conditions[key] = value;
                }
            });
            name = conditions['celv'] || conditions['策略'];
            age = conditions['shoupanjia'] || conditions['收盘价'];
            if (name && age && Object.keys(conditions).length === 2) {
                isSimpleQuery = true;
            }
        }
        else if (/[，, ]/.test(query)) {
            const parts = query.split(/[，, ]+/).map(s => s.trim());
            if (parts.length === 2) {
                isSimpleQuery = true;
                [age, name] = /^\d+$/.test(parts[0]) ? [parts[0], parts[1]] : [parts[1], parts[0]];
                conditions['策略'] = name;
                conditions['收盘价'] = age;
            }
        }
        else if (/^[\u4e00-\u9fa5a-zA-Z]+\d+$/.test(query) || /^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
            isSimpleQuery = true;
            if (/^\d+[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
                age = query.match(/\d+/)[0];
                name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
            } else {
                name = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
                age = query.match(/\d+/)[0];
            }
            conditions['策略'] = name;
            conditions['收盘价'] = age;
        }
        else if (/^\d+$/.test(query)) {
            conditions['股票代码'] = query;
        }
        else {
            conditions[''] = query;
        }
    
        const matches = state.workbookData.filter(row => {
            if (conditions['']) {
                const result = Object.values(row).some(val => String(val).toLowerCase().includes(conditions['']));
                return result;
            }
            const result = Object.entries(conditions).every(([key, value]) => {
                const rowValue = String(row[key] || '').toLowerCase();
                if (!value) return true;
                if (value.includes('-')) {
                    const [min, max] = value.split('-').map(Number);
                    const numValue = Math.floor(Number(rowValue));
                    return numValue >= min && numValue <= max;
                }
                if (value.startsWith('>')) {
                    const compare = Math.floor(Number(rowValue)) > Number(value.slice(1));
                    return compare;
                }
                if (value.startsWith('<')) {
                    const compare = Math.floor(Number(rowValue)) < Number(value.slice(1));
                    return compare;
                }
                if (key.toLowerCase() === '收盘价') {
                    const compare = Math.floor(Number(rowValue)) === Math.floor(Number(value));
                    return compare;
                }
                const compare = rowValue === value;
                return compare;
            });
            return result;
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

        if (state.searchCache.size >= CONFIG.CACHE_LIMIT) state.searchCache.clear();
        state.searchCache.set(query, answer);
        return answer;
    },

    detectIntent(input) {
        const intents = [
            { name: 'time', patterns: ['时间', '什么时候', '几点', '多久', '啥时候', '何时'], fallback: '您想知道什么的时间？可以告诉我更多细节吗？' },
            { name: 'price', patterns: ['价格', '多少钱', '费用', '成本', '价位', '花多少'], fallback: '您想了解哪方面的价格？可以具体一点吗？' },
            { name: 'howto', patterns: ['如何', '怎么', '怎样', '步骤', '方法', '怎么办'], fallback: '您想知道如何做什么？请告诉我具体操作！' },
            { name: 'psychology', patterns: ['心理', '心态', '情绪', '行为'], fallback: '您想了解交易中的什么心理因素？请具体点！' }
        ];
        return intents.find(intent => intent.patterns.some(pattern => input.includes(pattern))) || null;
    },

    generateResponse(intent, match) {
        if (match) return (1 - match.score).toFixed(2) < 0.5 ? '抱歉，找不到准确答案，您可以换个说法试试！' : match.item.answer.trim();
        if (intent) {
            return {
                time: '我可以帮您查时间相关的信息，您具体想知道什么时间？',
                price: '价格信息可能因产品不同而异，您想了解哪个产品的价格？',
                howto: '我可以指导您完成操作，请告诉我您想做什么！'
            }[intent.name] || intent.fallback || '抱歉，我不太明白您的意思，可以换个说法试试吗？';
        }
        return '抱歉，我不太明白您的意思，可以换个说法试试吗？';
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
        console.log('this:', this);
        console.log('search:', search);
        console.log('Random called, count before:', state.randomCount);
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
        console.log('Count after:', state.randomCount);
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
        ELEMENTS.historyList.innerHTML = state.searchHistory.slice(0, CONFIG.MAX_HISTORY)
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
    supabaseClient: typeof supabase !== 'undefined' ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY) : null,

    async login(event) {
        event.preventDefault();
        const email = utils.sanitizeInput(document.querySelector('.sign-in-container input[type="email"]').value.trim());
        const password = utils.sanitizeInput(document.querySelector('.sign-in-container input[type="password"]').value.trim());

        if (this.supabaseClient) {
            try {
                const { data, error } = await this.supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
                const expiryDate = data.user.user_metadata?.expiry_date;
                if (!utils.isMembershipValid(expiryDate)) {
                    alert('Your membership has expired. Redirecting to payment...');
                    localStorage.setItem('expiredEmail', email);
                    setTimeout(() => window.location.href = '/peekx/payment/index.html', 2000);
                    return;
                }
                localStorage.setItem('token', data.session.access_token);
                this.postLogin();
                alert('Login successful (Supabase)');
                return;
            } catch (error) {
                console.warn('Supabase login failed:', error.message);
            }
        }

        const user = await dataLoader.loadUserData(email);
        if (!user) {
            alert('User not found or network error');
            return;
        }
        if (user.password !== await utils.hashPassword(password)) {
            alert('Incorrect email or password');
            return;
        }
        if (!utils.isMembershipValid(user.expiry_date)) {
            alert('Your membership has expired. Redirecting to payment...');
            localStorage.setItem('expiredEmail', email);
            setTimeout(() => window.location.href = '/peekx/payment/index.html', 2000);
            return;
        }
        localStorage.setItem('token', utils.generateToken(email));
        this.postLogin();
        alert('Login successful (JSON)');
    },

    async register(event) {
        event.preventDefault();
        if (!this.supabaseClient) {
            alert('Supabase not loaded, registration unavailable');
            return;
        }
        const name = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="text"]').value.trim());
        const email = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="email"]').value.trim());
        const password = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="password"]').value.trim());

        if (!name || !email || !password) {
            alert('Please fill all required fields');
            return;
        }

        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        try {
            const { data, error } = await this.supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { expiry_date: expiryDate, full_name: name } }
            });
            if (error) throw error;
            alert(data.user ? `Registered successfully! User ID: ${data.user.id}, expires: ${expiryDate}` : `Registration successful, please verify your email! Expires: ${expiryDate}`);
            ELEMENTS.container.classList.remove('right-panel-active');
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        }
    },

    async search() {
        if (!utils.verifyToken(localStorage.getItem('token'))) {
            ELEMENTS.container.classList.remove('hidden');
            ELEMENTS.searchPage.classList.remove('is-active');
            alert('Please log in first');
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
        alert('Logged out successfully');
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
    console.log('Binding random button');
    ELEMENTS.randomButton.addEventListener('click', () => {
        console.log('Random button clicked');
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

window.PeekXAuth = PeekXAuth;
window.handleLogout = PeekXAuth.logout;
