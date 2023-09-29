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
				keys.push(mention.key); // 適用順の維持が目的。zoo,fizzの順に登録されていて、 fizzooと打たれたら、fiz@[zoo]になる漢字。良いのかな...
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
		// "fizzbuzzfoobar" の 1つのTextを bar→fizz の順でメンション変換を適用する時を考える。
		// 以前は Text.textContent.replaceAll で keyを <span/> の文字列に置換し、適当な要素のinnerHTMLとすることでタグに変えていた。
		// ただ、 https://github.com/yabpaseri/salesforce-chatter-mentions-replacer/issues/1 にも書いた通り、HTMLインジェクションが可能になってしまう。
		// sfidは 15or18文字の英数字で制限しているので問題ないが、nameでインジェクション可能。
		// ということで、"fizzbuzzfoobar" → "fizzbuzzfoo""bar" → "fizz""buzzfoo""bar" のように複数Textに分割してから、
		// textContentがkeyと一致するTextをreplaceWithでHTMLSpanElementと置換してやる必要がある。
		if (text.textContent == null) return;
		const matched = new Set<Text>();
		const remain = new Set<Text>([text]);
		for (const key of this.#keys) {
			// textSplitWithKey でText内の全keyは分割させるので、この時点での Text さえ見られば良い。
			const mirror = [...remain];
			remain.clear();
			for (const re of mirror) {
				const res = this.#textSplitWithKey(re, key);
				for (const m of res.matched) matched.add(m);
				for (const o of res.others) remain.add(o);
			}
		}

		// matched内のTextだけ、一致するものにreplaceしていく。
		for (const target of matched) {
			const data = this.#mentions.get(target.textContent ?? '');
			if (data) target.replaceWith(this.#createMentionElement(data));
		}
	}

	/**
	 * Textをkeyに完全一致する箇所で区切り返却する  \
	 * Text="fizzbuzzfoofizzbar", key="fizz" だとすると、
	 * {matched: ["fizz", "fizz"], others: ["buzzfoo", "bar"]}
	 * が返却される
	 * @param text
	 * @param key
	 * @returns 分割結果
	 */
	#textSplitWithKey(text: Text, key: string): { matched: Set<Text>; others: Set<Text> } {
		const matched = new Set<Text>();
		const others = new Set<Text>();
		const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const searchRegex = new RegExp(`(^${escapedKey}(?=\\s)|(?<=\\s)${escapedKey}$|(?<=\\s)${escapedKey}(?=\\s)|^${escapedKey}$)`);
		const process = (text: Text) => {
			if (text.textContent == null || text.textContent === '') return; // do nothing
			const index = text.textContent.search(searchRegex);
			if (index < 0) {
				others.add(text);
				return;
			}
			const target = (() => {
				if (index === 0) return text;
				const t = text.splitText(index); // splitTextは、分割した前半が元の要素(text)の値に、後半が返却値になる
				others.add(text);
				return t;
			})();
			const remain = target.splitText(key.length); // これで、targetがkey分だけのTextになった
			matched.add(target);
			process(remain); // 残部分は再帰
		};
		process(text);
		return { matched, others };
	}

	#createMentionElement(mention: Mention): HTMLSpanElement {
		const span = document.createElement('span');
		span.classList.add('ql-chatter-mention', 'quill_widget_element');
		span.contentEditable = 'false';
		span.tabIndex = -1;
		span.setAttribute('data-widget', 'chatterMention');
		span.setAttribute('data-mention', mention.sfid);
		span.textContent = `@[${mention.name}]`;
		return span;
	}
}).main();
