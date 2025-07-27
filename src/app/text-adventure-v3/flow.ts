import { ai, model, temperature } from "@/backend/ai";
import {
  getValidMedia,
  getValidOutput,
  makeMarkdownFilePart,
  makeTextPart,
} from "@/backend/ai/common";
import { randomIntInRange, TODO, trim } from "@/utility";
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
  getRoom,
  getRoomConnections,
  markdownifyGameView,
} from "./semantics";

export function makeSystemPrelude_text() {
  return `
You are the game master for a unique and creative text adventure game. You are well-known for your unique environments, engaging narrative prose, and interesting world-building detailing. Keep the following tips in mind:
  - Be creative!
  - Play along with the user, but also make sure to make the game play out coherently with according the the game's setting.
  - All of your prose should use present tense and 3rd person perspecitve.
`;
}

function makeSystemPrelude_image() {
  return `
You are a professional illustrator for a new unique and creative fantasy adventure game. You are well-known for your intricate styles and detailing. Keep the following tips in mind:
  - Be creative!
  - Make sure to follow the user's instructions carefully, while also fitting everything together thematically
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
    }),
  },
  async ({ prompt }) => {
    const {
      worldDescription,
      playerName,
      playerDescription,
      playerAppearanceDescription,
    } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${makeSystemPrelude_text()}

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

    const { room, locatedItems, connectedRooms } = await GenerateStartingRoom({
      worldDescription,
    });

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
        startingRoom: room.name,
        visitedRooms: [room.name],
      },
    };

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

    return {
      game,
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
      locatedItems: z.array(
        z.object({
          item: Item,
          itemLocation: ItemLocation,
        }),
      ),
      connectedRooms: z.array(
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
      roomName,
      description,
      appearanceDescription,
      items,
      connectedRooms,
    } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${makeSystemPrelude_text()}

The user will provide a description of the world where the game takes place. Your task is to create the starting room for the game that thematicaly fits into that world.
`),
        prompt: trim(`
# World Description

${worldDescription}
`),
        output: {
          schema: z.object({
            roomName: Room.shape.name,
            description: Room.shape.description,
            appearanceDescription: Room.shape.appearanceDescription,
            items: z
              .array(
                z.object({
                  name: Item.shape.name,
                  description: Item.shape.description,
                  appearanceDescription: Item.shape.appearanceDescription,
                }),
              )
              .min(1)
              .describe(
                "All the items in the starting room. These should by the sorts of items that the player could pick up.",
              ),
            connectedRooms: z
              .array(
                z.object({
                  roomName: Room.shape.name,
                  roomDescription: Room.shape.description,
                  roomAppearanceDescription: Room.shape.appearanceDescription,
                  descriptionOfPathFromHereToThere: ShortDescription(
                    `path from the starting room to this room`,
                  ),
                  descriptionOfPathFromThereToHere: ShortDescription(
                    "path from this room to the starting room",
                  ),
                }),
              )
              .min(1)
              .describe("All the rooms connected to the starting room"),
          }),
        },
      } satisfies GenerateOptions),
    );
    return {
      room: {
        name: roomName,
        description,
        appearanceDescription,
      },
      locatedItems: items.map((x) => ({
        item: {
          name: x.name,
          description: x.description,
          appearanceDescription: x.appearanceDescription,
        },
        itemLocation: {
          type: "room" as const,
          roomName: roomName,
        },
      })),
      connectedRooms: connectedRooms.map((x) => ({
        room: {
          name: x.roomName,
          description: x.roomDescription,
          appearanceDescription: x.roomAppearanceDescription,
        } satisfies Room,
        roomConnection_to: {
          here: roomName,
          there: x.roomName,
          description: x.descriptionOfPathFromHereToThere,
        },
        roomConnection_from: {
          here: x.roomName,
          there: roomName,
          description: x.descriptionOfPathFromThereToHere,
        },
      })),
    };
  },
);

export const GenerateNewRoom = ai.defineFlow(
  {
    name: "GenerateNewRoom",
    inputSchema: z.object({
      game: Game,
      roomName: RoomName,
    }),
    outputSchema: z.object({
      locatedItems: z.array(
        z.object({
          item: Item,
          itemLocation: ItemLocation,
        }),
      ),
      connectedRooms: z.array(
        z.object({
          room: Room,
          roomConnection_to: RoomConnection,
          roomConnection_from: RoomConnection,
        }),
      ),
    }),
  },
  async ({ game, roomName }) => {
    const room = getRoom(game, roomName);
    const roomConnections_existing = getRoomConnections(game, roomName);
    const { items, connectedRooms } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${makeSystemPrelude_text()}

Game world description: ${game.world.description}

Your task is to follow the user's instructions to describe a new room in the game.
`),
        prompt: trim(`
For this task, you will working with a new room in the game called "${room.name}".

Room description: ${room.description}

Room appearance: ${room.appearanceDescription}

For this room, "${room.name}", create some items and connections to some other new rooms.
Keep the following notes in mind:
- Make sure you choose items that make sense to be located in this room.
- Make sure you choose connections to other new rooms that make sense to be connected to this room.
- Make sure all of the details you create are thematically coherent with the game world and this room's description.
- Be creative! Include some normal items and new rooms as well as some exciting, unique creations that a player would only ever see in your inventive game world.
`),
        output: {
          schema: z.object({
            items: z
              .array(
                z.object({
                  name: Item.shape.name,
                  description: Item.shape.description,
                  appearanceDescription: Item.shape.appearanceDescription,
                }),
              )
              .min(1)
              .describe(
                `All the items to be placed in the room "${roomName}". These should by the sorts of items that the player could pick up.`,
              ),
            connectedRooms: z
              .array(
                z.object({
                  roomName: Room.shape.name,
                  roomDescription: Room.shape.description,
                  roomAppearanceDescription: Room.shape.appearanceDescription,
                  descriptionOfPathFromHereToThere: ShortDescription(
                    `path from ${room.name} to this room`,
                  ),
                  descriptionOfPathFromThereToHere: ShortDescription(
                    `path from this room to ${room.name}`,
                  ),
                }),
              )
              .min(1)
              .describe(`All the rooms connected to the room "${roomName}"`),
          }),
        },
      } satisfies GenerateOptions),
    );
    return {
      locatedItems: items.map((x) => ({
        item: {
          name: x.name,
          description: x.description,
          appearanceDescription: x.appearanceDescription,
        },
        itemLocation: {
          type: "room" as const,
          roomName: roomName,
        },
      })),
      connectedRooms: connectedRooms.map((x) => ({
        room: {
          name: x.roomName,
          description: x.roomDescription,
          appearanceDescription: x.roomAppearanceDescription,
        } satisfies Room,
        roomConnection_to: {
          here: roomName,
          there: x.roomName,
          description: x.descriptionOfPathFromHereToThere,
        },
        roomConnection_from: {
          here: x.roomName,
          there: roomName,
          description: x.descriptionOfPathFromThereToHere,
        },
      })),
    };
  },
);

export const GenerateItemImage = ai.defineFlow(
  {
    name: "GenerateItemImage",
    inputSchema: z.object({
      game: Game,
      item: Item,
    }),
    outputSchema: z.object({
      dataUrl: z.string(),
    }),
  },
  async ({ game, item }) => {
    const media = getValidMedia(
      await ai.generate({
        model: model.image_cheap,
        prompt: trim(`
Style instructions:
  - orthographic perspecitve
  - slightly padded framing
  - depth using shading and highlights
  - pixelated retro fantasy art style
  - borderless
  - NO TEXT

Image description: A game image arg asset that represents the item "${item.name}". ${item.appearanceDescription}
`),
        output: { format: "media" },
        config: {
          aspectRatio: "1:1",
          numberOfImages: 1,
          temperature: temperature.creative,
        },
      } as GenerateOptions),
    );
    return { dataUrl: media.url };
  },
);
export const GenerateRoomImage = ai.defineFlow(
  {
    name: "GenerateRoomImage",
    inputSchema: z.object({
      game: Game,
      room: Room,
    }),
    outputSchema: z.object({
      dataUrl: z.string(),
    }),
  },
  async ({ game, room }) => {
    const media = getValidMedia(
      await ai.generate({
        model: model.image_cheap,
        prompt: trim(`
Style instructions:
  - orthographic perspecitve
  - slightly padded framing
  - depth using shading and highlights
  - pixelated retro fantasy art style
  - borderless
  - NO TEXT

Image description: A game image art asset that represents the room "${room.name}". ${room.appearanceDescription}
`),
        output: { format: "media" },
        config: {
          aspectRatio: "4:3",
          numberOfImages: 1,
          temperature: temperature.creative,
        },
      } as GenerateOptions),
    );
    return { dataUrl: media.url };
  },
);
