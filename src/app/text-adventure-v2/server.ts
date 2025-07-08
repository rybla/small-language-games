"use server";

import { stringify } from "@/utility";
import * as fs from "fs/promises";
import path from "path";
import { rootName } from "./common";
import { GenerateGame, GeneratePlayerTurn } from "./flow";
import { Game, GameId, GameMetadata } from "./ontology";
import { interpretAction, InterpretActionError } from "./semantics";

const gamesDirpath = path.join(".", "public", rootName);

function gameDirpath(id: GameId) {
  return path.join(".", "public", rootName, id);
}

function getGameFilepath(id: GameId) {
  return path.join(gameDirpath(id), "game.json");
}

async function saveGame(game: Game) {
  await fs.mkdir(gameDirpath(game.metadata.id), { recursive: true });
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
}

export async function getGame(id: GameId): Promise<Game> {
  return Game().parse(
    JSON.parse(await fs.readFile(getGameFilepath(id), "utf8")),
  );
}

export async function getSavedGameMetadatas(): Promise<GameMetadata[]> {
  const filenames = await fs.readdir(gamesDirpath);
  return await Promise.all(
    filenames.map(
      async (filename) =>
        Game().parse(
          JSON.parse(
            await fs.readFile(
              path.join(gameDirpath(filename as GameId), "game.json"),
              "utf8",
            ),
          ),
        ).metadata,
    ),
  );
}

export async function promptGame(
  gameId: GameId,
  prompt: string,
): Promise<void> {
  const game = await getGame(gameId);
  const { turn } = await GeneratePlayerTurn({
    game,
    prompt,
  });

  const errors: string[] = [];
  for (const action of turn.actions) {
    try {
      interpretAction(game.world, action);
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
