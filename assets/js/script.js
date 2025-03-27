// 初始化 Supabase 客户端
const supabaseUrl = 'YOUR_SUPABASE_URL'; // 替换为你的 Supabase URL
const supabaseKey = 'YOUR_SUPABASE_KEY'; // 替换为你的 Supabase 匿名密钥
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

// 获取 DOM 元素
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const searchForm = document.querySelector('.peekx__content--search');
const contentAreas = document.querySelectorAll('.peekx__content');
const tabLinks = document.querySelectorAll('.peekx__form-link a');

// 切换表单显示
function showContent(tab) {
    contentAreas.forEach(area => {
        area.style.display = area.classList.contains(`peekx__content--${tab}`) ? 'block' : 'none';
    });
}

// 检查登录状态
function checkLoginStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        showContent('search'); // 登录后显示搜索
    } else {
        showContent('login'); // 未登录显示登录
    }
}

// 加载 JSON 用户数据
async function loadJsonUsers() {
    try {
        const response = await fetch('users.json');
        if (!response.ok) throw new Error('无法加载用户数据');
        return await response.json();
    } catch (error) {
        console.error('加载 JSON 失败:', error);
        alert('无法加载用户数据，请稍后重试');
        return [];
    }
}

// 检查用户有效期
function isUserValid(expiry) {
    const expiryDate = new Date(expiry);
    const today = new Date();
    return expiryDate >= today;
}

// 切换表单事件
tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        showContent(tab);
    });
});

// 登录功能
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // 方式 1: JSON 认证
    const jsonUsers = await loadJsonUsers();
    const jsonUser = jsonUsers.find(user => user.email === email && user.password === password);
    if (jsonUser) {
        if (isUserValid(jsonUser.expiry)) {
            localStorage.setItem('user', JSON.stringify({ email, source: 'json' }));
            alert('JSON 登录成功！');
            showContent('search');
            return;
        } else {
            alert('用户已过期！');
            return;
        }
    }

    // 方式 2: Supabase 登录
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        alert('Supabase 登录失败：' + error.message);
    } else {
        localStorage.setItem('user', JSON.stringify({ email, source: 'supabase' }));
        alert('Supabase 登录成功！');
        showContent('search');
    }
});

// 注册功能
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        alert('密码和确认密码不匹配！');
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) {
        alert('注册失败：' + error.message);
    } else {
        alert('注册成功！请检查邮箱验证。');
        showContent('login');
    }
});

// 搜索功能
function search() {
    const query = document.getElementById('query-input').value.toLowerCase();
    loadJsonUsers().then(users => {
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
    });
}

// 初始化
checkLoginStatus();
