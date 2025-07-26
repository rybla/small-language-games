"use server";

import { Inst, InstClient, SpecServer } from "@/library/sva/ontology";
import * as server from "@/library/sva/server";
import { err, fromDataUrlToBuffer, ok, Result } from "@/utility";
import filenamify from "filenamify";
import { interpretGameAction } from "./action";
import * as constant from "./constant";
import { A, N, name, P, S, V } from "./constant";
import * as flow from "./flow";
import { ItemName } from "./ontology";
import { getGameView } from "./semantics";

var inst: Inst<N, S, A> | undefined;

function getImageFilenameOfItemName(itemName: ItemName) {
  return `${filenamify(itemName)}.png`;
}

const spec: SpecServer<N, P, S, V, A> = {
  ...constant.spec,
  async initializeState(metadata, params) {
    const { game } = await flow.GenerateGame({ prompt: params.prompt });

    return {
      game,
    };
  },
  async generateAction(view, params, state) {
    const { gameAction } = await flow.GenerateAction({
      prompt: params.prompt,
      gameView: view.game,
      game: state.game,
    });
    const gameActions = [gameAction];
    const { description } = await flow.GenerateTurnDescription({
      prompt: params.prompt,
      gameView: view.game,
      game: state.game,
      gameActions,
    });
    return ok({
      action: {
        prompt: params.prompt,
        gameActions,
      },
      description,
    });
  },
  async interpretAction(inst, state, action) {
    for (const gameAction of action.gameActions) {
      interpretGameAction(state.game, gameAction);
    }
    for (const newRoom of state.game.world.newRooms) {
      // TODO
      // const { } = await flow.
    }
  },
  view(state) {
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
  if (inst === undefined) return err({ message: "inst === undefined" });
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
