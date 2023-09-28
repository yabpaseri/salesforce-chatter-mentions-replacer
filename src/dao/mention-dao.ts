import { z } from 'zod';
import { Mention, Mentions } from '~/types/mention';

export const KEY = 'MENTIONS';

export const write = (mentions: Mention[]): Promise<void> => {
	return chrome.storage.sync.set({ [KEY]: mentions });
};
const read = async (parser: typeof Mentions.strict | typeof Mentions.lenient): Promise<Mention[]> => {
	const data = (await chrome.storage.sync.get(KEY))[KEY];
	const parsedAsArray = z.unknown().array().safeParse(data);
	if (!parsedAsArray.success) return [];
	return parsedAsArray.data.reduce((res: Mention[], item) => {
		const parsedAsMention = parser.safeParse(item);
		if (parsedAsMention.success) res.push(parsedAsMention.data);
		return res;
	}, []);
};

export const readAsStrict = read.bind(null, Mentions.strict);
export const readAsLenient = read.bind(null, Mentions.lenient);
