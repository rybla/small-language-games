import { z } from "genkit";

// -----------------------------------------------------------------------------
// spec
// -----------------------------------------------------------------------------

export type SpecCommon<Name extends string, State, View, Action> = {
  name: Name;
};

export type SpecServer<Name extends string, State, View, Action> = {
  common: SpecCommon<Name, State, View, Action>;
  initializeState: (prompt: string) => Promise<State>;
  actionSchema: (state: State, view: View) => z.ZodType<Action>;
  view: (state: State) => View;
  printPromptMessages: (
    view: View,
    prompt: string,
  ) => {
    system: string;
    prompt: string;
  };
  interpretAction: (state: State, action: Action) => Promise<State>;
};

export type SpecClient<Name extends string, State, View, Action> = {
  common: SpecCommon<Name, State, View, Action>;
  renderView: (view: View) => React.ReactNode;
};

// -----------------------------------------------------------------------------
// inst
// -----------------------------------------------------------------------------

export type Inst<Name extends string, State, View, Action> = {
  name: Name;
  id: string;
  state: State;
  turns: Turn<State, Action>[];
};

export type Turn<State, Action> = {
  state: State;
  action: Action;
  description: string;
};
