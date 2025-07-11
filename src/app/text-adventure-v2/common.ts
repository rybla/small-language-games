import filenamify from "filenamify";
import path from "path";
import type { GameId, ItemName, RoomName } from "./ontology";

export const rootName = "text-adventure-v2";

export class Paths {
  constructor(private prefixPath: string) {}

  private rootDirpath: string = path.join(this.prefixPath, rootName);

  getGamesDirpath(): string {
    return this.rootDirpath;
  }

  getGameDirpath(id: GameId): string {
    return path.join(this.rootDirpath, id);
  }
  getGameFilepath(id: GameId): string {
    return path.join(this.getGameDirpath(id), "game.json");
  }

  getItemImagesDirpath(id: GameId): string {
    return path.join(this.getGameDirpath(id), "item");
  }
  getItemImageFilepath(id: GameId, item: ItemName): string {
    return path.join(this.getItemImagesDirpath(id), item);
  }

  getRoomImagesDirpath(id: GameId): string {
    return path.join(this.getGameDirpath(id), "room");
  }
  getRoomImageFilepath(id: GameId, room: RoomName): string {
    return path.join(this.getRoomImagesDirpath(id), filenamify(room) + ".png");
  }
}
