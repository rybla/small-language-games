import { SpecCommon, SpecParams } from "@/library/sva/ontology";
import { Supertype } from "@/utility";
import { Game } from "./ontology";

export const name = "text-adventure-v3" as const;

export type N = typeof name;

/**
 * params
 */
export type P = Supertype<
  SpecParams,
  {
    initialization: {
      prompt: string;
    };
    action: {};
  }
>;

/**
 * state
 */
export type S = {
  game: Game;
};

/**
 * view
 */
export type V = {};

/**
 * action
 */
export type A = {};

export const spec: SpecCommon<N> = { name };
