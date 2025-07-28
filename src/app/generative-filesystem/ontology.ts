import { z } from "genkit";

// -----------------------------------------------------------------------------
// types
// -----------------------------------------------------------------------------

export type XFileName = z.infer<typeof XFileName>;
export const XFileName = z
  .string()
  .brand<"XFileName">()
  .describe("the base name of the file");

export type XFileId = z.infer<typeof XFileId>;
export const XFileId = z.string().brand<"XFileId">();

export type DirectoryXFile = z.infer<typeof DirectoryXFile>;
const DirectoryXFile = z.object({
  name: XFileName,
  id: XFileId,
  type: z.enum(["directory"]),
  kidIds: z.array(XFileId),
});

export type TextXFile = z.infer<typeof TextXFile>;
const TextXFile = z.object({
  name: XFileName,
  id: XFileId,
  type: z.enum(["text"]),
});

export type ImageXFile = z.infer<typeof ImageXFile>;
const ImageXFile = z.object({
  name: XFileName,
  id: XFileId,
  type: z.enum(["image"]),
});

export type XFile = z.infer<typeof XFile>;
export const XFile = z.union([DirectoryXFile, TextXFile, ImageXFile]);

export type XPath = z.infer<typeof XPath>;
export const XPath = z.array(XFileName);

export const ShowHelpFileXAction = z.object({
  type: z.enum(["ShowHelpFileXAction"]),
  name: XFileName,
});

export const FocusChildFileXAction = z.object({
  type: z.enum(["FocusChildFile"]),
  name: XFileName,
});

export const DeleteChildFileXAction = z.object({
  type: z.enum(["DeleteChildFile"]),
  name: XFileName,
});

export const CreateChildDirectoryXAction = z.object({
  type: z.enum(["CreateChildDirectory"]),
  name: XFileName,
});

export const CreateTextFile = z.object({
  type: z.enum(["CreateTextFile"]),
  name: XFileName,
  prompt: z.string(),
});

const XActions = [
  ShowHelpFileXAction,
  FocusChildFileXAction,
  CreateChildDirectoryXAction,
  DeleteChildFileXAction,
  CreateTextFile,
] as const;

// TODO/BONUS make the action schemas constrained by current state
export type XAction = z.infer<typeof XAction>;
export const XAction = z.union(XActions);

export const ErrorXEffect = z.object({
  type: z.enum(["Error"]),
  message: z.string(),
});

export type XEffect = z.infer<typeof XEffect>;
export const XEffect = ErrorXEffect;

export type XTurn = z.infer<typeof XTurn>;
export const XTurn = z.object({
  prompt: z.string(),
  actions: z.array(XAction),
  effects: z.array(XEffect),
});

export type XSystem = z.infer<typeof XSystem>;
export const XSystem = z.object({
  name: z.string(),
  root: DirectoryXFile,
  files: z.record(XFileId, XFile),
});

export type XClient = z.infer<typeof XClient>;
export const XClient = z.object({
  turns: z.array(XTurn),
  path: z.array(XFileName),
});

export type XState = z.infer<typeof XState>;
export const XState = z.object({
  system: XSystem,
  client: XClient,
});
