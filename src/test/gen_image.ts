import googleAI from "@genkit-ai/googleai";
import { genkit } from "genkit";
import * as fs from "fs/promises";
import { randomUUID } from "crypto";
import { stringify } from "@/utility";

export const ai = genkit({ plugins: [googleAI()] });

const response = await ai.generate({
  // model: googleAI.model("imagen-4.0-generate-preview-06-06"),
  model: googleAI.model("imagen-3.0-generate-002"),
  output: { format: "media" },
  prompt: "a banana riding a bicycle",
  config: {
    aspectRatio: "1:1",
    numberOfImages: 1,
  },
});

const id = randomUUID();
await fs.writeFile(id + ".json", stringify(response.media));
await fs.writeFile(
  id + ".png",
  Buffer.from(response.media!.url.split(",")[1], "base64"),
);
