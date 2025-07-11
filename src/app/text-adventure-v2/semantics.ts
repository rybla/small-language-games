import { do_, remove } from "@/utility";
import {
  Game,
  ItemLocation,
  ItemLocationInPlayerInventory,
  ItemLocationInRoom,
  ItemName,
  PlayerAction,
  PreGame,
  Room,
  RoomName,
  World,
} from "./ontology";

export function isItemLocationInRoom(
  itemLocation: ItemLocation,
  room?: RoomName,
): itemLocation is ItemLocationInRoom {
  return (
    itemLocation.type === "ItemLocationInRoom" &&
    (room === undefined || itemLocation.room === room)
  );
}

export function isItemLocationInPlayerInventory(
  itemLocation: ItemLocation,
): itemLocation is ItemLocationInPlayerInventory {
  return itemLocation.type === "ItemLocationInPlayerInventory";
}

// -----------------------------------------------------------------------------
// interpret
// -----------------------------------------------------------------------------

export class InterpretActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterpretActionError";
  }
}

/**
 * Interprets an {@link action} a mutation of a {@link world}.
 *
 * @throws InterpretActionError
 */
export function interpretAction(world: World, action: PlayerAction): void {
  switch (action.type) {
    case "PlayerTakesItem": {
      const itemLocation = getItemLocation(world, action.item);

      if (itemLocation.type === "ItemLocationInPlayerInventory")
        throw new InterpretActionError(
          `The player "${world.player.name}" could not take the item "${action.item}" because they already have that item in their inventory.`,
        );

      if (
        !(
          itemLocation.type === "ItemLocationInRoom" &&
          itemLocation.room === world.playerLocation.room
        )
      )
        throw new InterpretActionError(
          `The player "${world.player.name}" could not take the item "${action.item}" because it is not placed in the same room as the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "ItemLocationInPlayerInventory",
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerDropsItem": {
      const itemLocation = getItemLocation(world, action.item);

      if (!isItemLocationInPlayerInventory(itemLocation))
        throw new InterpretActionError(
          `The player "${world.player.name}" could not drop the item "${action.item}" because the item is not in the player's inventory or equipped by the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "ItemLocationInRoom",
        room: world.playerLocation.room,
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerMovesInsideCurrentRoom": {
      world.playerLocation = {
        room: world.playerLocation.room,
        description: action.newPlayerLocationDescription,
      };
      return;
    }
    case "PlayerInspectsItem": {
      return;
    }
    case "PlayerInspectsRoom": {
      return;
    }
    case "PlayerMovesToDifferentRoom": {
      world.playerLocation = {
        room: action.room,
        description: action.newPlayerLocationDescription,
      };
      return;
    }
    default: {
      // @ts-expect-error this branch should be impossible
      const action_type: string = action.type;
      throw new InterpretActionError(
        `no interpretation for action type: ${action_type}`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// present
// -----------------------------------------------------------------------------

export function presentPreGame(pregame: PreGame): string {
  return `
# Game World Information

This document describes the details of the initial state of the game world.

## World

World description: ${pregame.worldDescription}

`.trim();
}

export function presentGame(game: Game): string {
  return `
# Game World Information

This document describes every detail of the current state of the game world.

## World

World description: ${game.world.description}

## Player

**${game.world.player.name}**: ${game.world.player.shortDescription}
- Appearance: ${game.world.player.appearanceDescription}
- Personality: ${game.world.player.personalityDescription}
- Skills: ${game.world.player.skills.join(", ")}
- Located in "${game.world.playerLocation.room}": ${game.world.playerLocation.description}

## Rooms

${game.world.rooms.map((room) => presentRoom(game.world, room.name)).join("\n\n")}

## Items

${game.world.items.map((item) => presentItem(game.world, item.name)).join("\n\n")}

`.trim();
}

export function presentRoom(world: World, name: RoomName) {
  const room = getRoom(world, name);
  return `
**${room.name}**: ${room.shortDescription}
  - Full description: ${room.longDescription}
`.trim();
}

export function presentItem(world: World, name: ItemName) {
  const item = getItem(world, name);
  const itemLocation = getItemLocation(world, item.name);
  return `
**${item.name}**: ${item.shortDescription}
  - Appearance: ${item.appearanceDescription}
  - ${do_(() => {
    switch (itemLocation.type) {
      case "ItemLocationInRoom":
        return `Placed in "${itemLocation.room}: ${itemLocation.description}"`;
      case "ItemLocationInPlayerInventory":
        return `Held by "${world.player.name}: ${itemLocation.description}"`;
    }
  })}
`.trim();
}

export function presentGameFromPlayerPerspective(game: Game) {
  const playerItems = getPlayerItemsItemLocationInPlayerInventory(game.world);
  const playerRoom = getRoom(game.world, game.world.playerLocation.room);
  const roomItems = getItemsItemLocationInRoom(
    game.world,
    game.world.playerLocation.room,
  );

  return `
# Game World Information

This document describes the current state of the game world, relative to the player "${game.world.player.name}".

## World

World description: ${game.world.description}

## Player

Player name: ${game.world.player.name}

Player description: ${game.world.player.shortDescription}

Player appearance: ${game.world.player.appearanceDescription}

Player personality: ${game.world.player.personalityDescription}

### Player Skills

Player skills:
${game.world.player.skills
  .map((skill) =>
    `
  - **${skill}**`.trim(),
  )
  .join("\n")}

### Player Inventory

Items in player's inventory: ${
    playerItems.length === 0
      ? "there are no items currently in this room"
      : "\n" +
        playerItems
          .map((itemLocation) =>
            `
  - **${itemLocation.item}**: ${itemLocation.description}
`.trim(),
          )
          .join("\n")
          .trim()
  }

### Player Location

The player is currently in the room "${game.world.playerLocation.room}".

${game.world.playerLocation.description}

Room description: ${playerRoom.shortDescription}

Items in the room: ${
    roomItems.length === 0
      ? "there are no items currently in this room"
      : "\n" +
        roomItems
          .map((itemLocation) =>
            `
  - **${itemLocation.item}**: ${itemLocation.description}
`.trim(),
          )
          .join("\n")
          .trim()
  }

`.trim();
}

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

export function getItem(world: World, name: ItemName) {
  const item = world.items.find((item) => item.name === name);
  if (item === undefined) throw new Error(`The item "${name}" does not exist.`);
  return item;
}

export function getItemLocation(world: World, name: ItemName) {
  const itemLocation = world.itemLocations.find(
    (itemLocation) => itemLocation.item === name,
  );
  if (itemLocation === undefined)
    throw new Error(`The item "${name}" does not exist.`);
  return itemLocation;
}

export function getPlayerItems(world: World): ItemLocationInPlayerInventory[] {
  return world.itemLocations.filter((itemLocation) =>
    isItemLocationInPlayerInventory(itemLocation),
  );
}

export function getPlayerItemsItemLocationInPlayerInventory(
  world: World,
): ItemLocationInPlayerInventory[] {
  return world.itemLocations.filter((itemLocation) =>
    isItemLocationInPlayerInventory(itemLocation),
  );
}

export function getRoom(world: World, name: RoomName): Room {
  const room = world.rooms.find((room) => room.name === name);
  if (room === undefined) throw new Error(`The room "${name}" does not exist.`);
  return room;
}

export function getPlayerRoom(world: World): Room {
  return getRoom(world, world.playerLocation.room);
}

export function isVisited(world: World, room: RoomName) {
  return world.visitedRooms.includes(room);
}

export function getItemsItemLocationInRoom(
  world: World,
  name: RoomName,
): ItemLocationInRoom[] {
  return world.itemLocations.filter((itemLocation) =>
    isItemLocationInRoom(itemLocation, name),
  );
}
