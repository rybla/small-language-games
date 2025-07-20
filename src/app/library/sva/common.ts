import type { z } from "genkit";

/**
 * SVA -- state view action
 *
 * frontend
 */

export type SVA<State, View, Action> = {
  name: string;
  initialState: State;
};
