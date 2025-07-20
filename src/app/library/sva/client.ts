import * as common from "./common";
import type { z } from "genkit";

/**
 * SVA -- state view action
 *
 * client
 */

export type SVA<State, View, Action> = {
  common: common.SVA<State, View, Action>;
  renderView: (view: View) => React.ReactNode;
};
