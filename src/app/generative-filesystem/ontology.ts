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

// -----------------------------------------------------------------------------
// XPreAction
// -----------------------------------------------------------------------------

// TODO/BONUS make the action schemas constrained by current state
export type XPreAction = z.infer<typeof XPreAction>;
export const XPreAction = z.union([
  z
    .object({
      type: z.enum(["ShowHelp"]),
    })
    .describe(
      "show helpful information to the user about how to use this system",
    ),
  z
    .object({
      type: z.enum(["OpenFile"]),
      name: XFileName,
    })
    .describe("open a file as the new active file"),
  z
    .object({
      type: z.enum(["DeleteFile"]),
      name: XFileName,
    })
    .describe("delete a file that is a child of the working directory"),
  z
    .object({
      type: z.enum(["CreateDirectory"]),
      name: XFileName,
    })
    .describe("create a new directory as a child of the working directory"),
  z
    .object({
      type: z.enum(["CreateTextFile"]),
      name: XFileName,
      prompt: z.string(),
    })
    .describe(
      "create a new text file in the working directory, and write some content into it based on the `prompt`",
    ),
  z
    .object({
      type: z.enum(["OpenParentDirectory"]),
    })
    .describe("open the parent directory as the new working directory"),
]);

// -----------------------------------------------------------------------------
// XAction
// -----------------------------------------------------------------------------

// TODO/BONUS make the action schemas constrained by current state
export type XAction = z.infer<typeof XAction>;
export const XAction = z.union([
  z.object({
    type: z.enum(["ShowHelp"]),
  }),
  z.object({
    type: z.enum(["OpenFile"]),
    id: XFileId,
  }),
  z.object({
    type: z.enum(["DeleteFile"]),
    id: XFileId,
  }),
  z.object({
    type: z.enum(["CreateDirectory"]),
    name: XFileName,
  }),
  z.object({
    type: z.enum(["CreateTextFile"]),
    name: XFileName,
    prompt: z.string(),
  }),
  z.object({
    type: z.enum(["OpenParentDirectory"]),
  }),
]);

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
  parents: z.record(XFileId, XFileId),
});

export type XClient = z.infer<typeof XClient>;
export const XClient = z.object({
  turns: z.array(XTurn),
  focus: XFileId,
});

export type XState = z.infer<typeof XState>;
export const XState = z.object({
  system: XSystem,
  client: XClient,
});
