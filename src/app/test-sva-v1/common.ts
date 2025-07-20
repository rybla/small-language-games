import { SpecCommon } from "../library/sva/ontology";

export const rootName = "test-sva-v1";

export const name = "test-sva-v1" as const;

export type N = typeof name;

export type P = {
  initialization: {};
  action:
    | { type: "set counter"; counter: CounterName }
    | { type: "increment this counter" };
};

type CounterName = "counter1" | "counter2";

export type S = { counter: CounterName } & {
  [K in CounterName]: number;
};

export type V = { counter: CounterName; value: number };

export type A =
  | { type: "set counter"; counter: CounterName }
  | { type: "increment counter"; counter: CounterName };

export const spec: SpecCommon<typeof name> = {
  name,
};
