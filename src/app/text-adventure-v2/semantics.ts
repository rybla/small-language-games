import { do_, remove } from "@/utility";
import {
  Game,
  ItemLocation,
  ItemLocationInPlayerInventory,
  ItemLocationInRoom,
  ItemName,
  PlayerAction,
  PlayerName,
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
  player?: PlayerName,
): itemLocation is ItemLocationInPlayerInventory {
  return (
    itemLocation.type === "ItemLocationInPlayerInventory" &&
    (player === undefined || itemLocation.player === player)
  );
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
export function interpretAction(
  world: World,
  name: PlayerName,
  action: PlayerAction,
): void {
  switch (action.type) {
    case "PlayerTakesItem": {
      const itemLocation = getItemLocation(world, action.item);
      const playerLocation = getPlayerLocation(world, name);

      if (itemLocation.type === "ItemLocationInPlayerInventory")
        throw new InterpretActionError(
          `The player "${name}" could not take the item "${action.item}" because they already have that item in their inventory.`,
        );

      if (
        !(
          itemLocation.type === "ItemLocationInRoom" &&
          itemLocation.room === playerLocation.room
        )
      )
        throw new InterpretActionError(
          `The player "${name}" could not take the item "${action.item}" because it is not placed in the same room as the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "ItemLocationInPlayerInventory",
        player: name,
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerDropsItem": {
      const itemLocation = getItemLocation(world, action.item);
      const playerLocation = getPlayerLocation(world, name);

      if (!isItemLocationInPlayerInventory(itemLocation, name))
        throw new InterpretActionError(
          `The player "${name}" could not drop the item "${action.item}" because the item is not in the player's inventory or equipped by the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "ItemLocationInRoom",
        room: playerLocation.room,
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerMovesInsideCurrentRoom": {
      const playerLocation = getPlayerLocation(world, name);

      remove(world.playerLocations, playerLocation);
      world.playerLocations.unshift({
        player: name,
        room: playerLocation.room,
        description: action.newPlayerLocationDescription,
      });
      return;
    }
  }
}

// -----------------------------------------------------------------------------
// present
// -----------------------------------------------------------------------------

export function presentGameWorld(game: Game): string {
  return `
# Game world information for the game "${game.name}"

This document describes every detail of the current state of the game world.

World name: "${game.world.name}"

World description: ${game.world.description}

## Players

${game.world.players.map((player) => {
  const playerLocation = getPlayerLocation(game.world, player.name);
  return `
**${player.name}**: ${player.shortDescription}
  - Appearance: ${player.appearanceDescription}
  - Personality: ${player.personalityDescription}
  - Skills: ${player.skills.join(", ")}
  - Located in "${playerLocation.room}": ${playerLocation.description}
`.trim();
})}

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
        return `Held by "${itemLocation.player}: ${itemLocation.description}"`;
    }
  })}
`.trim();
}

export function presentGameWorldFromPlayerPerspective(
  game: Game,
  name: PlayerName,
) {
  const player = getPlayer(game.world, name);
  const playerLocation = getPlayerLocation(game.world, player.name);
  const playerItems = getPlayerItemsItemLocationInPlayerInventory(
    game.world,
    name,
  );
  const playerRoom = getRoom(game.world, playerLocation.room);
  const playerRoomItems = getItemsItemLocationInRoom(
    game.world,
    playerLocation.room,
  );

  return `
# Game world information for the game "${game.name}"

This document describes the current state of the game world, relative to the player "${player.name}".

## World

World name: ${game.world.name}

World description: ${game.world.description}

## Player

Player name: ${player.name}

Player description: ${player.shortDescription}

Player appearance: ${player.appearanceDescription}

Player personality: ${player.personalityDescription}

### Player Skills

Player skills:
${player.skills
  .map((skill) =>
    `
  - **${skill}**`.trim(),
  )
  .join("\n")}

### Player Inventory

${
  playerItems.length === 0
    ? `
There are no items currently stored in the player's inventory.
`.trim()
    : `
Items currently stored in the player's inventory:
${playerItems
  .map((itemLocation) =>
    `
  - **${itemLocation.item}**: ${itemLocation.description}
`.trim(),
  )
  .join("\n")
  .trim()}
`.trim()
}

### Player Location

The player is currently in the room "${playerLocation.room}".

${playerLocation.description}

Room description: ${playerRoom.shortDescription}

Items in the room:
${playerRoomItems
  .map((itemLocation) =>
    `
  - **${itemLocation.item}**: ${itemLocation.description}
`.trim(),
  )
  .join("\n")
  .trim()}
`.trim();
}

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

export function getPlayer(world: World, name: PlayerName) {
  const player = world.players.find((player) => player.name === name);
  if (player === undefined)
    throw new Error(`The player "${name}" does not exist.`);
  return player;
}

export function getPlayerLocation(world: World, name: PlayerName) {
  const playerLocation = world.playerLocations.find(
    (playerLocation) => playerLocation.player === name,
  );
  if (playerLocation === undefined)
    throw new Error(`The player "${name}" does not exist.`);
  return playerLocation;
}

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

export function getPlayerItems(
  world: World,
  name: PlayerName,
): ItemLocationInPlayerInventory[] {
  return world.itemLocations.filter((itemLocation) =>
    isItemLocationInPlayerInventory(itemLocation, name),
  );
}

export function getPlayerItemsItemLocationInPlayerInventory(
  world: World,
  name: PlayerName,
): ItemLocationInPlayerInventory[] {
  return world.itemLocations.filter((itemLocation) =>
    isItemLocationInPlayerInventory(itemLocation, name),
  );
}

export function getRoom(world: World, name: RoomName): Room {
  const room = world.rooms.find((room) => room.name === name);
  if (room === undefined) throw new Error(`The room "${name}" does not exist.`);
  return room;
}

export function getItemsItemLocationInRoom(
  world: World,
  name: RoomName,
): ItemLocationInRoom[] {
  return world.itemLocations.filter((itemLocation) =>
    isItemLocationInRoom(itemLocation, name),
  );
}
