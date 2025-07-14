"use client";

import { useState } from "react";
import AppletView from "../component/AppletView";
import type { Applet } from "../ontology";
import * as server from "../server";
import styles from "./page.module.css";

export default function Page() {
  const [applet, set_applet] = useState<Applet | undefined>(undefined);

  return (
    <main className={styles.main}>
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
