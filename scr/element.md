### 一、整理后的 DOM 结构

以下是格式化后的 HTML，去掉不必要的换行和冗余空格，保留层级清晰的结构：

```html
<div class="quant">
    <div class="quant__inner">
        <!-- 导航模式 -->
        <div class="quant__nav-modes">
            <div class="quant__nav-mode-wrapper">
                <input id="quant__nav-mode--narrow" class="quant__nav-mode" type="radio" name="nav-mode" value="narrow" checked="checked">
                <label class="quant__nav-mode-label" for="quant__nav-mode--narrow">静态</label>
            </div>
            <div class="quant__nav-mode-wrapper">
                <input id="quant__nav-mode--free" class="quant__nav-mode" type="radio" name="nav-mode" value="free">
                <label class="quant__nav-mode-label" for="quant__nav-mode--free">自由导航</label>
            </div>
        </div>
        <!-- 简介部分 -->
        <div class="quant__intro">
            <div class="quant__intro-header">
                <h2 class="quant__intro-title">窥见X</h2>
                <button class="button-icon quant__intro--minimize" title="Hide Instruction"></button>
            </div>
            <div class="quant__intro-description">
                Welcome to your personal shader playground, where you can write your own and see how it looks in a cinematic 3D environment.<br><br>
                Few things to know:<br>
                <ul>
                    <li>The shader editing structure matches the same as the one in Shadertoy.com with the same predefined uniforms such as iResolution, iTime, etc. Except no texture, audio and framebuffer supported</li>
                    <li>There are other features including 2.5D through the alpha channel of fragColor. <button class="button-inline button__instructions" data-id="more-features" aria-label="more features">See here for more details</button></li>
                    <li>We don’t host your shaders, your shaders are automatically saved in your local machine through the localStorage API. You got 3 shader slots for localStorage. If you want to save and share your CineShader, please <button class="button-inline button__instructions" data-id="save-and-share" aria-label="Open the save and share instructions">follow these instructions</button></li>
                    <li>WebGL 2 by default and WebGL 1 fallback if the user’s browser doesn’t support WebGL 2</li>
                    <li>Need a reminder of the supported uniforms? <button class="button-inline button__instructions" data-id="shader-syntax" aria-label="Shader syntax">Here you go</button></li>
                    <li>If you want to convert your existing shaders from Shadertoy into a compatible shader, <button class="button-inline button__instructions" data-id="convert-your-shader" aria-label="Convert your shader">see here</button></li>
                    <li>Open your shadertoy in CineShader: <button class="button-default button__instructions" data-id="test-shadertoy" aria-label="test-shadertoy">ENTER HERE</button></li>
                </ul><br>
                We encourage you to add the <a class="button-inline" href="https://www.shadertoy.com/results?query=tag%3Dcineshader" target="_blank">cineshader</a> tag if you save your shaders on Shadertoy.
            </div>
        </div>
        <!-- 主内容 -->
        <div class="quant__main">
            <ul class="quant__tabs">
                <li class="quant__tab is-active" title="Slot 1">1</li>
                <li class="quant__tab" title="Slot 2">2</li>
                <li class="quant__tab" title="Slot 3">3</li>
            </ul>
            <div class="quant__buttons">
                <div class="quant__buttons-line">
                    <div class="group group--template">
                        <span class="group__name">模板：</span>
                        <div class="select-wrapper">
                            <select class="select-default"></select>
                        </div>
                        <button class="button-default button__load" aria-label="Load template">确定</button>
                    </div>
                    <div class="group group--model">
                        <span class="group__name">模型：</span>
                        <div class="select-wrapper">
                            <select class="select-default">
                                <option value="person">自己</option>
                                <option value="car">跑车</option>
                                <option value="nothing">清空</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="quant__buttons-line">
                    <div class="group group--title">
                        <span class="group__name">标题：</span>
                        <input class="group__input-text" type="text" value="My Shader">
                    </div>
                    <div class="group group--description">
                        <span class="group__name">描述：</span>
                        <input class="group__input-text" type="text" value="Lorem ipsum dolor">
                    </div>
                </div>
            </div>
            <div id="shader-quant" class="is-active">
                <div id="shader-quant-cm" class="is-active">
                    <!-- 搜索页面 -->
                    <div id="search-page">
                        <div class="search-header">
                            <button class="history-btn">历史</button>
                            <button class="logout-btn" onclick="handleLogout()">退出</button>
                        </div>
                        <div class="search-body">
                            <div class="search-history">
                                <h3>历史记录</h3>
                                <ul id="history-list"></ul>
                            </div>
                            <div class="search-content">
                                <div class="search-results">
                                    <ul id="results-list"></ul>
                                </div>
                                <div class="search-bar">
                                    <input type="text" placeholder="How can PeekX Help?" id="search-input">
                                    <button class="search-btn">搜索</button>
                                    <button class="random-btn">随机</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 认证容器 -->
                    <div class="auth-container" id="auth-container">
                        <div class="form-container sign-in-container">
                            <form action="#">
                                <h1>登录</h1>
                                <ul class="social">
                                    <li><a href="#"><i class="fab fa-twitter"></i></a></li>
                                    <li><a href="#"><i class="fab fa-github"></i></a></li>
                                    <li><a href="#"><i class="fab fa-linkedin"></i></a></li>
                                </ul>
                                <span>或使用您的帐户</span>
                                <input type="email" placeholder="邮箱地址" required />
                                <input type="password" placeholder="密码" required />
                                <a href="#">忘记密码？</a>
                                <button type="submit">登录</button>
                            </form>
                        </div>
                        <div class="form-container sign-up-container">
                            <form action="#">
                                <h1>创建账户</h1>
                                <ul class="social">
                                    <li><a href="#"><i class="fab fa-twitter"></i></a></li>
                                    <li><a href="#"><i class="fab fa-github"></i></a></li>
                                    <li><a href="#"><i class="fab fa-linkedin"></i></a></li>
                                </ul>
                                <span>或使用您的电子邮件注册</span>
                                <input type="text" placeholder="用户名或手机号码" required />
                                <input type="email" placeholder="邮箱地址" required />
                                <input type="password" placeholder="设置密码" required />
                                <button type="submit">注册</button>
                            </form>
                        </div>
                        <div class="overlay-container">
                            <div class="overlay">
                                <div class="overlay-panel overlay-left">
                                    <h1>欢迎回来！</h1>
                                    <p>请使用您的账户登录。</p>
                                    <button class="ghost" id="signIn">登录</button>
                                </div>
                                <div class="overlay-panel overlay-right">
                                    <h1>您好，朋友！</h1>
                                    <p>输入您的信息以创建账户，<br>开启新旅程。</p>
                                    <button class="ghost" id="signUp">注册</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 控制栏 -->
                <div class="quant__controls">
                    <div class="quant__controls-left">
                        <button class="button-default button__preview" aria-label="Preview shader">预览</button>
                        <span class="button-separator"></span>
                        <button class="button-default button__compile" aria-label="Compile shader" title="Alt + Enter">编译</button>
                        <button class="button-icon button__restart" aria-label="Restart shader time" title="Alt + Down">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16.9 26" xml:space="preserve">
                                <path d="M16.9 0v26L4.5 13 16.9 0M0 0h4.5v26H0z"/>
                            </svg>
                        </button>
                        <button class="button-icon button__pause" aria-label="Pause shader" title="Alt + Up">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 12.4 26" xml:space="preserve">
                                <path class="play" d="M0 26V0l12.4 13L0 26"/>
                                <path class="pause" d="M0 0h4.5v26H0zM7.9 0h4.5v26H7.9z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="quant__controls-right">
                        <span class="time">164.7</span>
                        <span class="fps">
                            <span class="fps-value">59</span>
                            fps
                        </span>
                        <span class="button-separator"></span>
                        <button class="button-icon button__screenshot" aria-label="Screenshot" title="HD snapshot">
                            <svg version="1.1" viewBox="0 0 16 16" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
                                <path d="m4.8 9c0 1.8 1.5 3.3 3.3 3.3s3.3-1.5 3.3-3.3-1.6-3.2-3.4-3.2-3.2 1.4-3.2 3.2zm10.2-5.5h-3.5c-0.3-1-0.5-2-1.5-2h-4c-1 0-1.3 1-1.5 2h-3.5c-0.6 0-1 0.4-1 1v9c0 0.6 0.4 1 1 1h14c0.6 0 1-0.4 1-1v-9c0-0.6-0.4-1-1-1zm-7 9.9c-2.5 0-4.4-2-4.4-4.4s2-4.4 4.4-4.4c2.5 0 4.4 2 4.4 4.4s-1.9 4.4-4.4 4.4zm7-6.9h-2v-1h2v1z"/>
                            </svg>
                        </button>
                        <span class="button-separator"></span>
                        <div class="quant__controls-view-quality select-wrapper">
                            <select class="select-default select-quality" title="View Quality">
                                <option value="0">最小</option>
                                <option value="1">低</option>
                                <option value="2">中 (隔行扫描)</option>
                                <option value="3">完整</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

### 二、CSS 与 DOM 元素的关系梳理

以下是 HTML 元素与对应 CSS 样式的映射，基于你之前提供的 CSS 文件。我将列出主要元素及其相关样式，并标注层级关系。

#### 1. 根容器：`.quant`
- **HTML**：`<div class="quant">`
- **CSS**：
  ```css
  .quant {
      position: absolute;
      left: 50%; /* 默认居中 */
      top: 0;
      width: 50%; /* 默认半宽 */
      height: 100%;
      background-color: #051015;
      padding: 5em 2.5em 20px;
      opacity: 0;
      pointer-events: none;
  }
  .quant.is-visible {
      pointer-events: all;
  }
  @media (max-width: 768px) {
      .quant {
          left: 0;
          opacity: 1;
          width: 100%; /* 手机端全宽 */
          pointer-events: auto;
      }
  }
  ```
- **关系**：最外层容器，控制整体布局和可见性。手机端调整为全宽。

#### 2. 内层容器：`.quant__inner`
- **HTML**：`<div class="quant__inner">`
- **CSS**：
  ```css
  .quant__inner {
      opacity: 0;
      transition: opacity 1s;
  }
  .quant.is-visible .quant__inner {
      opacity: 1; /* 可见时淡入 */
  }
  ```
- **关系**：`.quant` 的直接子元素，控制内容的淡入效果。

#### 3. 导航模式：`.quant__nav-modes`
- **HTML**：`<div class="quant__nav-modes">`
- **CSS**：
  ```css
  .quant__nav-modes {
      position: absolute;
      right: 100%;
      padding-right: 2em;
      bottom: 32px;
  }
  ```
- **子元素**：
  - `.quant__nav-mode-wrapper`
    ```css
    .quant__nav-mode-wrapper {
        position: relative;
        margin-top: 1.5ex;
        white-space: nowrap;
    }
    ```
  - `.quant__nav-mode`（`<input>`）
    ```css
    .quant__nav-mode {
        position: absolute;
        visibility: hidden;
    }
    ```
  - `.quant__nav-mode-label`（`<label>`）
    ```css
    .quant__nav-mode-label:before {
        position: absolute;
        right: 100%;
        content: '';
        width: 1em;
        height: 1em;
        margin-right: .4em;
        border: 1px solid #51585b;
        background-color: #051015;
    }
    .quant__nav-mode-label:after {
        display: none;
        position: absolute;
        top: 0;
        right: 100%;
        margin-right: calc(.65em + 1px);
        margin-top: calc(.25em + 1px);
        content: '';
        width: .5em;
        height: .5em;
        background-color: #c3c3c3;
    }
    .quant__nav-mode:checked ~ label:after {
        display: block; /* 选中时显示标记 */
    }
    ```
- **关系**：侧边导航栏，包含单选按钮，用于切换模式。

#### 4. 简介部分：`.quant__intro`
- **HTML**：`<div class="quant__intro">`
- **CSS**：
  ```css
  .quant__intro {
      border-top: 1px solid #51585b;
      overflow: hidden;
      max-height: 500px; /* 默认展开 */
  }
  .is-minimized .quant__intro {
      max-height: 3em; /* 折叠状态 */
  }
  ```
- **子元素**：
  - `.quant__intro-header`
    ```css
    .quant__intro-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    ```
  - `.quant__intro-title`（`<h2>`）
    ```css
    .quant__intro-title {
        font-size: 1.5em;
        font-weight: 100;
        margin: .75em 0 0;
    }
    ```
  - `.quant__intro--minimize`（`<button>`）
    ```css
    .quant__intro--minimize {
        margin-top: .75em;
        border: 1px solid #51585b;
        height: 22px;
        width: 22px;
        position: relative;
    }
    .quant__intro--minimize:before,
    .quant__intro--minimize:after {
        position: absolute;
        top: 10px;
        left: 7px;
        height: 1px;
        width: 6px;
        background-color: #51585b;
        content: '';
    }
    .quant__intro--minimize:after {
        opacity: 0;
        transform: rotate(90deg);
    }
    .is-minimized .quant__intro--minimize:after {
        opacity: 1;
    }
    ```
  - `.quant__intro-description`
    ```css
    .quant__intro-description {
        margin: 1em 0 .5em;
        overflow: visible;
        padding-bottom: .15em;
        font-size: .8em;
    }
    .quant__intro-description a,
    .quant__intro-description button {
        font-weight: 400;
        color: #00ffad;
    }
    ```
- **关系**：简介区域，包含标题和折叠按钮，默认展开，可通过 `.is-minimized` 控制。

#### 5. 主内容：`.quant__main`
- **HTML**：`<div class="quant__main">`
- **CSS**：
  ```css
  .quant__main {
      margin-top: 1em;
  }
  ```
- **子元素**：
  - `.quant__tabs`（`<ul>`）
    ```css
    .quant__tabs {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
    }
    ```
  - `.quant__tab`（`<li>`）
    ```css
    .quant__tab {
        width: 33.3333333%;
        border: 1px solid #51585b;
        padding: .5em 0;
    }
    .quant__tab + .quant__tab {
        border-left: none;
    }
    .quant__tab.is-active {
        background-color: #c3c3c3;
        border-color: #c3c3c3;
        color: #051015;
    }
    ```
  - `.quant__buttons`
    ```css
    .quant__buttons {
        border-left: 1px solid #51585b;
        border-right: 1px solid #51585b;
        padding: 1em 0;
    }
    ```
  - `.quant__buttons-line`
    ```css
    .quant__buttons-line {
        display: flex;
    }
    .quant__buttons-line + .quant__buttons-line {
        margin-top: 1em;
    }
    ```
  - `.group`
    ```css
    .group {
        width: 33.333333%;
    }
    .group--description {
        width: 66.6666%;
    }
    .group__name {
        display: block;
        margin-bottom: .2em;
    }
    ```
  - `.select-wrapper`
    ```css
    .select-wrapper {
        position: relative;
        display: inline-block;
    }
    .select-wrapper:after {
        position: absolute;
        right: .5em;
        top: .4em;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 4.5px 0;
        border-color: #c3c3c3 transparent transparent;
        content: "";
        pointer-events: none;
    }
    ```
  - `.select-default`（`<select>`）
    ```css
    .select-default {
        display: block;
        appearance: none;
        border: 1px solid #c3c3c3;
        background-color: transparent;
        color: #fff;
        font-family: inherit;
        outline: 0;
        padding: .2em 2em .2em .6em;
    }
    ```
  - `.group__input-text`（`<input>`）
    ```css
    .group--title .group__input-text {
        width: 70%;
    }
    .group--description .group__input-text {
        width: calc(100% - .8em);
    }
    ```

#### 6. Shader 编辑器：`#shader-quant`
- **HTML**：`<div id="shader-quant" class="is-active">`
- **CSS**：
  ```css
  #shader-quant {
      width: 100%;
      border: 1px solid #51585b;
      transition: border-color .3s linear;
  }
  #shader-quant.success {
      border-color: #00ffad;
  }
  #shader-quant.error {
      border-color: red;
  }
  ```
- **子元素**：
  - `#shader-quant-cm`
    ```css
    #shader-quant-cm {
        height: calc(100% - 40px);
    }
    ```
  - `.quant__controls`
    ```css
    .quant__controls {
        position: relative;
        height: 40px;
        min-height: 40px;
        background-color: #051015;
        border-top: 1px solid #51585b;
        padding: 0 .8em;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    ```
  - `.quant__controls-left`
    ```css
    .quant__controls-left {
        display: flex;
        align-items: center;
    }
    .quant__controls-left .button-icon {
        height: 18px;
        margin-left: .75em;
    }
    ```
  - `.button-default`
    ```css
    .button-default {
        border: 1px solid #c3c3c3;
        padding: .2em .6em;
        font-size: 14px;
        background-color: transparent;
        color: #fff;
    }
    ```
  - `.button-icon`
    ```css
    .button-icon {
        border: none;
        padding: .2em .6em;
        font-size: 14px;
    }
    ```
  - `.button-separator`
    ```css
    .button-separator {
        display: inline-block;
        width: 1px;
        height: .5em;
        margin: 0 .5em;
        background-color: #c3c3c3;
    }
    ```
  - `.quant__controls-right`
    ```css
    .time, .fps {
        min-width: 40px;
        display: inline-block;
        font-variant-numeric: tabular-nums;
    }
    .fps {
        margin-left: 1em;
    }
    ```

#### 7. 其他通用样式
- **按钮**：`.button-inline`
  ```css
  .button-inline {
      display: inline-block;
      position: relative;
      border: none;
      font-size: inherit;
      margin: 0;
      padding: 0;
  }
  ```
- **全局**：
  ```css
  * {
      box-sizing: border-box;
  }
  body {
      margin: 0;
      font-family: t26-carbon, monospace;
      background-color: #051015;
      color: #efefef;
  }
  ```

---

### 三、层级关系总结

```
.quant (根容器)
├── .quant__inner (内容容器)
│   ├── .quant__nav-modes (导航模式)
│   │   ├── .quant__nav-mode-wrapper
│   │   │   ├── .quant__nav-mode (<input>)
│   │   │   └── .quant__nav-mode-label (<label>)
│   ├── .quant__intro (简介)
│   │   ├── .quant__intro-header
│   │   │   ├── .quant__intro-title (<h2>)
│   │   │   └── .quant__intro--minimize (<button>)
│   │   └── .quant__intro-description
│   │       ├── <ul>
│   │       └── .button-inline
│   └── .quant__main (主内容)
│       ├── .quant__tabs (<ul>)
│       │   └── .quant__tab (<li>)
│       ├── .quant__buttons
│       │   ├── .quant__buttons-line
│       │   │   ├── .group .group--template
│       │   │   │   ├── .group__name (<span>)
│       │   │   │   ├── .select-wrapper
│       │   │   │   │   └── .select-default (<select>)
│       │   │   │   └── .button-default
│       │   │   └── .group .group--description
│       │   │       ├── .group__name (<span>)
│       │   │       └── .group__input-text (<input>)
│       └── #shader-quant
│           ├── #shader-quant-cm
│           │   ├── #search-page
│           │   └── .auth-container
│           └── .quant__controls
│               ├── .quant__controls-left
│               │   ├── .button-default
│               │   ├── .button-icon
│               │   └── .button-separator
│               └── .quant__controls-right
│                   ├── .time (<span>)
│                   ├── .fps (<span>)
│                   ├── .button-icon
│                   └── .select-wrapper
```

---

### 四、后续优化建议
1. **手机端调整**：
   - `.quant` 已调整为 `width: 100%`，确保手机端全宽。
   - `.quant__intro--minimize` 默认折叠（添加 `.is-minimized` 类）。
   - 检查 `#shader-quant-cm` 在手机端的高度是否需要进一步调整。
2. **交互性**：
   - 为 `.quant__intro--minimize` 添加点击事件，确保切换 `.is-minimized`。
   - 为 `.quant__tab` 添加切换逻辑。
