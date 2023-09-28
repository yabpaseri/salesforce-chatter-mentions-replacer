import { z } from 'zod';
import { i18n } from '~/i18n';

const ERR = {
	REQUIRED: i18n('ERROR_REQUIRED', [i18n('TYPES_MENTION_SFID')]),
	INVALID_TYPE: i18n('ERROR_INVALID_TYPE_STRING', [i18n('TYPES_MENTION_SFID')]),
	INVALID_REGEX: i18n('ERROR_INVALID_FORMAT_SFID', [i18n('TYPES_MENTION_SFID')]),
} as const;
const REGEX = /^([A-Za-z0-9]{15}|[A-Za-z0-9]{18})$/;

export const MentionSfids = {
	strict: z.string({ required_error: ERR.REQUIRED, invalid_type_error: ERR.INVALID_TYPE }).regex(REGEX, { message: ERR.INVALID_REGEX }),
	lenient: z.string(),
} as const;

export type MentionSfid = z.infer<(typeof MentionSfids)['strict']>;
