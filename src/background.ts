(function main() {
	const SALESFORCE_ENVIROMENT_URL_REGEX = /https:\/\/.+\.(my\.salesforce|lightning\.force)\.com/;
	const SFID_PICKABLE_URL_REGEX = /https:\/\/.+\.(my\.salesforce|lightning\.force)\.com\/lightning\/r\/(User|CollaborationGroup)\/.+\/view/;
	const SFID_PICK_REGEX = /(?<=(User|CollaborationGroup)\/).+(?=\/view)/;

	function updateActionPopup(url: string, title: string) {
		const baseURL = chrome.runtime.getURL('pages/popup.html');
		if (SALESFORCE_ENVIROMENT_URL_REGEX.test(url)) {
			const params = new URLSearchParams();
			params.set('env', new URL(url).origin);
			if (SFID_PICKABLE_URL_REGEX.test(url)) {
				const name = title.split('|')[0].trim() || '';
				const sfid = url.match(SFID_PICK_REGEX)?.[0] ?? '';
				params.set('key', `@{${name}}`);
				params.set('name', name);
				params.set('sfid', sfid);
			}
			const popup = `${baseURL}?${params.toString()}`;
			chrome.action.setPopup({ popup });
		} else {
			chrome.action.setPopup({ popup: baseURL });
		}
	}

	chrome.tabs.onActivated.addListener((activeInfo) => {
		chrome.tabs.get(activeInfo.tabId, (tab) => {
			const url = tab.url;
			const title = tab.title || '';
			if (url) updateActionPopup(url, title);
		});
	});
	chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
		const url = changeInfo.url || tab.url;
		const title = changeInfo.title || tab.title || '';
		if (tab.active && url) updateActionPopup(url, title);
	});
})();
