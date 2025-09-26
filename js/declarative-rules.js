import { localStore } from "./common.js";
import RuleIdGenerator from "./rule-id-generator.js";

let ruleIdGen;
(async () => {
	const lastRuleId = await initLastId();
	ruleIdGen = new RuleIdGenerator(lastRuleId);
})();

async function initLastId() {
	return new Promise((resolve, reject) => {
		try {
			chrome.declarativeNetRequest.getDynamicRules((rules) => {
				if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
				if (!rules && rules.length == 0) {
					resolve(0);
					return;
				}
				const maxId = rules.reduce((max, r) => r.id > max ? r.id : max, 0);
				resolve(maxId);
			});
		} catch (err) {
			reject(err);
		}
	});
}
export async function deleteRules(ruleIds) {
	return new Promise((resolve, reject) => {
		chrome.declarativeNetRequest.updateDynamicRules(
			{ removeRuleIds: ruleIds },
			() => {
				if (chrome.runtime.lastError) {
					console.error("Failed to remove rules:", chrome.runtime.lastError);
					reject(chrome.runtime.lastError);
				} else {
					resolve();
				}
			}
		);
	});
}
export async function generateFrameRule(url) {
	const currentRule = await ruleIdGen.next();
	return new Promise((resolve, reject) => {
		chrome.declarativeNetRequest.updateDynamicRules({
			addRules: [{
				id: currentRule,
				priority: 1,
				action: {
					type: "redirect",
					redirect: { url: "about:blank" }
				},
				condition: {
					resourceTypes: ["sub_frame"],
					urlFilter: url
				}
			}]
		}, () => {
			if (chrome.runtime.lastError) {
				console.error("Failed generate frame rule:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			}
			else resolve(currentRule);
		});
	});
}
export async function generateWebbugRule(url) {
	const currentRule = await ruleIdGen.next();
	return new Promise((resolve, reject) => {
		chrome.declarativeNetRequest.updateDynamicRules({
			addRules: [{
				id: currentRule,
				priority: 1,
				action: {
					type: "redirect",
					redirect: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==' }
				},
				condition: {
					resourceTypes: ["image"],
					urlFilter: url
				}
			}]
		}, () => {
			if (chrome.runtime.lastError) {
				console.error("Failed generate webbug rule:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			}
			else resolve(currentRule);
		});
	});
}
export async function generateBlockingRule(url, reqtype) {
	const currentRule = await ruleIdGen.next();
	return new Promise((resolve, reject) => {
		chrome.declarativeNetRequest.updateDynamicRules({
			addRules: [{
				id: currentRule,
				priority: 1,
				action: { type: "block" },
				condition: {
					urlFilter: url,
					resourceTypes: reqtype
				}
			}]
		}, () => {
			if (chrome.runtime.lastError) {
				console.error("Failed generate blocking rule:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			}
			else resolve(currentRule);
		});
	});
}
export async function generateRedirectingUrlRule(url, redirectUrl, reqtype) {
	const currentRule = await ruleIdGen.next();
	return new Promise((resolve, reject) => {
		chrome.declarativeNetRequest.updateDynamicRules({
			addRules: [{
				id: currentRule,
				priority: 1,
				action: {
					type: "redirect",
					redirect: { url: redirectUrl }
				},
				condition: {
					resourceTypes: reqtype,
					urlFilter: url
				}
			}]
		}, () => {
			if (chrome.runtime.lastError) {
				console.error("Failed generate utm clean rule:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			}
			else resolve(currentRule);
		});
	});
}
