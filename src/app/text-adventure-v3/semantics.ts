import { stringify, trim } from "@/utility";
import type {
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
      startingRoom: game.world.startingRoom,
      visitedRooms: game.world.visitedRooms,
    },
  };
}

export function markdownifyGameView(view: GameView) {
  return trim(`
# The Current Game State

**Player name:** _${view.world.player.name}_

**Player description.** ${view.world.player.description}

**Player appearance.** ${view.world.player.appearanceDescription}

**Items in the player's inventory:** ${
    view.world.player.items.length === 0
      ? "none"
      : view.world.player.items
          .map((item) => `\n  - _${item.name}_: ${item.description}`)
          .join("")
  }

**Player location:** _${view.world.room.name}_

**Description of _${view.world.room.name}_**: ${view.world.room.description}

**Appearance of _${view.world.room.name}_**: ${view.world.room.appearanceDescription}

**Items located in _${view.world.room.name}_:** ${
    view.world.room.items.length === 0
      ? "none"
      : view.world.room.items
          .map((item) => `\n  - _${item.name}_: ${item.description}`)
          .join("")
  }

**Other rooms connected to _${view.world.room.name}_:** ${
    view.world.room.connections.length === 0
      ? "none"
      : view.world.room.connections
          .map(
            (connection) =>
              `\n  - _${connection.there}_: ${connection.description}`,
          )
          .join("")
  }
`);
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

export function getRoomItems(game: Game, roomName: RoomName) {
  return Array.from(
    Object.entries(game.world.itemLocations).flatMap(
      ([itemName, itemLocation]) =>
        itemLocation.type === "room" && itemLocation.roomName === roomName
          ? [getItem(game, itemName)]
          : [],
    ),
  );
}

export function getPlayerRoomItems(game: Game): Item[] {
  const playerRoom = getPlayerRoom(game);
  return getRoomItems(game, playerRoom.name);
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

export function doesPlayerHaveItem(game: Game, itemName: ItemName) {
  return getPlayerItems(game).find((item) => item.name === itemName);
}

export function doesRoomHaveItem(
  game: Game,
  roomName: RoomName,
  itemName: ItemName,
) {
  return getRoomItems;
}

export function isRoomVisited(game: Game, roomName: RoomName) {
  return game.world.visitedRooms.includes(roomName);
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
  console.log(
    `[addRoomConnection]`,
    stringify({ roomConnection_to, roomConnection_from }),
  );
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

export function setPlayerRoom(game: Game, roomName: RoomName) {
  game.world.player.room = roomName;
}

export function setItemLocation(
  game: Game,
  itemName: ItemName,
  itemLocation: ItemLocation,
) {
  game.world.itemLocations[itemName] = itemLocation;
}

export function visitRoom(game: Game, roomName: RoomName) {
  game.world.visitedRooms.push(roomName);
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
