import { Mention } from '~/types/mention';

export const exists = <T extends Pick<Mention, 'env' | 'key'>>(mentions: T[], target: T) => {
	return mentions.some((m) => m.env === target.env && m.key === target.key);
};

export const someEmpty = (mention: Mention): boolean => {
	return [mention.env, mention.key, mention.name, mention.sfid].some((v) => v == null || v.length === 0);
};

export const fillEmpty = (base: Mention, source: Mention): Mention => ({
	id: base.id || crypto.randomUUID(),
	env: base.env || source.env,
	key: base.key || source.key,
	name: base.name || source.name,
	sfid: base.sfid || source.sfid,
});
