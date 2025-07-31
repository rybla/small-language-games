import googleAI from "@genkit-ai/googleai";
import { genkit } from "genkit";

export const ai = genkit({ plugins: [googleAI()] });

export const model = {
  text_speed: googleAI.model("gemini-2.5-flash-lite-preview-06-17"),
  text_power: googleAI.model("gemini-2.5-pro"),
  text_cheap: googleAI.model("gemini-2.0-flash"),
  // image_power: googleAI.model("imagen-4.0-generate-preview-06-06"),
  image_power: googleAI.model("imagen-4.0-fast-generate-preview-06-06"),
  image_cheap: googleAI.model("imagen-3.0-generate-002"),
};

export const temperature = {
  creative: 1.7,
  normal: 1.0,
  conservative: 0.5,
};
