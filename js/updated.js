// ScriptSafe - Copyright (C) andryou
// Distributed under the terms of the GNU General Public License
// The GNU General Public License can be found in the gpl.txt file. Alternatively, see <http://www.gnu.org/licenses/>.
var bkg = getBackgroundPage();
document.addEventListener('DOMContentLoaded', async function () {
	var version = '2.0.0.0';
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
		localStorage['updatenotify'] = 'false';
		$('#message').html(await bkg.getLocale("updatedisablemessage")).stop().fadeIn("slow").delay(2000).fadeOut("slow");
	}
}

function getBackgroundPage() {
	return new Proxy({}, {
		get(_, method) {
			return (...args) => {
				return new Promise((resolve, reject) => {
					chrome.runtime.sendMessage({ method, args }, (response) => {
						if (chrome.runtime.lastError) {
							return reject(new Error(chrome.runtime.lastError.message));
						}
						if (response?.error) {
							return reject(new Error(response.error));
						}
						resolve(response?.result);
					});
				});
			};
		}
	});
}