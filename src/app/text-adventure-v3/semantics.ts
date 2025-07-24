import { stringify } from "@/utility";
import {
  Game,
  GameView,
  Item,
  ItemName,
  Room,
  RoomConnection,
  RoomName,
} from "./ontology";

// -----------------------------------------------------------------------------
// getGameView
// -----------------------------------------------------------------------------

export function getGameView(game: Game): GameView {
  const items_player = Array.from(
    Object.entries(game.world.itemLocations).flatMap(
      ([itemName, itemLocation]) =>
        itemLocation.type === "player" ? [getItem(game, itemName)] : [],
    ),
  );
  const room_player = getRoom(game, game.world.player.room);
  const items_room_player = Array.from(
    Object.entries(game.world.itemLocations).flatMap(
      ([itemName, itemLocation]) =>
        itemLocation.type === "room" &&
        itemLocation.roomName === room_player.name
          ? [getItem(game, itemName)]
          : [],
    ),
  );
  const connections_room_player = getRoomConnection(game, room_player.name);

  return {
    world: {
      player: {
        name: game.world.player.name,
        description: game.world.player.description,
        appearanceDescription: game.world.player.appearanceDescription,
        items: items_player,
      },
      room: {
        name: room_player.name,
        description: room_player.description,
        appearanceDescription: room_player.appearanceDescription,
        items: items_room_player,
        connections: connections_room_player,
      },
    },
  };
}

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

function getItem(game: Game, itemName: ItemName): Item {
  const item = game.world.items[itemName];
  if (item === undefined)
    throw new GameError(game, `Item "${itemName}" not found`);
  return item;
}

function getRoom(game: Game, roomName: RoomName): Room {
  const room = game.world.rooms[roomName];
  if (room === undefined)
    throw new GameError(game, `Room "${roomName}" not found`);
  return room;
}

function getRoomConnection(game: Game, roomName: RoomName): RoomConnection[] {
  const connections = game.world.roomConnections[roomName];
  if (connections === undefined)
    throw new GameError(game, `Room "${roomName}" not found`);
  return connections;
}

// -----------------------------------------------------------------------------
// error
// -----------------------------------------------------------------------------

export class GameError extends Error {
  constructor(
    public game: Game,
    message: string,
  ) {
    super(`${message}\n\ngame:${stringify(game)}`);
    this.name = "GameError";
  }
}
