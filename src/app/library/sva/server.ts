import { z } from "genkit";
import { ai } from "@/backend/ai";
import { Inst, SpecServer } from "./ontology";

export async function run<Name extends string, State, View, Action>(
  impl: SpecServer<Name, State, View, Action>,
  inst: Inst<Name, State, View, Action>,
  prompt: string,
): Promise<{
  state: State;
  actions: Action[];
  description: string;
}> {
  const view = impl.view(inst.state);
  const promptMessages = impl.printPromptMessages(view, prompt);
  // ai.generate()
  throw new Error("Not implemented");
}
