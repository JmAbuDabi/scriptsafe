// ScriptSafe - Copyright (C) andryou
// Distributed under the terms of the GNU General Public License
// The GNU General Public License can be found in the gpl.txt file. Alternatively, see <http://www.gnu.org/licenses/>.
import {version, getBackgroundPage} from './common.js';

const bkg = getBackgroundPage();
var settingnames = [];
var syncstatus;
document.addEventListener('DOMContentLoaded', async function () {
	initTabs();
	await i18load();
	await loadOptions();
	var langs = await bkg.getLangs();
	$.each(langs, function (i, v) {
		$("#locale").append('<option value="' + i + '">' + v + '</option>');
	});
	$("#locale").val(localStorage['locale']).change(saveLang);
	$(".save").click(saveOptions);
	$("#keydelta").blur(function () {
		if ($(this).val() < 0 || isNaN(parseInt($(this).val()))) {
			$(this).val(40); saveElement("keydelta");
		}
	});
	$("#domainsort").click(domainsort);
	$("#whitebind").click(whitelistlisten);
	$(".fpAdd").click(addFPList);
	$("#blackbind").click(blacklistlisten);
	$("#whiteclear").click(whiteclear);
	$("#blackclear").click(blackclear);
	$("#importwhite").click(importwhite);
	$("#importblack").click(importblack);
	$("#domaininfo").click(function () {
		$("#domaininfocontainer").slideToggle('slow');
	});
	$("#hideimport").click(hidebulk);
	$("#importsettings").click(settingsImport);
	$("#settingsall").click(settingsall);
	$("#syncenable").change(async function () {
		if ($(this).prop('checked') && confirm(await bkg.getLocale("forcesyncimport"))) {
			await bkg.importSyncHandle(1);
		}
	});
	$(".savechange").change(saveOptions);
	$(".closepage").click(closeOptions);
	$("#syncimport").click(forceSyncImport);
	$("#syncexport").click(forceSyncExport);
	$("#savetxt").click(downloadtxt);
	$("#viewtoggle").click(async function () {
		await viewToggle(1);
	});
	$("#hotkeyspage").click(function () {
		chrome.tabs.create({ url: 'chrome://extensions/?id=footer-section' });
	});
	$("#restoredefault").click(async function () {
		if (confirm(await bkg.getLocale("restoredefaultconfirm"))) {
			await bkg.setDefaultOptions(1);
			notification(await bkg.getLocale("settingssave"));
		}
	});
	$("#restoredefault2").click(async function () {
		if (confirm(await bkg.getLocale("restoredefaultconfirm2"))) {
			await bkg.setDefaultOptions(2);
			notification(await bkg.getLocale("settingssave"));
		}
	});
	$("#useragent").keyup(function () {
		if ($(this).val().indexOf("\n") != -1) $(".useragentrandom").show();
		else $(".useragentrandom").hide();
	});
	syncstatus = localStorage['syncenable'];
	$(".row-offcanvas").show();
	if (localStorage['optionslist'] == 'true') await viewToggle(0);
	$('#sidebar').stickyScroll({ container: '#sectionname' });
	await bkg.setUpdated();
	setInterval(async function () {
		if (await bkg.getUpdated()) {
			await bkg.setUpdated();
			window.location.reload(1);
		}
	}, 5000);
});
async function i18load() {
	$(".i18_support").html(await bkg.getLocale("support"));
	$("#restoredefault").val(await bkg.getLocale("restoredefault"));
	$("#restoredefault2").val(await bkg.getLocale("restoredefault2"));
	$(".i18_listallsettings").html(await bkg.getLocale("listallsettings"));
	$(".i18_groupallsettings").html(await bkg.getLocale("groupallsettings"));
	$(".i18_sections").html(await bkg.getLocale("sections"));
	$(".i18_save").val(await bkg.getLocale("save"));
	$(".i18_close").val(await bkg.getLocale("close"));
	$(".i18_enable").html(await bkg.getLocale("enable"));
	$(".i18_mode").html(await bkg.getLocale("mode"));
	$(".i18_default").html(await bkg.getLocale("default"));
	$(".i18_enabled").html(await bkg.getLocale("enabled"));
	$(".i18_disabled").html(await bkg.getLocale("disabled"));
	$(".i18_enablesyncing").html(await bkg.getLocale("enablesyncing"));
	$("#syncimport").val(await bkg.getLocale("syncimport"));
	$("#syncexport").val(await bkg.getLocale("syncexport"));
	$(".i18_blockrec").html(await bkg.getLocale("blockrec"));
	$(".i18_block").html(await bkg.getLocale("block"));
	$(".i18_allow").html(await bkg.getLocale("allow"));
	$(".i18_disableremove").html(await bkg.getLocale("disableremove"));
	$(".i18_xml").html(await bkg.getLocale("xml"));
	$(".i18_disabledcap").html(await bkg.getLocale("disabledcap"));
	$(".i18_xmlcross").html(await bkg.getLocale("xmlcross"));
	$(".i18_xmlall").html(await bkg.getLocale("xmlall"));
	$(".i18_xmldesc").html(await bkg.getLocale("xmldesc"));
	$(".i18_syncnotify").html(await bkg.getLocale("syncnotify"));
	$(".i18_syncnotifydesc").html(await bkg.getLocale("syncnotifydesc"));
	$(".i18_syncfromnotify").html(await bkg.getLocale("syncfromnotify"));
	$(".i18_syncfromnotifydesc").html(await bkg.getLocale("syncfromnotifydesc"));
	$(".i18_updatenotify").html(await bkg.getLocale("updatenotify"));
	$(".i18_updatenotifydesc").html(await bkg.getLocale("updatenotifydesc"));
	$(".i18_hotkeys").html(await bkg.getLocale("hotkeys"));
	$(".i18_availablehotkeys").html(await bkg.getLocale("availablehotkeys"));
	$(".i18_hotkeystoggle").html(await bkg.getLocale("hotkeystoggle"));
	$(".i18_hotkeysremove").html(await bkg.getLocale("hotkeysremove"));
	$(".i18_hotkeysremoveall").html(await bkg.getLocale("hotkeysremoveall"));
	$("#hotkeyspage").html(await bkg.getLocale("hotkeyspage"));
	$(".i18_showcontext").html(await bkg.getLocale("showcontext"));
	$(".i18_hotkeysinst").html(await bkg.getLocale("hotkeysinst"));
	$(".i18_canvas").html(await bkg.getLocale("canvas"));
	$(".i18_canvasblank").html(await bkg.getLocale("canvasblank"));
	$(".i18_canvasrandom").html(await bkg.getLocale("canvasrandom"));
	$(".i18_canvasblock").html(await bkg.getLocale("canvasblock"));
	$(".i18_canvasdesc").html(await bkg.getLocale("canvasdesc"));
	$(".i18_audioblock").html(await bkg.getLocale("audioblock"));
	$(".i18_audioblockdesc").html(await bkg.getLocale("audioblockdesc"));
	$(".i18_webgl").html(await bkg.getLocale("webgl"));
	$(".i18_webgldesc").html(await bkg.getLocale("webgldesc"));
	$(".i18_battery").html(await bkg.getLocale("battery"));
	$(".i18_batterydesc").html(await bkg.getLocale("batterydesc"));
	$(".i18_webrtcdevice").html(await bkg.getLocale("webrtcdevice"));
	$(".i18_webrtcdevicedesc").html(await bkg.getLocale("webrtcdevicedesc"));
	$(".i18_gamepad").html(await bkg.getLocale("gamepad"));
	$(".i18_gamepaddesc").html(await bkg.getLocale("gamepaddesc"));
	$(".i18_webvr").html(await bkg.getLocale("webvr"));
	$(".i18_webvrdesc").html(await bkg.getLocale("webvrdesc"));
	$(".i18_bluetooth").html(await bkg.getLocale("bluetooth"));
	$(".i18_bluetoothdesc").html(await bkg.getLocale("bluetoothdesc"));
	$(".i18_canvasfont").html(await bkg.getLocale("canvasfont"));
	$(".i18_canvasfontdesc").html(await bkg.getLocale("canvasfontdesc"));
	$(".i18_clientrects").html(await bkg.getLocale("clientrects"));
	$(".i18_clientrectsdesc").html(await bkg.getLocale("clientrectsdesc"));
	$(".i18_keyboard").html(await bkg.getLocale("keyboard"));
	$(".i18_keyboarddesc").html(await bkg.getLocale("keyboarddesc"));
	$(".i18_browserplugins").html(await bkg.getLocale("browserplugins"));
	$(".i18_browserpluginsdesc").html(await bkg.getLocale("browserpluginsdesc"));
	$(".i18_paranoia").html(await bkg.getLocale("paranoia"));
	$(".i18_paranoiadesc").html(await bkg.getLocale("paranoiadesc"));
	$(".i18_annoyances").html(await bkg.getLocale("annoyances"));
	$(".i18_annoyancesdesc").html(await bkg.getLocale("annoyancesdesc"));
	$(".i18_cookies").html(await bkg.getLocale("cookies"));
	$(".i18_cookiesdesc").html(await bkg.getLocale("cookiesdesc"));
	$(".i18_annoyancesmode").html(await bkg.getLocale("annoyancesmode"));
	$(".i18_annoyancesmodedesc").html(await bkg.getLocale("annoyancesmodedesc"));
	$(".i18_antisocial").html(await bkg.getLocale("antisocial"));
	$(".i18_antisocialdesc").html(await bkg.getLocale("antisocialdesc"));
	$(".i18_antisocialdesc2").html(await bkg.getLocale("antisocialdesc2"));
	$(".i18_webbugs").html(await bkg.getLocale("webbugs"));
	$(".i18_webbugsdesc").html(await bkg.getLocale("webbugsdesc"));
	$(".i18_utm").html(await bkg.getLocale("utm"));
	$(".i18_utmdesc").html(await bkg.getLocale("utmdesc"));
	$(".i18_hashchecking").html(await bkg.getLocale("hashchecking"));
	$(".i18_hashcheckingdesc").html(await bkg.getLocale("hashcheckingdesc"));
	$(".i18_webrtc").html(await bkg.getLocale("webrtc"));
	$(".i18_webrtcdesc").html(await bkg.getLocale("webrtcdesc"));
	$(".i18_referrer").html(await bkg.getLocale("referrer"));
	$(".i18_referrerdesc").html(await bkg.getLocale("referrerdesc"));
	$(".i18_timezone").html(await bkg.getLocale("timezone"));
	$(".i18_timezonedesc").html(await bkg.getLocale("timezonedesc"));
	$(".i18_useragentspoof").html(await bkg.getLocale("useragentspoof"));
	$(".i18_useragentspoofdesc").html(await bkg.getLocale("useragentspoofdesc"));
	$(".i18_uaspoofallow").html(await bkg.getLocale("uaspoofallow"));
	$(".i18_request").html(await bkg.getLocale("request"));
	$(".i18_interval").html(await bkg.getLocale("interval"));
	$(".i18_minutes").html(await bkg.getLocale("minutes"));
	$(".i18_referrerspoof").html(await bkg.getLocale("referrerspoof"));
	$(".i18_referrerspoofdesc").html(await bkg.getLocale("referrerspoofdesc"));
	$("#userref").attr('placeholder', await bkg.getLocale("userref"));
	$(".i18_linktarget").html(await bkg.getLocale("linktarget"));
	$(".i18_linktargetdesc").html(await bkg.getLocale("linktargetdesc"));
	$(".i18_preservesamedomain").html(await bkg.getLocale("preservesamedomain"));
	$(".i18_preservesamedomaindesc").html(await bkg.getLocale("preservesamedomaindesc"));
	$(".i18_refresh").html(await bkg.getLocale("refresh"));
	$(".i18_refreshdesc").html(await bkg.getLocale("refreshdesc"));
	$(".i18_rating").html(await bkg.getLocale("rating"));
	$(".i18_ratingdesc").html(await bkg.getLocale("ratingdesc"));
	$(".i18_classicoptions").html(await bkg.getLocale("classicoptions"));
	$(".i18_classicoptionsdesc").html(await bkg.getLocale("classicoptionsdesc"));
	$(".i18_clipboard").html(await bkg.getLocale("clipboard"));
	$(".i18_clipboarddesc").html(await bkg.getLocale("clipboarddesc"));
	$(".i18_domainsort").html(await bkg.getLocale("domainsort"));
	$(".i18_domainsortdesc").html(await bkg.getLocale("domainsortdesc"));
	$(".i18_url").html(await bkg.getLocale("url"));
	$("#url").attr('placeholder', await bkg.getLocale("urldesc"));
	$("#whitebind").val(await bkg.getLocale("whitebind"));
	$("#blackbind").val(await bkg.getLocale("blackbind"));
	$("#domaininfo").val(await bkg.getLocale("domaininfo"));
	$(".i18_whitelist").html(await bkg.getLocale("whitelist"));
	$(".i18_blacklist").html(await bkg.getLocale("blacklist"));
	$("#blackclear, #whiteclear").html(await bkg.getLocale("clearlow"));
	$("#importwhite, #importblack").html(await bkg.getLocale("bulkimport"));
	$(".i18_bulkimportcap").html(await bkg.getLocale("bulkimportcap"));
	$(".i18_bulkimportcapdesc").html(await bkg.getLocale("bulkimportcapdesc"));
	$("#bulkbtn").html(await bkg.getLocale("bulkbtn"));
	$("#hideimport").val(await bkg.getLocale("hide"));
	$(".i18_import").html(await bkg.getLocale("import"));
	$("#importsettings").val(await bkg.getLocale("import"));
	$(".i18_export").html(await bkg.getLocale("export"));
	$("#settingsall").html(await bkg.getLocale("settingsall"));
	$("#settingsimport").attr('placeholder', await bkg.getLocale("settingsimport"));
	$("#savetxt").val(await bkg.getLocale("savetxt"));
	$(".i18_relaxed").html(await bkg.getLocale("relaxed"));
	$(".i18_strict").html(await bkg.getLocale("strict"));
	$(".i18_default_public_interface_only").html(await bkg.getLocale("default_public_interface_only"));
	$(".i18_disable_non_proxied_udp").html(await bkg.getLocale("disable_non_proxied_udp"));
	$(".i18_onlyunwhitelisted").html(await bkg.getLocale("onlyunwhitelisted"));
	$(".i18_alldomains").html(await bkg.getLocale("alldomains"));
	$(".i18_random").html(await bkg.getLocale("random"));
	$(".i18_off").html(await bkg.getLocale("off"));
	$(".i18_same").html(await bkg.getLocale("same"));
	$(".i18_domain").html(await bkg.getLocale("domain"));
	$(".i18_custom").html(await bkg.getLocale("custom"));
	$(".i18_sametab").html(await bkg.getLocale("sametab"));
	$(".i18_newtab").html(await bkg.getLocale("newtab"));
	$(".i18_strictsamedomain").html(await bkg.getLocale("strictsamedomain"));
	$(".i18_loosesamedomain").html(await bkg.getLocale("loosesamedomain"));
	$(".i18_whitelistmove").attr('title', await bkg.getLocale("whitelistmove"));
	$(".i18_blacklistmove").attr('title', await bkg.getLocale("blacklistmove"));
	$(".i18_domaintip").html(await bkg.getLocale("domaintip"));
	$(".topDomainAdd[data-mode='0']").html(await bkg.getLocale("trust"));
	$(".topDomainAdd[data-mode='1']").html(await bkg.getLocale("distrust"));
	$("#menu_generalsettings").attr('rel', await bkg.getLocale("generalsettings")).html(await bkg.getLocale("generalsettings"));
	$("#menu_fingerprint").attr('rel', await bkg.getLocale("fingerprintdesc")).html(await bkg.getLocale("fingerprint"));
	$("#menu_privacy").attr('rel', await bkg.getLocale("privacy")).html(await bkg.getLocale("privacy"));
	$("#menu_behavior").attr('rel', await bkg.getLocale("behavior")).html(await bkg.getLocale("behavior"));
	$("#menu_whitelistblacklist").attr('rel', await bkg.getLocale("whitelistblacklist")).html(await bkg.getLocale("whitelistblacklist"));
	$("#menu_importexport").attr('rel', await bkg.getLocale("importexport")).html(await bkg.getLocale("importexport"));
	$("#sectionname").html($('.list-group a.active').attr('rel'));
}
function initTabs() {
	$('.list-group a').on('click', function (e) {
		var currentAttrValue = $(this).attr('href');
		$("#sectionname").text($(this).attr('rel'));
		$('.tab-content ' + currentAttrValue).show().siblings().hide();
		$(this).addClass('active').siblings().removeClass('active');
		$('.tab-content ' + currentAttrValue).addClass('active').siblings().removeClass('active');
		e.preventDefault();
	});
}
async function viewToggle(commit) {
	$("#sidebar, #sectionname").toggle();
	if ($(".tab-content").hasClass('col-sm-9')) {
		$("#viewtoggle").text(await bkg.getLocale("groupallsettings")).removeClass('btn-info').addClass('btn-success');
		if (commit) localStorage['optionslist'] = 'true';
		$(".tab-content").removeClass('col-sm-9').addClass('col-sm-12');
		$(".tab").each(function () {
			$(this).prepend('<div class="sectionheading alert alert-success"><h4>' + $("a[href='#" + $(this).attr('id') + "']").attr('rel') + '</h4></div>').show();
		});
		$(".sectionheading:first").css('margin-top', '0px');
		$('#generalsettings .sectionheading').stickyScroll({ topBoundary: $("#generalsettings").offset().top, bottomBoundary: $("#fingerprintprotection").offset().top });
		$('#fingerprintprotection .sectionheading').stickyScroll({ topBoundary: $("#fingerprintprotection").offset().top, bottomBoundary: $("#privacysettings").offset().top });
		$('#privacysettings .sectionheading').stickyScroll({ topBoundary: $("#privacysettings").offset().top, bottomBoundary: $("#behaviorsettings").offset().top });
		$('#behaviorsettings .sectionheading').stickyScroll({ topBoundary: $("#behaviorsettings").offset().top, bottomBoundary: $("#whitelistblacklist").offset().top });
		$('#whitelistblacklist .sectionheading').stickyScroll({ topBoundary: $("#whitelistblacklist").offset().top, bottomBoundary: $("#whitelistblacklist").offset().top });
	} else {
		$("#viewtoggle").text(await bkg.getLocale("listallsettings")).removeClass('btn-success').addClass('btn-info');
		if (commit) localStorage['optionslist'] = 'false';
		$(".tab-content").removeClass('col-sm-12').addClass('col-sm-9');
		$(".tab").hide();
		$(".tab.active").show();
		$('.sectionheading').stickyScroll('reset');
		$(".sectionheading").remove();
		$('#sidebar').stickyScroll('reset');
		$('#sidebar').stickyScroll({ container: '#sectionname' });
	}
}
async function forceSyncExport() {
	if (confirm(await bkg.getLocale("forcesyncexport"))) {
		if (await bkg.freshSync(true) == 'true') {
			notification(await bkg.getLocale("exportsuccess"));
		}
	}
}
async function forceSyncImport() {
	if (confirm(await bkg.getLocale("forcesyncimport"))) {
		await bkg.importSyncHandle(1);
	}
}
async function importbulkwhite() {
	await importbulk(0);
}
async function importbulkblack() {
	await importbulk(1);
}
function settingsall() {
	selectAll('settingsexport');
}
async function importwhite() {
	await bulk(0);
}
async function importblack() {
	await bulk(1);
}
async function whiteclear() {
	await listclear(0);
}
async function blackclear() {
	await listclear(1);
}
function closeOptions() {
	window.open('', '_self', ''); window.close();
}
async function whitelistlisten() {
	await addList(0);
}
async function blacklistlisten() {
	await addList(1);
}
async function domainsort() {
	await saveOptions();
	await listUpdate();
	await fpListUpdate();
}
function loadCheckbox(id) {
	document.getElementById(id).checked = typeof localStorage[id] == "undefined" ? false : localStorage[id] == "true";
}
function loadElement(id) {
	$("#" + id).val(localStorage[id]);
}
function loadList(id) {
	$("#" + id).val(JSON.parse(localStorage[id]).join("\n"));
}
function saveCheckbox(id) {
	localStorage[id] = document.getElementById(id).checked;
}
function saveElement(id) {
	localStorage[id] = $("#" + id).val().replace(/[~|]/g, '');
}
function saveList(id) {
	localStorage[id] = JSON.stringify($("#" + id).val().split("\n"));
}
async function loadOptions() {
	$("#title").html("ScriptSafe v" + version);
	loadCheckbox("enable");
	loadCheckbox("syncenable");
	if (!$("#syncenable").prop('checked')) $("#syncbuttons").hide();
	else $("#syncbuttons").show();
	loadCheckbox("syncfromnotify");
	loadCheckbox("updatenotify");
	loadCheckbox("syncnotify");
	loadElement("mode");
	loadCheckbox("refresh");
	loadCheckbox("script");
	loadCheckbox("noscript");
	loadCheckbox("object");
	loadCheckbox("applet");
	loadCheckbox("embed");
	loadCheckbox("iframe");
	loadCheckbox("frame");
	loadCheckbox("audio");
	loadCheckbox("video");
	loadCheckbox("image");
	loadCheckbox("dataurl");
	loadCheckbox("showcontext");
	loadElement("xml");
	loadCheckbox("annoyances");
	loadElement("annoyancesmode");
	loadCheckbox("antisocial");
	loadElement("canvas");
	loadCheckbox("canvasfont");
	loadCheckbox("clientrects");
	loadCheckbox("audioblock");
	loadCheckbox("webgl");
	loadCheckbox("battery");
	loadCheckbox("webrtcdevice");
	loadCheckbox("gamepad");
	loadCheckbox("webvr");
	loadCheckbox("bluetooth");
	loadElement("timezone");
	loadCheckbox("keyboard");
	loadCheckbox("browserplugins");
	if (!$("#keyboard").prop('checked')) $(".keydeltarow").hide();
	else $(".keydeltarow").show();
	loadElement("keydelta");
	if ($("#keydelta").val() < 0 || isNaN(parseInt($("#keydelta").val()))) {
		$("#keydelta").val(40);
		saveElement("keydelta");
	}
	loadCheckbox("webbugs");
	loadCheckbox("utm");
	loadCheckbox("hashchecking");
	loadCheckbox("hashallow");
	loadElement("webrtc");
	if (!await bkg.getWebRTC()) $("#webrtccell").html('<strong style="color: red;">' + await bkg.getLocale("nowebrtc") + '</strong>');
	loadElement("preservesamedomain");
	loadCheckbox("paranoia");
	loadCheckbox("clipboard");
	loadCheckbox("classicoptions");
	loadElement("referrer");
	loadCheckbox("rating");
	loadCheckbox("domainsort");
	loadElement("linktarget");
	loadCheckbox("cookies");
	loadElement("useragentspoof");
	loadElement("useragentspoof_os");
	loadList("useragent");
	loadElement("useragentinterval");
	loadElement("useragentintervalmins");
	loadCheckbox("uaspoofallow");
	if (localStorage['annoyances'] == 'true' || localStorage['cookies'] == 'true') $("#annoyancesmode").removeAttr('disabled');
	else $("#annoyancesmode").attr('disabled', 'true');
	if ($("#useragentspoof").val() == 'off') $("#useragentspoof_os, #useragentbox, #applytoallow").hide();
	else if ($("#useragentspoof").val() == 'custom') {
		$("#useragentspoof_os").hide();
		$("#useragentbox, #applytoallow").show();
	} else {
		$("#useragentbox").hide();
		$("#useragentspoof_os, #applytoallow").show();
	}
	if ($("#hashchecking").val() == 'off') $("#applytoallowhash").hide();
	else $("#applytoallowhash").show();
	loadCheckbox("referrerspoofdenywhitelisted");
	if (localStorage['referrerspoof'] != 'same' && localStorage['referrerspoof'] != 'domain' && localStorage['referrerspoof'] != 'off') {
		$("#referrerspoof").val('custom');
		$("#customreferrer").show();
		$("#userref").val(localStorage['referrerspoof']);
	} else {
		loadElement("referrerspoof");
		$("#customreferrer").hide();
	}
	if ($("#useragent").val().indexOf("\n") == -1) $(".useragentrandom").hide();
	else $(".useragentrandom").show();
	if (localStorage['useragentinterval'] == 'interval') $("#useragentintervaloption").show();
	else $("#useragentintervaloption").hide();
	if ($("#referrerspoof").val() == 'off') $("#applyreferrerspoofdenywhitelisted").hide();
	else $("#applyreferrerspoofdenywhitelisted").show();
	await listUpdate();
	await fpListUpdate();
}
async function saveOptions() {
	saveCheckbox("enable");
	saveCheckbox("syncenable");
	if (!$("#syncenable").prop('checked')) $("#syncbuttons").hide();
	else $("#syncbuttons").show();
	saveCheckbox("syncnotify");
	saveCheckbox("syncfromnotify");
	saveCheckbox("updatenotify");
	saveElement("mode");
	saveCheckbox("refresh");
	saveCheckbox("script");
	saveCheckbox("noscript");
	saveCheckbox("object");
	saveCheckbox("applet");
	saveCheckbox("embed");
	saveCheckbox("iframe");
	saveCheckbox("frame");
	saveCheckbox("audio");
	saveCheckbox("video");
	saveCheckbox("image");
	saveCheckbox("dataurl");
	saveCheckbox("showcontext");
	saveElement("xml");
	saveCheckbox("annoyances");
	saveElement("annoyancesmode");
	saveCheckbox("antisocial");
	saveElement("canvas");
	saveCheckbox("canvasfont");
	saveCheckbox("clientrects");
	saveCheckbox("audioblock");
	saveCheckbox("webgl");
	saveCheckbox("battery");
	saveCheckbox("webrtcdevice");
	saveCheckbox("gamepad");
	saveCheckbox("webvr");
	saveCheckbox("bluetooth");
	saveElement("timezone");
	saveCheckbox("keyboard");
	saveCheckbox("browserplugins");
	if (!$("#keyboard").prop('checked')) $(".keydeltarow").hide();
	else $(".keydeltarow").show();
	saveElement("keydelta");
	saveCheckbox("webbugs");
	saveCheckbox("utm");
	saveCheckbox("hashchecking");
	saveCheckbox("hashallow");
	saveElement("webrtc");
	saveElement("preservesamedomain");
	saveCheckbox("paranoia");
	saveCheckbox("clipboard");
	saveCheckbox("classicoptions");
	saveElement("referrer");
	saveCheckbox("rating");
	saveCheckbox("cookies");
	saveElement("useragentspoof");
	saveElement("useragentspoof_os");
	var userAgents = $("#useragent").val();
	if (userAgents) {
		var validUserAgents = [];
		userAgents = userAgents.split("\n");
		var sanitizedAgent;
		for (var i = 0, userAgentNum = userAgents.length; i < userAgentNum; i++) {
			sanitizedAgent = $.trim(userAgents[i].replace(/[~|]/g, ''));
			if (sanitizedAgent) validUserAgents.push(sanitizedAgent);
		}
		$("#useragent").val(validUserAgents.join("\n"));
	}
	saveList("useragent");
	saveElement("useragentinterval");
	saveElement("useragentintervalmins");
	saveCheckbox("uaspoofallow");
	saveCheckbox("referrerspoofdenywhitelisted");
	if ($("#referrerspoof").val() != 'custom') {
		saveElement("referrerspoof");
		$("#customreferrer").hide();
	} else {
		if ($("#userref").val() != '') localStorage['referrerspoof'] = $("#userref").val();
		else {
			$("#customreferrer").show();
			$("#userref").focus;
		}
	}
	saveElement("linktarget");
	saveCheckbox("domainsort");
	if (localStorage['annoyances'] == 'true' || localStorage['cookies'] == 'true') $("#annoyancesmode").removeAttr('disabled');
	else $("#annoyancesmode").attr('disabled', 'true');
	if (localStorage['useragentspoof'] == 'off') $("#useragentspoof_os, #useragentbox, #applytoallow").hide();
	else if (localStorage['useragentspoof'] == 'custom') {
		$("#useragentspoof_os").hide();
		$("#useragentbox, #applytoallow").show();
	} else {
		$("#useragentbox").hide();
		$("#useragentspoof_os, #applytoallow").show();
	}
	if (localStorage['hashchecking'] != 'off') $("#applytoallowhash").show();
	else $("#applytoallowhash").hide();
	if ($("#useragent").val().indexOf("\n") == -1) $(".useragentrandom").hide();
	else $(".useragentrandom").show();
	if (localStorage['useragentinterval'] == 'interval') $("#useragentintervaloption").show();
	else $("#useragentintervaloption").hide();
	if (localStorage['referrerspoof'] != 'off') $("#applyreferrerspoofdenywhitelisted").show();
	else $("#applyreferrerspoofdenywhitelisted").hide();
	updateExport();
	await bkg.refreshRequestTypes();
	await bkg.initWebRTC();
	await bkg.reinitContext();
	syncstatus = await bkg.freshSync();
	if (syncstatus) {
		notification(await bkg.getLocale("settingssavesync"));
	} else {
		notification(await bkg.getLocale("settingssave"));
	}
}
async function saveLang() {
	saveElement("locale");
	updateExport();
	await bkg.initLang(localStorage['locale'], 0);
	setTimeout(async function () {
		await i18load();
		syncstatus = await bkg.freshSync();
		if (syncstatus) {
			notification(await bkg.getLocale("settingssavesync"));
		} else {
			notification(await bkg.getLocale("settingssave"));
		}
	}, 1000);
}
function selectAll(id) {
	$("#" + id).select();
}
async function settingsImport() {
	var error = "";
	var settings = $("#settingsimport").val().split("\n");
	if ($.trim($("#settingsimport").val()) == "") {
		notification(await bkg.getLocale("pastesettings"));
		return false;
	}
	if (settings.length > 0) {
		$.each(settings, function (i, v) {
			if ($.trim(v) != "") {
				var settingentry = $.trim(v).split("|");
				if (settingnames.indexOf($.trim(settingentry[0])) != -1 && ($.trim(settingentry[1]) != '' || $.trim(settingentry[0]) == 'useragent')) {
					if ($.trim(settingentry[0]) == 'whiteList' || $.trim(settingentry[0]) == 'blackList' || $.trim(settingentry[0]) == 'useragent') {
						var listarray = $.trim(settingentry[1]).replace(/(\[|\]|")/g, "").split(",");
						if ($.trim(settingentry[0]) == 'whiteList' && listarray.toString() != '') localStorage['whiteList'] = JSON.stringify(listarray);
						else if ($.trim(settingentry[0]) == 'blackList' && listarray.toString() != '') localStorage['blackList'] = JSON.stringify(listarray);
						else if ($.trim(settingentry[0]) == 'useragent' && listarray.toString() != '') localStorage['useragent'] = JSON.stringify(listarray);
					} else
						localStorage[$.trim(settingentry[0])] = $.trim(settingentry[1]);
				} else {
					error += $.trim(settingentry[0]) + ", ";
				}
			}
		});
	}
	await loadOptions();
	await listUpdate();
	await fpListUpdate();
	await bkg.refreshRequestTypes();
	await bkg.initWebRTC();
	await bkg.cacheLists();
	await bkg.cacheFpLists();
	await bkg.initLang(localStorage['locale'], 0);
	setTimeout(async function () {
		await i18load();
		$("#locale").val(localStorage['locale'])
		syncstatus = await bkg.freshSync();
		if (!error) {
			if (syncstatus) notification(await bkg.getLocale("importsuccesssync"));
			else notification(await bkg.getLocale("importsuccessoptions"));
		} else {
			if (syncstatus) notification(await bkg.getLocale("importsuccesscond") + ' ' + error.slice(0, -2) + '<br /><br />' + await bkg.getLocale("settingssavesync"));
			else notification(await bkg.getLocale("importsuccesscond") + ' ' + error.slice(0, -2));
		}
		$("#settingsimport").val("");
	}, 1000);
}
function downloadtxt() {
	var textToWrite = $("#settingsexport").val();
	var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
	var fileNameToSaveAs = "scriptsafe-settings-" + new Date().toJSON() + ".txt";
	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
	downloadLink.onclick = function (e) { document.body.removeChild(e.target); };
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);
	downloadLink.click();
}
function updateExport() {
	settingnames = [];
	$("#settingsexport").val("");
	for (var i in localStorage) {
		if (localStorage.hasOwnProperty(i)) {
			if (i != "version" && i != "tempregexflag" && i != "whiteListCount" && i != "blackListCount" && i != "whiteListCount2" && i != "blackListCount2" && i.substr(0, 2) != "zb" && i.substr(0, 2) != "zw" && i.substr(0, 2) != "sb" && i.substr(0, 2) != "sw" && i.substr(0, 2) != "sf") {
				settingnames.push(i);
				$("#settingsexport").val($("#settingsexport").val() + i + "|" + localStorage[i] + "\n");
			}
		}
	}
	$("#settingsexport").val($("#settingsexport").val().slice(0, -1));
}
function is_int(value) {
	if ((parseFloat(value) == parseInt(value)) && !isNaN(value)) return true;
	return false;
}
function notification(msg) {
	$('#message').html(msg).stop().fadeIn("slow").delay(2000).fadeOut("slow")
}
async function addList(type) {
	var domain = $('#url').val().toLowerCase().replace("http://", "").replace("https://", "");
	if (!domain.match(/^(?:[\-\w\*\?]+(\.[\-\w\*\?]+)*|((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})|\[[A-Fa-f0-9:.]+\])?$/g)) {
		notification(await bkg.getLocale("domaininvalid"));
	} else if (!domain.match(/[a-z0-9]/g)) {
		notification(await bkg.getLocale("domaininvalid2"));
	} else {
		if ((localStorage['annoyances'] == 'true' && (localStorage['annoyancesmode'] == 'strict' || (localStorage['annoyancesmode'] == 'relaxed' && await bkg.domainCheck(domain, 1) != '0')) && await bkg.baddies(await bkg.getDomain(domain), localStorage['annoyancesmode'], localStorage['antisocial']) == 1) || (localStorage['antisocial'] == 'true' && await bkg.baddies(await bkg.getDomain(domain), localStorage['annoyancesmode'], localStorage['antisocial']) == '2')) {
			notification(await bkg.getLocale("domaininvalid3"));
		} else {
			var responseflag = await bkg.domainHandler(domain, type);
			if (responseflag) {
				$('#url').val('');
				syncstatus = await bkg.freshSync();
				if (syncstatus) {
					notification([await bkg.getLocale("whitelisted"), await bkg.getLocale("blacklisted")][type] + ' ' + domain + ' and syncing in 10 seconds.');
				} else {
					notification([await bkg.getLocale("whitelisted"), await bkg.getLocale("blacklisted")][type] + ' ' + domain + '.');
				}
				await listUpdate();
			} else {
				notification(domain + ' not added as it already exists in the list or the entire domain has been ' + [await bkg.getLocale("whitelisted"), await bkg.getLocale("blacklisted")][type]);
			}
			$('#url').focus();
		}
	}
	return false;
}
async function addFPList() {
	var elid = $(this).attr('id').substr(0, $(this).attr('id').indexOf('whitebind'));
	var domain = $('#' + elid + 'url').val().toLowerCase().replace("http://", "").replace("https://", "");
	if (!domain.match(/^(?:[\-\w\*\?]+(\.[\-\w\*\?]+)*|((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})|\[[A-Fa-f0-9:.]+\])?$/g)) {
		notification(await bkg.getLocale("domaininvalid"));
	} else if (!domain.match(/[a-z0-9]/g)) {
		notification(await bkg.getLocale("domaininvalid2"));
	} else {
		var responseflag = await bkg.fpDomainHandler(domain, elid, 1);
		if (responseflag) {
			$('#' + elid + 'url').val('');
			syncstatus = await bkg.freshSync();
			if (syncstatus) {
				notification(await bkg.getLocale("whitelisted") + ' ' + domain + ' and syncing in 10 seconds.');
			} else {
				notification(await bkg.getLocale("whitelisted") + ' ' + domain + '.');
			}
			await fpListUpdate();
		} else {
			notification(domain + ' not added as it already exists in the list or the entire domain has been ' + await bkg.getLocale("whitelisted"));
		}
		$('#' + elid + 'url').focus();
	}
	return false;
}
async function domainRemover(domain, type) {
	if (confirm("Are you sure you want to remove " + domain + " from this list?")) {
		if (type === undefined) type = false;
		if (!type) {
			await bkg.domainHandler(domain, 2);
			await listUpdate();
		} else {
			await bkg.fpDomainHandler(domain, type, -1);
			await fpListUpdate();
		}
		syncstatus = await bkg.freshSync();
		if (syncstatus) {
			notification('Successfully removed: ' + domain + ' and syncing in 10 seconds.');
		} else {
			notification('Successfully removed: ' + domain);
		}
	}
	return false;
}
async function domainMove(domain, mode) {
	var lingo;
	if (mode == '0') lingo = await bkg.getLocale("whitelistlow");
	else if (mode == '1') lingo = await bkg.getLocale("blacklistlow");
	if (confirm("Are you sure you want to move " + domain + " to the " + lingo + "?")) {
		await bkg.domainHandler(domain, mode);
		await listUpdate();
		syncstatus = await bkg.freshSync();
		if (syncstatus) {
			notification([await bkg.getLocale("whitelisted"), await bkg.getLocale("blacklisted")][mode] + ' ' + domain + ' and syncing in 10 seconds.');
		} else {
			notification([await bkg.getLocale("whitelisted"), await bkg.getLocale("blacklisted")][mode] + ' ' + domain);
		}
	}
	return false;
}
async function topDomainAdd(domain, mode) {
	var lingo;
	var fpmode = false;
	if (mode == '0') lingo = await bkg.getLocale("trustlow");
	else if (mode == '1') lingo = await bkg.getLocale("distrustlow");
	else {
		lingo = await bkg.getLocale("trustlow");
		fpmode = true;
	}
	if (domain && !domain.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g) && !domain.match(/^(?:\[[A-Fa-f0-9:.]+\])$/g) && domain.indexOf('**.') != 0 && confirm("Are you sure you want to " + lingo + " " + await bkg.getDomain(domain) + "?\r\n\r\Click OK will mean all subdomains on " + await bkg.getDomain(domain) + " will be " + lingo + "ed, such as _." + await bkg.getDomain(domain) + " and even _._._." + await bkg.getDomain(domain) + ".")) {
		await bkg.topHandler(domain, mode);
		if (!fpmode) await listUpdate();
		else await fpListUpdate();
		await bkg.freshSync();
		notification('Successfully ' + lingo + 'ed: ' + domain);
	}
}
function hidebulk() {
	$("#bulk").slideUp("fast");
}
async function bulk(type) {
	var error = false;
	if (!$("#bulk").is(":visible")) {
		$("#bulk").slideDown("fast");
		$('html, body').animate({
			scrollTop: ($("#bulk").offset().top - 55)
		}, 'slow');
	} else {
		if ((type == '0' && $("#bulk strong").html() == await bkg.getLocale("whitelist") + " " + await bkg.getLocale("bulkimportcap")) || (type == '1' && $("#bulk strong").html() == await bkg.getLocale("blacklist") + " " + await bkg.getLocale("bulkimportcap"))) hidebulk();
	}
	$("#bulk textarea").focus();
	if (type == '0') {
		$("#bulk strong").html(await bkg.getLocale("whitelist") + " " + await bkg.getLocale("bulkimportcap"));
		$("#bulkbtn").val(await bkg.getLocale("whitebind")).click(importbulkwhite);
	} else if (type == '1') {
		$("#bulk strong").html(await bkg.getLocale("blacklist") + " " + await bkg.getLocale("bulkimportcap"));
		$("#bulkbtn").val(await bkg.getLocale("blackbind")).click(importbulkblack);
	}
}
async function importbulk(type) {
	var error = '';
	var domains = $("#bulk textarea").val().split("\n");
	if ($.trim($("#bulk textarea").val()) == "") {
		hidebulk();
		return false;
	}
	if (domains.length > 0) {
		$.each(domains, async function (i, v) {
			if ($.trim(v) != "") {
				var domain = $.trim(v).toLowerCase().replace("http://", "").replace("https://", "");
				if ((localStorage['annoyances'] == 'true' && (localStorage['annoyancesmode'] == 'strict' || (localStorage['annoyancesmode'] == 'relaxed' && await bkg.domainCheck(domain.replace("http://", "").replace("https://", ""), 1) != '0')) && await bkg.baddies(await bkg.getDomain(domain.replace("http://", "").replace("https://", "")), localStorage['annoyancesmode'], localStorage['antisocial']) == 1) || (localStorage['antisocial'] == 'true' && await bkg.baddies(await bkg.getDomain(domain.replace("http://", "").replace("https://", "")), localStorage['annoyancesmode'], localStorage['antisocial']) == '2')) {
					error += '<li>' + domain.replace("http://", "").replace("https://", "") + ' <b>(provider of unwanted content (see "Block Unwanted Content" and/or "Antisocial Mode")</b></li>';
				} else {
					if (domain.match(/^(?:[\-\w\*\?]+(\.[\-\w\*\?]+)*|((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})|\[[A-Fa-f0-9:.]+\])?$/g)) {
						await bkg.domainHandler(domain, type);
					} else {
						error += '<li>' + domain + '</li>';
					}
				}
			}
		});
	}
	await listUpdate();
	if (!error) {
		syncstatus = await bkg.freshSync();
		if (syncstatus) {
			notification('Domains imported successfully and syncing in 10 seconds');
		} else {
			notification('Domains imported successfully');
		}
		if ($("#bulk").is(":visible")) hidebulk();
		$("#bulk textarea").val("");
		$('#importerror').hide();
	} else {
		await bkg.freshSync();
		notification('Error importing some domains');
		$('#importerror').html('<strong>Some Domains Not Imported</strong><br />The following domains were not imported as they are invalid (the others were successfully imported): <ul>' + error + '</ul>').stop().fadeIn("slow");
	}
}
async function listUpdate() {
	var whiteList = JSON.parse(localStorage['whiteList']);
	var blackList = JSON.parse(localStorage['blackList']);
	var whitelistCompiled = '';
	var whitelistLength = whiteList.length;
	if (whitelistLength == 0) whitelistCompiled = '[currently empty]';
	else {
		if (localStorage['domainsort'] == 'true') whiteList = await bkg.domainSort(whiteList);
		else whiteList.sort();
		for (var i in whiteList) {
			if ((whiteList[i][0] == '*' && whiteList[i][1] == '*') || whiteList[i].match(/^(?:(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g) || whiteList[i].match(/^(?:\[[A-Fa-f0-9:.]+\])(:[0-9]+)?$/g)) whitelistCompiled += '<div class="listentry"><div class="entryoptions"><a href="javascript:;" class="domainMove i18_blacklistmove" title=\'' + await bkg.getLocale("blacklistmove") + '\' data-domain=\'' + whiteList[i] + '\' data-mode="1"><span class="glyphicon glyphicon-retweet" aria-hidden="true"></span></a> | <a href="javascript:;" style="color:#f00;" class="domainRemover" rel=\'' + whiteList[i] + '\'><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></div>' + whiteList[i] + '</div>';
			else whitelistCompiled += '<div class="listentry"><div class="entryoptions"><a href="javascript:;" style="color:green;" class="topDomainAdd" title=\'' + await bkg.getLocale("trust") + ' ' + whiteList[i] + '\' data-domain=\'' + whiteList[i] + '\' data-mode="0">' + await bkg.getLocale("trust") + '</a> | <a href="javascript:;" class="domainMove i18_blacklistmove" title=\'' + await bkg.getLocale("blacklistmove") + '\' data-domain=\'' + whiteList[i] + '\' data-mode="1"><span class="glyphicon glyphicon-retweet" aria-hidden="true"></span></a> | <a href="javascript:;" style="color:#f00;" class="domainRemover" rel=\'' + whiteList[i] + '\'><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></div>' + whiteList[i] + '</div>';
		}
	}
	var blacklistCompiled = '';
	var blacklistLength = blackList.length;
	if (blacklistLength == 0) blacklistCompiled = '[currently empty]';
	else {
		if (localStorage['domainsort'] == 'true') blackList = await bkg.domainSort(blackList);
		else blackList.sort();
		for (var i in blackList) {
			if ((blackList[i][0] == '*' && blackList[i][1] == '*') || blackList[i].match(/^(?:(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g) || blackList[i].match(/^(?:\[[A-Fa-f0-9:.]+\])(:[0-9]+)?$/g)) blacklistCompiled += '<div class="listentry"><div class="entryoptions"><a href="javascript:;" class="domainMove i18_whitelistmove" title=\'' + await bkg.getLocale("whitelistmove") + '\' data-domain=\'' + blackList[i] + '\' data-mode="0"><span class="glyphicon glyphicon-retweet" aria-hidden="true"></span></a> | <a href="javascript:;" style="color:#f00;" class="domainRemover" rel=\'' + blackList[i] + '\'><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></div>' + blackList[i] + '</div>';
			else blacklistCompiled += '<div class="listentry"><div class="entryoptions"><a href="javascript:;" style="color:green;" class="topDomainAdd" title=\'' + await bkg.getLocale("distrust") + ' ' + blackList[i] + '\' data-domain=\'' + blackList[i] + '\' data-mode="1">' + await bkg.getLocale("distrust") + '</a> | <a href="javascript:;" class="domainMove i18_whitelistmove" title=\'' + await bkg.getLocale("whitelistmove") + '\' data-domain=\'' + blackList[i] + '\' data-mode="0"><span class="glyphicon glyphicon-retweet" aria-hidden="true"></span></a> | <a href="javascript:;" style="color:#f00;" class="domainRemover" rel=\'' + blackList[i] + '\'><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></div>' + blackList[i] + '</div>';
		}
	}
	$('#whitelist').html(whitelistCompiled);
	$('#blacklist').html(blacklistCompiled);
	$('#whitelistcount').html(whitelistLength);
	$('#blacklistcount').html(blacklistLength);
	$(".domainRemover, .topDomainAdd, .domainMove").unbind('click');
	$(".domainRemover").click(async function () { await domainRemover($(this).attr('rel')); });
	$(".topDomainAdd").click(async function () { await topDomainAdd($(this).attr('data-domain'), $(this).attr('data-mode')); });
	$(".domainMove").click(async function () { await domainMove($(this).attr('data-domain'), $(this).attr('data-mode')); });
	updateExport();
}
async function fpListUpdate() {
	var fpTypes = ['fpCanvas', 'fpCanvasFont', 'fpAudio', 'fpWebGL', 'fpBattery', 'fpDevice', 'fpGamepad', 'fpWebVR', 'fpBluetooth', 'fpClientRectangles', 'fpClipboard', 'fpBrowserPlugins'];
	for (var i in fpTypes) {
		await fpListProcess(fpTypes[i]);
	}
	$(".fpDomainRemover, .fpTopDomainAdd").unbind('click');
	$(".fpDomainRemover").click(async function () { await domainRemover($(this).attr('rel'), $(this).parent().parent().parent().attr('id')); });
	$(".fpTopDomainAdd").click(async function () { await topDomainAdd($(this).attr('data-domain'), $(this).parent().parent().parent().attr('id')); });
	updateExport();
}
async function fpListProcess(fpType) {
	var fpList = JSON.parse(localStorage[fpType]);
	var fpListCompiled = '';
	var fpListLength = fpList.length;
	if (fpListLength == 0) fpListCompiled = '[currently empty]';
	else {
		if (localStorage['domainsort'] == 'true') fpList = await bkg.domainSort(fpList);
		else fpList.sort();
		for (var i in fpList) {
			if (fpList[i][0] == '*' || fpList[i].match(/^(?:(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g) || fpList[i].match(/^(?:\[[A-Fa-f0-9:.]+\])(:[0-9]+)?$/g)) fpListCompiled += '<div class="listentry"><div class="entryoptions"><a href="javascript:;" style="color:#f00;" class="fpDomainRemover" rel=\'' + fpList[i] + '\'><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></div>' + fpList[i] + '</div>';
			else fpListCompiled += '<div class="listentry"><div class="entryoptions"><a href="javascript:;" style="color:#f00;" class="fpDomainRemover" rel=\'' + fpList[i] + '\'><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></div>' + fpList[i] + '</div>';
		}
	}
	$('#' + fpType).html(fpListCompiled);
	$('#' + fpType + 'count').html(fpListLength);
}
async function listclear(type) {
	if (confirm(['Clear whitelist?', 'Clear blacklist?'][type])) {
		localStorage[['whiteList', 'blackList'][type]] = JSON.stringify([]);
		await listUpdate();
		await bkg.cacheLists();
		if (await bkg.freshSync(2)) {
			notification(await bkg.getLocale("settingssavesync"));
		} else {
			notification(await bkg.getLocale("settingssave"));
		}
	}
	return false;
}

!function (t) { t.fn.stickyScroll = function (o) { var e = { init: function (o) { function e() { return t(document).height() - i.container.offset().top - i.container.attr("offsetHeight") } function s() { return i.container.offset().top } function n(o) { return t(o).attr("offsetHeight") } var i; return "auto" !== o.mode && "manual" !== o.mode && (o.container && (o.mode = "auto"), o.bottomBoundary && (o.mode = "manual")), i = t.extend({ mode: "auto", container: t("body"), topBoundary: null, bottomBoundary: null }, o), i.container = t(i.container), i.container.length ? ("auto" === i.mode && (i.topBoundary = s(), i.bottomBoundary = e()), this.each(function (o) { var c = t(this), a = t(window), r = Date.now() + o, l = n(c); c.data("sticky-id", r), a.bind("scroll.stickyscroll-" + r, function () { var o = t(document).scrollTop(), e = t(document).height() - o - l; e <= i.bottomBoundary ? c.offset({ top: t(document).height() - i.bottomBoundary - l }).removeClass("sticky-active").removeClass("sticky-inactive").addClass("sticky-stopped") : o > i.topBoundary ? c.offset({ top: t(window).scrollTop() }).removeClass("sticky-stopped").removeClass("sticky-inactive").addClass("sticky-active") : o < i.topBoundary && c.css({ position: "", top: "", bottom: "" }).removeClass("sticky-stopped").removeClass("sticky-active").addClass("sticky-inactive") }), a.bind("resize.stickyscroll-" + r, function () { "auto" === i.mode && (i.topBoundary = s(), i.bottomBoundary = e()), l = n(c), t(this).scroll() }), c.addClass("sticky-processed"), a.scroll() })) : void (console && console.log("StickyScroll: the element " + o.container + " does not exist, we're throwing in the towel")) }, reset: function () { return this.each(function () { var o = t(this), e = o.data("sticky-id"); o.css({ position: "", top: "", bottom: "" }).removeClass("sticky-stopped").removeClass("sticky-active").removeClass("sticky-inactive").removeClass("sticky-processed"), t(window).unbind(".stickyscroll-" + e) }) } }; return e[o] ? e[o].apply(this, Array.prototype.slice.call(arguments, 1)) : "object" != typeof o && o ? void (console && console.log("Method" + o + " does not exist on jQuery.stickyScroll")) : e.init.apply(this, arguments) } }(jQuery);