import { stringify, TODO } from "@/utility";
import {
  Game,
  GameView,
  Item,
  ItemLocation,
  ItemName,
  Room,
  RoomConnection,
  RoomName,
} from "./ontology";

// -----------------------------------------------------------------------------
// getGameView
// -----------------------------------------------------------------------------

export function getGameView(game: Game): GameView {
  const playerItems = getPlayerItems(game);
  const playerRoom = getPlayerRoom(game);
  const playerRoomItems = getPlayerRoomItems(game);
  const playerRoomConnections = getPlayerRoomConnections(game);

  return {
    world: {
      player: {
        name: game.world.player.name,
        description: game.world.player.description,
        appearanceDescription: game.world.player.appearanceDescription,
        items: playerItems,
      },
      room: {
        name: playerRoom.name,
        description: playerRoom.description,
        appearanceDescription: playerRoom.appearanceDescription,
        items: playerRoomItems,
        connections: playerRoomConnections,
      },
      visitedRooms: game.world.visitedRooms,
    },
  };
}

// -----------------------------------------------------------------------------
// getters
// -----------------------------------------------------------------------------

export function getPlayerItems(game: Game): Item[] {
  return Array.from(
    Object.entries(game.world.itemLocations).flatMap(
      ([itemName, itemLocation]) =>
        itemLocation.type === "player" ? [getItem(game, itemName)] : [],
    ),
  );
}

export function getPlayerRoom(game: Game): Room {
  return getRoom(game, game.world.player.room);
}

export function getPlayerRoomConnections(game: Game): RoomConnection[] {
  return getRoomConnections(game, getPlayerRoom(game).name);
}

export function getPlayerRoomItems(game: Game): Item[] {
  const playerRoom = getPlayerRoom(game);
  return Array.from(
    Object.entries(game.world.itemLocations).flatMap(
      ([itemName, itemLocation]) =>
        itemLocation.type === "room" &&
        itemLocation.roomName === playerRoom.name
          ? [getItem(game, itemName)]
          : [],
    ),
  );
}

export function getItem(game: Game, itemName: ItemName): Item {
  const item = game.world.items[itemName];
  if (item === undefined)
    throw new GameError(game, `Item "${itemName}" not found`);
  return item;
}

export function getRoom(game: Game, roomName: RoomName): Room {
  const room = game.world.rooms[roomName];
  if (room === undefined)
    throw new GameError(game, `Room "${roomName}" not found`);
  return room;
}

export function getRoomConnections(
  game: Game,
  roomName: RoomName,
): RoomConnection[] {
  const connections = game.world.roomConnections[roomName];
  if (connections === undefined)
    throw new GameError(game, `Room "${roomName}" not found`);
  return connections;
}

// -----------------------------------------------------------------------------
// mutators
// -----------------------------------------------------------------------------

export function addRoom(game: Game, room: Room) {
  game.world.rooms[room.name] = room;
}

export function addRoomConnection(
  game: Game,
  roomConnection_to: RoomConnection,
  roomConnection_from: RoomConnection,
) {
  addRoomConnection_oneWay(game, roomConnection_to);
  addRoomConnection_oneWay(game, roomConnection_from);
}

function addRoomConnection_oneWay(game: Game, roomConnection: RoomConnection) {
  if (game.world.roomConnections[roomConnection.here] === undefined) {
    game.world.roomConnections[roomConnection.here] = [];
  }
  game.world.roomConnections[roomConnection.here].push(roomConnection);
}

export function addItem(game: Game, item: Item, itemLocation: ItemLocation) {
  game.world.items[item.name] = item;
  game.world.itemLocations[item.name] = itemLocation;
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
