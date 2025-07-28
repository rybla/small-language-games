import { fromNever, ticks } from "@/utility";
import * as fs from "fs/promises";
import path from "path";
import * as flow from "./flow";
import { XAction, XEffect, XFile, XPreAction, XState } from "./ontology";
import {
  addXFile,
  deleteXFile,
  freshXFileId,
  getFocus,
  getKidIds,
  getParentId,
  getTextContentFilepath,
  getXFile,
} from "./semantics";

export async function interpretXPreAction(
  state: XState,
  preaction: XPreAction,
): Promise<{ actions: XAction[]; effects: XEffect[] }> {
  const focus = getFocus(state);
  if (preaction.type === "CreateDirectory") {
    if (!(focus.type === "directory"))
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot create a directory ${ticks(preaction.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
          },
        ],
      };
    const file: XFile = {
      name: preaction.name,
      id: freshXFileId(),
      type: "directory",
    };
    addXFile(state, file, focus.id);
    return {
      actions: [
        {
          type: "CreateDirectory",
          name: preaction.name,
        },
      ],
      effects: [],
    };
  } else if (preaction.type === "CreateTextFile") {
    if (!(focus.type === "directory"))
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot create a text file ${ticks(preaction.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
          },
        ],
      };
    const { content } = await flow.GenerateTextContent({
      prompt: preaction.prompt,
    });
    const file: XFile = {
      name: preaction.name,
      id: freshXFileId(),
      type: "text",
    };
    addXFile(state, file, focus.id);
    const filepath = getTextContentFilepath("public", file.id);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, content);
    return {
      actions: [
        {
          type: "CreateTextFile",
          name: preaction.name,
          prompt: preaction.prompt,
        },
      ],
      effects: [],
    };
  } else if (preaction.type === "DeleteFile") {
    if (!(focus.type === "directory"))
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot delete a file ${ticks(preaction.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
          },
        ],
      };
    const kidIds = getKidIds(state, focus.id);
    const kidId = kidIds.find(
      (kidId) => getXFile(state, kidId).name === preaction.name,
    );
    if (kidId === undefined)
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot delete a file ${ticks(preaction.name)} because a file of that name is not in the working directory`,
          },
        ],
      };
    deleteXFile(state, kidId);
    return { actions: [{ type: "DeleteFile", id: kidId }], effects: [] };
  } else if (preaction.type === "OpenFile") {
    if (!(focus.type === "directory")) {
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot open a child file ${ticks(preaction.name)} when the focus ${ticks(focus.name)} is a non-directory file.`,
          },
        ],
      };
    }
    const kidIds = getKidIds(state, focus.id);
    const kidId = kidIds.find(
      (kidId) => getXFile(state, kidId).name === preaction.name,
    );
    if (kidId === undefined) {
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot open a file of the name ${ticks(preaction.name)} because a file of that name is not in the working directory ${ticks(focus.name)}`,
          },
        ],
      };
    }
    state.client.focus = kidId;
    return { actions: [{ type: "OpenFile", id: kidId }], effects: [] };
  } else if (preaction.type === "OpenParentDirectory") {
    const parentId = getParentId(state, focus.id);
    if (parentId === undefined)
      return {
        actions: [],
        effects: [
          {
            type: "Error",
            message: `You cannot open the parent directory of ${ticks(focus.name)} because it has no parent directory`,
          },
        ],
      };
    state.client.focus = parentId;
    return { actions: [{ type: "OpenParentDirectory" }], effects: [] };
  } else if (preaction.type === "ShowHelp") {
    return { actions: [{ type: "ShowHelp" }], effects: [] };
  } else {
    return fromNever(preaction);
  }
}
