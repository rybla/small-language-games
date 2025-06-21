import { z } from "genkit";

export const makeRouteHandler_backend =
  <Route extends string, Input, Output>(args: {
    route: Route;
    input_schema: z.ZodType<Input>;
    handler: (input: Input) => Promise<Output>;
  }): Bun.RouterTypes.RouteHandler<Route> =>
  async (req) => {
    const req_data = await req.json();
    const input: Input = args.input_schema.parse(req_data);
    const output: Output = await args.handler(input);
    return Response.json(output);
  };
