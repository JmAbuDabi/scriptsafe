// ScriptSafe - Copyright (C) andryou
// Distributed under the terms of the GNU General Public License
// The GNU General Public License can be found in the gpl.txt file. Alternatively, see <http://www.gnu.org/licenses/>.
import { version, localStore, getBackgroundPage } from "./common.js";
var bkg = getBackgroundPage();
document.addEventListener('DOMContentLoaded', async function () {
	$("#title").html("ScriptSafe v" + version);
	$('#versionno').html(version);
	$("#loadoptionspage").click(function () { location.href = 'options.html'; });
	$("#closepage").click(function () { window.open('', '_self', ''); window.close(); });
	$("#disableNotification").click(disableNotification);
	$("#loadoptionspage").val(await bkg.getLocale("options"));
	$(".i18_options").html(await bkg.getLocale("options"));
	$(".i18_support").html(await bkg.getLocale("support"));
	$("#closepage").val(await bkg.getLocale("close"));
	$("#disableNotification").val(await bkg.getLocale("dontshowpage"));
});
async function disableNotification() {
	if (confirm(await bkg.getLocale("updatedisable"))) {
		await localStore.setItem('updatenotify', 'false');
		$('#message').html(await bkg.getLocale("updatedisablemessage")).stop().fadeIn("slow").delay(2000).fadeOut("slow");
	}
}