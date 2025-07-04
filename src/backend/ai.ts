import googleAI from "@genkit-ai/googleai";
import { genkit } from "genkit";

export const ai = genkit({ plugins: [googleAI()] });

export const model = {
  speed: googleAI.model("gemini-2.5-flash-lite-preview-06-17"),
  power: googleAI.model("gemini-2.5-pro"),
  cheap: googleAI.model("gemini-2.0-flash"),
};
