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
    ...PlayerGoesToRoomAction(game),
    ...PlayerTakesItemAction(game),
    ...PlayerDropsItemAction(game),
  ] as const as Readonly<
    [
      Codomain<typeof PlayerGoesToRoomAction>[number],
      Codomain<typeof PlayerTakesItemAction>[number],
      Codomain<typeof PlayerDropsItemAction>[number],
    ]
  >);

export type PlayerGoesToRoomAction = z.infer<
  Codomain<typeof PlayerGoesToRoomAction>[number]
>;
export const PlayerGoesToRoomAction = (game?: Game) => {
  function mkSchemaArgs(game: Game) {
    const roomNames = getPlayerRoomConnections(game).map((rc) => rc.there);
    if (!isNonEmpty(roomNames)) return [];
    return [
      {
        room: z.enum(Object.freeze(roomNames)),
      },
    ];
  }

  function mkSchema(args: Codomain<typeof mkSchemaArgs>[number]) {
    return z.object({
      type: z.enum(["PlayerGoesToRoom"]),
      room: args.room,
    });
  }

  return game === undefined
    ? [
        mkSchema({
          room: castStringSchemaToEnumSchema(RoomName),
        }),
      ]
    : mkSchemaArgs(game).map((args) => mkSchema(args));
};

export type PlayerTakesItemAction = z.infer<
  Codomain<typeof PlayerTakesItemAction>[number]
>;
export const PlayerTakesItemAction = (game?: Game) => {
  function mkSchemaArgs(game: Game) {
    const itemNames = getPlayerRoomItems(game).map((i) => i.name);
    console.log(`[PlayerTakesItemAction] itemNames: ${itemNames}`);
    if (!isNonEmpty(itemNames)) return [];
    return [
      {
        item: z.enum(Object.freeze(itemNames)),
      },
    ];
  }

  function mkSchema(args: Codomain<typeof mkSchemaArgs>[number]) {
    return z.object({
      type: z.enum(["PlayerTakesItem"]),
      item: args.item,
    });
  }

  return game === undefined
    ? [
        mkSchema({
          item: castStringSchemaToEnumSchema(ItemName),
        }),
      ]
    : mkSchemaArgs(game).map((args) => mkSchema(args));
};

export type PlayerDropsItemAction = z.infer<
  Codomain<typeof PlayerDropsItemAction>[number]
>;
export const PlayerDropsItemAction = (game?: Game) => {
  function mkSchemaArgs(game: Game) {
    const itemNames = getPlayerItems(game).map((i) => i.name);
    if (!isNonEmpty(itemNames)) return [];
    return [
      {
        item: z.enum(Object.freeze(itemNames)),
      },
    ];
  }

  function mkSchema(args: Codomain<typeof mkSchemaArgs>[number]) {
    return z.object({
      type: z.enum(["PlayerDropsItem"]),
      item: args.item,
    });
  }

  return game === undefined
    ? [
        mkSchema({
          item: castStringSchemaToEnumSchema(ItemName),
        }),
      ]
    : mkSchemaArgs(game).map((args) => mkSchema(args));
};

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
