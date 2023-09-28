import { z } from 'zod';
import { i18n } from '~/i18n';

const ERR = {
	REQUIRED: i18n('ERROR_REQUIRED', [i18n('TYPES_MENTION_KEY')]),
	INVALID_TYPE: i18n('ERROR_INVALID_TYPE_STRING', [i18n('TYPES_MENTION_KEY')]),
} as const;

export const MentionKeys = {
	strict: z.string({ required_error: ERR.REQUIRED, invalid_type_error: ERR.INVALID_TYPE }).min(1, { message: ERR.REQUIRED }),
	lenient: z.string(),
} as const;

export type MentionKey = z.infer<(typeof MentionKeys)['strict']>;
