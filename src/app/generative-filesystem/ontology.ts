export type XSystem = {
  name: string;
  home: XDirectory;
};

export type XObject = XDirectory | XFile;

export type XDirectory = {
  name: string;
  kids: XObject[];
};

export type XFile = {
  name: string;
  id: string;
  type: XFileType;
};

export type XFileType = "text" | "image" | "audio";
