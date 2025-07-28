"use server";

import { do_, sleep, stringify } from "@/utility";
import { exists } from "@/utility_fs";
import * as fs from "fs/promises";
import path from "path";
import { runXActions } from "./action";
import { name } from "./common";
import * as flow from "./flow";
import { XFileId, XFileName, XState } from "./ontology";
import { getTextContentFilepath } from "./semantics";

// -----------------------------------------------------------------------------

let state: XState = {
  system: {
    name: "xsystem",
    root: {
      name: XFileName.parse("home"),
      id: XFileId.parse("home"),
      type: "directory",
      kidIds: [],
    },
    files: {},
  },
  client: {
    turns: [],
    path: [],
  },
};

export async function getXState(): Promise<XState> {
  return state;
}

// -----------------------------------------------------------------------------
// submit
// -----------------------------------------------------------------------------

export async function submit(prompt: string): Promise<void> {
  const { actions } = await flow.GenerateXActions({
    state,
    prompt,
  });
  await runXActions(state, actions);
  await save();
}

// -----------------------------------------------------------------------------
// load and save
// -----------------------------------------------------------------------------

const system_filepath = path.join("public", name, "system.json");

export async function load(): Promise<void> {
  await Promise.all([
    do_(async () => {
      await sleep(1000);
    }),
    do_(async () => {
      if (!(await exists(system_filepath))) {
        await save();
      }
      const { success, data } = XState.safeParse(
        JSON.parse(await fs.readFile(system_filepath, "utf8")),
      );
      // if the old state doesn't parse, then just reset it
      if (!success) {
        await save();
        return;
      }
      state = data;
    }),
  ]);
}

export async function save(): Promise<void> {
  await fs.mkdir(path.dirname(system_filepath), { recursive: true });
  await fs.writeFile(system_filepath, stringify({ state }), "utf8");
}

// -----------------------------------------------------------------------------
// content
// -----------------------------------------------------------------------------

export async function fetchTextContent(
  id: XFileId,
): Promise<string | undefined> {
  const filepath = getTextContentFilepath("public", id);
  if (!(await exists(filepath))) return undefined;
  return await fs.readFile(filepath, "utf8");
}
