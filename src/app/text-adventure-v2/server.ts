"use server";

import { stringify } from "@/utility";
import * as fs from "fs/promises";
import path from "path";
import {
  GenerateGame,
  GenerateItemsForRoom,
  GeneratePlayer,
  GenerateRoom,
  GeneratePlayerTurn,
} from "./flow";
import { Game, GameId, GameMetadata, PlayerName } from "./ontology";
import { interpretAction, InterpretActionError } from "./semantics";
import { rootName } from "./common";

const data_dirpath = `./src/app/${rootName}/data`;
const game_dirpath = path.join(data_dirpath, "game");

function getGameFilepath(id: GameId) {
  return path.join(game_dirpath, `${id}.json`);
}

async function saveGame(game: Game) {
  await fs.mkdir(game_dirpath, { recursive: true });
  await fs.writeFile(
    getGameFilepath(game.metadata.id),
    stringify(game),
    "utf8",
  );
}

export async function initializeGame(prompt: {
  game: string;
  room: string;
  player: string;
}): Promise<void> {
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

  const { items, itemLocations } = await GenerateItemsForRoom({
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
}

export async function getGame(id: GameId): Promise<Game> {
  return Game.parse(JSON.parse(await fs.readFile(getGameFilepath(id), "utf8")));
}

export async function getSavedGameMetadatas(): Promise<GameMetadata[]> {
  const filenames = await fs.readdir(game_dirpath);
  return await Promise.all(
    filenames.map(
      async (filename) =>
        Game.parse(
          JSON.parse(
            await fs.readFile(path.join(game_dirpath, filename), "utf8"),
          ),
        ).metadata,
    ),
  );
}

export async function promptGame(
  gameId: GameId,
  playerName: PlayerName,
  prompt: string,
): Promise<void> {
  const game = await getGame(gameId);
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
  saveGame(game);
}
