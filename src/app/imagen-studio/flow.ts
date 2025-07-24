import { ai, model } from "@/backend/ai";
import { getValidMedia } from "@/backend/ai/common";
import googleAI from "@genkit-ai/googleai";
import { GenerateOptions, z } from "genkit";

export const default_model = model.image_power.name;
export const default_temperature = 0.5;

export const GenerateImage = ai.defineFlow(
  {
    name: "GenerateImage",
    inputSchema: z.object({
      model: z.enum([model.image_power.name, model.image_cheap.name]),
      temperature: z.number().min(0).max(1),
      prompt: z.string(),
    }),
    outputSchema: z.object({
      dataUrl: z.string(),
      text: z.string(),
    }),
  },
  async (input) => {
    const model_name = input.model.replace("googleai/", "");
    const response = await ai.generate({
      model: googleAI.model(model_name),
      prompt: input.prompt,
      output: { format: "media" },
      config: {
        numberOfImages: 1,
        temperature: input.temperature,
        outputMimeType: "image/png",
        aspectRatio: "1:1",
      },
    } satisfies GenerateOptions);
    response.output;
    const media = getValidMedia(response);
    const text = response.text;
    return { dataUrl: media.url, text };
  },
);
