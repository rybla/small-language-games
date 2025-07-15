"use client";

import { useEffect, useState } from "react";
import AppletView from "../component/AppletView";
import type { Applet } from "../ontology";
import * as server from "../server";
import styles from "./page.module.css";
import { useSearchParams } from "next/navigation";
import { spawnAsync } from "@/utility";

type AppletStatus =
  | { type: "loading" }
  | { type: "done"; applet: Applet }
  | { type: "error"; message: string };

export default function Page() {
  const [appletStatus, set_appletStatus] = useState<AppletStatus>({
    type: "loading",
  });

  const searchParams = useSearchParams();

  const appletId = searchParams.get("appletId");
  useEffect(
    () =>
      spawnAsync(async () => {
        if (appletId === null) return;
        try {
          set_appletStatus({
            type: "done",
            applet: await server.getApplet(appletId),
          });
        } catch (exception: unknown) {
          if (exception instanceof Error) {
            set_appletStatus({ type: "error", message: exception.toString() });
          } else throw exception;
        }
      }),
    [appletId],
  );

  return (
    <main className={styles.main}>
      {appletStatus.type === "loading" ? (
        <div className={styles.applet_loading}>{"loading applet..."}</div>
      ) : appletStatus.type === "done" ? (
        <div className={styles.applet_container}>
          <AppletView
            applet={appletStatus.applet}
            fillPlaceholder={async (placeholder) => {
              set_appletStatus({
                type: "done",
                applet: await server.fillPlaceholder(
                  appletStatus.applet,
                  placeholder,
                ),
              });
            }}
          />
        </div>
      ) : appletStatus.type === "error" ? (
        <div className={styles.error}>
          {"invalid URL parameters: query parameter `appletId` is required"}
        </div>
      ) : (
        <></>
      )}
    </main>
  );
}
