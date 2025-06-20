import {
  GenerateOptions,
  GenerateResponse,
  GenerationCommonConfigSchema,
  z,
} from "genkit";

export async function generate<
  O extends z.ZodTypeAny = z.ZodTypeAny,
  CustomOptions extends z.ZodTypeAny = typeof GenerationCommonConfigSchema,
>(
  opts:
    | GenerateOptions<O, CustomOptions>
    | PromiseLike<GenerateOptions<O, CustomOptions>>,
): Promise<GenerateResponse<z.infer<O>>> {
  const res = fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await opts),
  });

  const res_data = await (await res).json();
  return res_data;
}
