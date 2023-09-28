/**
 * キャレット(カーソル)位置の保存・読込を行う
 * @see https://codepen.io/jeffward/pen/OJjPKYo
 */
export class Caret {
	#pos: number | undefined;
	constructor(private container: HTMLElement) {
		if (!container.isContentEditable) throw new Error('target is not contenteditable');
	}

	clear() {
		this.#pos = void 0;
	}

	/**
	 * 読み込まれたキャレット位置を調整にoffset値を足す(調整用)
	 * TODO: 変換後にキャレット位置はズレるが、変換前後の文字数は計算できるからどうにかならないかな...という希望
	 * @param offset
	 * @returns 調整後のpos
	 */
	setOffset(offset: number): number {
		if (this.#pos == null) return -1;
		return (this.#pos = Math.max(0, this.#pos + offset));
	}

	save() {
		this.clear();
		const selection = window.getSelection();
		if (selection?.focusNode == null || !this.#isDescendantOf(selection.focusNode, this.container)) {
			// container(contenteditableの最上位階層)の配下でないなら、処理無し
			return;
		}
		for (let node = selection.focusNode, charCount = selection.focusOffset; node != null; ) {
			if (node == this.container) {
				this.#pos = charCount;
				break;
			}
			if (node.previousSibling != null) {
				node = node.previousSibling;
				charCount += node.textContent?.length ?? 0; // で良いのかな？
			} else {
				if (node.parentNode == null) {
					this.#pos = charCount;
					break;
				}
				node = node.parentNode;
			}
		}
	}

	load() {
		if (this.#pos == null || this.#pos < 0) return;
		const selection = window.getSelection();
		const range = this.#createRange(this.container, { count: this.#pos });
		if (range != null) {
			range.collapse(false);
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}

	#isDescendantOf(node: Node | null, parent: Node) {
		while (node != null) {
			if (node == parent) return true;
			node = node.parentNode;
		}
		return false;
	}
	#createRange(node: Node, chars: { count: number }, range?: Range): Range {
		if (range == null) {
			range = window.document.createRange();
			range.selectNode(node);
			range.setStart(node, 0);
		}
		if (chars.count === 0) {
			range.setEnd(node, chars.count);
		} else if (node != null && chars.count > 0) {
			if (node.nodeType === Node.TEXT_NODE) {
				if (node.textContent!.length < chars.count) {
					chars.count -= node.textContent!.length;
				} else {
					range.setEnd(node, chars.count);
					chars.count = 0;
				}
			} else {
				for (let g = 0; g < node.childNodes.length; ) {
					range = this.#createRange(node.childNodes[++g], chars, range);
					if (chars.count === 0) break;
				}
			}
		}
		return range;
	}
}
