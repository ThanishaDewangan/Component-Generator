"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const PREVIEW_SCRIPT = `
(function() {
  var root = document.getElementById('preview-root');
  var errEl = document.getElementById('preview-error');
  if (!root) return;

  function showError(msg) {
    errEl.textContent = msg || 'Preview error';
    errEl.style.display = 'block';
    root.style.display = 'none';
  }
  function showPreview() {
    errEl.style.display = 'none';
    root.style.display = 'block';
  }

  function tryRender(code) {
    var React = window.React;
    var ReactDOM = window.ReactDOM;
    var Babel = window.Babel;
    if (!React || !ReactDOM || !Babel) return false;
    try {
      errEl.textContent = '';
      errEl.style.display = 'none';
      root.style.display = 'block';
      root.innerHTML = '';
      var normalized = code
        .replace(/<br\\s*>/gi, '<br />')
        .replace(/<hr\\s*>/gi, '<hr />')
        .replace(/^\\s*export\\s+default\\s+\\w+\\s*;\\s*$/gm, '');
      var transformed = Babel.transform(normalized, { presets: ['react'] }).code;
      transformed = transformed.replace(/^import\\s+.*?;?\\s*$/gm, '');
      transformed = transformed.replace(/export\\s+default\\s+/g, 'window.__previewComponent = ');
      var fnMatch = code.match(/function\\s+(\\w+)\\s*\\(/);
      (function(React, ReactDOM, tr, match) {
        eval(tr);
        if (!window.__previewComponent && match) {
          try { window.__previewComponent = eval(match[1]); } catch (e) {}
        }
      })(React, ReactDOM, transformed, fnMatch);
      var Component = window.__previewComponent;
      if (typeof Component !== 'function') {
        showError('Generated code did not export a component.');
        return true;
      }
      var container = document.createElement('div');
      container.style.padding = '1rem';
      root.appendChild(container);
      ReactDOM.createRoot(container).render(React.createElement(Component));
      return true;
    } catch (e) {
      showError('Preview error: ' + (e && e.message ? e.message : String(e)));
      return true;
    }
  }

  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'PREVIEW_CODE') {
      var code = event.data.code;
      if (!code || typeof code !== 'string') {
        showError('No code received.');
        return;
      }
      if (tryRender(code)) return;
      setTimeout(function() {
        if (tryRender(code)) return;
        showError('Libraries not loaded. Try refreshing the page.');
      }, 600);
    }
  });

  function sendReady() {
    if (window.React && window.ReactDOM && window.Babel && window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    } else {
      setTimeout(sendReady, 50);
    }
  }
  setTimeout(sendReady, 0);
})();
`;

export default function PreviewPage() {
  const [ready, setReady] = useState(false);
  const scriptsLoaded = useRef({ react: false, reactDom: false, babel: false });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const { react, reactDom, babel } = scriptsLoaded.current;
      if (react && reactDom && babel && !ready) setReady(true);
    };

    if (
      (window as unknown as { React?: unknown }).React &&
      (window as unknown as { ReactDOM?: unknown }).ReactDOM &&
      (window as unknown as { Babel?: unknown }).Babel
    ) {
      setReady(true);
      return;
    }

    const loadScript = (src: string, key: "react" | "reactDom" | "babel", next?: () => void) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        scriptsLoaded.current[key] = true;
        next ? next() : check();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.async = false;
      script.onload = () => {
        scriptsLoaded.current[key] = true;
        next ? next() : check();
      };
      document.body.appendChild(script);
    };

    loadScript("https://unpkg.com/react@18/umd/react.development.js", "react", () => {
      loadScript("https://unpkg.com/react-dom@18/umd/react-dom.development.js", "reactDom", () => {
        loadScript("https://unpkg.com/@babel/standalone/babel.min.js", "babel");
      });
    });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const script = document.createElement("script");
    script.textContent = PREVIEW_SCRIPT;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [ready]);

  return (
    <>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <div
          id="preview-error"
          className="text-red-600 text-sm p-4 rounded bg-red-50 hidden"
          role="alert"
        />
        <div id="preview-root" className="min-h-[200px]" />
      </div>
    </>
  );
}
