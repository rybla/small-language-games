import { Codomain, fromNever, isNonEmpty, trim } from "@/utility";
import { z } from "genkit";
import { Game, ItemName, RoomName } from "./ontology";
import {
  doesPlayerHaveItem,
  doesRoomHaveItem,
  GameError,
  getItem,
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
    ...PlayerInspectsCurrentRoom_GameAction(game),
    ...PlayerTakesItem_GameAction(game),
    ...PlayerDropsItem_GameAction(game),
    ...PlayerInspectsItem_GameAction(game),
  ] as const as Readonly<
    [
      Codomain<typeof PlayerGoesToRoom_GameAction>[number],
      Codomain<typeof PlayerInspectsCurrentRoom_GameAction>[number],
      Codomain<typeof PlayerTakesItem_GameAction>[number],
      Codomain<typeof PlayerDropsItem_GameAction>[number],
      Codomain<typeof PlayerInspectsItem_GameAction>[number],
    ]
  >);

function mkGameActionSchema<A, S extends z.ZodTypeAny>({
  mkSchemaArgs,
  defaultSchemaArgs,
  mkSchema,
}: {
  mkSchemaArgs: (game: Game) => A | undefined;
  defaultSchemaArgs: A;
  mkSchema: (args: A) => S;
}): (game?: Game) => S[] {
  return (game) => {
    if (game === undefined) return [mkSchema(defaultSchemaArgs)];
    const args = mkSchemaArgs(game);
    if (args === undefined) return [];
    return [mkSchema(args)];
  };
}

export type InferGameAction<
  GameActionSchema extends (...args: any) => z.ZodTypeAny[],
> = z.infer<Codomain<GameActionSchema>[number]>;

// -----------------------------------------------------------------------------
// specific GameActions
// -----------------------------------------------------------------------------

export type PlayerGoesToRoom_GameAction = InferGameAction<
  typeof PlayerGoesToRoom_GameAction
>;
export const PlayerGoesToRoom_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const roomNames = getPlayerRoomConnections(game).map((rc) => rc.there);
    if (!isNonEmpty(roomNames)) return undefined;
    return {
      room: z.enum(Object.freeze(roomNames)),
    };
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

export type PlayerInspectsCurrentRoom_GameAction = InferGameAction<
  typeof PlayerInspectsCurrentRoom_GameAction
>;
export const PlayerInspectsCurrentRoom_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    return {};
  },
  defaultSchemaArgs: {},
  mkSchema(args) {
    return z.object({
      type: z.enum(["PlayerInspectsCurrentRoom"]),
    });
  },
});

export const PlayerTakesItem_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const itemNames = getPlayerRoomItems(game).map((i) => i.name);
    if (!isNonEmpty(itemNames)) return undefined;
    return {
      item: z.enum(Object.freeze(itemNames)),
    };
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
    if (!isNonEmpty(itemNames)) return undefined;
    return {
      item: z.enum(Object.freeze(itemNames)),
    };
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

export type PlayerInspectsItem_GameAction = InferGameAction<
  typeof PlayerInspectsItem_GameAction
>;
export const PlayerInspectsItem_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const itemNames = [
      ...getPlayerItems(game).map((i) => i.name),
      ...getPlayerRoomItems(game).map((i) => i.name),
    ];
    if (!isNonEmpty(itemNames)) return undefined;
    return {
      item: z.enum(Object.freeze(itemNames)),
    };
  },
  defaultSchemaArgs: {
    item: castStringSchemaToEnumSchema(ItemName),
  },
  mkSchema(args) {
    return z.object({
      type: z.enum(["PlayerInspectsItem"]),
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
  } else if (action.type === "PlayerInspectsCurrentRoom") {
    // pass
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
  } else if (action.type === "PlayerInspectsItem") {
    // pass
  } else {
    fromNever(action);
  }
}

// -----------------------------------------------------------------------------
// render
// -----------------------------------------------------------------------------

export function markdownifyGameAction(action: GameAction) {
  if (action.type === "PlayerGoesToRoom") {
    return `The player goes to the room _${action.room}_`;
  } else if (action.type === "PlayerInspectsCurrentRoom") {
    return `The player inspects the current room`;
  } else if (action.type === "PlayerDropsItem") {
    return `The player drops the item _${action.item}_ from their inventory into their current location`;
  } else if (action.type === "PlayerTakesItem") {
    return `The player takes the item _${action.item}_ into their inventory`;
  } else if (action.type === "PlayerInspectsItem") {
    return `The player inspects the item _${action.item}_`;
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
