import { Key } from './key';

/**
 * chrome.i18nを用いて翻訳する
 */
export const i18n = <T extends string>(key: Key | T, substitutions?: string | string[] | undefined) => {
	const res: string | undefined = chrome.i18n.getMessage(key, substitutions);
	switch (res) {
		case undefined:
			return `${key}(error occured)`;
		case '':
			return `${key}(unknown key)`;
		default:
			return res;
	}
};
