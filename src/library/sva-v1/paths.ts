import path from "path";

export default class Paths {
  constructor(public prefix: string) {}

  rootDirpath(specName: string) {
    return path.join(this.prefix, specName);
  }

  instDirpath(specName: string, instId: string) {
    return path.join(this.rootDirpath(specName), instId);
  }

  instFilepath(specName: string, instId: string) {
    return path.join(this.instDirpath(specName, instId), "inst.json");
  }

  instMetadataFilepath(specName: string, instId: string) {
    return path.join(this.instDirpath(specName, instId), "inst_metadata.json");
  }

  assetDirpath(specName: string, instId: string) {
    return path.join(this.instDirpath(specName, instId), "asset");
  }

  assetFilepath(specName: string, instId: string, filename: string) {
    return path.join(this.assetDirpath(specName, instId), filename);
  }
}
