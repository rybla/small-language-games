import { ai, model } from "@/backend/ai";
import {
  getValidOutput,
  makeMarkdownFilePart,
  makeTextPart,
} from "@/backend/ai/common";
import { TODO, trim } from "@/utility";
import { GenerateOptions, z } from "genkit";
import { GameAction, markdownifyGameAction } from "./action";
import {
  Game,
  GameView,
  Item,
  ItemLocation,
  ItemName,
  Player,
  Room,
  RoomConnection,
  RoomName,
  ShortDescription,
  World,
} from "./ontology";
import {
  addItem,
  addRoom,
  addRoomConnection,
  markdownifyGameView,
} from "./semantics";

function makeSystemPrelude() {
  return `
You are the game master for a unique and creative text adventure game. Keep the following tips in mind:
  - Be creative!
  - Play along with the user, but also make sure to make the game play out coherently with according the the game's setting.
  - All of your prose should use present tense and 3rd person perspecitve.
`;
}

export const GenerateGame = ai.defineFlow(
  {
    name: "GenerateGame",
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: z.object({
      game: Game,
      itemImageDataUrls: z.record(ItemName, z.string()),
      roomImageDataUrls: z.record(RoomName, z.string()),
    }),
  },
  async ({ prompt }) => {
    const itemImageDataUrls: Record<ItemName, string> = {};
    const roomImageDataUrls: Record<RoomName, string> = {};

    const {
      worldDescription,
      playerName,
      playerDescription,
      playerAppearanceDescription,
    } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${makeSystemPrelude()}

The user will provide a high-level idea of what they want a new game to be about. Your task is to expend the user's game idea into a flushed-out and structured description of an initial game world.
`),
        prompt: trim(`
${prompt}
`),
        output: {
          schema: z.object({
            worldDescription: World.shape.description,
            playerName: Player.shape.name,
            playerDescription: Player.shape.description,
            playerAppearanceDescription: Player.shape.appearanceDescription,
          }),
        },
      } satisfies GenerateOptions),
    );

    const {
      room,
      roomItemsAndItemLocations,
      peripheralRoomsAndRoomConnections,
    } = await GenerateStartingRoom({ worldDescription });

    const game: Game = {
      world: {
        description: worldDescription,
        player: {
          name: playerName,
          description: playerDescription,
          appearanceDescription: playerAppearanceDescription,
          room: room.name,
        },
        rooms: {
          [room.name]: room,
        },
        items: {},
        itemLocations: {},
        roomConnections: {
          [room.name]: [],
        },
        visitedRooms: [room.name],
      },
    };

    for (const { item, itemLocation } of roomItemsAndItemLocations) {
      addItem(game, item, itemLocation);
    }

    for (const {
      room,
      roomConnection_to,
      roomConnection_from,
    } of peripheralRoomsAndRoomConnections) {
      addRoom(game, room);
      addRoomConnection(game, roomConnection_to, roomConnection_from);
    }

    return {
      game,
      itemImageDataUrls,
      roomImageDataUrls,
    };
  },
);

export const GenerateStartingRoom = ai.defineFlow(
  {
    name: "GenerateStartingRoom",
    inputSchema: z.object({
      worldDescription: z.string(),
    }),
    outputSchema: z.object({
      room: Room,
      roomItemsAndItemLocations: z.array(
        z.object({
          item: Item,
          itemLocation: ItemLocation,
        }),
      ),
      peripheralRoomsAndRoomConnections: z.array(
        z.object({
          room: Room,
          roomConnection_to: RoomConnection,
          roomConnection_from: RoomConnection,
        }),
      ),
    }),
  },
  async ({ worldDescription }) => {
    const {
      startingRoomName,
      startingRoomDescription,
      startingRoomAppearanceDescription,
      startingRoomItems,
      startingRoomConnectedRooms,
    } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${makeSystemPrelude()}

The user will provide a description of the world where the game takes place. Your task is to create the starting room for the game that thematicaly fits into that world.
`),
        prompt: trim(`
# World Description

${worldDescription}
`),
        output: {
          schema: z.object({
            startingRoomName: Room.shape.name,
            startingRoomDescription: Room.shape.description,
            startingRoomAppearanceDescription: Room.shape.appearanceDescription,
            startingRoomItems: z.array(
              z.object({
                itemName: Item.shape.name,
                itemDescription: Item.shape.description,
                itemAppearanceDescription: Item.shape.appearanceDescription,
              }),
            ),
            startingRoomConnectedRooms: z.array(
              z.object({
                roomName: Room.shape.name,
                roomDescription: Room.shape.description,
                roomAppearanceDescription: Room.shape.appearanceDescription,
                descriptionOfPathFromHereToThere: ShortDescription(
                  "path from the startign room to this room",
                ),
                descriptionOfPathFromThereToHere: ShortDescription(
                  "path from this room to the starting room",
                ),
              }),
            ),
          }),
        },
      } satisfies GenerateOptions),
    );
    return {
      room: {
        name: startingRoomName,
        description: startingRoomDescription,
        appearanceDescription: startingRoomAppearanceDescription,
      },
      roomItemsAndItemLocations: startingRoomItems.map((x) => ({
        item: {
          name: x.itemName,
          description: x.itemDescription,
          appearanceDescription: x.itemAppearanceDescription,
        },
        itemLocation: {
          type: "room" as const,
          roomName: startingRoomName,
        },
      })),
      peripheralRoomsAndRoomConnections: startingRoomConnectedRooms.map(
        (x) => ({
          room: {
            name: x.roomName,
            description: x.roomDescription,
            appearanceDescription: x.roomAppearanceDescription,
          } satisfies Room,
          roomConnection_to: {
            here: startingRoomName,
            there: x.roomName,
            description: x.descriptionOfPathFromHereToThere,
          },
          roomConnection_from: {
            here: x.roomName,
            there: startingRoomName,
            description: x.descriptionOfPathFromThereToHere,
          },
        }),
      ),
    };
  },
);

export const GenerateCurrentRoom = ai.defineFlow(
  {
    name: "GenerateCurrentRoom",
    inputSchema: z.object({
      game: Game,
      roomConnectionsCount: z.number().min(1),
    }),
    outputSchema: z.object({
      roomItems: z.array(
        z.object({
          item: Item,
          itemLocation: ItemLocation,
          itemImageDataUrl: z.string(),
        }),
      ),
      roomImage_dataUrl: z.string(),
      roomConnections: z.array(RoomConnection),
    }),
  },
  async (input) => {
    return TODO();
  },
);

export const GeneratePeripheralRooms = ai.defineFlow(
  {
    name: "GeneratePeripheralRooms",
    inputSchema: z.object({
      game: Game,
      roomsCount: z.number().min(1),
    }),
    outputSchema: z.object({
      roomsAndRoomConnections: z.array(
        z.object({
          room: Room,
          roomConnection: RoomConnection,
        }),
      ),
    }),
  },
  async (input) => {
    return TODO();
  },
);

export const GenerateItem = ai.defineFlow(
  {
    name: "GenerateItem",
    inputSchema: z.object({
      game: Game,
      itemLocation: ItemLocation,
    }),
    outputSchema: z.object({
      item: Item,
    }),
  },
  async (input) => {
    return TODO();
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
${makeSystemPrelude()}

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
      gameActions: z.array(GameAction()),
    }),
    outputSchema: z.object({
      description: z.string(),
    }),
  },
  async ({ prompt, gameView, game, gameActions }) => {
    const result = await ai.generate({
      model: model.text_speed,
      system: trim(`
${makeSystemPrelude()}

The user will provide:
- a markdown document describing the current game state (before the player's turn)
- an informal description of what the user attempted to do this turn
- a formal description of what the player actually did this turn

Your task is to write a one-paragraph 3rd-person narration of the player's turn as it would be written in the story of a text adventure game, taking into account the current game state and the player's actions. Make it exciting to read.

CRITICAL: immediately response with JUST the narration.
`),
      prompt: [
        makeMarkdownFilePart(markdownifyGameView(gameView)),
        makeTextPart(
          trim(`
Player's attempted actions (informal): "${prompt}"
Player's performed actions (formal):
${gameActions.map((action) => `  - ${markdownifyGameAction(action)}`).join("\n")}
`),
        ),
      ],
    } satisfies GenerateOptions);
    return { description: result.text };
  },
);
