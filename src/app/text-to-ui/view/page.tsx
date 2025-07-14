"use client";

import AppletView from "../component/AppletView";
import type { Applet } from "../ontology";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApplet } from "../server";

export default function Page() {
  const [applet, set_applet] = useState<Applet | undefined>(undefined);

  const searchParams = useSearchParams();
  const appletId = searchParams.get("appletId");
  const mode = searchParams.get("mode");

  useEffect(() => {
    (async () => {
      if (appletId === null) return;
      set_applet(await getApplet(appletId));
    })();
  }, [appletId]);

  return (
    <main className={styles.main}>
      {appletId === null ? (
        <div className={styles.invalid_params}>
          {"invalid parameters: missing URL query parameter: `appletId`"}
        </div>
      ) : applet === undefined ? (
        <div className={styles.loading_applet}>loading applet...</div>
      ) : (
        <AppletView applet={applet} mode={mode === null ? undefined : mode} />
      )}
    </main>
  );
}
