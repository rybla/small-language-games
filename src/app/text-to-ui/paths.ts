import path from "path";

export default class Paths {
  constructor(public root: string) {}

  appletsDirpath = path.join(this.root, "applet");

  appletDirpath(appletId: string) {
    return path.join(this.appletsDirpath, appletId);
  }

  appletFilepath(appletId: string) {
    return path.join(this.appletDirpath(appletId), "applet.json");
  }

  appletImagesDirpath(appletId: string) {
    return path.join(this.appletDirpath(appletId), "image");
  }

  appletImageFilepath(appletId: string, imageSlug: string) {
    return path.join(this.appletImagesDirpath(appletId), imageSlug + ".png");
  }
}
