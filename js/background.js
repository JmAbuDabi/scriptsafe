import * as ScriptSafe from './scriptsafe.js';


const api = {
	...ScriptSafe
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.reqtype == 'background-action') {
		const { method, args } = message;
		if (typeof api[method] === 'function') {
			try {
				const result = api[method](...args);
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
		else {
			sendResponse({ error: `Method not found: ${method}` });
		}
	}
});