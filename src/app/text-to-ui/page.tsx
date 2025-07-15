"use client";

import { spawnAsync } from "@/utility";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { rootName } from "./common";
import styles from "./page.module.css";
import * as server from "./server";

export default function Page() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [appletInfos, set_appletInfos] = useState<server.AppletInfo[]>([]);

  async function update_appletInfos() {
    set_appletInfos(await server.getAppletInfos());
  }

  useEffect(() => spawnAsync(update_appletInfos), []);

  async function submitPrompt() {
    if (inputRef.current === null) return;
    if (inputRef.current.value.length === 0) return;
    await server.generateApplet(inputRef.current.value);
    await update_appletInfos();
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
      <div className={styles.applets}>
        {appletInfos.map((appletInfo, i) => (
          <div className={styles.appletInfo} key={i}>
            <Link href={`/${rootName}/view?appletId=${appletInfo.id}`}>
              {appletInfo.name}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
