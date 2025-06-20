export const do_ = <A>(a: () => A): A => a();

export const and = (bs: boolean[]): boolean => bs.every((b) => b);
