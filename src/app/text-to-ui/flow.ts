"use server";

import { ai, model } from "@/backend/ai";
import { getValidOutput } from "@/backend/ai/common";
import { deepcopy, stringify } from "@/utility";
import { randomUUID } from "crypto";
import { GenerateOptions, z } from "genkit";
import {
  Applet,
  AppletDesign,
  AppletState,
  ElementTruncated,
  ElementTruncatedNonplaceholder,
  elementTypeDescriptions,
  ImageElement,
  PlaceholderElement,
} from "./ontology";
import { presentElement, walkElement } from "./semantics";

export const generateAppletDesign = ai.defineFlow(
  {
    name: "generateAppletDesign",
    inputSchema: z.object({
      prompt: z.string().nonempty(),
    }),
    outputSchema: z.object({
      design: AppletDesign,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: model.speed,
      system: `
You are a UI design assistant. The user will provide a high-level description for an applet they want built. You should carefully consider their specification, and then write a structured design for a UI that satisfies all of their specification. Your design should be comprehensive and specific.

The UI you design will be able to use the following element types: ${elementTypeDescriptions}.
`.trim(),
      prompt: input.prompt.trim(),
      output: { schema: AppletDesign },
    });
    const design = getValidOutput(response);
    return { design };
  },
);

export const generateAppletInitialState = ai.defineFlow(
  {
    name: "generateAppletInitialState",
    inputSchema: z.object({
      design: AppletDesign,
    }),
    outputSchema: z.object({
      initialState: AppletState,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: model.speed,
      system: `
You are a UI design asistant. The user has written a detailed design specifcation for an applet UI. Your task is to define the initial applet state. Make sure to initialize all values that are referred to in the applet's design specifiction.
`.trim(),
      prompt: `
# Design Specification for "${input.design.name}"

## Overview

${input.design.blueprint}

## Functionality

${input.design.functionalitySpecification}

## Appearance

${input.design.appearanceSpecification}
`.trim(),
      output: { schema: AppletState },
    });

    const initialState = getValidOutput(response);
    return { initialState };
  },
);

export const generateAppletBody = ai.defineFlow(
  {
    name: "generateAppletBody",
    inputSchema: z.object({
      design: AppletDesign,
      initialState: AppletState,
    }),
    outputSchema: z.object({
      body: ElementTruncated(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: model.speed,
      system: `
You are a UI design assistant. The user has designed a UI for a new applet. Your task is to create a structured outline of the applet's UI layout. Make sure to follow the design specification very specifically.
`.trim(),
      prompt: `
# Design Specification for "${input.design.name}"

## Functionality

${input.design.functionalitySpecification}

## Appearance

${input.design.appearanceSpecification}

## Initial State

The following is an encoding of the applet's initial state as a JSON object:
\`\`\`json
${stringify(input.initialState)}
\`\`\`
`.trim(),
      output: { schema: ElementTruncated(input.initialState) },
    });

    const body = getValidOutput(response);
    return { body };
  },
);

export const generateApplet = ai.defineFlow(
  {
    name: "generateApplet",
    inputSchema: z.object({ prompt: z.string().nonempty() }),
    outputSchema: z.object({
      applet: Applet,
    }),
  },
  async (input) => {
    const { design } = await generateAppletDesign({ prompt: input.prompt });
    const { initialState } = await generateAppletInitialState({ design });
    const { body } = await generateAppletBody({ design, initialState });
    const applet: Applet = {
      metadata: { id: randomUUID() },
      design,
      body,
      initialState,
    };
    return { applet };
  },
);

export const generateImage = ai.defineFlow(
  {
    name: "generateImage",
    inputSchema: z.object({
      element: ImageElement,
    }),
    outputSchema: z.object({
      dataUrl: z.string(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: model.image,
      prompt: `
You are a graphic designer for web app assets. Your task is the produce a high-quality image according to the following description: ${input.element.description}
`.trim(),
      output: { format: "media" },
      config: { aspectRatio: input.element.aspectRatio, numberOfImages: 1 },
    } satisfies GenerateOptions);
    const media = response.media!;
    return { dataUrl: media.url };
  },
);

export const fillPlaceholder = ai.defineFlow(
  {
    name: "fillPlaceholder",
    inputSchema: z.object({
      applet: Applet,
      placeholder: PlaceholderElement,
    }),
    outputSchema: z.object({ applet: Applet }),
  },
  async (input) => {
    const response = await ai.generate({
      model: model.speed,
      system: `
You are a design assistant for building applet UIs.

The user is currently working on an applet with the following design specification:

Applet "${input.applet.design.name}"
  - design blueprint: ${input.applet.design.blueprint}
  - appearance specification: ${input.applet.design.appearanceSpecification}
  - functionality specification: ${input.applet.design.functionalitySpecification}

The applet's current body structure is described by the following JSON code block:
\`\`\`json
${stringify(input.applet.body)}
\`\`\`

The user will provide the \`purpose\` value for a particular placeholder element in the applet body.
Your task is to create the real UI structure that will replace that placeholder. The structure you generated should follow closely the purpose and description of the placeholder they are replacing.
`.trim(),
      prompt: `
Fill in the placeholder with these details:
  - purpose: "${input.placeholder.purpose}"
  - description: "${input.placeholder.description}"
`.trim(),
      output: {
        schema: ElementTruncatedNonplaceholder(input.applet.initialState),
      },
    });
    const applet = deepcopy(input.applet);
    const elementNew = getValidOutput(response);
    walkElement((element) => {
      if (
        element.type === "placeholder" &&
        element.purpose === input.placeholder.purpose &&
        element.description === input.placeholder.description
      ) {
        Object.assign(element, elementNew);
      }
    }, applet.body);

    return { applet };
  },
);

export const interpretEffect = ai.defineFlow(
  {
    name: "interpretEffect",
    inputSchema: z.object({
      applet: Applet,
      state: AppletState,
      effect: z.string().nonempty(),
    }),
    outputSchema: z.object({
      state: AppletState,
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: model.speed,
      system: `
You are a web development assistant who assists with tests by emulating how a natural-language description of how a UI will update an applet's state. Note that you are only allowed to modify the values of fields that are already in the applet's state. You CANNOT add new fields to the applet's state.

Applet name: ${input.applet.design.name}.
Applet description: ${input.applet.design.functionalitySpecification}

The user will provide:
  - the applet's current state (as a JSON code block)
  - a natural-language description of how the applet's state should update according to a UI interaction

Your task is to write the applet's new state as a JSON object.
`.trim(),
      prompt: `
The applet's current state is defined by the following JSON code block:

\`\`\`json
${stringify(input.state)}
\`\`\`

The following is a natural-language description of how the applet's state should update.
`.trim(),
      output: {
        schema: AppletState,
      },
    } satisfies GenerateOptions);

    if (response.output === null) throw new Error("Failed to generate output");
    const state = response.output;
    return { state };
  },
);
