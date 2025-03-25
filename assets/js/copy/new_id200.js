200: [function(e, t, n) {
    "use strict";
    var r = e("@babel/runtime/helpers/interopRequireDefault")(e("./Sketch")),
        i = e("../../core/properties"),
        u = e("../../controls/cameraControls"),
        h = e("../prompt/prompt"),
        d = e("../prompt/promptData"),
        c = e("codemirror");

    var cm, isLoggedIn = false; // 模拟登录状态，后续可替换为实际逻辑

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
            console.warn("Minimize button not found, check .peekx__intro--minimize class");
        }

        var editor = p.querySelector(".peekx__editor");
        if (!editor) {
            console.warn("Editor container (.peekx__editor) not found");
            return;
        }
        // 获取内容区域
        var loginContent = p.querySelector(".peekx__content--login"),
            registerContent = p.querySelector(".peekx__content--register"),
            searchContent = p.querySelector(".peekx__content--search");

        // 初始化 CodeMirror
        var editorCm = p.querySelector(".shader-peekx-cm");
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

        // 初始化时同步 HTML 默认激活的 tab
        var activeTab = p.querySelector(".peekx__tab.is-active");
        if (activeTab) {
            switchContent(activeTab.getAttribute("data-tab"));
        } else {
            tabs[1].classList.add("is-active"); // 默认激活登录 tab
            switchContent("login");
        }

        // 绑定事件
        if (m) {
            m.addEventListener("click", x);
        } else {
            console.warn("Minimize button not found in PeekX");
        }

        if (v.length) {
            for (var j = 0; j < v.length; j++) {
                v[j].addEventListener("click", b);
            }
        }

        if (f.length) {
            for (var j = 0; j < f.length; j++) {
                f[j].addEventListener("change", S);
            }
        }

        if (tabs.length) {
            for (var j = 0; j < tabs.length; j++) {
                tabs[j].addEventListener("click", function() {
                    for (var k = 0; k < tabs.length; k++) {
                        tabs[k].classList.remove("is-active");
                    }
                    this.classList.add("is-active");
                    switchContent(this.getAttribute("data-tab"));
                });
            }
        }

        // 内容切换函数，仅控制 .peekx__content 的显示
        function switchContent(tab) {
            loginContent.style.display = "none";
            registerContent.style.display = "none";
            searchContent.style.display = "none";
            if (!isLoggedIn && tab === "search") {
                loginContent.style.display = "block";
                tabs[1].classList.add("is-active"); // 强制激活登录 tab
                for (var k = 0; k < tabs.length; k++) {
                    if (tabs[k].getAttribute("data-tab") === "search") {
                        tabs[k].classList.remove("is-active");
                    }
                }
                console.log("未登录，强制显示登录界面");
            } else {
                p.querySelector(`.peekx__content--${tab}`).style.display = "block";
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
            m = p.querySelector(".peekx__intro--minimize");
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
        if (i.forkSlotIndex !== null) {
            for (var j = 0; j < tabs.length; j++) {
                tabs[j].classList.toggle("is-active", j === i.forkSlotIndex);
            }
        }
        for (var j = 0; j < tabs.length; j++) {
            var sketch = g[j];
            if (!sketch) {
                sketch = new r.default({ id: j });
                sketch.init();
                g.push(sketch);
            }
            if (tabs[j].classList.contains("is-active")) {
                if (i.forkSlotIndex !== null) {
                    sketch.importData(i.currentSketch ? i.currentSketch.data : {});
                } else {
                    i.currentSketch = sketch;
                    sketch.show();
                }
            }
        }
        i.forkSlotIndex = null;
    };

    n.resize = w;

    n.update = function(e) {
        // 可扩展为控件更新
    };

    var p, f, m, v, tabs, g = [], y = (i.currentSketch = null, false);

    function x(e) {
        y = !y;
        p.classList.toggle("is-minimized", y);
        if (m) m.title = y ? "显示说明" : "隐藏说明";
        localStorage.setItem("peekxMinimized", y);
        w();
    }

    function b() {
        if (this.dataset.id === "test-shadertoy") {
            h.showInput("请输入 PeekX 模型地址：", "/", false, false);
            h.setOkCallback(function() {
                var input = h.getInputValue(),
                    id = input.replace("https://www.shadertoy.com/view/", "").replace("/", "");
                console.log("Shadertoy URL:", id); // 临时替代
            });
        } else {
            h.showMsg(d[this.dataset.id], false);
        }
    }

    function _() {
        if (!tabs.length) return;
        var activeTab = p.querySelector(".peekx__tab.is-active"),
            index = Array.prototype.indexOf.call(tabs, activeTab);
        if (index >= 0) {
            i.currentSketch = g[index];
            g[index].show();
        }
    }

    function w(e, t) {
        if (!p) return;
        var isMobile = i.isMobile || window.innerWidth <= 812;
        p.style.width = isMobile ? "100%" : "50%";
        
        var editor = p.querySelector(".shader-peekx");
        if (editor) {
            var rect = editor.getBoundingClientRect();
            if (p.classList.contains("is-minimized")) {
                editor.style.height = Math.max(1, window.innerHeight - rect.top) + "px";
            } else {
                editor.style.height = Math.max(1, window.innerHeight - rect.top - 20) + "px";
            }
            if (cm) cm.refresh();
        } else {
            p.style.height = "100%";
        }
        console.log("Resize - PeekX width:", p.style.width, "Editor height:", editor ? editor.style.height : "N/A");
    }
    
    function S() {
        if (!f.length) return;
        for (var j = 0; j < f.length; j++) {
            if (f[j].checked) {
                u.changeMode(f[j].value);
                break;
            }
        }
    }

    // 窗口大小调整监听
    var resizeTimeout;
    window.addEventListener("resize", function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(w, 100); // 节流，100ms 延迟
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