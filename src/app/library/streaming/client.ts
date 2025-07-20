export async function consumeStreamingResponse<A>(
  response: Promise<ReadableStream<A>>,
  k: (value: A) => Promise<void>,
) {
  const reader = (await response).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    await k(value);
  }
}
