"use client";

import { useRef, useState } from "react";
import * as server from "../server";
import styles from "./page.module.css";
import Link from "next/link";
import type { Applet } from "../ontology";
import { rootName } from "../common";
import { spawnAsync } from "@/utility";

export default function Page() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [applet, set_applet] = useState<Applet | undefined>(undefined);

  async function submitPrompt() {
    if (inputRef.current === null) return;
    if (inputRef.current.value.length === 0) return;
    const applet = await server.generateApplet(inputRef.current.value);
    set_applet(applet);
  }

  return (
    <main className={styles.main}>
      <div className={styles.prompt}>
        <div className={styles.title}>Prompt</div>
        <textarea className={styles.input} ref={inputRef} />
        <button
          className={styles.button}
          onClick={() => spawnAsync(submitPrompt)}
        >
          Submit
        </button>
      </div>
      <div className={styles.result}>
        {applet === undefined ? (
          <></>
        ) : (
          <Link href={`${rootName}/view/appletId=${applet.metadata.id}`}>
            {applet.design.name}
          </Link>
        )}
      </div>
    </main>
  );
}
