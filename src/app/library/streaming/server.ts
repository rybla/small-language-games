import { do_ } from "@/utility";

export function createStreamingResult<A>(
  k: (write: (value: A) => Promise<void>) => Promise<void>,
): ReadableStream<A> {
  const { readable, writable } = new TransformStream<A, A>();
  const writer = writable.getWriter();
  void do_(async () => {
    await k((value) => writer.write(value));
    await writer.close();
  });
  return readable;
}
