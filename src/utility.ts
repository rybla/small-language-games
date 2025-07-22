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

export function complementRecord<
  K extends string | number | symbol,
  V,
  R1 extends Record<K, V>,
  R2 extends Record<keyof R1, V>,
>(r1_minus_r2: Omit<R1, keyof R2>, r2: R2): R1 {
  // @ts-ignore r1 - r2 + r2 = r1
  return { ...r1_minus_r2, ...r2 };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Non-inclusive range.
 */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, index) => index);
}

export type Result<E extends object, A extends object> =
  | ({ type: "err" } & E)
  | ({ type: "ok" } & A);

export function err<E extends object, A extends object>(e: E): Result<E, A> {
  return { type: "err", ...e };
}

export function ok<A extends object, E extends object>(a: A): Result<E, A> {
  return { type: "ok", ...a };
}

export function isErr<E extends object, A extends object>(
  result: Result<E, A>,
): result is { type: "err" } & E {
  return result.type === "err";
}

export function isOk<E extends object, A extends object>(
  result: Result<E, A>,
): result is { type: "ok" } & A {
  return result.type === "ok";
}

export function TODO(msg?: string): any {
  throw new Error(`TODO${msg === undefined ? "" : ` ${msg}`}`);
}

export function fromNever(x: never): any {
  throw new Error(`Unexpected value that has type \`never\`: ${x}`);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}
