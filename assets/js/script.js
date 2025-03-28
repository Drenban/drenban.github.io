let userData = null;

// URL 随机参数生成（保持原逻辑）
(function() {
    function generateRandomString(length) {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '/peekx';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    window.addEventListener('DOMContentLoaded', () => {
        const currentUrl = window.location.href;
        const basePath = '/';
        const targetUrl = window.location.origin + basePath;

        const urlParams = new URLSearchParams(window.location.search);
        const currentRandom = urlParams.get('r');
        const isBasePath = currentUrl === targetUrl || currentUrl.endsWith('/peekx');
        const isRandomPath = currentRandom !== null;

        if (isBasePath || isRandomPath) {
            const randomSlug = generateRandomString(6);
            const newPath = basePath + '?r=' + randomSlug;
            window.history.replaceState({}, document.title, newPath);
        }
    });
})();

// 工具函数
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
        const response = await fetch(`users/${username}.json`);
        if (response.status === 404) {
            console.warn(`用户 ${username} 不存在`);
            return false;
        }
        if (!response.ok) throw new Error(`Failed to fetch users/${username}.json`);
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
const supabaseClient = typeof supabase !== 'undefined' ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// 认证和搜索模块
const PeekXAuth = {
    async login() {
        const loginBtn = document.getElementById('login-btn');
        const errorMessage = document.getElementById('error-message');
        loginBtn.disabled = true;
        errorMessage.textContent = '';

        const username = sanitizeInput(document.getElementById('login-username').value.trim()); // 适配 ID 200
        const password = sanitizeInput(document.getElementById('login-password').value.trim()); // 适配 ID 200

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
                    return true; // 返回成功状态给 ID 200
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
            return true; // 返回成功状态给 ID 200
        } else {
            errorMessage.textContent = supabaseFailed ? '用户名或密码错误' : 'Supabase 登录失败，请检查凭据';
            loginBtn.disabled = false;
            return false;
        }
    },

    async register() {
        const signupBtn = document.getElementById('signup-btn');
        const errorMessage = document.getElementById('register-error-message'); // 适配 ID 200
        signupBtn.disabled = true;
        errorMessage.textContent = '';

        const email = sanitizeInput(document.getElementById('register-username').value.trim()); // 适配 ID 200
        const password = sanitizeInput(document.getElementById('register-password').value.trim()); // 适配 ID 200
        const confirmPassword = sanitizeInput(document.getElementById('register-confirm-password').value.trim()); // 适配 ID 200

        if (password !== confirmPassword) {
            errorMessage.textContent = '密码和确认密码不匹配';
            signupBtn.disabled = false;
            return false;
        }

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
                return true; // 返回成功状态给 ID 200
            }
        } catch (err) {
            errorMessage.style.color = 'red';
            errorMessage.textContent = '注册错误: ' + err.message;
            signupBtn.disabled = false;
            return false;
        }
    },

    async search() {
        // ID 200 未提供搜索逻辑，此处占位
        console.log('搜索功能未实现，待补充');
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
        localStorage.removeItem('session');
        window.location.href = '/';
    }
};

// 暴露接口给 ID 200
window.PeekXAuth = PeekXAuth;

// 初始化逻辑
document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const hasRandomParam = urlParams.has('r');
    const token = localStorage.getItem('token');

    const isIndexPage = pathname === '/' || pathname.endsWith('/') || hasRandomParam;

    if (isIndexPage) {
        if (!token || !verifyToken(token)) {
            window.location.href = '/';
        } else {
            const loginSection = document.getElementById('login-section');
            const querySection = document.getElementById('query-section');
            if (loginSection && querySection) {
                loginSection.style.display = 'none';
                querySection.style.display = 'block';
            }
        }
    }

    const loginBtn = document.getElementById('login-btn');
    if (pathname.includes('/') && loginBtn) {
        loginBtn.addEventListener('click', PeekXAuth.login);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (isIndexPage && logoutBtn) {
        logoutBtn.addEventListener('click', PeekXAuth.logout);
    }

    if (typeof supabase === 'undefined') {
        console.error('Supabase 未定义，请检查 CDN 加载');
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) errorMessage.textContent = 'Supabase 未加载，请刷新页面或检查网络';
    }
});
