import {r as e, o as t, g as o, h as n, k as l, i, l as s, p as a, t as r, x as c, w as d, n as u, e as m, s as _, y as v, q as p, F as f, m as x, b as h, a as w, c as g, z as y, A as b, B as k, C as E, u as L, v as M} from "./runtime-dom.esm-bundler-cb82e4a9.js";
import {l as V, g as C, a as S, s as U, d as T, b as $, c as j, r as q, e as I, f as B, h as A, j as N, k as O, n as R, u as D, o as P, p as F, q as z, t as W, i as J} from "./util-1fabc922.js";
import {v as G, x as H} from "./index-9000aff5.js";
import {o as K, a as X, s as Y, g as Q, d as Z} from "./tool-aa30449a.js";
import {_ as ee, J as te, s as oe, i as ne} from "./chrome-runtime-promise-57dc646e.js";
import {i as le, g as ie, a as se, b as ae, c as re, I as ce, d as de, G as ue} from "./stat-ffa8f2e7.js";
const me = ["id"]
  , _e = ["onClick"]
  , ve = ee({
    __name: "content-mac",
    setup(r) {
        const c = "xl_chrome_ext_" + H
          , d = e(G)
          , u = e(!1)
          , m = e(!1)
          , _ = e("")
          , v = e("")
          , p = e([])
          , f = e(!1)
          , x = e([])
          , h = e(!1)
          , w = e(!1)
          , g = ()=>{
            V.info("downloadVideo", _.value),
            _.value && chrome.runtime.sendMessage({
                name: K.xl_download,
                linkUrl: v.value,
                refererUrl: document.location.href,
                cookie: document.cookie
            })
        }
        ;
        t(()=>{
            document.addEventListener("scroll", L),
            document.body.addEventListener("mousemove", M),
            window.self !== window.top && document.body.addEventListener("mouseout", E),
            document.addEventListener("scroll", L),
            j()
        }
        );
        const y = ()=>{
            const e = document.getElementById(c);
            e && (e.style.display = "none")
        }
          , b = ()=>{
            const e = document.getElementById(c);
            e && (e.remove(),
            document.body.removeEventListener("mousemove", M, !0),
            window.self !== window.top && document.body.removeEventListener("mouseout", E),
            document.body.removeEventListener("scroll", L),
            _.value = null,
            v.value = void 0,
            p.value = [])
        }
          , k = e=>{
            const t = document.getElementById(c);
            if (!t)
                return;
            t.style.display = "block",
            m.value = !0;
            const o = e.getBoundingClientRect()
              , n = `position:fixed;left: ${o.x + 4}px; top: ${o.y + 4}px; height: 30px; z-index: 10000000000 !important`;
            t.style = n,
            h.value || (h.value = !0,
            chrome.runtime.sendMessage({
                name: K.xl_video_show,
                referurl: document.location.href,
                videoSrc: e.src
            }))
        }
          , E = e=>{
            if (_.value) {
                const t = document.getElementById(G).contains(e.toElement);
                t || (_.value = null,
                v.value = void 0,
                V.info("isToChildDom :>> ", t),
                y())
            }
        }
          , L = ()=>{
            _.value && k(_.value)
        }
          , M = e=>{
            const t = document.elementFromPoint(e.x, e.y);
            if (!t)
                return;
            if ("video" === t.tagName.toLocaleLowerCase()) {
                const e = t.src || C(t);
                if (!e || 0 === e.toLocaleLowerCase().indexOf("blob:"))
                    return;
                if (t === _.value)
                    return;
                return _.value = t,
                v.value = e,
                k(t),
                void V.info("video src", v.value)
            }
            if (_.value) {
                if (!S(e, _.value))
                    return _.value = null,
                    v.value = void 0,
                    void y()
            } else {
                let t = null;
                for (const o of p.value)
                    if ("none" !== window.getComputedStyle(o).display)
                        if (S(e, o))
                            if (t) {
                                (Number(window.getComputedStyle(o).zIndex) || 0) > (Number(window.getComputedStyle(t).zIndex) || 0) && (t = o)
                            } else
                                t = o;
                        else if (t) {
                            const e = t.src || C(t);
                            e && 0 !== e.toLowerCase().indexOf("blob:") && (_.value = t,
                            v.value = e,
                            k(t))
                        }
                if (t) {
                    const e = t.src || C(t);
                    e && 0 !== e.toLowerCase().indexOf("blob:") && (_.value = t,
                    v.value = e,
                    k(t))
                }
            }
        }
          , $ = async()=>{
            chrome.runtime.sendMessage({
                name: K.xl_call_function,
                method: X.getWebsiteDomains
            }, async e=>{
                x.value = new Set(await e.websiteDomains);
                const t = T.exec(document.location.host)[2];
                w.value = x.value.has(t),
                V.warn((f.value ? "已安装xunlei" : "未安装xunlei") + " "),
                V.info("isInWebsiteDomains", w.value),
                f.value && !w.value && (u.value = !0)
            }
            )
        }
          , j = async()=>{
            V.info("init"),
            await (async()=>{
                const e = await chrome.runtime.sendMessage({
                    name: K.CheckEnabled
                });
                e && (f.value = e.isInstallThunder)
            }
            )(),
            await $();
            const e = document.getElementsByTagName("video");
            p.value = e,
            V.info("==========allVideos.value", p.value.length, "=========="),
            !p.value.length > 0 || U(p.value)
        }
        ;
        return (e,t)=>(o(),
        n("div", {
            class: l([e.$style["content-wrapper"], e.$style["mac-content-wrapper"]]),
            id: d.value
        }, [m.value ? (o(),
        n("div", {
            key: 0,
            class: l(e.$style["video-wrapper"])
        }, [i("div", {
            class: l([e.$style["options-wrapper"]])
        }, [i("div", {
            class: l(e.$style["xl-chrome-ext-bar__logo"])
        }, null, 2), i("div", {
            class: l([e.$style["xl-chrome-ext-tips"], e.$style.download]),
            onClick: s(g, ["stop"])
        }, [i("a", {
            id: "xl_chrome_ext_bar_download",
            class: l([e.$style["xl-chrome-ext-bar__option"]]),
            href: "javascript:;"
        }, null, 2), i("div", {
            class: l([e.$style["xl-chrome-ext-title"]])
        }, "下载视频", 2)], 10, _e), i("a", {
            id: "xl_chrome_ext_close",
            class: l([e.$style["xl-chrome-ext-bar__option"]]),
            title: "本次关闭",
            href: "javascript:;",
            onClick: b
        }, [i("div", {
            class: l(["xl-close img", [e.$style["xl-close"], e.$style.img]])
        }, null, 2)], 2)], 2)], 2)) : a("", !0)], 10, me))
    }
}, [["__cssModules", {
    $style: {
        video_op_wrapper: "_video_op_wrapper_1aqct_1",
        video_op_list: "_video_op_list_1aqct_1",
        op_icon: "_op_icon_1aqct_1",
        op_text: "_op_text_1aqct_1",
        op_item: "_op_item_1aqct_1",
        download: "_download_1aqct_1",
        play: "_play_1aqct_1",
        screen: "_screen_1aqct_1",
        "options-wrapper": "_options-wrapper_1aqct_20",
        "xl-chrome-ext-bar-toast": "_xl-chrome-ext-bar-toast_1aqct_14",
        "xl-chrome-ext-bar__logo": "_xl-chrome-ext-bar__logo_1aqct_1",
        "xl-chrome-ext-bar-toast__success": "_xl-chrome-ext-bar-toast__success_1aqct_1",
        "xl-chrome-ext-bar-toast__error": "_xl-chrome-ext-bar-toast__error_1aqct_1",
        "xl-chrome-ext-bar-toast__text": "_xl-chrome-ext-bar-toast__text_1aqct_1",
        "xl-chrome-ext-tips": "_xl-chrome-ext-tips_1aqct_1",
        "xl-chrome-ext-title": "_xl-chrome-ext-title_1aqct_1",
        "xl-chrome-ext-title--footer": "_xl-chrome-ext-title--footer_1aqct_1",
        "xl-chrome-ext-bar__option": "_xl-chrome-ext-bar__option_1aqct_1",
        img: "_img_1aqct_1",
        "xl-download": "_xl-download_1aqct_1",
        "xl-screen": "_xl-screen_1aqct_1",
        "xl-close": "_xl-close_1aqct_1",
        "content-wrapper": "_content-wrapper_1aqct_3",
        "video-wrapper": "_video-wrapper_1aqct_8",
        "mac-content-wrapper": "_mac-content-wrapper_1aqct_11"
    }
}]]);
function pe(e) {
    !function(e) {
        chrome.runtime.sendMessage(e)
    }({
        name: "xl_prompt_click",
        ...e
    })
}
const fe = ["id"]
  , xe = {
    class: "xl-chrome-ext-dialog__title"
}
  , he = c('<ul class="xl-chrome-ext-dialog__content"><li class="xl-chrome-ext-dialog__content-li"><div class="xl-chrome-ext-dialog__content-icon xl-download"></div><div class="xl-chrome-ext-dialog__content-text">一键读取网页中的可下载链接</div></li><li class="xl-chrome-ext-dialog__content-li"><div class="xl-chrome-ext-dialog__content-icon xl-video"></div><div class="xl-chrome-ext-dialog__content-text">网页视频下载、存云盘、投屏播放</div></li><li class="xl-chrome-ext-dialog__content-li"><div class="xl-chrome-ext-dialog__content-icon xl-picture"></div><div class="xl-chrome-ext-dialog__content-text">批量下载图片</div></li></ul>', 1)
  , we = {
    class: "xl-chrome-ext-dialog__footer"
}
  , ge = {
    __name: "ActionErrorDialog",
    props: {
        text: {
            type: String,
            required: !0
        }
    },
    emits: ["submit", "cancel"],
    setup(l) {
        const a = e($("action"));
        return t(async()=>{}
        ),
        (e,t)=>(o(),
        n("div", {
            class: "xl-chrome-ext-dialog",
            id: a.value
        }, [i("h2", xe, "无法" + r(l.text) + "，请安装迅雷客户端后重试", 1), i("a", {
            action: "close",
            href: "javascript:;",
            class: "xl-chrome-ext-dialog__close",
            title: "关闭",
            onClick: t[0] || (t[0] = s(t=>e.$emit("cancel", "close"), ["stop"]))
        }), he, i("div", we, [i("button", {
            onClick: t[1] || (t[1] = s(t=>e.$emit("submit", "install"), ["stop"])),
            action: "install",
            class: "xl-chrome-ext-dialog__button xl-download"
        }, " 迅雷高速下载 "), i("button", {
            onClick: t[2] || (t[2] = t=>e.$emit("cancel", "once-close")),
            action: "once-close",
            class: "xl-chrome-ext-dialog__button xl-close"
        }, " 取消 ")])], 8, fe))
    }
}
  , ye = {
    animate__bounceOutUp: "_animate__bounceOutUp_ti0wz_29",
    bounceInUp: "_bounceInUp_ti0wz_1",
    "xl-chrome-ext-footer__ball": "_xl-chrome-ext-footer__ball_ti0wz_33",
    "xl-chrome-ext-footer__name": "_xl-chrome-ext-footer__name_ti0wz_50"
}
  , be = {
    id: "xl-chrome-ext-footer",
    class: "xl-chrome-ext-footer"
}
  , ke = ["onClick", "onMouseenter", "onMouseleave", "onAnimationend"]
  , Ee = i("div", {
    class: "xl-chrome-ext-footer__logo"
}, null, -1)
  , Le = {
    class: "xl-chrome-ext-footer__quantity"
}
  , Me = ["onMouseenter", "onMouseleave", "onAnimationend"]
  , Ve = {
    key: 0,
    class: "xl-chrome-ext-footer__jsq"
}
  , Ce = {
    class: "xl-chrome-ext-footer__content"
}
  , Se = {
    class: "xl-chrome-ext-footer__text"
}
  , Ue = {
    class: "xl-chrome-ext-footer__action"
}
  , Te = ["onClick", "onMouseenter", "onMouseleave"]
  , $e = i("h3", null, "用迅雷享高速下载", -1)
  , je = i("div", {
    class: "xl-chrome-ext-footer__explain"
}, "当前页面含资源如下：", -1)
  , qe = {
    class: "xl-chrome-ext-footer__list"
}
  , Ie = ["data", "onClick"]
  , Be = i("div", {
    class: "xl-chrome-ext-footer__action-name"
}, "下载", -1)
  , Ae = ["onClick", "onMouseenter", "onMouseleave"]
  , Ne = {
    class: "xl-chrome-ext-footer__action-name"
}
  , Oe = {
    class: "xl-chrome-ext-footer__button-text"
}
  , Re = i("h3", null, "存迅雷云盘，享高清播放、高速下载", -1)
  , De = i("div", {
    class: "xl-chrome-ext-footer__explain"
}, "当前页面含资源如下：", -1)
  , Pe = {
    class: "xl-chrome-ext-footer__list"
}
  , Fe = ["onClick"]
  , ze = {
    class: "xl-chrome-ext-footer__button-text"
}
  , We = {
    key: 0,
    class: "xl-chrome-ext-footer__agreement"
}
  , Je = i("span", null, "启用插件访问在线视频时，插件将在播放窗口展示对播放链接的快捷功能", -1)
  , Ge = ["onClick"]
  , He = {
    class: "xl-chrome-ext-footer__close-wrapper"
}
  , Ke = {
    class: "xl-chrome-ext-tips"
}
  , Xe = ["onClick"]
  , Ye = i("div", {
    class: "xl-chrome-ext-title xl-chrome-ext-title--footer"
}, "本次关闭", -1)
  , Qe = ee({
    __name: "Footer",
    props: {
        resourceList: {
            type: Object,
            required: !0
        },
        exception: {
            type: Boolean,
            required: !0
        },
        isShowJsqEntry: {
            type: Boolean,
            required: !0
        },
        jsqText: {
            type: Object,
            required: !0
        }
    },
    emits: ["removeFooter", "showActionError", "showVersionError", "handleDownload", "handleCloseBar"],
    setup(c, {emit: h}) {
        const w = h
          , g = c
          , y = e(null)
          , b = e(!1)
          , k = e(null)
          , E = e(null)
          , L = e(!1)
          , M = e(!1)
          , V = e(!1)
          , C = e(0)
          , S = e(0)
          , U = e(null)
          , T = e(null)
          , $ = e(!1)
          , j = e(!0)
          , q = e(g.resourceList.playList.length === g.resourceList.length)
          , I = e(0 === g.resourceList.saveList.length);
        function B() {
            b.value = !0,
            y.value = setTimeout(()=>{
                b.value = !1
            }
            , 5e3)
        }
        function A() {
            $.value = !0,
            g.resourceList.downloadList.length > 0 && u(()=>{
                if (U.value) {
                    const {height: e} = window.getComputedStyle(U.value);
                    C.value = `-${parseFloat(e) + 16}px`
                }
            }
            ),
            g.resourceList.saveList.length > 0 && u(()=>{
                if (T.value) {
                    const {height: e} = window.getComputedStyle(T.value);
                    S.value = `-${parseFloat(e) + 16}px`
                }
            }
            )
        }
        function N(e) {
            return e.isInIframe && ".m3u8" === e.suffix && (e.fileName = Q(e.suffix, e.url)),
            e.fileName
        }
        function O() {
            E.value = setTimeout(()=>{
                M.value = !1
            }
            , 300)
        }
        function R() {
            E.value && clearTimeout(E.value),
            M.value = !0
        }
        function D() {
            z(g.resourceList.saveList[0])
        }
        function P() {
            k.value = setTimeout(()=>{
                V.value = !1
            }
            , 300)
        }
        function F() {
            k.value && clearTimeout(k.value),
            V.value = !0
        }
        async function z(e) {
            const t = e;
            if (g.exception)
                return w("showActionError", "流畅播", "fluent_play"),
                void chrome.runtime.sendMessage({
                    name: "xl_cloudadd_stat",
                    from: "bottom_bar",
                    isSuccess: !1,
                    data: t
                });
            if (t.isVideoURL) {
                L.value = !0;
                const {isAccept: e} = await chrome.runtime.sendMessage({
                    name: "xl_check_blacklist"
                });
                if (L.value = !1,
                !e)
                    return chrome.runtime.sendMessage({
                        name: "xl_show_toast",
                        text: "链接异常，无法流畅播",
                        type: "info"
                    }),
                    void chrome.runtime.sendMessage({
                        name: "xl_cloudadd_stat",
                        from: "bottom_bar",
                        isSuccess: !1,
                        data: t
                    })
            }
            var o;
            (o = t).suffix && chrome.runtime.sendMessage({
                name: "xl_cloudadd",
                from: "bottom_bar",
                data: {
                    opt: "web:cloudadd",
                    params: {
                        url: o.url,
                        name: o.fileName,
                        ext: o.suffix,
                        isVideo: o.isVideoURL,
                        cookie: document.cookie,
                        webTitle: document.title
                    }
                },
                isM3U8Video: ".m3u8" === o.suffix
            }, e=>{
                e && ("version" === e.errType && w("showVersionError", e.text),
                chrome.runtime.sendMessage({
                    name: "xl_cloudadd_stat",
                    from: "bottom_bar",
                    isSuccess: e.result,
                    data: o
                }))
            }
            )
        }
        function W() {
            if (g.exception) {
                w("showActionError", "下载", "download");
                const e = g.resourceList.downloadList[0];
                chrome.runtime.sendMessage({
                    name: "xl_download_stat",
                    link: e.url,
                    stat: e.isVideoURL ? "chrome_download_video" : "chrome_download_other",
                    from: "bottom_bar",
                    status: "fail"
                })
            } else {
                J(g.resourceList.downloadList[0])
            }
        }
        function J(e) {
            chrome.runtime.sendMessage({
                name: "xl_download",
                link: e.url,
                cookie: document.cookie,
                referurl: document.location.href,
                stat: e.isVideoURL ? "chrome_download_video" : "chrome_download_other",
                from: "bottom_bar",
                isM3U8Video: ".m3u8" === e.suffix
            }, e=>{
                e && "version" === e.errType && w("showVersionError", e.text)
            }
            )
        }
        d(b, e=>{
            !0 === e && A()
        }
        );
        const G = e(!0);
        function H() {
            chrome.runtime.sendMessage({
                name: "xl_footer_other_click",
                clickId: "close"
            }),
            w("removeFooter")
        }
        function K() {
            chrome.storage.local.set({
                isAgreementVisible: !1
            }),
            j.value = !1
        }
        function X() {
            const e = G.value ? "fix_bar" : "release_bar";
            G.value = !G.value,
            b.value = !G.value,
            chrome.runtime.sendMessage({
                name: "xl_footer_other_click",
                clickId: e
            })
        }
        function Z() {
            y.value && clearTimeout(y.value),
            b.value || (b.value = !0)
        }
        function ee() {
            G.value && (b.value = !1)
        }
        function oe() {
            G.value && (E.value = setTimeout(()=>{
                b.value = !1
            }
            , 800))
        }
        function ne() {
            y.value && clearTimeout(y.value),
            E.value && clearTimeout(E.value),
            G.value && (b.value = !0)
        }
        function le() {
            const e = document.querySelector("#xl-chrome-ext-footer");
            if (!e.nextSibling)
                return;
            e.parentElement.appendChild(e)
        }
        return chrome.storage.local.get("isAgreementVisible", e=>{
            e && !1 === e.isAgreementVisible ? j.value = !1 : j.value = !0
        }
        ),
        t(()=>{
            chrome.runtime.sendMessage({
                name: "xl_footer_show",
                url: document.location.href,
                downloadShow: 0 !== g.resourceList.downloadList.length ? 1 : 0,
                playShow: !I.value && q.value ? 1 : 0,
                saveShow: I.value || q.value ? 0 : 1,
                resourceList: JSON.stringify(g.resourceList)
            }),
            Y(le, 3e5, !0)
        }
        ),
        (e,t)=>(o(),
        n("div", be, [i("div", {
            class: l(["", [e.$style.animate__bounceOutUp, e.$style["xl-chrome-ext-footer__ball"]]]),
            onClick: s(X, ["stop"]),
            onMouseenter: s(Z, ["stop"]),
            onMouseleave: s(ee, ["stop"]),
            onAnimationend: s(B, ["stop"])
        }, [Ee, i("div", Le, r(c.resourceList.length), 1)], 42, ke), i("div", {
            onMouseenter: s(ne, ["stop"]),
            onMouseleave: s(oe, ["stop"]),
            onAnimationend: s(A, ["stop"]),
            class: l({
                "xl-chrome-ext-footer__bar": !0,
                "xl-chrome-ext-footer__bar--show": b.value
            })
        }, [c.isShowJsqEntry ? (o(),
        n("div", Ve, [m(te, {
            source: "footer",
            text: c.jsqText
        }, null, 8, ["text"])])) : a("", !0), i("div", Ce, [i("p", Se, " 检测到页面存在 " + r(c.resourceList.length <= 99 ? c.resourceList.length : 99) + " 个资源 ", 1), i("div", Ue, [_(i("div", {
            class: "xl-chrome-ext-footer__url download",
            onClick: s(W, ["stop"]),
            onMouseenter: s(R, ["stop"]),
            onMouseleave: s(O, ["stop"])
        }, [c.resourceList.downloadList.length > 0 ? (o(),
        n("div", {
            key: 0,
            ref_key: "downloadPopoverRef",
            ref: U,
            style: p({
                top: C.value
            }),
            class: l({
                "xl-chrome-ext-footer__popover": !0,
                "xl-chrome-ext-footer__popover--show": M.value,
                "xl-chrome-ext-footer__popover--hidden": !M.value
            })
        }, [$e, je, i("ul", qe, [(o(!0),
        n(f, null, x(c.resourceList.downloadList, (t,a)=>(o(),
        n("li", {
            class: "xl-chrome-ext-footer__item",
            key: a
        }, [i("div", {
            class: l({
                "xl-chrome-ext-footer__type": !0,
                "xl-video": t.isVideoURL,
                "xl-link": !t.isVideoURL
            })
        }, null, 2), i("div", {
            class: l(e.$style["xl-chrome-ext-footer__name"])
        }, r(N(t)), 3), i("button", {
            type: "download",
            data: JSON.stringify(t),
            onClick: s(e=>{
                return o = t,
                void (g.exception ? (w("showActionError", "下载", "download"),
                chrome.runtime.sendMessage({
                    name: "xl_download_stat",
                    link: o.url,
                    stat: o.isVideoURL ? "chrome_download_video" : "chrome_download_other",
                    from: "bottom_bar",
                    status: "fail"
                })) : J(o));
                var o
            }
            , ["stop"])
        }, " 下载 ", 8, Ie)]))), 128))])], 6)) : a("", !0), Be], 40, Te), [[v, c.resourceList.downloadList.length > 0]]), c.resourceList.saveList.length > 0 ? (o(),
        n("div", {
            key: 0,
            class: "xl-chrome-ext-footer__url cloudAdd",
            onClick: s(D, ["stop"]),
            onMouseenter: s(F, ["stop"]),
            onMouseleave: s(P, ["stop"])
        }, [i("div", Ne, [i("div", {
            class: l({
                "xl-chrome-ext-footer__button-icon": !0,
                loading: L.value,
                save: !q.value,
                play: !!q.value
            })
        }, null, 2), i("span", Oe, r(L.value ? "添加中" : q.value ? "流畅播" : "存云盘"), 1)]), c.resourceList.saveList.length > 0 ? (o(),
        n("div", {
            key: 0,
            ref_key: "cloudAddPopoverRef",
            ref: T,
            style: p({
                top: S.value
            }),
            class: l({
                "xl-chrome-ext-footer__popover": !0,
                "xl-chrome-ext-footer__popover--show": V.value,
                "xl-chrome-ext-footer__popover--hidden": !V.value
            })
        }, [Re, De, i("ul", Pe, [(o(!0),
        n(f, null, x(c.resourceList.saveList, (t,a)=>(o(),
        n("li", {
            class: "xl-chrome-ext-footer__item",
            key: a
        }, [i("div", {
            class: l({
                "xl-chrome-ext-footer__type": !0,
                "xl-video": t.isVideoURL,
                "xl-link": !t.isVideoURL
            })
        }, null, 2), i("div", {
            class: l(e.$style["xl-chrome-ext-footer__name"])
        }, r(N(t)), 3), i("button", {
            onClick: s(e=>function(e, t) {
                z(t)
            }(0, t), ["stop"])
        }, [i("div", {
            class: l({
                "xl-chrome-ext-footer__button-icon": !0,
                small: !0,
                loading: L.value,
                save: !t.isVideoURL,
                play: !!t.isVideoURL
            })
        }, null, 2), i("span", ze, r(t.isVideoURL ? "流畅播" : "存云盘"), 1)], 8, Fe)]))), 128))])], 6)) : a("", !0)], 40, Ae)) : a("", !0)]), j.value ? (o(),
        n("div", We, [Je, i("span", {
            class: "xl-chrome-ext-footer__know",
            onClick: s(K, ["stop"])
        }, "我知道了", 8, Ge)])) : a("", !0), i("div", He, [i("div", Ke, [i("div", {
            class: "xl-chrome-ext-footer__close",
            onClick: s(H, ["stop"])
        }, null, 8, Xe), Ye])])])], 42, Me)]))
    }
}, [["__cssModules", {
    $style: ye
}]])
  , Ze = ["id"]
  , et = i("h2", {
    class: "xl-chrome-ext-dialog__title"
}, "浏览器无法直接打开磁力链等特殊格式链接", -1)
  , tt = c('<ul class="xl-chrome-ext-dialog__content"><li class="xl-chrome-ext-dialog__content-li"><div class="xl-chrome-ext-dialog__content-icon xl-download"></div><div class="xl-chrome-ext-dialog__content-text">高速下载：基础加速、超级通道、会员加速三重加速</div></li><li class="xl-chrome-ext-dialog__content-li"><div class="xl-chrome-ext-dialog__content-icon xl-compatible"></div><div class="xl-chrome-ext-dialog__content-text">强大兼容：支持磁力、种子、在线视频</div></li><li class="xl-chrome-ext-dialog__content-li"><div class="xl-chrome-ext-dialog__content-icon xl-pan"></div><div class="xl-chrome-ext-dialog__content-text">超大云盘：最高12TB备份</div></li></ul>', 1)
  , ot = {
    class: "xl-chrome-ext-dialog__footer"
}
  , nt = {
    __name: "ResourceDialog",
    emits: ["submit", "cancel"],
    setup(l) {
        const a = e($("resource"));
        return t(async()=>{}
        ),
        (e,t)=>(o(),
        n("div", {
            class: "xl-chrome-ext-dialog",
            id: a.value
        }, [et, i("a", {
            action: "close",
            href: "javascript:;",
            class: "xl-chrome-ext-dialog__close",
            title: "关闭",
            onClick: t[0] || (t[0] = s(t=>e.$emit("cancel", "close"), ["stop"]))
        }), tt, i("div", ot, [i("button", {
            action: "install",
            class: "xl-chrome-ext-dialog__button xl-download",
            onClick: t[1] || (t[1] = s(t=>e.$emit("submit", "install"), ["stop"]))
        }, " 迅雷高速下载 "), i("button", {
            action: "close",
            class: "xl-chrome-ext-dialog__button xl-close",
            onClick: t[2] || (t[2] = s(t=>e.$emit("cancel", "close"), ["stop"]))
        }, " 取消 ")])], 8, Ze))
    }
};
const lt = new class {
    constructor() {
        this.options = {
            enabled: !0,
            colors: {
                info: "#0000FF",
                warn: "#FFA500",
                error: "#FF0000",
                log: "#000000"
            }
        }
    }
    setEnabled(e) {
        this.options.enabled = e
    }
    setColors(e) {
        this.options.colors = {
            ...this.options.colors,
            ...e
        }
    }
    logMessage(e, t, ...o) {
        if (!this.options.enabled)
            return;
        this.options.colors[e]
    }
    info(e, ...t) {
        this.logMessage("info", e, ...t)
    }
    warn(e, ...t) {
        this.logMessage("warn", e, ...t)
    }
    error(e, ...t) {
        this.logMessage("error", e, ...t)
    }
    log(e, ...t) {
        this.logMessage("log", e, ...t)
    }
}
  , it = ["onMouseenter", "onMouseleave", "onClick"]
  , st = ee({
    __name: "link-badge-win",
    emits: ["showVersionError"],
    setup(a, {emit: r}) {
        const c = r;
        e([]);
        const d = "badge_wrapper_" + H
          , u = e(null)
          , m = e(null)
          , _ = e("");
        e(null);
        const v = e(!1);
        e({
            top: 0,
            left: 0
        }),
        e(1e3);
        const p = q;
        function f() {
            lt.info("badge tag click", m.value);
            const e = {
                link: _.value,
                stat: "chrome_download_other"
            };
            lt.info("badge tag click", e),
            async function({link: e=""}) {
                const t = {
                    link: e,
                    stat: "chrome_download_other",
                    isM3U8Video: !1
                };
                try {
                    const e = await async function({fileName: e="", link: t="", stat: o=""}) {
                        return await chrome.runtime.sendMessage({
                            name: "xl_download",
                            link: t,
                            fileName: e,
                            cookie: document.cookie,
                            referurl: document.location.href,
                            stat: o,
                            from: v.value ? "text_hover" : "link_hover",
                            isInIframe: j(),
                            isM3U8Video: !1
                        })
                    }(t);
                    lt.info("badge dl resp", e)
                } catch (o) {
                    "version" === (null == o ? void 0 : o.errType) && (lt.info("badge dl error", null == o ? void 0 : o.text),
                    c("showVersionError", null == o ? void 0 : o.text))
                }
            }(e)
        }
        const x = ()=>{
            lt.log("enter badge浮层")
        }
          , w = ()=>{
            g()
        }
        ;
        function g() {
            try {
                u.value.style.display = "none"
            } catch (e) {
                lt.warn("hideLinkPopover", e)
            }
        }
        const y = e=>{
            const t = e.target
              , o = t.href || ""
              , n = function(e) {
                let t = "";
                return e.childNodes.forEach(e=>{
                    e.nodeType === Node.TEXT_NODE && (t += e.textContent.trim())
                }
                ),
                t
            }(t)
              , l = p.test(o)
              , i = p.test(n);
            (l || i) && (e.preventDefault(),
            _.value = l ? o : n,
            m.value = t,
            v.value = !l,
            function(e, t) {
                const o = u.value;
                o.style.display = "flex";
                const n = o.getBoundingClientRect()
                  , l = t.getBoundingClientRect()
                  , i = e.clientX - n.width / 4
                  , s = l.top - n.height;
                o.style.left = i + "px",
                o.style.top = s + "px"
            }(e, t),
            chrome.runtime.sendMessage({
                name: "xl_stat",
                eventId: 977,
                extParam: {
                    value2: _.value,
                    value7: v.value ? "text_hover" : "link_hover"
                }
            }))
        }
        ;
        function b(e) {
            var t;
            (null == (t = null == e ? void 0 : e.toElement) ? void 0 : t.id.includes(d)) || e.target !== m.value || g()
        }
        return t(()=>{
            lt.info("link-badge onMounted"),
            document.body.addEventListener("mouseenter", y, !0),
            document.body.addEventListener("mouseleave", b, !0)
        }
        ),
        h(()=>{
            document.body.removeEventListener("mouseenter", y, !0),
            clearTimeout(null),
            lt.info("link-badge onUnmounted")
        }
        ),
        (e,t)=>(o(),
        n("div", {
            class: l([d, e.$style.badge_wrapper]),
            id: d,
            ref_key: "linkPopRef",
            ref: u,
            onMouseenter: s(x, ["stop"]),
            onMouseleave: s(w, ["stop"]),
            onClick: s(f, ["stop"])
        }, [i("div", {
            class: l(e.$style.logo)
        }, null, 2), i("span", {
            class: l(e.$style.line)
        }, null, 2), i("div", {
            class: l(e.$style.text_wrapper)
        }, [i("span", {
            class: l(e.$style.download_icon)
        }, null, 2), i("span", {
            class: l(e.$style.text)
        }, "高速下载", 2)], 2)], 42, it))
    }
}, [["__cssModules", {
    $style: {
        badge_wrapper: "_badge_wrapper_eor63_1",
        logo: "_logo_eor63_20",
        line: "_line_eor63_27",
        text_wrapper: "_text_wrapper_eor63_33",
        download_icon: "_download_icon_eor63_39",
        text: "_text_eor63_33"
    }
}]])
  , at = {
    class: "dialog-wrapper xly-dialog-prompt"
}
  , rt = [i("i", {
    class: "xl-icon-close"
}, null, -1)]
  , ct = {
    class: "xly-dialog-prompt__text"
}
  , dt = i("p", {
    class: "xly-dialog-prompt__text"
}, "（升级提示：主菜单-检查更新）", -1)
  , ut = {
    class: "xly-dialog-prompt__footer"
}
  , mt = {
    class: "xly-dialog-prompt__button"
}
  , _t = {
    __name: "VersionError",
    props: {
        text: {
            type: String,
            required: !0
        }
    },
    emits: ["submit", "cancel"],
    setup: (e,{emit: l})=>(t(async()=>{}
    ),
    (t,l)=>(o(),
    n("div", at, [i("h2", null, r(e.text) + "调用失败", 1), i("a", {
        action: "close",
        href: "javascript:;",
        onClick: l[0] || (l[0] = s(e=>t.$emit("cancel", "close"), ["stop"])),
        class: "xly-dialog-close",
        title: "关闭"
    }, rt), i("p", ct, "客户端版本过低，无法启用" + r(e.text) + "。", 1), dt, i("div", ut, [i("div", mt, [i("button", {
        action: "close",
        class: "td-button--other",
        style: {
            width: "65px",
            "border-radius": "4px"
        },
        onClick: l[1] || (l[1] = e=>t.$emit("cancel", "close"))
    }, " 取消 "), i("button", {
        action: "startThunder",
        class: "td-button",
        onClick: l[2] || (l[2] = s(e=>t.$emit("submit", "startThunder"), ["stop"]))
    }, "前往升级")])])])))
}
  , vt = {
    video_op_wrapper: "_video_op_wrapper_pujw6_1",
    video_op_list: "_video_op_list_pujw6_1",
    op_icon: "_op_icon_pujw6_1",
    op_text: "_op_text_pujw6_1",
    op_item: "_op_item_pujw6_1",
    download: "_download_pujw6_1",
    play: "_play_pujw6_1",
    screen: "_screen_pujw6_1",
    "options-wrapper": "_options-wrapper_pujw6_3",
    "xl-chrome-ext-bar-toast": "_xl-chrome-ext-bar-toast_pujw6_15",
    "xl-chrome-ext-bar__logo": "_xl-chrome-ext-bar__logo_pujw6_30",
    "xl-chrome-ext-bar-toast__success": "_xl-chrome-ext-bar-toast__success_pujw6_38",
    "xl-chrome-ext-bar-toast__error": "_xl-chrome-ext-bar-toast__error_pujw6_46",
    "xl-chrome-ext-bar-toast__text": "_xl-chrome-ext-bar-toast__text_pujw6_54",
    "xl-chrome-ext-tips": "_xl-chrome-ext-tips_pujw6_62",
    "xl-chrome-ext-title": "_xl-chrome-ext-title_pujw6_69",
    "xl-chrome-ext-title--footer": "_xl-chrome-ext-title--footer_pujw6_74",
    "xl-chrome-ext-bar__option": "_xl-chrome-ext-bar__option_pujw6_78",
    img: "_img_pujw6_94",
    "xl-download": "_xl-download_pujw6_101",
    "xl-screen": "_xl-screen_pujw6_105",
    "xl-close": "_xl-close_pujw6_109"
}
  , pt = ["onClick"]
  , ft = ["onClick"]
  , xt = ["onClick"]
  , ht = ["onClick"]
  , wt = ee({
    __name: "VideoTagV1",
    props: {
        latestVideoSrc: {
            type: String,
            required: !0
        },
        latestVideoElement: {
            type: Object,
            required: !1,
            default: ()=>({})
        },
        exception: {
            type: Boolean,
            required: !0
        },
        isShowVideoTag: {
            type: Boolean,
            required: !0
        },
        isShowDownloadBar: {
            type: Boolean,
            required: !0
        },
        isShowCloudAddBar: {
            type: Boolean,
            required: !0
        }
    },
    emits: ["showActionError", "showVersionError", "handleDownload", "handleCloseBar"],
    setup(c, {emit: d}) {
        const u = d
          , m = c
          , p = e(!1)
          , x = e("")
          , h = e("success")
          , g = e(null)
          , y = w({
            isM3U8Video: !1,
            M3U8VideoUrl: ""
        });
        function b() {
            if (m.exception)
                return u("showActionError", "下载", "download"),
                void chrome.runtime.sendMessage({
                    name: "xl_download_stat",
                    link: y.M3U8VideoUrl || m.latestVideoSrc,
                    stat: "chrome_download_video",
                    from: "video_hover",
                    status: "fail",
                    videoUIVersion: "v1"
                });
            !function() {
                do {
                    if (!m.latestVideoElement)
                        break;
                    const e = m.latestVideoElement;
                    if (!m.latestVideoSrc)
                        break;
                    let t = ""
                      , o = "";
                    if (document.title) {
                        const n = document.title.replace(/[*?/:|<>"]/g, "");
                        n && (o = I(B(m.latestVideoSrc)),
                        o || (o = L(e)),
                        t = `${n}${o}`)
                    }
                    chrome.runtime.sendMessage({
                        name: "xl_download",
                        link: y.M3U8VideoUrl || m.latestVideoSrc,
                        cookie: document.cookie,
                        referurl: document.location.href,
                        fileName: t,
                        stat: "chrome_download_video",
                        from: "video_hover",
                        isInIframe: j(),
                        isM3U8Video: !!y.M3U8VideoUrl,
                        videoUIVersion: "v1"
                    })
                } while (0)
            }()
        }
        async function k() {
            const e = A(y.M3U8VideoUrl || m.latestVideoSrc)
              , t = {
                from: "video_hover",
                data: {
                    opt: "web:cloudadd",
                    params: {
                        url: e.url,
                        name: e.fileName,
                        ext: e.suffix,
                        isVideo: e.isVideoURL
                    }
                }
            };
            if (j() ? t.name = "xl_cloudadd_in_iframe" : (t.name = "xl_cloudadd",
            t.cookie = document.cookie,
            t.webTitle = document.title),
            m.exception)
                return u("showActionError", "流畅播", "fluent_play"),
                void chrome.runtime.sendMessage({
                    name: "xl_cloudadd_stat",
                    from: "video_hover",
                    isSuccess: !1,
                    data: e
                });
            const {isAccept: o} = await chrome.runtime.sendMessage({
                name: "xl_check_blacklist"
            });
            if (!o)
                return chrome.runtime.sendMessage({
                    name: "xl_show_toast",
                    text: "链接异常，无法流畅播。",
                    type: "info"
                }),
                void chrome.runtime.sendMessage({
                    name: "xl_cloudadd_stat",
                    from: "video_hover",
                    isSuccess: !1,
                    data: e
                });
            chrome.runtime.sendMessage(t, e=>{
                e && "version" === e.errType && u("showVersionError", e.text)
            }
            )
        }
        function E() {
            if (m.exception)
                return void u("showActionError", "投屏", "projection");
            const e = {
                url: m.latestVideoSrc,
                name: document.title,
                playForm: document.referrer,
                dlnaPlay: !0,
                stat: "browser_plugin_tv_sp_click"
            };
            chrome.runtime.sendMessage({
                name: "xl_screen",
                type: "click",
                videoUIVersion: "v1",
                data: {
                    opt: "web:play",
                    params: e
                }
            }, e=>{
                e && "version" === e.errType && u("showVersionError", "投屏")
            }
            )
        }
        function L(e) {
            let t = void 0;
            for (let o = 0; o < e.children.length; o++) {
                const n = e.children[o];
                if ("source" === n.tagName.toLowerCase() && n.type) {
                    const e = n.type.split("/");
                    e.length > 0 && (t = e[e.length - 1]);
                    break
                }
            }
            return t ? "." + t : ""
        }
        function M() {
            navigator.clipboard ? chrome.runtime.sendMessage({
                name: "xl_copy",
                text: y.M3U8VideoUrl || m.latestVideoSrc
            }, e=>{
                e.status && V({
                    isShow: !0,
                    msg: "复制成功",
                    type: "success"
                })
            }
            ) : V({
                isShow: !0,
                msg: "复制失败",
                type: "error"
            })
        }
        function V(e) {
            const {isShow: t, msg: o, type: n} = e;
            p.value = t,
            x.value = o,
            h.value = n,
            g.value && clearTimeout(g.value),
            g.value = setTimeout(()=>{
                p.value = !1
            }
            , 1500)
        }
        return t(async()=>{
            chrome.runtime.sendMessage({
                name: "xl_screen",
                type: "init",
                videoUIVersion: "v1",
                data: {
                    params: {
                        playForm: document.referrer
                    }
                }
            }, e=>{
                y.isM3U8Video = (null == e ? void 0 : e.isM3U8Video) || !1,
                y.M3U8VideoUrl = (null == e ? void 0 : e.M3U8VideoUrl) || ""
            }
            )
        }
        ),
        (e,t)=>(o(),
        n(f, null, [p.value ? (o(),
        n("div", {
            key: 0,
            class: l([e.$style["xl-chrome-ext-bar-toast"]])
        }, [i("div", {
            class: l(["success" === h.value ? e.$style["xl-chrome-ext-bar-toast__success"] : "", "error" === h.value ? e.$style["xl-chrome-ext-bar-toast__error"] : ""])
        }, null, 2), i("div", {
            class: l([e.$style["xl-chrome-ext-bar-toast__text"]])
        }, r(x.value), 3)], 2)) : a("", !0), _(i("div", {
            class: l([e.$style["options-wrapper"]])
        }, [i("a", {
            onClick: t[0] || (t[0] = s(t=>e.$emit("handleCloseBar"), ["stop"])),
            id: "xl_chrome_ext_bar_close",
            href: "javascript:;"
        }), i("div", {
            class: l(e.$style["xl-chrome-ext-bar__logo"])
        }, null, 2), c.isShowCloudAddBar ? (o(),
        n("div", {
            key: 0,
            class: l([e.$style["xl-chrome-ext-tips"], e.$style["cloud-add"]]),
            onClick: s(k, ["stop"])
        }, [i("a", {
            id: "xl_chrome_ext_bar_cloudAdd",
            class: l(e.$style["xl-chrome-ext-bar__option"]),
            href: "javascript:;"
        }, null, 2), i("div", {
            class: l(e.$style["xl-chrome-ext-title"])
        }, "流畅播", 2)], 10, pt)) : a("", !0), c.isShowDownloadBar ? (o(),
        n("div", {
            key: 1,
            class: l([e.$style["xl-chrome-ext-tips"], e.$style.download]),
            onClick: s(b, ["stop"])
        }, [i("a", {
            id: "xl_chrome_ext_bar_download",
            class: l([e.$style["xl-chrome-ext-bar__option"]]),
            href: "javascript:;"
        }, null, 2), i("div", {
            class: l([e.$style["xl-chrome-ext-title"]])
        }, "下载视频", 2)], 10, ft)) : a("", !0), i("div", {
            onClick: s(E, ["stop"]),
            class: l([e.$style["xl-chrome-ext-tips"]])
        }, [i("a", {
            id: "xl_chrome_ext_bar_screen",
            href: "javascript:;",
            class: l([e.$style["xl-chrome-ext-bar__option"]])
        }, null, 2), i("div", {
            class: l([e.$style["xl-chrome-ext-title"]])
        }, "投屏", 2)], 10, xt), i("div", {
            onClick: s(M, ["stop"]),
            class: l([e.$style["xl-chrome-ext-tips"]])
        }, [i("a", {
            id: "xl_chrome_ext_bar_copy",
            class: l([e.$style["xl-chrome-ext-bar__option"]]),
            href: "javascript:;"
        }, null, 2), i("div", {
            class: l([e.$style["xl-chrome-ext-title"]])
        }, "复制链接", 2)], 10, ht)], 2), [[v, c.isShowVideoTag]])], 64))
    }
}, [["__cssModules", {
    $style: vt
}]])
  , gt = ["onClick"]
  , yt = ee({
    __name: "VideoTagV2",
    props: {
        latestVideoSrc: {
            type: String,
            required: !0
        },
        latestVideoElement: {
            type: Object,
            required: !1,
            default: ()=>({})
        },
        exception: {
            type: Boolean,
            required: !0
        },
        isShowVideoTag: {
            type: Boolean,
            required: !0
        },
        isShowDownloadBar: {
            type: Boolean,
            required: !0
        },
        isShowCloudAddBar: {
            type: Boolean,
            required: !0
        }
    },
    emits: ["showActionError", "showVersionError", "handleDownload", "handleCloseBar"],
    setup(a, {emit: c}) {
        const u = c
          , m = a;
        e(!1),
        e(""),
        e("success"),
        e(null);
        const p = w({
            isM3U8Video: !1,
            M3U8VideoUrl: ""
        });
        t(()=>{}
        ),
        d(p, e=>{}
        );
        const h = e([{
            text: "下载",
            id: "download",
            icon: "download"
        }, {
            text: "流畅播",
            id: "play",
            icon: "play"
        }, {
            text: "投屏",
            id: "screen",
            icon: "screen"
        }])
          , y = g(()=>{
            let e = [...h.value];
            return m.isShowCloudAddBar || (e = e.filter(e=>"play" !== e.id)),
            e
        }
        );
        function b(e) {
            switch (e.id) {
            case "download":
                !function() {
                    if (lt.info("badge tag click"),
                    m.exception)
                        return u("showActionError", "下载", "download"),
                        void chrome.runtime.sendMessage({
                            name: "xl_download_stat",
                            link: p.M3U8VideoUrl || m.latestVideoSrc,
                            stat: "chrome_download_video",
                            from: "video_hover",
                            status: "fail",
                            videoUIVersion: "v2"
                        });
                    !function() {
                        if (!m.latestVideoElement)
                            return;
                        const e = m.latestVideoElement;
                        if (!m.latestVideoSrc)
                            return;
                        let t = ""
                          , o = "";
                        if (document.title) {
                            const n = document.title.replace(/[*?/:|<>"]/g, "");
                            n && (o = I(B(m.latestVideoSrc)),
                            o || (o = function(e) {
                                let t = void 0;
                                for (let o = 0; o < e.children.length; o++) {
                                    const n = e.children[o];
                                    if ("source" === n.tagName.toLowerCase() && n.type) {
                                        const e = n.type.split("/");
                                        e.length > 0 && (t = e[e.length - 1]);
                                        break
                                    }
                                }
                                return t ? "." + t : ""
                            }(e)),
                            t = `${n}${o}`)
                        }
                        !function({fileName: e="", link: t=""}) {
                            chrome.runtime.sendMessage({
                                name: "xl_download",
                                link: t,
                                fileName: e,
                                cookie: document.cookie,
                                referurl: document.location.href,
                                stat: "chrome_download_video",
                                from: "video_hover",
                                isInIframe: j(),
                                isM3U8Video: !!p.M3U8VideoUrl,
                                videoUIVersion: "v2"
                            })
                        }({
                            link: p.M3U8VideoUrl || m.latestVideoSrc,
                            fileName: t
                        })
                    }()
                }();
                break;
            case "screen":
                !function() {
                    if (m.exception)
                        return void u("showActionError", "投屏", "projection");
                    const e = {
                        url: m.latestVideoSrc,
                        name: document.title,
                        playForm: document.referrer,
                        dlnaPlay: !0,
                        stat: "browser_plugin_tv_sp_click"
                    };
                    chrome.runtime.sendMessage({
                        name: "xl_screen",
                        type: "click",
                        videoUIVersion: "v2",
                        data: {
                            opt: "web:play",
                            params: e
                        }
                    }, e=>{
                        e && "version" === e.errType && u("showVersionError", "投屏")
                    }
                    )
                }();
                break;
            case "play":
                !async function() {
                    const e = A(p.M3U8VideoUrl || m.latestVideoSrc)
                      , t = {
                        from: "video_hover",
                        data: {
                            opt: "web:cloudadd",
                            params: {
                                url: e.url,
                                name: e.fileName,
                                ext: e.suffix,
                                isVideo: e.isVideoURL
                            }
                        }
                    };
                    j() ? t.name = "xl_cloudadd_in_iframe" : (t.name = "xl_cloudadd",
                    t.cookie = document.cookie,
                    t.webTitle = document.title);
                    if (m.exception)
                        return u("showActionError", "流畅播", "fluent_play"),
                        void chrome.runtime.sendMessage({
                            name: "xl_cloudadd_stat",
                            from: "video_hover",
                            isSuccess: !1,
                            data: e
                        });
                    const {isAccept: o} = await chrome.runtime.sendMessage({
                        name: "xl_check_blacklist"
                    });
                    if (!o)
                        return chrome.runtime.sendMessage({
                            name: "xl_show_toast",
                            text: "链接异常，无法流畅播。",
                            type: "info"
                        }),
                        void chrome.runtime.sendMessage({
                            name: "xl_cloudadd_stat",
                            from: "video_hover",
                            isSuccess: !1,
                            data: e
                        });
                    chrome.runtime.sendMessage(t, e=>{
                        e && "version" === e.errType && u("showVersionError", e.text)
                    }
                    )
                }()
            }
        }
        function k() {
            chrome.runtime.sendMessage({
                name: "xl_screen",
                type: "init",
                videoUIVersion: "v2",
                data: {
                    params: {
                        playForm: document.referrer
                    }
                }
            }),
            setTimeout(()=>{
                p.M3U8VideoUrl || m.latestVideoSrc
            }
            , 2e3)
        }
        return t(async()=>{
            chrome.runtime.onMessage.addListener((e,t,o)=>{
                var n, l;
                "newM3u8Request" === e.action && (p.isM3U8Video = (null == (n = null == e ? void 0 : e.data) ? void 0 : n.isM3U8Video) || !1,
                p.M3U8VideoUrl = (null == (l = null == e ? void 0 : e.data) ? void 0 : l.url) || "",
                k())
            }
            )
        }
        ),
        (e,t)=>_((o(),
        n("div", {
            class: l([e.$style.video_op_wrapper])
        }, [i("ul", {
            class: l(e.$style.video_op_list)
        }, [(o(!0),
        n(f, null, x(y.value, (t,a)=>(o(),
        n("li", {
            key: a,
            class: l([e.$style.op_item, e.$style[t.id]]),
            onClick: s(e=>b(t), ["stop"])
        }, [i("span", {
            class: l(e.$style.op_icon)
        }, null, 2), i("span", {
            class: l(e.$style.op_text)
        }, r(t.text), 3)], 10, gt))), 128))], 2)], 2)), [[v, a.isShowVideoTag]])
    }
}, [["__cssModules", {
    $style: {
        video_op_wrapper: "_video_op_wrapper_96mx8_1",
        video_op_list: "_video_op_list_96mx8_17",
        op_icon: "_op_icon_96mx8_25",
        op_text: "_op_text_96mx8_31",
        op_item: "_op_item_96mx8_39",
        download: "_download_96mx8_45",
        play: "_play_96mx8_48",
        screen: "_screen_96mx8_51"
    }
}]])
  , bt = ["id"]
  , kt = ee({
    __name: "videoTag",
    setup(t) {
        const l = e(G)
          , i = e(null);
        return async function() {
            try {
                const e = await oe({
                    name: "GetConfig"
                });
                if (e) {
                    const t = (null == e ? void 0 : e.videoTagVersion) || "v2";
                    i.value = "v2" === t ? yt : wt
                }
            } catch (e) {}
        }(),
        (e,t)=>(o(),
        n("div", {
            id: l.value
        }, [(o(),
        y(E(i.value), b(k(e.$attrs)), null, 16))], 8, bt))
    }
}, [["__cssModules", {
    $style: vt
}]]);
function Et() {
    this.states = {},
    this._current = void 0
}
Et.prototype.start = function(e) {
    if (void 0 !== this._current)
        throw "State machine already started";
    if (null == e)
        throw "Please give a valid state name";
    setTimeout(Et._changeState, 0, this, e)
}
,
Et.prototype.fireEvent = function(e, t) {
    if (void 0 === this._current)
        throw "State machine not started";
    if (null === this._current)
        throw "State machine terminated";
    setTimeout(Et._handleEvent, 0, this, e, t)
}
,
Et._changeState = function(e, t) {
    if (null !== t && !e.states.hasOwnProperty(t))
        throw e._current = null,
        'No such state "' + t + '"';
    let o = e._current;
    if (void 0 !== o && o.hasOwnProperty("__exit__") && o.__exit__.apply(e),
    null === t)
        return void (e._current = null);
    if (o = e._current = e.states[t],
    !o.hasOwnProperty("__enter__"))
        return;
    const n = o.__enter__.apply(e);
    void 0 !== n && setTimeout(Et._changeState, 0, e, n)
}
,
Et._handleEvent = function(e, t, o) {
    let n = e._current[t];
    "function" == typeof n && (n = n.apply(e, o)),
    void 0 !== n && setTimeout(Et._changeState, 0, e, n)
}
;
let Lt = {};
const Mt = {
    glass: "ncennffkjdiamlpmcbajkmaiiiddgioo-glass",
    help: "ncennffkjdiamlpmcbajkmaiiiddgioo-help",
    overlay: "ncennffkjdiamlpmcbajkmaiiiddgioo-overlay"
}
  , Vt = {
    closing: "ncennffkjdiamlpmcbajkmaiiiddgioo-closing",
    exiting: "ncennffkjdiamlpmcbajkmaiiiddgioo-exiting",
    inverted: "ncennffkjdiamlpmcbajkmaiiiddgioo-inverted",
    invisible: "ncennffkjdiamlpmcbajkmaiiiddgioo-invisible",
    loading: "ncennffkjdiamlpmcbajkmaiiiddgioo-loading",
    relative: "ncennffkjdiamlpmcbajkmaiiiddgioo-relative",
    selected: "ncennffkjdiamlpmcbajkmaiiiddgioo-selected",
    selectionRectangle: "ncennffkjdiamlpmcbajkmaiiiddgioo-selection-rectangle"
};
function Ct() {
    this._invertedSelection = !1,
    this._curpos = {
        x: 0,
        y: 0
    },
    this._selectableElements = [],
    this._visibleElements = [];
    const e = this
      , t = document.createElement("div");
    t.id = Mt.overlay;
    const o = document.createElement("div");
    o.id = Mt.glass;
    const n = document.createElement("div");
    n.id = Mt.help,
    n.innerHTML = chrome.i18n.getMessage("usage"),
    n.onmouseover = function() {
        n.classList.add(Vt.invisible)
    }
    ,
    n.onmouseout = function() {
        n.classList.remove(Vt.invisible)
    }
    ;
    const l = function(e) {
        e.preventDefault(),
        e.stopPropagation()
    }
      , i = function(t) {
        e._curpos.x = t.clientX,
        e._curpos.y = t.clientY
    };
    let s = null;
    const a = {
        contextmenu: function(e) {
            l(e)
        },
        mousemove: function(t) {
            i(t),
            e.sm.fireEvent("mousemove")
        },
        mousedown: function(t) {
            if (null === s && (0 == t.button || 2 == t.button)) {
                switch (s = 0 == t.button ? t.ctrlKey ? 1 : 0 : 2,
                s) {
                case 0:
                    i(t),
                    e.sm.fireEvent("mousedown");
                    break;
                case 1:
                case 2:
                    i(t),
                    e.sm.fireEvent("alt_mousedown")
                }
                l(t)
            }
        },
        mouseup: function(t) {
            if (null !== s && (t.button == s || 0 == t.button || 1 == s)) {
                switch (t.button) {
                case 0:
                    i(t),
                    e.sm.fireEvent(1 == s ? "alt_mouseup" : "mouseup");
                    break;
                case 2:
                    i(t),
                    e.sm.fireEvent("alt_mouseup")
                }
                s = null,
                l(t)
            }
        },
        keydown: function(t) {
            if (t.isTrusted) {
                switch (t.keyCode) {
                case 13:
                    e.sm.fireEvent("req_download");
                    break;
                case 27:
                    e.sm.fireEvent("req_exit");
                    break;
                default:
                    return
                }
                l(t)
            }
        },
        resize: function() {
            let t = null;
            const o = function() {
                t = null,
                e.updateVisibleElements()
            };
            return function() {
                null !== t && clearTimeout(t),
                t = setTimeout(o, 100)
            }
        }(),
        scroll: function() {
            let t = null;
            const o = function() {
                t = null,
                e.updateVisibleElements()
            };
            return function() {
                null !== t && clearTimeout(t),
                t = setTimeout(o, 100)
            }
        }()
    };
    document.addEventListener("contextmenu", a.contextmenu),
    document.addEventListener("scroll", a.scroll),
    window.addEventListener("resize", a.resize),
    document.addEventListener("keydown", a.keydown, !0),
    document.body.addEventListener("mousedown", a.mousedown, !0),
    document.body.addEventListener("mouseup", a.mouseup, !0),
    t.appendChild(n),
    t.appendChild(o);
    const r = new Et;
    r.states.load = {
        __enter__: function() {
            document.documentElement.classList.add(Vt.loading),
            document.body.appendChild(t),
            t.addEventListener("webkitTransitionEnd", (function o() {
                t.removeEventListener("webkitTransitionEnd", o),
                e.sm.fireEvent("load_done")
            }
            )),
            setTimeout((function() {
                e.populate(),
                e.updateVisibleElements(),
                document.documentElement.classList.remove(Vt.loading)
            }
            ), 0)
        },
        load_done: "idle"
    },
    r.states.exit = {
        __enter__: function() {
            e._cursel && m(),
            document.removeEventListener("mousemove", a.mousemove),
            document.removeEventListener("scroll", a.scroll),
            window.removeEventListener("resize", a.resize),
            document.removeEventListener("contextmenu", a.contextmenu),
            document.removeEventListener("keydown", a.keydown, !0),
            document.body.removeEventListener("mousedown", a.mousedown, !0),
            document.body.removeEventListener("mouseup", a.mouseup, !0),
            e._selectableElements.forEach((function(e) {
                e._private.delegate.classList.remove(Vt.selected),
                e._private.delegate.classList.remove(Vt.relative),
                delete e._private
            }
            ));
            const o = ()=>{
                t.removeEventListener("webkitTransitionEnd", o),
                document.body.removeChild(t),
                document.documentElement.classList.remove(Vt.exiting),
                e.sm.fireEvent("exit_done")
            }
            ;
            t.addEventListener("webkitTransitionEnd", o),
            document.documentElement.classList.add(Vt.exiting)
        },
        __exit__: function() {
            Lt.instance = null
        },
        exit_done: null
    },
    r.states.idle = {
        mousedown: "selection",
        alt_mousedown: "deselection",
        req_exit: "exit",
        req_download: "action-download"
    };
    let c = null
      , d = null;
    const u = function() {
        const t = document.createElement("div");
        t.classList.add(Vt.selectionRectangle),
        t.style.left = e._curpos.x + "px",
        t.style.top = e._curpos.y + "px",
        e._invertedSelection && t.classList.add(Vt.inverted),
        e._cursel = document.body.appendChild(t),
        e._startpos = {
            x: e._curpos.x,
            y: e._curpos.y
        },
        e._selrect = {
            x: e._curpos.x,
            y: e._curpos.y,
            w: 0,
            h: 0
        },
        e._lastDrawn = {},
        c = setInterval(e.drawSelection.bind(e), 30),
        d = setInterval(e.calcSelectedElements.bind(e), 30),
        document.addEventListener("mousemove", a.mousemove)
    }
      , m = function() {
        document.removeEventListener("mousemove", a.mousemove),
        clearInterval(c),
        clearInterval(d),
        c = null,
        d = null,
        e.calcSelectedElements();
        for (const t in e._selectableElements) {
            const o = e._selectableElements[t]._private;
            o.selected = o.selected2
        }
        return e._cursel.addEventListener("webkitTransitionEnd", function() {
            document.body.removeChild(this)
        }
        .bind(e._cursel)),
        e._cursel.classList.add(Vt.closing),
        delete e._cursel,
        delete e._startpos,
        delete e._selrect,
        delete e._lastDrawn,
        "idle"
    }
      , _ = function() {
        if (!e._startpos)
            return;
        const t = e._startpos
          , o = e._curpos
          , n = e._selrect;
        n.x = Math.min(t.x, o.x),
        n.y = Math.min(t.y, o.y),
        n.w = Math.abs(t.x - o.x),
        n.h = Math.abs(t.y - o.y)
    };
    r.states.selection = {
        __enter__: function() {
            e._invertedSelection = !1,
            u()
        },
        mousemove: _,
        mouseup: m,
        req_exit: "exit"
    },
    r.states.deselection = {
        __enter__: function() {
            e._invertedSelection = !0,
            u()
        },
        mousemove: _,
        alt_mouseup: m,
        req_exit: "exit"
    },
    r.states["action-download"] = {
        __enter__: function() {
            const t = function(e) {
                const t = {};
                return e.forEach((function(e) {
                    if (e._private.selected) {
                        const o = function(e) {
                            let t = e.href;
                            do {
                                const o = e.getAttribute("thunderhref");
                                if (o) {
                                    t = o;
                                    break
                                }
                                if (null === e.getAttribute("thundertype"))
                                    break;
                                const n = e.attributes.length;
                                if (n <= 0)
                                    break;
                                for (let l = 0; l < n; l++) {
                                    const o = e.attributes[l].value;
                                    if (o && 0 === o.toLowerCase().indexOf("thunder://")) {
                                        t = o;
                                        break
                                    }
                                }
                            } while (0);
                            return t
                        }(e);
                        t[o] = null
                    }
                }
                )),
                Object.keys(t)
            }(e._selectableElements);
            chrome.runtime.sendMessage({
                name: "xl_download_multi",
                referurl: document.location.href,
                cookie: document.cookie,
                urls: t
            }),
            e.sm.fireEvent("done")
        },
        done: "exit"
    },
    this.sm = r
}
function St(e, t) {
    for (const o in e)
        e[o].classList.add(Vt.selected);
    for (const o in t)
        t[o].classList.remove(Vt.selected)
}
function Ut(e, t) {
    return !(e.bottom < t.y || t.y + t.h < e.top || e.right < t.x || t.x + t.w < e.left)
}
Ct.prototype.populate = function() {
    const e = document.links
      , t = /^javascript:/;
    for (let o = 0; o < e.length; o++) {
        const n = e[o];
        if (null == n.href || t.test(n.href))
            continue;
        let l = n;
        const i = n.getElementsByTagName("img");
        i.length && (l = i[0]),
        n._private = {
            selected: !1,
            selected2: !1,
            delegate: l,
            positionfix: !1
        },
        this._selectableElements.push(n)
    }
}
,
Ct.prototype.updateVisibleElements = function() {
    const e = {
        x: 0,
        y: 0,
        w: window.innerWidth,
        h: window.innerHeight
    }
      , t = this._visibleElements
      , o = this._selectableElements;
    t.splice(0);
    for (const n in o) {
        const l = o[n]
          , i = l._private
          , s = i.delegate;
        Ut(s.getBoundingClientRect(), e) && (t.push(l),
        i.positionfix || (i.positionfix = !0,
        "static" == window.getComputedStyle(s).position && s.classList.add(Vt.relative)))
    }
}
,
Ct.prototype.drawSelection = function() {
    const e = this._selrect
      , t = this._lastDrawn
      , o = this._cursel.style;
    e.x == t.x && e.y == t.y && e.w == t.w && e.h == t.h || (o.left = (t.x = e.x) + "px",
    o.top = (t.y = e.y) + "px",
    o.width = (t.w = e.w) + "px",
    o.height = (t.h = e.h) + "px")
}
,
Ct.prototype.calcSelectedElements = function() {
    const e = this._visibleElements
      , t = this._selrect
      , o = []
      , n = [];
    for (const l in e) {
        const i = e[l]._private
          , s = i.delegate
          , a = i.delegate.getClientRects();
        let r = !1;
        for (let e = 0; e < a.length; e++) {
            if (Ut(a[e], t)) {
                r = !0;
                break
            }
        }
        const c = r ? !this._invertedSelection : i.selected;
        c != i.selected2 && ((c ? o : n).push(s),
        i.selected2 = c)
    }
    (o || n) && setTimeout(St, 0, o, n)
}
,
Lt = {
    instance: null,
    enter: function() {
        null === Lt.instance && (Lt.instance = new Ct,
        Lt.instance.sm.start("load"),
        chrome.runtime.sendMessage({
            name: "xl_download_multi_start",
            referurl: document.location.href
        }))
    },
    quit: function() {
        Lt.instance && Lt.instance.sm.fireEvent("req_exit")
    },
    download: function() {
        Lt.instance && Lt.instance.sm.fireEvent("req_download")
    }
};
const Tt = Lt
  , $t = ee({
    __name: "content-win",
    setup(i) {
        const s = "xl_chrome_ext_" + H;
        e(null),
        e(null),
        e(null);
        const r = e({})
          , c = e(!1)
          , u = e("v2")
          , _ = e("")
          , v = e({})
          , p = e(!1)
          , f = e(!1)
          , x = e(!1)
          , g = e(!1)
          , b = e(!1)
          , k = e("");
        e(null);
        const E = e(!1)
          , M = e(!1)
          , C = e(!1)
          , S = e(!1)
          , T = e(!1)
          , $ = e("")
          , q = e("")
          , I = e("")
          , B = e(!1)
          , J = e("")
          , K = e(!1)
          , X = e(null)
          , Y = e(!1)
          , Q = e(null)
          , ee = w({
            isM3U8Video: !1,
            M3U8VideoUrl: ""
        })
          , te = w({
            downloadList: [],
            playList: {
                M3U8List: [],
                normalVideoList: [],
                length: 0
            },
            saveList: [],
            length: 0
        });
        let me, _e, ve, fe, xe, he, we = !1, ye = !1, be = !1, ke = !1, Ee = !1, Le = !0, Me = !0, Ve = !1, Ce = null, Se = [], Ue = new Set, Te = null, $e = null;
        function je(e) {
            E.value = !1,
            pe({
                action: e,
                source: q.value,
                stat: "xl_action_error"
            })
        }
        function qe(e) {
            je(e)
        }
        function Ie(e) {
            T.value = !1,
            pe({
                action: e
            })
        }
        function Be(e) {
            Ie(e)
        }
        function Ae(e) {
            B.value = !1,
            pe({
                action: e,
                stat: "xl_reminder_install"
            })
        }
        function Ne(e) {
            Ae(e)
        }
        function Oe() {
            B.value = !0,
            chrome.runtime.sendMessage({
                name: "xl_prompt_show"
            })
        }
        function Re(e) {
            T.value = !0,
            I.value = e
        }
        function De() {
            M.value = !1,
            tt(),
            f.value = !0,
            chrome.runtime.sendMessage({
                name: "xl_screen",
                type: "close",
                stat: "browser_plugin_close_click",
                videoUIVersion: u.value
            })
        }
        function Pe(e, t) {
            return 0 != e.length && (0 != ke && (0 != function(e) {
                if (0 == e.length)
                    return !1;
                const t = e
                  , o = t.indexOf(":");
                if (-1 == o)
                    return !1;
                const n = t.substr(0, o + 1).toUpperCase();
                if ("" == n)
                    return !1;
                let l = !0;
                return -1 != F.indexOf(n) ? 0 == we && (l = !1) : -1 != z.indexOf(n) ? 0 == ye && (l = !1) : -1 != W.indexOf(n) ? 0 == be && (l = !1) : l = !1,
                l
            }(e) && (0 != function(e) {
                if (0 == e.length)
                    return !0;
                const t = []
                  , o = fe.split("||");
                for (const i in o) {
                    const e = o[i].slice(2).trimRight("|");
                    t.push(e)
                }
                let n = !0;
                const l = e;
                for (const i in t)
                    if (t[i].length > 0 && -1 != l.indexOf(t[i])) {
                        n = !1;
                        break
                    }
                return n
            }(t) && (!de(t, xe) && 0 != function(e) {
                if (0 == e.length)
                    return !1;
                const t = e.indexOf(":");
                if (-1 == t)
                    return !1;
                const o = e.toLowerCase();
                if ("xlapp://" == o.substr(0, t + 3).trimLeft(" "))
                    return !0;
                if (-1 != o.indexOf("ed2k://") || -1 != o.indexOf("magnet:?"))
                    return !0;
                let n = !1
                  , l = ue(o);
                return l.length > 0 && (l += ";",
                -1 != he.indexOf(l) && (n = !0)),
                n
            }(e)))))
        }
        function Fe(e) {
            return t = e,
            document.cookie,
            o = document.location.href,
            !ce(t) && Pe(t, o);
            var t, o
        }
        function ze(e) {
            var t;
            if (e.ctrlKey)
                return;
            if (!e.isTrusted)
                return;
            const o = (null == (t = null == e ? void 0 : e.target) ? void 0 : t.href) || "";
            if (me && _e && ve) {
                let t = re(o);
                if (null != t)
                    return;
                if (t = Fe(o),
                t)
                    return chrome.runtime.sendMessage({
                        name: "xl_download",
                        link: o,
                        cookie: document.cookie,
                        referurl: document.location.href
                    }),
                    e.stopPropagation(),
                    void e.preventDefault()
            } else
                K.value && ((n = (n = o).toLowerCase()).startsWith("thunder://") || n.startsWith("ed2k://") || n.startsWith("magnet:?") || n.includes(".torrent")) && chrome.runtime.sendMessage({
                    name: "xl_prompt_enable"
                }, (function(e) {
                    e && e.enable && Oe()
                }
                ));
            var n
        }
        function We() {
            V.info("RegisterClickEventListener", x.value, document.links);
            const e = e=>{
                ze(e)
            }
            ;
            if (x.value)
                for (const t of document.links)
                    t.addEventListener("click", e, !1);
            else
                for (const t of document.links)
                    t.outerHTML.match(O),
                    t.addEventListener("click", e, !1)
        }
        function Je() {
            document.getElementById(s);
            M.value = !1
        }
        async function Ge(e) {
            do {
                if (f.value)
                    break;
                const {M3U8VideoUrl: t} = ee
                  , o = document.getElementById(s)
                  , n = A(t || J.value);
                o.style.display = "block";
                const l = o.querySelector(".xl-chrome-ext-tips.cloud-add")
                  , i = o.querySelector(".xl-chrome-ext-tips.download")
                  , a = R(Te, n.suffix, n.protocol)
                  , r = R($e, n.suffix, n.protocol);
                l && !a && (S.value = !1),
                i && !r && (C.value = !1);
                const c = e.getBoundingClientRect();
                let d = "position: fixed !important; z-index: 10000000000 !important;";
                d += `left: ${c.x + 4}px; top: ${c.y + 4}px;`,
                b.value && (k.value = `top:${c.y + 16}px`),
                o.style = d,
                Ee || (Ee = !0,
                chrome.runtime.sendMessage({
                    name: "VideoShow",
                    referurl: document.location.href,
                    hasDownload: r,
                    videoSrc: e.src,
                    videoUIVersion: u.value
                }, (function() {}
                ))),
                M.value = !0,
                D(o)
            } while (0)
        }
        function He(e) {
            e.isTrusted && (e.ctrlKey && chrome.runtime.sendMessage({
                name: "EnabledCapture",
                capture: !1
            }, (function() {}
            )),
            window.top !== window.self && chrome.runtime.sendMessage({
                name: "xl_chrome_iframe_keydown",
                keyCode: e.keyCode
            }))
        }
        function Ke(e) {
            if (e.isTrusted && (e.ctrlKey && chrome.runtime.sendMessage({
                name: "EnabledCapture",
                capture: !0
            }, (function() {}
            )),
            Me))
                switch (e.keyCode) {
                case 68:
                    e.shiftKey && (le() || me && (window.top === window.self ? Tt.enter() : chrome.runtime.sendMessage({
                        name: "xl_chrome_iframe_multi_hotkey"
                    })))
                }
        }
        function Xe(e) {
            var t, o;
            try {
                const n = document.elementFromPoint(e.x, e.y);
                do {
                    if (!n)
                        break;
                    if (null == (t = null == n ? void 0 : n.tagName) || t.toUpperCase(),
                    "VIDEO" === (null == (o = null == n ? void 0 : n.tagName) ? void 0 : o.toUpperCase())) {
                        const {isM3U8Video: e} = ee
                          , t = n.src || ie(n, e);
                        if (!t)
                            break;
                        if (0 === (null == t ? void 0 : t.toLowerCase().indexOf("blob:")) && !e)
                            break;
                        if (n === X.value)
                            break;
                        X.value = n,
                        J.value = t || "",
                        Ge(n);
                        break
                    }
                    if (X.value) {
                        if (!se(e, X.value)) {
                            X.value = null,
                            J.value = "",
                            Je();
                            break
                        }
                    } else {
                        const t = document.getElementsByTagName("video");
                        if (Se = t,
                        0 === Se.length)
                            break;
                        let o = null;
                        for (let n = 0; n < Se.length; n++) {
                            const t = Se[n];
                            if ("none" !== window.getComputedStyle(t).display)
                                if (se(e, t))
                                    if (o) {
                                        const e = Number(window.getComputedStyle(t).zIndex) || 0;
                                        e > (Number(window.getComputedStyle(o).zIndex) || 0) && (o = t)
                                    } else
                                        o = t;
                                else if (o)
                                    break
                        }
                        if (o) {
                            const e = o.src || ie(o)
                              , {isM3U8Video: t} = ee;
                            (e && 0 !== e.toLowerCase().indexOf("blob:") || t) && (X.value = o,
                            J.value = e,
                            Ge(o));
                            break
                        }
                    }
                } while (0)
            } catch (n) {}
        }
        function Ye(e) {
            const t = document.getElementById(G).contains(e.toElement);
            X.value && (t || (X.value = null,
            J.value = "",
            Je()))
        }
        function Ze(e) {
            Xe(e)
        }
        function et() {
            X.value && Ge(X.value)
        }
        function tt() {
            document.body.removeEventListener("mousemove", Xe, !0),
            window.self !== window.top && document.body.removeEventListener("mouseout", Ye),
            document.body.removeEventListener("wheel", Ze),
            document.removeEventListener("scroll", et),
            X.value = null,
            J.value = "",
            Se = [],
            Ce && (Ce.disconnect(),
            Ce = null)
        }
        function ot() {
            return window.top === window.self
        }
        function lt(e) {
            if ("data" === e.data.type && ot())
                try {
                    const t = JSON.parse(e.data.payload);
                    Object.assign(te, {
                        ...t
                    }),
                    c.value = !0
                } catch (t) {}
        }
        function it(e, t) {
            chrome.runtime.sendMessage({
                name: "xl_show_action_error_dialog",
                source: t
            }),
            E.value = !0,
            $.value = e,
            q.value = t
        }
        function at() {
            Le && Ve && !f.value && (tt(),
            async function() {
                do {
                    if (Ce)
                        break;
                    let t = null;
                    try {
                        t = window.top.document.getElementsByTagName("title")[0]
                    } catch (e) {}
                    t && (Ce = new MutationObserver((function() {
                        const e = document.getElementsByTagName("video");
                        Se = e
                    }
                    )),
                    Ce.observe(t, {
                        childList: !0
                    })),
                    Se = await P(),
                    U(Se)
                } while (0)
            }(),
            document.body.addEventListener("mousemove", Xe, !0),
            window.self !== window.top && document.body.addEventListener("mouseout", Ye),
            document.body.addEventListener("wheel", Ze),
            document.addEventListener("scroll", et))
        }
        function rt() {
            chrome.runtime.onMessage.addListener((e,t,o)=>{
                "newM3u8Request" === e.action && (ee.isM3U8Video = e.data.isM3U8Video,
                ee.M3U8VideoUrl = e.data.url,
                chrome.runtime.sendMessage({
                    name: "xl_screen",
                    type: "init",
                    data: {
                        params: {
                            playForm: document.referrer
                        }
                    }
                }))
            }
            )
        }
        d(x, ()=>{
            We()
        }
        ),
        d(p, e=>{
            e && chrome.runtime.sendMessage({
                name: "xl_stat",
                eventId: 974,
                extParam: {
                    tabUrl: window.location.href
                }
            })
        }
        );
        const ct = async()=>{
            Ue = ae();
            0 !== (await async function() {
                return new Promise(e=>{
                    for (const t of Ue) {
                        const o = A(t) || {}
                          , {suffix: n, isVideoURL: l, protocol: i} = o
                          , s = R(Te, n, i)
                          , a = R($e, n, i);
                        let r = !1;
                        if (("unknown" !== n || i) && (a && (te.downloadList.push(o),
                        r = !0),
                        s && (l && (te.playList[".m3u8" === n ? "M3U8List" : "normalVideoList"].push(o),
                        te.playList.length += 1),
                        te.saveList.push(o),
                        r = !0),
                        r && (te.length += 1),
                        99 === te.length))
                            return void e(te)
                    }
                    setTimeout(()=>{
                        const {M3U8VideoUrl: t} = ee;
                        if (t) {
                            if (te.downloadList.some(e=>e.url === t))
                                return void e(te);
                            const o = A(t);
                            if (!R(Te, o.suffix, o.protocol) || !R($e, o.suffix, o.protocol))
                                return;
                            te.downloadList.unshift(o),
                            te.playList.M3U8List.unshift(o),
                            te.saveList.unshift(o),
                            te.playList.length += 1,
                            te.length += 1
                        }
                        e(te)
                    }
                    , 1500)
                }
                )
            }()).length && (ot() ? (c.value = !0,
            V.warn("页面底部弹出资源列表，", JSON.stringify(te || {}), "非iframe")) : (V.warn("在 iframe 內部， 向上传递数据：", JSON.stringify(te)),
            window.parent.postMessage({
                type: "data",
                payload: JSON.stringify(te)
            }, "*")))
        }
        ;
        function dt() {
            c.value = !1
        }
        const ut = async()=>{
            var e;
            Y.value = !0,
            e = document.location.href,
            chrome.runtime.sendMessage({
                name: "CheckActivated",
                url: e
            }),
            We(),
            function(e) {
                chrome.runtime.sendMessage({
                    name: "CheckVideoInWhiteList",
                    url: e
                }, (async function(e) {
                    var t, o;
                    K.value = null == e ? void 0 : e.exception,
                    Ve = e.videoInWhiteList,
                    me = e.bPlugin,
                    Le = e.bMonitorVideo,
                    _e = e.bWebsite,
                    Te = e.fluentPlayConfig,
                    S.value = !!(null == (t = null == e ? void 0 : e.fluentPlayConfig) ? void 0 : t.switch),
                    $e = e.downloadSniffConfig,
                    C.value = !!(null == (o = null == e ? void 0 : e.downloadSniffConfig) ? void 0 : o.switch),
                    Ve && Le && _e && (at(),
                    (Te.switch || $e.switch) && ct(),
                    !me && x.value && await N() && chrome.runtime.sendMessage({
                        name: "xl_show_notifications"
                    }))
                }
                ))
            }(document.location.href),
            document.addEventListener("keydown", He),
            document.addEventListener("keyup", Ke, !0),
            window.addEventListener("message", lt),
            async function() {
                var e;
                try {
                    const t = await oe({
                        name: "GetConfig"
                    });
                    if (!t)
                        return void (r.value = {});
                    r.value = t,
                    we = t.bMonitorEmule,
                    ye = t.bMonitorMagnet,
                    be = t.bMonitorTradition,
                    ke = t.bMonitorIE,
                    fe = t.monitorDomains,
                    xe = t.filterDomains,
                    he = t.monitorFileExts,
                    g.value = ne(window.location.href, t.jsqConfig),
                    v.value = (null == (e = null == t ? void 0 : t.jsqConfig) ? void 0 : e.text) || {},
                    p.value = t.isStatGlobal,
                    u.value = (null == t ? void 0 : t.videoTagVersion) || Z,
                    V.info("视频操作按钮UI版本", u.value)
                } catch (t) {
                    r.value = {}
                }
            }()
        }
        ;
        return chrome.runtime.onMessage.addListener((function(e, t, o) {
            if ("UpdatePluginEnabled" == e.name)
                K.value = e.exception,
                me = e.enable,
                me || Tt.quit();
            else if ("UpdateMoniterVideoTags" == e.name)
                Le = e.enable;
            else if ("UpdateMultiSelectShortcutEnable" == e.name)
                Me = e.enable;
            else if ("UpdateWebsiteEnabled" == e.name)
                _e = e.enable;
            else if ("UpdatePageEnabled" == e.name)
                ve = e.enable;
            else if ("OnActivated" == e.name)
                Y.value && async function(e, t, o) {
                    try {
                        const n = await chrome.runtime.sendMessage({
                            name: "CheckEnabled",
                            url: e,
                            tabId: t,
                            topFrame: o
                        });
                        if (me = n.bPlugin,
                        Le = n.bMonitorVideo,
                        _e = n.bWebsite,
                        ve = n.bPage,
                        Me = n.bShortcutEnable,
                        x.value = n.isShowRecallInfo,
                        !Le || !_e)
                            return void tt();
                        at()
                    } catch (n) {}
                }(document.location.href, e.tabId, window.top === window.self);
            else if ("UpdateMonitorDomains" == e.name)
                fe = e.monitorDomains;
            else {
                if ("GetCookie" == e.name)
                    return o({
                        cookie: document.cookie
                    }),
                    !0;
                if ("ThunderSupportReminder" === e.name)
                    window.self === window.top && Oe(e.text);
                else if ("EnterMultiSelect" === e.name) {
                    if (j())
                        return;
                    Tt.enter()
                } else if ("xl_chrome_iframe_keydown" === e.name) {
                    if (window.top === window.self)
                        switch (e.keyCode) {
                        case 13:
                            Tt.download();
                            break;
                        case 27:
                            Tt.quit()
                        }
                } else if ("xl_chrome_iframe_multi_hotkey" === e.name)
                    window.top === window.self && Tt.enter();
                else if ("GetAllImages" === e.name) {
                    if (window.top === window.self) {
                        const e = [];
                        for (const t of document.images)
                            t.src && e.push({
                                src: t.src,
                                width: t.width,
                                height: t.height,
                                naturalWidth: t.naturalWidth,
                                naturalHeight: t.naturalHeight
                            });
                        return o(e),
                        !0
                    }
                } else
                    "xl_recall_entry_click" === e.name || "appendFooterUI" === e.name && (c.value = !0)
            }
        }
        )),
        t(async()=>{
            ut(),
            rt()
        }
        ),
        h(()=>{
            window.removeEventListener("message", lt),
            document.removeEventListener("keydown", He),
            document.removeEventListener("keyup", Ke, !0),
            document.body.removeEventListener("mousemove", Xe, !0),
            ot() || document.body.removeEventListener("mouseout", Ye),
            document.body.removeEventListener("wheel", Ze),
            document.removeEventListener("scroll", et)
        }
        ),
        (e,t)=>{
            var i;
            return o(),
            n("div", {
                class: l(e.$style.content_wrapper),
                ref_key: "panelRef",
                ref: Q
            }, [m(kt, {
                config: r.value,
                uiVersion: (null == (i = r.value) ? void 0 : i.videoTagVersion) || "v2",
                exception: K.value,
                latestVideoSrc: J.value,
                isShowVideoTag: M.value,
                isShowDownloadBar: C.value,
                isShowCloudAddBar: S.value,
                latestVideoElement: X.value,
                onShowActionError: it,
                onShowVersionError: Re,
                onHandleCloseBar: De
            }, null, 8, ["config", "uiVersion", "exception", "latestVideoSrc", "isShowVideoTag", "isShowDownloadBar", "isShowCloudAddBar", "latestVideoElement"]), m(st), B.value ? (o(),
            y(L(nt), {
                key: 0,
                onSubmit: Ne,
                onCancel: Ae
            })) : a("", !0), E.value ? (o(),
            y(L(ge), {
                key: 1,
                text: $.value,
                onSubmit: qe,
                onCancel: je
            }, null, 8, ["text"])) : a("", !0), T.value ? (o(),
            y(L(_t), {
                key: 2,
                text: I.value,
                onSubmit: Be,
                onCancel: Ie
            }, null, 8, ["text"])) : a("", !0), c.value ? (o(),
            y(L(Qe), {
                key: 3,
                tabUrl: _.value,
                isShowJsqEntry: g.value,
                jsqText: v.value,
                onRemoveFooter: dt,
                resourceList: te,
                exception: K.value
            }, null, 8, ["tabUrl", "isShowJsqEntry", "jsqText", "resourceList", "exception"])) : a("", !0)], 2)
        }
    }
}, [["__cssModules", {
    $style: {
        "content-wrapper": "_content-wrapper_20md8_1",
        "xl-chrome-ext-bar-toast": "_xl-chrome-ext-bar-toast_20md8_1",
        "options-wrapper": "_options-wrapper_20md8_7"
    }
}]])
  , jt = "xl_chrome_ext_" + H;
let qt = !1;
function It() {
    if (document.getElementById(jt))
        return;
    document.body.parentNode;
    const e = document.createElement("div");
    e.className = "xl-chrome-ext-bar_" + H,
    e.style.display = "block",
    e.id = jt,
    document.documentElement.appendChild(e)
}
try {
    V.warn("" + (window.self === window.top ? "window top" : "window iframe")),
    It(),
    Bt(),
    qt = !0,
    V.info("mounted root success")
} catch (At) {
    V.error("error", At),
    qt = !1
}
function Bt() {
    J ? M(ve).mount("#" + jt) : M($t).mount("#" + jt)
}
window.addEventListener("load", ()=>{
    setTimeout(()=>{
        qt || (It(),
        Bt(),
        qt = !0)
    }
    , 0)
}
);
