import { Codomain, NonEmptyArray } from "@/utility";
import { z } from "genkit";

// Element

export type ElementPurpose = z.infer<typeof ElementPurpose>;
export const ElementPurpose = z
  .string()
  .describe("short phrase label for the purpose of this element");

export type PlaceholderElement = z.infer<typeof PlaceholderElement>;
export const PlaceholderElement = z.object({
  type: z.enum(["placeholder"]),
  purpose: ElementPurpose,
  description: z
    .string()
    .nonempty()
    .describe(
      "natural-language description of the UI structure that this placeholder will be replaced with",
    ),
});

export type VariableElement = z.infer<Codomain<typeof VariableElement>>;
export const VariableElement = (state?: AppletState) =>
  z
    .object({
      type: z.enum(["variable"]),
      purpose: ElementPurpose,
      key: (state === undefined
        ? z.string()
        : z.enum(state.map((x) => x.key) as NonEmptyArray<string>)
      ).describe(
        "the key in the applet state that this element should display the value of",
      ),
    })
    .describe("variable value element");

export type TextElement = z.infer<typeof TextElement>;
export const TextElement = z
  .object({
    type: z.enum(["text"]),
    style: z.enum(["heading", "normal"]),
    text: z.string().nonempty().describe("the literal text content"),
  })
  .describe("literal text element");

export type GroupElement = {
  type: "group";
  purpose: ElementPurpose;
  layout: "row" | "column";
  scrollable: boolean;
  kids: Element[];
};

export const GroupElementR: z.ZodType<GroupElement> = z
  .object({
    type: z.enum(["group"]),
    purpose: ElementPurpose,
    layout: z.enum(["row", "column"]),
    scrollable: z.boolean(),
    kids: z
      .array(z.lazy(() => ElementR()))
      .nonempty()
      .describe("array of elements that are inside this group"),
  })
  .describe("group of elements");

export const GroupElementTruncated: z.ZodType<GroupElement> = z
  .object({
    type: z.enum(["group"]),
    purpose: ElementPurpose,
    layout: z.enum(["row", "column"]),
    scrollable: z.boolean(),
    kids: z
      .array(PlaceholderElement)
      .nonempty()
      .describe("array of elements that are inside this group"),
  })
  .describe("group of elements");

export type ImageElement = z.infer<typeof ImageElement>;
export const ImageElement = z
  .object({
    type: z.enum(["image"]),
    purpose: ElementPurpose,
    slug: z
      .string()
      .describe(
        "a unique id for the image, using a slug format (only characters, numbers, and underscores allowed)",
      ),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]),
    description: z
      .string()
      .describe("natural-language description of the image"),
  })
  .describe("image element");

export type ButtonElement = z.infer<typeof ButtonElement>;
export const ButtonElement = z
  .object({
    type: z.enum(["button"]),
    purpose: ElementPurpose,
    label: z.string().nonempty(),
    clickEffect: z
      .string()
      .nonempty()
      .describe(
        "natural-language description of what effect clicking this button will have on the applet state",
      ),
  })
  .describe("button element");

export type Element = z.infer<Codomain<typeof ElementR>>;
export const ElementR = (state?: AppletState) =>
  z
    .union([
      VariableElement(state),
      TextElement,
      ButtonElement,
      ImageElement,
      GroupElementR,
      PlaceholderElement,
    ])
    .describe("element of an applet UI");

export const ElementTruncated = (state?: AppletState) =>
  z
    .union([
      VariableElement(state),
      TextElement,
      ButtonElement,
      ImageElement,
      GroupElementTruncated,
      PlaceholderElement,
    ])
    .describe("element of an applet UI");

export const ElementTruncatedNonplaceholder = (state?: AppletState) =>
  z
    .union([
      VariableElement(state),
      TextElement,
      ButtonElement,
      ImageElement,
      GroupElementTruncated,
    ])
    .describe("element of an applet UI");

export const elementTypeDescriptions = [
  "text",
  "button",
  "image",
  "group (row or column)",
  "variable (reference to applet state field)",
];

// State

export type StringValue = z.infer<typeof StringValue>;
export const StringValue = z.object({
  type: z.enum(["string"]),
  value: z.string(),
});

export type NumberValue = z.infer<typeof NumberValue>;
export const NumberValue = z.object({
  type: z.enum(["number"]),
  value: z.number(),
});

export type BooleanValue = z.infer<typeof BooleanValue>;
export const BooleanValue = z.object({
  type: z.enum(["boolean"]),
  value: z.boolean(),
});

// TODO: ArrayValue

export type Value = z.infer<typeof Value>;
export const Value = z.union([StringValue, NumberValue, BooleanValue]);

export type AppletState = z.infer<typeof AppletState>;
export const AppletState = z
  .array(z.object({ key: z.string(), value: Value }))
  .nonempty()
  .describe(
    "the entire state of the applet, including all values that will change dynamically as the applet is running",
  );

// Applet

export const AppletMetadata = z.object({
  id: z.string(),
});

export const AppletDesign = z.object({
  name: z.string().nonempty().describe("name of the applet"),
  blueprint: z
    .string()
    .nonempty()
    .describe(
      `high-level blueprint for the applet's design, covering all of its functionalities and visual design aspects (using nested bullet point format)`,
    ),
  functionalitySpecification: z
    .string()
    .nonempty()
    .describe(
      "comprehensive specification of the applet's functionality based on the blueprint (intended uses and brief sketches of each usage workflow in terms of the UI interactions involved)",
    ),
  appearanceSpecification: z
    .string()
    .nonempty()
    .describe(
      "comprehensive specification of the applet's appearance based on the blueprint (layout, overall themes, and color scheme)",
    ),
});

export type Applet = z.infer<typeof Applet>;
export const Applet = z.object({
  metadata: AppletMetadata,
  design: AppletDesign,
  initialState: AppletState.describe("the entire initial state for the applet"),
  body: ElementR().describe("body element of the applet UI"),
});

export const AppletTruncated: z.ZodType<Applet> = z.object({
  ...Applet.omit({ body: true }).shape,
  body: ElementTruncated().describe("body element of the applet UI"),
});
