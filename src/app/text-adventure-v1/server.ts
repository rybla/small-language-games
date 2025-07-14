"use server";

import { stringify } from "@/utility";
import filenamify from "filenamify";
import * as fs from "fs/promises";
import path from "path";
import {
  GenerateGame,
  GenerateRoomItems,
  GeneratePlayer,
  GenerateRoom,
  GeneratePlayerTurn,
} from "./flow";
import { Game, GameName, PlayerName } from "./ontology";
import { interpretAction, InterpretActionError } from "./semantics";

const data_dirpath = `./src/app/text-adventure-v1/data`;
const game_dirpath = path.join(data_dirpath, "game");

function getGameNameFilepath(name: GameName) {
  return path.join(
    game_dirpath,
    `${filenamify(name, { replacement: "_" }).replaceAll(" ", "_")}.json`,
  );
}

async function saveGame(game: Game) {
  await fs.mkdir(game_dirpath, { recursive: true });
  await fs.writeFile(getGameNameFilepath(game.name), stringify(game), "utf8");
}

export async function initializeGame(prompt: {
  game: string;
  room: string;
  player: string;
}): Promise<GameName> {
  const { game } = await GenerateGame({
    prompt: prompt.game,
  });
  await saveGame(game);

  const { room } = await GenerateRoom({
    game,
    prompt: prompt.room,
  });
  game.world.rooms.push(room);
  await saveGame(game);

  const { items, itemLocations } = await GenerateRoomItems({
    game,
    room: room.name,
  });
  game.world.items.push(...items);
  game.world.itemLocations.push(...itemLocations);
  await saveGame(game);

  const { player, playerLocation } = await GeneratePlayer({
    game,
    room: room.name,
    prompt: prompt.player,
  });
  game.world.players.push(player);
  game.world.playerLocations.push(playerLocation);
  await saveGame(game);

  return game.name;
}

export async function getGame(name: GameName): Promise<Game> {
  return Game.parse(
    JSON.parse(await fs.readFile(getGameNameFilepath(name), "utf8")),
  );
}

export async function getSavedGameNames(): Promise<GameName[]> {
  const filenames = await fs.readdir(game_dirpath);
  return await Promise.all(
    filenames.map(
      async (filename) =>
        Game.parse(
          JSON.parse(
            await fs.readFile(path.join(game_dirpath, filename), "utf8"),
          ),
        ).name,
    ),
  );
}

export async function promptGame(
  gameName: GameName,
  playerName: PlayerName,
  prompt: string,
): Promise<void> {
  const game = await getGame(gameName);
  const { turn } = await GeneratePlayerTurn({
    game,
    name: playerName,
    prompt,
  });

  const errors: string[] = [];
  for (const action of turn.actions) {
    try {
      interpretAction(game.world, playerName, action);
    } catch (exception: unknown) {
      if (exception instanceof InterpretActionError) {
        errors.push(exception.message);
      } else {
        throw exception;
      }
    }
  }

  if (errors.length > 0)
    throw new Error(`interpret action errors:\n${errors.join("\n")}`);

  game.turns.push(turn);
  await saveGame(game);
}
