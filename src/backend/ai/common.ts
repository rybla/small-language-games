import { Action, GenerateResponse, Part, z } from "genkit";

export type ActionDomain<A> =
  A extends Action<infer I, z.ZodTypeAny, z.ZodTypeAny> ? z.infer<I> : never;

export type ActionCodomain<A> =
  A extends Action<z.ZodTypeAny, infer O, z.ZodTypeAny> ? z.infer<O> : never;

export function getValidOutput<T>(response: GenerateResponse<T>): T {
  response.assertValidSchema();
  return response.output!;
}

export function getValidMedia(response: GenerateResponse<unknown>) {
  response.assertValidSchema();
  return response.media!;
}

export function makeTextPart(text: string): Part {
  return { text: text.trim() };
}

export function makeMarkdownFilePart(content: string): Part {
  return {
    media: {
      url: `data:text/markdown;base64,${Buffer.from(content, "utf8").toString("base64")}`,
    },
  };
}
