import { z } from 'zod';
import { i18n } from '~/i18n';

const ERR = {
	REQUIRED: i18n('ERROR_REQUIRED', [i18n('TYPES_MENTION_ENV')]),
	INVALID_TYPE: i18n('ERROR_INVALID_TYPE_STRING', [i18n('TYPES_MENTION_ENV')]),
	INVALID_TYPE_URL: i18n('ERROR_INVALID_FORMAT_URL', [i18n('TYPES_MENTION_ENV')]),
} as const;

export const MentionEnvs = {
	strict: z.string({ required_error: ERR.REQUIRED, invalid_type_error: ERR.INVALID_TYPE }).url({ message: ERR.INVALID_TYPE_URL }),
	lenient: z.string(),
} as const;

export type MentionEnv = z.infer<(typeof MentionEnvs)['strict']>;
