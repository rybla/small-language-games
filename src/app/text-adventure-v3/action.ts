import { Codomain, isNonEmpty } from "@/utility";
import { z } from "genkit";
import { Game, ItemName, RoomName } from "./ontology";
import { getPlayerItems, getPlayerRoomConnections } from "./semantics";

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
      type: z.enum(["PlayerGoesToRoom"]),
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
// utilities
// -----------------------------------------------------------------------------

function castStringSchemaToEnumSchema(
  s: z.ZodString,
): z.ZodEnum<[string, ...string[]]> {
  // @ts-ignore trust me bro
  return s;
}
