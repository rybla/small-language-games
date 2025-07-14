"use client";

import { useRef, useState } from "react";
import styles from "./page.module.css";
import type { Applet } from "./ontology";
import AppletView from "./component/AppletView";
import * as server from "./server";
import { stringify } from "@/utility";

export default function Page() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [applet, set_applet] = useState<Applet | undefined>(undefined);

  async function submitPrompt(event: React.MouseEvent<HTMLButtonElement>) {
    if (inputRef.current === null) return;
    if (inputRef.current.value.length === 0) return;

    set_applet(await server.generateApplet(inputRef.current.value));
  }

  return (
    <main className={styles.main}>
      <div className={styles.prompt}>
        <div className={styles.title}>Prompt</div>
        <textarea className={styles.input} ref={inputRef} />
        <button className={styles.button} onClick={submitPrompt}>
          Submit
        </button>
      </div>
      {applet === undefined ? (
        <div className={styles.applet_placeholder}></div>
      ) : (
        <div className={styles.applet_container}>
          <AppletView
            applet={applet}
            fillPlaceholder={async (placeholder) => {
              set_applet(await server.fillPlaceholder(applet, placeholder));
            }}
          />
        </div>
      )}
    </main>
  );
}
