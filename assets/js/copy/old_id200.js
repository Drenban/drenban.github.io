200: [function(e, t, n) {
    "use strict";
    var r = e("@babel/runtime/helpers/interopRequireDefault")(e("./Sketch")),
        i = e("../../core/properties"),
        u = e("../../controls/cameraControls"),
        h = e("../prompt/prompt"),
        d = e("../prompt/promptData"),
        c = e("codemirror");

    var cm, isLoggedIn = false; // 模拟登录状态

    n.init = function() {
        p = document.querySelector(".peekx");
        if (!p) {
            console.warn("PeekX container not found");
            return;
        }
        m = p.querySelector(".peekx__intro--minimize");
        v = p.querySelectorAll(".peekx__instructions");
        f = p.querySelectorAll(".peekx__nav-mode");
        tabs = p.querySelectorAll(".peekx__tab");

        console.log("Init - PeekX:", p, "Minimize:", m);

        if (!m) {
            console.warn("Minimize button not found, check .peekx__intro-minimize class");
        }

        var editor = p.querySelector(".peekx__editor");
        if (!editor) {
            console.warn("Editor container (.peekx__editor) not found");
            return;
        }
        var loginContent = editor.querySelector(".peekx__content--login"),
            registerContent = editor.querySelector(".peekx__content--register"),
            searchContent = editor.querySelector(".peekx__content--search");

        // 初始化 CodeMirror
        var editorCm = editor.querySelector(".shader-peekx-cm");
        if (editorCm && c) {
            cm = c(editorCm, {
                value: "请登录后使用搜索功能...",
                indentUnit: 4,
                theme: "monokai",
                viewportMargin: 10,
                lineNumbers: true,
                matchBrackets: true,
                mode: "text/plain",
                autoCloseBrackets: true,
                showCursorWhenSelecting: true,
                indentWithTabs: false,
                readOnly: true
            });
            console.log("CodeMirror initialized in PeekX");
        } else if (editorCm) {
            console.warn("CodeMirror module not available, skipping initialization");
        }

        // 初始化 tab 状态
        var activeTab = p.querySelector(".peekx__tab.is-active");
        if (activeTab) {
            switchContent(activeTab.getAttribute("data-tab"));
        } else {
            tabs[1].classList.add("is-active"); // 默认激活登录 tab
            switchContent("login");
        }

        // 绑定事件
        if (m) m.addEventListener("click", x);
        if (v.length) {
            for (var e = 0, t = v.length; e < t; e++) {
                v[e].addEventListener("click", b);
            }
        }
        if (f.length) {
            for (var n = 0, r = f.length; n < r; n++) {
                f[n].addEventListener("change", S);
            }
        }
        if (tabs.length) {
            for (var e = 0, t = tabs.length; e < t; e++) {
                tabs[e].addEventListener("click", function() {
                    for (var n = 0; n < tabs.length; n++) tabs[n].classList.remove("is-active");
                    this.classList.add("is-active");
                    switchContent(this.getAttribute("data-tab"));
                });
            }
        }

        // 内容切换函数
        function switchContent(tab) {
            loginContent.style.display = "none";
            registerContent.style.display = "none";
            searchContent.style.display = "none";
            if (!isLoggedIn && tab === "search") {
                loginContent.style.display = "block";
                tabs[1].classList.add("is-active");
                for (var k = 0; k < tabs.length; k++) {
                    if (tabs[k].getAttribute("data-tab") === "search") {
                        tabs[k].classList.remove("is-active");
                    }
                }
                console.log("未登录，强制显示登录界面");
            } else {
                editor.querySelector(`.peekx__content--${tab}`).style.display = "block";
            }
            w();
        }

        y = localStorage.getItem("peekxMinimized") === "true";
        if (y) p.classList.add("is-minimized");
        w();
    };

    n.show = function() {
        if (!p) n.init();
        if (p) {
            p.classList.add("is-visible");
            m = p.querySelector(".peekx__intro-minimize");
            var isMobile = window.innerWidth <= 812;
            console.log("Show - Mobile:", isMobile, "Minimize:", m);
            if (m && !m.onclick) m.addEventListener("click", x);
            w();
        }
        S();
    };

    n.hide = function() {
        if (p) p.classList.remove("is-visible");
    };

    n.initLocalSketches = function() {
        if (!p || !tabs.length) {
            console.warn("PeekX container or tabs not found, skipping sketch initialization");
            return;
        }
        if (null !== i.forkSlotIndex) {
            for (var e = 0, t = tabs.length; e < t; e++) {
                tabs[e].classList.toggle("is-active", e === i.forkSlotIndex);
            }
        }
        for (var n = 0, o = tabs.length; n < o; n++) {
            var a = g[n];
            if (!a) {
                a = new r.default({ id: n });
                a.init();
                g.push(a);
            }
            if (tabs[n].classList.contains("is-active")) {
                if (null !== i.forkSlotIndex) {
                    a.importData(i.currentSketch ? i.currentSketch.data : {});
                } else {
                    i.currentSketch = a;
                    a.show();
                }
            }
        }
        i.forkSlotIndex = null;
    };

    n.resize = w;

    n.update = function(e) {};

    var p, f, m, v, tabs, g = [], y = (i.currentSketch = null, false);

    function x(e) {
        y = !y;
        p.classList.toggle("is-minimized", y);
        if (m) m.title = y ? "显示说明" : "隐藏说明";
        localStorage.setItem("peekxMinimized", y);
        w();
    }

    function b() {
        if ("test-shadertoy" === this.dataset.id) {
            h.showInput("请输入 PeekX 模型地址：", "/", false, false);
            h.setOkCallback(function() {
                var e = h.getInputValue(),
                    t = e.replace("https://www.shadertoy.com/view/", "").replace("/", "");
                console.log("Shadertoy URL:", t);
            });
        } else {
            h.showMsg(d[this.dataset.id], false);
        }
    }

    function _() {
        if (!tabs.length) return;
        var e = p.querySelector(".peekx__tab.is-active"),
            t = Array.prototype.indexOf.call(tabs, e);
        if (t >= 0) {
            i.currentSketch = g[t];
            g[t].show();
        }
    }

    function w(e, t) {
        if (!p) return;
        var isMobile = i.isMobile || window.innerWidth <= 812;
        p.style.width = isMobile ? "100%" : "50%"; // 保持原有宽度逻辑
        p.style.height = "100%"; // 默认占满父容器高度

        var editor = p.querySelector(".shader-peekx");
        var intro = p.querySelector(".peekx__intro");

        if (editor) {
            var editorRect = editor.getBoundingClientRect();
            editor.style.display = "block"; // 编辑器始终可见
            editor.style.width = "100%"; // 占满 .peekx 宽度
            if (p.classList.contains("is-minimized")) {
                if (intro) intro.style.display = "none"; // 最小化时隐藏简介
                editor.style.height = Math.max(1, window.innerHeight - editorRect.top - 20) + "px"; // 模块 133 的方法
            } else {
                if (intro) intro.style.display = "block"; // 展开时显示简介
                var introRect = intro.getBoundingClientRect();
                editor.style.height = Math.max(1, window.innerHeight - introRect.bottom - 20) + "px"; // 留出简介空间
            }
            if (cm) cm.refresh();
        }
        console.log("Resize - PeekX width:", p.style.width, "Editor height:", editor ? editor.style.height : "N/A");
    }

    function S() {
        if (!f.length) return;
        for (var e = 0, t = f.length; e < t; e++) {
            if (f[e].checked) {
                u.changeMode(f[e].value);
                break;
            }
        }
    }

    var resizeTimeout;
    window.addEventListener("resize", function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(w, 100);
    });
}, {
    "../../controls/cameraControls": 88,
    "../../core/properties": 92,
    "../prompt/prompt": 157,
    "../prompt/promptData": 158,
    "./Sketch": 132,
    "@babel/runtime/helpers/interopRequireDefault": 11,
    codemirror: 28
}],