export type Domain<T> = T extends (x: infer A, ...xs: unknown[]) => unknown
  ? A
  : never;

export type Codomain<T> = T extends (...xs: unknown[]) => infer B ? B : never;

export type UnPromise<T> = T extends Promise<infer A> ? A : never;

export function findMap<A, B>(
  xs: A[],
  f: (x: A, i: number) => B | undefined,
): B | undefined {
  let i = 0;
  for (const x of xs) {
    const y = f(x, i);
    if (y !== undefined) return y;
    i++;
  }
  return undefined;
}

export function findRemove<A>(xs: A[], f: (x: A, i: number) => boolean): void {
  const i = xs.findIndex((x, i) => f(x, i));
  if (i > -1) xs.splice(i, 1);
}

export function remove<A>(xs: A[], x: A) {
  findRemove(xs, (y) => x == y);
}

export function do_<A>(k: () => A): A {
  return k();
}

export function stringify(x: unknown): string {
  return JSON.stringify(x, null, 4);
}

export function quoteblockMd(s: string): string {
  return s
    .split("\n")
    .map((s) => `> ${s}`)
    .join("\n");
}

export function indent(s: string, level = 1): string {
  return s
    .split("\n")
    .map((s) => `${"  ".repeat(level)}${s}`)
    .join("\n");
}

export function id<A>(x: A): A {
  return x;
}
