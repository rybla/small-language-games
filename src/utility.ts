export const do_ = <A>(a: () => A): A => a();

export const and = (bs: boolean[]): boolean => bs.every((b) => b);

export const indent = (n: number, s: string): string =>
  s
    .split("\n")
    .map((line) => "    ".repeat(n) + line)
    .join("\n");

export const quoteblock = (s: string): string =>
  s
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
