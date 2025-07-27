import { ai, model, temperature } from "@/backend/ai";
import { getValidMedia, getValidOutput } from "@/backend/ai/common";
import { trim } from "@/utility";
import { GenerateOptions, z } from "genkit";
import {
  Game,
  Item,
  ItemLocation,
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
        openedItems: [],
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
              .array(Item)
              .describe("All the items in the starting room."),
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
      locatedItems: items.map((item) => ({
        item,
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

export const GenerateContainerItems = ai.defineFlow(
  {
    name: "GenerateContainerItems",
    inputSchema: z.object({
      game: Game,
      prompt: z.string(),
      container: Item,
    }),
    outputSchema: z.object({
      items: z.array(Item),
    }),
  },
  async ({ game, prompt, container }) => {
    const { items } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
${makeSystemPrelude_text()}

Game world description: ${game.world.description}

Your task is to create the items that are inside a particular container.
`),
        prompt: trim(`
For this task, you will creating the items that are inside the container _${container.name}_.

Description of _${container.name}_: ${container.description}
Appearance of _${container.name}_: ${container.appearanceDescription}

Keep the following notes in mind:
- Make sure you items you create make sense to be located inside the container _${container.name}_.
- Make sure all of the details you create are thematically coherent with the game world and the container's descriptions.
- Be creative! Include some normal items as some exciting, unique creations that a player would only ever see in your inventive game world.
`),
        output: {
          schema: z.object({
            items: z
              .array(Item)
              .describe(
                `All the items to be placed in the container _${container.name}_.`,
              ),
          }),
        },
      } satisfies GenerateOptions),
    );
    return { items };
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
For this task, you will working with a new room in the game called _${room.name}_.

Room description: ${room.description}

Room appearance: ${room.appearanceDescription}

For this room, _${room.name}_, create some items and connections to some other new rooms.
Keep the following notes in mind:
- Make sure you choose items that make sense to be located in this room.
- Make sure you choose connections to other new rooms that make sense to be connected to this room.
- Make sure all of the details you create are thematically coherent with the game world and this room's description.
- Be creative! Include some normal items and new rooms as well as some exciting, unique creations that a player would only ever see in your inventive game world.
`),
        output: {
          schema: z.object({
            items: z
              .array(Item)
              .describe(
                `All the items to be placed in the room _${roomName}_.`,
              ),
            connectedRooms: z
              .array(
                z.object({
                  roomName: Room.shape.name,
                  roomDescription: Room.shape.description,
                  roomAppearanceDescription: Room.shape.appearanceDescription,
                  descriptionOfPathFromHereToThere: ShortDescription(
                    `path from _${room.name}_ to this room`,
                  ),
                  descriptionOfPathFromThereToHere: ShortDescription(
                    `path from this room to _${room.name}_`,
                  ),
                }),
              )
              .describe(`All the rooms connected to the room _${roomName}_`),
          }),
        },
      } satisfies GenerateOptions),
    );
    return {
      locatedItems: items.map((item) => ({
        item,
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
  - isometric perspecitve
  - slightly padded framing
  - depth using shading and highlights
  - pixelated retro fantasy art style
  - borderless
  - NO TEXT

Image description: A game image arg asset that represents the item _${item.name}_. ${item.appearanceDescription}
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
  - slightly padded framing
  - depth using shading and highlights
  - pixelated retro fantasy art style
  - borderless
  - NO TEXT

Image description: A game image art asset that represents the room _${room.name}_. ${room.appearanceDescription}
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
