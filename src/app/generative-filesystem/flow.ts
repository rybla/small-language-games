import { ai, model } from "@/backend/ai";
import { getValidOutput } from "@/backend/ai/common";
import { trim } from "@/utility";
import { GenerateOptions, z } from "genkit";
import { XAction, XPreAction, XState } from "./ontology";
import { getFocus, showXDirectory, showXFile } from "./semantics";

export const GenerateXPreAction = ai.defineFlow(
  {
    name: "GenerateXPreAction",
    inputSchema: z.object({
      state: XState,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      preaction: XPreAction,
    }),
  },
  async ({ state, prompt }) => {
    const focus = getFocus(state);
    const { action } = getValidOutput(
      await ai.generate({
        model: model.text_speed,
        system: trim(`
You are an assistant who helps the user by translating their informal instructions into structured actions for interacting with the specialized filesystem.

The following is the user's context in the filesystem:

\`\`\`
${
  focus.type === "directory"
    ? trim(`
working directory: ${showXDirectory(state, focus)}
`)
    : trim(`
active file: ${showXFile(state, focus)}
`)
}
\`\`\`

Your task is to interpret the user's informal command as a structured action (whcih is specified by the output schema).
`),
        prompt: trim(`
Instructions: ${prompt}
`),
        output: {
          schema: z.object({
            action: XPreAction,
          }),
        },
      } satisfies GenerateOptions),
    );
    return { preaction: action };
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
