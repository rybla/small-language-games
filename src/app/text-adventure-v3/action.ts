import { ai, model } from "@/backend/ai";
import {
  getValidOutput,
  makeMarkdownFilePart,
  makeTextPart,
} from "@/backend/ai/common";
import {
  Codomain,
  fromNever,
  isNonEmpty,
  NonEmptyArray,
  trim,
} from "@/utility";
import { GenerateOptions, z } from "genkit";
import { A } from "./constant";
import * as flow from "./flow";
import { Game, GameView, Item, ItemName, RoomName } from "./ontology";
import {
  addItem,
  doesPlayerHaveItem,
  doesRoomHaveItem,
  GameError,
  getItem,
  getPlayerItems,
  getPlayerRoom,
  getPlayerRoomConnections,
  getPlayerRoomItems,
  getRoomConnections,
  markdownifyGameView,
  setItemLocation,
  setPlayerRoom,
  isRoomVisited,
  addRoom,
  addRoomConnection,
  visitRoom,
} from "./semantics";

// -----------------------------------------------------------------------------
// GameAction
// -----------------------------------------------------------------------------

export type GameAction = z.infer<Codomain<typeof GameAction>>;
export const GameAction = (game?: Game) =>
  z.union([
    ...PlayerGoesToRoom_GameAction(game),
    ...PlayerInspectsCurrentRoom_GameAction(game),
    ...PlayerInspectsConnectionToAnotherRoom_GameAction(game),
    ...PlayerTakesItem_GameAction(game),
    ...PlayerDropsItem_GameAction(game),
    ...PlayerInspectsItem_GameAction(game),
    ...PlayerCombinesItems_GameAction(game),
  ] as const as Readonly<
    [
      Codomain<typeof PlayerGoesToRoom_GameAction>[number],
      Codomain<typeof PlayerInspectsCurrentRoom_GameAction>[number],
      Codomain<typeof PlayerInspectsConnectionToAnotherRoom_GameAction>[number],
      Codomain<typeof PlayerTakesItem_GameAction>[number],
      Codomain<typeof PlayerDropsItem_GameAction>[number],
      Codomain<typeof PlayerInspectsItem_GameAction>[number],
      Codomain<typeof PlayerCombinesItems_GameAction>[number],
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
    return z
      .object({
        type: z.enum(["PlayerGoesToRoom"]),
        room: args.room,
      })
      .describe("the action where the player goes to a another room");
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
    return z
      .object({
        type: z.enum(["PlayerInspectsCurrentRoom"]),
      })
      .describe(
        "the action where the player inspects something about their current room",
      );
  },
});

export type PlayerInspectsConnectionToAnotherRoom_GameAction = InferGameAction<
  typeof PlayerInspectsConnectionToAnotherRoom_GameAction
>;
export const PlayerInspectsConnectionToAnotherRoom_GameAction =
  mkGameActionSchema({
    mkSchemaArgs(game) {
      const connectedRooms = getRoomConnections(game, getPlayerRoom(game).name);
      return {
        room: z.enum(
          connectedRooms.map((cr) => cr.there) as NonEmptyArray<string>,
        ),
      };
    },
    defaultSchemaArgs: {
      room: castStringSchemaToEnumSchema(RoomName),
    },
    mkSchema(args) {
      return z
        .object({
          type: z.enum(["PlayerInspectsConnectionToAnotherRoom"]),
          room: args.room,
        })
        .describe(
          "the action where the player inspects a connection to another room",
        );
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
    return z
      .object({
        type: z.enum(["PlayerTakesItem"]),
        item: args.item.describe("the name of the item that the player takes"),
      })
      .describe(
        "the action where the player takes an item from their current room and adds it to their inventory",
      );
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
    return z
      .object({
        type: z.enum(["PlayerDropsItem"]),
        item: args.item.describe("the name of the item that the player drops"),
      })
      .describe(
        "the action where the player drops an item from their inventory into their current room",
      );
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
    return z
      .object({
        type: z.enum(["PlayerInspectsItem"]),
        item: args.item.describe(
          "the name of the item that the player inspects",
        ),
      })
      .describe(
        "the action where the player inspects an item in their inventory or in their current room",
      );
  },
});

export type PlayerCombinesItems_GameAction = InferGameAction<
  typeof PlayerCombinesItems_GameAction
>;
export const PlayerCombinesItems_GameAction = mkGameActionSchema({
  mkSchemaArgs(game) {
    const itemNames = [...getPlayerItems(game).map((i) => i.name)];
    if (!isNonEmpty(itemNames)) return undefined;
    return {
      item1: z.enum(Object.freeze(itemNames)),
      item2: z.enum(Object.freeze(itemNames)),
    };
  },
  defaultSchemaArgs: {
    item1: castStringSchemaToEnumSchema(ItemName),
    item2: castStringSchemaToEnumSchema(ItemName),
  },
  mkSchema(args) {
    return z
      .object({
        type: z.enum(["PlayerCombinesItems"]),
        item1: args.item1.describe(
          "the name of the first item that the player combines together with the second item",
        ),
        item2: args.item2.describe(
          "the name of the second item that the player combines together with the first item",
        ),
      })
      .describe(
        "the action where the player combines together two items in their inventory somehow",
      );
  },
});

// -----------------------------------------------------------------------------
// interpretGameAction
// -----------------------------------------------------------------------------

export async function interpretGameAction(
  game: Game,
  action: A,
  gameAction: GameAction,
): Promise<string> {
  if (gameAction.type === "PlayerGoesToRoom") {
    const currentRoom = getPlayerRoom(game);
    const roomConnection = getRoomConnections(game, currentRoom.name).find(
      (rc) => rc.there === gameAction.room,
    );
    if (roomConnection === undefined)
      throw new GameError(
        game,
        `The player cannot go to the room _${gameAction.room}_ because it is not connected to their current room.`,
      );
    setPlayerRoom(game, gameAction.room);
    if (!isRoomVisited(game, gameAction.room)) {
      const { locatedItems, connectedRooms } = await flow.GenerateNewRoom({
        game: game,
        roomName: gameAction.room,
      });
      for (const { item, itemLocation } of locatedItems) {
        addItem(game, item, itemLocation);
      }
      for (const {
        room,
        roomConnection_to,
        roomConnection_from,
      } of connectedRooms) {
        addRoom(game, room);
        addRoomConnection(game, roomConnection_to, roomConnection_from);
      }
      visitRoom(game, gameAction.room);
      return `The player goes to the room _${gameAction.room}_: ${roomConnection.description} This is the first time the player has visited this room.`;
    }
    return `The player goes to the room _${gameAction.room}_: ${roomConnection.description}`;
  } else if (gameAction.type === "PlayerInspectsCurrentRoom") {
    return `The player inspects the current room.`;
  } else if (gameAction.type === "PlayerInspectsConnectionToAnotherRoom") {
    // TODO: how to properly include reference to the roomConnection.description here without making it seem like the player is actually going there
    return `The player inspects the connection to the room _${gameAction.room}_.`;
  } else if (gameAction.type === "PlayerDropsItem") {
    const playerRoom = getPlayerRoom(game);
    if (!doesPlayerHaveItem(game, gameAction.item))
      throw new GameError(
        game,
        `The player cannot drop the item _${gameAction.item}_ because that item is not in the player's inventory`,
      );
    setItemLocation(game, gameAction.item, {
      type: "room",
      roomName: playerRoom.name,
    });
    return `The player drops the item _${gameAction.item}_ from their inventory into their current location.`;
  } else if (gameAction.type === "PlayerTakesItem") {
    const playerRoom = getPlayerRoom(game);
    if (!doesRoomHaveItem(game, playerRoom.name, gameAction.item))
      throw new GameError(
        game,
        `The player cannot take the item _${gameAction.item}_ because that item is not in the player's current room, "${playerRoom.name}"`,
      );
    const item = getItem(game, gameAction.item);
    if (!item.pickupable.isPickup) {
      return `The player cannot take the item _${gameAction.item}_ because: ${item.pickupable.reasonWhyNotPickup}`;
    }
    setItemLocation(game, gameAction.item, {
      type: "player",
    });
    return `The player takes the item _${gameAction.item}_. The item is now in the player's inventory.`;
  } else if (gameAction.type === "PlayerInspectsItem") {
    return `The player inspects the item _${gameAction.item}_.`;
  } else if (gameAction.type === "PlayerCombinesItems") {
    const item1 = getItem(game, gameAction.item1);
    const item2 = getItem(game, gameAction.item2);
    setItemLocation(game, gameAction.item1, { type: "nonexistent" });
    setItemLocation(game, gameAction.item2, { type: "nonexistent" });
    const { item } = await GenerateCombinationItem({
      game,
      prompt: action.prompt,
      item1,
      item2,
    });
    addItem(game, item, { type: "player" });
    return `The player combines the items _${gameAction.item1}_ and _${gameAction.item2}_ in their inventory. The resulting combination is _${item.name}_: ${item.description}`;
  } else {
    return fromNever(gameAction);
  }
}

// -----------------------------------------------------------------------------
// flows
// -----------------------------------------------------------------------------

const GenerateCombinationItem = ai.defineFlow(
  {
    name: "GenerateCombinationItem",
    inputSchema: z.object({
      game: Game,
      prompt: z.string(),
      item1: Item,
      item2: Item,
    }),
    outputSchema: z.object({
      item: Item,
    }),
  },
  async ({ game, prompt, item1, item2 }) => {
    const item = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${flow.makeSystemPrelude_text()}

The user will provide:
- a markdown document describing the current game state
- a natural-language command for how they want to combine two items in their inventory.

Your task is to consider how the player combines these two items, and to create a structured description for the resulting combined item.
`),
        prompt: trim(`
The player is combining the item "${item1.name}" with the item "${item2.name}" in the following manner: ${prompt}

The following are detailed descriptions of the two items:

**${item1.name}:**
  - description: ${item1.description}
  - appearance: ${item1.appearanceDescription}

**${item2.name}:**
  - description: ${item2.description}
  - appearance: ${item2.appearanceDescription}
`),
        output: {
          schema: Item,
        },
      } satisfies GenerateOptions),
    );
    return { item };
  },
);

// TODO:IDEA generate these in sequence, where you gen the action, then interpret it, then generate a new action based on the resulting state
export const GenerateAction = ai.defineFlow(
  {
    name: "GenerateAction",
    inputSchema: z.object({
      prompt: z.string(),
      gameView: GameView,
      game: Game,
    }),
    outputSchema: z.object({
      gameAction: GameAction(),
    }),
  },
  async ({ prompt, gameView, game }) => {
    const { action } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${flow.makeSystemPrelude_text()}

The user will provide:
  - a markdown document describing the current game state
  - a natural-language command for what they want to do as the player in the game

Your task is to interpret their command as a structured game action (which is specified by the output schema), taking into account the current game state.
`),
        prompt: [
          makeMarkdownFilePart(markdownifyGameView(gameView)),
          makeTextPart(prompt),
        ],
        output: {
          schema: z.object({ action: GameAction(game) }),
        },
      } satisfies GenerateOptions),
    );
    return { gameAction: action };
  },
);

export const GenerateTurnDescription = ai.defineFlow(
  {
    name: "GenerateTurnDescription",
    inputSchema: z.object({
      prompt: z.string(),
      gameView: GameView,
      game: Game,
      gameActionDescriptions: z.array(z.string()),
    }),
    outputSchema: z.object({
      description: z.string(),
    }),
  },
  async ({ prompt, gameView, game, gameActionDescriptions }) => {
    const result = await ai.generate({
      model: model.text_speed,
      system: trim(`
${flow.makeSystemPrelude_text()}

The user will provide:
- a markdown document describing the current game state (before the player's turn)
- an informal description of what the user attempted to do this turn
- a formal description of what the player actually did this turn

Your task is to write a one-paragraph 3rd-person narration of the player's turn as it would be written in the story of a text adventure game, taking into account the current game state and the player's actions. Make it exciting to read.

CRITICAL: ONLY write the narration in your response.
`),
      prompt: [
        makeMarkdownFilePart(markdownifyGameView(gameView)),
        makeTextPart(
          trim(`
Player's informal instructions for the actions they intended to perform: "${prompt}"
Player's actually performed actions (formal):
${gameActionDescriptions.map((gad) => `  - ${gad}`).join("\n")}
`),
        ),
      ],
    } satisfies GenerateOptions);
    return { description: result.text };
  },
);

// -----------------------------------------------------------------------------
// utilities
// -----------------------------------------------------------------------------

function castStringSchemaToEnumSchema(
  s: z.ZodString,
): z.ZodEnum<[string, ...string[]]> {
  // @ts-ignore trust me bro
  return s;
}
