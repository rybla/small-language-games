import { makeRouteHandler_backend } from "@/api_backend_util";
import { quoteblock } from "@/utility";
import googleAI, { gemini20FlashLite } from "@genkit-ai/googleai";
import { genkit, Message, z } from "genkit";
import {
  GenerateActions_input,
  GenerateActions_output,
  GenerateConsequence_input,
  GenerateConsequence_output,
} from "./api";
import index from "./index.html";
import { Game, GameAction } from "./ontology";

const ai = genkit({
  plugins: [googleAI()],
  model: gemini20FlashLite,
});

const systemPrelude = (game: Game): string =>
  `
You are a game master for a role playing game centered around dating. The player's character is named ${game.player.name}. The love interest's name is ${game.other.name}.

The following passage describes the setting of the game:

${quoteblock(game.setting)}

The following passage describes the player's character, ${game.player.name}:

${quoteblock(game.player.description)}

The following passage describes the player's love interest, ${game.other.name}:

${quoteblock(game.other.description)}
`.trim();

const server = Bun.serve({
  routes: {
    "/": index,
    "/api/GenerateConsequence": makeRouteHandler_backend({
      route: "/api/GenerateConsequence",
      input_schema: GenerateConsequence_input,
      async handler(input): Promise<GenerateConsequence_output> {
        const messages: Message[] = [
          new Message({
            role: "system",
            content: [
              {
                text: `
${systemPrelude(input.game)}

Your task is to describe what happens immediately next in the game based give the user's description of what the player wants to do next. Be creative while also keeping the events of the game consistent with what's happened so far. Use vivid prose in the style of popular fantasy writers (such as George R. R. Martin, Brandon Sanderson, and Ursula K. Le Guin) that is interesting and exciting to read.

The following JSON specifies the player's current attributes:
\`\`\`json
${JSON.stringify(input.game.player.attributes, null, 4)}
\`\`\`

The following JSON specifies the love interest's current attributes:
\`\`\`json
${JSON.stringify(input.game.other.attributes, null, 4)}
\`\`\`

The user will give a description of what the player wants to do next.
You should reply with the description of what happens immediately next in the game.
`.trim(),
              },
            ],
          }),
          ...input.game.history.flatMap<Message>((e) => [
            new Message({
              role: "user" as const,
              content: [{ text: e.action.description }],
            }),
            new Message({
              role: "model" as const,
              content: [{ text: e.consequence }],
            }),
          ]),
        ];
        const response = await ai.generate({
          messages,
          prompt: input.action.description,
          output: {
            schema: z.object({
              consequence: z
                .string()
                .describe(
                  "A description of what happens immediately next in the game. Use Markdown syntax for styling.",
                ),
            }),
          },
          config: {
            temperature: 1.5,
          },
        });

        if (response.output === undefined || response.output === null) {
          throw new Error("Failed to generate consequence");
        }

        return response.output;
      },
    }),
    "/api/GenerateActions": makeRouteHandler_backend({
      route: "/api/GenerateActions",
      input_schema: GenerateActions_input,
      async handler(input): Promise<GenerateActions_output> {
        const response = await ai.generate({
          system: `
${systemPrelude(input.game)}

Your task is to come up with a few options for what the player can do next, based on the current situation the player is in and their current attributes. The options should correspond to very different ways of reacting to the current situation. In this way, each option should have a very different \`attributesDiff\` which encodes how taking that option reflects a change in the player's attributes.
`.trim(),
          prompt: `
The following passages describe what has happened so far in the game:

${quoteblock(input.game.history.map((x) => x.consequence).join("\n\n"))}

The following JSON specifies the player's current attributes:
\`\`\`json
${JSON.stringify(input.game.player.attributes, null, 4)}
\`\`\`
    `.trim(),
          output: {
            schema: z.object({
              options: z
                .array(GameAction)
                .min(2)
                .max(4)
                .describe(
                  "Options for what the player can do next. There should be between 2-4 options.",
                ),
            }),
          },
          config: {
            temperature: 1.5,
          },
        });

        if (response.output === undefined || response.output === null) {
          throw new Error("Failed to generate consequence");
        }

        return response.output;
      },
    }),

    "/api/*": async (req: Bun.BunRequest<"/api/*">) => {
      console.error("unrecognized api request: ", req.url);
      return Response.error();
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
