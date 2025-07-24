"use client";

import type { InstClient, InstMetadata } from "@/library/sva/ontology";
import { formatDate, fromNever, stringify } from "@/utility";
import { useEffect, useRef, useState } from "react";
import { A, P, V } from "./constant";
import styles from "./page.module.css";
import * as server from "./server";

type InstStatus =
  | { type: "none" }
  | { type: "initializing"; params: P["initialization"] }
  | { type: "loaded"; inst: InstClient<V, A> };

export default function Page() {
  const [saveds, set_saveds] = useState<InstMetadata[]>([]);
  const [logs, set_logs] = useState<string[]>([]);
  const [isShown_NewPanel, set_isShown_NewPanel] = useState(false);
  const [instStatus, set_instStatus] = useState<InstStatus>({ type: "none" });

  // ---------------------------------------------------------------------------

  const turnsBottom_ref = useRef<HTMLDivElement>(null);
  const logsBottom_ref = useRef<HTMLDivElement>(null);
  const name_ref = useRef<HTMLInputElement>(null);
  const inputPromptAction_ref = useRef<HTMLTextAreaElement>(null);

  // ---------------------------------------------------------------------------

  async function refresh_saveds() {
    set_logs((logs) => [...logs, `[refresh_saveds]`]);
    set_saveds(await server.getInstMetadatas());
  }

  async function newInst() {
    set_logs((logs) => [...logs, `[newInst]`]);
    set_isShown_NewPanel(true);
  }

  async function updateInst() {
    set_logs((logs) => [...logs, `[updateInst]`]);
    await server.saveInst();
    const inst = await server.getInst();
    if (inst === undefined) {
      set_instStatus({ type: "none" });
      set_logs((logs) => [...logs, `[updateInst] inst is undefined`]);
      return;
    }
    set_instStatus({ type: "loaded", inst });
    if (name_ref.current !== null) name_ref.current.value = inst.metadata.name;
  }

  async function loadInst(id: string) {
    set_logs((logs) => [...logs, `[loadInst]`]);
    await server.loadInst(id);
    await updateInst();
  }

  async function saveInst(name?: string): Promise<void> {
    set_logs((logs) => [...logs, `[saveInst] name=${name ?? "undefined"}`]);
    await server.saveInst(name);
    await refresh_saveds();
  }

  async function submitPromptInitialization(params: P["initialization"]) {
    set_logs((logs) => [
      ...logs,
      `[submitPromptInitialization] ${stringify(params)}`,
    ]);
    await server.initializeInst(params);
    await refresh_saveds();
    await updateInst();
  }

  async function submitPromptAction(params: P["action"]) {
    set_logs((logs) => [...logs, `[submitPromptAction] ${stringify(params)}`]);
    await server.actInst(params);
    await updateInst();
  }

  // ---------------------------------------------------------------------------

  useEffect(() => {
    void refresh_saveds();
  }, []);

  useEffect(() => {
    if (turnsBottom_ref.current === null) return;
    turnsBottom_ref.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [instStatus]);

  useEffect(() => {
    if (logsBottom_ref.current === null) return;
    logsBottom_ref.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [logs]);

  // ---------------------------------------------------------------------------

  return (
    <div className={styles.page}>
      <div
        className={[
          styles.NewPanel,
          isShown_NewPanel ? styles.shown : styles.hidden,
        ].join(" ")}
      >
        <div className={styles.menubar}>
          <div className={styles.title}>New</div>
          <div className={styles.item}>
            <Button onClick={async () => set_isShown_NewPanel(false)}>
              Cancel
            </Button>
          </div>
        </div>
        <div className={styles.content}>
          <PromptInitializationPanel
            submit={async (params) => {
              set_isShown_NewPanel(false);
              await submitPromptInitialization(params);
            }}
          />
        </div>
      </div>
      <div className={styles.sidebar}>
        <div className={styles.section}>
          <div className={styles.heading}>New</div>
          <div className={styles.item}>
            <Button onClick={newInst}>New</Button>
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.heading}>Load</div>
          {saveds
            .toSorted((x, y) => y.creationDate - x.creationDate)
            .map((saved, i) => (
              <div className={styles.item} key={i}>
                <div className={styles.date}>
                  {formatDate(new Date(saved.creationDate))}
                </div>
                <div className={styles.load}>
                  <Button onClick={async () => loadInst(saved.id)}>
                    {saved.name}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className={styles.content}>
        {instStatus.type === "none" ? (
          <></>
        ) : instStatus.type === "initializing" ? (
          <>
            <div className={styles.InitializingPanel}>
              <div className={styles.LoadingPanel}>
                <span className={styles.label}>Initializing</span>
                <span className={styles.dot}>.</span>
                <span className={styles.dot}>.</span>
                <span className={styles.dot}>.</span>
              </div>
              <div className={styles.InitializationParamsPanel}>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td className={styles.label}>Prompt</td>
                      <td className={styles.value}>
                        {instStatus.params.prompt}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : instStatus.type === "loaded" ? (
          <>
            <div className={styles.InstPanel}>
              <div className={styles.column}>
                <div className={styles.MetadataPanel}>
                  <table className={styles.table}>
                    <tbody>
                      <tr>
                        <td className={styles.label}>Name</td>
                        <td className={styles.value}>
                          <input
                            className={styles.input}
                            ref={name_ref}
                            type="text"
                            defaultValue={instStatus.inst.metadata.name}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                const value = event.currentTarget.value;
                                void saveInst(value);
                              }
                            }}
                            spellCheck={false}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.ChatPanel}>
                  <div className={styles.turns}>
                    {instStatus.inst.turns.map((turn, i) => (
                      <div className={styles.turn} key={i}>
                        <div className={styles.description}>
                          {turn.description}
                        </div>
                        {/* TODO: maybe some more info about the structured action? */}
                      </div>
                    ))}
                    <div className={styles.turnsBottom} ref={turnsBottom_ref} />
                  </div>
                  <div className={styles.prompt}>
                    <textarea
                      className={styles.textarea}
                      ref={inputPromptAction_ref}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          const value = event.currentTarget.value;
                          event.currentTarget.value = "";
                          void submitPromptAction({ prompt: value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.column}>
                <div className={styles.ViewPanel}>
                  <div className={styles.json}>
                    {stringify(instStatus.inst.view)}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          fromNever(instStatus)
        )}
      </div>
      <div className={styles.LogsPanel}>
        <div className={styles.title}>Logs</div>
        <div className={styles.logs}>
          {logs.map((log, i) => (
            <div className={styles.log} key={i}>
              {log}
            </div>
          ))}
          <div className={styles.logsBottom} ref={logsBottom_ref} />
        </div>
      </div>
    </div>
  );
}

function PromptInitializationPanel(props: {
  submit: (params: P["initialization"]) => Promise<void>;
}) {
  const prompt_ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={styles.PromptInitializationPanel}>
      <div className={styles.title}>Initialization</div>
      <table className={styles.table}>
        <tbody>
          <tr>
            <td className={styles.label}>Prompt</td>
            <td className={styles.value}>
              <textarea className={styles.textarea} ref={prompt_ref} />
            </td>
          </tr>
        </tbody>
      </table>
      <div className={styles.item}>
        <Button
          onClick={() => props.submit({ prompt: prompt_ref.current!.value })}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

function Button(props: {
  onClick: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <button
      className={styles.button}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
        void props.onClick()
      }
    >
      {props.children}
    </button>
  );
}
