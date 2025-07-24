import { SpecCommon, SpecParams } from "@/library/sva/ontology";
import { Subtype } from "@/utility";
import { Game, GameView } from "./ontology";
import { GameAction } from "./action";

export const name = "text-adventure-v3" as const;

export type N = typeof name;

/**
 * params
 */
export type P = Subtype<
  {
    initialization: {
      prompt: string;
    };
    action: {
      prompt: string;
    };
  },
  SpecParams
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
  gameActions: GameAction[];
};

export const spec: SpecCommon<N> = { name };
