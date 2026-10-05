/*! yourjs-page v0.0.0 | (c) 2026-present Chris West | MIT License | https://github.com/westc/yourjs-page */
(() => {
  /**
   * The viewer IFRAME's CSS code.
   * @type {string}
   */
  const VIEWER_CSS = ":root{color-scheme:light;--font:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;--code-font:ui-monospace,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;--bg:#fff;--text:#1f1f1f;--muted-text:#5f6368;--toolbar-bg:#f3f3f3;--toolbar-border:#d6d6d6;--toolbar-text:#333;--panel-header-bg:#f8f8f8;--button-hover:rgb(0 0 0 / 0.08);--accent:#1a73e8;--accent-hover:#1765cc;--accent-text:#fff;--divider-bg:#e6e6e6;--divider-hover-bg:#c8c8c8;--menu-bg:#fff;--menu-shadow:0 4px 16px rgb(0 0 0 / 0.18);--row-border:#f0f0f0;--string:#c41a16;--number:#1a1aa6;--keyword:#881391;--null:#80868b;--warn-bg:#fffbe5;--warn-border:#fff5c2;--warn-text:#5c3c00;--error-bg:#fff0f0;--error-border:#ffd6d6;--error-text:#dc362e;--info-text:#1a73e8}:root[data-theme=dark]{color-scheme:dark;--bg:#242424;--text:#e3e3e3;--muted-text:#9aa0a6;--toolbar-bg:#2b2b2b;--toolbar-border:#474747;--toolbar-text:#e3e3e3;--panel-header-bg:#2f2f2f;--button-hover:rgb(255 255 255 / 0.1);--accent:#8ab4f8;--accent-hover:#aecbfa;--accent-text:#202124;--divider-bg:#3a3a3a;--divider-hover-bg:#5a5a5a;--menu-bg:#2d2e30;--menu-shadow:0 4px 16px rgb(0 0 0 / 0.5);--row-border:#3a3a3a;--string:#f28b54;--number:#9980ff;--keyword:#5db0d7;--null:#8e8e8e;--warn-bg:#332b00;--warn-border:#665500;--warn-text:#ffd17a;--error-bg:#290000;--error-border:#5c0000;--error-text:#ff8080;--info-text:#8ab4f8}body,html{height:100%;margin:0;overflow:hidden}body{background-color:var(--bg);color:var(--text);font-family:var(--font);font-size:13px}[hidden]{display:none!important}button{color:inherit;font:inherit}.svg-defs{height:0;position:absolute;width:0}svg{fill:none;flex-shrink:0;height:18px;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;width:18px}.spacer{flex-grow:1}.logo{align-items:center;color:var(--toolbar-text);display:inline-flex;font-weight:700;gap:5px;letter-spacing:-.01em;line-height:1}.logo-mark{height:22px;stroke:none;width:22px}.logo-text{font-size:14px;white-space:nowrap}.logo-your{font-weight:400;opacity:.8}.logo-large{gap:12px}.logo-large>.logo-mark{filter:drop-shadow(0 6px 12px rgb(0 0 0 / .18));height:56px;width:56px}.logo-large>.logo-text{font-size:36px}.logo-link{align-items:center;border-radius:4px;display:inline-flex;flex-shrink:0;height:30px;justify-content:center;margin-right:4px;width:30px}.logo-link:hover{background-color:var(--button-hover)}#splash{align-items:center;background-color:var(--bg);display:flex;inset:0;justify-content:center;position:fixed;transition:opacity .35s ease,visibility .35s;z-index:1000}#splash.hidden{opacity:0;pointer-events:none;visibility:hidden}.splash-content{align-items:center;animation:splash-in .4s ease-out both;display:flex;flex-direction:column;gap:24px;padding:16px}.splash-progress{background-color:var(--toolbar-border);border-radius:3px;height:3px;overflow:hidden;width:140px}.splash-progress>div{animation:splash-progress 1.1s ease-in-out infinite;background-color:var(--accent);border-radius:inherit;height:100%;width:40%}@keyframes splash-in{from{opacity:0;transform:translateY(6px)}}@keyframes splash-progress{from{transform:translateX(-100%)}to{transform:translateX(250%)}}.splash-message{color:var(--muted-text);font-size:13px;max-width:280px;text-align:center}.splash-slow{animation:show-after-delay 0s 10s both}@keyframes show-after-delay{from{visibility:hidden}to{visibility:visible}}#splash.failed .splash-progress,#splash.failed .splash-slow,.splash-error{display:none}#splash.failed .splash-error{color:var(--error-text);display:block}#app{display:flex;flex-direction:column;inset:0;position:fixed}#toolbar{align-items:center;background-color:var(--toolbar-bg);border-bottom:1px solid var(--toolbar-border);color:var(--toolbar-text);display:flex;flex-shrink:0;gap:2px;height:40px;padding:0 6px}.icon-button{align-items:center;background:0 0;border:0;border-radius:4px;cursor:pointer;display:inline-flex;flex-shrink:0;height:30px;justify-content:center;padding:0;position:relative;width:30px}.icon-button:hover,.icon-button[aria-expanded=true],.icon-button[aria-pressed=true]{background-color:var(--button-hover)}.icon-button[aria-pressed=true]{color:var(--accent)}#tabs button:focus-visible,.icon-button:focus-visible,.menu>:focus-visible,.panel-title:focus-visible,.run-button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}.run-button{align-items:center;background-color:var(--accent);border:0;border-radius:4px;color:var(--accent-text);cursor:pointer;display:inline-flex;flex-shrink:0;font-weight:600;gap:4px;height:30px;padding:0 12px 0 8px;position:relative}.run-button:hover{background-color:var(--accent-hover)}.run-button.is-stale::after{background-color:#f9ab00;border:2px solid var(--toolbar-bg);border-radius:50%;content:'';height:8px;position:absolute;right:-4px;top:-4px;width:8px}.title{font-weight:600;margin-left:8px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.badge{background-color:var(--muted-text);border-radius:8px;color:var(--bg);font-size:10px;font-weight:700;line-height:14px;min-width:14px;padding:0 3px;position:absolute;right:-2px;top:-1px;box-sizing:border-box}.badge.has-errors{background-color:var(--error-text)}#tabs{background-color:var(--toolbar-bg);border-bottom:1px solid var(--toolbar-border);display:none;flex-shrink:0;overflow-x:auto}.layout-tabs #tabs{display:flex}#tabs button{background:0 0;border:0;border-bottom:2px solid transparent;color:var(--muted-text);cursor:pointer;flex:1 1 0;font-weight:600;padding:7px 12px 5px}#tabs button:hover{color:var(--toolbar-text)}#tabs button[aria-selected=true]{border-bottom-color:var(--accent);color:var(--toolbar-text)}#main{display:flex;flex-grow:1;min-height:0}.layout-tabs #main,.layout-top #main{flex-direction:column}.layout-left #main{flex-direction:row}.layout-right #main{flex-direction:row-reverse}#console,#editors,#output,#result,.panel{display:flex;flex:1 1 0;flex-direction:column;min-height:0;min-width:0;overflow:hidden}.layout-top #editors{flex-direction:row}#result iframe{background-color:#fff;border:0;display:block;flex-grow:1;width:100%}.panel-header{align-items:center;background-color:var(--panel-header-bg);border-bottom:1px solid var(--toolbar-border);display:flex;flex-shrink:0;height:30px;padding:0 2px}.panel-header .icon-button{color:var(--muted-text);height:26px;width:26px}.panel-header .icon-button:hover{color:var(--toolbar-text)}.panel-header svg{height:16px;width:16px}.panel-title{align-items:center;background:0 0;border:0;border-radius:4px;color:var(--toolbar-text);cursor:pointer;display:flex;flex-grow:1;font-size:12px;font-weight:700;gap:2px;height:26px;letter-spacing:.04em;min-width:0;padding:0 4px}.panel-title svg{color:var(--muted-text);transform:rotate(90deg);transition:transform .15s}.panel.is-collapsed .panel-title svg{transform:none}.editor{flex-grow:1;min-height:0}.panel.is-collapsed{flex:0 0 auto!important}.panel.is-collapsed .editor,.panel.is-collapsed .format-button{display:none}.layout-top .panel.is-collapsed .panel-header{border-bottom:0;flex-direction:column;height:100%;padding:2px 0}.layout-top .panel.is-collapsed .panel-title{flex-direction:column;flex-grow:0;height:auto;padding:4px 0;width:26px}.layout-top .panel.is-collapsed .panel-title span{writing-mode:vertical-lr}.divider{background-color:var(--divider-bg);cursor:row-resize;flex:0 0 4px;position:relative;touch-action:none}.divider.is-dragging,.divider:hover{background-color:var(--divider-hover-bg)}.divider::before{content:'';inset:-4px 0;position:absolute;z-index:2}.layout-left #main-divider,.layout-right #main-divider,.layout-top #editors>.divider{cursor:col-resize}.layout-left #main-divider::before,.layout-right #main-divider::before,.layout-top #editors>.divider::before{inset:0 -4px}.divider:has(+ .is-collapsed),.is-collapsed+.divider{cursor:default}.divider:has(+ .is-collapsed):hover,.is-collapsed+.divider:hover{background-color:var(--divider-bg)}.is-dragging-divider iframe{pointer-events:none}.is-dragging-divider,.is-dragging-divider *{-webkit-user-select:none;user-select:none}.layout-tabs #editors>.divider,.layout-tabs #main-divider,.layout-tabs .panel-title svg{display:none}.layout-tabs .panel-title{cursor:default}.layout-tabs #editors,.layout-tabs #output,.layout-tabs .panel{flex:1 1 0!important}.layout-tabs .panel:not(.is-active-tab),.layout-tabs:not([data-tab=result]) #output,.layout-tabs[data-tab=result] #editors{display:none}.layout-tabs .panel.is-collapsed .editor,.layout-tabs .panel.is-collapsed .format-button{display:block}.layout-tabs .panel.is-collapsed .format-button{display:inline-flex}.has-no-editors :is(#editors,#main-divider,#tabs){display:none!important}.has-no-editors #output{display:flex!important;flex:1 1 0!important}#app:not(.is-console-shown) #console,#app:not(.is-console-shown) #console-divider{display:none}#console{background-color:var(--bg);flex-grow:0.8}.console-header{align-items:center;background-color:var(--panel-header-bg);border-bottom:1px solid var(--toolbar-border);display:flex;flex-shrink:0;height:30px;padding:0 2px 0 8px}.console-header .icon-button{color:var(--muted-text);height:26px;width:26px}.console-header svg{height:16px;width:16px}.console-title{font-size:12px;font-weight:700;letter-spacing:.04em}#console-entries{flex-grow:1;font-family:var(--code-font);font-size:12px;line-height:16px;min-height:0;overflow:auto}.entry{border-bottom:1px solid var(--row-border);display:flex;gap:8px;padding:3px 8px 3px 20px;position:relative}.entry-text{flex-grow:1;min-width:0;white-space:pre-wrap;word-break:break-word}.entry.level-warn{background-color:var(--warn-bg);border-bottom-color:var(--warn-border);color:var(--warn-text)}.entry.level-error{background-color:var(--error-bg);border-bottom-color:var(--error-border);color:var(--error-text)}.entry.level-info{color:var(--info-text)}.entry.level-debug{color:var(--muted-text)}.entry.level-command::before,.entry.level-result::before{color:var(--muted-text);left:6px;position:absolute}.entry.level-command::before{content:'\\203A'}.entry.level-result::before{content:'\\2190'}.entry .kind-bigint,.entry .kind-boolean,.entry .kind-number{color:var(--number)}.entry .kind-null,.entry .kind-undefined{color:var(--null)}.entry .kind-symbol,.entry.level-result .kind-string{color:var(--string)}.entry .kind-function{color:var(--keyword)}.entry{flex-wrap:wrap}.entry-trees{flex-basis:100%}.entry-trees:empty{display:none}.expander{border-radius:2px;cursor:pointer}.expander::before{color:var(--muted-text);content:'\\25B8';display:inline-block;font-size:10px;margin-right:3px;transition:transform .1s;width:8px}.expander[aria-expanded=true]::before{transform:rotate(90deg)}.expander:hover{background-color:var(--button-hover)}.expander:focus-visible{outline:1px solid var(--accent)}.tree{color:var(--text);padding-left:12px}.tree-children{padding-left:12px}.tree-row{white-space:pre-wrap;word-break:break-word}.tree-key{color:var(--keyword)}.entry .kind-getter,.entry .kind-index{color:var(--muted-text)}.entry .tree .kind-string{color:var(--string)}.console-table-wrapper{margin:2px 0;max-height:320px;overflow:auto}.console-table{border-collapse:collapse;font-size:12px}.console-table td,.console-table th{border:1px solid var(--toolbar-border);max-width:300px;overflow:hidden;padding:2px 8px;text-align:left;text-overflow:ellipsis;white-space:nowrap}.console-table th{background-color:var(--panel-header-bg);font-weight:600;position:sticky;top:0}.console-table .kind-string{color:var(--string)}.entry-location{background:0 0;border:0;color:var(--muted-text);cursor:pointer;flex-shrink:0;font-family:var(--code-font);font-size:11px;padding:0;text-decoration:underline}.entry-location:hover{color:inherit}.console-input{align-items:flex-start;border-top:1px solid var(--toolbar-border);display:flex;flex-shrink:0;padding:3px 8px 3px 4px}.console-input svg{color:var(--accent);height:14px;margin-top:2px;width:14px}#console-input{background:0 0;border:0;color:inherit;flex-grow:1;font-family:var(--code-font);font-size:12px;line-height:18px;margin-left:2px;max-height:120px;outline:0;padding:0;resize:none}.menu{background-color:var(--menu-bg);border:1px solid var(--toolbar-border);border-radius:6px;box-shadow:var(--menu-shadow);display:flex;flex-direction:column;max-width:calc(100vw - 16px);min-width:200px;padding:4px;position:fixed;z-index:10}.menu>a,.menu>button{background:0 0;border:0;border-radius:4px;color:var(--text);cursor:pointer;padding:6px 10px 6px 28px;position:relative;text-align:left;text-decoration:none}.menu>a:hover,.menu>button:hover{background-color:var(--button-hover)}.menu [aria-checked=true]::before{color:var(--accent);content:'\\2713';left:10px;position:absolute}.menu>a{color:var(--muted-text);font-size:12px}.menu-separator{border-top:1px solid var(--toolbar-border);margin:4px 0}.menu-info{color:var(--muted-text);font-size:12px;padding:2px 10px 2px 28px}.shortcut{display:flex;gap:16px;justify-content:space-between;padding:2px 0}kbd{font-family:var(--code-font);font-size:11px}dialog{background-color:var(--menu-bg);border:1px solid var(--toolbar-border);border-radius:8px;box-shadow:var(--menu-shadow);box-sizing:border-box;color:var(--text);flex-direction:column;max-height:calc(100% - 16px);max-width:calc(100% - 16px);padding:0;width:560px}dialog[open]{display:flex}dialog::backdrop{background-color:rgb(0 0 0 / .3)}.dialog-footer,.dialog-header{align-items:center;display:flex;flex-shrink:0;gap:8px;padding:8px 8px 8px 16px}.dialog-header{border-bottom:1px solid var(--toolbar-border)}.dialog-header h2{flex-grow:1;font-size:15px;margin:0}.dialog-footer{border-top:1px solid var(--toolbar-border);justify-content:flex-end}.dialog-body{min-height:0;overflow:auto;padding:12px 16px}.dialog-body h3{font-size:12px;letter-spacing:.04em;margin:16px 0 6px;text-transform:uppercase}.dialog-note{color:var(--muted-text);font-size:12px;margin:16px 0 0}.text-button{background:0 0;border:1px solid var(--toolbar-border);border-radius:4px;cursor:pointer;flex-shrink:0;height:30px;padding:0 12px}.text-button:hover{background-color:var(--button-hover)}.text-button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}dialog input{background-color:var(--bg);border:1px solid var(--toolbar-border);border-radius:4px;box-sizing:border-box;color:inherit;font:inherit;height:32px;min-width:0;padding:0 8px}dialog input:focus{border-color:var(--accent);outline:1px solid var(--accent)}#library-search-input{width:100%}.library-status{color:var(--muted-text);font-size:12px;padding:6px 2px 0}.library-status:empty{display:none}.library-results{display:flex;flex-direction:column;margin-top:6px;max-height:260px;overflow:auto}.library-result{border-bottom:1px solid var(--row-border);padding:6px 2px}.library-result-main{align-items:flex-start;display:flex;gap:8px}.library-result-text{flex-grow:1;min-width:0}.library-name{font-weight:600}.library-version{color:var(--muted-text);font-size:12px;margin-left:6px}.library-description{color:var(--muted-text);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.library-result .text-button{font-size:12px;height:26px;padding:0 8px}.library-files{margin:6px 0 0;padding-left:12px}.library-files select{background-color:var(--bg);border:1px solid var(--toolbar-border);border-radius:4px;color:inherit;font:inherit;font-size:12px;height:26px;margin-bottom:4px}.library-file-list{display:flex;flex-direction:column;max-height:160px;overflow:auto}.library-file-list button{background:0 0;border:0;border-radius:4px;cursor:pointer;font-family:var(--code-font);font-size:12px;padding:3px 6px;text-align:left}.library-file-list button:hover{background-color:var(--button-hover)}.library-url{display:flex;gap:6px;margin-top:12px}.library-url input{flex-grow:1}.library-list{border:1px solid var(--row-border);border-radius:4px;list-style:none;margin:0;padding:0}.library-list:empty::before{color:var(--muted-text);content:attr(data-empty);display:block;font-size:12px;padding:6px 8px}.library-list li{align-items:center;border-bottom:1px solid var(--row-border);display:flex;gap:2px;padding:2px 2px 2px 8px}.library-list li:last-child{border-bottom:0}.library-url-text{flex-grow:1;font-family:var(--code-font);font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.library-list .icon-button{color:var(--muted-text);height:26px;width:26px}.library-list .icon-button:disabled{cursor:default;opacity:.35}.library-list svg{height:16px;width:16px}dialog.is-read-only :is(.library-search,.library-url,.library-list .icon-button,#libraries-run-button){display:none}.load-error-dialog{width:480px}.load-error-body{display:flex;gap:14px;padding:20px 20px 8px}.load-error-icon{align-items:center;background-color:var(--error-bg);border-radius:50%;color:var(--error-text);display:flex;flex-shrink:0;height:40px;justify-content:center;width:40px}.load-error-icon svg{height:22px;width:22px}.load-error-text{min-width:0}.load-error-text h2{font-size:15px;margin:2px 0 6px}.load-error-text p{color:var(--muted-text);line-height:1.45;margin:0 0 12px}.load-error-list{display:flex;flex-direction:column;gap:6px;list-style:none;margin:0;padding:0}.load-error-list li{align-items:baseline;background-color:var(--panel-header-bg);border:1px solid var(--row-border);border-radius:6px;display:flex;gap:8px;padding:8px 10px}.load-error-language{border:1px solid var(--toolbar-border);border-radius:4px;flex-shrink:0;font-size:11px;font-weight:700;letter-spacing:.04em;padding:1px 6px}.load-error-message{font-size:12px;line-height:1.45;min-width:0;overflow-wrap:anywhere}.load-error-dialog .dialog-footer{border-top:0;padding:12px 16px 16px}.load-error-dialog .run-button{padding:0 18px}#result{position:relative}.safe-mode-notice{align-items:center;background-color:var(--bg);display:flex;inset:0;justify-content:center;overflow:auto;padding:16px;position:absolute}.safe-mode-card{align-items:center;display:flex;flex-direction:column;gap:10px;max-width:360px;text-align:center}.safe-mode-card h2{font-size:15px;margin:4px 0 0}.safe-mode-card p{color:var(--muted-text);line-height:1.45;margin:0 0 6px}";
  /**
   * The viewer IFRAME's HTML code (what goes in its body).
   * @type {string}
   */
  const VIEWER_HTML = "<svg class=\"svg-defs\" aria-hidden=\"true\"><defs><symbol id=\"icon-run\" viewBox=\"0 0 24 24\"><path d=\"M7 4.5v15l12-7.5z\" fill=\"currentColor\" stroke=\"none\"/></symbol><symbol id=\"icon-format\" viewBox=\"0 0 24 24\"><path d=\"M4 6h16M8 10h12M8 14h12M4 18h16\"/></symbol><symbol id=\"icon-chevron\" viewBox=\"0 0 24 24\"><path d=\"M9 6l6 6-6 6\"/></symbol><symbol id=\"icon-console\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 9l3 3-3 3M13 15h4\"/></symbol><symbol id=\"icon-layout\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 11h18M9 4v7M15 4v7\"/></symbol><symbol id=\"icon-open\" viewBox=\"0 0 24 24\"><path d=\"M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5\"/></symbol><symbol id=\"icon-fullscreen\" viewBox=\"0 0 24 24\"><path d=\"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5\"/></symbol><symbol id=\"icon-exit-fullscreen\" viewBox=\"0 0 24 24\"><path d=\"M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5\"/></symbol><symbol id=\"icon-more\" viewBox=\"0 0 24 24\"><circle cx=\"5\" cy=\"12\" r=\"1.75\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.75\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"19\" cy=\"12\" r=\"1.75\" fill=\"currentColor\" stroke=\"none\"/></symbol><symbol id=\"icon-clear\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M6.5 17.5l11-11\"/></symbol><symbol id=\"icon-close\" viewBox=\"0 0 24 24\"><path d=\"M6 6l12 12M18 6L6 18\"/></symbol><symbol id=\"icon-prompt\" viewBox=\"0 0 24 24\"><path d=\"M9 6l6 6-6 6\"/></symbol><symbol id=\"icon-libraries\" viewBox=\"0 0 24 24\"><path d=\"M12 3l8 4.5v9L12 21l-8-4.5v-9z\"/><path d=\"M4 7.5l8 4.5 8-4.5M12 12v9\"/></symbol><symbol id=\"icon-up\" viewBox=\"0 0 24 24\"><path d=\"M6 15l6-6 6 6\"/></symbol><symbol id=\"icon-down\" viewBox=\"0 0 24 24\"><path d=\"M6 9l6 6 6-6\"/></symbol><symbol id=\"icon-plus\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14M5 12h14\"/></symbol><symbol id=\"icon-alert\" viewBox=\"0 0 24 24\"><path d=\"M10.3 4.1L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0z\"/><path d=\"M12 9.5v4M12 17h.01\"/></symbol><symbol id=\"logo-mark\" viewBox=\"0 0 32 32\"><path d=\"M6 1.5h14.5L29 10v18.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-25a2 2 0 0 1 2-2z\" fill=\"#22a35a\" stroke=\"none\"/><path d=\"M20.5 1.5V8a2 2 0 0 0 2 2H29z\" fill=\"#167a41\" stroke=\"none\"/><rect x=\"8\" y=\"7\" width=\"9\" height=\"2.2\" rx=\"1.1\" fill=\"#fff\" opacity=\"0.4\" stroke=\"none\"/><rect x=\"8\" y=\"12\" width=\"6\" height=\"2.2\" rx=\"1.1\" fill=\"#fff\" opacity=\"0.4\" stroke=\"none\"/><text x=\"25.5\" y=\"27\" text-anchor=\"end\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"11.5\" font-weight=\"800\" letter-spacing=\"-0.3\" fill=\"#fff\" stroke=\"none\">JS</text></symbol></defs></svg><div id=\"splash\" aria-label=\"Loading\"><div class=\"splash-content\"><span class=\"logo logo-large\"><svg class=\"logo-mark\" aria-hidden=\"true\"><use href=\"#logo-mark\"/></svg><span class=\"logo-text\"><span class=\"logo-your\">Your</span>JS Page</span></span><div class=\"splash-progress\"><div></div></div><div class=\"splash-message splash-slow\">Still loading&hellip;</div><div class=\"splash-message splash-error\">YourJS Page couldn&rsquo;t load its code editor. Please check your connection and reload the page.</div></div></div><div id=\"app\" hidden><header id=\"toolbar\"><a id=\"logo-link\" class=\"logo-link\" target=\"_blank\" rel=\"noopener\"><svg class=\"logo-mark\" aria-hidden=\"true\"><use href=\"#logo-mark\"/></svg></a><button id=\"run-button\" class=\"run-button\" type=\"button\"><svg aria-hidden=\"true\"><use href=\"#icon-run\"/></svg> <span>Run</span></button><div id=\"title\" class=\"title\"></div><div class=\"spacer\"></div><button id=\"console-button\" class=\"icon-button\" type=\"button\" aria-pressed=\"false\"><svg aria-hidden=\"true\"><use href=\"#icon-console\"/></svg> <span id=\"console-badge\" class=\"badge\" hidden></span></button> <button id=\"libraries-button\" class=\"icon-button\" type=\"button\" title=\"Libraries\" aria-haspopup=\"dialog\"><svg aria-hidden=\"true\"><use href=\"#icon-libraries\"/></svg> <span id=\"libraries-badge\" class=\"badge\" hidden></span></button> <button id=\"layout-button\" class=\"icon-button\" type=\"button\" title=\"Change view\" aria-haspopup=\"menu\" aria-expanded=\"false\"><svg aria-hidden=\"true\"><use href=\"#icon-layout\"/></svg></button> <button id=\"open-button\" class=\"icon-button\" type=\"button\" title=\"Open the result in a new tab\"><svg aria-hidden=\"true\"><use href=\"#icon-open\"/></svg></button> <button id=\"fullscreen-button\" class=\"icon-button\" type=\"button\" title=\"Full screen\"><svg aria-hidden=\"true\"><use href=\"#icon-fullscreen\"/></svg></button> <button id=\"more-button\" class=\"icon-button\" type=\"button\" title=\"More\" aria-haspopup=\"menu\" aria-expanded=\"false\"><svg aria-hidden=\"true\"><use href=\"#icon-more\"/></svg></button></header><nav id=\"tabs\" role=\"tablist\"><button type=\"button\" role=\"tab\" data-tab=\"html\">HTML</button> <button type=\"button\" role=\"tab\" data-tab=\"css\">CSS</button> <button type=\"button\" role=\"tab\" data-tab=\"js\">JS</button> <button type=\"button\" role=\"tab\" data-tab=\"result\">Result</button></nav><main id=\"main\"><section id=\"editors\"><div class=\"panel\" data-lang=\"html\"><div class=\"panel-header\"><button class=\"panel-title\" type=\"button\" aria-expanded=\"true\"><svg aria-hidden=\"true\"><use href=\"#icon-chevron\"/></svg> <span>HTML</span></button> <button class=\"icon-button format-button\" type=\"button\"><svg aria-hidden=\"true\"><use href=\"#icon-format\"/></svg></button></div><div class=\"editor\"></div></div><div class=\"divider\" role=\"separator\"></div><div class=\"panel\" data-lang=\"css\"><div class=\"panel-header\"><button class=\"panel-title\" type=\"button\" aria-expanded=\"true\"><svg aria-hidden=\"true\"><use href=\"#icon-chevron\"/></svg> <span>CSS</span></button> <button class=\"icon-button format-button\" type=\"button\"><svg aria-hidden=\"true\"><use href=\"#icon-format\"/></svg></button></div><div class=\"editor\"></div></div><div class=\"divider\" role=\"separator\"></div><div class=\"panel\" data-lang=\"js\"><div class=\"panel-header\"><button class=\"panel-title\" type=\"button\" aria-expanded=\"true\"><svg aria-hidden=\"true\"><use href=\"#icon-chevron\"/></svg> <span>JS</span></button> <button class=\"icon-button format-button\" type=\"button\"><svg aria-hidden=\"true\"><use href=\"#icon-format\"/></svg></button></div><div class=\"editor\"></div></div></section><div id=\"main-divider\" class=\"divider\" role=\"separator\"></div><section id=\"output\"><div id=\"result\"><div id=\"safe-mode-notice\" class=\"safe-mode-notice\" hidden><div class=\"safe-mode-card\"><div class=\"load-error-icon\"><svg aria-hidden=\"true\"><use href=\"#icon-alert\"/></svg></div><h2>The code wasn&rsquo;t run</h2><p>The last time this page was opened its code didn&rsquo;t finish running (it may have frozen the page), so it wasn&rsquo;t run again.</p><button id=\"safe-mode-run-button\" class=\"run-button\" type=\"button\"><svg aria-hidden=\"true\"><use href=\"#icon-run\"/></svg> <span>Run anyway</span></button></div></div></div><div id=\"console-divider\" class=\"divider\" role=\"separator\"></div><div id=\"console\"><div class=\"console-header\"><span class=\"console-title\">Console</span><div class=\"spacer\"></div><button id=\"clear-console-button\" class=\"icon-button\" type=\"button\" title=\"Clear the console\"><svg aria-hidden=\"true\"><use href=\"#icon-clear\"/></svg></button> <button id=\"close-console-button\" class=\"icon-button\" type=\"button\" title=\"Close the console\"><svg aria-hidden=\"true\"><use href=\"#icon-close\"/></svg></button></div><div id=\"console-entries\" role=\"log\"></div><div class=\"console-input\"><svg aria-hidden=\"true\"><use href=\"#icon-prompt\"/></svg> <textarea id=\"console-input\" rows=\"1\" spellcheck=\"false\" autocomplete=\"off\" aria-label=\"Run JavaScript in the result\" placeholder=\"Run JavaScript in the result\"></textarea></div></div></section></main><div id=\"layout-menu\" class=\"menu\" role=\"menu\" hidden><button type=\"button\" role=\"menuitemradio\" data-layout=\"top\">Editors on top</button> <button type=\"button\" role=\"menuitemradio\" data-layout=\"left\">Editors on the left</button> <button type=\"button\" role=\"menuitemradio\" data-layout=\"right\">Editors on the right</button> <button type=\"button\" role=\"menuitemradio\" data-layout=\"tabs\">Tabs</button></div><div id=\"more-menu\" class=\"menu\" role=\"menu\" hidden><button id=\"download-html-button\" type=\"button\" role=\"menuitem\">Download as an HTML file</button> <button id=\"download-zip-button\" type=\"button\" role=\"menuitem\">Download as a ZIP file</button> <button id=\"open-file-button\" type=\"button\" role=\"menuitem\">Open a file&hellip;</button><div class=\"menu-separator\" role=\"separator\"></div><button id=\"reset-button\" type=\"button\" role=\"menuitem\">Reset the code</button><div class=\"menu-separator\" role=\"separator\"></div><div class=\"menu-info\"><div class=\"shortcut\"><span>Run</span><kbd id=\"run-shortcut\"></kbd></div><div class=\"shortcut\"><span>Format</span><kbd>Shift+Alt+F</kbd></div></div><div class=\"menu-separator\" role=\"separator\"></div><a id=\"about-link\" role=\"menuitem\" target=\"_blank\" rel=\"noopener\"></a></div><input id=\"file-input\" type=\"file\" accept=\".html,.htm,.zip,text/html,application/zip\" tabindex=\"-1\" aria-hidden=\"true\" hidden><dialog id=\"load-error-dialog\" class=\"load-error-dialog\" aria-labelledby=\"load-error-title\" aria-describedby=\"load-error-description\"><div class=\"dialog-body load-error-body\"><div class=\"load-error-icon\"><svg aria-hidden=\"true\"><use href=\"#icon-alert\"/></svg></div><div class=\"load-error-text\"><h2 id=\"load-error-title\">Some of the code couldn&rsquo;t be loaded</h2><p id=\"load-error-description\">The editors for this code explain what went wrong. The rest of the code was loaded and run.</p><ul id=\"load-error-list\" class=\"load-error-list\"></ul></div></div><div class=\"dialog-footer\"><button class=\"run-button dialog-close\" type=\"button\">OK</button></div></dialog><dialog id=\"libraries-dialog\" aria-labelledby=\"libraries-title\"><div class=\"dialog-header\"><h2 id=\"libraries-title\">Libraries</h2><button class=\"icon-button dialog-close\" type=\"button\" title=\"Close\"><svg aria-hidden=\"true\"><use href=\"#icon-close\"/></svg></button></div><div class=\"dialog-body\"><div id=\"library-search\" class=\"library-search\"><input id=\"library-search-input\" type=\"search\" autocomplete=\"off\" spellcheck=\"false\" placeholder=\"Search cdnjs (eg. jquery, bootstrap, animate.css)\" aria-label=\"Search cdnjs\"><div id=\"library-search-status\" class=\"library-status\" role=\"status\"></div><div id=\"library-results\" class=\"library-results\"></div></div><form id=\"library-url-form\" class=\"library-url\"><input id=\"library-url-input\" type=\"text\" inputmode=\"url\" autocomplete=\"off\" spellcheck=\"false\" required placeholder=\"Or add the URL of a library\" aria-label=\"The URL of a library\"> <button type=\"submit\" class=\"text-button\" data-type=\"css\">Add CSS</button> <button type=\"submit\" class=\"text-button\" data-type=\"js\">Add JS</button></form><h3>CSS</h3><ol id=\"css-libraries\" class=\"library-list\" data-empty=\"No CSS libraries\"></ol><h3>JavaScript</h3><ol id=\"js-libraries\" class=\"library-list\" data-empty=\"No JavaScript libraries\"></ol><p class=\"dialog-note\">Libraries are added to the result in this order (before your code) the next time the code runs.</p></div><div class=\"dialog-footer\"><button id=\"libraries-run-button\" class=\"run-button\" type=\"button\"><svg aria-hidden=\"true\"><use href=\"#icon-run\"/></svg> <span>Run</span></button> <button class=\"text-button dialog-close\" type=\"button\">Done</button></div></dialog></div>";
  /**
   * Information about this package (eg. its version).
   * @type {{name: string, version: string, homepage: string, repoUrl: string, bugsUrl: string}}
   */
  const PACKAGE_INFO = {"name":"yourjs-page","version":"0.0.0","homepage":"https://westc.github.io/yourjs-page/","repoUrl":"https://github.com/westc/yourjs-page","bugsUrl":"https://github.com/westc/yourjs-page/issues"};

  /**
   * The code that runs in the viewer IFRAME.  It is turned into a string so
   * it can't use anything defined outside of it.
   */
  function viewerScript() {
    // Runs in the viewer IFRAME (see viewerScript() in main.js).  The page that
    // created the IFRAME calls window.yourjsPageViewer.init() once it has loaded.
    
    const LANGUAGE_KEYS = ['html', 'css', 'js'];
    const LANGUAGE_NAMES = {html: 'HTML', css: 'CSS', js: 'JavaScript'};
    const ACE_MODES = {html: 'ace/mode/html', css: 'ace/mode/css', js: 'ace/mode/javascript'};
    const LAYOUTS = ['top', 'left', 'right', 'tabs'];
    const TABS = [...LANGUAGE_KEYS, 'result'];
    const CONSOLE_LEVELS = ['log', 'info', 'debug', 'warn', 'error', 'result', 'command'];
    
    /** If the viewer is narrower than this the automatic layout is tabs. */
    const NARROW_WIDTH = 600;
    /** The smallest that dragging a divider can make something (in pixels). */
    const MIN_PANE_SIZE = 30;
    /**
     * How long the code needs to have been running without freezing the page (in
     * milliseconds) before it doesn't need to be run in safe mode the next time.
     */
    const SAFE_MODE_DELAY = 1000;
    /** The longest data URL that the result is loaded from (see createResultFrame()). */
    const MAX_DATA_URL_LENGTH = 1900000;
    /** Older console messages are removed once there are more than this. */
    const MAX_CONSOLE_ENTRIES = 1000;
    
    const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const RUN_SHORTCUT = IS_MAC ? 'Cmd+Enter' : 'Ctrl+Enter';
    const FORMAT_SHORTCUT = 'Shift+Alt+F';
    
    // Without allow-same-origin the result's code can't get to the viewer or to
    // the page (eg. its cookies).
    const RESULT_SANDBOX = 'allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-downloads allow-presentation';
    const RESULT_ALLOW = 'fullscreen; clipboard-read; clipboard-write';
    
    /** Where libraries are searched for. */
    const CDNJS_API_URL = 'https://api.cdnjs.com/libraries';
    /** Where the files of the libraries found on cdnjs are. */
    const CDNJS_FILES_URL = 'https://cdnjs.cloudflare.com/ajax/libs/';
    /** How long to wait after typing stops before searching (in milliseconds). */
    const SEARCH_DELAY = 250;
    /** The biggest file that can be opened (in bytes). */
    const MAX_OPEN_FILE_SIZE = 20 * 1024 * 1024;
    
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    
    const escapeHtml = text => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
    // Keeps "</style>" and "</script>" in the code from ending the element early.
    const escapeStyle = css => css.replace(/<\/(?=style)/gi, '<\\/');
    const escapeScript = js => js.replace(/<\/(?=script)/gi, '<\\/');
    
    /**
     * Creates an element.
     * @param {string} tagName
     * @param {Object=} props
     *   Properties to set (eg. `className` and `textContent`).
     * @param {(Node|string)[]=} children
     * @returns {HTMLElement}
     */
    function createElement(tagName, props, children) {
      const element = Object.assign(document.createElement(tagName), props);
      if (children) element.append(...children);
      return element;
    }
    
    /**
     * @param {string} url
     * @param {AbortSignal=} signal
     * @returns {Promise<any>}
     */
    async function fetchJson(url, signal) {
      const response = await fetch(url, {signal});
      if (!response.ok) throw new Error(`${url} responded with ${response.status}.`);
      return response.json();
    }
    
    /**
     * Loads a script into the viewer.
     * @param {string} url
     * @returns {Promise<void>}
     */
    function loadScript(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Could not load ${url}`));
        document.head.append(script);
      });
    }
    
    /** The kinds of loops that protectLoops() guards. */
    const LOOP_TYPES = ['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement'];
    
    /**
     * Adds a guard to the start of the body of every loop in the JavaScript which
     * stops the loop if it keeps the page busy for too long (see
     * __yourjsPageLoopGuard() in preview-runtime.js).  The guards are added to the
     * same lines so that the line numbers in errors don't change.  Needs Acorn.
     * @param {string} js
     * @returns {string}
     *   The code with the guards or, if it can't be parsed (eg. it has a syntax
     *   error which the browser will show when it runs), the code as it is.
     */
    function protectLoops(js) {
      let ast;
      try {
        ast = acorn.parse(js, {ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true});
      }
      catch (e) {
        return js;
      }
    
      const insertions = [];
      (function visit(node, depth) {
        if (!node || 'string' !== typeof node.type) return;
        const isLoop = LOOP_TYPES.includes(node.type);
        if (isLoop) {
          const guard = `if (__yourjsPageLoopGuard(${node.loc.start.line})) break;`;
          const {body} = node;
          if (body.type === 'BlockStatement') {
            insertions.push({position: body.start + 1, text: guard, depth});
          }
          else {
            // A body that isn't a block (eg. "while (x) y();") becomes one.
            insertions.push({position: body.start, text: `{${guard}`, depth}, {position: body.end, text: '}', depth});
          }
        }
        for (const value of Object.values(node)) {
          if (Array.isArray(value)) value.forEach(child => visit(child, depth + isLoop));
          else if (value && 'object' === typeof value) visit(value, depth + isLoop);
        }
      })(ast, 0);
    
      // From the end so the positions don't change.  Where an outer loop's body
      // starts at an inner loop (eg. "while (a) while (b) x;") the outer loop's
      // guard comes first.
      insertions.sort((a, b) => b.position - a.position || b.depth - a.depth);
      let result = js;
      for (const {position, text} of insertions) result = result.slice(0, position) + text + result.slice(position);
      return result;
    }
    
    /**
     * A short hash of some text (eg. to use in a storage key).
     * @param {string} text
     * @returns {string}
     */
    function hashText(text) {
      let hash = 5381;
      for (let index = 0; index < text.length; index++) hash = (Math.imul(hash, 33) ^ text.charCodeAt(index)) >>> 0;
      return hash.toString(36);
    }
    
    /**
     * Starts downloading a file.
     * @param {Blob} blob
     * @param {string} fileName
     */
    function download(blob, fileName) {
      const url = URL.createObjectURL(blob);
      const link = createElement('a', {href: url, download: fileName});
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    
    //#region ZIP files
    const CRC_TABLE = Array.from({length: 256}, (_, n) => {
      for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1;
      return n >>> 0;
    });
    
    /**
     * @param {Uint8Array} bytes
     * @returns {number}
     */
    function crc32(bytes) {
      let crc = -1;
      for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
      return (crc ^ -1) >>> 0;
    }
    
    /**
     * Makes a ZIP file.  The files are stored without compression (they are
     * small text files).
     * @param {{name: string, text: string}[]} files
     * @returns {Blob}
     */
    function createZip(files) {
      const encoder = new TextEncoder();
      const now = new Date();
      const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
      const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
      const localParts = [];
      const centralParts = [];
      let offset = 0;
      for (const {name, text} of files) {
        const nameBytes = encoder.encode(name);
        const data = encoder.encode(text);
        const crc = crc32(data);
    
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034B50, true);
        local.setUint16(4, 20, true);
        // The names are UTF-8.
        local.setUint16(6, 0x0800, true);
        local.setUint16(10, dosTime, true);
        local.setUint16(12, dosDate, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, data.length, true);
        local.setUint32(22, data.length, true);
        local.setUint16(26, nameBytes.length, true);
        localParts.push(local, nameBytes, data);
    
        const central = new DataView(new ArrayBuffer(46));
        central.setUint32(0, 0x02014B50, true);
        central.setUint16(4, 20, true);
        central.setUint16(6, 20, true);
        central.setUint16(8, 0x0800, true);
        central.setUint16(12, dosTime, true);
        central.setUint16(14, dosDate, true);
        central.setUint32(16, crc, true);
        central.setUint32(20, data.length, true);
        central.setUint32(24, data.length, true);
        central.setUint16(28, nameBytes.length, true);
        central.setUint32(42, offset, true);
        centralParts.push(central, nameBytes);
    
        offset += 30 + nameBytes.length + data.length;
      }
      const centralSize = centralParts.reduce((size, part) => size + part.byteLength, 0);
      const end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054B50, true);
      end.setUint16(8, files.length, true);
      end.setUint16(10, files.length, true);
      end.setUint32(12, centralSize, true);
      end.setUint32(16, offset, true);
      return new Blob([...localParts, ...centralParts, end], {type: 'application/zip'});
    }
    
    /** The biggest file in a ZIP file that is read (in bytes). */
    const MAX_ZIP_FILE_SIZE = 20 * 1024 * 1024;
    
    /**
     * Reads the list of files in a ZIP file (that are stored or deflated).  A
     * file's contents are only read (and decompressed) when it is used.
     * @param {ArrayBuffer} buffer
     * @returns {Map<string, () => Promise<Uint8Array>>}
     *   A function that reads each file by its path.
     */
    function readZip(buffer) {
      const view = new DataView(buffer);
      // The end of central directory record is at the end (before a comment).
      let end = -1;
      for (let index = buffer.byteLength - 22; index >= Math.max(0, buffer.byteLength - 22 - 0xFFFF); index--) {
        if (view.getUint32(index, true) === 0x06054B50) {
          end = index;
          break;
        }
      }
      if (end < 0) throw new Error('This is not a ZIP file.');
    
      const decoder = new TextDecoder();
      const files = new Map();
      let position = view.getUint32(end + 16, true);
      for (let count = view.getUint16(end + 10, true); count--;) {
        if (view.getUint32(position, true) !== 0x02014B50) throw new Error('The ZIP file is damaged.');
        const method = view.getUint16(position + 10, true);
        const compressedSize = view.getUint32(position + 20, true);
        const nameLength = view.getUint16(position + 28, true);
        const localOffset = view.getUint32(position + 42, true);
        const name = decoder.decode(new Uint8Array(buffer, position + 46, nameLength));
        position += 46 + nameLength + view.getUint16(position + 30, true) + view.getUint16(position + 32, true);
    
        // Skips folders and the extra files that macOS adds.
        if (name.endsWith('/') || /(^|\/)__MACOSX\//.test(name) || (method !== 0 && method !== 8)) continue;
        files.set(name, async () => {
          const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
          const data = new Uint8Array(buffer, dataStart, compressedSize);
          if (method === 0) return data;
          // Stops a small file that decompresses into a huge one (a "ZIP bomb").
          const chunks = [];
          let size = 0;
          const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
          for (let result; !(result = await reader.read()).done;) {
            size += result.value.length;
            if (size > MAX_ZIP_FILE_SIZE) {
              reader.cancel();
              throw new Error(`${name} is too big.`);
            }
            chunks.push(result.value);
          }
          return new Uint8Array(await new Blob(chunks).arrayBuffer());
        });
      }
      return files;
    }
    //#endregion
    
    /** The viewport that documents get if they don't have one. */
    const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1';
    
    /**
     * Turns a parsed document back into HTML.
     * @param {Document} doc
     * @returns {string}
     */
    function serializeDocument(doc) {
      return Array.from(doc.childNodes, node => node.nodeType === Node.DOCUMENT_TYPE_NODE
        ? new XMLSerializer().serializeToString(node)
        : node.nodeType === Node.COMMENT_NODE ? `<!--${node.data}-->` : node.outerHTML
      ).join('\n');
    }
    
    /**
     * Whether a script runs JavaScript (instead of being eg. a template).
     * @param {Element} script
     * @returns {boolean}
     */
    function isJavaScript(script) {
      const type = (script.getAttribute('type') ?? '').trim().toLowerCase();
      return !type || /^(module|(text|application)\/(java|ecma)script)$/.test(type);
    }
    
    /**
     * Gets the code (and libraries) from an HTML document such as one made by
     * "Download as an HTML file" (or a ZIP file's index.html).  These are found
     * where they are put by the viewer:
     * - The libraries are the stylesheets and scripts at the start of the head.
     * - The CSS is the last <style> (or local stylesheet) in the head.
     * - The JavaScript is the script at the end of the body.  Scripts from
     *   elsewhere right before it are libraries too.
     * Everything else (eg. the <style> elements and scripts that were in the
     * HTML) stays in the HTML.
     * @param {string} html
     * @param {(url: string) => string?} getLocalFile
     *   Gets the text of a file that the document refers to (eg. in the same ZIP
     *   file) or null if there isn't one.
     * @param {string} defaultTitle
     *   The title that the viewer gives documents that don't have one.
     * @returns {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[], integrities: Map<string, string>}}
     */
    function parseHtmlDocument(html, getLocalFile, defaultTitle) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const {documentElement: root, head, body} = doc;
      const result = {html: '', css: '', js: '', cssUrls: [], jsUrls: [], integrities: new Map()};
      // The code in a <style> or <script> starts and ends with the new lines
      // that "Download as an HTML file" adds.
      const trimCode = code => code.replace(/^\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
      const isStylesheet = element => element.matches('link[rel~="stylesheet" i][href]');
      const isScriptFile = element => element.matches('script[src]') && isJavaScript(element);
    
      /**
       * Removes an element along with the new line (or other space) after it.
       * @param {Element} element
       */
      function remove(element) {
        const next = element.nextSibling;
        if (next?.nodeType === Node.TEXT_NODE && !next.data.trim()) next.remove();
        element.remove();
      }
    
      /**
       * Makes an element a library (if it isn't a file in the ZIP file).
       * @param {Element} element
       * @param {string[]} urls
       * @returns {boolean}
       */
      function addLibrary(element, urls) {
        const url = element.getAttribute(element.localName === 'link' ? 'href' : 'src');
        if (getLocalFile(url) != null) return false;
        urls.push(url);
        const integrity = element.getAttribute('integrity');
        if (integrity) result.integrities.set(url, integrity);
        remove(element);
        return true;
      }
    
      // The libraries at the start of the head (after things like <meta>).
      for (const element of Array.from(head.children)) {
        if (element.matches('meta, title, base')) continue;
        const urls = isStylesheet(element) ? result.cssUrls : isScriptFile(element) ? result.jsUrls : null;
        if (!urls || !addLibrary(element, urls)) break;
      }
    
      // The CSS
      const cssElement = Array.from(head.children).reverse()
        .find(element => element.localName === 'style' || (isStylesheet(element) && getLocalFile(element.getAttribute('href')) != null));
      if (cssElement) {
        result.css = cssElement.localName === 'style'
          ? trimCode(cssElement.textContent)
          : getLocalFile(cssElement.getAttribute('href'));
        remove(cssElement);
      }
    
      // The JavaScript and the libraries right before it
      const jsElement = body.lastElementChild;
      if (jsElement?.localName === 'script' && isJavaScript(jsElement)) {
        const code = jsElement.hasAttribute('src') ? getLocalFile(jsElement.getAttribute('src')) : trimCode(jsElement.textContent);
        if (code != null) {
          result.js = code;
          remove(jsElement);
          const jsUrls = [];
          while (body.lastElementChild && isScriptFile(body.lastElementChild) && addLibrary(body.lastElementChild, jsUrls));
          result.jsUrls.push(...jsUrls.reverse());
        }
      }
    
      // If all that is left is what the viewer adds to HTML that is only what
      // goes in the body, only what is in the body is kept.
      const isOnlyBody = Array.from(head.childNodes).every(node => node.nodeType === Node.TEXT_NODE
          ? !node.data.trim()
          : node.matches?.(`meta[charset="utf-8" i], meta[name="viewport" i][content="${DEFAULT_VIEWPORT}"]`)
            || (node.localName === 'title' && node.textContent === defaultTitle))
        && Array.from(root.attributes).every(({name, value}) => name === 'lang' && value === 'en')
        && !body.attributes.length;
      result.html = isOnlyBody
        ? body.innerHTML.replace(/^\r?\n/, '').trimEnd()
        : serializeDocument(doc).trimEnd();
      return result;
    }
    
    window.yourjsPageViewer = {
      /**
       * Starts the viewer.
       * @param {Object} config
       * @param {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[]}} config.code
       * @param {{layout?: string, tab?: string, theme: "light"|"dark"|null, title: string, wordWrap: boolean, readOnly: boolean, showConsole: boolean, librarySearch: boolean, editors: string[]?}} config.options
       * @param {{key: string, language: string, message: string}[]} config.loadErrors
       *   The code that couldn't be loaded (eg. from a URL or a gist).
       * @param {string} config.runtimeCode
       *   The code of previewRuntime() in main.js.
       * @param {string[]} config.formatterUrls
       *   The js-beautify files to load the first time code is formatted.
       * @param {{name: string, version: string, homepage: string}} config.packageInfo
       * @param {{setMaximized: (isMaximized: boolean) => void}} host
       *   What the viewer can ask the page to do.
       */
      init(config, host) {
        const {options, loadErrors, runtimeCode, formatterUrls, parserUrl, pageUrl, packageInfo} = config;
        const app = $('#app');
        const splash = $('#splash');
    
        if (!window.ace) {
          splash.classList.add('failed');
          let code = {...config.code};
          return {
            getCode: () => ({...code}),
            setCode(newCode) {
              code = {...newCode};
            },
            run() {},
            destroy() {},
          };
        }
    
        const originalCode = {...config.code};
        const originalCodeJson = JSON.stringify(originalCode);
        // The URLs of the CSS and JavaScript libraries (in the order they are
        // added to the result).
        const libraries = {css: [...config.code.cssUrls], js: [...config.code.jsUrls]};
        /**
         * The integrity hashes of library URLs (eg. from cdnjs).
         * @type {Map<string, string>}
         */
        const integrities = new Map();
        const runButton = $('#run-button');
        const consoleButton = $('#console-button');
        const consoleBadge = $('#console-badge');
        const consoleEntries = $('#console-entries');
        const consoleInput = $('#console-input');
        const fullscreenButton = $('#fullscreen-button');
    
        let layout = 'top';
        let isLayoutAuto = !LAYOUTS.includes(options.layout);
        // The editors that are shown (the others still have code that runs).
        const shownKeys = LANGUAGE_KEYS.filter(key => !options.editors || options.editors.includes(key));
        let activeTab = TABS.includes(options.tab) && (options.tab === 'result' || shownKeys.includes(options.tab))
          ? options.tab
          : 'result';
        let isConsoleShown = false;
        let unseenCount = 0;
        let unseenErrorCount = 0;
        let isMaximized = false;
        let lastRunCode = '';
        /** Sent with messages to (and from) the result IFRAME. */
        let runId = '';
        /** @type {HTMLIFrameElement?} */
        let resultFrame = null;
    
        //#region Theme
        const darkQuery = matchMedia('(prefers-color-scheme: dark)');
        const getTheme = () => options.theme ?? (darkQuery.matches ? 'dark' : 'light');
        const getAceTheme = () => `ace/theme/cloud_editor${getTheme() === 'dark' ? '_dark' : ''}`;
        function applyTheme() {
          document.documentElement.dataset.theme = getTheme();
          for (const key of LANGUAGE_KEYS) editors[key]?.setTheme(getAceTheme());
        }
        // Without a theme the system's color scheme is followed.
        if (!options.theme) darkQuery.addEventListener('change', applyTheme);
        //#endregion
    
        //#region Editors
        /** @type {{[key: string]: AceAjax.Editor}} */
        const editors = {};
        for (const key of LANGUAGE_KEYS) {
          const panel = $(`.panel[data-lang="${key}"]`);
          const editor = ace.edit($('.editor', panel), {
            mode: ACE_MODES[key],
            theme: getAceTheme(),
            fontSize: 13,
            tabSize: 2,
            useSoftTabs: true,
            showPrintMargin: false,
            wrap: options.wordWrap,
            readOnly: options.readOnly,
          });
          editor.setKeyboardHandler('ace/keyboard/vscode');
          // -1 puts the cursor at the start instead of selecting everything.
          editor.setValue(config.code[key], -1);
          // Keeps undo from removing the starting code.
          editor.session.getUndoManager().reset();
          if (options.readOnly) {
            editor.setHighlightActiveLine(false);
            editor.session.setUseWorker(false);
          }
          // The HTML is only part of a document so its warnings (eg. that there
          // isn't a doctype) don't apply, and Ace's CSS checker doesn't know about
          // newer CSS (eg. place-items).
          if (key !== 'js') editor.session.setUseWorker(false);
          editor.on('change', scheduleRunButtonUpdate);
          // Ace only notices when the window is resized.
          new ResizeObserver(() => editor.resize()).observe(editor.container);
          editors[key] = editor;
    
          const title = $('.panel-title', panel);
          title.title = `Collapse or expand the ${LANGUAGE_NAMES[key]}`;
          title.addEventListener('click', () => {
            if (layout !== 'tabs') setCollapsed(key, !panel.classList.contains('is-collapsed'));
          });
    
          const formatButton = $('.format-button', panel);
          formatButton.title = `Format the ${LANGUAGE_NAMES[key]} (${FORMAT_SHORTCUT})`;
          formatButton.hidden = options.readOnly;
          formatButton.addEventListener('click', () => format(key));
        }
    
        // Removes the editors that aren't shown (along with a divider next to
        // each one) and their tabs.
        for (const key of LANGUAGE_KEYS.filter(key => !shownKeys.includes(key))) {
          const panel = $(`.panel[data-lang="${key}"]`);
          const divider = panel.nextElementSibling ?? panel.previousElementSibling;
          if (divider?.classList.contains('divider')) divider.remove();
          panel.remove();
          $(`#tabs [data-tab="${key}"]`).remove();
        }
        // Without editors only the result is shown.
        app.classList.toggle('has-no-editors', !shownKeys.length);
        $('#layout-button').hidden = !shownKeys.length;
    
        /**
         * @param {string} key
         * @param {boolean} isCollapsed
         */
        function setCollapsed(key, isCollapsed) {
          const panel = $(`.panel[data-lang="${key}"]`);
          if (!panel) return;
          panel.classList.toggle('is-collapsed', isCollapsed);
          $('.panel-title', panel).setAttribute('aria-expanded', `${!isCollapsed}`);
        }
    
        /** @returns {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[]}} */
        function getCode() {
          return {
            ...Object.fromEntries(LANGUAGE_KEYS.map(key => [key, editors[key].getValue()])),
            cssUrls: [...libraries.css],
            jsUrls: [...libraries.js],
          };
        }
    
        /**
         * @param {{html?: string, css?: string, js?: string, cssUrls?: string[], jsUrls?: string[]}} code
         */
        function setCode(code) {
          for (const key of LANGUAGE_KEYS) {
            // Setting the document's value (instead of the session's) can be
            // undone.
            if (code[key] != null && editors[key].getValue() !== code[key]) {
              editors[key].session.doc.setValue(code[key]);
              editors[key].clearSelection();
            }
          }
          if (code.cssUrls) libraries.css = [...code.cssUrls];
          if (code.jsUrls) libraries.js = [...code.jsUrls];
          renderLibraries();
          updateRunButton();
        }
    
        let runButtonTimer = 0;
        /** Updates the run button soon (instead of after every key). */
        function scheduleRunButtonUpdate() {
          clearTimeout(runButtonTimer);
          runButtonTimer = setTimeout(updateRunButton, 150);
        }
    
        /** Shows whether the code has changed since it was run. */
        function updateRunButton() {
          clearTimeout(runButtonTimer);
          runButton.classList.toggle('is-stale', !!lastRunCode && JSON.stringify(getCode()) !== lastRunCode);
        }
        //#endregion
    
        //#region Formatting
        /** @type {Promise<void>?} */
        let formatterPromise = null;
    
        /** Loads js-beautify the first time it is needed. */
        function loadFormatter() {
          formatterPromise ??= formatterUrls.reduce(
            (promise, url) => promise.then(() => loadScript(url)),
            Promise.resolve()
          );
          // Lets it be tried again later.
          formatterPromise.catch(() => formatterPromise = null);
          return formatterPromise;
        }
    
        /**
         * Formats the code in one of the editors.
         * @param {string} key
         */
        async function format(key) {
          if (options.readOnly) return;
          try {
            await loadFormatter();
          }
          catch (e) {
            alert('The code formatter (js-beautify) could not be loaded.');
            return;
          }
          const editor = editors[key];
          const beautify = {html: window.html_beautify, css: window.css_beautify, js: window.js_beautify}[key];
          const code = editor.getValue();
          const formatted = beautify(code, {
            indent_size: editor.session.getTabSize(),
            preserve_newlines: true,
            max_preserve_newlines: 2,
            wrap_line_length: 0,
            end_with_newline: /\n$/.test(code),
          });
          if (formatted !== code) {
            const {row} = editor.getCursorPosition();
            editor.session.doc.setValue(formatted);
            editor.clearSelection();
            editor.gotoLine(Math.min(row + 1, editor.session.getLength()), 0, false);
          }
          editor.focus();
        }
        //#endregion
    
        //#region Running the code
        /**
         * Makes the document of the result (or of a download) by putting the
         * libraries, the CSS and the JavaScript into the HTML.  The HTML can be a
         * whole document (with <html>, <head> and <body>) or only what goes in the
         * body.  Like JSBin:
         * - The libraries go at the start of the head (before the stylesheets and
         *   scripts that are in the HTML).
         * - The CSS goes at the end of the head.
         * - The JavaScript goes at the end of the body.
         * @param {ReturnType<getCode>} code
         * @param {{runId?: string, fileNames?: {css: string, js: string}}=} buildOptions
         *   `runId` makes the document for the result (with the runtime that
         *   sends its messages with this ID).  Otherwise it is a document that
         *   works on its own and, if `fileNames` is given, the CSS and JavaScript
         *   are linked to these files instead of being in the document.
         * @returns {string}
         */
        function buildDocument(code, {runId, fileNames} = {}) {
          const isResult = runId != null;
          const doc = new DOMParser().parseFromString(code.html, 'text/html');
          const {documentElement: root, head, body} = doc;
          // Escaping "<" keeps something like "</script>" in the code from ending
          // the script early.
          const toJson = value => JSON.stringify(value).replace(/</g, '\\u003C');
    
          /**
           * @param {string} tagName
           * @param {{[name: string]: string}=} attributes
           * @param {string=} text
           */
          function create(tagName, attributes = {}, text) {
            const element = doc.createElement(tagName);
            for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
            if (text != null) element.textContent = text;
            return element;
          }
    
          // The attributes that make the browser check a library's integrity.
          const getIntegrityAttributes = url => integrities.has(url)
            ? {integrity: integrities.get(url), crossorigin: 'anonymous'}
            : {};
    
          // A whole document is used as it is except that it needs to say that it
          // is UTF-8 (which downloads are).  HTML that is only what goes in the
          // body also gets a viewport and a title.
          const isWholeDocument = /<(html|head|body)[\s>]/i.test(code.html);
          if (!head.querySelector('meta[charset]')) head.prepend(create('meta', {charset: 'utf-8'}), '\n');
          const headStart = [];
          if (!isWholeDocument) {
            headStart.push(create('meta', {name: 'viewport', content: DEFAULT_VIEWPORT}));
            const title = options.title || (isResult ? '' : 'YourJS Page');
            if (title) headStart.push(create('title', {}, title));
          }
          // Relative URLs in the HTML are relative to the page (like they would be
          // in a srcdoc document) unless the HTML has its own <base>.
          if (isResult && !head.querySelector('base[href]')) headStart.unshift(create('base', {href: document.baseURI}));
          // This runs first so that it can catch libraries that fail to load.
          if (isResult) headStart.push(create('script', {}, `(${runtimeCode})(${toJson({runId, loopTimeout: options.loopTimeout})});`));
          headStart.push(
            ...code.cssUrls.map(url => create('link', {rel: 'stylesheet', href: url, ...getIntegrityAttributes(url)})),
            ...code.jsUrls.map(url => create('script', {src: url, ...getIntegrityAttributes(url)})),
          );
          // Things like <meta charset> that are in the HTML stay first.
          const firstOther = Array.from(head.children).find(element => !element.matches('meta, title, base')) ?? null;
          // Each element that is added is followed by a new line (which
          // parseHtmlDocument() removes along with it).
          for (const element of headStart) {
            head.insertBefore(element, firstOther);
            head.insertBefore(doc.createTextNode('\n'), firstOther);
          }
    
          // HTML that is only what goes in the body is laid out neatly.
          if (!isWholeDocument) {
            root.insertBefore(doc.createTextNode('\n'), head);
            root.insertBefore(doc.createTextNode('\n'), body);
            root.append('\n');
            head.prepend('\n');
            body.prepend('\n');
            body.append('\n');
            if (!isResult && !root.hasAttribute('lang')) root.setAttribute('lang', 'en');
          }
    
          head.append(fileNames
            ? create('link', {rel: 'stylesheet', href: fileNames.css})
            : create('style', {}, isResult ? escapeStyle(code.css) : `\n${escapeStyle(code.css)}\n`), '\n');
          body.append(fileNames
            ? create('script', {src: fileNames.js})
            : create('script', {}, isResult ? `yourjsPageRunJs(${toJson(code.js)});` : `\n${escapeScript(code.js)}\n`), '\n');
          if (!doc.doctype) doc.insertBefore(doc.implementation.createDocumentType('html', '', ''), doc.firstChild);
          return `${serializeDocument(doc)}\n`;
        }
    
        /**
         * @param {string} html
         * @returns {HTMLIFrameElement}
         */
        function createResultFrame(html) {
          const frame = document.createElement('iframe');
          frame.title = 'Result';
          frame.setAttribute('sandbox', RESULT_SANDBOX);
          frame.setAttribute('allow', RESULT_ALLOW);
          // A data URL is used because Safari hides the details of errors (eg.
          // their messages) in srcdoc documents.  Documents that are too big for
          // a URL use srcdoc.
          const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
          if (url.length <= MAX_DATA_URL_LENGTH) frame.src = url;
          else frame.srcdoc = html;
          return frame;
        }
    
        /** @type {Promise<void>?} */
        let parserPromise = null;
    
        /**
         * Adds the loop guards to JavaScript (see protectLoops()) unless loop
         * protection is turned off.  Acorn is loaded the first time code with a
         * loop runs.
         * @param {string} js
         * @returns {Promise<string>}
         */
        async function getProtectedJs(js) {
          if (!(options.loopTimeout > 0) || !/\b(for|while|do)\b/.test(js)) return js;
          try {
            await (parserPromise ??= loadScript(parserUrl));
          }
          catch (e) {
            // Lets it be tried again later.
            parserPromise = null;
            addConsoleEntry({level: 'warn', parts: [{kind: 'string', text: 'Loops can\u2019t be stopped if they run for too long because the JavaScript parser (Acorn) couldn\u2019t be loaded.'}]});
            return js;
          }
          return protectLoops(js);
        }
    
        /**
         * Runs the code in a new result IFRAME.
         * @param {boolean} showResult
         *   If true and the tabs layout is being used the result is shown.
         */
        async function run(showResult) {
          const code = getCode();
          lastRunCode = JSON.stringify(code);
          updateRunButton();
          clearConsole();
          $('#safe-mode-notice').hidden = true;
          const thisRunId = runId = `${Date.now()}-${Math.random()}`;
          // The old result stops right away (eg. if it is stuck in a loop).
          resultFrame?.remove();
          resultFrame = null;
          if (showResult && layout === 'tabs') setTab('result');
          setRunningOriginalCode(lastRunCode === originalCodeJson);
    
          const js = await getProtectedJs(code.js);
          // Another run started while waiting.
          if (runId !== thisRunId) return;
          resultFrame = createResultFrame(buildDocument({...code, js}, {runId}));
          $('#result').append(resultFrame);
        }
    
        // Messages from the result IFRAME.
        addEventListener('message', event => {
          const data = event.data;
          if (!resultFrame || event.source !== resultFrame.contentWindow || data?.yourjsPage !== runId) return;
          if (data.type === 'log') addConsoleEntry(data);
          else if (data.type === 'clear') clearConsole();
          else if (data.type === 'run') run(true);
          else if (data.type === 'loaded') {
            // The code is only known to have finished once the page has been fine
            // for a moment.  (Leaving the page can make the result finish loading,
            // eg. in Firefox, but then this never happens.)
            const loadedRunId = runId;
            setTimeout(() => {
              if (runId === loadedRunId) setRunningOriginalCode(false);
            }, SAFE_MODE_DELAY);
          }
          else if (data.type === 'children') {
            pendingChildren.get(data.requestId)?.(Array.isArray(data.children) ? data.children : []);
            pendingChildren.delete(data.requestId);
          }
        });
    
        /** Opens the result in a new tab (still in a sandbox). */
        async function openInNewTab() {
          // The tab is opened right away so that it isn't blocked as a pop-up.
          const newWindow = open('', '_blank');
          if (!newWindow) return;
          const code = getCode();
          code.js = await getProtectedJs(code.js);
          const doc = newWindow.document;
          doc.open();
          doc.write([
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            `<title>${escapeHtml(options.title || 'YourJS Page')}</title>`,
            '<style>html,body{height:100%;margin:0}iframe{border:0;display:block;height:100%;width:100%}</style>',
            '</head>',
            '<body></body>',
            '</html>',
          ].join(''));
          doc.close();
          doc.body.append(createResultFrame(buildDocument(code, {runId: ''})));
          // The result can't do anything to this page through the new tab.
          newWindow.opener = null;
        }
        //#endregion
    
        //#region Console
        /**
         * Adds a message to the console.
         * @param {{level: string, parts: {kind: string, text: string}[], depth?: number, location?: {line: number, column: number}}} data
         */
        function addConsoleEntry({level, parts, depth, location, table}) {
          if (!CONSOLE_LEVELS.includes(level) || !Array.isArray(parts)) return;
          const entry = document.createElement('div');
          entry.className = `entry level-${level}`;
          if (depth > 0) entry.style.paddingLeft = `${20 + Math.min(depth, 20) * 16}px`;
    
          // Where the properties of expanded values go.
          const trees = createElement('div', {className: 'entry-trees'});
          const text = createElement('div', {className: 'entry-text'});
          parts.forEach((part, index) => {
            if (index) text.append(' ');
            text.append(createValueElement(part, trees));
          });
          if (table) text.append(createTable(table));
          entry.append(text);
    
          // Where the error happened in the JavaScript (if it is shown).
          const line = Math.floor(location?.line);
          if (line > 0 && shownKeys.includes('js')) {
            const column = Math.max(1, Math.floor(location.column) || 1);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'entry-location';
            button.textContent = `script.js:${line}`;
            button.title = 'Show this line in the JavaScript';
            button.addEventListener('click', () => goToJsLine(line, column));
            entry.append(button);
          }
          entry.append(trees);
    
          const isAtBottom = consoleEntries.scrollHeight - consoleEntries.scrollTop - consoleEntries.clientHeight < 4;
          consoleEntries.append(entry);
          while (consoleEntries.childElementCount > MAX_CONSOLE_ENTRIES) consoleEntries.firstElementChild.remove();
          if (isAtBottom) consoleEntries.scrollTop = consoleEntries.scrollHeight;
    
          if (!isConsoleShown && level !== 'command') {
            unseenCount++;
            if (level === 'error') unseenErrorCount++;
            updateConsoleBadge();
          }
        }
    
        /**
         * Shows a value in the console.  Values that can be expanded (eg. objects)
         * show their properties (from the result) when clicked.
         * @param {{kind?: string, text?: string, id?: number}} part
         * @param {HTMLElement} treeContainer
         *   Where the properties go.
         * @returns {HTMLElement}
         */
        function createValueElement(part, treeContainer) {
          const element = createElement('span', {textContent: `${part?.text ?? ''}`});
          if (/^\w+$/.test(part?.kind ?? '')) element.className = `kind-${part.kind}`;
          if (!Number.isInteger(part?.id)) return element;
    
          element.classList.add('expander');
          element.tabIndex = 0;
          element.setAttribute('role', 'button');
          element.setAttribute('aria-expanded', 'false');
          /** @type {HTMLElement?} */
          let tree = null;
          const toggle = async () => {
            const isExpanded = element.getAttribute('aria-expanded') !== 'true';
            element.setAttribute('aria-expanded', `${isExpanded}`);
            if (tree) {
              tree.hidden = !isExpanded;
              return;
            }
            tree = createElement('div', {className: 'tree'});
            treeContainer.append(tree);
            const children = await requestChildren(part.id);
            tree.replaceChildren(...children.map(child => {
              const childTree = createElement('div', {className: 'tree-children'});
              const row = createElement('div', {className: 'tree-row'}, [
                createElement('span', {className: 'tree-key', textContent: `${child?.key ?? ''}`}),
                `${child?.separator ?? ': '}`,
                createValueElement(child, childTree),
              ]);
              return createElement('div', {}, [row, childTree]);
            }));
            scrollIntoConsoleView(tree);
          };
          element.addEventListener('click', toggle);
          element.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          });
          return element;
        }
    
        /**
         * Scrolls the console (but not the page) so that as much of an element as
         * possible can be seen.
         * @param {HTMLElement} element
         */
        function scrollIntoConsoleView(element) {
          const elementRect = element.getBoundingClientRect();
          const consoleRect = consoleEntries.getBoundingClientRect();
          const below = elementRect.bottom - consoleRect.bottom;
          // The whole element if it fits or else as much as fits under its value.
          if (below > 0) consoleEntries.scrollTop += Math.min(below, elementRect.top - consoleRect.top - 24);
        }
    
        /** The requests for the properties of values (by their IDs). */
        const pendingChildren = new Map();
        let nextRequestId = 1;
    
        /**
         * Gets the properties of a logged value from the result.
         * @param {number} id
         * @returns {Promise<any[]>}
         */
        function requestChildren(id) {
          return new Promise(resolve => {
            const requestId = nextRequestId++;
            pendingChildren.set(requestId, resolve);
            resultFrame?.contentWindow.postMessage({yourjsPage: runId, type: 'expand', id, requestId}, '*');
          });
        }
    
        /**
         * Shows what console.table() logged.
         * @param {{columns: string[], rows: ({kind: string, text: string}?)[][]}} table
         * @returns {HTMLElement}
         */
        function createTable({columns, rows}) {
          if (!Array.isArray(columns) || !Array.isArray(rows)) return createElement('span');
          const cell = (tagName, part) => {
            const element = createElement(tagName, {textContent: `${part?.text ?? ''}`});
            if (/^\w+$/.test(part?.kind ?? '')) element.className = `kind-${part.kind}`;
            return element;
          };
          return createElement('div', {className: 'console-table-wrapper'}, [
            createElement('table', {className: 'console-table'}, [
              createElement('thead', {}, [createElement('tr', {}, columns.map(column => cell('th', {text: column})))]),
              createElement('tbody', {}, rows.filter(Array.isArray).map(row => createElement('tr', {}, row.map(part => cell('td', part))))),
            ]),
          ]);
        }
    
        function clearConsole() {
          consoleEntries.replaceChildren();
          // The values that were being expanded are gone.
          for (const resolve of pendingChildren.values()) resolve([]);
          pendingChildren.clear();
          unseenCount = unseenErrorCount = 0;
          updateConsoleBadge();
        }
    
        function updateConsoleBadge() {
          consoleBadge.hidden = !unseenCount;
          consoleBadge.textContent = unseenCount > 99 ? '99+' : `${unseenCount}`;
          consoleBadge.classList.toggle('has-errors', !!unseenErrorCount);
          consoleButton.title = unseenCount
            ? `Console (${unseenCount} new message${unseenCount === 1 ? '' : 's'})`
            : 'Console';
        }
    
        /**
         * @param {boolean} isShown
         * @param {boolean=} showResult
         *   If true (the default) and the tabs layout is being used, showing the
         *   console also shows the result (where the console is).
         */
        function setConsoleShown(isShown, showResult = true) {
          isConsoleShown = isShown;
          app.classList.toggle('is-console-shown', isShown);
          consoleButton.setAttribute('aria-pressed', `${isShown}`);
          if (isShown) {
            unseenCount = unseenErrorCount = 0;
            updateConsoleBadge();
            consoleEntries.scrollTop = consoleEntries.scrollHeight;
            if (showResult && layout === 'tabs') setTab('result');
          }
        }
    
        /**
         * Shows a line of the JavaScript (eg. where an error happened).
         * @param {number} line
         * @param {number} column
         */
        function goToJsLine(line, column) {
          if (layout === 'tabs') setTab('js');
          else setCollapsed('js', false);
          const editor = editors.js;
          editor.gotoLine(line, column - 1, false);
          editor.scrollToLine(line - 1, true, false);
          editor.focus();
        }
    
        // The code typed into the console (newest last).
        const consoleHistory = [];
        let historyIndex = 0;
    
        function resizeConsoleInput() {
          consoleInput.style.height = 'auto';
          consoleInput.style.height = `${consoleInput.scrollHeight}px`;
        }
    
        consoleInput.addEventListener('input', resizeConsoleInput);
        consoleInput.addEventListener('keydown', event => {
          const {value, selectionStart, selectionEnd} = consoleInput;
          if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            if (!value.trim()) return;
            if (consoleHistory.at(-1) !== value) consoleHistory.push(value);
            historyIndex = consoleHistory.length;
            addConsoleEntry({level: 'command', parts: [{kind: 'string', text: value}]});
            const thisRunId = runId;
            getProtectedJs(value).then(code => {
              if (runId !== thisRunId) return;
              if (resultFrame) resultFrame.contentWindow.postMessage({yourjsPage: runId, type: 'eval', code}, '*');
              else addConsoleEntry({level: 'error', parts: [{kind: 'string', text: 'The code can\u2019t be run until the result has loaded.'}]});
            });
            consoleInput.value = '';
            resizeConsoleInput();
          }
          // Like the browser's console, the up arrow on the first line (or the
          // down arrow on the last line) goes through what was typed before.
          else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && selectionStart === selectionEnd) {
            const isUp = event.key === 'ArrowUp';
            const isOnEdgeLine = isUp
              ? !value.slice(0, selectionStart).includes('\n')
              : !value.slice(selectionEnd).includes('\n');
            const newIndex = historyIndex + (isUp ? -1 : 1);
            if (!isOnEdgeLine || newIndex < 0 || newIndex > consoleHistory.length) return;
            event.preventDefault();
            historyIndex = newIndex;
            consoleInput.value = consoleHistory[newIndex] ?? '';
            resizeConsoleInput();
          }
        });
    
        consoleButton.addEventListener('click', () => setConsoleShown(!isConsoleShown));
        $('#close-console-button').addEventListener('click', () => setConsoleShown(false));
        $('#clear-console-button').addEventListener('click', clearConsole);
        //#endregion
    
        //#region Layout and tabs
        /**
         * @param {string} newLayout
         */
        function setLayout(newLayout) {
          layout = newLayout;
          for (const name of LAYOUTS) app.classList.toggle(`layout-${name}`, name === layout);
          for (const item of $$('#layout-menu [data-layout]')) {
            item.setAttribute('aria-checked', `${item.dataset.layout === layout}`);
          }
        }
    
        /**
         * Shows one of the tabs (in the tabs layout).
         * @param {string} tab
         */
        function setTab(tab) {
          activeTab = tab;
          app.dataset.tab = tab;
          for (const panel of $$('.panel')) panel.classList.toggle('is-active-tab', panel.dataset.lang === tab);
          for (const button of $$('#tabs [data-tab]')) {
            button.setAttribute('aria-selected', `${button.dataset.tab === tab}`);
          }
        }
    
        const getAutoLayout = () => innerWidth < NARROW_WIDTH ? 'tabs' : 'top';
        setLayout(isLayoutAuto ? getAutoLayout() : options.layout);
        setTab(activeTab);
        // Until a layout is chosen it depends on the width of the viewer.
        addEventListener('resize', () => {
          if (isLayoutAuto && getAutoLayout() !== layout) setLayout(getAutoLayout());
        });
    
        for (const button of $$('#tabs [data-tab]')) {
          button.addEventListener('click', () => {
            setTab(button.dataset.tab);
            editors[button.dataset.tab]?.focus();
          });
        }
    
        for (const item of $$('#layout-menu [data-layout]')) {
          item.addEventListener('click', () => {
            isLayoutAuto = false;
            setLayout(item.dataset.layout);
            closeMenu();
          });
        }
        //#endregion
    
        //#region Dividers
        const getFlexGrow = element => parseFloat(getComputedStyle(element).flexGrow) || 0;
    
        /**
         * Lets a divider be dragged to resize the things on either side of it.
         * @param {HTMLElement} divider
         * @param {PointerEvent} event
         */
        function startDragging(divider, event) {
          if (event.button !== 0) return;
          const prev = divider.previousElementSibling;
          const next = divider.nextElementSibling;
          if (prev.classList.contains('is-collapsed') || next.classList.contains('is-collapsed')) return;
          event.preventDefault();
    
          const isRow = getComputedStyle(divider.parentElement).flexDirection.startsWith('row');
          const prevRect = prev.getBoundingClientRect();
          const nextRect = next.getBoundingClientRect();
          const getSize = rect => isRow ? rect.width : rect.height;
          const startPrevSize = getSize(prevRect);
          const totalSize = startPrevSize + getSize(nextRect);
          // The flex-grow of each side is set so that they keep their share of
          // the space when the viewer is resized.
          const totalGrow = getFlexGrow(prev) + getFlexGrow(next);
          // The "right" layout reverses the order.
          const direction = (isRow ? prevRect.left <= nextRect.left : prevRect.top <= nextRect.top) ? 1 : -1;
          const startPosition = isRow ? event.clientX : event.clientY;
    
          divider.setPointerCapture(event.pointerId);
          divider.classList.add('is-dragging');
          app.classList.add('is-dragging-divider');
    
          function onMove(moveEvent) {
            const moved = direction * ((isRow ? moveEvent.clientX : moveEvent.clientY) - startPosition);
            const prevSize = Math.max(MIN_PANE_SIZE, Math.min(totalSize - MIN_PANE_SIZE, startPrevSize + moved));
            prev.style.flexGrow = `${totalGrow * prevSize / totalSize}`;
            next.style.flexGrow = `${totalGrow * (totalSize - prevSize) / totalSize}`;
          }
          function onEnd() {
            divider.removeEventListener('pointermove', onMove);
            divider.removeEventListener('pointerup', onEnd);
            divider.removeEventListener('pointercancel', onEnd);
            divider.classList.remove('is-dragging');
            app.classList.remove('is-dragging-divider');
          }
          divider.addEventListener('pointermove', onMove);
          divider.addEventListener('pointerup', onEnd);
          divider.addEventListener('pointercancel', onEnd);
        }
    
        for (const divider of $$('.divider')) {
          divider.addEventListener('pointerdown', event => startDragging(divider, event));
        }
        //#endregion
    
        //#region Menus
        /** @type {{button: HTMLElement, menu: HTMLElement}?} */
        let openMenuInfo = null;
    
        /**
         * @param {HTMLElement} button
         * @param {HTMLElement} menu
         */
        function openMenu(button, menu) {
          closeMenu();
          openMenuInfo = {button, menu};
          menu.hidden = false;
          button.setAttribute('aria-expanded', 'true');
          const buttonRect = button.getBoundingClientRect();
          const menuWidth = menu.offsetWidth;
          menu.style.top = `${buttonRect.bottom + 4}px`;
          menu.style.left = `${Math.max(8, Math.min(buttonRect.right - menuWidth, innerWidth - menuWidth - 8))}px`;
          ($('[aria-checked="true"]', menu) ?? $('button, a', menu))?.focus();
        }
    
        /**
         * @param {boolean=} focusButton
         */
        function closeMenu(focusButton) {
          if (!openMenuInfo) return;
          const {button, menu} = openMenuInfo;
          openMenuInfo = null;
          menu.hidden = true;
          button.setAttribute('aria-expanded', 'false');
          if (focusButton) button.focus();
        }
    
        for (const [button, menu] of [[$('#layout-button'), $('#layout-menu')], [$('#more-button'), $('#more-menu')]]) {
          button.addEventListener('click', () => {
            if (openMenuInfo?.menu === menu) closeMenu();
            else openMenu(button, menu);
          });
        }
        document.addEventListener('pointerdown', event => {
          if (openMenuInfo && !openMenuInfo.menu.contains(event.target) && !openMenuInfo.button.contains(event.target)) {
            closeMenu();
          }
        });
        // Eg. clicking in the result or the page.
        addEventListener('blur', () => closeMenu());
    
        const resetButton = $('#reset-button');
        resetButton.hidden = options.readOnly;
        resetButton.nextElementSibling.hidden = options.readOnly;
        resetButton.addEventListener('click', () => {
          closeMenu();
          if (confirm('Reset the code to how it was when the page was loaded?  Your changes will be lost.')) {
            setCode(originalCode);
            run(true);
          }
        });
        $('#run-shortcut').textContent = RUN_SHORTCUT;
        const aboutLink = $('#about-link');
        aboutLink.href = packageInfo.homepage;
        aboutLink.textContent = `YourJS Page v${packageInfo.version}`;
        aboutLink.addEventListener('click', () => closeMenu());
        //#endregion
    
        //#region Libraries
        const librariesDialog = $('#libraries-dialog');
        const librariesButton = $('#libraries-button');
        const librariesBadge = $('#libraries-badge');
        const searchInput = $('#library-search-input');
        const searchStatus = $('#library-search-status');
        const searchResults = $('#library-results');
    
        librariesDialog.classList.toggle('is-read-only', options.readOnly);
        $('#library-search').hidden = !options.librarySearch;
    
        /**
         * Shows a library's URL in a shorter form (eg. "jquery@3.7.1/jquery.min.js"
         * for a file on cdnjs).
         * @param {string} url
         * @returns {string}
         */
        function describeLibraryUrl(url) {
          const match = /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/([^/]+)\/([^/]+)\/(.+)$/.exec(url);
          return match ? `${match[1]}@${match[2]}/${match[3]}` : url;
        }
    
        /** Shows the libraries in the dialog and how many there are. */
        function renderLibraries() {
          for (const type of ['css', 'js']) {
            const urls = libraries[type];
            $(`#${type}-libraries`).replaceChildren(...urls.map((url, index) => {
              const makeButton = (icon, title, disabled, onClick) => {
                const button = createElement('button', {type: 'button', className: 'icon-button', title, disabled});
                button.innerHTML = `<svg aria-hidden="true"><use href="#icon-${icon}"/></svg>`;
                button.addEventListener('click', onClick);
                return button;
              };
              return createElement('li', {}, [
                createElement('span', {className: 'library-url-text', textContent: describeLibraryUrl(url), title: url}),
                makeButton('up', 'Move up', index === 0, () => moveLibrary(type, index, -1)),
                makeButton('down', 'Move down', index === urls.length - 1, () => moveLibrary(type, index, 1)),
                makeButton('close', 'Remove', false, () => removeLibrary(type, index)),
              ]);
            }));
          }
          const count = libraries.css.length + libraries.js.length;
          librariesBadge.hidden = !count;
          librariesBadge.textContent = `${count}`;
          librariesButton.title = count ? `Libraries (${count})` : 'Libraries';
        }
    
        /**
         * @param {"css"|"js"} type
         * @param {string} url
         * @param {string=} integrity
         */
        function addLibrary(type, url, integrity) {
          if (integrity) integrities.set(url, integrity);
          if (!libraries[type].includes(url)) libraries[type].push(url);
          renderLibraries();
          updateRunButton();
        }
    
        /**
         * @param {"css"|"js"} type
         * @param {number} index
         * @param {number} offset
         */
        function moveLibrary(type, index, offset) {
          const urls = libraries[type];
          [urls[index], urls[index + offset]] = [urls[index + offset], urls[index]];
          renderLibraries();
          updateRunButton();
          // Keeps the focus on the same button so it can be pressed again.
          const buttons = $$(`#${type}-libraries li`)[index + offset]?.querySelectorAll('button');
          (buttons?.[offset < 0 ? 0 : 1].disabled ? buttons[offset < 0 ? 1 : 0] : buttons?.[offset < 0 ? 0 : 1])?.focus();
        }
    
        /**
         * @param {"css"|"js"} type
         * @param {number} index
         */
        function removeLibrary(type, index) {
          libraries[type].splice(index, 1);
          renderLibraries();
          updateRunButton();
        }
    
        /**
         * The integrity hashes of the files in each version of the libraries on
         * cdnjs (by "name@version").
         * @type {Map<string, Promise<{[file: string]: string}>>}
         */
        const cdnjsHashes = new Map();
    
        /**
         * Gets the files and integrity hashes of a version of a library on cdnjs.
         * @param {string} name
         * @param {string} version
         * @returns {Promise<{files: string[], sri: {[file: string]: string}}>}
         */
        function getCdnjsVersion(name, version) {
          const key = `${name}@${version}`;
          if (!cdnjsHashes.has(key)) {
            const promise = fetchJson(`${CDNJS_API_URL}/${encodeURIComponent(name)}/${encodeURIComponent(version)}?fields=files,sri`);
            // Lets it be tried again later.
            promise.catch(() => cdnjsHashes.delete(key));
            cdnjsHashes.set(key, promise);
          }
          return cdnjsHashes.get(key);
        }
    
        /**
         * Adds a file of a library on cdnjs.
         * @param {string} name
         * @param {string} version
         * @param {string} file
         * @param {HTMLButtonElement} button
         *   The button that was clicked (which shows that the file was added).
         */
        async function addCdnjsFile(name, version, file, button) {
          let integrity;
          try {
            integrity = (await getCdnjsVersion(name, version)).sri?.[file];
          }
          catch (e) {
            // The file can still be added without its hash.
          }
          addLibrary(/\.css$/i.test(file) ? 'css' : 'js', `${CDNJS_FILES_URL}${name}/${version}/${file}`, integrity);
          const oldText = button.textContent;
          button.textContent = 'Added';
          setTimeout(() => button.textContent = oldText, 1500);
        }
    
        /**
         * Shows the versions and files of a library that was found.
         * @param {{name: string, version: string}} library
         * @param {HTMLElement} container
         */
        async function showLibraryFiles(library, container) {
          container.replaceChildren('Loading\u2026');
          let versions;
          try {
            ({versions} = await fetchJson(`${CDNJS_API_URL}/${encodeURIComponent(library.name)}?fields=versions`));
          }
          catch (e) {
            container.replaceChildren('The versions could not be loaded.');
            return;
          }
          versions = [...new Set([library.version, ...versions])]
            .sort((a, b) => b.localeCompare(a, undefined, {numeric: true}));
          const select = createElement('select', {title: 'Version'}, versions.map(
            version => createElement('option', {value: version, textContent: version, selected: version === library.version})
          ));
          const fileList = createElement('div', {className: 'library-file-list'});
    
          async function showFiles() {
            const version = select.value;
            fileList.replaceChildren('Loading\u2026');
            let files;
            try {
              ({files} = await getCdnjsVersion(library.name, version));
            }
            catch (e) {
              fileList.replaceChildren('The files could not be loaded.');
              return;
            }
            if (select.value !== version) return;
            // Minified files first, then the shortest paths.
            files = files
              .filter(file => /\.(css|js)$/i.test(file))
              .sort((a, b) => (b.includes('.min.') - a.includes('.min.')) || a.length - b.length || a.localeCompare(b));
            fileList.replaceChildren(...files.length ? files.map(file => {
              const button = createElement('button', {type: 'button', textContent: file, title: `Add ${file}`});
              button.addEventListener('click', () => addCdnjsFile(library.name, version, file, button));
              return button;
            }) : ['There are no CSS or JavaScript files in this version.']);
          }
    
          select.addEventListener('change', showFiles);
          container.replaceChildren(select, fileList);
          showFiles();
        }
    
        /**
         * @param {{name: string, version: string, description?: string, filename?: string}} library
         * @returns {HTMLElement}
         */
        function createSearchResult(library) {
          const addButton = createElement('button', {type: 'button', className: 'text-button', textContent: 'Add', title: `Add ${library.filename}`});
          addButton.addEventListener('click', () => addCdnjsFile(library.name, library.version, library.filename, addButton));
          const filesButton = createElement('button', {type: 'button', className: 'text-button', textContent: 'Files'});
          filesButton.title = 'Choose a version and file';
          filesButton.setAttribute('aria-expanded', 'false');
          const files = createElement('div', {className: 'library-files', hidden: true});
          filesButton.addEventListener('click', () => {
            files.hidden = !files.hidden;
            filesButton.setAttribute('aria-expanded', `${!files.hidden}`);
            if (!files.hidden && !files.childNodes.length) showLibraryFiles(library, files);
          });
          return createElement('div', {className: 'library-result'}, [
            createElement('div', {className: 'library-result-main'}, [
              createElement('div', {className: 'library-result-text'}, [
                createElement('span', {className: 'library-name', textContent: library.name}),
                createElement('span', {className: 'library-version', textContent: library.version}),
                createElement('div', {className: 'library-description', textContent: library.description ?? '', title: library.description ?? ''}),
              ]),
              addButton,
              filesButton,
            ]),
            files,
          ]);
        }
    
        /** @type {AbortController?} */
        let searchController = null;
        let searchTimer = 0;
    
        /** Searches cdnjs for what was typed. */
        async function searchLibraries() {
          const query = searchInput.value.trim();
          searchController?.abort();
          if (!query) {
            searchController = null;
            searchStatus.textContent = '';
            searchResults.replaceChildren();
            return;
          }
          const controller = searchController = new AbortController();
          searchStatus.textContent = 'Searching\u2026';
          try {
            const {results} = await fetchJson(
              `${CDNJS_API_URL}?search=${encodeURIComponent(query)}&fields=version,description,filename&limit=25`,
              controller.signal
            );
            // Only libraries with a default file can be added with one click.
            const found = results.filter(library => library.version && library.filename);
            searchStatus.textContent = found.length ? '' : `No libraries match \u201c${query}\u201d.`;
            searchResults.replaceChildren(...found.map(createSearchResult));
          }
          catch (e) {
            if (controller.signal.aborted) return;
            searchStatus.textContent = 'The search failed.  Please check your connection and try again.';
            searchResults.replaceChildren();
          }
        }
    
        searchInput.addEventListener('input', () => {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(searchLibraries, SEARCH_DELAY);
        });
    
        $('#library-url-form').addEventListener('submit', event => {
          event.preventDefault();
          const input = $('#library-url-input');
          // Relative URLs are relative to the page.
          let url;
          try {
            url = new URL(input.value.trim(), document.baseURI).href;
          }
          catch (e) {
            return;
          }
          addLibrary(event.submitter?.dataset.type === 'css' ? 'css' : 'js', url);
          input.value = '';
        });
    
        librariesButton.addEventListener('click', () => {
          closeMenu();
          librariesDialog.showModal();
          if (options.librarySearch && !options.readOnly) searchInput.focus();
        });
        for (const button of $$('.dialog-close', librariesDialog)) {
          button.addEventListener('click', () => librariesDialog.close());
        }
        // Clicking outside of the dialog closes it.
        librariesDialog.addEventListener('click', event => {
          if (event.target === librariesDialog) librariesDialog.close();
        });
        $('#libraries-run-button').addEventListener('click', () => {
          librariesDialog.close();
          run(true);
        });
        renderLibraries();
        //#endregion
    
        //#region Saving and opening
        /** The name of downloaded files (without the extension). */
        function getFileBaseName() {
          return (options.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'yourjs-page';
        }
    
        $('#download-html-button').addEventListener('click', () => {
          closeMenu();
          download(new Blob([buildDocument(getCode())], {type: 'text/html'}), `${getFileBaseName()}.html`);
        });
    
        $('#download-zip-button').addEventListener('click', () => {
          closeMenu();
          const code = getCode();
          const folder = getFileBaseName();
          download(createZip([
            {name: `${folder}/index.html`, text: buildDocument(code, {fileNames: {css: 'style.css', js: 'script.js'}})},
            {name: `${folder}/style.css`, text: code.css},
            {name: `${folder}/script.js`, text: code.js},
          ]), `${folder}.zip`);
        });
    
        const fileInput = $('#file-input');
        const openFileButton = $('#open-file-button');
        openFileButton.hidden = options.readOnly;
        openFileButton.addEventListener('click', () => {
          closeMenu();
          fileInput.value = '';
          fileInput.click();
        });
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0];
          if (!file) return;
          try {
            await openFile(file);
          }
          catch (e) {
            alert(`${file.name} could not be opened.  ${e.message}`);
          }
        });
    
        /**
         * Opens an HTML or ZIP file (eg. one that was downloaded) and runs it.
         * @param {File} file
         */
        async function openFile(file) {
          if (file.size > MAX_OPEN_FILE_SIZE) throw new Error('It is too big.');
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const decoder = new TextDecoder();
          // The title that downloads get (see buildDocument()).
          const defaultTitle = options.title || 'YourJS Page';
          let code;
          // ZIP files start with "PK\x03\x04".
          if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
            // Only the files that could be code are read (up to a total size).
            const files = new Map();
            let totalSize = 0;
            for (const [path, read] of readZip(buffer)) {
              if (!/\.(html?|css|m?js)$/i.test(path)) continue;
              const data = await read();
              totalSize += data.length;
              if (totalSize > MAX_OPEN_FILE_SIZE * 2.5) throw new Error('Its files are too big.');
              files.set(path, data);
            }
            // Uses the index.html that is the least deep (or else any HTML file).
            const htmlPath = [...files.keys()]
              .filter(path => /\.html?$/i.test(path))
              .sort((a, b) => (/(^|\/)index\.html?$/i.test(b) - /(^|\/)index\.html?$/i.test(a))
                || a.split('/').length - b.split('/').length
                || a.localeCompare(b))[0];
            if (!htmlPath) throw new Error('There is no HTML file in it.');
            const folder = htmlPath.replace(/[^/]*$/, '');
            const getFile = url => {
              const resolved = new URL(url, `https://zip/${htmlPath}`);
              const path = resolved.origin === 'https://zip' ? decodeURIComponent(resolved.pathname.slice(1)) : null;
              return path != null && files.has(path) ? decoder.decode(files.get(path)) : null;
            };
            code = parseHtmlDocument(decoder.decode(files.get(htmlPath)), getFile, defaultTitle);
            // Some exports (eg. CodePen's src folder) have the CSS and JavaScript
            // next to the HTML without the HTML referring to them.
            for (const [key, fileName] of [['css', 'style.css'], ['js', 'script.js']]) {
              if (!code[key] && files.has(folder + fileName)) code[key] = decoder.decode(files.get(folder + fileName));
            }
          }
          else {
            code = parseHtmlDocument(decoder.decode(bytes), () => null, defaultTitle);
          }
          for (const [url, integrity] of code.integrities) integrities.set(url, integrity);
          setCode(code);
          run(true);
        }
        //#endregion
    
        //#region Safe mode
        // If the code that the page starts with is run but never finishes (eg.
        // because it froze the page and the page had to be reloaded) it isn't run
        // automatically the next time.
        const safeModeKey = `yourjs-page:running:${hashText(`${pageUrl}\n${originalCodeJson}`)}`;
        // Storage can't be used in some pages (eg. sandboxed ones).
        const storage = (() => {
          try {
            return localStorage;
          }
          catch (e) {
            return null;
          }
        })();
    
        /**
         * Remembers whether the code that the page starts with is running.
         * @param {boolean} isRunning
         */
        function setRunningOriginalCode(isRunning) {
          try {
            if (isRunning) storage?.setItem(safeModeKey, `${Date.now()}`);
            else storage?.removeItem(safeModeKey);
          }
          catch (e) {}
        }
    
        /** @returns {boolean} */
        function didOriginalCodeNotFinish() {
          try {
            return storage?.getItem(safeModeKey) != null;
          }
          catch (e) {
            return false;
          }
        }
    
        // Leaving the page normally (eg. reloading it) means it didn't freeze.  A
        // page that froze can't run this so the next time it is opened the code
        // isn't run automatically.
        addEventListener('pagehide', () => setRunningOriginalCode(false));
    
        $('#safe-mode-run-button').addEventListener('click', () => run(true));
        //#endregion
    
        //#region Full screen
        /**
         * Makes the viewer fill the page's window (when full screen isn't
         * allowed).
         * @param {boolean} value
         */
        function setMaximized(value) {
          isMaximized = value;
          host.setMaximized(value);
          updateFullscreenButton();
        }
    
        function updateFullscreenButton() {
          const isFullscreen = !!document.fullscreenElement || isMaximized;
          $('use', fullscreenButton).setAttribute('href', isFullscreen ? '#icon-exit-fullscreen' : '#icon-fullscreen');
          fullscreenButton.title = isFullscreen ? 'Exit full screen' : 'Full screen';
        }
    
        async function toggleFullscreen() {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          }
          else if (isMaximized) {
            setMaximized(false);
          }
          else {
            try {
              if (!document.fullscreenEnabled) throw new Error('Full screen is not allowed.');
              await document.documentElement.requestFullscreen();
            }
            catch (e) {
              setMaximized(true);
            }
          }
        }
    
        fullscreenButton.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        //#endregion
    
        //#region Keyboard shortcuts
        // Listening while capturing makes the shortcuts work before the editors
        // see the keys.
        addEventListener('keydown', event => {
          const isCommandKey = IS_MAC ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
          if (isCommandKey && event.key === 'Enter' && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            run(true);
          }
          else if (event.shiftKey && event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyF') {
            const key = LANGUAGE_KEYS.find(key => editors[key].isFocused());
            if (key) {
              event.preventDefault();
              event.stopPropagation();
              format(key);
            }
          }
          // The dialogs close themselves.
          else if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
            if (openMenuInfo) closeMenu(true);
            else if (isMaximized) setMaximized(false);
          }
        }, true);
        //#endregion
    
        runButton.title = `Run (${RUN_SHORTCUT})`;
        runButton.addEventListener('click', () => run(true));
        $('#open-button').addEventListener('click', openInNewTab);
        const titleElement = $('#title');
        titleElement.textContent = options.title;
        titleElement.title = options.title;
        updateConsoleBadge();
        setConsoleShown(options.showConsole, false);
    
        const logoLink = $('#logo-link');
        logoLink.href = packageInfo.homepage;
        logoLink.title = `YourJS Page v${packageInfo.version}`;
    
        app.hidden = false;
        splash.classList.add('hidden');
        // A viewer that starts again (eg. because its IFRAME moved) is in a page
        // that didn't freeze.
        if (!config.isRestart && didOriginalCodeNotFinish()) {
          $('#safe-mode-notice').hidden = false;
          $('#safe-mode-run-button').focus();
        }
        else {
          run(false);
        }
    
        // Explains what code couldn't be loaded (which the editors show too).
        if (loadErrors.length) {
          const dialog = $('#load-error-dialog');
          $('#load-error-list').replaceChildren(...loadErrors.map(error => createElement('li', {}, [
            createElement('span', {className: 'load-error-language', textContent: error.language}),
            createElement('span', {className: 'load-error-message', textContent: error.message}),
          ])));
          $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
          dialog.showModal();
          $('.dialog-close', dialog).focus();
        }
    
        return {
          getCode,
          /**
           * @param {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[]}} code
           * @param {{run: boolean}} runOptions
           */
          setCode(code, runOptions) {
            setCode(code);
            if (runOptions.run) run(false);
            else updateRunButton();
          },
          run: () => run(false),
          destroy() {
            resultFrame?.remove();
            resultFrame = null;
          },
        };
      },
    };
    
  }

  /**
   * The code that runs in the result IFRAME before the user's code (eg. to
   * show what is logged in the viewer's console).  It is turned into a string
   * so it can't use anything defined outside of it.
   * @param {{runId: string}} config
   */
  function previewRuntime(config) {
    // Runs in the result IFRAME before anything else (see previewRuntime() in
    // main.js).  `config` is given by the viewer:
    // - config.runId:  Sent with every message so that the viewer can ignore the
    //   messages of an earlier run.
    // - config.loopTimeout:  How long (in milliseconds) loops can keep the page
    //   busy before they are stopped (see __yourjsPageLoopGuard() below).
    //
    // It sends what is logged (and any errors) to the viewer's console, runs code
    // typed into the viewer's console and provides yourjsPageRunJs() which runs
    // the user's JavaScript at the end of the body.
    
    const VIEWER = parent;
    const RUN_ID = config.runId;
    
    /** The name that the user's JavaScript has in stack traces and errors. */
    const SCRIPT_NAME = 'script.js';
    
    /** How many levels of objects inside of objects are shown. */
    const MAX_DEPTH = 2;
    /** How many items (eg. properties) of an object are shown. */
    const MAX_ITEMS = 100;
    /** How many characters of an element's HTML are shown. */
    const MAX_HTML_LENGTH = 500;
    /** How many properties (or items) are shown when a value is expanded. */
    const MAX_CHILDREN = 200;
    /** How many rows console.table() shows. */
    const MAX_TABLE_ROWS = 1000;
    
    /**
     * Sends a message to the viewer.
     * @param {string} type
     * @param {Object=} data
     */
    function send(type, data) {
      try {
        VIEWER.postMessage({yourjsPage: RUN_ID, type, ...data}, '*');
      }
      catch (e) {}
    }
    
    const toString = value => Object.prototype.toString.call(value);
    const isIdentifier = key => /^[A-Za-z_$][\w$]*$/.test(key);
    
    /**
     * Gets the kind of a value (used to color it in the console).
     * @param {*} value
     * @returns {string}
     */
    function getKind(value) {
      if (value === null) return 'null';
      if (value instanceof Error) return 'error';
      if ('object' === typeof value && value instanceof Node) return 'node';
      return typeof value;
    }
    
    /**
     * Shows a value as text (on one line unless it is something like an error at
     * the top level).
     * @param {*} value
     * @param {number=} depth
     *   How deep inside of other values this one is.  Strings at the top level
     *   are shown without quotes.
     * @param {any[]=} parents
     *   The objects that this value is inside of (to find circular references).
     * @returns {string}
     */
    function preview(value, depth = 0, parents = []) {
      switch (typeof value) {
        case 'string': return depth ? JSON.stringify(value) : value;
        case 'number': return Object.is(value, -0) ? '-0' : `${value}`;
        case 'bigint': return `${value}n`;
        case 'symbol': return value.toString();
        case 'boolean':
        case 'undefined': return `${value}`;
        case 'function': return previewFunction(value);
      }
      if (value === null) return 'null';
      if (parents.includes(value)) return '[Circular]';
      try {
        return previewObject(value, depth, [...parents, value]);
      }
      catch (e) {
        // Eg. a proxy that throws.
        return toString(value);
      }
    }
    
    /**
     * @param {Function} fn
     * @returns {string}
     */
    function previewFunction(fn) {
      const source = Function.prototype.toString.call(fn);
      return /^class\b/.test(source) ? `class ${fn.name}` : `\u0192 ${fn.name}()`;
    }
    
    /**
     * @param {Object} value
     * @param {number} depth
     * @param {any[]} parents
     * @returns {string}
     */
    function previewObject(value, depth, parents) {
      if (value === window) return 'Window';
      if (value instanceof Error) {
        const summary = `${value.name}: ${value.message}`;
        if (depth || !value.stack) return summary;
        // At the top level the stack is shown too (without the lines for the code
        // that ran the user's JavaScript, which in Safari start with the call to
        // append() that added the script).
        const stack = getStack(value)
          .replace(/(\n[^\n]*append@\[native code\])?\n[^\n]*\byourjsPageRunJs\b[^]*/, '');
        // Only some browsers start the stack with the error's name and message.
        return stack.split('\n')[0].includes(value.message) ? stack : `${summary}\n${stack}`;
      }
      if (value instanceof Node) return previewNode(value, depth);
      if (value instanceof Date) return isNaN(value) ? 'Invalid Date' : depth ? value.toISOString() : `${value}`;
      if (value instanceof RegExp) return `${value}`;
      if (value instanceof Promise) return 'Promise {\u2026}';
      if (value instanceof WeakMap || value instanceof WeakSet) return `${value.constructor.name} {\u2026}`;
    
      const isArray = Array.isArray(value) || ArrayBuffer.isView(value);
      const constructorName = getConstructorName(value);
      const prefix = isArray
        ? (constructorName === 'Array' ? '' : constructorName)
        : (constructorName === 'Object' ? '' : `${constructorName} `);
    
      if (value instanceof Map || value instanceof Set) {
        const name = `${constructorName}(${value.size})`;
        if (depth > MAX_DEPTH) return `${name} {\u2026}`;
        const items = [];
        for (const item of value) {
          if (items.length >= MAX_ITEMS) {
            items.push('\u2026');
            break;
          }
          items.push(value instanceof Map
            ? `${preview(item[0], depth + 1, parents)} => ${preview(item[1], depth + 1, parents)}`
            : preview(item, depth + 1, parents));
        }
        return `${name} {${items.join(', ')}}`;
      }
    
      if (isArray) {
        if (depth > MAX_DEPTH) return `${prefix || 'Array'}(${value.length})`;
        const items = [];
        for (let index = 0; index < value.length; index++) {
          if (items.length >= MAX_ITEMS) {
            items.push('\u2026');
            break;
          }
          items.push(index in value ? preview(value[index], depth + 1, parents) : 'empty');
        }
        return `${prefix ? `${prefix}(${value.length}) ` : ''}[${items.join(', ')}]`;
      }
    
      if (depth > MAX_DEPTH) return `${prefix}{\u2026}`;
      // The enumerable keys (including symbols) like the browser's console.
      const keys = Reflect.ownKeys(value).filter(key => Object.prototype.propertyIsEnumerable.call(value, key));
      const items = keys.slice(0, MAX_ITEMS).map(key => {
        let text;
        try {
          text = preview(value[key], depth + 1, parents);
        }
        catch (e) {
          text = '(\u2026)';
        }
        const name = 'symbol' === typeof key ? `[${key.toString()}]` : isIdentifier(key) ? key : JSON.stringify(key);
        return `${name}: ${text}`;
      });
      if (keys.length > MAX_ITEMS) items.push('\u2026');
      return `${prefix}{${items.join(', ')}}`;
    }
    
    /**
     * @param {Object} value
     * @returns {string}
     */
    function getConstructorName(value) {
      const proto = Object.getPrototypeOf(value);
      if (!proto) return 'Object';
      const name = proto.constructor?.name;
      return 'string' === typeof name && name ? name : toString(value).slice(8, -1);
    }
    
    /**
     * @param {Node} node
     * @param {number} depth
     * @returns {string}
     */
    function previewNode(node, depth) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
          if (!depth) {
            const html = node.outerHTML;
            return html.length > MAX_HTML_LENGTH ? `${html.slice(0, MAX_HTML_LENGTH)}\u2026` : html;
          }
          const attributes = Array.from(node.attributes, ({name, value}) => ` ${name}="${value}"`).join('');
          return `<${node.localName}${attributes}>`;
        }
        case Node.TEXT_NODE: return `#text ${JSON.stringify(node.data)}`;
        case Node.COMMENT_NODE: return `<!--${node.data}-->`;
        case Node.DOCUMENT_NODE: return '#document';
        case Node.DOCUMENT_FRAGMENT_NODE: return '#document-fragment';
        default: return node.nodeName;
      }
    }
    
    /**
     * Turns the arguments given to a console function into what is sent to the
     * viewer.  Like the browser's console, a first argument with placeholders
     * (eg. "%s") has the arguments after it put into it.
     * @param {any[]} args
     * @returns {{kind: string, text: string}[]}
     */
    function toParts(args) {
      if ('string' === typeof args[0] && args.length > 1 && /%[sdifoOc]/.test(args[0])) {
        const rest = args.slice(1);
        const text = args[0].replace(/%([sdifoOc%])/g, (match, letter) => {
          if (letter === '%') return '%';
          if (!rest.length) return match;
          const value = rest.shift();
          switch (letter) {
            case 's': return 'string' === typeof value ? value : preview(value, 1);
            case 'd':
            case 'i': return 'symbol' === typeof value ? 'NaN' : `${parseInt(value, 10)}`;
            case 'f': return 'symbol' === typeof value ? 'NaN' : `${parseFloat(value)}`;
            // Styles aren't supported.
            case 'c': return '';
            default: return preview(value, 1);
          }
        });
        args = [text, ...rest];
      }
      return args.map(value => toPart(value));
    }
    
    /**
     * The values that can be expanded in the viewer's console (by their IDs).
     * Only the newest ones are kept (so that code that logs a lot doesn't keep
     * everything that it logged from being freed).
     * @type {Map<number, Object>}
     */
    const expandableValues = new Map();
    const MAX_EXPANDABLE_VALUES = 5000;
    let lastExpandableId = 0;
    
    /**
     * Whether a value has something to show when it is expanded in the console.
     * @param {*} value
     * @returns {boolean}
     */
    function isExpandable(value) {
      if (value === null || 'object' !== typeof value) return false;
      if (value instanceof Node) return value.hasChildNodes();
      // These are shown in full already (or have nothing more to show).
      return !(value instanceof Error || value instanceof Date || value instanceof RegExp || value instanceof Promise);
    }
    
    /**
     * Turns a value into what the viewer's console shows.  Values that can be
     * expanded get an ID which the viewer uses to ask for their properties.
     * @param {*} value
     * @param {number=} depth
     * @returns {{kind: string, text: string, id?: number}}
     */
    function toPart(value, depth = 0) {
      const part = {kind: getKind(value), text: preview(value, depth)};
      if (isExpandable(value)) {
        part.id = ++lastExpandableId;
        expandableValues.set(part.id, value);
        if (expandableValues.size > MAX_EXPANDABLE_VALUES) expandableValues.delete(expandableValues.keys().next().value);
      }
      return part;
    }
    
    /**
     * Whether a prototype is one of the browser's own (eg. Array.prototype) which
     * isn't shown when an object is expanded.
     * @param {Object} proto
     * @returns {boolean}
     */
    function isBuiltInPrototype(proto) {
      try {
        return proto === Object.prototype || /\[native code\]\s*\}$/.test(Function.prototype.toString.call(proto.constructor));
      }
      catch (e) {
        return true;
      }
    }
    
    /**
     * Gets what is shown when a value is expanded in the viewer's console.
     * Getters aren't called (so that expanding a value has no side effects).
     * @param {Object} value
     * @returns {{key: string, separator?: string, kind: string, text: string, id?: number}[]}
     */
    function getChildren(value) {
      const children = [];
      let total = 0;
      const add = (key, part, separator) => {
        total++;
        if (children.length < MAX_CHILDREN) children.push({key, ...separator && {separator}, ...part});
      };
      try {
        if (value instanceof Map) {
          for (const [key, item] of value) add(preview(key, 1), toPart(item, 1), ' => ');
        }
        else if (value instanceof Set) {
          let index = 0;
          for (const item of value) add(`${index++}`, toPart(item, 1));
        }
        else if (value instanceof Node) {
          for (const child of value.childNodes) add('', toPart(child, 1), '');
        }
        else {
          for (const key of Reflect.ownKeys(value)) {
            const name = 'symbol' === typeof key ? `[${key.toString()}]` : key;
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            add(name, descriptor && !('value' in descriptor)
              ? {kind: 'getter', text: descriptor.get ? '(\u2026)' : 'undefined'}
              : toPart(descriptor?.value, 1));
          }
          const proto = Object.getPrototypeOf(value);
          if (proto && !isBuiltInPrototype(proto)) add('[[Prototype]]', toPart(proto, 1));
        }
      }
      catch (e) {
        add('', {kind: 'error', text: `${e}`}, '');
      }
      if (total > children.length) children.push({key: '', separator: '', kind: 'null', text: `\u2026 ${total - children.length} more`});
      return children;
    }
    
    /**
     * Gets what console.table() shows (like the browser's console).
     * @param {*} data
     * @param {*} columns
     *   If given, the properties to show.
     * @returns {{columns: string[], rows: ({kind: string, text: string}?)[][]}?}
     *   Null if the data can't be shown as a table.
     */
    function toTable(data, columns) {
      if (data === null || 'object' !== typeof data) return null;
      const entries = data instanceof Map ? Array.from(data, ([key, row]) => [preview(key, 1), row])
        : data instanceof Set ? Array.from(data, (row, index) => [`${index}`, row])
        : Object.keys(data).map(key => [key, data[key]]);
      const rows = entries.slice(0, MAX_TABLE_ROWS);
      const isObject = row => row !== null && ('object' === typeof row || 'function' === typeof row);
      const cell = (row, key) => {
        try {
          return toPart(key == null ? row : row[key], 1);
        }
        catch (e) {
          return {kind: 'error', text: `${e}`};
        }
      };
      const keys = new Set();
      let hasValues = false;
      for (const [, row] of rows) {
        if (isObject(row)) Object.keys(row).forEach(key => keys.add(key));
        else hasValues = true;
      }
      const columnKeys = Array.isArray(columns) ? columns.map(key => `${key}`) : [...keys];
      return {
        columns: ['(index)', ...columnKeys, ...hasValues ? ['Value'] : []],
        rows: rows.map(([key, row]) => [
          {kind: 'index', text: key},
          ...columnKeys.map(columnKey => isObject(row) && columnKey in row ? cell(row, columnKey) : null),
          ...hasValues ? [isObject(row) ? null : cell(row)] : [],
        ]),
      };
    }
    
    /**
     * Gets an error's stack with the result's URL (a long data URL which has all
     * of the code in it) shortened to "result".
     * @param {*} error
     * @returns {string}
     */
    function getStack(error) {
      return `${error?.stack ?? ''}`.split(location.href).join('result');
    }
    
    /**
     * Gets where an error happened in the user's JavaScript.
     * @param {*} error
     * @returns {{line: number, column: number}?}
     */
    function getScriptLocation(error) {
      // (Not eg. "typescript.js" from a library.)
      const match = new RegExp(`(?<![\\w./-])${SCRIPT_NAME.replace('.', '\\.')}:(\\d+):(\\d+)`).exec(getStack(error));
      return match ? {line: +match[1], column: +match[2]} : null;
    }
    
    let groupDepth = 0;
    
    /**
     * Sends a message to the viewer's console.
     * @param {"log"|"info"|"debug"|"warn"|"error"|"result"} level
     * @param {any[]} args
     * @param {Object=} extra
     */
    function log(level, args, extra) {
      send('log', {level, parts: toParts(args), depth: groupDepth, ...extra});
    }
    
    const counts = new Map();
    const timers = new Map();
    const ORIGINAL_CONSOLE = {...console};
    
    // What each console function shows in the viewer (besides what the browser
    // shows in its own console).
    const CONSOLE_FUNCS = {
      log: (...args) => log('log', args),
      info: (...args) => log('info', args),
      debug: (...args) => log('debug', args),
      warn: (...args) => log('warn', args),
      error: (...args) => log('error', args),
      dir: value => log('log', [value]),
      dirxml: (...args) => log('log', args),
      table: (data, columns) => {
        const table = toTable(data, columns);
        if (table) send('log', {level: 'log', parts: [], table, depth: groupDepth});
        else log('log', [data]);
      },
      trace: (...args) => log('log', args.length ? args : ['console.trace']),
      assert: (condition, ...args) => {
        if (!condition) {
          log('error', 'string' === typeof args[0]
            ? [`Assertion failed: ${args[0]}`, ...args.slice(1)]
            : ['Assertion failed', ...args]);
        }
      },
      clear: () => send('clear'),
      count: (label = 'default') => {
        counts.set(`${label}`, (counts.get(`${label}`) ?? 0) + 1);
        log('log', [`${label}: ${counts.get(`${label}`)}`]);
      },
      countReset: (label = 'default') => counts.delete(`${label}`),
      time: (label = 'default') => timers.set(`${label}`, performance.now()),
      timeLog: (label = 'default', ...args) => {
        if (timers.has(`${label}`)) log('log', [`${label}: ${performance.now() - timers.get(`${label}`)} ms`, ...args]);
      },
      timeEnd: (label = 'default') => {
        if (timers.has(`${label}`)) log('log', [`${label}: ${performance.now() - timers.get(`${label}`)} ms`]);
        timers.delete(`${label}`);
      },
      group: (...args) => {
        log('log', args.length ? args : ['console.group']);
        groupDepth++;
      },
      groupCollapsed: (...args) => CONSOLE_FUNCS.group(...args),
      groupEnd: () => {
        groupDepth = Math.max(0, groupDepth - 1);
      },
    };
    
    for (const [name, func] of Object.entries(CONSOLE_FUNCS)) {
      const original = ORIGINAL_CONSOLE[name];
      console[name] = function(...args) {
        try {
          func(...args);
        }
        catch (e) {}
        return original?.apply(this, args);
      };
    }
    
    /**
     * Sends an uncaught error to the viewer's console.
     * @param {string} prefix
     * @param {*} error
     * @param {{line: number, column: number}?} location
     */
    function logUncaught(prefix, error, location) {
      const text = error instanceof Error
        ? `${prefix} ${error.name}: ${error.message}`
        : `${prefix} ${preview(error, 1)}`;
      send('log', {
        level: 'error',
        parts: [{kind: 'error', text}],
        depth: 0,
        location: location ?? getScriptLocation(error),
      });
    }
    
    addEventListener('error', event => {
      // Safari doesn't use the script's name (see yourjsPageRunJs()) so errors
      // while the user's JavaScript is running (and not in a function called from
      // it) are known to be in it.
      const isInScript = event.filename === SCRIPT_NAME
        || (isRunningScript && !getStack(event.error).includes(SCRIPT_NAME));
      // Errors from scripts loaded from other origins only have a message (eg.
      // "Script error.").
      if (event.error == null && !isInScript) {
        send('log', {level: 'error', parts: [{kind: 'error', text: event.message}], depth: 0});
        return;
      }
      logUncaught('Uncaught', event.error, isInScript ? {line: event.lineno, column: event.colno} : null);
    });
    
    // Libraries (and other files) that fail to load.  Their errors don't bubble
    // so they are caught while capturing.
    addEventListener('error', event => {
      const {target} = event;
      if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) {
        send('log', {
          level: 'error',
          parts: [{kind: 'error', text: `Failed to load ${target.src || target.href}`}],
          depth: 0,
        });
      }
    }, true);
    
    addEventListener('unhandledrejection', event => {
      logUncaught('Uncaught (in promise)', event.reason);
    });
    
    // Runs code typed into the viewer's console and sends the properties of
    // values that are expanded in it.
    addEventListener('message', event => {
      const data = event.data;
      if (event.source !== VIEWER || data?.yourjsPage !== RUN_ID) return;
      if (data.type === 'expand') {
        const value = expandableValues.get(data.id);
        send('children', {requestId: data.requestId, children: value ? getChildren(value) : []});
        return;
      }
      if (data.type !== 'eval') return;
      let result;
      try {
        // An indirect eval runs the code in the global scope.
        result = (0, eval)(`${data.code}\n//# sourceURL=console.js`);
      }
      catch (error) {
        logUncaught('Uncaught', error, null);
        return;
      }
      send('log', {level: 'result', parts: [toPart(result, 'string' === typeof result ? 1 : 0)], depth: 0});
    });
    
    // The viewer adds a call to this at the start of the body of every loop in
    // the JavaScript (see protectLoops() in the viewer).  It stops loops once the
    // code has been running loops for longer than config.loopTimeout without a
    // break (eg. awaiting a timer) so that a loop that never ends can't freeze the
    // page.
    let loopTaskStart = null;
    const stoppedLoopLines = new Set();
    window.__yourjsPageLoopGuard = line => {
      const now = performance.now();
      if (loopTaskStart == null) {
        loopTaskStart = now;
        // This runs once the code gives the browser a break.
        setTimeout(() => {
          loopTaskStart = null;
          stoppedLoopLines.clear();
        });
        return false;
      }
      if (now - loopTaskStart < config.loopTimeout) return false;
      if (!stoppedLoopLines.has(line)) {
        stoppedLoopLines.add(line);
        send('log', {
          level: 'warn',
          parts: [{
            kind: 'string',
            text: `The loop on line ${line} was stopped because the code ran for more than ${config.loopTimeout / 1000} seconds without a break.`,
          }],
          depth: 0,
          location: {line, column: 1},
        });
      }
      return true;
    };
    
    // The time that loops spend waiting for alert(), confirm() or prompt() (eg.
    // asking until an answer is given) isn't counted.
    for (const name of ['alert', 'confirm', 'prompt']) {
      const original = window[name];
      window[name] = function(...args) {
        try {
          return original.apply(this, args);
        }
        finally {
          if (loopTaskStart != null) loopTaskStart = performance.now();
        }
      };
    }
    
    // Tells the viewer that the code finished running (the page has been parsed
    // and the JavaScript at the end of the body has run).
    document.addEventListener('DOMContentLoaded', () => send('loaded'));
    
    // Links to a part of the page (eg. href="#top") scroll to it.  Otherwise they
    // would go to that part of the page that the result is in since relative URLs
    // are relative to it (see the <base> added by the viewer).
    addEventListener('click', event => {
      const link = event.target instanceof Element && event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || (link.target && link.target !== '_self')) return;
      event.preventDefault();
      let id = link.getAttribute('href').slice(1);
      try {
        id = decodeURIComponent(id);
      }
      catch (e) {}
      const target = id ? document.getElementById(id) ?? document.getElementsByName(id)[0] : document.documentElement;
      target?.scrollIntoView();
    });
    
    // The shortcut for running the code also works in the result.
    addEventListener('keydown', event => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
      const isCommandKey = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (isCommandKey && event.key === 'Enter' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        send('run');
      }
    }, true);
    
    /**
     * Runs the user's JavaScript.  It is called by a script at the end of the
     * body so that the code runs before DOMContentLoaded (like a script at the
     * end of the body would).
     * @param {string} js
     */
    let isRunningScript = false;
    
    // (A function declaration is used so that its name (which is used to find it
    // in stack traces) isn't removed when it is minified.)
    window.yourjsPageRunJs = yourjsPageRunJs;
    function yourjsPageRunJs(js) {
      delete window.yourjsPageRunJs;
      // The script that called this isn't part of the user's HTML.
      document.currentScript?.remove();
      const script = document.createElement('script');
      // The name makes errors and the browser's dev tools point to the code.
      script.textContent = `${js}\n//# sourceURL=${SCRIPT_NAME}`;
      // The script runs as soon as it is added.
      isRunningScript = true;
      try {
        document.body.append(script);
      }
      finally {
        isRunningScript = false;
      }
      script.remove();
    }
    
    // This script isn't part of the user's HTML either.
    document.currentScript?.remove();
    
  }

  /**
   * The libraries that the viewer loads along with the exact versions that it
   * was tested with.
   */
  const LIBRARY_VERSIONS = {
    'ace-builds': '1.44.0',
    // Only loaded the first time code is formatted.
    'js-beautify': '2.0.3',
    // Only loaded the first time JavaScript with a loop runs (to stop loops
    // that run for too long).
    'acorn': '8.18.0',
  };

  /**
   * Where the libraries are loaded from unless data-libraries-url is given.
   * `{name}` and `{version}` are replaced with each library's name and version.
   */
  const DEFAULT_LIBRARIES_URL = 'https://unpkg.com/{name}@{version}/';

  /**
   * @param {string} librariesUrl
   *   The URL template (see DEFAULT_LIBRARIES_URL).  Relative URLs are relative
   *   to the page.
   * @param {keyof LIBRARY_VERSIONS} name
   * @param {string} path
   *   The path of the file within the library's package.
   * @returns {string}
   */
  function getLibraryFileUrl(librariesUrl, name, path) {
    const baseUrl = librariesUrl
      .replace(/\{(name|version)\}/g, (_, key) => key === 'name' ? name : LIBRARY_VERSIONS[name])
      .replace(/\/?$/, '/');
    return new URL(baseUrl + path, document.baseURI).href;
  }

  /**
   * The languages that a page has code for.
   */
  const LANGUAGES = [
    // The text (eg. a URL) can't end the comment early.
    {key: 'html', name: 'HTML', toComment: text => `<!-- ${text.replace(/--(!?)>/g, '--$1 >')} -->`},
    {key: 'css', name: 'CSS', toComment: text => `/* ${text.replace(/\*\//g, '* /')} */`},
    {key: 'js', name: 'JavaScript', toComment: text => `// ${text.replace(/[\r\n]+/g, ' ')}`},
  ];

  /** How long to wait for code from a URL or a gist (in milliseconds). */
  const LOAD_TIMEOUT = 30000;
  /** How long to wait for the list of a gist's files (in milliseconds). */
  const GIST_LIST_TIMEOUT = 15000;

  /**
   * Something that couldn't be loaded (which the viewer shows in a dialog).
   * @typedef {{key: string, language: string, message: string}} LoadError
   */

  /**
   * Gets the starting code for one language from (in this order) the code
   * itself, the first element that matches a selector, a URL or a file in a
   * gist.
   * @param {(typeof LANGUAGES)[number]} language
   * @param {{code?: *, selector?: *, url?: *, gist?: *, gistFile?: *}} sources
   * @param {LoadError[]} errors
   *   Where to add what couldn't be loaded.
   * @param {string=} missingMessage
   *   If given and there is nothing to get the code from, the code is a
   *   comment with this message.
   * @returns {string|(() => Promise<string>)}
   *   The code or, if it needs to be loaded (from a URL or a gist), a function
   *   that loads it (which is called once the page is about to be shown).
   */
  function getStartingCode(language, {code, selector, url, gist, gistFile}, errors, missingMessage) {
    if (code != null) return `${code}`;
    if (selector != null) return getCodeFromSelector(language, `${selector}`);
    // What couldn't be loaded is also shown in the editor (as a comment).
    const fail = message => {
      errors.push({key: language.key, language: language.name, message});
      return language.toComment(message);
    };
    if (url != null) return () => getCodeFromUrl(language, `${url}`, fail);
    if (gist != null) return () => getCodeFromGist(language, `${gist}`, gistFile == null ? null : `${gistFile}`, fail);
    return missingMessage ? language.toComment(missingMessage) : '';
  }

  /**
   * Gets the code for one language from the first element that matches a
   * selector.  If there isn't one a comment in that language says so.
   * @param {(typeof LANGUAGES)[number]} language
   * @param {string} selector
   * @returns {string}
   */
  function getCodeFromSelector(language, selector) {
    let element;
    try {
      element = document.querySelector(selector);
    }
    catch (e) {
      return language.toComment(`The ${language.name} selector is not valid:  ${selector}`);
    }
    if (!element) return language.toComment(`No element matches the ${language.name} selector:  ${selector}`);
    // The text of a <template> is in its content.  Its HTML is used as is so
    // that the HTML doesn't need to be escaped.
    if (element.localName === 'template') {
      return language.key === 'html' ? element.innerHTML : element.content.textContent;
    }
    return element.textContent;
  }

  /**
   * Loads the code for one language from a URL (relative to the page).
   * @param {(typeof LANGUAGES)[number]} language
   * @param {string} url
   * @param {(message: string) => string} fail
   *   Called (and its result returned) if the code can't be loaded.
   * @returns {Promise<string>}
   */
  async function getCodeFromUrl(language, url, fail) {
    let response;
    try {
      response = await fetch(new URL(url, document.baseURI), {signal: AbortSignal.timeout(LOAD_TIMEOUT)});
    }
    catch (e) {
      // Eg. the URL isn't valid, there's no connection, it took too long or
      // (for a URL on another site) the site doesn't allow it.
      return fail(`The ${language.name} could not be loaded from:  ${url}`);
    }
    if (!response.ok) {
      return fail(`The ${language.name} could not be loaded (${getStatusText(response)}) from:  ${url}`);
    }
    try {
      return await response.text();
    }
    catch (e) {
      return fail(`The ${language.name} could not be loaded from:  ${url}`);
    }
  }

  /**
   * @param {Response} response
   * @returns {string}
   *   Eg. "404 Not Found".
   */
  function getStatusText(response) {
    return `${response.status} ${response.statusText}`.trim();
  }

  /**
   * The files that are used for each language when a gist's file isn't named
   * (the first pattern that matches one of the gist's files wins).
   */
  const GIST_FILE_PATTERNS = {
    html: [/^index\.html?$/i, /\.html?$/i],
    css: [/^styles?\.css$/i, /\.css$/i],
    js: [/^(script|index|main|app)\.m?js$/i, /\.m?js$/i],
  };

  /**
   * Added to the URLs of gists' files so that GitHub's cache (which keeps
   * them for 5 minutes) is skipped and edits show up right away.  The same
   * value is used for every file loaded while the page is open.  (The list of
   * a gist's files doesn't need it since its URL has a new callback name each
   * time.)
   */
  const GIST_CACHE_BUSTER = `${Date.now()}`;

  /**
   * Gets the ID of a gist from its URL (eg.
   * "https://gist.github.com/westc/2fe0bfa42237139860f32972ddc608f1") or ID.
   * @param {string} gist
   * @returns {string?}
   */
  function getGistId(gist) {
    const match = /^\s*(?:https?:\/\/gist\.github(?:usercontent)?\.com\/(?:[^/?#]+\/)?)?([\da-f]+)(?:[/?#.][^]*)?\s*$/i.exec(gist);
    return match?.[1] ?? null;
  }

  /**
   * The names of the files in each gist (by ID) so each gist's list is only
   * loaded once.
   * @type {Map<string, Promise<string[]>>}
   */
  const gistFileNames = new Map();

  /**
   * Gets the names of the files in a gist.  This uses the JSONP version of
   * the gist (like https://gist.github.com/westc/2fe0bfa42237139860f32972ddc608f1)
   * instead of GitHub's API which only allows 60 requests an hour.
   * @param {string} id
   * @returns {Promise<string[]>}
   */
  function getGistFileNames(id) {
    if (!gistFileNames.has(id)) {
      const promise = new Promise((resolve, reject) => {
        const callbackName = `yourjsPageGist_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        // The callback is never called if GitHub sends something unexpected.
        const timer = setTimeout(() => {
          cleanUp();
          reject(new Error(`The gist ${id} took too long to load.`));
        }, GIST_LIST_TIMEOUT);
        const cleanUp = () => {
          clearTimeout(timer);
          // Keeps a late response from causing an error.
          window[callbackName] = () => {};
          script.remove();
        };
        window[callbackName] = data => {
          cleanUp();
          if (Array.isArray(data?.files)) resolve(data.files.map(name => `${name}`));
          else reject(new Error(`The gist ${id} could not be read.`));
        };
        script.onerror = () => {
          cleanUp();
          reject(new Error(`The gist ${id} could not be loaded.  Check that it exists.`));
        };
        script.src = `https://gist.github.com/${id}.json?callback=${callbackName}`;
        document.head.append(script);
      });
      // Lets it be tried again later.
      promise.catch(() => gistFileNames.delete(id));
      gistFileNames.set(id, promise);
    }
    return gistFileNames.get(id);
  }

  /**
   * Loads the code for one language from a file in a gist.
   * @param {(typeof LANGUAGES)[number]} language
   * @param {string} gist
   *   The gist's URL or ID.
   * @param {string?} fileName
   *   The file to use.  If not given, the gist's file for the language is
   *   found by its name (see GIST_FILE_PATTERNS).
   * @param {(message: string) => string} fail
   *   Called (and its result returned) if the code can't be loaded.
   * @returns {Promise<string>}
   */
  async function getCodeFromGist(language, gist, fileName, fail) {
    const id = getGistId(gist);
    if (!id) return fail(`This is not the URL or ID of a gist:  ${gist}`);
    if (fileName == null) {
      let names;
      try {
        names = await getGistFileNames(id);
      }
      catch (e) {
        return fail(e.message);
      }
      fileName = GIST_FILE_PATTERNS[language.key]
        .map(pattern => names.find(name => pattern.test(name)))
        .find(Boolean);
      // A gist doesn't need a file for every language.
      if (!fileName) return language.toComment(`The gist ${id} has no ${language.name} file.`);
    }
    // The raw files can be loaded from any site and (unlike GitHub's API)
    // aren't limited to a number of requests an hour.  The browser's cache is
    // skipped too.
    let response;
    try {
      response = await fetch(
        `https://gist.githubusercontent.com/raw/${id}/${encodeURIComponent(fileName)}?t=${GIST_CACHE_BUSTER}`,
        {cache: 'no-store', signal: AbortSignal.timeout(LOAD_TIMEOUT)}
      );
    }
    catch (e) {
      return fail(`${fileName} could not be loaded from the gist ${id}.`);
    }
    if (response.status === 404) return fail(`The gist ${id} doesn't have a file named ${fileName}.`);
    if (!response.ok) return fail(`${fileName} could not be loaded (${getStatusText(response)}) from the gist ${id}.`);
    try {
      return await response.text();
    }
    catch (e) {
      return fail(`${fileName} could not be loaded from the gist ${id}.`);
    }
  }

  /**
   * Turns a list of URLs (an array or a string of URLs separated by
   * whitespace) into an array.
   * @param {*} value
   * @returns {string[]}
   */
  function toUrlList(value) {
    if (value == null) return [];
    return (Array.isArray(value) ? value.map(url => `${url}`) : `${value}`.split(/\s+/))
      .map(url => url.trim())
      .filter(Boolean);
  }

  /**
   * Prevents the HTML parser from ending an inline script early.  The code
   * must only have "</script" and "<!--" in strings.
   * @param {string} code
   * @returns {string}
   */
  function toInlineScript(code) {
    return code.replace(/<(?=\/script|!--)/gi, '\\x3C');
  }

  /**
   * Calls the function once the page has been parsed (so that elements after
   * the script can be found).
   * @param {() => void} callback
   */
  function whenParsed(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, {once: true});
    }
    else {
      callback();
    }
  }

  /**
   * Creates a page.
   * @param {Object} options
   * @param {(errors: LoadError[]) => {[key in keyof import('./yourjs-page').YourJSPageCode]: import('./yourjs-page').YourJSPageCode[key] | (() => Promise<import('./yourjs-page').YourJSPageCode[key]>)}} options.getCode
   *   Gets the code that the page starts with (where each part may be a
   *   function that loads it from a URL or a gist) and adds what can't be
   *   loaded to `errors`.  It is called once the document has been parsed.
   * @param {{[name: string]: string}} options.dataset
   *   The options for the page in the same form as the data attributes of a
   *   script tag (eg. `{layout: 'left', theme: 'dark'}`).
   * @param {(element: HTMLIFrameElement) => void} options.insert
   *   Puts the page's element into the document.
   * @returns {import('./yourjs-page').YourJSPageInstance}
   */
  function createPage({getCode, dataset, insert}) {
    const libraryUrl = getLibraryFileUrl.bind(null, dataset.librariesUrl || DEFAULT_LIBRARIES_URL);

    // The theme is determined up front so that the loading screen uses it.
    const theme = /^(light|dark)$/.test(dataset.theme) ? dataset.theme : null;
    const initialTheme = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const iframe = document.createElement('iframe');
    iframe.title = dataset.title || 'YourJS Page';
    // The result can go full screen and use the clipboard.
    iframe.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write');
    const height = dataset.height;
    Object.assign(iframe.style, {
      width: '100%',
      // Fills its container unless a height is given but, since a container
      // without a height would make it very short, it is never less than
      // 400px unless a height is given.
      height: height ? (/^\d+(\.\d+)?$/.test(height) ? `${height}px` : height) : '100%',
      minHeight: height ? '150px' : '400px',
      border: '0',
      display: 'block',
    });
    insert(iframe);

    /**
     * The code before the viewer is loaded (or after it is destroyed).  The
     * parts that are loaded from URLs are empty until they are loaded.
     * @type {import('./yourjs-page').YourJSPageCode}
     */
    let code = {html: '', css: '', js: '', cssUrls: [], jsUrls: []};
    /**
     * The parts of the code that were given to setCode() before the viewer
     * was loaded.  These win over parts that are still being loaded.
     */
    const changedKeys = new Set();
    /** @type {ReturnType<Window['yourjsPageViewer']['init']>?} */
    let viewer = null;
    let normalCssText = null;
    let isDestroyed = false;

    // What the viewer can ask this script to do.
    const hostApi = {
      /**
       * Makes the IFRAME fill the window (used if full screen isn't allowed).
       * @param {boolean} isMaximized
       */
      setMaximized(isMaximized) {
        const {style} = iframe;
        if (isMaximized) {
          normalCssText ??= style.cssText;
          Object.assign(style, {position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '2147483647'});
        }
        else if (normalCssText != null) {
          style.cssText = normalCssText;
          normalCssText = null;
        }
      },
    };

    /** @type {LoadError[]} */
    const loadErrors = [];
    /**
     * The functions that load the parts of the starting code that come from
     * a URL or a gist (by their keys).
     * @type {[string, () => Promise<string>][]}
     */
    const codeLoaders = [];
    let isCodeCollected = false;

    /**
     * Gets the starting code (once the document has been parsed).
     */
    function collectCode() {
      if (isCodeCollected) return;
      isCodeCollected = true;
      for (const [key, value] of Object.entries(getCode(loadErrors))) {
        // Code given to setCode() wins.
        if (changedKeys.has(key)) continue;
        // Code that doesn't need to be loaded is available right away.
        if ('function' === typeof value) codeLoaders.push([key, value]);
        else code[key] = value;
      }
    }
    whenParsed(collectCode);
    /** @type {Promise<void>?} */
    let codeLoaded = null;

    /**
     * Loads the parts of the starting code that come from a URL or a gist (once
     * the page is about to be shown).
     * @returns {Promise<void>}
     */
    function loadCode() {
      // (Some browsers (eg. Firefox) can say that the document was parsed
      // before it calls the DOMContentLoaded listeners.)
      collectCode();
      return codeLoaded ??= Promise.all(codeLoaders.map(async ([key, load]) => {
        const value = await load();
        if (!changedKeys.has(key)) code[key] = value;
      }));
    }

    /**
     * Loads the viewer once the document has been parsed.
     */
    function load() {
      whenParsed(() => {
        if (isDestroyed || iframe.srcdoc) return;
        loadCode();
        const runtimeCode = toInlineScript(`${previewRuntime}`);
        let startCount = 0;
        // The loading screen is shown until the code is loaded too.  The
        // viewer is started each time its page loads because the browser
        // reloads an IFRAME that is moved (eg. by a framework) and then it
        // starts with the last code that it was given.
        iframe.addEventListener('load', async () => {
          await loadCode();
          const viewerWindow = iframe.contentWindow;
          if (isDestroyed || !viewerWindow?.yourjsPageViewer) return;
          viewer = viewerWindow.yourjsPageViewer.init({
            code,
            // The viewer is starting again (eg. because its IFRAME moved).
            isRestart: startCount++ > 0,
            options: {
              layout: dataset.layout,
              tab: dataset.tab,
              theme,
              title: dataset.title || '',
              wordWrap: dataset.wordWrap === 'true',
              readOnly: dataset.readOnly === 'true',
              showConsole: dataset.showConsole === 'true',
              librarySearch: dataset.librarySearch !== 'false',
              // How long loops can keep the page busy (0 turns this off).
              loopTimeout: /^\d+$/.test(dataset.loopTimeout ?? '') ? +dataset.loopTimeout : 2000,
              // Which editors are shown (all of them unless the attribute is
              // given).
              editors: dataset.editors == null
                ? null
                : dataset.editors.toLowerCase().split(/[\s,]+/).filter(key => LANGUAGES.some(language => language.key === key)),
            },
            // Code that was replaced with setCode() before it was loaded
            // doesn't matter.
            loadErrors: loadErrors
              .filter(error => !changedKeys.has(error.key))
              // In the same order as the editors (instead of the order they
              // failed in).
              .sort((a, b) => LANGUAGES.findIndex(({key}) => key === a.key) - LANGUAGES.findIndex(({key}) => key === b.key)),
            runtimeCode,
            parserUrl: libraryUrl('acorn', 'dist/acorn.js'),
            // Used to know when the page's own code froze the last time.
            pageUrl: location.href.replace(/#.*/, ''),
            formatterUrls: [
              libraryUrl('js-beautify', 'js/lib/beautify.js'),
              libraryUrl('js-beautify', 'js/lib/beautify-css.js'),
              libraryUrl('js-beautify', 'js/lib/beautify-html.js'),
            ],
            packageInfo: PACKAGE_INFO,
          }, hostApi);
        });

        iframe.srcdoc = [
          '<!DOCTYPE html>',
          `<html lang="en" data-theme="${initialTheme}">`,
          '<head>',
          '<meta charset="utf-8">',
          `<style>${VIEWER_CSS}</style>`,
          '</head>',
          '<body>',
          VIEWER_HTML,
          // Exact versions are used so that a new release of a library can
          // never change how an existing version of this page works.  Ace
          // loads other files (eg. language modes) from next to this file.
          `<script src="${libraryUrl('ace-builds', 'src-min-noconflict/ace.js')}"><\/script>`,
          `<script>${toInlineScript(`(${viewerScript})();`)}<\/script>`,
          '</body>',
          '</html>',
        ].join('\n');
      });
    }

    // Unless data-loading="eager" is given, nothing is loaded until the page
    // is about to be scrolled into view (or a hidden page is shown).
    /** @type {IntersectionObserver?} */
    let loadObserver = null;
    if (dataset.loading !== 'eager' && 'function' === typeof window.IntersectionObserver) {
      loadObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadObserver.disconnect();
          loadObserver = null;
          load();
        }
      }, {rootMargin: '200px'});
      loadObserver.observe(iframe);
    }
    else {
      load();
    }

    const getCurrentCode = () => {
      const current = viewer?.getCode() ?? code;
      return {...current, cssUrls: [...current.cssUrls], jsUrls: [...current.jsUrls]};
    };

    return {
      element: iframe,
      getCode: getCurrentCode,
      setCode(newCode, options) {
        const current = getCurrentCode();
        newCode = Object(newCode);
        for (const {key} of LANGUAGES) {
          if (newCode[key] != null) current[key] = `${newCode[key]}`;
        }
        for (const key of ['cssUrls', 'jsUrls']) {
          if (newCode[key] != null) current[key] = toUrlList(newCode[key]);
        }
        for (const key of Object.keys(current)) {
          if (newCode[key] != null) changedKeys.add(key);
        }
        code = current;
        // Before the viewer is loaded there is nothing to run (the code runs
        // once it is loaded).
        viewer?.setCode(current, {run: options?.run !== false});
      },
      run() {
        viewer?.run();
      },
      destroy() {
        if (isDestroyed) return;
        isDestroyed = true;
        // Keeps the code for getCode().
        if (viewer) code = viewer.getCode();
        viewer?.destroy();
        viewer = null;
        loadObserver?.disconnect();
        iframe.remove();
      },
    };
  }

  /**
   * Creates a page in place of a script tag using its data attributes.
   * @param {HTMLScriptElement} script
   */
  function createPageFromScript(script) {
    const dataset = JSON.parse(JSON.stringify(script.dataset));
    return createPage({
      getCode: errors => ({
        ...Object.fromEntries(LANGUAGES.map(({key}, index) => [
          key,
          getStartingCode(
            LANGUAGES[index],
            {
              selector: dataset[`${key}Selector`],
              url: dataset[`${key}Url`],
              gist: dataset.gist,
              gistFile: dataset[`gist${key[0].toUpperCase()}${key.slice(1)}`],
            },
            errors,
            `No data-${key}-selector, data-${key}-url or data-gist attribute was given.`
          ),
        ])),
        cssUrls: toUrlList(dataset.cssUrls),
        jsUrls: toUrlList(dataset.jsUrls),
      }),
      dataset,
      insert: element => script.replaceWith(element),
    });
  }

  /**
   * Where YourJSPage.create() can put a page relative to its target.
   */
  const PLACEMENTS = {
    fill: (target, element) => target.replaceChildren(element),
    append: (target, element) => target.append(element),
    prepend: (target, element) => target.prepend(element),
    replace: (target, element) => target.replaceWith(element),
    before: (target, element) => target.before(element),
    after: (target, element) => target.after(element),
  };

  /**
   * The options of YourJSPage.create() which are the same as the data
   * attributes of a script tag.
   */
  const PAGE_OPTION_NAMES = ['editors', 'height', 'layout', 'librariesUrl', 'librarySearch', 'loading', 'loopTimeout', 'readOnly', 'showConsole', 'tab', 'theme', 'title', 'wordWrap'];

  /**
   * The JavaScript API for creating pages (available as window.YourJSPage).
   */
  const YourJSPage = Object.freeze({
    version: PACKAGE_INFO.version,

    /**
     * Creates a page.  See yourjs-page.d.ts for the options.
     * @param {import('./yourjs-page').YourJSPageOptions} options
     * @returns {import('./yourjs-page').YourJSPageInstance}
     */
    create(options) {
      options = Object(options);
      const {target, placement = 'fill'} = options;
      const targetElement = 'string' === typeof target ? document.querySelector(target) : target;
      if (targetElement?.nodeType !== 1) {
        throw new TypeError(
          'string' === typeof target
            ? `YourJSPage.create(): no element matches the target ${JSON.stringify(target)}.`
            : 'YourJSPage.create(): target must be an element or a CSS selector.'
        );
      }
      if (!Object.hasOwn(PLACEMENTS, placement)) {
        throw new TypeError(`YourJSPage.create(): placement must be one of ${Object.keys(PLACEMENTS).join(', ')}.`);
      }

      const dataset = {};
      for (const name of PAGE_OPTION_NAMES) {
        if (options[name] != null) dataset[name] = `${options[name]}`;
      }

      return createPage({
        getCode: errors => ({
          ...Object.fromEntries(LANGUAGES.map(({key}, index) => [
            key,
            getStartingCode(LANGUAGES[index], {
              code: options[key],
              selector: options[`${key}Selector`],
              url: options[`${key}Url`],
              gist: options.gist,
              gistFile: options[`gist${key[0].toUpperCase()}${key.slice(1)}`],
            }, errors),
          ])),
          cssUrls: toUrlList(options.cssUrls),
          jsUrls: toUrlList(options.jsUrls),
        }),
        dataset,
        insert: element => PLACEMENTS[placement](targetElement, element),
      });
    },
  });

  // The first copy of this script that is loaded provides the API.
  if (!window.YourJSPage) window.YourJSPage = YourJSPage;

  // A script in the body is replaced by a page while a script in the head only
  // provides the API.
  const currentScript = document.currentScript;
  if (currentScript && !document.head?.contains(currentScript)) {
    createPageFromScript(currentScript);
  }
})();
