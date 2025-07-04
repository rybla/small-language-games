export type Domain<T> = T extends (x: infer A, ...xs: unknown[]) => unknown
  ? A
  : never;

export type Codomain<T> = T extends (...xs: unknown[]) => infer B ? B : never;

export type UnPromise<T> = T extends Promise<infer A> ? A : never;
