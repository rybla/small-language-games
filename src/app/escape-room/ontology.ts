import { do_, remove } from "@/utility";
import { z } from "genkit";

// -----------------------------------------------------------------------------
// types
// -----------------------------------------------------------------------------

// abstract

export type NeString = z.infer<typeof NeString>;
export const NeString = z.string().nonempty();

// name

export type GameName = z.infer<typeof GameName>;
export const GameName = NeString.brand<"Game">().describe("game name");

export type WorldName = z.infer<typeof WorldName>;
export const WorldName = NeString.brand<"World">().describe("world name");

export type PlayerName = z.infer<typeof PlayerName>;
export const PlayerName = NeString.brand<"Player">().describe("player name");

export type ItemName = z.infer<typeof ItemName>;
export const ItemName = NeString.brand<"Item">().describe("item name");

export type RoomName = z.infer<typeof RoomName>;
export const RoomName = NeString.brand<"Room">().describe("room name");

// Player

export type PlayerSkill = z.infer<typeof PlayerSkill>;
export const PlayerSkill = NeString.describe(
  "single phrase label for a specific skill",
);

export type Player = z.infer<typeof Player>;
export const Player = z.object({
  name: PlayerName,
  shortDescription: NeString.describe(
    "introductory superficial one-sentence description of player",
  ),
  appearanceDescription: NeString.describe(
    "one-paragraph description of the player's appearance",
  ),
  personalityDescription: NeString.describe(
    "one-paragraph description of the player's personality",
  ),
  skills: z.array(PlayerSkill).min(1).describe("array of the player's skills"),
});

// Item

export type Item = z.infer<typeof Item>;
export const Item = z.object({
  name: ItemName,
  shortDescription: NeString.describe(
    "introductory superficial one-sentence description of the item",
  ),
  appearanceDescription: NeString.describe(
    "one-paragraph description of the item's appearance",
  ),
});

// Room

export type Room = z.infer<typeof Room>;
export const Room = z.object({
  name: RoomName,
  shortDescription: NeString.describe(
    "introductory superficial one-sentence description of the room",
  ),
  longDescription: NeString.describe(
    "full one-paragraph description of the room, which includes all details about the room including any discreet or secret aspects that a player will only find after careful investigation",
  ),
});

// ItemLocation

export type EquippedByPlayer = z.infer<typeof EquippedByPlayer>;
export const EquippedByPlayer = z.object({
  type: z.enum(["EquippedByPlayer"]),
  player: PlayerName,
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how exactly the player has the item equipped",
  ),
});

export function isEquippedByPlayer(
  itemLocation: ItemLocation,
  player?: PlayerName,
): itemLocation is EquippedByPlayer {
  return (
    itemLocation.type === "EquippedByPlayer" &&
    (player === undefined || itemLocation.player === player)
  );
}

export type StoredInPlayerInventory = z.infer<typeof StoredInPlayerInventory>;
export const StoredInPlayerInventory = z.object({
  type: z.enum(["StoredInPlayerInventory"]),
  player: PlayerName,
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how exactly the player has the item stored in their inventory",
  ),
});

export function isStoredInPlayerInventory(
  itemLocation: ItemLocation,
  player?: PlayerName,
): itemLocation is StoredInPlayerInventory {
  return (
    itemLocation.type === "StoredInPlayerInventory" &&
    (player === undefined || itemLocation.player === player)
  );
}

export type PlacedInRoom = z.infer<typeof PlacedInRoom>;
export const PlacedInRoom = z.object({
  type: z.enum(["PlacedInRoom"]),
  room: RoomName,
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of where exacty the item is located in the room, including its absolute position in the room, relative position to nearby objects, and orientation",
  ),
});

export function isPlacedInRoom(
  itemLocation: ItemLocation,
): itemLocation is PlacedInRoom {
  return itemLocation.type === "PlacedInRoom";
}

export type ItemLocation = z.infer<typeof ItemLocation>;
export const ItemLocation = z.union([
  EquippedByPlayer,
  StoredInPlayerInventory,
  PlacedInRoom,
]);

// PlayerLocation

export type PlayerLocation = z.infer<typeof PlayerLocation>;
export const PlayerLocation = z.object({
  player: PlayerName,
  room: RoomName,
  description: NeString.describe(
    "one-paragraph description of where the player is located in the room, including their absolute position in the room, relative position to important features in the room, orientation, and pose",
  ),
});

// World

export type World = z.infer<typeof World>;
export const World = z.object({
  name: NeString,
  description: NeString.describe(
    "one-paragraph description of the world the game takes place in",
  ),
  rooms: z.array(Room),
  players: z.array(Player),
  items: z.array(Item),
  itemLocations: z.array(ItemLocation),
  playerLocations: z.array(PlayerLocation),
});

// Action

export type PlayerTakesItem = z.infer<typeof PlayerTakesItem>;
export const PlayerTakesItem = z.object({
  type: z.enum(["PlayerTakesItem"]),
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how the player takes the item",
  ),
  newItemLocationDescription:
    StoredInPlayerInventory.shape.description.describe(
      `for after the item is stored in player's inventory, ${StoredInPlayerInventory.shape.description}`,
    ),
});

export type PlayerDropsItem = z.infer<typeof PlayerDropsItem>;
export const PlayerDropsItem = z.object({
  type: z.enum(["PlayerDropsItem"]),
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how the player drops the item",
  ),
  newItemLocationDescription: PlacedInRoom.shape.description.describe(
    `for after the item is dropped, ${PlacedInRoom.shape.description}`,
  ),
});

export type PlayerEquipsItem = z.infer<typeof PlayerEquipsItem>;
export const PlayerEquipsItem = z.object({
  type: z.enum(["PlayerEquipsItem"]),
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how the player equips the item",
  ),
  newItemLocationDescription: EquippedByPlayer.shape.description.describe(
    `for after the item is equipped, ${EquippedByPlayer.shape.description}`,
  ),
});

export type PlayerStoresItemInInventory = z.infer<
  typeof PlayerStoresItemInInventory
>;
export const PlayerStoresItemInInventory = z.object({
  type: z.enum(["PlayerStoresItemInInventory"]),
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how the player stores the item in their inventory",
  ),
  newItemLocationDescription:
    StoredInPlayerInventory.shape.description.describe(
      `for after the item is stored in the player's inventory, ${StoredInPlayerInventory.shape.description}`,
    ),
});

export type PlayerMovesInsideCurrentRoom = z.infer<
  typeof PlayerMovesInsideCurrentRoom
>;
export const PlayerMovesInsideCurrentRoom = z.object({
  type: z.enum(["PlayerMovesInsideCurrentRoom"]),
  description: NeString.describe(
    "one-paragraph description of how the player moves around inside the room they are currently in",
  ),
  newPlayerLocationDescription: PlayerLocation.shape.description.describe(
    `after finishing moving around, ${PlayerLocation.shape.description.description!}`,
  ),
});

export type PlayerAction = z.infer<typeof PlayerAction>;
export const PlayerAction = z.union([
  PlayerTakesItem,
  PlayerDropsItem,
  PlayerEquipsItem,
  PlayerStoresItemInInventory,
  PlayerMovesInsideCurrentRoom,
]);

// Turn

export type Turn = z.infer<typeof Turn>;
export const Turn = z.object({
  name: PlayerName,
  actions: z.array(PlayerAction).min(1),
});

// Game

export type Game = z.infer<typeof Game>;
export const Game = z.object({
  name: NeString,
  world: World,
  turns: z.array(Turn),
});

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

      if (itemLocation.type === "EquippedByPlayer")
        throw new InterpretActionError(
          `The player "${name}" could not take the item "${action.item}" because they already have that item equipped.`,
        );

      if (itemLocation.type === "StoredInPlayerInventory")
        throw new InterpretActionError(
          `The player "${name}" could not take the item "${action.item}" because they already have that item stored in their inventory.`,
        );

      if (
        !(
          itemLocation.type === "PlacedInRoom" &&
          itemLocation.room === playerLocation.room
        )
      )
        throw new InterpretActionError(
          `The player "${name}" could not take the item "${action.item}" because it is not placed in the same room as the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "EquippedByPlayer",
        player: name,
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerDropsItem": {
      const itemLocation = getItemLocation(world, action.item);
      const playerLocation = getPlayerLocation(world, name);

      if (
        !(
          (itemLocation.type === "EquippedByPlayer" &&
            itemLocation.player === name) ||
          (itemLocation.type === "StoredInPlayerInventory" &&
            itemLocation.player === name)
        )
      )
        throw new InterpretActionError(
          `The player "${name}" could not drop the item "${action.item}" because the item is not in the player's inventory or equipped by the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "PlacedInRoom",
        room: playerLocation.room,
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerEquipsItem": {
      const itemLocation = getItemLocation(world, action.item);

      if (
        itemLocation.type === "EquippedByPlayer" &&
        itemLocation.player === name
      )
        throw new InterpretActionError(
          `The player "${name}" could not equip the item "${action.item}" because the item is already equipped by the player.`,
        );

      if (
        !(
          itemLocation.type === "StoredInPlayerInventory" &&
          itemLocation.player === name
        )
      )
        throw new InterpretActionError(
          `The player "${name}" could not equip the item "${action.item}" because the item is not in the player's inventory.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "EquippedByPlayer",
        player: name,
        item: action.item,
        description: action.newItemLocationDescription,
      });
      return;
    }
    case "PlayerStoresItemInInventory": {
      const itemLocation = getItemLocation(world, action.item);

      if (
        itemLocation.type === "StoredInPlayerInventory" &&
        itemLocation.player === name
      )
        throw new InterpretActionError(
          `The player "${name}" could not store the item "${action.item}" in their inventory because the item is already in the player's inventory.`,
        );

      if (
        !(
          itemLocation.type === "EquippedByPlayer" &&
          itemLocation.player === name
        )
      )
        throw new InterpretActionError(
          `The player "${name}" could not store the item "${action.item}" in their inventory because the item is not equipped by the player.`,
        );

      remove(world.itemLocations, itemLocation);
      world.itemLocations.unshift({
        type: "StoredInPlayerInventory",
        player: name,
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

export function presentWorld(world: World): string {
  return `
# Game World Information

World name: ${world.name}

World description: ${world.description}

## Players

${world.players.map((player) => {
  const playerLocation = getPlayerLocation(world, player.name);
  return `
**${player.name}**: ${player.shortDescription}
  - Appearance: ${player.appearanceDescription}
  - Personality: ${player.personalityDescription}
  - Skills:
${player.skills
  .map((skill) =>
    `
      - ${skill}`.trim(),
  )
  .join("\n")}
  - Located in "${playerLocation.room}": ${playerLocation.description}
`.trim();
})}

## Rooms

${world.rooms.map((room) => presentRoom(world, room.name)).join("\n\n")}

## Items

${world.items.map((item) => presentItem(world, item.name)).join("\n\n")}

`.trim();
}

export function presentRoom(world: World, name: RoomName) {
  const room = getRoom(world, name);
  return `
**${room.name}**: ${room.shortDescription}
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
      case "EquippedByPlayer":
        return `Equipped by "${itemLocation.player}: ${itemLocation.description}"`;
      case "PlacedInRoom":
        return `Placed in "${itemLocation.room}: ${itemLocation.description}"`;
      case "StoredInPlayerInventory":
        return `Stored by "${itemLocation.player}: ${itemLocation.description}"`;
    }
  })}
`.trim();
}

export function presentWorldFromPlayerPerspective(
  world: World,
  name: PlayerName,
) {
  const player = getPlayer(world, name);
  const playerLocation = getPlayerLocation(world, player.name);
  const playerItemsEquipped = getPlayerItemsEquippedByPlayer(world, name);
  const playerItemsStored = getPlayerItemsStoredInPlayerInventory(world, name);
  const playerRoom = getRoom(world, playerLocation.room);

  return `
# Game World Information

This document describes the current state of the game world, relative to the player "${player.name}".

## World

World name: ${world.name}

World description: ${world.description}

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
  - ${skill}`.trim(),
  )
  .join("\n")}

### Player Equipment

Items currently equipped by player:
${playerItemsEquipped.map((itemLocation) =>
  `
  - ${itemLocation.item}: ${itemLocation.description}
  `.trim(),
)}

### Player Inventory

Items stored in player's inventory:
${playerItemsStored.map((itemLocation) =>
  `
  - ${itemLocation.item}: ${itemLocation.description}
  `.trim(),
)}

### Player Location

The player is currently in the room "${playerLocation.room}": ${playerLocation.description}

Room description: ${playerRoom.shortDescription}

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
): (EquippedByPlayer | StoredInPlayerInventory)[] {
  return world.itemLocations.filter(
    (itemLocation) =>
      isEquippedByPlayer(itemLocation, name) ||
      isStoredInPlayerInventory(itemLocation, name),
  );
}

export function getPlayerItemsStoredInPlayerInventory(
  world: World,
  name: PlayerName,
): StoredInPlayerInventory[] {
  return world.itemLocations.filter((itemLocation) =>
    isStoredInPlayerInventory(itemLocation, name),
  );
}

export function getPlayerItemsEquippedByPlayer(
  world: World,
  name: PlayerName,
): EquippedByPlayer[] {
  return world.itemLocations.filter((itemLocation) =>
    isEquippedByPlayer(itemLocation, name),
  );
}

export function getRoom(world: World, name: RoomName): Room {
  const room = world.rooms.find((room) => room.name === name);
  if (room === undefined) throw new Error(`The room "${name}" does not exist.`);
  return room;
}
