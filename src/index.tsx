import { serve } from "bun";
import { genkit } from "genkit";
import googleAI from "@genkit-ai/googleai";
import DatingSimV1 from "./DatingSimV1/index.html";
import Missing from "./Missing.html";
import { config } from "./common";

const pages = {
  DatingSimV1,
};

const pageRoutes = Object.entries(pages).reduce(
  (result, [k, v]) => ({ ...result, [`/${k}`]: v }),
  {},
);

const index = new Response(
  `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.website_name}</title>
  </head>
  <body>
    <h1>${config.website_name}</h1>
    <ul>
      ${Object.keys(pages).map((k) =>
        `
        <li>
          <a href="/${k}">${k}</a>
        </li>
        `.trim(),
      )}
    </ul>
  </body>
</html>
`.trim(),
);

const server = Bun.serve({
  routes: {
    // api
    "/api/hello": {
      async GET(req) {
        const ai = genkit({
          plugins: [googleAI()],
          model: googleAI.model("gemini-2.5-flash"),
        });

        const { text } = await ai.generate("Hello, Gemini!");

        return Response.json({
          message: text,
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/*": async (req) => {
      return Response.error();
    },

    // html
    "/": index,
    ...pageRoutes,
    "/*": Missing,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
