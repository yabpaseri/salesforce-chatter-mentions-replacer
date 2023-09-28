import { z } from 'zod';

export const MentionIds = {
	strict: z.string().uuid(),
	lenient: z.string().uuid(),
} as const;

export type MentionId = z.infer<(typeof MentionIds)['strict']>;
