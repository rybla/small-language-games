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

export type StoredInPlayerInventory = z.infer<typeof StoredInPlayerInventory>;
export const StoredInPlayerInventory = z.object({
  type: z.enum(["StoredInPlayerInventory"]),
  player: PlayerName,
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how exactly the player has the item stored in their inventory",
  ),
});

export type PlacedInRoom = z.infer<typeof PlacedInRoom>;
export const PlacedInRoom = z.object({
  type: z.enum(["PlacedInRoom"]),
  room: RoomName,
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of where exacty the item is located in the room, including its absolute position in the room, relative position to nearby objects, and orientation",
  ),
});

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
  name: WorldName,
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

export type PlayerTurn = z.infer<typeof PlayerTurn>;
export const PlayerTurn = z.object({
  name: PlayerName,
  prompt: NeString.describe("one-paragraph description of the turn"),
  actions: z.array(PlayerAction).min(1),
  description: NeString.describe(
    "one-paragraph description of the turn, summarizing the actions taken",
  ),
});

// Game

export type Game = z.infer<typeof Game>;
export const Game = z.object({
  name: GameName,
  world: World,
  turns: z.array(PlayerTurn),
});
