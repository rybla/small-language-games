import googleAI from "@genkit-ai/googleai";
import { genkit } from "genkit";

export const ai = genkit({ plugins: [googleAI()] });

export const model = {
  speed: googleAI.model("gemini-2.5-flash-lite-preview-06-17"),
  power: googleAI.model("gemini-2.5-pro"),
  cheap: googleAI.model("gemini-2.0-flash"),
  image: googleAI.model("imagen-4.0-generate-preview-06-06"),
};

export const temperature = {
  creative: 1.7,
  normal: 1.0,
  conservative: 0.5,
};
