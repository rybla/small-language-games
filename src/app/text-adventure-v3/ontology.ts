// -----------------------------------------------------------------------------
// Action
// -----------------------------------------------------------------------------

export type Game = {
  world: World;
};

export type World = {
  description: string;
  player: Player;
  rooms: Record<RoomName, Room>;
  items: Record<ItemName, Item>;
  itemLocations: Record<ItemName, ItemLocation>;
  roomConnections: Record<RoomName, RoomConnection[]>;
};

export type Player = {
  name: string;
  description: string;
  appearanceDescription: string;
  room: RoomName;
};

export type RoomName = string;

export type Room = {
  name: string;
  description: string;
  appearanceDescription: string;
};

export type RoomConnection = {
  here: RoomName;
  there: RoomName;
  description: string; // here -> there
};

export type ItemName = string;

export type Item = {
  name: string;
  description: string;
  appearanceDescription: string;
  uses: string[];
  // disabled <=> cannot be used anymore
  disabled: boolean;
};

export type ItemLocation =
  | { type: "player" }
  | { type: "room"; roomName: RoomName }
  | { type: "destroyed" };

// -----------------------------------------------------------------------------
// GameView
// -----------------------------------------------------------------------------

export type GameView = {
  world: WorldView;
};

export type WorldView = {
  player: PlayerView;
  room: RoomView;
};

export type PlayerView = {
  name: string;
  description: string;
  appearanceDescription: string;
  items: ItemView[];
};

export type RoomView = {
  name: string;
  description: string;
  appearanceDescription: string;
  items: ItemView[];
  connections: RoomConnection[];
};

export type ItemView = Item;
