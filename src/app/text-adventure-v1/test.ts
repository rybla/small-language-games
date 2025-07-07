/* eslint-disable @typescript-eslint/no-unused-vars */
import * as example from "./example/wispering-plantation";
import {
  GenerateItemsForRoom,
  GeneratePlayer,
  GeneratePlayerTurn,
  GenerateRoom,
} from "./flow";
import { RoomName } from "./ontology";

// const response = await GenerateRoom({
//   game: example.game,
//   prompt: "advanced vertical hydroponic banana farm",
// });

// await Promise.all(
//   example.game.world.rooms.map((room) =>
//     GenerateItemsForRoom({ game: example.game, name: room.name }),
//   ),
// );

// await GeneratePlayer({
//   game: example.game,
//   room: "Altar of the Sunken Mango" as RoomName,
//   prompt: "a traditional banana farmer who got hopelessly lost",
// });
