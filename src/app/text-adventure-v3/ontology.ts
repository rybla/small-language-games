// -----------------------------------------------------------------------------
// Game
// -----------------------------------------------------------------------------

import { z } from "genkit";

export type Game = z.infer<typeof Game>;
export const Game = z.object({
  world: z.lazy(() => World),
});

export type World = z.infer<typeof World>;
export const World = z.object({
  description: OverviewDescription("world"),
  player: z.lazy(() => Player),
  rooms: z
    .record(
      z.lazy(() => RoomName),
      z.lazy(() => Room),
    )
    .describe("a mapping from each room's name to that room's properties"),
  items: z
    .record(
      z.lazy(() => ItemName),
      z.lazy(() => Item),
    )
    .describe("a mapping from each item's name to that item's properties"),
  itemLocations: z
    .record(
      z.lazy(() => ItemName),
      z.lazy(() => ItemLocation),
    )
    .describe(
      "a mapping from each item's name to that item's current location",
    ),
  roomConnections: z
    .record(
      z.lazy(() => RoomName),
      z.array(z.lazy(() => RoomConnection)),
    )
    .describe(
      "a mapping from each room's name to the connections that room has to other rooms",
    ),
  startingRoom: z
    .lazy(() => RoomName)
    .describe("the name of the room that the player starts the game in"),
  visitedRooms: z
    .array(z.lazy(() => RoomName))
    .describe("the names of all the rooms that the player has visited so far"),
  openedItems: z
    .array(z.lazy(() => ItemName))
    .describe("the names of all the items that the player has opened so far"),
});

export type Player = z.infer<typeof Player>;
export const Player = z
  .object({
    name: Name("the player character"),
    description: OverviewDescription("player"),
    appearanceDescription: AppearanceDescription("player"),
    room: z.lazy(() => RoomName),
  })
  .describe(
    `All the properties of the player character that the user is playing as`,
  );

export type RoomName = z.infer<typeof RoomName>;
export const RoomName = Name("room");

export type Room = z.infer<typeof Room>;
export const Room = z.object({
  name: RoomName,
  description: OverviewDescription("room"),
  appearanceDescription: AppearanceDescription("room"),
});

export type RoomConnection = z.infer<typeof RoomConnection>;
export const RoomConnection = z.object({
  here: Name("the name of the room the player is already in"),
  there: Name("the name of the room the player is moving to"),
  description: ShortDescription(
    "path from the `here` room to the `there` room",
  ),
});

export type ItemName = z.infer<typeof ItemName>;
export const ItemName = Name("item");

export type Item = z.infer<typeof Item>;
export const Item = z.object({
  name: ItemName,
  description: OverviewDescription("item"),
  appearanceDescription: AppearanceDescription("item"),
  container: z.lazy(() => ItemContainer),
  pickupable: z.lazy(() => ItemPickupable),
});

export type ItemContainer = z.infer<typeof ItemContainer>;
export const ItemContainer = z.union([
  z.object({
    isContainer: z
      .enum(["true"])
      .describe("whether this item is a container that can hold other items"),
    howToOpen: ShortDescription("way to open this container (if it is closed)"),
    howToStoreItem: ShortDescription(
      "way to store an item inside this container",
    ),
  }),
  z.object({
    isContainer: z
      .enum(["false"])
      .describe("whether this item is a container that can hold other items"),
  }),
]);

export type ItemPickupable = z.infer<typeof ItemPickupable>;
export const ItemPickupable = z.union([
  z.object({
    isPickup: z
      .enum(["true"])
      .describe("whether this item can be picked up by the player"),
  }),
  z.object({
    isPickup: z
      .enum(["false"])
      .describe("whether this item can be picked up by the player"),
    reasonWhyNotPickup: ShortDescription(
      "main reason why this item cannot be picked up",
    ),
  }),
]);

export type ItemLocation = z.infer<typeof ItemLocation>;
export const ItemLocation = z.union([
  z
    .object({ type: z.enum(["player"]) })
    .describe(
      "this property specifies that the item's location is in the player's inventory",
    ),
  z
    .object({ type: z.enum(["room"]), roomName: RoomName })
    .describe(
      "this property specifies that the item's location is in the room of the specified name",
    ),
  z.object({ type: z.enum(["nonexistent"]) }),
  z.object({ type: z.enum(["container"]), containerName: ItemName }),
]);

// -----------------------------------------------------------------------------
// GameView
// -----------------------------------------------------------------------------

export type GameView = z.infer<typeof GameView>;
export const GameView = z.object({
  world: z.lazy(() => WorldView),
});

export type WorldView = z.infer<typeof WorldView>;
export const WorldView = z.object({
  player: z.lazy(() => PlayerView),
  room: z.lazy(() => RoomView),
  startingRoom: World.shape.startingRoom,
  visitedRooms: World.shape.visitedRooms,
  openedItems: World.shape.openedItems,
});

export type PlayerView = z.infer<typeof PlayerView>;
export const PlayerView = z.object({
  name: Player.shape.name,
  description: Player.shape.description,
  items: z
    .array(z.lazy(() => ItemView))
    .describe("all the items in the player's inventory"),
});

export type RoomView = z.infer<typeof RoomView>;
export const RoomView = z.object({
  name: Room.shape.name,
  description: Room.shape.description,
  appearanceDescription: Room.shape.appearanceDescription,
  items: z.array(z.lazy(() => ItemView)).describe("all the items in this room"),
  connections: z
    .array(RoomConnection)
    .describe("all the connections from this room to other rooms"),
});

export type ItemView = z.infer<typeof ItemView>;
export const ItemView = z.object({
  name: Item.shape.name,
  description: Item.shape.description,
  appearanceDescription: Item.shape.appearanceDescription,
});

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

export function Name(subject: string) {
  return z.string().describe(`the name of the ${subject}`);
}

export function ShortDescription(subject: string) {
  return z.string().describe(`one-sentence description of the ${subject}`);
}

export function OverviewDescription(subject: string) {
  return z.string().describe(`one-paragraph overview of the ${subject}`);
}

export function AppearanceDescription(subject: string) {
  return z
    .string()
    .describe(`one-paragraph vivid visual description of the ${subject}`);
}
