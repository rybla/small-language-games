"use server";

import { z } from "genkit";
import { ai, model, temperature } from "../../backend/ai";
import {
  PlayerAction,
  Game,
  PlayerName,
  presentWorld,
  presentWorldFromPlayerPerspective,
  Room,
  World,
  Player,
  Item,
  RoomName,
  presentRoom,
  PlacedInRoom,
  PlayerLocation,
} from "./ontology";
import {
  makeMarkdownFilePart,
  getValidOutput,
  makeTextPart,
} from "../../backend/ai/common";
import { quoteblockMd } from "@/utility";

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
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      game: Game,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: { temperature: temperature.creative },
      model: model.speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The user will provide a high-level prompt for what kind of game they would like. Your task is to take their prompt as inspiration and create a new game world that fits the theme of the prompt. The game world should also have a unique and creative feel that sets it apart from other text adventure games. For now, you only need to define the aspects of the game that are specified in the output schema.
`,
        ),
      ],
      prompt: [makeTextPart(input.prompt)],
      output: {
        schema: z.object({
          name: Game.shape.name,
          world: World.pick({ name: true, description: true }),
        }),
      },
    });
    const game_ = getValidOutput(response);
    return {
      game: {
        name: game_.name,
        world: {
          ...game_.world,
          itemLocations: [],
          items: [],
          playerLocations: [],
          players: [],
          rooms: [],
        },
        turns: [],
      },
    };
  },
);

export const GeneratePlayer = ai.defineFlow(
  {
    name: "GeneratePlayer",
    inputSchema: z.object({
      game: Game,
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
      config: {
        temperature: temperature.creative,
      },
      model: model.speed,
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
        makeMarkdownFilePart(presentWorld(input.game.world)),
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

export const GenerateItemsForRoom = ai.defineFlow(
  {
    name: "GenerateItemForRoom",
    inputSchema: z.object({
      game: Game,
      name: RoomName,
    }),
    outputSchema: z.object({
      itemAndItemLocations: z.array(
        z.object({
          item: Item,
          itemLocation: PlacedInRoom,
        }),
      ),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: {
        temperature: temperature.creative,
      },
      model: model.speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The following passage describes describes the game world:

${quoteblockMd(input.game.world.description)}

The user will provide a detailed description of the room "${input.name}".

Your task is to create a collection of items for this room.
  - You are REQUIRED to create an item for each specific item that is named in the room's description.
  - You are allowed to create additional items that are not necessarily mentioned in the room's description if these additional items make sense to be in the room and add to the room's immersiveness.
`,
        ),
      ],
      prompt: [
        makeMarkdownFilePart(presentWorld(input.game.world)),
        makeTextPart(presentRoom(input.game.world, input.name)),
      ],
      output: {
        schema: z.array(
          z.object({
            name: Item.shape.name,
            shortDescription: Item.shape.shortDescription,
            appearanceDescription: Item.shape.appearanceDescription,
            locationDescription: PlacedInRoom.shape.description,
          }),
        ),
      },
    });

    return {
      itemAndItemLocations: getValidOutput(response).map<{
        item: Item;
        itemLocation: PlacedInRoom;
      }>((x) => ({
        item: {
          name: x.name,
          shortDescription: x.shortDescription,
          appearanceDescription: x.appearanceDescription,
        },
        itemLocation: {
          type: "PlacedInRoom",
          room: input.name,
          item: x.name,
          description: x.locationDescription,
        },
      })),
    };
  },
);

export const GenerateRoom = ai.defineFlow(
  {
    name: "GenerateRoom",
    inputSchema: z.object({
      game: Game,
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      room: Room,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      config: {
        temperature: temperature.creative,
      },
      model: model.speed,
      system: [
        makeTextPart(
          `
${makeSystemPrelude()}

The user will provide a markdown document that describes the current state of the entire game world so far. Your task is to create a new room that will be added to the game world. The new room should thematically make sense in the game world, but also bring something new and unique to the world. The room should also have a clear objective or challenge that the player must overcome to progress through the room.
`,
        ),
      ],
      prompt: [makeMarkdownFilePart(presentWorld(input.game.world))],
      output: {
        schema: Room,
      },
    });
    return { room: getValidOutput(response) };
  },
);

export const GeneratePlayerActions = ai.defineFlow(
  {
    name: "GeneratePlayerActions",
    inputSchema: z.object({
      game: Game,
      name: PlayerName,
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      actions: z.array(PlayerAction).min(1),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      system: [
        makeTextPart(`
${makeSystemPrelude()}

The user is playing as "${input.name}".

The user will provide two things:
  - a markdown file describing the current state of the game world from the perspective of "${input.name}".
  - natural-language instructions of what "${input.name}" will do next in the game

Your task is to interpret the user's natural-language instructions for what "${input.name}" will do next in the game as an array of structured actions.

Note that this will be an inherently fuzzy interpretation. Do your best to map the user's intentions to available actions, using the state of the game world as context.

Response with only the array of structured actions.
`),
      ],
      prompt: [
        makeMarkdownFilePart(
          presentWorldFromPlayerPerspective(input.game.world, input.name),
        ),
        makeTextPart(input.prompt),
      ],
      output: {
        schema: z.array(PlayerAction).min(1),
      },
    });

    const actions = getValidOutput(response);
    return { actions };
  },
);
