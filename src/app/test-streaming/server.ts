"use server";

import { do_, sleep } from "@/utility";
import { createStreamingResult } from "@/library/streaming/server";

export type Message = { type: string; content: string };

export async function requestStream() {
  return createStreamingResult<Message>(async (write) => {
    await write({ type: "info", content: "This is a streamed response" });
    await sleep(200);

    await write({ type: "error", content: "An error occurred" });
    await sleep(200);

    await write({ type: "warning", content: "Warning: Something went wrong" });
    await sleep(200);
  });
}
