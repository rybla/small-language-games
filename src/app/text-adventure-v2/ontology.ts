import {
  Codomain,
  do_,
  findMapAll,
  isNonEmpty,
  NonEmptyArray,
} from "@/utility";
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

export type RoomConnection = z.infer<typeof RoomConnection>;
export const RoomConnection = z.object({
  room1: RoomName.describe("the name of room1"),
  room2: RoomName.describe("the name of room2"),
  descriptionOfPathFromRoom1ToRoom2: NeString.describe(
    "one-paragraph description, from the point of view of room1, of the path (doorway, passageway, secret door, opening, etc.) from room1 to room2",
  ),
  descriptionOfPathFromRoom2ToRoom1: NeString.describe(
    "one-paragraph description, from the point of view of room2, of the path (doorway, passageway, secret door, opening, etc.) from room2 to room1",
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
  roomConnections: z.array(RoomConnection),
  visitedRooms: z.array(RoomName),
});

// Action

export type PlayerTakesItem = z.infer<Codomain<typeof PlayerTakesItem>>;
export const PlayerTakesItem = (itemNames?: NonEmptyArray<ItemName>) =>
  z
    .object({
      type: z.enum(["PlayerTakesItem"]),
      item: itemNames === undefined ? ItemName : z.enum(itemNames),
      description: NeString.describe(
        "one-paragraph description of how the player takes the item",
      ),
      newItemLocationDescription:
        ItemLocationInPlayerInventory.shape.description.describe(
          `for after the item is stored in player's inventory, ${ItemLocationInPlayerInventory.shape.description.description!}`,
        ),
    })
    .describe(
      `This is the action for the player taking an item from the room and puts it into their inventory. This action covers the concept of "taking" very generally -- use this action if the player is picking up and item, putting on a clothing or equipment item, storing an item on their person, etc. Note that the player can ONLY do this action if the item they are taking is currently located in the room that the player is currently in.`,
    );

export type PlayerDropsItem = z.infer<Codomain<typeof PlayerDropsItem>>;
export const PlayerDropsItem = (itemNames?: NonEmptyArray<ItemName>) =>
  z
    .object({
      type: z.enum(["PlayerDropsItem"]),
      item: itemNames === undefined ? ItemName : z.enum(itemNames),
      description: NeString.describe(
        "one-paragraph description of how the player drops the item",
      ),
      newItemLocationDescription: ItemLocationInRoom.shape.description.describe(
        `for after the item is dropped, ${ItemLocationInRoom.shape.description.description!}`,
      ),
    })
    .describe(
      `This is the action for the player dropping an item from their inventory into the room. This action covers the concept of "dropping" very generally –– use this action if the player is putting an item down, taking off a clothing or equipment item, throwing an item, placing an item onto something in the room, etc. Note that the player can ONLY do this action if the item they are dropping is currently in their inventory.`,
    );

export type PlayerInspectsItem = z.infer<Codomain<typeof PlayerInspectsItem>>;
export const PlayerInspectsItem = (itemNames?: NonEmptyArray<ItemName>) =>
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

export type PlayerUsesItem = z.infer<Codomain<typeof PlayerUsesItem>>;
export const PlayerUsesItem = (itemNames?: NonEmptyArray<ItemName>) =>
  z
    .object({
      type: z.enum(["PlayerUsesItem"]),
      item: itemNames === undefined ? ItemName : z.enum(itemNames),
      statusAfterUse: z
        .union([
          z
            .object({
              type: z.enum(["destroyed"]),
            })
            .describe(
              `the item was destroyed (consumed, damaged, broked into pieces, used-up, or otherwise rendered unusable)`,
            ),
          z
            .object({
              type: z.enum(["dropped"]),
              newItemLocationDescription:
                ItemLocationInRoom.shape.description.describe(
                  `for after the item is used, ${ItemLocationInRoom.shape.description.description!}`,
                ),
            })
            .describe(
              `the item was dropped (thrown, dropped, or otherwise moved out of the player's inventory and into the room they are in)`,
            ),
          z
            .object({
              type: z.enum(["inventory"]),
              newItemLocationDescription:
                ItemLocationInPlayerInventory.shape.description.describe(
                  `for after the item is used, ${ItemLocationInPlayerInventory.shape.description.description!}`,
                ),
            })
            .describe(`the item was kept in the player's inventory`),
        ])
        .describe(
          `the new status of the item after being used –– the item can be **destroyed** (consumed, damaged, broked into pieces, used-up, or otherwise rendered unusable), **dropped** (thrown, dropped, or otherwise moved out of the player's inventory and into the room they are in), or kept in the player's **inventory**.`,
        ),
      description: NeString.describe(
        "one-paragraph description of how the player uses the item",
      ),
    })
    .describe(
      `This is the action for the player using an item from their inventory in some way. This action covers the concent of "using" very generally –– use this action if the player is using a device or tool or weapon or some other usable item, eating or drinking a food, drink or other consumable item, throwing an item, using an item on something else, etc.`,
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

export type PlayerMovesToDifferentRoom = z.infer<
  Codomain<typeof PlayerMovesToDifferentRoom>
>;
export const PlayerMovesToDifferentRoom = (rooms?: NonEmptyArray<RoomName>) =>
  z.object({
    type: z.enum(["PlayerMovesToDifferentRoom"]),
    room: (rooms === undefined ? RoomName : z.enum(rooms)).describe(
      "the name of the room to move to",
    ),
    newPlayerLocationDescription: PlayerLocation.shape.description.describe(
      `after finishing moving to the room, ${PlayerLocation.shape.description.description!}`,
    ),
    description: NeString.describe(
      "one-paragraph description of how the player moves from their current location to the room",
    ),
  });

export type PlayerAction = z.infer<Codomain<typeof PlayerAction>>;
export const PlayerAction = (world?: World) =>
  z.union([
    PlayerInspectsRoom,
    PlayerMovesInsideCurrentRoom,
    ...do_<Codomain<typeof PlayerMovesToDifferentRoom>[]>(() => {
      if (world === undefined) return [PlayerMovesToDifferentRoom()];
      const connectedRooms: RoomName[] = findMapAll(
        world.roomConnections,
        (roomConnection) =>
          roomConnection.room1 === world.playerLocation.room
            ? roomConnection.room2
            : roomConnection.room2 === world.playerLocation.room
              ? roomConnection.room1
              : undefined,
      );
      return isNonEmpty(connectedRooms)
        ? [PlayerMovesToDifferentRoom(connectedRooms)]
        : [];
    }),
    ...do_<Codomain<typeof PlayerInspectsItem>[]>(() => {
      if (world === undefined) return [PlayerInspectsItem()];
      const playerItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInPlayerInventory" ||
        (itemLocation.type === "ItemLocationInRoom" &&
          itemLocation.room === world.playerLocation.room)
          ? itemLocation.item
          : undefined,
      );
      return isNonEmpty(playerItems) ? [PlayerInspectsItem(playerItems)] : [];
    }),

    ...do_<Codomain<typeof PlayerTakesItem>[]>(() => {
      if (world === undefined) return [PlayerTakesItem()];
      const roomItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInRoom" &&
        itemLocation.room === world.playerLocation.room
          ? itemLocation.item
          : undefined,
      );
      return isNonEmpty(roomItems) ? [PlayerTakesItem(roomItems)] : [];
    }),
    ...do_<Codomain<typeof PlayerUsesItem>[]>(() => {
      if (world === undefined) return [PlayerUsesItem()];
      const playerItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInPlayerInventory"
          ? itemLocation.item
          : undefined,
      );
      return isNonEmpty(playerItems) ? [PlayerUsesItem(playerItems)] : [];
    }),
    ...do_<Codomain<typeof PlayerDropsItem>[]>(() => {
      if (world === undefined) return [PlayerDropsItem()];
      const playerItems = findMapAll(world.itemLocations, (itemLocation) =>
        itemLocation.type === "ItemLocationInPlayerInventory"
          ? itemLocation.item
          : undefined,
      );
      return isNonEmpty(playerItems) ? [PlayerDropsItem(playerItems)] : [];
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

export type RoomImage = z.infer<typeof RoomImage>;
export const RoomImage = z.object({
  room: RoomName,
  dataUrl: z.string(),
});
