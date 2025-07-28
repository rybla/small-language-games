import { fromNever, ticks } from "@/utility";
import * as flow from "./flow";
import { XAction, XEffect, XFile, XState } from "./ontology";
import * as fs from "fs/promises";
import {
  addXFile,
  freshXFileId,
  getTextContentFilepath,
  getXFile,
  getXFileAt,
} from "./semantics";
import path from "path";

export async function runXActions(
  state: XState,
  actions: XAction[],
): Promise<XEffect[]> {
  const effects: XEffect[] = [];
  for (const action of actions) {
    const focus = getXFileAt(state.system, state.client.path);
    if (action.type === "OpenFile") {
      if (!(focus.type === "directory")) {
        effects.push({
          type: "Error",
          message: `You cannot focus on a child file ${ticks(action.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
        });
        continue;
      }
      if (
        focus.kidIds.find(
          (kidId) => getXFile(state.system, kidId).name === action.name,
        ) === undefined
      ) {
        effects.push({
          type: "Error",
          message: `You cannot open a file of the name ${ticks(action.name)} because a file of that name is not in the working directory ${ticks(focus.name)}`,
        });
      }
      state.client.path.push(action.name);
    } else if (action.type === "CreateChildDirectory") {
      if (!(focus.type === "directory")) {
        effects.push({
          type: "Error",
          message: `You cannot create a child directory ${ticks(action.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
        });
        continue;
      }
      const file: XFile = {
        name: action.name,
        id: freshXFileId(),
        type: "directory",
        kidIds: [],
      };
      addXFile(state.system, file, focus);
    } else if (action.type === "CreateTextFile") {
      if (!(focus.type === "directory")) {
        effects.push({
          type: "Error",
          message: `You cannot create a text file ${ticks(action.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
        });
        continue;
      }
      const { content } = await flow.GenerateTextContent({
        prompt: action.prompt,
      });
      const file: XFile = {
        name: action.name,
        id: freshXFileId(),
        type: "text",
      };
      addXFile(state.system, file, focus);
      const filepath = getTextContentFilepath("public", file.id);
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, content);
    } else if (action.type === "DeleteFile") {
      if (!(focus.type === "directory")) {
        effects.push({
          type: "Error",
          message: `You cannot delete a file ${ticks(action.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
        });
        continue;
      }
      const kidIndex = focus.kidIds.findIndex(
        (kidId) => getXFile(state.system, kidId).name === action.name,
      );
      if (kidIndex === -1) {
        effects.push({
          type: "Error",
          message: `You cannot delete the file ${ticks(action.name)} because a file of that name is not in the working directory ${ticks(focus.name)}`,
        });
      }
      focus.kidIds.splice(kidIndex, 1);
    } else if (action.type === "ShowHelpFileXAction") {
      if (true) {
        effects.push({
          type: "Error",
          message: `action ${action.type} is unimplemented`,
        });
        continue;
      }
    } else if (action.type === "OpenParentDirectory") {
      if (state.client.path.length === 0) {
        effects.push({
          type: "Error",
          message: `You cannot open the parent directory when the working directory is the root directory.`,
        });
      }
      state.client.path.pop();
    } else {
      fromNever(action);
    }
  }
  return effects;
}
