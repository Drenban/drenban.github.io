// 全局变量
let userData = null;

// 工具模块
const Utils = {
    generateRandomString(length) {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    generateToken(username) {
        const salt = crypto.randomUUID();
        const payload = { username, exp: Date.now() + 3600000, salt }; // 1 小时有效期
        localStorage.setItem('salt', salt);
        return btoa(JSON.stringify(payload));
    },

    isMembershipValid(expiryDate) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        return expiry.getTime() > currentDate.getTime() && !isNaN(expiry.getTime());
    },

    sanitizeInput(input) {
        return input.replace(/[<>&;"]/g, '');
    },

    verifyToken(token) {
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
};

// Supabase 配置
const SupabaseConfig = {
    url: 'https://xupnsfldgnmeicumtqpp.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cG5zZmxkZ25tZWljdW10cXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1Mjc1OTUsImV4cCI6MjA1NzEwMzU5NX0.hOHdx2iFHqA6LX2T-8xP4fWuYxK3HxZtTV2zjBHD3ro',
    client: typeof supabase !== 'undefined' ? supabase.createClient('https://xupnsfldgnmeicumtqpp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cG5zZmxkZ25tZWljdW10cXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1Mzc1OTUsImV4cCI6MjA1NzEwMzU5NX0.hOHdx2iFHqA6LX2T-8xP4fWuYxK3HxZtTV2zjBHD3ro') : null
};

// 用户数据模块
const UserData = {
    async loadUserData(username) {
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
    },

    async loadAllUsers() {
        try {
            const response = await fetch('users.json');
            if (!response.ok) throw new Error('无法加载用户数据');
            return await response.json();
        } catch (error) {
            console.error('加载所有用户失败:', error);
            return [];
        }
    }
};

// UI 控制模块
const UI = {
    showSection(sectionId) {
        document.querySelectorAll('.peekx__content').forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });
        document.getElementById('logout-btn').style.display = sectionId === 'query-section' ? 'block' : 'none';
    },

    setMessage(elementId, message, color = 'red') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.color = color;
        }
    }
};

// 认证模块
const Auth = {
    async login() {
        const loginBtn = document.getElementById('login-btn');
        loginBtn.disabled = true;

        const username = Utils.sanitizeInput(document.getElementById('login-username').value.trim());
        const password = Utils.sanitizeInput(document.getElementById('login-password').value.trim());

        if (SupabaseConfig.client) {
            try {
                const { data, error } = await SupabaseConfig.client.auth.signInWithPassword({
                    email: username,
                    password
                });
                if (!error) {
                    const expiryDate = data.user.user_metadata?.expiry_date;
                    if (!expiryDate || !Utils.isMembershipValid(expiryDate)) {
                        UI.setMessage('error-message', '您的会员已过期或未设置有效期，请续费');
                        localStorage.setItem('expiredEmail', username);
                        setTimeout(() => window.location.href = '/assets/pay/index.html', 2000);
                        loginBtn.disabled = false;
                        return false;
                    }
                    localStorage.setItem('token', data.session.access_token);
                    UI.setMessage('error-message', '登录成功（Supabase）！欢迎回来', 'green');
                    setTimeout(() => UI.showSection('query-section'), 1000);
                    return true;
                }
            } catch (err) {
                console.warn('Supabase 登录失败:', err);
            }
        }

        const userData = await UserData.loadUserData(username);
        if (!userData) {
            UI.setMessage('error-message', '用户不存在或网络错误');
            loginBtn.disabled = false;
            return false;
        }

        const hashedPassword = await Utils.hashPassword(password);
        if (userData.username === username && userData.password === hashedPassword) {
            const expiryDate = userData.expiry_date;
            if (!expiryDate || !Utils.isMembershipValid(expiryDate)) {
                UI.setMessage('error-message', '您的会员已过期或未设置有效期，请续费');
                localStorage.setItem('expiredEmail', username);
                setTimeout(() => window.location.href = '/assets/pay/index.html', 2000);
                loginBtn.disabled = false;
                return false;
            }
            const token = Utils.generateToken(username);
            localStorage.setItem('token', token);
            UI.setMessage('error-message', '登录成功（JSON）！欢迎回来', 'green');
            setTimeout(() => UI.showSection('query-section'), 1000);
            return true;
        } else {
            UI.setMessage('error-message', '用户名或密码错误');
            loginBtn.disabled = false;
            return false;
        }
    },

    async register() {
        const signupBtn = document.getElementById('signup-btn');
        signupBtn.disabled = true;

        const email = Utils.sanitizeInput(document.getElementById('register-username').value.trim());
        const password = Utils.sanitizeInput(document.getElementById('register-password').value.trim());
        const confirmPassword = Utils.sanitizeInput(document.getElementById('register-confirm-password').value.trim());

        if (password !== confirmPassword) {
            UI.setMessage('register-error-message', '密码和确认密码不匹配');
            signupBtn.disabled = false;
            return false;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        const expiryDateString = expiryDate.toISOString().split('T')[0];

        try {
            const { data, error } = await SupabaseConfig.client.auth.signUp({
                email,
                password,
                options: { data: { expiry_date: expiryDateString } }
            });
            if (error) {
                UI.setMessage('register-error-message', '注册失败: ' + error.message);
                signupBtn.disabled = false;
                return false;
            } else {
                UI.setMessage('register-error-message', `注册成功！7 天有效期: ${expiryDateString}，请检查邮箱验证`, 'green');
                setTimeout(() => UI.showSection('login-section'), 2000);
                return true;
            }
        } catch (err) {
            UI.setMessage('register-error-message', '注册错误: ' + err.message);
            signupBtn.disabled = false;
            return false;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
        UI.showSection('login-section');
    }
};

// 搜索模块
const Search = {
    async search() {
        const query = Utils.sanitizeInput(document.getElementById('query-input').value.toLowerCase().trim());
        const users = await UserData.loadAllUsers();
        const results = users.filter(user => 
            user.email.toLowerCase().includes(query) || 
            user.expiry.toLowerCase().includes(query)
        );

        const resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '';
        if (results.length > 0) {
            results.forEach(user => {
                const p = document.createElement('p');
                p.textContent = `Email: ${user.email}, Expiry: ${user.expiry}`;
                resultsDiv.appendChild(p);
            });
        } else {
            resultsDiv.textContent = '未找到匹配用户';
        }
    }
};

// 暴露接口给 ID 200 调用
window.PeekXAuth = {
    login: Auth.login,
    register: Auth.register,
    search: Search.search
};

// 初始化（保持独立运行能力）
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined') {
        console.error('Supabase 未加载');
        UI.setMessage('error-message', 'Supabase 未加载，请检查网络');
    } else {
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.login();
        });
        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.register();
        });
        document.getElementById('logout-btn')?.addEventListener('click', Auth.logout);
    }
});
