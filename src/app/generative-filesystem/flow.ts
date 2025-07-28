import { ai, model } from "@/backend/ai";
import { getValidOutput } from "@/backend/ai/common";
import { trim } from "@/utility";
import { GenerateOptions, z } from "genkit";
import { XAction, XState } from "./ontology";
import { getXFileAt, showXFile } from "./semantics";

export const GenerateXActions = ai.defineFlow(
  {
    name: "GenerateXActions",
    inputSchema: z.object({
      state: XState,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      actions: z.array(XAction),
    }),
  },
  async ({ state, prompt }) => {
    const focus = getXFileAt(state.system, state.client.path);
    const { actions } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
You are an assistant who helps the user by translating their informal instructions into structured actions for interacting with the specialized filesystem.

The user will provide their current context in the filesystem and informal instructions for how they want to interact with the filesystem.
Your task is to write a sequence of actions (in the format specified by the output schema) that most closely correspond to accomplishing what the user intended by their instructions.
`),
        prompt: trim(`
# Filesystem Interaction Instructions

## Context

${
  focus.type === "directory"
    ? trim(`
**Working directory:**
${showXFile(state.system, focus)}
`)
    : trim(`
**Focused file:**
${showXFile(state.system, focus)}
`)
}



## Informal Instructions

${prompt}
`),
        output: {
          schema: z.object({
            actions: z.array(XAction),
          }),
        },
      } satisfies GenerateOptions),
    );
    return { actions };
  },
);

export const GenerateTextContent = ai.defineFlow(
  {
    name: "GenerateTextContent",
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: z.object({
      content: z.string(),
    }),
  },
  async ({ prompt }) => {
    const result = await ai.generate({
      model: model.text_speed,
      system: trim(`
You are a professional writer. The user will provide a prompt for a short text document they want written. Your task is to carefully consider the user's prompt, and write a text document using Markdown format that satisfies the user's request.

ONLY reply with your final written text document.
`),
      prompt,
    } satisfies GenerateOptions);
    return { content: result.text };
  },
);
