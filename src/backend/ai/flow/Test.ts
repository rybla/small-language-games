"use server";

import { ai, model } from "@/backend/ai";
import { z } from "genkit";

export const Test = ai.defineFlow(
  {
    name: "Test",
    inputSchema: z.object({
      message: z.string(),
    }),
    outputSchema: z.object({
      message: z.string(),
    }),
  },
  async (input) => {
    // return { output: `This is a test for the input: ${input}` };
    const response = await ai.generate({
      model: model.cheap,
      prompt: [{ text: input.message }],
    });

    return { message: response.text };
  },
);

export default Test;
