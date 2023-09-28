/**
 * 型の一致するフィールドのキーを抽出する
 * @example
 * type Obj = { a: boolean; b: string; };
 * type StrKeys = KeyofByType<Obj, string>; // 'b'
 */
export type KeyofByType<T extends Record<string, unknown>, PickedType = unknown> = {
	[K in keyof T]: T[K] extends PickedType ? K : never;
}[keyof T];

/**
 * 型の一致するフィールドだけを抽出する
 * @example
 * type Before = { a: boolean; b: string; };
 * type After = PickByType<Before, string>; // { b: string; }
 */
export type PickByType<T extends Record<string, unknown>, PickedType = unknown> = Pick<T, KeyofByType<T, PickedType>>;

/**
 * Requiredなフィールドのキーを抽出する
 * @example
 * type Obj = {a: string, b: boolean|undefined, c?: string};
 * type ReqKeys = RequiredKeys<Obj>; // 'a' | 'b'
 */
export type RequiredKeys<T> = { [K in keyof T]-?: Record<string, never> extends { [P in K]: T[K] } ? never : K }[keyof T];

/**
 * Optionalなフィールドのキーを抽出する
 * @example
 * type Obj = {a: string, b: boolean|undefined, c?: string};
 * type ReqKeys = OptionalKeys<Obj>; // 'c'
 */
export type OptionalKeys<T> = { [K in keyof T]-?: Record<string, never> extends { [P in K]: T[K] } ? K : never }[keyof T];

/**
 * Requiredなフィールドだけを抽出する
 * @example
 * type Before = { a?: boolean; b: string; };
 * type After = PickRequired<Before>; // { b: string; }
 */
export type PickRequired<T> = Pick<T, RequiredKeys<T>>;

/**
 * Optionalなフィールドだけを抽出する
 * @example
 * type Before = { a?: boolean; b: string; };
 * type After = PickOptional<Before>; // { a?: boolean; }
 */
export type PickOptional<T> = Pick<T, OptionalKeys<T>>;
