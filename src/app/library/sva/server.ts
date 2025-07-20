import * as common from "./common";
import { z } from "genkit";
import { ai } from "@/backend/ai";

/**
 * SVA -- state view action
 *
 * server
 */

export type SVA<State, View, Action> = {
  common: common.SVA<State, View, Action>;
  actionSchema: z.ZodType<Action>;
  view: (state: State) => View;
  printPromptMessages: (
    view: View,
    prompt: string,
  ) => {
    system: string;
    prompt: string;
  };

  actions: (state: State, view: View) => Action[];
};

export async function run<State, View, Action extends z.ZodType>(
  impl: SVA<State, View, Action>,
  state: State,
  prompt: string,
): Promise<{
  state: State;
  actions: Action[];
  description: string;
}> {
  const view = impl.view(state);
  const promptMessages = impl.printPromptMessages(view, prompt);
  // ai.generate()
  throw new Error("Not implemented");
}
