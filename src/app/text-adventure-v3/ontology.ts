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
  rooms: z.record(
    z.lazy(() => RoomName),
    z.lazy(() => Room),
  ),
  items: z.record(
    z.lazy(() => ItemName),
    z.lazy(() => Item),
  ),
  itemLocations: z.record(
    z.lazy(() => ItemName),
    z.lazy(() => ItemLocation),
  ),
  roomConnections: z.record(
    z.lazy(() => RoomName),
    z.array(z.lazy(() => RoomConnection)),
  ),
  visitedRooms: z.array(z.lazy(() => RoomName)),
  newRooms: z.array(z.lazy(() => RoomName)),
});

export type Player = z.infer<typeof Player>;
export const Player = z.object({
  name: z.string(),
  description: OverviewDescription("player"),
  appearanceDescription: AppearanceDescription("player"),
  room: z.lazy(() => RoomName),
});

export type RoomName = z.infer<typeof RoomName>;
export const RoomName = z.string();

export type Room = z.infer<typeof Room>;
export const Room = z.object({
  name: z.string(),
  description: OverviewDescription("room"),
  appearanceDescription: AppearanceDescription("room"),
});

export type RoomConnection = z.infer<typeof RoomConnection>;
export const RoomConnection = z.object({
  here: RoomName,
  there: RoomName,
  description: ShortDescription("path from here to there"),
});

export type ItemName = z.infer<typeof ItemName>;
export const ItemName = z.string();

export type Item = z.infer<typeof Item>;
export const Item = z.object({
  name: ItemName,
  description: OverviewDescription("item"),
  appearanceDescription: AppearanceDescription("item"),
});

export type ItemLocation = z.infer<typeof ItemLocation>;
export const ItemLocation = z.union([
  z.object({ type: z.enum(["player"]) }),
  z.object({ type: z.enum(["room"]), roomName: RoomName }),
  // z.object({ type: z.enum(["destroyed"]) }), // TODO:advanced
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
  visitedRooms: World.shape.visitedRooms,
});

export type PlayerView = z.infer<typeof PlayerView>;
export const PlayerView = z.object({
  name: Player.shape.name,
  description: Player.shape.description,
  appearanceDescription: Player.shape.appearanceDescription,
  items: z.array(z.lazy(() => ItemView)),
});

export type RoomView = z.infer<typeof RoomView>;
export const RoomView = z.object({
  name: Room.shape.name,
  description: Room.shape.description,
  appearanceDescription: Room.shape.appearanceDescription,
  items: z.array(z.lazy(() => ItemView)),
  connections: z.array(RoomConnection),
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
