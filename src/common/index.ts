/**
 * 本体とは別で動かす、拡張機能の拡張機能のようなもの。
 */
(function main() {
	/**
	 * KeyboardEventの追加
	 * @see /src/@types/keyboard-event.d.ts
	 */
	Object.defineProperty(KeyboardEvent.prototype, 'commandKey', {
		get(): boolean {
			const mac = window.navigator.userAgent.includes('Mac');
			return (mac && this.metaKey) || (!mac && this.ctrlKey);
		},
	});
})();
