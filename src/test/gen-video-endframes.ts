// import googleAI from "@genkit-ai/googleai";
// import { GenerateOptions, genkit, z } from "genkit";
// import * as fs from "fs/promises";
// import { randomUUID } from "crypto";
// import { stringify } from "@/utility";

// // To run this code you need to install the following dependencies:
// // npm install @google/genai
// // npm install -D @types/node

// // import { GoogleGenAI } from "@google/genai";

// import { writeFile } from "fs/promises";
// import fetch from "node-fetch";

// async function main() {
//   const ai = genkit({ plugins: [googleAI()] });

//   let tmp = await ai.generate({});

//   let operation = await ai.generate({
//     model: googleAI.model("veo-2.0-generate-001"),
//     config: {
//       image: {
//         gcsUri: "TODO",
//         mimeType: "TODO",
//       },
//       lastFrame: {
//         gcsUri: "TODO",
//         mimeType: "TODO",
//       },
//     },
//     prompt: "TODO",
//     // prompt: `INSERT_INPUT_HERE`,
//     // config: {
//     //   numberOfVideos: 1,
//     //   aspectRatio: "16:9",
//     //   personGeneration: "dont_allow",
//     //   durationSeconds: 8,
//     // },
//   } satisfies GenerateOptions);

//   // while (!operation.done) {
//   //   console.log(
//   //     `Video ${operation.name} has not been generated yet. Check again in 10 seconds...`,
//   //   );
//   //   await new Promise((resolve) => setTimeout(resolve, 10000));
//   //   operation = await ai.operations.getVideosOperation({
//   //     operation: operation,
//   //   });
//   // }

//   // console.log(
//   //   `Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`,
//   // );

//   // operation.response?.generatedVideos?.forEach(async (generatedVideo, i) => {
//   //   console.log(`Video has been generated: ${generatedVideo?.video?.uri}`);
//   //   const response = await fetch(
//   //     `${generatedVideo?.video?.uri}&key=${process.env.GEMINI_API_KEY}`,
//   //   );
//   //   const buffer = await response.arrayBuffer();
//   //   await writeFile(`video_${i}.mp4`, Buffer.from(buffer));
//   //   console.log(
//   //     `Video ${generatedVideo?.video?.uri} has been downloaded to video_${i}.mp4.`,
//   //   );
//   // });
// }

// main();

// // export const ai = genkit({ plugins: [googleAI()] });

// // const response = await ai.generate({
// //   model: googleAI.model("imagen-3.0-generate-002"),
// //   output: { format: "media" },
// //   prompt: "a banana riding a bicycle",
// //   config: {
// //     aspectRatio: "1:1",
// //     numberOfImages: 1,
// //   },
// // });
