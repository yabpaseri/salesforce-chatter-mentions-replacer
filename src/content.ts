import { Mention } from '~/types/mention';
import { Caret } from '~/util';
import { MentionDao } from './dao';

(class Lex {
	public static async main() {
		const instance = new Lex();
		chrome.storage.sync.onChanged.addListener((changes) => {
			if (MentionDao.KEY in changes) instance.#update();
		});
		await instance.#update();
		instance.#installEventHandler();
	}

	#keys: string[] = [];
	#mentions: Map<string, Mention> = new Map();
	async #update() {
		const origin = window.location.origin;
		const keys: string[] = [];
		const mentions = (await MentionDao.readAsStrict()).reduce((map, mention) => {
			// 末尾のスラッシュは許容
			if (mention.env === origin || mention.env === `${origin}/`) {
				keys.push(mention.key); // 適用順の維持が目的 // TODO:過去の名残。同一のenv-keyの組み合わせを原則認めていないので維持しなくていいかも。
				map.set(mention.key, mention);
			}
			return map;
		}, new Map<string, Mention>());
		this.#keys = keys;
		this.#mentions = mentions;
	}

	#EDITORS_CLASSES = ['ql-editor', 'slds-rich-text-area__content'] as const;
	#match(event: Event) {
		if (!(event.target instanceof HTMLElement)) return false;
		for (const c of this.#EDITORS_CLASSES) {
			if (!event.target.classList.contains(c)) return false;
		}
		return true;
	}

	#installEventHandler() {
		window.document.body.addEventListener('focusout', (ev) => {
			if (this.#match(ev)) this.#execute(ev.target as Element);
		});
		window.document.body.addEventListener(
			'keydown',
			(ev) => {
				if (!this.#match(ev)) return; // do nothing
				if (ev.key === 'Enter' && ev.commandKey) {
					this.#execute(ev.target as Element);
					return;
				}
				if (ev.key === '@' && ev.altKey) {
					ev.preventDefault();
					ev.stopPropagation();
					const target = ev.target as HTMLElement;
					// contenteditableはtextareaと違ってカーソル(caret)の位置がコントロールしにくい。
					// 自前で実装せず、リッチテキストエリアのライブラリのようなものを使うのが定石のようだ。
					// しかし、拡張機能側は既に作られたcontenteditableに対して操作をしたいので話が別。
					// LEXのchatterはQuillで作成されており、ql-containerのクラスを持つDOM要素には
					// Quillのクラスインスタンスが存在するため、操作は出来る。
					// しかし、jsの動作する世界が違うため拡張機能からではQuillのクラスインスタンスを操作できない。
					// 一応、backgroundにpostMessage→backgroundからexecuteScript の手順を踏めばできるかもしれない。
					// ただ、要求権限が増えてしまうことに加えて、何よりも手間。
					// そもそも、DOMの要素を書き換えているので、完全なカーソル位置の復元は不可能（計算すればやれなくはないか...？）
					// stackoverflowやgist、codepenなどを参考に簡易的なカーソル位置復元クラスを作ることにする。
					const caret = new Caret(target);
					caret.save();
					this.#execute(target);
					caret.load(); // executeによって文字数が変わっているだろうから、元通りにはならない。
				}
			},
			true,
		);
	}

	#execute(root: Element) {
		const childNodes = root.childNodes;
		for (const node of childNodes) {
			switch (node.nodeType) {
				case Node.ELEMENT_NODE:
					this.#elements(node as Element);
					break;
				case Node.TEXT_NODE:
					this.#texts(node as Text);
					break;
				default:
					break;
			}
		}
	}
	#elements(element: Element) {
		switch (true) {
			case element instanceof HTMLAnchorElement: // | <a/>
			case element instanceof HTMLBRElement: //     | <br/>
			case element instanceof HTMLImageElement: //  | <img/>
			case element instanceof HTMLPreElement: //    | <pre/>
			case element instanceof HTMLSpanElement && element.classList.contains('ql-chatter-mention'): // メンション
			case element.tagName === 'CODE': //           | <code/>
				return;
			default:
				this.#execute(element);
		}
	}
	#texts(text: Text) {
		if (text.textContent == null) return;
		for (const key of this.#keys) {
			const data = this.#mentions.get(key);
			if (data == null) continue;
			const before = text.textContent;
			const after = before.replaceAll(
				key,
				`<span class="ql-chatter-mention quill_widget_element" contenteditable="false" tabindex="-1" data-widget="chatterMention" data-mention="${data.sfid}">@[${data.name}]</span>&ZeroWidthSpace;&nbsp;`,
			);
			if (before !== after) {
				const tmp = document.createElement('div');
				tmp.innerHTML = after;
				this.#execute(tmp); // 作られたspanタグなどを考慮して、tmpごと再解析
				text.replaceWith(...tmp.childNodes);
				break; // 残りのメンションは、全て this.#execute を呼び出したことで構築されているはず。breakでOK
			}
		}
	}
}).main();
