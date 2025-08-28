// ScriptSafe - Copyright (C) andryou
// Distributed under the terms of the GNU General Public License
// The GNU General Public License can be found in the gpl.txt file. Alternatively, see <http://www.gnu.org/licenses/>.
// Credits and ideas: NotScripts, AdBlock Plus for Chrome, Ghostery, KB SSL Enforcer
import { antisocial1, antisocial2, yoyo1, yoyo2 } from "./yoyo.js";
import { version, localStore, sessionStore, getDomain, extractDomainFromURL, in_array, binarySearch, confirmExt, alertExt } from "./common.js";
import * as pako from "./pako.esm.mjs";

let requestTypes, synctimer, recentstimer, reenabletimer, useragentinterval, blackList, whiteList, distrustList, trustList, sessionBlackList, sessionWhiteList, locale;
let langs = {
	'en_US': 'English (US)',
	'en_GB': 'English (UK)',
	'zh_CN': 'Chinese (Simplified)',
	'zh_TW': 'Chinese (Traditional)',
	'cs': 'Czech',
	'nl': 'Dutch',
	'fr': 'French',
	'de': 'German',
	'hu': 'Hungarian',
	'it': 'Italian',
	'ja': 'Japanese',
	'ko': 'Korean',
	'lv': 'Latvian',
	'pl': 'Polish',
	'ro': 'Romanian',
	'ru': 'Russian',
	'es': 'Spanish',
	'sv': 'Swedish'
}
let fpTypes = ['fpCanvas', 'fpCanvasFont', 'fpAudio', 'fpWebGL', 'fpBattery', 'fpDevice', 'fpGamepad', 'fpWebVR', 'fpBluetooth', 'fpClientRectangles', 'fpClipboard', 'fpBrowserPlugins'];
let fpLists = [];
let fpListsSession = [];
let popup = [];
let recentlog = [];
recentlog['allowed'] = [];
recentlog['blocked'] = [];
let changed = false;
let ITEMS = {};
let experimental = 0;
let storageapi = false;
let webrtcsupport = null;
let updated = false;
let userAgent = '';
export async function refreshRequestTypes() {
	clearRecents();
	await genUserAgent(1);
	requestTypes = ['main_frame'];
	if (await localStore.getItem('iframe') == 'true' || await localStore.getItem('frame') == 'true')
		requestTypes.push('sub_frame');
	if (await localStore.getItem('object') == 'true' || await localStore.getItem('embed') == 'true')
		requestTypes.push('object');
	if (await localStore.getItem('script') == 'true')
		requestTypes.push('script');
	if (await localStore.getItem('image') == 'true' || await localStore.getItem('webbugs') == 'true')
		requestTypes.push('image');
	if (await localStore.getItem('xml') == 'true' || await localStore.getItem('xml') == 'all')
		requestTypes.push('xmlhttprequest');
}
function checkWebRTCHandlingPolicy() {
	if (typeof chrome.privacy.network.webRTCIPHandlingPolicy === 'undefined') return false;
	return webrtcsupport;
}
export async function initWebRTC() {
	if (!webrtcsupport) return;
	if (await localStore.getItem('webrtc') != 'off') {
		chrome.privacy.network.webRTCIPHandlingPolicy.set({
			value: await localStore.getItem('webrtc'),
		});
	} else {
		chrome.privacy.network.webRTCIPHandlingPolicy.set({
			value: 'default',
		});
	}
}
export function getWebRTC() {
	return webrtcsupport;
}
export function setWebRTC(value) {
	webrtcsupport = value;
}
async function mitigate(req) {
	if (await localStore.getItem("enable") == "false" || (await localStore.getItem('useragentspoof') == 'off' && await localStore.getItem('cookies') == 'false' && await localStore.getItem('referrerspoof') == 'off')) {
		return;
	}
	for (var i = 0, forcount = req.requestHeaders.length; i < forcount; i++) {
		if (req.requestHeaders[i].name == 'User-Agent' || req.requestHeaders[i].name == 'Referer' || req.requestHeaders[i].name == 'Cookie') {
			switch (req.requestHeaders[i].name) {
				case 'Cookie':
					if (await localStore.getItem('cookies') == 'true' && baddies(req.url, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial')))
						req.requestHeaders[i].value = '';
					break;
				case 'Referer':
					if (await localStore.getItem('referrerspoof') != 'off' && (await localStore.getItem('referrerspoofdenywhitelisted') == 'true' || await enabled(req.url) == 'true')) {
						if (await localStore.getItem('referrerspoof') == 'same')
							req.requestHeaders[i].value = req.url;
						else if (await localStore.getItem('referrerspoof') == 'domain')
							req.requestHeaders[i].value = req.url.split("//")[0] + '//' + req.url.split("/")[2];
						else
							req.requestHeaders[i].value = await localStore.getItem('referrerspoof');
					}
					break;
				case 'User-Agent':
					if (await localStore.getItem('useragentspoof') != 'off' && (await localStore.getItem('uaspoofallow') == 'true' || await enabled(req.url) == 'true')) {
						if (!userAgent || await localStore.getItem('useragentinterval') == 'request') await genUserAgent();
						if (userAgent) req.requestHeaders[i].value = userAgent;
					}
					break;
			}
		}
	}
	return { requestHeaders: req.requestHeaders };
}
async function genUserAgent(force) {
	var os;
	if (await localStore.getItem('useragentspoof') == 'custom') {
		var userAgents = JSON.parse(await localStore.getItem('useragent'));
		if (userAgents) {
			var uaCount = userAgents.length;
			if (uaCount == 1) userAgent = userAgents[0];
			else {
				clearInterval(useragentinterval);
				if (await localStore.getItem('useragentinterval') == 'off') userAgent = userAgents[0]; // use only first user agent string if set to off
				else {
					if (await localStore.getItem('useragentinterval') == 'interval') {
						useragentinterval = setInterval(async function () { await genUserAgent(1) }, await localStore.getItem('useragentintervalmins') * 60 * 1000);
						if (force) userAgent = userAgents[Math.floor(Math.random() * uaCount)];
					} else if (await localStore.getItem('useragentinterval') == 'request') {
						userAgent = userAgents[Math.floor(Math.random() * uaCount)];
					}
				}
			}
		}
	} else {
		if (await localStore.getItem('useragentspoof_os') == 'w10') os = 'Windows NT 10.0';
		else if (await localStore.getItem('useragentspoof_os') == 'w81') os = 'Windows NT 6.3';
		else if (await localStore.getItem('useragentspoof_os') == 'w8') os = 'Windows NT 6.2';
		else if (await localStore.getItem('useragentspoof_os') == 'w7') os = 'Windows; U; Windows NT 6.1';
		else if (await localStore.getItem('useragentspoof_os') == 'wv') os = 'Windows; U; Windows NT 6.0';
		else if (await localStore.getItem('useragentspoof_os') == 'w2k3') os = 'Windows; U; Windows NT 5.2';
		else if (await localStore.getItem('useragentspoof_os') == 'wxp') os = 'Windows; U; Windows NT 5.1';
		else if (await localStore.getItem('useragentspoof_os') == 'w98') os = 'Windows; U; Windows 98';
		else if (await localStore.getItem('useragentspoof_os') == 'w95') os = 'Windows; U; Windows 95';
		else if (await localStore.getItem('useragentspoof_os') == 'linux64') os = 'X11; U; Linux x86_64';
		else if (await localStore.getItem('useragentspoof_os') == 'linux32') os = 'X11; U; Linux x86_32';
		else if (await localStore.getItem('useragentspoof_os') == 'machighsierra') os = 'Macintosh; U; Intel Mac OS X 10_13';
		else if (await localStore.getItem('useragentspoof_os') == 'macsierra') os = 'Macintosh; U; Intel Mac OS X 10_12_2';
		else if (await localStore.getItem('useragentspoof_os') == 'macelcapitan') os = 'Macintosh; U; Intel Mac OS X 10_11_6';
		else if (await localStore.getItem('useragentspoof_os') == 'macyosemite') os = 'Macintosh; U; Intel Mac OS X 10_10_5';
		else if (await localStore.getItem('useragentspoof_os') == 'macmavericks') os = 'Macintosh; U; Intel Mac OS X 10_9_5';
		else if (await localStore.getItem('useragentspoof_os') == 'macmountainlion') os = 'Macintosh; U; Intel Mac OS X 10_8_5';
		else if (await localStore.getItem('useragentspoof_os') == 'maclion') os = 'Macintosh; U; Intel Mac OS X 10_7_5';
		else if (await localStore.getItem('useragentspoof_os') == 'macsnow') os = 'Macintosh; U; Intel Mac OS X 10_6_8';
		else if (await localStore.getItem('useragentspoof_os') == 'freebsd64') os = 'X11; U; FreeBSD amd64';
		else if (await localStore.getItem('useragentspoof_os') == 'freebsd32') os = 'X11; U; FreeBSD i686';
		else if (await localStore.getItem('useragentspoof_os') == 'netbsd64') os = 'X11; U; NetBSD amd64';
		else if (await localStore.getItem('useragentspoof_os') == 'netbsd32') os = 'X11; U; NetBSD i686';
		else if (await localStore.getItem('useragentspoof_os') == 'openbsd64') os = 'X11; U; OpenBSD i686';
		else if (await localStore.getItem('useragentspoof_os') == 'openbsd32') os = 'X11; U; OpenBSD i686';
		else if (await localStore.getItem('useragentspoof_os') == 'chromeos') os = 'X11; U; CrOS i686 0.13.507';
		if (await localStore.getItem('useragentspoof') == 'chrome63')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36';
		else if (await localStore.getItem('useragentspoof') == 'chrome62')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36';
		else if (await localStore.getItem('useragentspoof') == 'chrome55')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36';
		else if (await localStore.getItem('useragentspoof') == 'chrome50')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36 OPR/37.0.2178.43';
		else if (await localStore.getItem('useragentspoof') == 'chrome14')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.94 Safari/535.1';
		else if (await localStore.getItem('useragentspoof') == 'chrome13')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.43 Safari/535.1';
		else if (await localStore.getItem('useragentspoof') == 'chrome12')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.750.0 Safari/534.30';
		else if (await localStore.getItem('useragentspoof') == 'opera49')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36 OPR/47.0.2631.39';
		else if (await localStore.getItem('useragentspoof') == 'opera42')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36 OPR/42.0.2393.85';
		else if (await localStore.getItem('useragentspoof') == 'opera37')
			userAgent = 'Mozilla/5.0 (' + os + ') Presto/2.9.181 Version/12.00';
		else if (await localStore.getItem('useragentspoof') == 'opera12')
			userAgent = 'Opera/9.80 (' + os + ') Presto/2.9.181 Version/12.00';
		else if (await localStore.getItem('useragentspoof') == 'opera11')
			userAgent = 'Opera/9.80 (' + os + ') Presto/2.9.168 Version/11.50';
		else if (await localStore.getItem('useragentspoof') == 'firefox57')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:57.0) Gecko/20100101 Firefox/57.0';
		else if (await localStore.getItem('useragentspoof') == 'firefox50')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:50.0) Gecko/20100101 Firefox/50.0';
		else if (await localStore.getItem('useragentspoof') == 'firefox48')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:48.0) Gecko/20100101 Firefox/48.0';
		else if (await localStore.getItem('useragentspoof') == 'firefox46')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:44.0) Gecko/20100101 Firefox/44.0';
		else if (await localStore.getItem('useragentspoof') == 'firefox6')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:6.0a2) Gecko/20110613 Firefox/6.0a2';
		else if (await localStore.getItem('useragentspoof') == 'firefox5')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:5.0) Gecko/20100101 Firefox/5.0';
		else if (await localStore.getItem('useragentspoof') == 'firefox4')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:2.0.1) Gecko/20110606 Firefox/4.0.1';
		else if (await localStore.getItem('useragentspoof') == 'firefox3')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:1.9.2.9) Gecko/20100913 Firefox/3.6.9';
		else if (await localStore.getItem('useragentspoof') == 'edge')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) 42.0.2311.135 Safari/537.36 Edge/12.246';
		else if (await localStore.getItem('useragentspoof') == 'ie11')
			userAgent = 'Mozilla/5.0 (' + os + '; Trident/7.0; rv:11.0) like Gecko';
		else if (await localStore.getItem('useragentspoof') == 'ie10')
			userAgent = 'Mozilla/5.0 (compatible; MSIE 10.0; ' + os + '; Trident/6.0)';
		else if (await localStore.getItem('useragentspoof') == 'ie9')
			userAgent = 'Mozilla/5.0 (compatible; MSIE 9.0; ' + os + ')';
		else if (await localStore.getItem('useragentspoof') == 'ie8')
			userAgent = 'Mozilla/4.0 (compatible; MSIE 8.0; ' + os + ')';
		else if (await localStore.getItem('useragentspoof') == 'ie7')
			userAgent = 'Mozilla/4.0(compatible; MSIE 7.0; ' + os + ')';
		else if (await localStore.getItem('useragentspoof') == 'ie61')
			userAgent = 'Mozilla/4.0 (compatible; MSIE 6.1; ' + os + ')';
		else if (await localStore.getItem('useragentspoof') == 'ie60')
			userAgent = 'Mozilla/4.0 (compatible; MSIE 6.0; ' + os + ')';
		else if (await localStore.getItem('useragentspoof') == 'safari8')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12';
		else if (await localStore.getItem('useragentspoof') == 'safari7')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A';
		else if (await localStore.getItem('useragentspoof') == 'safari5')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1';
		else if (await localStore.getItem('useragentspoof') == 'palemoon256')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:25.6) Gecko/20150723 PaleMoon/25.6.0';
		else if (await localStore.getItem('useragentspoof') == 'palemoon25')
			userAgent = 'Mozilla/5.0 (' + os + '; rv:25.1) Gecko/20130308 PaleMoon/25.1';
		else if (await localStore.getItem('useragentspoof') == 'vivaldi111')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.91 Safari/537.36 Vivaldi/1.92.917.35';
		else if (await localStore.getItem('useragentspoof') == 'vivaldi')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.89 Safari/537.36 Vivaldi/1.0.83.38';
		else if (await localStore.getItem('useragentspoof') == 'midori')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/538.15 (KHTML, like Gecko) Chrome/18.0.1025.133 Safari/538.15 Midori/0.5';
		else if (await localStore.getItem('useragentspoof') == 'qupzilla')
			userAgent = 'Mozilla/5.0 (' + os + ') AppleWebKit/533.3 (KHTML, like Gecko) Qupzilla/1.1.5';
	}
}
function removeParams(str) {
	return str.replace(/#[^#]*$/, "").replace(/\?[^\?]*$/, "");
}
function UrlInList(url, elems) { // thanks vnagarnaik!
	var foundElem = false;
	for (var i = elems.length - 1; i >= 0; i--) {
		if (elems[i].indexOf(url) > -1) {
			foundElem = true;
			break;
		}
	}
	return foundElem;
}
async function inlineblock(req) {
	if (req.tabId == -1 || req.url === 'undefined' || await localStore.getItem("enable") == "false") {
		return;
	}
	var headers = req.responseHeaders;
	if (req.type == 'main_frame') {
		var domainCheckStatus = await domainCheck(req.url, 1);
		if (experimental == '1' && await localStore.getItem('preservesamedomain') == 'false' && await localStore.getItem('script') == 'true' && await enabled(req.url) == 'true') {
			headers.push({
				'name': 'Content-Security-Policy',
				'value': "script-src 'none'"
			});
			recentlog['blocked'].push([new Date().getTime(), req.url, 'PAGE', extractDomainFromURL(req.url), req.url, domainCheckStatus, domainCheckStatus, baddies(req.url, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'), 2), false]);
			updateRecents('blocked');
		} else {
			recentlog['allowed'].push([new Date().getTime(), req.url, 'PAGE', extractDomainFromURL(req.url), req.url, domainCheckStatus, 0]);
			updateRecents('allowed');
		}
	}
	return { responseHeaders: headers };
}
async function ScriptSafe(req) {
	if (req.tabId == -1 || req.url === 'undefined' || await localStore.getItem("enable") == "false" || req.url.substring(0, 4) != 'http') {
		resetTabData(req.tabId, req.url);
		return { cancel: false };
	}
	if (req.type == 'main_frame') {
		resetTabData(req.tabId, req.url);
	}
	if (typeof ITEMS[req.tabId] === 'undefined') return { cancel: false };
	var reqtype = req.type;
	if (reqtype == "sub_frame") reqtype = 'frame';
	else if (reqtype == "main_frame") reqtype = 'page';
	var thirdPartyCheck;
	var elementStatusCheck;
	var baddiesCheck = baddies(req.url, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'), 2);
	var extractedDomain = extractDomainFromURL(ITEMS[req.tabId]['url']);
	var extractedReqDomain = extractDomainFromURL(req.url);
	var domainCheckStatus = await domainCheck(req.url, 1);
	var tabDomainCheckStatus = await domainCheck(extractedDomain, 1);
	if (tabDomainCheckStatus == '1' || (tabDomainCheckStatus == '-1' && await localStore.getItem('mode') == 'block' && await localStore.getItem('paranoia') == 'true' && await localStore.getItem('preservesamedomain') == 'false')) {
		elementStatusCheck = true;
		thirdPartyCheck = true;
	} else {
		if ((domainCheckStatus == '0' && !(tabDomainCheckStatus == '-1' && await localStore.getItem('mode') == 'block' && await localStore.getItem('paranoia') == 'true')) || (await localStore.getItem('preservesamedomain') == 'strict' && extractedDomain == extractedReqDomain)) thirdPartyCheck = false;
		else if (await localStore.getItem('preservesamedomain') == 'strict' && extractedDomain != extractedReqDomain) thirdPartyCheck = true;
		else thirdPartyCheck = thirdParty(req.url, extractedDomain);
		if ((tabDomainCheckStatus == '-1' && await localStore.getItem('mode') == 'block' && await localStore.getItem('paranoia') == 'true') || (domainCheckStatus != '0' && (domainCheckStatus == '1' || (domainCheckStatus == '-1' && await localStore.getItem('mode') == 'block'))) || ((await localStore.getItem('annoyances') == 'true' && (await localStore.getItem('annoyancesmode') == 'strict' || (await localStore.getItem('annoyancesmode') == 'relaxed' && domainCheckStatus != '0'))) && baddiesCheck == '1') || (await localStore.getItem('antisocial') == 'true' && baddiesCheck == '2'))
			elementStatusCheck = true;
		else elementStatusCheck = false;
	}
	var utmCleanURL = await utmClean(req.url);
	var hashCleanURL = await hashTrackingClean(req.url);
	if (elementStatusCheck && baddiesCheck && reqtype == "image") reqtype = 'webbug';
	if ((reqtype == "page" && await localStore.getItem('mode') == 'block' && (domainCheckStatus == '1' || ((await localStore.getItem('annoyances') == 'true' && (await localStore.getItem('annoyancesmode') == 'strict' || (await localStore.getItem('annoyancesmode') == 'relaxed' && domainCheckStatus != '0'))) && baddiesCheck == '1') || (await localStore.getItem('antisocial') == 'true' && baddiesCheck == '2'))) || (reqtype == "frame" && (await localStore.getItem('iframe') == 'true' || await localStore.getItem('frame') == 'true')) || (reqtype == "script" && await localStore.getItem('script') == 'true') || (reqtype == "object" && (await localStore.getItem('object') == 'true' || await localStore.getItem('embed') == 'true')) || (reqtype == "image" && await localStore.getItem('image') == 'true') || reqtype == "webbug" || (reqtype == "xmlhttprequest" && ((await localStore.getItem('xml') == 'true' && (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck)) || await localStore.getItem('xml') == 'all'))) {
		// request qualified for filtering, so continue.
	} else {
		if (utmCleanURL) return { redirectUrl: utmCleanURL };
		if (hashCleanURL) return { redirectUrl: hashCleanURL };
		return { cancel: false };
	}
	var cleanedUrl = removeParams(req.url);
	if (elementStatusCheck && ((await localStore.getItem('preservesamedomain') != 'false' && (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck)) || await localStore.getItem('preservesamedomain') == 'false')) {
		if (typeof ITEMS[req.tabId]['blocked'] === 'undefined') ITEMS[req.tabId]['blocked'] = [];
		if (!UrlInList(cleanedUrl, ITEMS[req.tabId]['blocked'])) {
			if (extractedReqDomain.substr(0, 4) == 'www.') extractedReqDomain = extractedReqDomain.substr(4);
			ITEMS[req.tabId]['blocked'].push([cleanedUrl, reqtype.toUpperCase(), extractedReqDomain, domainCheckStatus, tabDomainCheckStatus, baddiesCheck, false]);
			recentlog['blocked'].push([new Date().getTime(), req.url, reqtype.toUpperCase(), extractedReqDomain, ITEMS[req.tabId]['url'], domainCheckStatus, tabDomainCheckStatus, baddiesCheck, false]);
			updateRecents('blocked');
			updateCount(req.tabId);
		}
		if (reqtype == 'frame') {
			return { redirectUrl: 'about:blank' };
		} else if (reqtype == 'webbug' || reqtype == 'image') {
			return { redirectUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==' };
		}
		return { cancel: true };
	} else {
		if (typeof ITEMS[req.tabId]['allowed'] === 'undefined') ITEMS[req.tabId]['allowed'] = [];
		if (!UrlInList(cleanedUrl, ITEMS[req.tabId]['allowed'])) {
			if (extractedReqDomain.substr(0, 4) == 'www.') extractedReqDomain = extractedReqDomain.substr(4);
			ITEMS[req.tabId]['allowed'].push([cleanedUrl, reqtype.toUpperCase(), extractedReqDomain, domainCheckStatus, baddiesCheck]);
			recentlog['allowed'].push([new Date().getTime(), req.url, reqtype.toUpperCase(), extractedReqDomain, ITEMS[req.tabId]['url'], domainCheckStatus, baddiesCheck]);
			updateRecents('allowed');
		}
	}
	if (utmCleanURL) return { redirectUrl: utmCleanURL };
	if (hashCleanURL) return { redirectUrl: hashCleanURL };
	return { cancel: false };
}
function updateRecents(list) {
	clearTimeout(recentstimer);
	recentstimer = setTimeout(function () { setRecents(list) }, 1000);
}
function setRecents(list) {
	var recentLimit = 25;
	var recentsLength = recentlog[list].length;
	if (recentsLength > recentLimit) recentlog[list] = recentlog[list].slice(recentsLength - recentLimit);
}
export function getRecents(list) {
	setRecents(list);
	return JSON.stringify(recentlog[list]);
}
export function clearRecents() {
	recentlog['allowed'] = [];
	recentlog['blocked'] = [];
}
async function utmClean(url) {
	if (await localStore.getItem('utm') == "true") {
		var paramstart = url.indexOf("?");
		var sanitized = url;
		if (paramstart != -1) {
			if (url.indexOf("utm_") > paramstart) {
				sanitized = sanitized.replace(/[\?\&]utm_(?:cid|reader|term|content|source|medium|campaign|name)=[^&#]+/ig, "");
				if (sanitized.charAt(paramstart) == "&") sanitized = sanitized.substring(0, paramstart) + "?" + sanitized.substring(paramstart + 1);
			}
		}
		sanitized = sanitized.replace(/#utm_(?:cid|reader|term|content|source|medium|campaign)=.+/i, "");
		if (url != sanitized) return sanitized;
	}
	return false;
}
async function hashTrackingClean(url) {
	if (await localStore.getItem('hashchecking') == "true" && (await localStore.getItem('hashallow') == "true" || await enabled(url) == 'true')) {
		var hashstart = url.indexOf("#");
		if (hashstart != -1) {
			if (url.indexOf("=") > hashstart) {
				return url.substring(0, hashstart);
			}
		}
	}
	return false;
}
async function enabled(url) {
	var domainCheckStatus = await domainCheck(url);
	if (await localStore.getItem("enable") == "true" && domainCheckStatus != '0' && (domainCheckStatus == '1' || (await localStore.getItem("mode") == "block" && domainCheckStatus == '-1')) && url.indexOf('https://chrome.google.com/webstore') == -1 && (url.substring(0, 4) == 'http' || url == 'chrome://newtab/'))
		return 'true';
	return 'false';
}
async function enabledfp(domainname, fptype) {
	if ((await localStore.getItem('canvas') == 'false' && fptype == 'fpCanvas') || (await localStore.getItem('canvasfont') == 'false' && fptype == 'fpCanvasFont') || (await localStore.getItem('audioblock') == 'false' && fptype == 'fpAudio') || (await localStore.getItem('webgl') == 'false' && fptype == 'fpWebGL') || (await localStore.getItem('battery') == 'false' && fptype == 'fpBattery') || (await localStore.getItem('webrtcdevice') == 'false' && fptype == 'fpDevice') || (await localStore.getItem('gamepad') == 'false' && fptype == 'fpGamepad') || (await localStore.getItem('webvr') == 'false' && fptype == 'fpWebVR') || (await localStore.getItem('bluetooth') == 'false' && fptype == 'fpBluetooth') || (await localStore.getItem('clientrects') == 'false' && fptype == 'fpClientRectangles') || (await localStore.getItem('clipboard') == 'false' && fptype == 'fpClipboard') || (await localStore.getItem('browserplugins') == 'false' && fptype == 'fpBrowserPlugins')) return '-1';
	if (in_array(domainname, fpLists[fptype])) return '1';
	if (in_array(domainname, fpListsSession[fptype])) return '2';
	return '-1';
}
export function baddies(src, amode, antisocial, lookupmode) {
	lookupmode = lookupmode || 1;
	var dmn = extractDomainFromURL(src);
	var topDomain = getDomain(dmn);
	if (dmn.indexOf(".") == -1 && src.indexOf(".") != -1) dmn = src;
	if (antisocial == 'true' && (antisocial2.indexOf(dmn) != -1 || antisocial1.indexOf(topDomain) != -1 || src.indexOf("digg.com/tools/diggthis.js") != -1 || src.indexOf("/googleapis.client__plusone.js") != -1 || src.indexOf("apis.google.com/js/plusone.js") != -1 || src.indexOf(".facebook.com/connect") != -1 || src.indexOf(".facebook.com/plugins") != -1 || src.indexOf(".facebook.com/widgets") != -1 || src.indexOf(".fbcdn.net/connect.php/js") != -1 || src.indexOf(".stumbleupon.com/hostedbadge") != -1 || src.indexOf(".youtube.com/subscribe_widget") != -1 || src.indexOf(".ytimg.com/yt/jsbin/www-subscribe-widget") != -1 || src.indexOf("apis.google.com/js/platform.js") != -1 || src.indexOf("plus.google.com/js/client:plusone.js") != -1 || src.indexOf("linkedin.com/countserv/count/share") != -1))
		return '2';
	if ((amode == 'relaxed' && domainCheck(dmn, lookupmode) != '0') || amode == 'strict') {
		if (binarySearch(yoyo1, topDomain) != -1) return '1';
		if (binarySearch(yoyo2, dmn) != -1) return '1';
	}
	return false;
}
export async function domainCheck(domain, req) {
	if (req === undefined) {
		var baddiesCheck = baddies(domain, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'));
		if (((await localStore.getItem('annoyances') == 'true' && await localStore.getItem('annoyancesmode') == 'strict' && baddiesCheck == '1') || (await localStore.getItem('antisocial') == 'true' && baddiesCheck == '2') || (await localStore.getItem('annoyances') == 'true' && await localStore.getItem('annoyancesmode') == 'relaxed' && baddiesCheck))) return '1';
	}
	var domainname = extractDomainFromURL(domain);
	if (req != '2') {
		if (await localStore.getItem('mode') == 'block' && in_array(domainname, sessionWhiteList)) return '0';
		if (await localStore.getItem('mode') == 'allow' && in_array(domainname, sessionBlackList)) return '1';
	}
	if (in_array(domainname, whiteList)) return '0';
	if (in_array(domainname, blackList)) return '1';
	if (req === undefined) {
		if (await localStore.getItem('annoyances') == 'true' && await localStore.getItem('annoyancesmode') == 'relaxed' && baddiesCheck) return '1';
	}
	return '-1';
}
export function domainSort(hosts) {
	var sorted_hosts = new Array();
	var split_hosts = new Array();
	if (hosts.length > 0) {
		if (typeof hosts[0] === 'object') {
			for (var h in hosts) {
				split_hosts.push([getDomain(hosts[h][2]), hosts[h][0], hosts[h][1], hosts[h][2], hosts[h][3], hosts[h][4], hosts[h][5], hosts[h][6]]);
			}
			split_hosts.sort();
			for (var h in split_hosts) {
				sorted_hosts.push([split_hosts[h][1], split_hosts[h][2], split_hosts[h][3], split_hosts[h][4], split_hosts[h][5], split_hosts[h][6], split_hosts[h][7]]);
			}
		} else {
			for (var h in hosts) {
				split_hosts.push([getDomain(hosts[h]), hosts[h]]);
			}
			split_hosts.sort();
			for (var h in split_hosts) {
				sorted_hosts.push(split_hosts[h][1]);
			}
		}
		return sorted_hosts;
	}
	return hosts;
}
export function trustCheck(domain) {
	if (in_array(domain, trustList)) return '1';
	if (in_array(domain, distrustList)) return '2';
	return false;
}
export async function topHandler(domain, mode) {
	if (domain) {
		if (!domain.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g) && !domain.match(/^(?:\[[A-Fa-f0-9:.]+\])(:[0-9]+)?$/g)) domain = '**.' + getDomain(domain);
		if (mode != '0' && mode != '1') await fpDomainHandler(domain, mode, 1);
		else await domainHandler(domain, mode);
		changed = true;
		return true;
	}
	return false;
}
function haystackSearch(needle, haystack) {
	var keys = [];
	var rootdomain = getDomain(needle);
	for (var key in haystack) {
		if (rootdomain == getDomain(haystack[key])) {
			keys.push(haystack[key]);
		}
	}
	return keys;
}
export async function domainHandler(domain, action, listtype) {
	if (listtype === undefined)
		listtype = 0;
	if (domain) {
		action = parseInt(action);
		// Initialize local storage
		if (listtype == 0) {
			if (typeof (await localStore.getItem('whiteList')) === 'undefined') await localStore.setItem('whiteList', JSON.stringify([]));
			if (typeof (await localStore.getItem('blackList')) === 'undefined') await localStore.setItem('blackList', JSON.stringify([]));
			var tempWhitelist = JSON.parse(await localStore.getItem('whiteList'));
			var tempBlacklist = JSON.parse(await localStore.getItem('blackList'));
		} else if (listtype == 1) {
			if (typeof (await sessionStore.getItem('whiteList')) === 'undefined') await sessionStore.setItem('whiteList', JSON.stringify([]));
			if (typeof (await sessionStore.getItem('blackList')) === 'undefined') await sessionStore.setItem('blackList', JSON.stringify([]));
			var tempWhitelist = JSON.parse(await sessionStore.getItem('whiteList'));
			var tempBlacklist = JSON.parse(await sessionStore.getItem('blackList'));
		}
		// Remove domain from whitelist and blacklist
		var pos = tempWhitelist.indexOf(domain);
		if (pos != -1) tempWhitelist.splice(pos, 1);
		pos = tempBlacklist.indexOf(domain);
		if (pos != -1) tempBlacklist.splice(pos, 1);
		if (domain.substr(0, 4) == 'www.') {
			domain = domain.substr(4);
			pos = tempWhitelist.indexOf(domain);
			if (pos != -1) tempWhitelist.splice(pos, 1);
			pos = tempBlacklist.indexOf(domain);
			if (pos != -1) tempBlacklist.splice(pos, 1);
		}
		if (listtype == 0 && action != 2) {
			var tempDomain;
			if (domain.substr(0, 3) == '**.') {
				tempDomain = domain.substr(3);
				var whiteInstances = haystackSearch(tempDomain, tempWhitelist);
				var blackInstances = haystackSearch(tempDomain, tempBlacklist);
				var whiteInstancesCount = whiteInstances.length;
				var blackInstancesCount = blackInstances.length;
				if (whiteInstancesCount || blackInstancesCount) {
					var lingo = '';
					if (action == 1) lingo = 'dis';
					if (await confirmExt('ScriptSafe detected ' + (whiteInstancesCount + blackInstancesCount) + ' existing rule(s) for ' + tempDomain + ' (' + whiteInstancesCount + ' whitelist and ' + blackInstancesCount + ' blacklist).\r\nDo you want to delete them before ' + lingo + 'trusting the entire ' + tempDomain + ' domain in order to avoid conflicts?\r\nNote: this might not necessarily remove all conflicting entries, particularly if they use regex (e.g. d?main.com).')) {
						if (whiteInstancesCount) {
							for (var x = 0; x < whiteInstancesCount; x++) {
								tempWhitelist.splice(tempWhitelist.indexOf(whiteInstances[x]), 1);
							}
						}
						if (blackInstancesCount) {
							for (var x = 0; x < blackInstancesCount; x++) {
								tempBlacklist.splice(tempBlacklist.indexOf(blackInstances[x]), 1);
							}
						}
					} else {
						if (!await confirmExt('Do you still want to proceed ' + lingo + 'trusting the entire ' + tempDomain + ' domain?')) {
							return false;
						}
					}
				}
			} else {
				tempDomain = '**.' + getDomain(domain);
			}
			var pos = tempWhitelist.indexOf(tempDomain);
			if (pos != -1) tempWhitelist.splice(pos, 1);
			pos = tempBlacklist.indexOf(tempDomain);
			if (pos != -1) tempBlacklist.splice(pos, 1);
		}
		switch (action) {
			case 0:	// Whitelist
				tempWhitelist.push(domain);
				break;
			case 1:	// Blacklist
				tempBlacklist.push(domain);
				break;
			case 2:	// Remove
				break;
		}
		if (listtype == 0) {
			await localStore.setItem('whiteList', JSON.stringify(tempWhitelist));
			await localStore.setItem('blackList', JSON.stringify(tempBlacklist));
			await cacheLists();
		} else if (listtype == 1) {
			await sessionStore.setItem('whiteList', JSON.stringify(tempWhitelist));
			await sessionStore.setItem('blackList', JSON.stringify(tempBlacklist));
			tempWhitelist = tempWhitelist.sort();
			sessionWhiteList = tempWhitelist;
			tempBlacklist = tempBlacklist.sort();
			sessionBlackList = tempBlacklist;
		}
		clearRecents();
		return true;
	}
	return false;
}
export async function fpDomainHandler(domain, listtype, action, temp) {
	if (temp === undefined)
		temp = 0;
	if (domain) {
		action = parseInt(action);
		// Initialize local storage
		if (temp == 0) {
			if (typeof (await localStore.getItem(listtype)) === 'undefined') await localStore.setItem(listtype, JSON.stringify([]));
			var tempList = JSON.parse(await localStore.getItem(listtype));
		} else if (temp == 1) {
			if (typeof (await localStore.getItem(listtype)) === 'undefined') await sessionStore.setItem(listtype, JSON.stringify([]));
			var tempList = JSON.parse(await sessionStore.getItem(listtype));
		}
		// Remove domain from list
		var pos = tempList.indexOf(domain);
		if (pos != -1) tempList.splice(pos, 1);
		if (domain.substr(0, 4) == 'www.') {
			domain = domain.substr(4);
			pos = tempList.indexOf(domain);
			if (pos != -1) tempList.splice(pos, 1);
		}
		if (action != -1) {
			var tempDomain;
			if (domain.substr(0, 3) == '**.') {
				tempDomain = domain.substr(3);
				var instances = haystackSearch(tempDomain, tempList);
				var instancesCount = instances.length;
				if (instancesCount) {
					if (await confirmExt('ScriptSafe detected ' + instancesCount + ' existing rule(s) for ' + tempDomain + '.\r\nDo you want to delete them before trusting the entire ' + tempDomain + ' domain in order to avoid conflicts?\r\nNote: this might not necessarily remove all conflicting entries, particularly if they use regex (e.g. d?main.com).')) {
						if (instancesCount) {
							for (var x = 0; x < instancesCount; x++) {
								tempList.splice(tempList.indexOf(instances[x]), 1);
							}
						}
					} else {
						if (!await confirmExt('Do you still want to proceed trusting the entire ' + tempDomain + ' domain?')) {
							return false;
						}
					}
				}
			} else {
				tempDomain = '**.' + getDomain(domain);
			}
			var pos = tempList.indexOf(tempDomain);
			if (pos != -1) tempList.splice(pos, 1);
		}
		switch (action) {
			case 1:	// Add
				tempList.push(domain);
				break;
			case -1: // Remove
				break;
		}
		if (temp == 0) {
			await localStore.setItem(listtype, JSON.stringify(tempList));
			tempList = tempList.sort();
			fpLists[listtype] = tempList;
		} else if (temp == 1) {
			await sessionStore.setItem(listtype, JSON.stringify(tempList));
			tempList = tempList.sort();
			fpListsSession[listtype] = tempList;
		}
		clearRecents();
		return true;
	}
	return false;
}
async function optionExists(opt) {
	return (typeof (await localStore.getItem(opt)) !== "undefined");
}
async function defaultOptionValue(opt, val) {
	if (!await optionExists(opt)) await localStore.setItem(opt, val);
}
export async function setDefaultOptions(force) {
	var settingNames = {
		"version": version,
		"sync": "false",
		"syncenable": "false",
		"syncnotify": "true",
		"syncfromnotify": "true",
		"lastSync": "0",
		"updatenotify": "true",
		"enable": "true",
		"mode": "block",
		"refresh": "true",
		"script": "true",
		"noscript": "false",
		"object": "true",
		"applet": "true",
		"embed": "true",
		"iframe": "true",
		"frame": "true",
		"audio": "true",
		"video": "true",
		"image": "false",
		"showcontext": "true",
		"canvas": "false",
		"canvasfont": "false",
		"clientrects": "false",
		"audioblock": "false",
		"webgl": "false",
		"battery": "false",
		"webrtcdevice": "false",
		"gamepad": "false",
		"webvr": "false",
		"bluetooth": "false",
		"timezone": "false",
		"keyboard": "false",
		"keydelta": "40",
		"xml": "true",
		"annoyances": "true",
		"annoyancesmode": "relaxed",
		"antisocial": "false",
		"preservesamedomain": "false",
		"webbugs": "true",
		"utm": "false",
		"hashchecking": "false",
		"hashallow": "false",
		"webrtc": "default_public_interface_only",
		"classicoptions": "false",
		"rating": "true",
		"referrer": "true",
		"linktarget": "off",
		"domainsort": "true",
		"useragentspoof": "off",
		"useragentspoof_os": "off",
		"useragentinterval": "off",
		"useragentintervalmins": "5",
		"uaspoofallow": "false",
		"referrerspoof": "off",
		"referrerspoofdenywhitelisted": "false",
		"cookies": "true",
		"paranoia": "false",
		"dataurl": "false",
		"clipboard": "false",
		"optionslist": "false",
		"browserplugins": "false"
	}
	if (force) {
		for (var i in settingNames) {
			await localStore.setItem(i, settingNames[i]);
		}
		updated = true;
	} else {
		for (var i in settingNames) {
			await defaultOptionValue(i, settingNames[i]);
		}
	}
	if (await optionExists("updatemessagenotify")) await localStore.removeItem('updatemessagenotify');
	if (await optionExists("useragentcustom")) {
		await localStore.setItem('useragent', JSON.stringify([await localStore.getItem('useragentcustom')]));
		await localStore.removeItem('useragentcustom');
	}
	if ((force && force == '2') || !await optionExists("blackList")) await localStore.setItem('blackList', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("whiteList")) await localStore.setItem('whiteList', JSON.stringify(["*.googlevideo.com"]));
	if ((force && force == '2') || !await optionExists("fpCanvas")) await localStore.setItem('fpCanvas', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpCanvasFont")) await localStore.setItem('fpCanvasFont', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpAudio")) await localStore.setItem('fpAudio', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpWebGL")) await localStore.setItem('fpWebGL', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpBattery")) await localStore.setItem('fpBattery', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpDevice")) await localStore.setItem('fpDevice', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpGamepad")) await localStore.setItem('fpGamepad', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpWebVR")) await localStore.setItem('fpWebVR', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpBluetooth")) await localStore.setItem('fpBluetooth', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpClientRectangles")) await localStore.setItem('fpClientRectangles', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpClipboard")) await localStore.setItem('fpClipboard', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("fpBrowserPlugins")) await localStore.setItem('fpBrowserPlugins', JSON.stringify([]));
	if ((force && force == '2') || !await optionExists("useragent")) await localStore.setItem('useragent', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('blackList')) === "undefined") await sessionStore.setItem('blackList', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('whiteList')) === "undefined") await sessionStore.setItem('whiteList', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpCanvas')) === "undefined") await sessionStore.setItem('fpCanvas', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpCanvasFont')) === "undefined") await sessionStore.setItem('fpCanvasFont', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpAudio')) === "undefined") await sessionStore.setItem('fpAudio', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpWebGL')) === "undefined") await sessionStore.setItem('fpWebGL', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpBattery')) === "undefined") await sessionStore.setItem('fpBattery', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpDevice')) === "undefined") await sessionStore.setItem('fpDevice', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpGamepad')) === "undefined") await sessionStore.setItem('fpGamepad', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpWebVR')) === "undefined") await sessionStore.setItem('fpWebVR', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpBluetooth')) === "undefined") await sessionStore.setItem('fpBluetooth', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpClientRectangles')) === "undefined") await sessionStore.setItem('fpClientRectangles', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpClipboard')) === "undefined") await sessionStore.setItem('fpClipboard', JSON.stringify([]));
	if ((force && force == '2') || typeof (await sessionStore.getItem('fpBrowserPlugins')) === "undefined") await sessionStore.setItem('fpBrowserPlugins', JSON.stringify([]));
	chrome.action.setBadgeBackgroundColor({ color: [208, 0, 24, 255] });
}
function updateCount(tabId) {
	var TAB_ITEMS = ITEMS[tabId] || (ITEMS[tabId] = [0]);
	var TAB_BLOCKED_COUNT = ++TAB_ITEMS[0];
	chrome.action.setBadgeBackgroundColor({ color: [208, 0, 24, 255], tabId: tabId });
	chrome.action.setBadgeText({ tabId: tabId, text: TAB_BLOCKED_COUNT + '' });
}
function initCount(tabId) {
	var TAB_ITEMS = ITEMS[tabId] || (ITEMS[tabId] = [0]);
	var TAB_BLOCKED_COUNT = TAB_ITEMS[0];
	chrome.action.setBadgeBackgroundColor({ color: [208, 0, 24, 255], tabId: tabId });
	if (TAB_BLOCKED_COUNT != 0) chrome.action.setBadgeText({ tabId: tabId, text: TAB_BLOCKED_COUNT + '' });
}
function removeHash(str) {
	var hashindex = str.indexOf("#");
	if (hashindex != -1) return str.substr(0, hashindex);
	return str;
}
function resetTabData(id, url) {
	if (id && url) {
		ITEMS[id] = [0];
		ITEMS[id]['url'] = url;
		ITEMS[id]['blocked'] = [];
		ITEMS[id]['allowed'] = [];
	}
}
export async function revokeTemp() {
	sessionBlackList = '';
	sessionWhiteList = '';
	fpListsSession = [];
	await sessionStore.setItem('blackList', JSON.stringify([]));
	await sessionStore.setItem('whiteList', JSON.stringify([]));
	await sessionStore.setItem('fpCanvas', JSON.stringify([]));
	await sessionStore.setItem('fpCanvasFont', JSON.stringify([]));
	await sessionStore.setItem('fpAudio', JSON.stringify([]));
	await sessionStore.setItem('fpWebGL', JSON.stringify([]));
	await sessionStore.setItem('fpBattery', JSON.stringify([]));
	await sessionStore.setItem('fpDevice', JSON.stringify([]));
	await sessionStore.setItem('fpGamepad', JSON.stringify([]));
	await sessionStore.setItem('fpWebVR', JSON.stringify([]));
	await sessionStore.setItem('fpBluetooth', JSON.stringify([]));
	await sessionStore.setItem('fpClientRectangles', JSON.stringify([]));
	await sessionStore.setItem('fpClipboard', JSON.stringify([]));
	await sessionStore.setItem('fpBrowserPlugins', JSON.stringify([]));
}
export async function statuschanger(duration) {
	clearTimeout(reenabletimer);
	if (await localStore.getItem('enable') == 'true') {
		await localStore.setItem('enable', 'false');
		chrome.action.setIcon({ path: "../img/IconDisabled.png" });
		if (duration) {
			duration = duration * 60 * 1000;
			reenabletimer = setTimeout(async function () { await localStore.setItem('enable', 'true'); }, duration);
		}
	} else {
		await localStore.setItem('enable', 'true');
		chrome.action.setIcon({ path: "../img/IconForbidden.png" });
	}
	reinitContext();
}
async function tempHandler(request) {
	if (typeof request.url === 'object') {
		for (var i = 0, forcount = request.url.length; i < forcount; i++) {
			if (request.url[i][0] != 'no.script' && request.url[i][0] != 'web.bug') {
				var baddiesStatus = baddies(request.url[i], await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'));
				if ((await localStore.getItem('annoyances') == 'true' && await localStore.getItem('annoyancesmode') == 'strict' && baddiesStatus == 1) || (await localStore.getItem('antisocial') == 'true' && baddiesStatus == '2')) {
					// do nothing
				} else {
					if (request.mode == 'block') await domainHandler(request.url[i], 0, 1);
					else await domainHandler(request.url[i], 1, 1);
				}
			}
		}
	} else {
		var baddiesStatus = baddies(request.url, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'));
		if ((await localStore.getItem('annoyances') == 'true' && await localStore.getItem('annoyancesmode') == 'strict' && baddiesStatus == 1) || (await localStore.getItem('antisocial') == 'true' && baddiesStatus == '2')) {
			// do nothing
		} else {
			if (request.mode == 'block') await domainHandler(request.url, 0, 1);
			else await domainHandler(request.url, 1, 1);
		}
	}
	changed = true;
}
async function removeTempHandler(request) {
	if (typeof request.url === 'object') {
		for (var i = 0, forcount = request.url.length; i < forcount; i++) {
			await domainHandler(request.url[i], 2, 1);
		}
	} else {
		await domainHandler(request.url, 2, 1);
	}
	changed = true;
}
async function getSessionList() {
	if (await localStore.getItem('mode') == 'block') return sessionWhiteList;
	else if (await localStore.getItem('mode') == 'allow') return sessionBlackList;
}
export async function checkTemp(domain) {
	return in_array(domain, await getSessionList());
}
chrome.tabs.onRemoved.addListener(function (tabid) {
	if (typeof ITEMS[tabid] !== 'undefined') delete ITEMS[tabid];
});
chrome.tabs.onUpdated.addListener(async function (tabid, changeinfo, tab) {
	if (await localStore.getItem('enable') == 'true') {
		if (changeinfo.status == 'loading') {
			var icontype = "Allowed";
			if (await enabled(tab.url) == "true")
				icontype = "Forbidden";
			var extractedDomain = extractDomainFromURL(tab.url);
			if (in_array(extractedDomain, sessionWhiteList) || in_array(extractedDomain, sessionBlackList))
				icontype = "Temp";
			chrome.action.setIcon({ path: "../img/Icon" + icontype + ".png", tabId: tabid });
		} else if (changeinfo.status == "complete") {
			if (typeof ITEMS[tabid] !== 'undefined') {
				changed = true;
				if (await localStore.getItem('mode') == 'block' && typeof ITEMS[tabid]['allowed'] !== 'undefined') {
					for (var i = 0, forcount = ITEMS[tabid]['allowed'].length; i < forcount; i++) {
						if (in_array(extractDomainFromURL(ITEMS[tabid]['allowed'][i][0]), sessionWhiteList)) {
							chrome.action.setIcon({ path: "../img/IconTemp.png", tabId: tabid });
							break;
						}
					}
				} else if (await localStore.getItem('mode') == 'allow' && typeof ITEMS[tabid]['blocked'] !== 'undefined') {
					for (var i = 0, forcount = ITEMS[tabid]['blocked'].length; i < forcount; i++) {
						if (in_array(extractDomainFromURL(ITEMS[tabid]['blocked'][i][0]), sessionBlackList)) {
							chrome.action.setIcon({ path: "../img/IconTemp.png", tabId: tabid });
							break;
						}
					}
				}
			}
		}
	} else chrome.action.setIcon({ path: "../img/IconDisabled.png", tabId: tabid });
});
chrome.runtime.onConnect.addListener(function (port) {
	port.onMessage.addListener(function (msg) {
		if (port.name == 'popuplifeline') {
			if (msg.url && msg.tid) {
				popup = [msg.url, msg.tid];
			}
		}
	});
	port.onDisconnect.addListener(async function () {
		if (popup.length > 0) {
			if (await localStore.getItem('refresh') == 'true') chrome.tabs.update(popup[1], { url: popup[0] });
			popup = [];
		}
	});
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.reqtype == 'background-action') {
		return false;
	}
	(async () => {
		if (request.reqtype == 'get-settings') {
			var fpListStatus = [];
			var extractedDomain = extractDomainFromURL(sender.tab.url);
			for (var i in fpTypes) {
				fpListStatus[fpTypes[i]] = await enabledfp(extractedDomain, fpTypes[i]);
			}
			sendResponse({
				status: await localStore.getItem('enable'), enable: await enabled(sender.tab.url), fp_canvas: fpListStatus['fpCanvas'], fp_canvasfont: fpListStatus['fpCanvasFont'], fp_audio: fpListStatus['fpAudio'], fp_webgl: fpListStatus['fpWebGL'], fp_battery: fpListStatus['fpBattery'], fp_device: fpListStatus['fpDevice'], fp_gamepad: fpListStatus['fpGamepad'], fp_webvr: fpListStatus['fpWebVR'], fp_bluetooth: fpListStatus['fpBluetooth'], fp_clientrectangles: fpListStatus['fpClientRectangles'], fp_clipboard: fpListStatus['fpClipboard'], fp_browserplugins: fpListStatus['fpBrowserPlugins'], experimental: experimental, mode: await localStore.getItem('mode'), annoyancesmode: await localStore.getItem('annoyancesmode'), antisocial: await localStore.getItem('antisocial'), whitelist: whiteList, blacklist: blackList, whitelistSession: sessionWhiteList, blackListSession: sessionBlackList, script: await localStore.getItem('script'), noscript: await localStore.getItem('noscript'), object: await localStore.getItem('object'), applet: await localStore.getItem('applet'), embed: await localStore.getItem('embed'), iframe: await localStore.getItem('iframe'), frame: await localStore.getItem('frame'), audio: await localStore.getItem('audio'), video: await localStore.getItem('video'), image: await localStore.getItem('image'), annoyances: await localStore.getItem('annoyances'), preservesamedomain: await localStore.getItem('preservesamedomain'), canvas: await localStore.getItem('canvas'), canvasfont: await localStore.getItem('canvasfont'), audioblock: await localStore.getItem('audioblock'), webgl: await localStore.getItem('webgl'), battery: await localStore.getItem('battery'), webrtcdevice: await localStore.getItem('webrtcdevice'), gamepad: await localStore.getItem('gamepad'), webvr: await localStore.getItem('webvr'), bluetooth: await localStore.getItem('bluetooth'), clientrects: await localStore.getItem('clientrects'), timezone: await localStore.getItem('timezone'), browserplugins: await localStore.getItem('browserplugins'), keyboard: await localStore.getItem('keyboard'), keydelta: await localStore.getItem('keydelta'), webbugs: await localStore.getItem('webbugs'), referrer: await localStore.getItem('referrer'), referrerspoofdenywhitelisted: await localStore.getItem('referrerspoofdenywhitelisted'), linktarget: await localStore.getItem('linktarget'), paranoia: await localStore.getItem('paranoia'), clipboard: await localStore.getItem('clipboard'), dataurl: await localStore.getItem('dataurl'), useragent: userAgent, uaspoofallow: await localStore.getItem('uaspoofallow')
			});
			if (typeof ITEMS[sender.tab.id] === 'undefined') {
				resetTabData(sender.tab.id, sender.tab.url);
			} else {
				if ((request.iframe != '1' && ((ITEMS[sender.tab.id]['url'] != sender.tab.url && (sender.tab.url.indexOf("#") != -1 || ITEMS[sender.tab.id]['url'].indexOf("#") != -1) && removeHash(sender.tab.url) != removeHash(ITEMS[sender.tab.id]['url'])) || (sender.tab.url.indexOf("#") == -1 && ITEMS[sender.tab.id]['url'].indexOf("#") == -1 && sender.tab.url != ITEMS[sender.tab.id]['url']) || changed) || sender.tab.url.indexOf('https://chrome.google.com/webstore') != -1)) {
					if (changed && ITEMS[sender.tab.id]['url'] == sender.tab.url) {
						initCount(sender.tab.id);
					} else {
						resetTabData(sender.tab.id, sender.tab.url);
					}
				}
			}
			var fptype;
			var cleanedUrl = removeParams(sender.tab.url);
			for (var i in fpListStatus) {
				if (fpListStatus[i] != '-1') {
					if (i == 'fpCanvas') fptype = 'Canvas Fingerprint';
					else if (i == 'fpCanvasFont') fptype = 'Canvas Font Access';
					else if (i == 'fpAudio') fptype = 'Audio Fingerprint';
					else if (i == 'fpWebGL') fptype = 'WebGL Fingerprint';
					else if (i == 'fpBattery') fptype = 'Battery Fingerprint';
					else if (i == 'fpDevice') fptype = 'Device Enumeration';
					else if (i == 'fpGamepad') fptype = 'Gamepad Enumeration';
					else if (i == 'fpWebVR') fptype = 'WebVR Enumeration';
					else if (i == 'fpBluetooth') fptype = 'Bluetooth Enumeration';
					else if (i == 'fpClientRectangles') fptype = 'Client Rectangles';
					else if (i == 'fpClipboard') fptype = 'Clipboard Interference';
					else if (i == 'fpBrowserPlugins') fptype = 'Browser Plugins Enumeration';
					if (extractedDomain.substr(0, 4) == 'www.') extractedDomain = extractedDomain.substr(4);
					ITEMS[sender.tab.id]['allowed'].push([cleanedUrl, fptype, extractedDomain, fpListStatus[i], false, true]);
					recentlog['allowed'].push([new Date().getTime(), sender.tab.url, fptype, extractedDomain, sender.tab.url, fpListStatus[i], false, true]);
					updateRecents('allowed');
				}
			}
		} else if (request.reqtype == 'get-list') {
			if (typeof ITEMS[request.tid] === 'undefined') {
				sendResponse('reload');
				return;
			}
			var enableval = await domainCheck(request.url);
			var trustType = trustCheck(extractDomainFromURL(request.url));
			if (trustType == '1') enableval = 3;
			else if (trustType == '2') enableval = 4;
			var sessionfplist = false;
			for (var i in fpListsSession) {
				if (fpListsSession[i].length != 0) {
					sessionfplist = true;
					break;
				}
			}
			sendResponse({ status: await localStore.getItem('enable'), enable: enableval, mode: await localStore.getItem('mode'), annoyancesmode: await localStore.getItem('annoyancesmode'), antisocial: await localStore.getItem('antisocial'), annoyances: await localStore.getItem('annoyances'), closepage: await localStore.getItem('classicoptions'), rating: await localStore.getItem('rating'), temp: await getSessionList(), tempfp: sessionfplist, blockeditems: ITEMS[request.tid]['blocked'], alloweditems: ITEMS[request.tid]['allowed'], domainsort: await localStore.getItem('domainsort') });
			changed = true;
		} else if (request.reqtype == 'update-blocked') {
			if (request.src) {
				var cleanedUrl = removeParams(request.src);
				if (typeof ITEMS[sender.tab.id]['blocked'] === 'undefined') ITEMS[sender.tab.id]['blocked'] = [];
				if (!UrlInList(cleanedUrl, ITEMS[sender.tab.id]['blocked']) || request.node == 'NOSCRIPT' || request.node == 'Canvas Fingerprint' || request.node == 'Canvas Font Access' || request.node == 'Audio Fingerprint' || request.node == 'WebGL Fingerprint' || request.node == 'Battery Fingerprint' || request.node == 'Device Enumeration' || request.node == 'Gamepad Enumeration' || request.node == 'WebVR Enumeration' || request.node == 'Bluetooth Enumeration' || request.node == 'Spoofed Timezone' || request.node == 'Client Rectangles' || request.node == 'Clipboard Interference' || request.node == 'Data URL' || request.node == 'Browser Plugins Enumeration') {
					var extractedDomain = extractDomainFromURL(request.src);
					if (extractedDomain.substr(0, 4) == 'www.') extractedDomain = extractedDomain.substr(4);
					var extractedTabDomain = extractDomainFromURL(ITEMS[sender.tab.id]['url']);
					if (request.node == 'NOSCRIPT') {
						ITEMS[sender.tab.id]['blocked'].push([request.src, request.node, request.src, '-1', '-1', false, false]);
						recentlog['blocked'].push([new Date().getTime(), request.src, request.node, request.src, ITEMS[sender.tab.id]['url'], '-1', '-1', false, false]);
						updateRecents('blocked');
					} else if (request.node == 'Canvas Fingerprint' || request.node == 'Canvas Font Access' || request.node == 'Audio Fingerprint' || request.node == 'WebGL Fingerprint' || request.node == 'Battery Fingerprint' || request.node == 'Device Enumeration' || request.node == 'Gamepad Enumeration' || request.node == 'WebVR Enumeration' || request.node == 'Bluetooth Enumeration' || request.node == 'Spoofed Timezone' || request.node == 'Client Rectangles' || request.node == 'Clipboard Interference' || request.node == 'Data URL' || request.node == 'Browser Plugins Enumeration') {
						ITEMS[sender.tab.id]['blocked'].push([request.src, request.node, extractedDomain, '-1', '-1', false, true]);
						recentlog['blocked'].push([new Date().getTime(), request.src, request.node, extractedDomain, ITEMS[sender.tab.id]['url'], '-1', '-1', false, true]);
						updateRecents('blocked');
					} else {
						var blockedDomainCheck = await domainCheck(request.src, 1);
						var blockedTabDomainCheck = await domainCheck(extractedTabDomain, 1);
						var blockedDomainBaddieCheck = baddies(request.src, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'), 2);
						ITEMS[sender.tab.id]['blocked'].push([cleanedUrl, request.node, extractedDomain, blockedDomainCheck, blockedTabDomainCheck, blockedDomainBaddieCheck, false]);
						recentlog['blocked'].push([new Date().getTime(), request.src, request.node, extractedDomain, ITEMS[sender.tab.id]['url'], blockedDomainCheck, blockedTabDomainCheck, blockedDomainBaddieCheck, false]);
						updateRecents('blocked');
					}
					updateCount(sender.tab.id);
				}
			}
		} else if (request.reqtype == 'update-allowed') {
			if (request.src) {
				if (typeof ITEMS[sender.tab.id]['allowed'] === 'undefined') ITEMS[sender.tab.id]['allowed'] = [];
				var cleanedUrl = removeParams(request.src);
				if (!UrlInList(cleanedUrl, ITEMS[sender.tab.id]['allowed'])) {
					var extractedDomain = extractDomainFromURL(request.src);
					if (extractedDomain.substr(0, 4) == 'www.') extractedDomain = extractedDomain.substr(4);
					var allowedDomainCheck = await domainCheck(request.src, 1);
					var allowedBaddieCheck = baddies(request.src, await localStore.getItem('annoyancesmode'), await localStore.getItem('antisocial'), 2)
					ITEMS[sender.tab.id]['allowed'].push([cleanedUrl, request.node, extractedDomain, await domainCheck(request.src, 1), allowedBaddieCheck]);
					recentlog['allowed'].push([new Date().getTime(), request.src, request.node, extractedDomain, request.src, await domainCheck(request.src, 1), allowedBaddieCheck]);
					updateRecents('allowed');
				}
			}
		} else if (request.reqtype == 'save') {
			await domainHandler(request.url, request.list);
			changed = true;
		} else if (request.reqtype == 'temp') {
			await tempHandler(request);
		} else if (request.reqtype == 'remove-temp') {
			await removeTempHandler(request);
		} else if (request.reqtype == 'save-fp') {
			await fpDomainHandler(request.url, request.list, 1);
			changed = true;
		} else if (request.reqtype == 'temp-fp') {
			await fpDomainHandler(request.url, request.list, 1, 1);
			changed = true;
		} else if (request.reqtype == 'remove-temp-fp') {
			await fpDomainHandler(request.url, request.list, -1, 1);
			changed = true;
		} else if (request.reqtype == 'refresh-page-icon') {
			if (request.type == '0') chrome.action.setIcon({ path: "../img/IconAllowed.png", tabId: request.tid });
			else if (request.type == '1') chrome.action.setIcon({ path: "../img/IconForbidden.png", tabId: request.tid });
			else if (request.type == '2') chrome.action.setIcon({ path: "../img/IconTemp.png", tabId: request.tid });
		} else
			sendResponse({});
	})();

	return true; //async
});
chrome.runtime.onUpdateAvailable.addListener(function (details) {
	// do nothing, wait for user to reload browser before updating.
});
chrome.commands.onCommand.addListener(function (command) {
	if (command === "temppage") {
		tempPage();
	} else if (command === "removetemppage") {
		removeTempPage();
	} else if (command === "removetempall") {
		removeTempAll();
	}
});
export function reinitContext() {
	chrome.contextMenus.removeAll(async function () {
		if (await localStore.getItem('showcontext') == 'true') await genContextMenu();
	});
}
async function genContextMenu() {
	await chrome.contextMenus.removeAll();
	chrome.contextMenus.onClicked.addListener(async (info) => {
		switch (info.menuItemId) {
			case "allow":
			case "allowtemp":
			case "block":
			case "blocktemp":
			case "clear":
			case "distrust":
			case "trust":
				contextHandle(info.menuItemId);
				break;
			case "allowallblocked":
			case "blockallallowed":
				tempPage();
				break;
			case "revoketemp":
				removeTempPage();
				break;
			case "revoketempall":
				removeTempAll();
				break;
			case "options":
				chrome.tabs.create({ url: chrome.runtime.getURL('html/options.html') });
				break;
			case "enable":
				await localStore.setItem("enable", "true");
				contextHandle('toggle');
				break;
			case "disable":
				await localStore.setItem("enable", "false");
				contextHandle('toggle');
				break;
			default:
				console.error("Unknown context menu item: " + info.menuItemId);
				break;
		}
	});

	var parent = chrome.contextMenus.create({ id: "ScriptSafe", title: "ScriptSafe", contexts: ["page"] });
	if (await localStore.getItem('mode') == 'block') {
		chrome.contextMenus.create({ id: "allow", title: getLocale("allow"), parentId: parent });
		chrome.contextMenus.create({ id: "allowtemp", title: getLocale("allow") + ' (' + getLocale("temp") + ')', parentId: parent });
		chrome.contextMenus.create({ id: "allowallblocked", title: getLocale("allowallblocked"), parentId: parent });
		chrome.contextMenus.create({ id: "trust", title: getLocale("trust"), parentId: parent });
	} else {
		chrome.contextMenus.create({ id: "block", title: getLocale("deny"), parentId: parent });
		chrome.contextMenus.create({ id: "blocktemp", title: getLocale("deny") + ' (' + getLocale("temp") + ')', parentId: parent });
		chrome.contextMenus.create({ id: "blockallallowed", title: getLocale("blockallallowed"), parentId: parent });
		chrome.contextMenus.create({ id: "distrust", title: getLocale("distrust"), parentId: parent });
	}
	chrome.contextMenus.create({ id: "separator1", parentId: "ScriptSafe", type: "separator" });
	chrome.contextMenus.create({ id: "clear", title: getLocale("clear"), parentId: parent });
	chrome.contextMenus.create({ id: "revoketemp", "title": getLocale("revoketemp"), "parentId": parent });
	chrome.contextMenus.create({ id: "revoketempall", "title": getLocale("revoketempall"), "parentId": parent });
	chrome.contextMenus.create({ id: "separator2", parentId: parent, type: "separator" });
	chrome.contextMenus.create({ id: "options", title: getLocale("options"), parentId: parent });
	if (await localStore.getItem("enable") == "false") chrome.contextMenus.create({ id: "enable", title: getLocale("enabless"), parentId: parent });
	else chrome.contextMenus.create({ id: "disable", title: getLocale("disable"), parentId: parent });
}
function contextHandle(mode) {
	chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
		if (tabs[0].url.indexOf('http') == 0) {
			var tabdomain = extractDomainFromURL(tabs[0].url);
			var domainCheckStatus = await domainCheck(tabs[0].url);
			if (mode == 'allow') {
				await domainHandler(tabdomain, 2, 1);
				await domainHandler(tabdomain, 0);
			} else if (mode == 'block') {
				await domainHandler(tabdomain, 2, 1);
				await domainHandler(tabdomain, 1);
			} else if (mode == 'allowtemp' && domainCheckStatus == '-1') await tempHandler({ reqtype: "temp", url: tabdomain, mode: 'block' });
			else if (mode == 'blocktemp' && domainCheckStatus == '-1') await tempHandler({ reqtype: "temp", url: tabdomain, mode: 'allow' });
			else if (mode == 'trust') await topHandler(tabdomain, 0);
			else if (mode == 'distrust') await topHandler(tabdomain, 1);
			else if (mode == 'clear') {
				if (trustCheck(tabdomain)) await domainHandler('**.' + getDomain(tabdomain), 2);
				else {
					await domainHandler(tabdomain, 2, 1);
					await domainHandler(tabdomain, 2);
				}
			} else if (mode == 'toggle') reinitContext();
			if (await localStore.getItem('refresh') == 'true') chrome.tabs.reload(tabs[0].id);
		}
	});
}
function tempPage() {
	chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
		var tempMode = await localStore.getItem('mode');
		if (typeof ITEMS[tabs[0].id][tempMode + 'ed'] === 'undefined') return;
		var tempDomainList = [];
		if (await domainCheck(tabs[0].url, 2) == '-1') {
			if ((tempMode == 'block' && await enabled(tabs[0].url) == 'true') || (tempMode == 'allow' && await enabled(tabs[0].url) == 'false'))
				tempDomainList.push(extractDomainFromURL(tabs[0].url));
		}
		ITEMS[tabs[0].id][tempMode + 'ed'].map(function (items) {
			if (items[3] == '-1') tempDomainList.push(items[2]);
		});
		await tempHandler({ reqtype: "temp", url: tempDomainList, mode: tempMode });
		if (await localStore.getItem('refresh') == 'true') chrome.tabs.reload(tabs[0].id);
	});
}
function removeTempPage() {
	chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
		var tempMode;
		if (await localStore.getItem('mode') == 'block') tempMode = 'allow';
		else tempMode = 'block';
		if (typeof ITEMS[tabs[0].id][tempMode + 'ed'] === 'undefined') return;
		var tempDomainList = [];
		if (await domainCheck(tabs[0].url, 2) == '-1') {
			if ((tempMode == 'block' && await enabled(tabs[0].url) == 'true') || (tempMode == 'allow' && await enabled(tabs[0].url) == 'false'))
				tempDomainList.push(extractDomainFromURL(tabs[0].url));
		}
		ITEMS[tabs[0].id][tempMode + 'ed'].map(function (items) {
			tempDomainList.push(items[2]);
		});
		await removeTempHandler({ reqtype: "remove-temp", url: tempDomainList });
		if (await localStore.getItem('refresh') == 'true') chrome.tabs.reload(tabs[0].id);
	});
}
function removeTempAll() {
	chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
		await revokeTemp();
		if (await localStore.getItem('refresh') == 'true') chrome.tabs.reload(tabs[0].id);
	});
}
function ssCompress(str) {
	try {
		const encoder = new TextEncoder();
		const compressed = pako.deflate(encoder.encode(str));
		const binary = String.fromCharCode(...compressed);
		return btoa(binary);
	} catch (e) {
		console.error('ssCompress error:', e);
		return null;
	}
}
function ssDecompress(base64) {
	try {
		const binary = atob(base64);
		const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
		const decompressed = pako.inflate(bytes);
		const decoder = new TextDecoder();
		return decoder.decode(decompressed);
	} catch (e) {
		console.error('ssDecompress error:', e);
		return null;
	}
}
export async function freshSync(force) {
	if (storageapi && await localStore.getItem('syncenable') == 'true') {
		clearTimeout(synctimer);
		if (force) {
			await localStore.setItem('sync', 'true');
			var settingssync = {};
			var simplesettings = '';
			var newlimit = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 6 - 13;
			var fpsettings = '';
			var zarr = {};
			zarr['zw'] = [];
			zarr['zb'] = [];
			zarr['sw'] = [];
			zarr['sb'] = [];
			zarr['sf'] = [];
			zarr['su'] = [];
			var milliseconds = (new Date).getTime();
			var limit;
			var segment;
			var jsonstr;
			var i = 0;
			var allKeys = await localStore.getAllItems();
			for (var k in allKeys) {
				if (allKeys.hasOwnProperty(k)) {
					// legacy syncing method - start
					if (k != "version" && k != "sync" && k != "scriptsafe_settings" && k != "lastSync" && k != "whiteList" && k != "blackList" && k != "useragent" && k != "whiteListCount" && k != "blackListCount" && k != "whiteListCount2" && k != "blackListCount2" && k != "useragentCount2" && k.substr(0, 10) != "whiteList_" && k.substr(0, 10) != "blackList_" && k.substr(0, 2) != "zb" && k.substr(0, 2) != "zw" && k.substr(0, 2) != "sw" && k.substr(0, 2) != "sb" && k.substr(0, 2) != "sf" && k.substr(0, 2) != "su") {
						// legacy syncing method - end
						// new syncing method - start
						//if (k != "version" && k != "sync" && k != "scriptsafe_settings" && k != "lastSync" && k != "whiteList" && k != "blackList" && k != "useragent" && k != "whiteListCount" && k != "blackListCount" && k != "whiteListCount2" && k != "blackListCount2" && k != "useragentCount2" && k.substr(0, 10) != "whiteList_" && k.substr(0, 10) != "blackList_" && k.substr(0, 2) != "zb" && k.substr(0, 2) != "zw" && k.substr(0, 2) != "sw" && k.substr(0, 2) != "sb" && k.substr(0, 2) != "sf" && k.substr(0, 2) != "su" && k.substr(0, 2) != "fp") {
						// new syncing method - end
						simplesettings += k + "|" + await localStore.getItem(k) + "~";
						// new syncing method - start
						/*
						} else if (k.substr(0, 2) == "fp" && k != "fpCount") {
							fpsettings += k+"|"+await localStore.getItem(k)+"~";
						*/
						// new syncing method - end
					}
					if (k.substr(0, 2) == "zw") zarr['zw'].push(k);
					else if (k.substr(0, 2) == "zb") zarr['zb'].push(k);
					else if (k.substr(0, 2) == "sw") zarr['sw'].push(k);
					else if (k.substr(0, 2) == "sb") zarr['sb'].push(k);
					else if (k.substr(0, 2) == "sf") zarr['sf'].push(k);
					else if (k.substr(0, 2) == "su") zarr['su'].push(k);
				}
			}
			settingssync['scriptsafe_settings'] = simplesettings.slice(0, -1);
			if (zarr['zw'].length) {
				for (var x = 0, forcount = zarr['zw'].length; x < forcount; x++) await localStore.removeItem(zarr['zw'][x]);
			}
			if (zarr['sw'].length) {
				for (var x = 0, forcount = zarr['sw'].length; x < forcount; x++)      await localStore.removeItem(zarr['sw'][x]);
			}
			// legacy syncing method - start
			jsonstr = JSON.parse(await localStore.getItem('whiteList')).toString();
			i = 0;
			limit = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - Math.ceil(jsonstr.length / (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 4)) - 4);
			while (jsonstr.length > 0) {
				segment = jsonstr.substr(0, limit);
				settingssync["zw" + i] = segment;
				jsonstr = jsonstr.substr(limit);
				i++;
			}
			settingssync['whiteListCount'] = i;
			// legacy syncing method - end
			// new syncing method - start
			/*
			jsonstr = ssCompress(JSON.parse(await localStore.getItem('whiteList')).toString());
			i = 0;
			while (jsonstr.length > 0) {
				segment = jsonstr.substr(0, newlimit);
				settingssync["sw" + i] = milliseconds+segment;
				jsonstr = jsonstr.substr(newlimit);
				i++;
			}
			settingssync['whiteListCount2'] = i;
			if (zarr['zb'].length) {
				for (var x = 0, forcount=zarr['zb'].length; x < forcount; x++) await localStore.removeItem(zarr['zb'][x]);
			}
			if (zarr['sb'].length) {
				for (var x = 0, forcount=zarr['sb'].length; x < forcount; x++) await localStore.removeItem(zarr['sb'][x]);
			}
			*/
			// new syncing method - end
			// legacy syncing method - start
			i = 0;
			jsonstr = JSON.parse(await localStore.getItem('blackList')).toString();
			limit = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - Math.ceil(jsonstr.length / (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 4)) - 4);
			while (jsonstr.length > 0) {
				segment = jsonstr.substr(0, limit);
				settingssync["zb" + i] = segment;
				jsonstr = jsonstr.substr(limit);
				i++;
			}
			settingssync['blackListCount'] = i;
			// legacy syncing method - end
			// new syncing method - start
			/*
				jsonstr = ssCompress(JSON.parse(await localStore.getItem('blackList')).toString());
				i = 0;
				while (jsonstr.length > 0) {
					segment = jsonstr.substr(0, newlimit);
					settingssync["sb" + i] = milliseconds+segment;
					jsonstr = jsonstr.substr(newlimit);
					i++;
				}
				settingssync['blackListCount2'] = i;
				if (zarr['sf'].length) {
					for (var x = 0, forcount=zarr['sf'].length; x < forcount; x++) await localStore.removeItem(zarr['sf'][x]);
				}
				i = 0;
				jsonstr = ssCompress(fpsettings.slice(0,-1));
				while (jsonstr.length > 0) {
					segment = jsonstr.substr(0, newlimit);
					settingssync["sf" + i] = milliseconds+segment;
					jsonstr = jsonstr.substr(newlimit);
					i++;
				}
				settingssync['fpCount'] = i;
			*/
			// new syncing method - end
			jsonstr = ssCompress(JSON.parse(await localStore.getItem('useragent')).toString());
			if (zarr['su'].length) {
				for (var x = 0, forcount = zarr['su'].length; x < forcount; x++) await localStore.removeItem(zarr['su'][x]);
			}
			i = 0;
			while (jsonstr.length > 0) {
				segment = jsonstr.substr(0, newlimit);
				settingssync["su" + i] = milliseconds + segment;
				jsonstr = jsonstr.substr(newlimit);
				i++;
			}
			settingssync['useragentCount2'] = i;
			settingssync['lastSync'] = milliseconds;
			await localStore.setItem('lastSync', milliseconds);
			if (chrome.storage.sync.QUOTA_BYTES < JSON.stringify(settingssync).length) {
				await alertExt('ScriptSafe cannot sync your settings as it is greater than the total limit.\r\nHowever, you can manually export and import your settings by going to the Options page.');
			} else {
				chrome.storage.sync.clear(function () {
					chrome.storage.sync.set(settingssync, async function () {
						if (chrome.extension.lastError) {
							await alertExt(chrome.extension.lastError.message);
						} else {
							if (await localStore.getItem('syncnotify') == 'true') chrome.notifications.create('syncnotify', { 'type': 'basic', 'iconUrl': '../img/icon48.png', 'title': 'ScriptSafe - ' + getLocale("exportsuccesstitle"), 'message': getLocale("exportsuccess") }, function (callback) { return true; });
						}
					});
				});
			}
		} else {
			synctimer = setTimeout(async function () { await syncQueue() }, 10000);
		}
		return true;
	} else {
		return false;
	}
}
async function syncQueue() {
	await freshSync(true);
}
export async function importSyncHandle(mode) {
	if (storageapi) {
		if (mode == '1' || await localStore.getItem('syncenable') == 'true' || await localStore.getItem('sync') == 'false') {
			clearTimeout(synctimer);
			chrome.storage.sync.get(null, async function (changes) {
				if (typeof changes['lastSync'] !== 'undefined') {
					if ((mode == '0' && changes['lastSync'] > await localStore.getItem('lastSync')) || (mode == '1' && changes['lastSync'] >= await localStore.getItem('lastSync'))) {
						if (await confirmExt(getLocale("syncdetect"))) {
							await localStore.setItem('syncenable', 'true');
							await localStore.setItem('sync', 'true');
							await importSync(changes);
							if (mode == '1') setTimeout(function () { clearTimeout(synctimer); }, 5000);
							if (await localStore.getItem('syncfromnotify') == 'true') chrome.notifications.create('syncnotify', { 'type': 'basic', 'iconUrl': '../img/icon48.png', 'title': 'ScriptSafe - ' + getLocale("importsuccesstitle"), 'message': getLocale("importsuccess") }, function (callback) { updated = true; return true; });
							return true;
						} else {
							if (mode != '1') {
								await localStore.setItem('syncenable', 'false');
								await alertExt(getLocale("syncdisabled"));
								await localStore.setItem('sync', 'true');
							}
							return false;
						}
					}
				}
				if (mode == '1' || (await localStore.getItem('sync') == 'false' && mode == '0')) {
					await localStore.setItem('syncenable', 'false');
					await localStore.setItem('sync', 'true');
					return false;
				}
			});
		}
	} else {
		await alertExt(getLocale("syncnotsupported"));
		await localStore.setItem('sync', 'true');
		return false;
	}
}
async function importSync(changes) {
	for (var key in changes) {
		if (key != 'scriptsafe_settings') {
			await localStore.setItem(key, changes[key]);
		} else if (key == 'scriptsafe_settings') {
			var settings = changes[key].split("~");
			if (settings.length > 0) {
				for (const v of settings) {
					if (v.trim() !== "") {
						const settingentry = v.trim().split("|");
						if (settingentry[1].trim() !== "") {
							await localStore.setItem(settingentry[0].trim(), settingentry[1].trim());
						}
					}
				}
			}
		}
	}
	await initLang(await localStore.getItem('locale'), 0);
	await listsSync();
}
async function listsSync() {
	await listsSyncParse('whiteList');
	await listsSyncParse('blackList');
	await listsSyncParse('useragent');
	if (await optionExists('fpCount')) {
		var concatlist = '';
		var listerror = false;
		for (var i = 0, forcount = await localStore.getItem('fpCount'); i < forcount; i++) {
			if (await localStore.getItem('sf' + i)) {
				if ((await localStore.getItem('sf' + i)).substr(0, 13) == await localStore.getItem('lastSync')) concatlist += (await localStore.getItem('sf' + i)).substr(13);
				else listerror = true;
				await localStore.removeItem('sf' + i);
			}
		}
		if (!listerror) {
			if (concatlist != '') {
				concatlist = ssDecompress(concatlist);
				var settings = concatlist.split("~");
				if (settings.length > 0) {
					for (const v of settings) {
						if (v.trim() !== "") {
							const settingentry = v.trim().split("|");
							if (settingentry[1].trim() !== "") {
								await localStore.setItem(settingentry[0].trim(), settingentry[1].trim());
							}
						}
					}
				}
			}
		} else {
			await alertExt('Incomplete fingerprint whitelist data was detected. Very large lists are known to cause issues with syncing.\r\nAs a safety precaution, your fingerprint whitelist has not been updated and syncing has been disabled on this device to prevent overwriting data on other devices.\r\nPlease consider manually exporting your latest settings and importing it into your other devices from the Options page.');
			await localStore.setItem('syncenable', 'false');
		}
		await localStore.removeItem('fpCount');
	}
	await cacheLists();
	await cacheFpLists();
}
async function listsSyncParse(type) {
	if (await optionExists(type + 'Count') || await optionExists(type + 'Count2')) {
		var lsName = type.substr(0, 1);
		var concatlist = '';
		var concatlistarr = [];
		var counttype;
		var listerror = false;
		if (await optionExists(type + 'Count2')) counttype = type + 'Count2';
		else counttype = type + 'Count';
		concatlist = '';
		if (await localStore.getItem(counttype) != '0') {
			for (var i = 0, forcount = await localStore.getItem(counttype); i < forcount; i++) {
				if (counttype == type + 'Count2') {
					if (await localStore.getItem('s' + lsName + i)) {
						if ((await localStore.getItem('s' + lsName + i)).substr(0, 13) == await localStore.getItem('lastSync')) concatlist += (await localStore.getItem('s' + lsName + i)).substr(13);
						else {
							listerror = true;
						}
						await localStore.removeItem('s' + lsName + i);
					} else {
						listerror = true;
					}
				} else if (counttype == type + 'Count') {
					if (await localStore.getItem('z' + lsName + i)) {
						concatlist += await localStore.getItem('z' + lsName + i);
						await localStore.removeItem('z' + lsName + i);
					} else {
						listerror = true;
					}
				}
			}
			if (!listerror) {
				if (counttype == type + 'Count2') concatlist = ssDecompress(concatlist);
				concatlistarr = concatlist.split(",");
			}
		}
		if (!listerror) {
			if (concatlist == '' || concatlistarr.length == 0) await localStore.setItem(type + '', JSON.stringify([]));
			else await localStore.setItem(type + '', JSON.stringify(concatlistarr));
		} else {
			await alertExt('Incomplete ' + type.toLowerCase() + ' data was detected. Very large lists are known to cause issues with syncing.\r\nAs a safety precaution, your ' + type.toLowerCase() + ' has not been updated and syncing has been disabled on this device to prevent overwriting data on other devices.\r\nPlease consider manually exporting your latest settings and importing it into your other devices from the Options page.');
			await localStore.setItem('syncenable', 'false');
		}
		if (await optionExists(type + 'Count2')) await localStore.removeItem(type + 'Count2');
		if (await optionExists(type + 'Count')) await localStore.removeItem(type + 'Count');
	}
}
export function getUpdated() {
	return updated;
}
export function setUpdated() {
	updated = false;
}
export async function triggerUpdated() {
	updated = true;
	await freshSync();
}
async function init() {
	webrtcsupport = checkWebRTCHandlingPolicy();
	await initWebRTC();
	await cacheLists();
	await cacheFpLists();
	if (await localStore.getItem('showcontext') == 'true') await genContextMenu();
}
export async function cacheLists() {
	var tempList = JSON.parse(await localStore.getItem('whiteList'));
	var tempDomain = [];
	var tempWildDomain = [];
	tempList.map(function (domain) {
		if (domain.substr(0, 3) == '**.') tempWildDomain.push(domain);
		tempDomain.push(domain);
	});
	tempDomain = tempDomain.sort();
	whiteList = tempDomain;
	tempWildDomain = tempWildDomain.sort();
	trustList = tempWildDomain;
	tempList = JSON.parse(await localStore.getItem('blackList'));
	tempDomain = [];
	tempWildDomain = [];
	tempList.map(function (domain) {
		if (domain.substr(0, 3) == '**.') tempWildDomain.push(domain);
		tempDomain.push(domain);
	});
	tempDomain = tempDomain.sort();
	blackList = tempDomain;
	tempWildDomain = tempWildDomain.sort();
	distrustList = tempWildDomain;
}
export async function cacheFpLists() {
	for (var i in fpTypes) {
		var tempList = JSON.parse(await localStore.getItem(fpTypes[i]));
		var tempDomain = [];
		tempList.map(function (domain) {
			tempDomain.push(domain);
		});
		tempDomain = tempDomain.sort();
		fpLists[fpTypes[i]] = tempDomain;
	}
}
export async function initLang(lang, mode) {
	var url = chrome.runtime.getURL('_locales/' + lang + '/messages.json');
	try {
		const responce = await fetch(url);
		if (!responce.ok) throw new Error('Failed to load locale');
		const data = await responce.json();
		locale = data;

	} catch (error) {
		console.error('Error loading locale:', error);
		locale = false;
	}

	if (mode == '1') {
		await postLangLoad();
	} else {
		reinitContext();
	}
}
export function getLocale(str) {
	if (locale) {
		if (typeof locale[str] === 'undefined') return chrome.i18n.getMessage(str);
		return locale[str].message;
	} else {
		return chrome.i18n.getMessage(str);
	}
}
export function getLangs() {
	return langs;
}
async function initLanguage() {
	var uiLang = chrome.i18n.getUILanguage().replace(/-/g, '_');
	if (!await optionExists("locale")) {
		await localStore.setItem('locale', 'en_US');
		if (uiLang != 'en' && uiLang != 'en_GB' && uiLang != 'en_US') {
			if (typeof langs[uiLang] !== 'undefined') {
				if (await confirmExt('ScriptSafe detected that your browser is currently set to ' + langs[uiLang] + '.\r\nWould you like to use ScriptSafe in ' + langs[uiLang] + '?\r\nIf you click on "Cancel", English (US) will be set.')) {
					await localStore.setItem('locale', uiLang);
				}
			}
		}
	} else {
		if (typeof langs[uiLang] === 'undefined') {
			await localStore.setItem('locale', 'en_US');
		}
	}
	await initLang(await localStore.getItem('locale'), 1);
}
(async () => await initLanguage())();
async function postLangLoad() {
	if (!await optionExists("version") || await localStore.getItem("version") != version) {
		// One-time update existing whitelist/blacklist for new regex support introduced in v1.0.7.0
		if (!await optionExists("tempregexflag")) {
			if (await optionExists("version")) {
				var tempList = JSON.parse(await localStore.getItem('blackList'));
				var tempNewList = [];
				if (tempList.length) {
					tempList.map(function (domain) {
						if (domain.substr(0, 2) == '*.') tempNewList.push('*' + domain);
						else tempNewList.push(domain);
					});
					await localStore.setItem('blackList', JSON.stringify(tempNewList));
				}
				tempList = JSON.parse(await localStore.getItem('whiteList'));
				if (tempList.length) {
					tempNewList = [];
					tempList.map(function (domain) {
						if (domain.substr(0, 2) == '*.') tempNewList.push('*' + domain);
						else tempNewList.push(domain);
					});
					await localStore.setItem('whiteList', JSON.stringify(tempNewList));
				}
			}
			await localStore.setItem('tempregexflag', "true");
			await syncQueue();
		}
		if (await localStore.getItem("updatenotify") == "true") {
			chrome.tabs.create({ url: chrome.runtime.getURL('html/updated.html') });
		}
		await localStore.setItem("version", version);
	}
	await setDefaultOptions();
	if (typeof chrome.storage !== 'undefined') {
		storageapi = true;
	}
	if (typeof chrome.webRequest !== 'undefined') {
		if (experimental == 0) experimental = 1;
		var requestUrls = ["http://*/*", "https://*/*"];
		await refreshRequestTypes();
		if (typeof chrome.webRequest !== 'undefined') {
			chrome.webRequest.onBeforeRequest.addListener(ScriptSafe, { "types": requestTypes, "urls": requestUrls }, ['blocking']);
			chrome.webRequest.onBeforeSendHeaders.addListener(mitigate, { "types": requestTypes, "urls": requestUrls }, ['requestHeaders', 'blocking']);
			chrome.webRequest.onHeadersReceived.addListener(inlineblock, { "types": requestTypes, "urls": requestUrls }, ['responseHeaders', 'blocking']);
		}
	}
	if (storageapi) {
		chrome.storage.onChanged.addListener(async function (changes, namespace) {
			if (namespace == 'sync' && await localStore.getItem('syncenable') == 'true') {
				if (typeof changes['lastSync'] !== 'undefined') {
					if (changes['lastSync'].newValue && changes['lastSync'].newValue > await localStore.getItem('lastSync')) {
						chrome.storage.sync.get(null, async function (changes) {
							await importSync(changes);
							if (await localStore.getItem('syncfromnotify') == 'true') chrome.notifications.create('syncnotify', { 'type': 'basic', 'iconUrl': '../img/icon48.png', 'title': 'ScriptSafe - ' + getLocale("importsuccesstitle"), 'message': getLocale("importsuccess") }, function (callback) { updated = true; return true; });
						});
					}
				}
			}
		});
		await importSyncHandle(0);
	}
	await init();
}