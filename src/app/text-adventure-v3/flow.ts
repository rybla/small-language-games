import { ai } from "@/backend/ai";
import { getValidOutput } from "@/backend/ai/common";
import { TODO } from "@/utility";
import { GenerateOptions, z } from "genkit";
import { GameAction } from "./action";
import {
  Game,
  Item,
  ItemLocation,
  Player,
  Room,
  RoomConnection,
  ShortDescription,
  World,
} from "./ontology";
import { addItem, addRoom, addRoomConnection } from "./semantics";

export const GenerateGame = ai.defineFlow(
  {
    name: "GenerateGame",
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: z.object({
      game: Game,
      itemImageDataUrls: z.array(z.string()),
      roomImageDataUrls: z.array(z.string()),
    }),
  },
  async ({ prompt }) => {
    const itemImageDataUrls: string[] = [];
    const roomImageDataUrls: string[] = [];

    const {
      worldDescription,
      playerName,
      playerDescription,
      playerAppearanceDescription,
    } = getValidOutput(
      await ai.generate({
        system: TODO(),
        prompt: TODO(),
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
        system: TODO(),
        prompt: TODO(),
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

// TODO: generate these in sequence, where you gen the action, then interpret it, then generate a new action based on the resulting state
export const GenerateAction = ai.defineFlow(
  {
    name: "GenerateAction",
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: z.object({
      gameAction: GameAction(),
    }),
  },
  async (input) => {
    return TODO();
  },
);

export const GenerateTurnDescription = ai.defineFlow(
  {
    name: "GenerateTurnDescription",
    inputSchema: z.object({}),
    outputSchema: z.object({
      description: z.string(),
    }),
  },
  async (input) => {
    return TODO();
  },
);
