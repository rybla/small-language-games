export const makeRouteHandler_frontend = async <Input, Output>(args: {
  route: string;
  input: Input;
}): Promise<Output> => {
  const res = await fetch(args.route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args.input),
  });
  const output = await res.json();
  return output;
};
