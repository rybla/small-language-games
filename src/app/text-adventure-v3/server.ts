"use server";

import { Inst, InstClient, SpecServer } from "@/library/sva/ontology";
import * as server from "@/library/sva/server";
import {
  err,
  fromDataUrlToBuffer,
  index_safe,
  ok,
  Result,
  stringify,
  TODO,
} from "@/utility";
import * as fs from "fs/promises";
import filenamify from "filenamify";
import {
  GenerateAction,
  GenerateTurnDescription,
  interpretGameAction,
} from "./action";
import * as constant from "./constant";
import { A, N, name, P, S, V } from "./constant";
import * as flow from "./flow";
import { ItemName, RoomName } from "./ontology";
import {
  addItem,
  addRoom,
  addRoomConnection,
  getGameView,
  getItem,
  getPlayerRoom,
  getRoom,
  visitRoom,
} from "./semantics";
import { exists } from "@/utility_fs";
import Paths from "@/library/sva/paths";

const paths = new Paths("public");

var inst: Inst<N, S, A> | undefined;

const spec: SpecServer<N, P, S, V, A> = {
  ...constant.spec,
  async initializeState(metadata, params) {
    const { game } = await flow.GenerateGame({ prompt: params.prompt });

    return {
      game,
    };
  },
  async generateAction(view, params, state) {
    const { gameAction } = await GenerateAction({
      prompt: params.prompt,
      gameView: view.game,
      game: state.game,
    });
    const gameActions = [gameAction];
    return ok({
      action: {
        prompt: params.prompt,
        gameActions,
      },
    });
  },
  async interpretAction(inst, state, view, action) {
    const gameActionDescriptions: string[] = [];

    for (const gameAction of action.gameActions) {
      const description = await interpretGameAction(
        state.game,
        action,
        gameAction,
      );
      gameActionDescriptions.push(description);
    }

    console.log("[interpretAction]", stringify({ gameActionDescriptions }));

    const { description } = await GenerateTurnDescription({
      game: inst.state.game,
      gameView: view.game,
      prompt: action.prompt,
      gameActionDescriptions,
    });
    return description;
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

export async function resetInstToRightBeforeTurn(i: number) {
  if (inst === undefined) return;
  const turn = index_safe(i, inst.turns);
  if (turn === undefined) throw new Error("Invalid turn index");
  inst.turns = inst.turns.slice(0, i);
  inst.state = turn.state;
}

export async function generateInstName(): Promise<string> {
  if (inst === undefined) throw new Error("inst === undefined");
  return (await flow.GenerateGameName({ game: inst.state.game })).name;
}

export async function getInstMetadatas() {
  return await server.getInstMetadatas(name);
}

function getItemImageFilename(itemName: ItemName): string {
  return `${filenamify(itemName)}.png`;
}

export async function loadItemImageFilename(
  itemName: ItemName,
): Promise<string> {
  if (inst === undefined) throw new Error("inst === undefined");
  const filename = getItemImageFilename(itemName);
  if (
    !(await exists(
      paths.assetFilepath(
        spec.name,
        inst.metadata.id,
        getItemImageFilename(itemName),
      ),
    ))
  ) {
    const { dataUrl } = await flow.GenerateItemImage({
      game: inst.state.game,
      item: getItem(inst.state.game, itemName),
    });
    await server.saveAsset(
      spec.name,
      inst.metadata.id,
      filename,
      fromDataUrlToBuffer(dataUrl),
      "base64",
    );
  }
  return filename;
}

function getRoomImageFilename(roomName: RoomName): string {
  return `${filenamify(roomName)}.png`;
}

export async function loadRoomImageFilename(
  roomName: RoomName,
): Promise<string> {
  if (inst === undefined) throw new Error("inst === undefined");
  const filename = getRoomImageFilename(roomName);
  if (
    !(await exists(
      paths.assetFilepath(
        spec.name,
        inst.metadata.id,
        getRoomImageFilename(roomName),
      ),
    ))
  ) {
    const { dataUrl } = await flow.GenerateRoomImage({
      game: inst.state.game,
      room: getRoom(inst.state.game, roomName),
    });
    await server.saveAsset(
      spec.name,
      inst.metadata.id,
      filename,
      fromDataUrlToBuffer(dataUrl),
      "base64",
    );
  }
  return filename;
}
