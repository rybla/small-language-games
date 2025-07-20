"use client";

import { useState } from "react";
import styles from "./page.module.css";
import * as server from "./server";
import { stringify } from "@/utility";
import { consumeStreamingResponse } from "../library/streaming/client";

export default function Page() {
  const [isStreaming, set_isStreaming] = useState(false);
  const [result, set_result] = useState("");

  async function request() {
    set_isStreaming(true);

    await consumeStreamingResponse(server.requestStream(), async (message) => {
      set_result(
        (result) => result + "\n" + `[${message.type}] ${message.content}`,
      );
    });

    set_isStreaming(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.title}>This is a streaming test</div>
      <button className={styles.button} onClick={() => void request()}>
        request
      </button>
      <div className={styles.status}>
        <div className={styles.item}>
          <div className={styles.label}>isStreaming:</div>
          <div className={styles.value}>{stringify(isStreaming)}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>result:</div>
          <div className={styles.value}>{result}</div>
        </div>
      </div>
    </div>
  );
}
