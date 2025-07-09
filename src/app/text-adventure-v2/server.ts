"use server";

import { fromDataUrlToBuffer, stringify } from "@/utility";
import * as fs from "fs/promises";
import path from "path";
import { rootName } from "./common";
import { GenerateGame, GeneratePlayerTurn } from "./flow";
import { Game, GameId, GameMetadata, ItemImage, ItemName } from "./ontology";
import { interpretAction, InterpretActionError } from "./semantics";
import filenamify from "filenamify";

const gamesDirpath = path.join(".", "public", rootName);

function gameDirpath(id: GameId) {
  return path.join(".", "public", rootName, id);
}

function getGameFilepath(id: GameId) {
  return path.join(gameDirpath(id), "game.json");
}

function getItemImageDirpath(id: GameId) {
  return path.join(gameDirpath(id), "item");
}

function getItemImageFilepath(id: GameId, item: ItemName) {
  return path.join(gameDirpath(id), "item", filenamify(item) + ".png");
}

// ------------------------------------------------

async function saveGame(game: Game) {
  await fs.mkdir(gameDirpath(game.metadata.id), { recursive: true });
  await fs.writeFile(
    getGameFilepath(game.metadata.id),
    stringify(game),
    "utf8",
  );
}

async function saveItemImage(id: GameId, itemImage: ItemImage) {
  await fs.mkdir(getItemImageDirpath(id), { recursive: true });
  await fs.writeFile(
    getItemImageFilepath(id, itemImage.item),
    fromDataUrlToBuffer(itemImage.dataUrl),
  );
}

export async function initializeGame(prompt: string): Promise<GameMetadata> {
  const { game, itemImages } = await GenerateGame({ prompt });

  await saveGame(game);
  await Promise.all(
    itemImages.map(
      async (itemImage) => await saveItemImage(game.metadata.id, itemImage),
    ),
  );

  return game.metadata;
}

export async function getGame(id: GameId): Promise<Game> {
  return Game().parse(
    JSON.parse(await fs.readFile(getGameFilepath(id), "utf8")),
  );
}

export async function getSavedGameMetadatas(): Promise<GameMetadata[]> {
  const filenames = await fs.readdir(gamesDirpath);
  return await Promise.all(
    filenames
      .filter((filename) => !filename.includes("."))
      .map(
        async (filename) =>
          Game().parse(
            JSON.parse(
              await fs.readFile(getGameFilepath(filename as GameId), "utf8"),
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
