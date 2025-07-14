export type Domain<T> = T extends (x: infer A, ...xs: unknown[]) => unknown
  ? A
  : never;

export type Codomain<T> = T extends (...args: any) => infer B ? B : never;

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

export function findMapAll<A, B>(
  xs: A[],
  f: (x: A, i: number) => B | undefined,
): B[] {
  const ys: B[] = [];
  let i = 0;
  for (const x of xs) {
    const y = f(x, i);
    if (y !== undefined) ys.push(y);
    i++;
  }
  return ys;
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

export function unwords(...xs: string[]): string {
  return xs.join(" ");
}

export function commas(...xs: string[]): string {
  return xs.join(", ");
}

export function intercalate<A>(sep: A, ...xs: A[]): A[] {
  const ys: A[] = [];
  for (let i = 0; i < xs.length - 1; i++) ys.push(xs[i], sep);
  ys.push(xs[xs.length - 1]);
  return ys;
}

export function intercalateWithIndex<A>(
  sep: (i: number) => A,
  ...xs: A[]
): A[] {
  const ys: A[] = [];
  for (let i = 0; i < xs.length - 1; i++) ys.push(xs[i], sep(i));
  ys.push(xs[xs.length - 1]);
  return ys;
}

export function fromDataUrlToBuffer(dataUrl: string) {
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

export type NonEmptyArray<A> = [A, ...A[]];

export function isNonEmpty<A>(xs: A[]): xs is [A, ...A[]] {
  return xs.length !== 0;
}

export type Awaited<P extends Promise<any>> =
  P extends Promise<infer A> ? A : never;

export type Optionalize<O extends object> = {
  [K in keyof O]: O[K] | undefined;
};

export function deepcopy<A>(x: A): A {
  return JSON.parse(JSON.stringify(x));
}

export function spawnAsync(k: () => Promise<void>): void {
  void k();
}
