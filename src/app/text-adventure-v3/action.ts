import { Codomain, fromNever, isNonEmpty, trim } from "@/utility";
import { z } from "genkit";
import { Game, ItemName, RoomName } from "./ontology";
import {
  doesPlayerHaveItem,
  doesRoomHaveItem,
  GameError,
  getPlayerItems,
  getPlayerRoom,
  getPlayerRoomConnections,
  getPlayerRoomItems,
  setItemLocation,
  setPlayerRoom,
} from "./semantics";

// -----------------------------------------------------------------------------
// GameAction
// -----------------------------------------------------------------------------

export type GameAction = z.infer<Codomain<typeof GameAction>>;
export const GameAction = (game?: Game) =>
  z.union([
    ...PlayerGoesToRoom_GameAction(game),
    ...PlayerTakesItem_GameAction(game),
    ...PlayerDropsItem_GameAction(game),
  ] as const as Readonly<
    [
      Codomain<typeof PlayerGoesToRoom_GameAction>[number],
      Codomain<typeof PlayerTakesItem_GameAction>[number],
      Codomain<typeof PlayerDropsItem_GameAction>[number],
    ]
  >);

function mkGameActionSchema<A, S extends z.ZodTypeAny>({
  mkSchemaArgs,
  defaultSchemaArgs,
  mkSchema,
}: {
  mkSchemaArgs: (game: Game) => A[];
  defaultSchemaArgs: A;
  mkSchema: (args: A) => S;
}) {
  return (game?: Game) => {
    return game === undefined
      ? [mkSchema(defaultSchemaArgs)]
      : mkSchemaArgs(game).map((args) => mkSchema(args));
  };
}

export type InferGameAction<
  GameActionSchema extends (...args: any) => z.ZodTypeAny[],
> = z.infer<Codomain<GameActionSchema>[number]>;

export type PlayerGoesToRoom_GameAction = InferGameAction<
  typeof PlayerGoesToRoom_GameAction
>;
export const PlayerGoesToRoom_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const roomNames = getPlayerRoomConnections(game).map((rc) => rc.there);
    if (!isNonEmpty(roomNames)) return [];
    return [
      {
        room: z.enum(Object.freeze(roomNames)),
      },
    ];
  },
  defaultSchemaArgs: {
    room: castStringSchemaToEnumSchema(RoomName),
  },
  mkSchema(args) {
    return z.object({
      type: z.enum(["PlayerGoesToRoom"]),
      room: args.room,
    });
  },
});

export const PlayerTakesItem_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const itemNames = getPlayerRoomItems(game).map((i) => i.name);
    if (!isNonEmpty(itemNames)) return [];
    return [
      {
        item: z.enum(Object.freeze(itemNames)),
      },
    ];
  },
  defaultSchemaArgs: {
    item: castStringSchemaToEnumSchema(ItemName),
  },
  mkSchema(args) {
    return z.object({
      type: z.enum(["PlayerTakesItem"]),
      item: args.item,
    });
  },
});

export type PlayerDropsItem_GameAction = InferGameAction<
  typeof PlayerDropsItem_GameAction
>;
export const PlayerDropsItem_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const itemNames = getPlayerItems(game).map((i) => i.name);
    if (!isNonEmpty(itemNames)) return [];
    return [
      {
        item: z.enum(Object.freeze(itemNames)),
      },
    ];
  },
  defaultSchemaArgs: {
    item: castStringSchemaToEnumSchema(ItemName),
  },
  mkSchema(args) {
    return z.object({
      type: z.enum(["PlayerDropsItem"]),
      item: args.item,
    });
  },
});

// -----------------------------------------------------------------------------
// interpretGameAction
// -----------------------------------------------------------------------------

export function interpretGameAction(game: Game, action: GameAction) {
  if (action.type === "PlayerGoesToRoom") {
    setPlayerRoom(game, action.room);
  } else if (action.type === "PlayerDropsItem") {
    const playerRoom = getPlayerRoom(game);
    if (!doesPlayerHaveItem(game, action.item))
      throw new GameError(
        game,
        `The player cannot drop the item "${action.item}" because that item is not in the player's inventory`,
      );
    setItemLocation(game, action.item, {
      type: "room",
      roomName: playerRoom.name,
    });
  } else if (action.type === "PlayerTakesItem") {
    const playerRoom = getPlayerRoom(game);
    if (!doesRoomHaveItem(game, playerRoom.name, action.item))
      throw new GameError(
        game,
        `The player cannot take the item "${action.item}" because that item is not in the player's current room, "${playerRoom.name}"`,
      );
    setItemLocation(game, action.item, {
      type: "player",
    });
  } else {
    fromNever(action);
  }
}

// -----------------------------------------------------------------------------
// render
// -----------------------------------------------------------------------------

export function markdownifyGameAction(action: GameAction) {
  if (action.type === "PlayerGoesToRoom") {
    return trim(`
The player goes to the room ${action.room}
  `);
  } else if (action.type === "PlayerDropsItem") {
    return trim(`
The player drops the item ${action.item} from their inventory into their current location
  `);
  } else if (action.type === "PlayerTakesItem") {
    return trim(`
The player takes the item ${action.item} into their inventory
  `);
  } else {
    return fromNever(action);
  }
}

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

function castStringSchemaToEnumSchema(
  s: z.ZodString,
): z.ZodEnum<[string, ...string[]]> {
  // @ts-ignore trust me bro
  return s;
}
