import { z } from 'zod';
import { i18n } from '~/i18n';

const ERR = {
	REQUIRED: i18n('ERROR_REQUIRED', [i18n('TYPES_MENTION_NAME')]),
	INVALID_TYPE: i18n('ERROR_INVALID_TYPE_STRING', [i18n('TYPES_MENTION_NAME')]),
} as const;

export const MentionNames = {
	strict: z.string({ required_error: ERR.REQUIRED, invalid_type_error: ERR.INVALID_TYPE }).min(1, { message: ERR.REQUIRED }),
	lenient: z.string(),
} as const;

export type MentionName = z.infer<(typeof MentionNames)['strict']>;
