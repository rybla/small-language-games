export type Game = {
  world: World;
};

export type World = {
  description: string;
  player: Player;
  rooms: Map<RoomName, Room>;
  items: Map<ItemName, Item>;
  itemLocations: Map<ItemName, ItemLocation>;
  roomConnections: Map<RoomName, RoomConnection[]>;
};

export type Player = {
  name: string;
  description: string;
  appearanceDescription: string;
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
  descriptionFromHereToThere: string; // here -> there
  descriptionFromThereToHere: string; // there -> here
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
