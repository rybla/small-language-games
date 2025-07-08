import type { Game, GameId, GameName, World } from "../ontology";

export const world: World = {
  description: "",
  rooms: [],
  players: [],
  items: [],
  itemLocations: [],
  playerLocations: [],
};

export const game: Game = {
  id: "example1" as GameId,
  name: "Example 1" as GameName,
  turns: [],
  world,
};
