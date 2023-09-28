export {};

declare global {
	interface KeyboardEvent {
		/** mac: metaKey, others: commandKey */
		get commandKey(): boolean;
	}
}
