import { genkit } from "genkit";
import googleAI from "@genkit-ai/googleai";
import DatingSimV1 from "./DatingSimV1/index.html";
import Missing from "./Missing.html";
import { config } from "./common";
import { gemini20Flash } from "@genkit-ai/googleai";

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

const ai = genkit({
  plugins: [googleAI()],
  model: gemini20Flash,
});

const server = Bun.serve({
  routes: {
    // --------------------------------
    // api
    // --------------------------------

    "/api/generate": {
      async POST(req) {
        const req_data = req.json();
        const res_data = await ai.generate(req_data);
        return Response.json(res_data);
      },
    },

    "/api/*": async (req) => {
      return Response.error();
    },

    // --------------------------------
    // html
    // --------------------------------

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
