(function main() {
	const USER_SFID_REGEX = /(?<=User\/).+(?=\/view)/;
	const REGEX_SFORCE_URL = [
		/^https:\/\/.+\.my\.salesforce\.com\/lightning\/r\/User\/.+\/view/,
		/^https:\/\/.+\.lightning\.force\.com\/lightning\/r\/User\/.+\/view/,
	] as const;

	// chrome.actionのpopupページを切り替える
	function updateAction(url: string, title: string) {
		const base = chrome.runtime.getURL('pages/popup.html');
		const matched = (() => {
			for (const r of REGEX_SFORCE_URL) {
				if (r.test(url)) return true;
			}
			return false;
		})();
		if (matched) {
			const params = new URLSearchParams();
			const sfid = url.match(USER_SFID_REGEX)?.[0] ?? '';
			const name = title.split('|')[0].trim() || '';
			params.set('env', new URL(url).origin);
			params.set('key', `@{${name}}`);
			params.set('name', name);
			params.set('sfid', sfid);
			const popup = `${base}?${params.toString()}`;
			chrome.action.setPopup({ popup });
		} else {
			chrome.action.setPopup({ popup: base });
		}
	}
	chrome.tabs.onActivated.addListener((activeInfo) => {
		chrome.tabs.get(activeInfo.tabId, (tab) => {
			const url = tab.url;
			const title = tab.title || '';
			if (url) updateAction(url, title);
		});
	});
	chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
		const url = changeInfo.url || tab.url;
		const title = changeInfo.title || tab.title || '';
		if (tab.active && url) updateAction(url, title);
	});
})();
