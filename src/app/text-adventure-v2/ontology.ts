import { Codomain, do_, findMapAll } from "@/utility";
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

export type ItemLocationInPlayerInventory = z.infer<
  typeof ItemLocationInPlayerInventory
>;
export const ItemLocationInPlayerInventory = z.object({
  type: z.enum(["ItemLocationInPlayerInventory"]),
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of how exactly the player has the item in their inventory, such as how the player is holding it or storing it on their person somehow",
  ),
});

export type ItemLocationInRoom = z.infer<typeof ItemLocationInRoom>;
export const ItemLocationInRoom = z.object({
  type: z.enum(["ItemLocationInRoom"]),
  room: RoomName,
  item: ItemName,
  description: NeString.describe(
    "one-paragraph description of where exacty the item is located in the room, including its absolute position in the room, relative position to nearby objects, and orientation",
  ),
});

export type ItemLocation = z.infer<typeof ItemLocation>;
export const ItemLocation = z.union([
  ItemLocationInPlayerInventory,
  ItemLocationInRoom,
]);

// PlayerLocation

export type PlayerLocation = z.infer<typeof PlayerLocation>;
export const PlayerLocation = z.object({
  room: RoomName,
  description: NeString.describe(
    "one-paragraph description of where the player is located in the room, including their absolute position in the room, relative position to important features in the room, orientation, and pose",
  ),
});

// World

export type World = z.infer<typeof World>;
export const World = z.object({
  description: NeString.describe(
    "one-paragraph description of the world the game takes place in",
  ),
  player: Player,
  playerLocation: PlayerLocation,
  rooms: z.array(Room),
  items: z.array(Item),
  itemLocations: z.array(ItemLocation),
});

// Action

export type PlayerTakesItem = z.infer<Codomain<typeof PlayerTakesItem>>;
export const PlayerTakesItem = (itemNames?: [ItemName, ...ItemName[]]) =>
  z
    .object({
      type: z.enum(["PlayerTakesItem"]),
      item: itemNames === undefined ? ItemName : z.enum(itemNames),
      description: NeString.describe(
        "one-paragraph description of how the player takes the item",
      ),
      newItemLocationDescription:
        ItemLocationInPlayerInventory.shape.description.describe(
          `for after the item is stored in player's inventory, ${ItemLocationInPlayerInventory.shape.description}`,
        ),
    })
    .describe(
      `This is the action for the player taking an item from the room and puts it into their inventory. This action covers the concept of "taking" very generally -- use this action if the player is picking up and item, putting on a clothing or equipment item, storing an item on their person, etc. Note that the player can ONLY do this action if the item they are taking is currently located in the room that the player is currently in.`,
    );

export type PlayerDropsItem = z.infer<Codomain<typeof PlayerDropsItem>>;
export const PlayerDropsItem = (itemNames?: [ItemName, ...ItemName[]]) =>
  z
    .object({
      type: z.enum(["PlayerDropsItem"]),
      item: itemNames === undefined ? ItemName : z.enum(itemNames),
      description: NeString.describe(
        "one-paragraph description of how the player drops the item",
      ),
      newItemLocationDescription: ItemLocationInRoom.shape.description.describe(
        `for after the item is dropped, ${ItemLocationInRoom.shape.description}`,
      ),
    })
    .describe(
      `This is the action for the player dropping an item from their inventory into the room. This action covers the concept of "dropping" very generally –– use this action if the player is putting an item down, taking off a clothing or equipment item, throwing an item, placing an item onto something in the room, etc. Note that the player can ONLY do this action if the item they are dropping is currently in their inventory.`,
    );

export type PlayerInspectsItem = z.infer<Codomain<typeof PlayerInspectsItem>>;
export const PlayerInspectsItem = (itemNames?: [ItemName, ...ItemName[]]) =>
  z
    .object({
      type: z.enum(["PlayerInspectsItem"]),
      item: itemNames === undefined ? ItemName : z.enum(itemNames),
      description: NeString.describe(
        "one-paragraph description of how the player inspects the item",
      ),
    })
    .describe(
      `This is the action for the player inspecting a particular item in the room or their inventory. This action covers the concept of "inspective" very generally –– use this action if the player is reading a book or note item, reading something on an item, looking at a particular part of an item, thinking about something related to a particular item, etc.`,
    );

export type PlayerInspectsEnvironment = z.infer<typeof PlayerInspectsRoom>;
export const PlayerInspectsRoom = z
  .object({
    type: z.enum(["PlayerInspectsRoom"]),
    description: NeString.describe(
      "one-paragraph description of how the player inspects the room",
    ),
  })
  .describe(
    `This is the action for the player inspecting the room they are currently in. This action covers the concept of "inspective" very generally –– use this action if the player is looking around the room, reading something on a wall, looking at a particular part of the room, thinking about something related to the room, etc.`,
  );

export type PlayerMovesInsideCurrentRoom = z.infer<
  typeof PlayerMovesInsideCurrentRoom
>;
export const PlayerMovesInsideCurrentRoom = z
  .object({
    type: z.enum(["PlayerMovesInsideCurrentRoom"]),
    description: NeString.describe(
      "one-paragraph description of how the player moves around inside the room they are currently in",
    ),
    newPlayerLocationDescription: PlayerLocation.shape.description.describe(
      `after finishing moving around, ${PlayerLocation.shape.description.description!}`,
    ),
  })
  .describe(
    `This is the action that corresponds to the player moving around somehow in the room they are currently in (they don't move to a new room). This action covers the concept of "moving around" very generally –– use this action if the player is repositioning themselves, changing poses, moving to a particular part of the room, moving closer to a particular item in the room, moving closer to a particular place in the room, etc. Note that this action DOES NOT move the player to a different room, it ONLY keeps the player in their current room.`,
  );

export type PlayerAction = z.infer<Codomain<typeof PlayerAction>>;
export const PlayerAction = (world?: World) =>
  z.union([
    PlayerInspectsRoom,
    PlayerMovesInsideCurrentRoom,
    ...do_<Codomain<typeof PlayerInspectsItem>[]>(() => {
      if (world === undefined) return [PlayerInspectsItem()];
      const playerItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInPlayerInventory" ||
        (itemLocation.type === "ItemLocationInRoom" &&
          itemLocation.room === world.playerLocation.room)
          ? itemLocation.item
          : undefined,
      );
      if (playerItems.length === 0) {
        return [];
      } else {
        return [PlayerInspectsItem(playerItems as [ItemName, ...ItemName[]])];
      }
    }),
    ...do_<Codomain<typeof PlayerDropsItem>[]>(() => {
      if (world === undefined) return [PlayerDropsItem()];
      const playerItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInPlayerInventory"
          ? itemLocation.item
          : undefined,
      );
      if (playerItems.length === 0) {
        return [];
      } else {
        return [PlayerDropsItem(playerItems as [ItemName, ...ItemName[]])];
      }
    }),
    ...do_<Codomain<typeof PlayerTakesItem>[]>(() => {
      if (world === undefined) return [PlayerTakesItem()];
      const roomItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInRoom" &&
        itemLocation.room === world.playerLocation.room
          ? itemLocation.item
          : undefined,
      );
      if (roomItems.length === 0) {
        return [];
      } else {
        return [PlayerTakesItem(roomItems as [ItemName, ...ItemName[]])];
      }
    }),
  ]);

// Turn

export type PlayerTurn = z.infer<Codomain<typeof PlayerTurn>>;
export const PlayerTurn = (world?: World) =>
  z.object({
    prompt: NeString.describe("one-paragraph description of the turn"),
    actions: z.array(PlayerAction(world)).nonempty(),
    description: NeString.describe(
      "one-paragraph description of the turn, which is a story-like passage that comprehensively covers what happens in the descriptions of the actions just taken",
    ),
  });

// Game

export type GameId = z.infer<typeof GameId>;
export const GameId = z.string().brand<"GameId">();

export type GameMetadata = z.infer<typeof GameMetadata>;
export const GameMetadata = z.object({
  id: GameId,
  name: GameName,
});

export type Game = z.infer<Codomain<typeof Game>>;
export const Game = (world?: World) =>
  z.object({
    metadata: GameMetadata,
    world: World,
    turns: z.array(PlayerTurn(world)),
  });

export type PreGame = z.infer<typeof PreGame>;
export const PreGame = z.object({
  metadata: GameMetadata,
  worldDescription: World.shape.description,
});

// assets

export type ItemImage = z.infer<typeof ItemImage>;
export const ItemImage = z.object({
  item: ItemName,
  dataUrl: z.string(),
});
