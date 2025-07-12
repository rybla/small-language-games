"use server";

import { do_, fromDataUrlToBuffer, stringify } from "@/utility";
import { existsSync } from "fs";
import * as fs from "fs/promises";
import { paths } from "./common_backend";
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
  const { game, itemImages, roomImage } = await GenerateGame({ prompt });

  await saveGame(game);
  await Promise.all([
    ...itemImages.map(
      async (itemImage) => await saveItemImage(game.metadata.id, itemImage),
    ),
    saveRoomImage(game.metadata.id, roomImage),
  ]);

  return game.metadata;
}

export async function getGame(id: GameId): Promise<Game> {
  return Game().parse(
    JSON.parse(await fs.readFile(paths.getGameFilepath(id), "utf8")),
  );
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
      console.log(`interpreting action: ${action.type}`);
      interpretAction(game.world, action);

      const playerRoom = getPlayerRoom(game.world);

      if (!isVisited(game.world, playerRoom.name)) {
        await Promise.all([
          do_(async () => {
            console.log(`generating room image for ${playerRoom.name}`);
            const roomImage = await GenerateRoomImage({
              name: playerRoom.name,
              appearanceDescription: playerRoom.longDescription,
            });
            saveRoomImage(game.metadata.id, roomImage);
          }),
          do_(async () => {
            console.log(`generating room items for ${playerRoom.name}`);
            const { items, itemLocations, itemImages } =
              await GenerateRoomItems({
                game,
                room: playerRoom.name,
              });

            game.world.items.push(...items);
            game.world.itemLocations.push(...itemLocations);
            await Promise.all(
              itemImages.map(
                async (itemImage) =>
                  await saveItemImage(game.metadata.id, itemImage),
              ),
            );
          }),
          do_(async () => {
            const { connectedRooms, roomConnections } =
              await GenerateRoomConnections({
                game,
              });

            console.log(`adding ${playerRoom.name} to visited rooms`);
            game.world.visitedRooms.push(playerRoom.name);
            game.world.rooms.push(...connectedRooms);
            game.world.roomConnections.push(...roomConnections);
          }),
        ]);
      }
    } catch (exception: unknown) {
      if (exception instanceof InterpretActionError) {
        errors.push(exception.message);
        return;
      } else {
        throw exception;
      }
    }

    await saveGame(game);
  }

  if (errors.length > 0)
    throw new Error(`interpret action errors:\n${errors.join("\n")}`);

  game.turns.push(turn);
  saveGame(game);
}
