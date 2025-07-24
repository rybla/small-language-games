import { SpecCommon, SpecParams } from "@/library/sva/ontology";
import { Supertype } from "@/utility";
import { Game, GameView } from "./ontology";

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
    action: {
      prompt: string;
    };
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
export type V = {
  game: GameView;
};

/**
 * action
 */
export type A = {
  prompt: string;
};

export const spec: SpecCommon<N> = { name };
