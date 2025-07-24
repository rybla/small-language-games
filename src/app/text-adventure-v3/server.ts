"use server";

import { Inst, InstClient, SpecServer } from "@/library/sva/ontology";
import { N, S, A, V, P, name } from "./constant";
import * as constant from "./constant";
import * as server from "@/library/sva/server";
import { err, ok, Result, sleep, TODO } from "@/utility";
import { getGameView } from "./semantics";

var inst: Inst<N, S, A> | undefined;

const spec: SpecServer<N, P, S, V, A> = {
  ...constant.spec,
  async initializeState(params) {
    await sleep(1000);
    return {
      game: {
        world: {
          description: "TODO:description",
          player: {
            name: "TODO:name",
            description: "TODO:description",
            appearanceDescription: "TODO:appearanceDescription",
            room: "TODO:room",
          },
          rooms: {
            "TODO:room": {
              name: "TODO:room",
              description: "TODO:description",
              appearanceDescription: "TODO:appearanceDescription",
            },
          },
          items: {},
          itemLocations: {},
          roomConnections: {
            "TODO:room": [],
          },
        },
      },
    } satisfies S;
  },
  async generateAction(view, params) {
    return ok({
      action: {
        prompt: params.prompt,
      },
      description: `prompt: ${params.prompt}`,
    });
  },
  async interpretAction(inst, state, action) {
    return;
  },
  view(state) {
    console.dir({ state }, { depth: 100 });
    console.log(state.game.world.itemLocations);
    return {
      game: getGameView(state.game),
    };
  },
};

export async function getInst(): Promise<InstClient<V, A> | undefined> {
  if (inst === undefined) return undefined;
  return server.toInstClient(spec, inst);
}

export async function loadInst(id: string): Promise<void> {
  inst = await server.load<N, S, A>(name, id);
}

export async function initializeInst(
  params: P["initialization"],
): Promise<void> {
  inst = await server.initialize(spec, params);
}

export async function actInst(
  params: P["action"],
): Promise<Result<{ message: string }, {}>> {
  if (inst === undefined) return err({ message: "inst === unhdefined" });
  const result = await server.runPrompt(spec, inst, params);
  return result;
}

export async function saveInst(name?: string) {
  if (inst === undefined) return;
  if (name) inst.metadata.name = name;
  await server.saveInst(inst);
}

export async function getInstMetadatas() {
  return await server.getInstMetadatas(name);
}
