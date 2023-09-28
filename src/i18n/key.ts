export type Key =
	| keyof typeof import('_locales/ja/messages.json') //   /** Japanese */
	| keyof typeof import('_locales/en/messages.json'); //  /** English(US) */
