importScripts('yoyo.js', 'common.js', 'jquery.js', 'pako.js', 'scriptsafe.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { method, args } = message;
  if (typeof self[method] === 'function') {
    try {
      const result = self[method](...args);
      if (result instanceof Promise) {
        result.then(res => sendResponse({ result: res })).catch(err => sendResponse({ error: err.message }));
      } else {
        sendResponse({ result });
      }
    } catch (err) {
      sendResponse({ error: err.message });
    }
    return true; // async
  }
});