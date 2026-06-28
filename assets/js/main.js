// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
    JSON_DATA_PATH:  '/assets/data/data.json',
    CORPUS_PATH:     '/assets/data/corpus.json',
    USER_DATA_PATH:  '/assets/obfuscate/',
    TOKEN_EXPIRY_MS: 3_600_000,
    CACHE_LIMIT:     100,
    MAX_HISTORY:     10,
};

let CONFIG         = null;
let supabaseClient = null;

const PASSWORD       = window.ENCRYPTION_PASSWORD || 'border-radius: 280185px;';
const ENCRYPTION_KEY = CryptoJS.SHA256(PASSWORD).toString(CryptoJS.enc.Hex);

// ─── Supabase bootstrap ───────────────────────────────────────────────────────

async function decryptSupabaseConfig() {
    const response = await fetch('/assets/data/supabase-config.json');
    if (!response.ok)
        throw new Error(`Failed to fetch supabase-config.json: ${response.status} ${response.statusText}`);

    const { encrypted, iv } = await response.json();
    if (!encrypted || !iv) throw new Error('Invalid supabase-config.json format');

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Hex.parse(encrypted) },
        CryptoJS.enc.Hex.parse(ENCRYPTION_KEY),
        { iv: CryptoJS.enc.Hex.parse(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const text = decrypted.toString(CryptoJS.enc.Utf8);
    if (!text) throw new Error('Decryption produced empty result');

    window.SUPABASE_CONFIG = JSON.parse(text);
    return window.SUPABASE_CONFIG;
}

async function loadConfig() {
    if (!window.SUPABASE_CONFIG) throw new Error('SUPABASE_CONFIG is not set');

    const { SUPABASE_URL, SUPABASE_KEY } = window.SUPABASE_CONFIG;
    if (!window.supabase?.createClient) throw new Error('Supabase library not loaded');

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.storage.from('config-bucket').download('config.json');
    if (error) throw new Error(`Config download failed: ${error.message}`);

    const config = JSON.parse(await data.text());
    return { ...config, supabase };
}

async function withRetry(fn, retries = 3, delay = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === retries - 1) throw err;
            console.warn(`[CONFIG] Retry ${attempt + 1}/${retries} in ${delay}ms:`, err.message);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

async function initializeConfig() {
    try {
        console.log('[CONFIG] Initializing…');
        const supabaseCfg = await withRetry(decryptSupabaseConfig);
        if (!supabaseCfg) throw new Error('decryptSupabaseConfig returned null');

        const result = await withRetry(loadConfig);
        if (!result) throw new Error('loadConfig returned null');

        CONFIG         = result;
        supabaseClient = result.supabase;
        console.log('[CONFIG] Ready');
    } catch (err) {
        console.error('[CONFIG] Initialization failed:', err);
        CONFIG         = null;
        supabaseClient = null;
        throw err;
    }
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const ELEMENTS = {
    signUpButton:  document.getElementById('signUp'),
    signInButton:  document.getElementById('signIn'),
    container:     document.getElementById('auth-container'),
    searchPage:    document.getElementById('search-page'),
    searchInput:   document.getElementById('search-input'),
    resultsList:   document.getElementById('results-list'),
    historyList:   document.getElementById('history-list'),
    searchBar:     document.querySelector('.search-bar'),
    historyButton: document.querySelector('.history-btn'),
    searchHistory: document.querySelector('.search-history'),
    logoutButton:  document.querySelector('.logout-btn'),
    signInForm:    document.querySelector('.sign-in-container form'),
    signUpForm:    document.querySelector('.sign-up-container form'),
    searchButton:  document.querySelector('.search-btn'),
    randomButton:  document.querySelector('.random-btn'),
};

const missing = Object.entries(ELEMENTS).filter(([, el]) => !el).map(([k]) => k);
if (missing.length) {
    console.error('Missing DOM elements:', missing);
    throw new Error(`Initialization failed: missing elements [${missing.join(', ')}]`);
}

// ─── App state ────────────────────────────────────────────────────────────────

const state = {
    userData:       null,
    workbookData:   null,
    corpus:         null,
    fuse:           null,
    searchCache:    new Map(),
    searchHistory:  [],
    randomCount:    parseInt(localStorage.getItem('randomCount') || '0', 10),
    maxRandomCount: 5,
    isAnimating:    false,
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const utils = {
    decodeBase64UTF8(base64Str) {
        const binary = atob(base64Str);
        const bytes  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    },

    async hashPassword(password) {
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    generateToken(username) {
        const salt    = crypto.randomUUID();
        const payload = { username, exp: Date.now() + DEFAULT_CONFIG.TOKEN_EXPIRY_MS, salt };
        localStorage.setItem('salt', salt);
        return btoa(JSON.stringify(payload));
    },

    verifyToken(token) {
        if (!token) { this._clearAuth(); return false; }
        try {
            const raw     = token.includes('.') ? token.split('.')[1] : token;
            const payload = JSON.parse(atob(raw));
            const exp     = token.includes('.') ? payload.exp * 1000 : payload.exp;

            if (!exp || exp < Date.now()) { this._clearAuth(); return false; }
            if (!token.includes('.') && payload.salt !== localStorage.getItem('salt')) {
                this._clearAuth(); return false;
            }
            return true;
        } catch {
            this._clearAuth();
            return false;
        }
    },

    _clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
    },

    sanitizeInput(input) {
        return input.replace(/[&<>"'`;=()/\\]/g, '');
    },

    isMembershipValid(expiryDate) {
        const expiry = new Date(expiryDate).getTime();
        return !isNaN(expiry) && expiry > new Date().setHours(0, 0, 0, 0);
    },
};

// ─── Data loaders ─────────────────────────────────────────────────────────────

const dataLoader = {
    async loadJSONData() {
        try {
            const response = await fetch(DEFAULT_CONFIG.JSON_DATA_PATH);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            state.workbookData = JSON.parse(utils.decodeBase64UTF8(await response.text()));
        } catch (err) {
            console.error('loadJSONData failed:', err);
            ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
        }
    },

    async loadCorpus() {
        try {
            const response = await fetch(DEFAULT_CONFIG.CORPUS_PATH);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            state.corpus = JSON.parse(utils.decodeBase64UTF8(await response.text()));
            state.fuse   = new Fuse(state.corpus, {
                keys: [
                    { name: 'question', weight: 0.5  },
                    { name: 'keywords', weight: 0.3  },
                    { name: 'synonyms', weight: 0.15 },
                    { name: 'tags',     weight: 0.05 },
                ],
                threshold:          0.4,
                includeScore:       true,
                includeMatches:     true,
                minMatchCharLength: 2,
                shouldSort:         true,
            });
        } catch (err) {
            console.error('loadCorpus failed:', err);
        }
    },

    async loadUserData(username) {
        try {
            const response = await fetch(`${DEFAULT_CONFIG.USER_DATA_PATH}${username}.json`);
            if (response.status === 404) { console.warn(`No user file for ${username}`); return null; }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            state.userData = JSON.parse(utils.decodeBase64UTF8(await response.text()));
            return state.userData;
        } catch (err) {
            console.error('loadUserData failed:', err);
            return null;
        }
    },
};

// ─── Kilo AI ──────────────────────────────────────────────────────────────────

const kiloAI = {
    ENDPOINT: 'https://xupnsfldgnmeicumtqpp.supabase.co/functions/v1/kilo-proxy',
    // MODEL:    'kilo-auto/free',   // set to '' to disable and fall back to raw results
    // MODEL: 'poolside/laguna-m.1:free',

    get enabled() { return !!this.MODEL; },

    async polish(userQuery, rawResult) {
        // Instantly return null if model is disabled — caller falls back to raw result
        if (!this.enabled) return null;

        const rawText = Array.isArray(rawResult)
            ? rawResult.map(l => l.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join('\n')
            : String(rawResult);

        const system =
            `你是一位专业的A股量化交易助手。所有回答必须使用中文，严禁使用英文或任何其他语言，包括思考过程。\n` +
            `用户会提供查询和原始搜索结果，请将结果整理成自然、友好、简洁的中文回答。\n` +
            `规则：\n` +
            `- 所有输出必须是中文，包括标点符号使用中文格式\n` +
            `- 保留全部关键数据（股票代码、价格、策略、支撑位、压力位等），不可遗漏\n` +
            `- 使用口语化中文，避免生硬列表堆砌\n` +
            `- 股票列表需简洁汇总并说明策略含义\n` +
            `- 知识类问题用清晰解释回答\n` +
            `- 回答控制在150字以内\n` +
            `- 直接输出最终答案，不要输出分析过程`;

        try {
            const res = await fetch(this.ENDPOINT, {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${window.SUPABASE_CONFIG?.SUPABASE_KEY ?? ''}`,
                },
                body: JSON.stringify({
                    model:      this.MODEL,
                    max_tokens: 300,
                    messages:   [
                        { role: 'system', content: system },
                        { role: 'user',   content: `用户查询：${userQuery}\n\n原始结果：\n${rawText}\n\n请用中文直接回答，不超过150字。` },
                    ],
                }),
            });

            if (!res.ok) throw new Error(`Proxy ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() || null;
        } catch (err) {
            console.error('[KiloAI] polish() failed:', err);
            return null;
        }
    },
};

// ─── Search ───────────────────────────────────────────────────────────────────

const search = {
    json(query) {
        if (!state.workbookData) {
            ELEMENTS.resultsList.innerHTML = '<li>Server busy, please try again later</li>';
            return null;
        }

        const conditions    = {};
        let   isSimpleQuery = false;
        let   strategy, price;
        query = query.trim().toLowerCase();

        if (query.includes(':')) {
            query.split(',').forEach(part => {
                const [k, v] = part.split(':').map(s => s.trim());
                if (k && v !== undefined) conditions[k] = v;
            });
            strategy = conditions['celv'] || conditions['策略'];
            price    = conditions['shoupanjia'] || conditions['收盘价'];
            if (strategy && price) {
                isSimpleQuery        = true;
                conditions['策略']   = strategy;
                conditions['收盘价'] = price;
            }
        } else if (/[，, ]/.test(query)) {
            const parts = query.split(/[，, ]+/).map(s => s.trim());
            if (parts.length === 2) {
                isSimpleQuery = true;
                [strategy, price] = /^\d+(\.\d+)?$/.test(parts[0])
                    ? [parts[1], parts[0]]
                    : [parts[0], parts[1]];
                conditions['策略']   = strategy;
                conditions['收盘价'] = price;
            }
        } else if (/^[\u4e00-\u9fa5a-zA-Z]+\d+(\.\d+)?$/.test(query) ||
                   /^\d+(\.\d+)?[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
            isSimpleQuery = true;
            if (/^\d+(\.\d+)?[\u4e00-\u9fa5a-zA-Z]+$/.test(query)) {
                price    = query.match(/\d+(\.\d+)?/)[0];
                strategy = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
            } else {
                strategy = query.match(/[\u4e00-\u9fa5a-zA-Z]+/)[0];
                price    = query.match(/\d+(\.\d+)?/)[0];
            }
            conditions['策略']   = strategy;
            conditions['收盘价'] = price;
        } else if (/^\d+$/.test(query)) {
            conditions['股票代码'] = query;
        } else {
            conditions[''] = query;
        }

        const matches = state.workbookData.filter(row => {
            if (conditions[''])
                return Object.values(row).some(v => String(v).toLowerCase().includes(conditions['']));

            return Object.entries(conditions).every(([key, value]) => {
                const rowValue = String(row[key] ?? '').toLowerCase();
                if (!value) return true;

                if (key === '收盘价') {
                    return Math.abs(Number(rowValue) - Number(value)) <= 0.5;
                }
                if (value.includes('-')) {
                    const [min, max] = value.split('-').map(Number);
                    return Number(rowValue) >= min && Number(rowValue) <= max;
                }
                if (value.startsWith('>')) return Number(rowValue) > Number(value.slice(1));
                if (value.startsWith('<')) return Number(rowValue) < Number(value.slice(1));
                return rowValue === value;
            });
        });

        if (!matches.length) return null;

        if (isSimpleQuery) {
            const codes = matches.map(r => r['股票代码']).filter(Boolean).join(', ');
            return [
                `<span class="field">全部代码:</span><br><span class="value">${codes}</span>`,
                `<span class="field">合计:</span> <span class="value">${matches.length}</span>`,
            ];
        }

        return matches.flatMap((row, i) => [
            ...Object.entries(row).map(([k, v]) =>
                `<span class="field">${k}:</span> <span class="value">${v}</span>`),
            ...(i < matches.length - 1 ? ['<hr>'] : []),
        ]);
    },

    corpus(query) {
        if (!state.corpus || !state.fuse) return 'Corpus not loaded, please try again later';
        query = query.trim().toLowerCase();
        if (state.searchCache.has(query)) return state.searchCache.get(query);

        const results = state.fuse.search(query);
        const best    = results.length && results[0].score < 0.6 ? results[0] : null;
        const answer  = this._generateResponse(this._detectIntent(query), best);

        if (state.searchCache.size >= DEFAULT_CONFIG.CACHE_LIMIT) state.searchCache.clear();
        state.searchCache.set(query, answer);
        return answer;
    },

    _detectIntent(input) {
        const intents = [
            { name: 'time',       patterns: ['时间','什么时候','几点','多久','啥时候','何时'], fallback: '您想知道什么的时间？可以告诉我更多细节吗？' },
            { name: 'price',      patterns: ['价格','多少钱','费用','成本','价位','花多少'],  fallback: '您想了解哪方面的价格？可以具体一点吗？' },
            { name: 'howto',      patterns: ['如何','怎么','怎样','步骤','方法','怎么办'],   fallback: '您想知道如何做什么？请告诉我具体操作！' },
            { name: 'psychology', patterns: ['心理','心态','情绪','行为'],                   fallback: '您想了解交易中的什么心理因素？请具体点！' },
        ];
        return intents.find(i => i.patterns.some(p => input.includes(p))) || null;
    },

    _generateResponse(intent, match) {
        const fallbackMsg =
            `抱歉，我没太明白您的意思。您可以试试以下方式提问：\n` +
            `- 直接输入股票代码，如：600519\n` +
            `- 输入交易策略+价格，如：买入10 或 卖出15\n` +
            `- 不清楚术语（如"收盘价""量化趋势"）？直接输入名称，我来解释！\n` +
            `随时提问，我会尽力帮您！😊`;

        if (match) {
            return (1 - match.score).toFixed(2) < 0.5
                ? '抱歉，找不到准确答案，您可以换个说法试试！'
                : match.item.answer.trim();
        }
        if (intent) {
            return ({
                time:  '我可以帮您查时间相关的信息，您具体想知道什么时间？',
                price: '价格信息可能因产品不同而异，您想了解哪个产品的价格？',
                howto: '我可以指导您完成操作，请告诉我您想做什么！',
            })[intent.name] || intent.fallback || fallbackMsg;
        }
        return fallbackMsg;
    },

    // Renders text instantly without the typewriter effect — used for loading indicators
    // so they don't hold state.isAnimating = true while waiting for async work.
    showInstant(text, element) {
        if (!element) return;
        element.innerHTML = `<div class="line">${text}</div>`;
    },

    typeLines(lines, element) {
        if (!element || !lines?.length || state.isAnimating) return;

        state.isAnimating = true;
        this._setUILocked(true);
        element.innerHTML = '';

        let lineIndex = 0;

        const typeNextLine = () => {
            if (!state.isAnimating || lineIndex >= lines.length) {
                state.isAnimating = false;
                this._setUILocked(false);
                return;
            }

            const line     = document.createElement('div');
            line.className = 'line';
            element.appendChild(line);

            const content = lines[lineIndex] || '';
            let charIndex = 0;
            let lastTime  = 0;

            const typeChar = timestamp => {
                if (!state.isAnimating) return;
                if (charIndex < content.length && timestamp - lastTime > 20) {
                    line.innerHTML = content.slice(0, ++charIndex);
                    lastTime = timestamp;
                }
                if (charIndex < content.length) {
                    requestAnimationFrame(typeChar);
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

    _setUILocked(locked) {
        ELEMENTS.searchButton.disabled  = locked;
        ELEMENTS.randomButton.disabled  = locked;
        ELEMENTS.historyButton.disabled = locked;
        ELEMENTS.historyList.querySelectorAll('li').forEach(li => {
            li.style.pointerEvents = locked ? 'none' : 'auto';
        });
    },

    random() {
        if (!state.workbookData) {
            this.typeLines(['Data not loaded, please try again later'], ELEMENTS.resultsList);
            return;
        }
        if (state.randomCount >= state.maxRandomCount) {
            this.typeLines(
                [`随机策略已达上限 (${state.maxRandomCount}/${state.maxRandomCount})，无法继续使用`],
                ELEMENTS.resultsList
            );
            return;
        }

        const candidates = state.workbookData.filter(r => r['策略'] === '买入');
        if (!candidates.length) {
            this.typeLines(['没有符合"买入"策略的股票'], ELEMENTS.resultsList);
            return;
        }

        const item = candidates[Math.floor(Math.random() * candidates.length)];
        state.randomCount++;
        localStorage.setItem('randomCount', state.randomCount);

        const lines = [
            ...Object.entries(item).map(([k, v]) =>
                `<span class="field">${k}:</span> <span class="value">${v}</span>`),
            `<span class="field">随机次数:</span> <span class="value">${state.randomCount}/${state.maxRandomCount}</span>`,
        ];
        this.typeLines(lines, ELEMENTS.resultsList);

        state.searchHistory.unshift(`随机: ${item['股票代码']}`);
        this.updateHistory();
    },

    initHistory() {
        ELEMENTS.historyList.addEventListener('click', e => {
            const li = e.target.closest('li');
            if (!li || state.isAnimating) return;
            ELEMENTS.searchInput.value = li.textContent;
            PeekXAuth.search();
        });
    },

    updateHistory() {
        ELEMENTS.historyList.innerHTML = state.searchHistory
            .slice(0, DEFAULT_CONFIG.MAX_HISTORY)
            .map(item => `<li>${item}</li>`)
            .join('');
    },
};

// ─── Auth / Search controller ─────────────────────────────────────────────────

const PeekXAuth = {
    async _ensureConfig() {
        if (CONFIG && supabaseClient) return;
        await initializeConfig();
    },

    async login(event) {
        event.preventDefault();
        const email    = utils.sanitizeInput(document.querySelector('.sign-in-container input[type="email"]').value.trim());
        const password = utils.sanitizeInput(document.querySelector('.sign-in-container input[type="password"]').value.trim());

        try {
            await this._ensureConfig();
        } catch {
            alert('服务器初始化失败，请稍后再试');
            return;
        }

        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;

                if (!utils.isMembershipValid(data.user.user_metadata?.expiry_date)) {
                    this._redirectExpired(email);
                    return;
                }

                localStorage.setItem('token', data.session.access_token);
                this._postLogin();
                alert('登录成功');
                return;
            } catch (err) {
                console.error('Supabase login failed:', err);
                if (err.message.includes('Email not confirmed')) {
                    ELEMENTS.signInForm.insertAdjacentHTML('beforeend',
                        `<p style="color:red;">请验证您的邮箱！未收到邮件？请检查垃圾邮件或<a href="mailto:support@peekx.com">联系支持</a>。</p>`
                    );
                }
                alert(`Supabase登录失败: ${err.message}，尝试本地认证`);
            }
        }

        // Local JSON fallback
        const user = await dataLoader.loadUserData(email);
        if (!user) { alert('未找到用户或网络错误，请确认是否已注册或检查网络连接'); return; }

        if (user.password !== await utils.hashPassword(password)) { alert('邮箱或密码错误'); return; }

        if (!utils.isMembershipValid(user.expiry_date)) { this._redirectExpired(email); return; }

        localStorage.setItem('token', utils.generateToken(email));
        this._postLogin();
        alert('登录成功');
    },

    async register(event) {
        event.preventDefault();

        try {
            await this._ensureConfig();
            if (!supabaseClient) { alert('无法连接到服务器，请稍后再试'); return; }
        } catch {
            alert('服务器初始化失败，请稍后再试');
            return;
        }

        const name     = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="text"]').value.trim());
        const email    = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="email"]').value.trim());
        const password = utils.sanitizeInput(document.querySelector('.sign-up-container input[type="password"]').value.trim());

        if (!name || !email || !password) { alert('请填写所有必填字段'); return; }

        const expiryDate = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0];

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email, password,
                options: { data: { expiry_date: expiryDate, full_name: name } },
            });
            if (error) throw error;

            fetch(`${DEFAULT_CONFIG.USER_DATA_PATH}${email}.json`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    email,
                    password:    await utils.hashPassword(password),
                    expiry_date: expiryDate,
                    full_name:   name,
                }),
            }).catch(e => console.warn('Local JSON backup failed:', e.message));

            alert(data.user
                ? `注册成功！用户 ID: ${data.user.id}, 到期时间: ${expiryDate}`
                : `注册成功，请验证你的邮箱！到期时间: ${expiryDate}`
            );
            ELEMENTS.container.classList.remove('right-panel-active');
        } catch (err) {
            console.error('Registration failed:', err);
            alert(`注册失败: ${err.message}`);
        }
    },

    async search() {
        if (!utils.verifyToken(localStorage.getItem('token'))) {
            this._showAuth();
            alert('请先登录');
            return;
        }

        const query = ELEMENTS.searchInput.value.trim();
        if (!query) return;

        const isJSONQuery =
            query.includes(':') ||
            /^[\u4e00-\u9fa5A-Za-z]+\d+(\.\d+)?$|^\d+(\.\d+)?[\u4e00-\u9fa5A-Za-z]+$|^\d+$/.test(query) ||
            (/[，, ]/.test(query) && query.split(/[，, ]+/).length === 2);

        const rawResult = isJSONQuery ? search.json(query) : search.corpus(query);

        if (!rawResult) {
            search.typeLines(['未找到相关结果'], ELEMENTS.resultsList);
            return;
        }

        // Only show loading indicator and call AI if the model is enabled.
        // showInstant() is used instead of typeLines() so state.isAnimating stays false
        // during the async polish() call — preventing the real result from being dropped.
        if (kiloAI.enabled) {
            search.showInstant('正在思考…', ELEMENTS.resultsList);
            const aiAnswer = await kiloAI.polish(query, rawResult);
            if (aiAnswer) {
                search.typeLines(aiAnswer.split('\n').filter(Boolean), ELEMENTS.resultsList);
                this._addHistory(query);
                adjustResultsWidth();
                return;
            }
            // AI failed — fall through to raw result below
        }

        // Raw result fallback (also used when kiloAI.enabled is false)
        search.typeLines(
            typeof rawResult === 'string' ? rawResult.split('\n').filter(Boolean) : rawResult,
            ELEMENTS.resultsList
        );
        this._addHistory(query);
        adjustResultsWidth();
    },

    _addHistory(query) {
        if (!state.searchHistory.includes(query)) {
            state.searchHistory.unshift(query);
            search.updateHistory();
        }
    },

    logout() {
        supabaseClient?.auth.signOut().catch(e => console.error('Supabase signOut failed:', e));
        localStorage.clear();
        sessionStorage.clear();
        this._showAuth();
        ELEMENTS.searchHistory.classList.remove('visible');
        alert('已成功登出');
    },

    _postLogin() {
        sessionStorage.setItem('isLoggedIn', 'true');
        ELEMENTS.container.classList.add('hidden');
        ELEMENTS.searchPage.classList.add('is-active');
        dataLoader.loadJSONData();
        dataLoader.loadCorpus();
    },

    _showAuth() {
        ELEMENTS.container.classList.remove('hidden');
        ELEMENTS.searchPage.classList.remove('is-active');
    },

    _redirectExpired(email) {
        alert('你的会员已过期，正在跳转到付款页面…');
        localStorage.setItem('expiredEmail', email);
        setTimeout(() => { window.location.href = '/peekx/payment/index.html'; }, 2000);
    },
};

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    ELEMENTS.signUpButton.addEventListener('click',  () => ELEMENTS.container.classList.add('right-panel-active'));
    ELEMENTS.signInButton.addEventListener('click',  () => ELEMENTS.container.classList.remove('right-panel-active'));
    ELEMENTS.historyButton.addEventListener('click', () => ELEMENTS.searchHistory.classList.toggle('visible'));
    ELEMENTS.logoutButton.addEventListener('click',  PeekXAuth.logout.bind(PeekXAuth));
    ELEMENTS.signInForm.addEventListener('submit',   PeekXAuth.login.bind(PeekXAuth));
    ELEMENTS.signUpForm.addEventListener('submit',   PeekXAuth.register.bind(PeekXAuth));
    ELEMENTS.searchButton.addEventListener('click',  PeekXAuth.search.bind(PeekXAuth));
    ELEMENTS.randomButton.addEventListener('click',  () => search.random());
    ELEMENTS.searchInput.addEventListener('keydown', e => e.key === 'Enter' && PeekXAuth.search());

    search.initHistory();

    if (sessionStorage.getItem('isLoggedIn') === 'true' && utils.verifyToken(localStorage.getItem('token'))) {
        PeekXAuth._postLogin();
    } else {
        PeekXAuth._showAuth();
    }

    adjustResultsWidth();
    window.addEventListener('resize', adjustResultsWidth);
});

function adjustResultsWidth() {
    if (ELEMENTS.searchBar && ELEMENTS.resultsList)
        ELEMENTS.resultsList.style.width = `${ELEMENTS.searchBar.offsetWidth}px`;
}

window.addEventListener('load', async () => {
    try {
        await initializeConfig();
    } catch (err) {
        console.error('Startup config init failed:', err);
    }
});

window.PeekXAuth    = PeekXAuth;
window.handleLogout = PeekXAuth.logout.bind(PeekXAuth);
