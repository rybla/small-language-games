import { Action, z } from "genkit";

export type ActionDomain<A> =
  A extends Action<infer I, z.ZodTypeAny, z.ZodTypeAny> ? z.infer<I> : never;

export type ActionCodomain<A> =
  A extends Action<z.ZodTypeAny, infer O, z.ZodTypeAny> ? z.infer<O> : never;
