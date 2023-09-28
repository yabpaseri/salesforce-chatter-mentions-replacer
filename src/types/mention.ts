import { z } from 'zod';
import { MentionEnvs } from './mention-env';
import { MentionIds } from './mention-id';
import { MentionKeys } from './mention-key';
import { MentionNames } from './mention-name';
import { MentionSfids } from './mention-sfid';

export const Mentions = {
	strict: z.object({
		id: MentionIds.strict,
		env: MentionEnvs.strict,
		key: MentionKeys.strict,
		name: MentionNames.strict,
		sfid: MentionSfids.strict,
	}),
	lenient: z.object({
		id: MentionIds.lenient,
		env: MentionEnvs.lenient,
		key: MentionKeys.lenient,
		name: MentionNames.lenient,
		sfid: MentionSfids.lenient,
	}),
} as const;

export type Mention = z.infer<(typeof Mentions)['strict']>;
