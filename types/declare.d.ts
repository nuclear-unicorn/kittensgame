/**
 * Type-only description of dojo 1.6's class system, tailored to how KG uses it.
 *
 * This file is NEVER executed and NEVER shipped — the browser doesn't know it
 * exists. It only tells the TypeScript checker (and the editor) what shape
 * `dojo.declare` has, so that `this.` inside class bodies is understood.
 *
 * There is deliberately NO per-game-class typing here. Class member types are
 * inferred by the checker directly from the object literals in the .js files.
 */

type AnyCtor = abstract new (...args: any[]) => any;

/** Merge the instance types of a tuple of constructors: [A, B] -> A & B */
type MixinInstances<T extends readonly AnyCtor[]> = T extends readonly [
	infer H extends AnyCtor,
	...infer R extends AnyCtor[]
]
	? InstanceType<H> & MixinInstances<R>
	: unknown;

interface DojoInheritable {
	/**
	 * dojo's dynamic super-call. Which base method it dispatches to is decided
	 * at runtime, so the checker cannot verify it — it accepts anything and
	 * returns `any`. This is the one deliberate blind spot of the shim.
	 */
	inherited(args: IArguments, newArgs?: any[]): any;
}

interface DojoDeclare {
	// dojo.declare("name", null, {...})
	<P extends object>(
		className: string,
		superclass: null,
		props: P & ThisType<P & DojoInheritable>
	): new (...args: any[]) => P & DojoInheritable;

	// dojo.declare("name", Base, {...})
	<B extends AnyCtor, P extends object>(
		className: string,
		superclass: B,
		props: P & ThisType<InstanceType<B> & P & DojoInheritable>
	): new (...args: any[]) => InstanceType<B> & P & DojoInheritable;

	// dojo.declare("name", [Base, MixinA, MixinB], {...})
	<B extends readonly AnyCtor[], P extends object>(
		className: string,
		superclasses: readonly [...B],
		props: P & ThisType<MixinInstances<B> & P & DojoInheritable>
	): new (...args: any[]) => MixinInstances<B> & P & DojoInheritable;
}

declare var dojo: {
	declare: DojoDeclare;

	// The rest of the dojo 1.6 surface KG uses, typed loosely for now.
	// Tighten these individually whenever it pays off.
	create(tag: string, attrs?: object | null, refNode?: any, pos?: string): HTMLElement;
	byId(id: string | HTMLElement): HTMLElement;
	connect(obj: any, event: string, context: any, method?: any, dontFix?: boolean): any;
	disconnect(handle: any): void;
	hitch(scope: object, method: Function | string, ...args: any[]): (...args: any[]) => any;
	partial(method: Function | string, ...args: any[]): (...args: any[]) => any;
	clone<T>(obj: T): T;
	mixin<A, B>(dest: A, source: B): A & B;
	forEach<T>(arr: ArrayLike<T>, callback: (item: T, idx: number, arr: ArrayLike<T>) => void, thisObject?: any): void;
	style(node: any, style?: string | object, value?: string | number): any;
	addClass(node: any, classStr: string): void;
	removeClass(node: any, classStr?: string): void;
	toggleClass(node: any, classStr: string, condition?: boolean): void;
	hasClass(node: any, classStr: string): boolean;
	place(node: any, refNode: any, position?: string | number): any;
	destroy(node: any): void;
	empty(node: any): void;
	query(selector: string, root?: any): any;
	subscribe(topic: string, context: any, method?: any): any;
	publish(topic: string, args?: any[]): void;
	setObject(name: string, value: any, context?: any): any;
	Deferred: new (canceller?: (d: any) => any) => any;
	isArray(it: any): it is any[];
};
