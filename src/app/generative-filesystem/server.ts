"use server";

import { do_, isErr, sleep, stringify } from "@/utility";
import { exists } from "@/utility_fs";
import * as fs from "fs/promises";
import path from "path";
import { name } from "./common";
import * as flow from "./flow";
import { XFile, XFileId, XFileName, XState } from "./ontology";
import { getTextContentFilepath } from "./semantics";
import { interpretXPreAction } from "./action";

// -----------------------------------------------------------------------------

let state: XState = do_(() => {
  const root: XFile = {
    name: XFileName.parse("root"),
    id: XFileId.parse("root"),
    type: "directory",
  };
  return {
    system: {
      name: "xsystem",
      root,
      files: {
        [root.id]: root,
      },
      parents: {},
    },
    client: {
      turns: [],
      focus: root.id,
    },
  };
});

export async function getXState(): Promise<XState> {
  return state;
}

// -----------------------------------------------------------------------------
// submit
// -----------------------------------------------------------------------------

export async function submit(prompt: string): Promise<void> {
  const { preaction } = await flow.GenerateXPreAction({
    state,
    prompt,
  });
  const { actions, effects } = await interpretXPreAction(state, preaction);
  state.client.turns.push({ prompt, actions, effects });
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
      const json = JSON.parse(await fs.readFile(system_filepath, "utf8"));
      const result = XState.safeParse(json);
      // if the old state doesn't parse, then just reset it
      if (!result.success) {
        await save();
        return;
      }
      state = result.data;
    }),
  ]);
}

export async function save(): Promise<void> {
  await fs.mkdir(path.dirname(system_filepath), { recursive: true });
  await fs.writeFile(system_filepath, stringify(state), "utf8");
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
