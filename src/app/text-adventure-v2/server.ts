"use server";

import { do_, fromDataUrlToBuffer, stringify } from "@/utility";
import * as fs from "fs/promises";
import {
  GenerateGame,
  GeneratePlayerTurn,
  GenerateRoomConnections,
  GenerateRoomImage,
  GenerateRoomItems,
} from "./flow";
import { Game, GameId, GameMetadata, ItemImage, RoomImage } from "./ontology";
import {
  getPlayerRoom,
  interpretAction,
  InterpretActionError,
  isVisited,
} from "./semantics";
import { paths } from "./common_backend";
import { existsSync } from "fs";

// ------------------------------------------------

async function saveGame(game: Game) {
  await fs.mkdir(paths.getGameDirpath(game.metadata.id), { recursive: true });
  await fs.writeFile(
    paths.getGameFilepath(game.metadata.id),
    stringify(game),
    "utf8",
  );
}

async function saveItemImage(id: GameId, itemImage: ItemImage) {
  await fs.mkdir(paths.getItemImagesDirpath(id), {
    recursive: true,
  });
  await fs.writeFile(
    paths.getItemImageFilepath(id, itemImage.item),
    fromDataUrlToBuffer(itemImage.dataUrl),
  );
}

async function saveRoomImage(id: GameId, roomImage: RoomImage) {
  await fs.mkdir(paths.getRoomImagesDirpath(id), {
    recursive: true,
  });
  await fs.writeFile(
    paths.getRoomImageFilepath(id, roomImage.room),
    fromDataUrlToBuffer(roomImage.dataUrl),
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
  const gameFilepath = paths.getGameFilepath(id);
  console.dir({ id, gameFilepath });
  return Game().parse(JSON.parse(await fs.readFile(gameFilepath, "utf8")));
}

export async function getSavedGameMetadatas(): Promise<GameMetadata[]> {
  const gameIds = await do_(async () => {
    const filenames = await fs.readdir(paths.getGamesDirpath());
    const gameIds: GameId[] = [];
    for (const filename of filenames) {
      const gameId = GameId.parse(filename);
      const filepath = paths.getGameDirpath(gameId);
      if (existsSync(filepath) && (await fs.stat(filepath)).isDirectory())
        gameIds.push(gameId);
    }
    return gameIds;
  });

  return await Promise.all(
    gameIds.map(
      async (gameId) =>
        // NOTE: if the game is big, this could take a while, so would be better to break up a Game into a metadata file and the actual game file
        Game().parse(
          JSON.parse(await fs.readFile(paths.getGameFilepath(gameId), "utf8")),
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

      const playerRoom = getPlayerRoom(game.world);
      if (!isVisited(game.world, playerRoom.name)) {
        // TODO: parallelize these

        const roomImage: RoomImage = await GenerateRoomImage({
          name: playerRoom.name,
          appearanceDescription: playerRoom.longDescription,
        });
        saveRoomImage(game.metadata.id, roomImage);

        const { items, itemLocations, itemImages } = await GenerateRoomItems({
          game,
          room: playerRoom.name,
        });
        game.world.items.push(...items);
        game.world.itemLocations.push(...itemLocations);

        const { connectedRooms, roomConnections } =
          await GenerateRoomConnections({
            game,
          });

        game.world.rooms.push(...connectedRooms);
        game.world.roomConnections.push(...roomConnections);

        // ----

        await saveGame(game);
        await Promise.all(
          itemImages.map(
            async (itemImage) =>
              await saveItemImage(game.metadata.id, itemImage),
          ),
        );
      }
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
