
type Constructable = new (...args: any[]) => {}

export type Dojo = {
  version: {
    minor: number;
  };
  addClass: (element: HTMLElement, className: string) => void;
  byId: (id: string) => HTMLElement;
  clone: <TSubject>(subject: TSubject) => TSubject;
  connect: (subject: unknown, event: string, bindThis: unknown, callback: () => unknown) => void;
  create: (
    nodeType: string,
    properties: Record<string, unknown>,
    parent: HTMLElement
  ) => HTMLElement;
  declare: (clazz: string, mixin: any, definition: object) => Constructable;
  destroy: (subject: unknown) => void;
  empty: <TElement extends HTMLElement>(arg: TElement) => TElement;
  forEach: <T>(subject: Array<T>, callback: (element: T) => void) => void;
  hasClass: (element: HTMLElement, className: string) => boolean;
  hitch: <TFunction>(bindThis: unknown, bindMethod: TFunction) => TFunction;
  publish: (topic: string, arg: Array<unknown> | unknown) => void;
  removeClass: (element: HTMLElement, className: string) => void;
  style: (element: HTMLElement, attribute: string, value: string) => void;
  subscribe: (event: string, handler: any) => void;
};

declare global {
  const dojo: Dojo;
  const classes: {
    KGConfig: KGConfig
  }
}