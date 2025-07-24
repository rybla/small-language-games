"use server";

import { id, NonEmptyArray, quoteblockMd } from "@/utility";
import { randomUUID } from "crypto";
import { z } from "genkit";
import { ai, model, temperature } from "../../backend/ai";
import {
  getValidMedia,
  getValidOutput,
  makeMarkdownFilePart,
  makeTextPart,
} from "../../backend/ai/common";
import {
  Game,
  GameId,
  GameMetadata,
  Item,
  ItemImage,
  ItemLocationInRoom,
  ItemName,
  NeString,
  Player,
  PlayerLocation,
  PlayerTurn,
  PreGame,
  Room,
  RoomConnection,
  RoomImage,
  RoomName,
  World,
} from "./ontology";
import {
  presentGame,
  presentGameFromPlayerPerspective,
  presentPreGame,
  presentRoom,
} from "./semantics";

function makeSystemPrelude() {
  return `
You are the game master for a unique and creative text adventure game. Keep the following tips in mind:
  - Be creative!
  - Play along with the user, but also make sure to make the game play out coherently with according the the game's setting.
  - All of your prose should use present tense and 3rd person perspecitve.
`;
}

export const GeneratePreGame = ai.defineFlow(
  {
    name: "GeneratePreGame",
    inputSchema: z.object({
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      pregame: PreGame,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: { temperature: temperature.creative },
      model: model.text_speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The user will provide a high-level prompt for the type of game and game world they would like. Your task is to take their prompt as inspiration and create a new game world that fits the theme of the prompt. The game world should also have a unique and creative feel that sets it apart from other text adventure games. For now, you only need to define the aspects of the game that are specified in the output schema.
`,
        ),
      ],
      prompt: [makeTextPart(input.prompt)],
      output: {
        schema: z.object({
          gameName: Game().shape.metadata.shape.name,
          worldDescription: World.shape.description,
        }),
      },
    });
    const { gameName, worldDescription } = getValidOutput(response);

    return {
      pregame: {
        metadata: id<GameMetadata>({
          name: gameName,
          id: GameId.parse(randomUUID()),
        }),
        worldDescription,
      },
    };
  },
);

export const GenerateGame = ai.defineFlow(
  {
    name: "GenerateGame",
    inputSchema: z.object({
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      game: Game(),
      roomImage: RoomImage,
      itemImages: z.array(ItemImage),
    }),
  },
  async (input) => {
    const { pregame } = await GeneratePreGame({ prompt: input.prompt });
    const { startRoom, connectedRooms, roomConnections } =
      await GenerateStartRoom({
        pregame,
      });
    const { player, playerLocation } = await GeneratePlayer({
      pregame,
      room: startRoom.name,
      prompt: "an everyday inhabitant of this strange world",
    });

    const game: Game = {
      metadata: pregame.metadata,
      world: {
        description: pregame.worldDescription,
        player,
        playerLocation,
        rooms: [startRoom, ...connectedRooms],
        items: [],
        itemLocations: [],
        roomConnections,
        visitedRooms: [startRoom.name],
      },
      turns: [],
    };

    const roomImage = await GenerateRoomImage({
      name: startRoom.name,
      appearanceDescription: startRoom.longDescription,
    });

    const { items, itemLocations, itemImages } = await GenerateRoomItems({
      game,
      room: startRoom.name,
    });

    // TODO: shouldn't modify state in a flow, instead just return all these items and locations
    game.world.items.push(...items);
    game.world.itemLocations.push(...itemLocations);

    return {
      game,
      itemImages,
      roomImage,
    };
  },
);

export const GeneratePlayer = ai.defineFlow(
  {
    name: "GeneratePlayer",
    inputSchema: z.object({
      pregame: PreGame,
      room: RoomName,
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      player: Player,
      playerLocation: PlayerLocation,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: { temperature: temperature.creative },
      model: model.text_speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The user will provide two things:
  - a markdown document that describes the current state of the entire game world so far
  - a prompt for creating a new player

Your task is to create a new player that will be added to the game world, based on the user's prompt. The new player should thematically make sense in the game world, but also bring something new and unique to the world.

The player will start off in the room "${input.room}".
`,
        ),
      ],
      prompt: [
        makeMarkdownFilePart(presentPreGame(input.pregame)),
        makeTextPart(input.prompt),
      ],
      output: {
        schema: z.object({
          name: Player.shape.name,
          shortDescription: Player.shape.shortDescription,
          appearanceDescription: Player.shape.appearanceDescription,
          personalityDescription: Player.shape.personalityDescription,
          skills: Player.shape.skills,
          locationDescription: PlayerLocation.shape.description,
        }),
      },
    });
    const output = getValidOutput(response);
    return {
      player: {
        name: output.name,
        shortDescription: output.shortDescription,
        appearanceDescription: output.appearanceDescription,
        personalityDescription: output.personalityDescription,
        skills: output.skills,
      },
      playerLocation: {
        player: output.name,
        room: input.room,
        description: output.locationDescription,
      },
    };
  },
);

export const GenerateRoomItems = ai.defineFlow(
  {
    name: "GenerateItemForRoom",
    inputSchema: z.object({
      game: Game(),
      room: RoomName,
    }),
    outputSchema: z.object({
      items: z.array(Item),
      itemLocations: z.array(ItemLocationInRoom),
      itemImages: z.array(ItemImage),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: { temperature: temperature.creative },
      model: model.text_speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The following passage describes describes the game world:

${quoteblockMd(input.game.world.description)}

The user will provide a detailed description of the room "${input.room}".

Your task is to create a collection of items for this room.
  - You are REQUIRED to create an item for each specific item that is named in the room's description.
  - You are allowed to create additional items that are not necessarily mentioned in the room's description if these additional items make sense to be in the room and add to the room's immersiveness.
`,
        ),
      ],
      prompt: [
        makeMarkdownFilePart(presentGame(input.game)),
        makeTextPart(presentRoom(input.game.world, input.room)),
      ],
      output: {
        schema: z.array(
          z.object({
            name: Item.shape.name,
            shortDescription: Item.shape.shortDescription,
            appearanceDescription: Item.shape.appearanceDescription,
            locationDescription: ItemLocationInRoom.shape.description,
          }),
        ),
      },
    });

    const items: Item[] = [];
    const itemLocations: ItemLocationInRoom[] = [];

    const outputs = getValidOutput(response);
    for (const output of outputs) {
      items.push({
        name: output.name,
        shortDescription: output.shortDescription,
        appearanceDescription: output.appearanceDescription,
      });
      itemLocations.push({
        type: "ItemLocationInRoom",
        room: input.room,
        item: output.name,
        description: output.locationDescription,
      });
    }
    const itemImages = await Promise.all(
      items.map(async (item) => {
        const { dataUrl } = await GenerateItemImage({
          name: item.name,
          appearanceDescription: item.appearanceDescription,
        });
        return { item: item.name, dataUrl };
      }),
    );

    return { items, itemLocations, itemImages };
  },
);

export const GenerateItemImage = ai.defineFlow(
  {
    name: "GenerateItemImage",
    inputSchema: z.object({
      name: ItemName,
      appearanceDescription: z.string().nonempty(),
    }),
    outputSchema: ItemImage,
  },
  async (input) => {
    const response = await ai.generate({
      model: model.image_power,
      output: { format: "media" },
      prompt: `
${input.appearanceDescription}
Orthographic perspective. Slightly padded framing. Depth using shading, highlights, bevel, emboss. Realistic fantasy style. Painterly style.
`.trim(),
      config: {
        aspectRatio: "1:1",
        numberOfImages: 1,
      },
    });
    const media = getValidMedia(response);
    return { item: input.name, dataUrl: media.url };
  },
);

export const GenerateRoomImage = ai.defineFlow(
  {
    name: "GenerateRoomImage",
    inputSchema: z.object({
      name: RoomName,
      appearanceDescription: z.string().nonempty(),
    }),
    outputSchema: RoomImage,
  },
  async (input) => {
    const response = await ai.generate({
      model: model.image_power,
      output: { format: "media" },
      prompt: `
${input.appearanceDescription}
Orthographic perspective. Slightly padded framing. Depth using shading, highlights, bevel, emboss. Realistic fantasy style. Painterly style.
`.trim(),
      config: {
        aspectRatio: "1:1",
        numberOfImages: 1,
      },
    });
    const media = getValidMedia(response);
    return { room: input.name, dataUrl: media.url };
  },
);

export const GenerateStartRoom = ai.defineFlow(
  {
    name: "GenerateStartRoom",
    inputSchema: z.object({
      pregame: PreGame,
    }),
    outputSchema: z.object({
      startRoom: Room,
      startRoomImage: RoomImage,
      connectedRooms: z.array(Room).nonempty(),
      roomConnections: z.array(RoomConnection).nonempty(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: { temperature: temperature.creative },
      model: model.text_speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The user will provide a markdown document that describes the initial state of the entire game world so far. Your task is to create a start room for the game world where the player will begin the game. The new room should thematically make sense in the game world, but also bring something new and unique to the world.

In addition to the start room, you should also create a few (3-4) rooms that will be connected to the start room. These rooms should be distinct from the start room and also make sense for how and why they are connected to the start room.
`,
        ),
      ],
      prompt: [makeMarkdownFilePart(presentPreGame(input.pregame))],
      output: {
        schema: z.object({
          startRoom: Room,
          connections: z
            .array(
              z.object({
                connectedRoom: Room,
                descriptionOfPathFromStartRoomToConnectedRoom:
                  NeString.describe(
                    RoomConnection.shape.descriptionOfPathFromRoom1ToRoom2
                      .description!.replaceAll("room1", "startRoom")
                      .replaceAll("room2", "connectedRoom"),
                  ),
                descriptionOfPathFromConnectedRoomToStartRoom:
                  NeString.describe(
                    RoomConnection.shape.descriptionOfPathFromRoom2ToRoom1
                      .description!.replaceAll("room1", "startRoom")
                      .replaceAll("room2", "connectedRoom"),
                  ),
              }),
            )
            .nonempty(),
        }),
      },
    });

    const output = getValidOutput(response);

    const startRoomImage = await GenerateRoomImage({
      name: output.startRoom.name,
      appearanceDescription: output.startRoom.longDescription,
    });

    return {
      startRoom: output.startRoom,
      connectedRooms: output.connections.map(
        (x) => x.connectedRoom,
      ) as NonEmptyArray<Room>,
      roomConnections: output.connections.map((x) => ({
        room1: output.startRoom.name,
        room2: x.connectedRoom.name,
        descriptionOfPathFromRoom1ToRoom2:
          x.descriptionOfPathFromStartRoomToConnectedRoom,
        descriptionOfPathFromRoom2ToRoom1:
          x.descriptionOfPathFromConnectedRoomToStartRoom,
      })) as NonEmptyArray<RoomConnection>,
      startRoomImage,
    };
  },
);

export const GenerateRoomConnections = ai.defineFlow(
  {
    name: "GenerateRoomConnections",
    inputSchema: z.object({
      game: Game(),
    }),
    outputSchema: z.object({
      connectedRooms: z.array(Room).nonempty(),
      roomConnections: z.array(RoomConnection).nonempty(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: { temperature: temperature.creative },
      model: model.text_speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The user will provide a markdown document that describes the current state of the entire game world so far. Your task is to create a few (2-3) new rooms that will be connected to the player's current room (referred to as "currentRoom"). These rooms should be distinct from the rooms that already exist in the game so far and also make sense for why they are in the game world and connected to the player's current room.
`,
        ),
      ],
      prompt: [makeMarkdownFilePart(presentGame(input.game))],
      output: {
        schema: z
          .array(
            z.object({
              newRoom: Room,
              descriptionOfPathFromCurrentRoomToNewRoom: NeString.describe(
                RoomConnection.shape.descriptionOfPathFromRoom1ToRoom2
                  .description!.replaceAll("room1", "currentRoom")
                  .replaceAll("room2", "newRoom"),
              ),
              descriptionOfPathFromNewRoomToCurrentRoom: NeString.describe(
                RoomConnection.shape.descriptionOfPathFromRoom2ToRoom1
                  .description!.replaceAll("room1", "newRoom")
                  .replaceAll("room2", "currentRoom"),
              ),
            }),
          )
          .nonempty(),
      },
    });

    const output = getValidOutput(response);
    return {
      connectedRooms: output.map((x) => x.newRoom) as NonEmptyArray<Room>,
      roomConnections: output.map((x) => ({
        room1: input.game.world.playerLocation.room,
        room2: x.newRoom.name,
        descriptionOfPathFromRoom1ToRoom2:
          x.descriptionOfPathFromCurrentRoomToNewRoom,
        descriptionOfPathFromRoom2ToRoom1:
          x.descriptionOfPathFromNewRoomToCurrentRoom,
      })) as NonEmptyArray<RoomConnection>,
    };
  },
);

export const GeneratePlayerTurn = ai.defineFlow(
  {
    name: "GeneratePlayerTurn",
    inputSchema: z.object({
      game: Game(),
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      turn: PlayerTurn(),
    }),
  },
  async (input) => {
    const PlayerTurn_ = PlayerTurn(input.game.world);
    const response = await ai.generate({
      config: { temperature: temperature.normal },
      // model: model.power,
      model: model.text_speed,
      system: [
        makeTextPart(`
${makeSystemPrelude()}

The user is playing as "${input.game.world.player.name}".

The user will provide two things:
  - a markdown file describing the current state of the game world from the perspective of "${input.game.world.player.name}".
  - natural-language instructions of what "${input.game.world.player.name}" will do next in the game

  Your task is to interpret the user's natural-language instructions for what "${input.game.world.player.name}" will do next in the game as an array of structured actions.

Note that this will be an inherently fuzzy interpretation. Do your best to map the user's intentions to available actions, using the state of the game world as context.

Response with only the array of structured actions.
`),
      ],
      prompt: [
        makeMarkdownFilePart(presentGameFromPlayerPerspective(input.game)),
        makeTextPart(input.prompt),
      ],
      output: {
        schema: z.object({
          actions: PlayerTurn_.shape.actions,
          description: PlayerTurn_.shape.description,
        }),
      },
    });

    const { actions, description } = getValidOutput(response);
    return {
      turn: {
        prompt: input.prompt,
        actions,
        description,
      },
    };
  },
);
