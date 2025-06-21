import { z } from "genkit";
import { Game, GameAction } from "./ontology";

export type GenerateConsequence_input = z.infer<
  typeof GenerateConsequence_input
>;
export const GenerateConsequence_input = z.object({
  game: Game,
  action: GameAction,
});

export type GenerateConsequence_output = z.infer<
  typeof GenerateConsequence_output
>;
export const GenerateConsequence_output = z.object({
  consequence: z.string(),
});

export type GenerateActions_input = z.infer<typeof GenerateActions_input>;
export const GenerateActions_input = z.object({
  game: Game,
});

export type GenerateActions_output = z.infer<typeof GenerateActions_output>;
export const GenerateActions_output = z.object({
  options: z.array(GameAction),
});
