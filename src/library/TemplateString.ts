import { complementRecord } from "@/utility";

export type TemplateString<P extends Record<string, string>> = (
  params: P,
) => string;

export function sub<
  P1 extends Record<string, string>,
  P2 extends Record<keyof P1, string>,
>(t: TemplateString<P1>, p2: P2): TemplateString<Omit<P1, keyof P2>> {
  return (p1) => t(complementRecord(p1, p2));
}

export function run(t: TemplateString<{}>): string {
  return t({});
}
