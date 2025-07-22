import { formatDate, fromNever, intercalate } from "@/utility";
import { useEffect, useRef, useState } from "react";
import type {
  InstClient,
  InstMetadata,
  SpecClient,
  SpecParams,
} from "../../ontology";
import styles from "./SimpleClient.module.css";

type InstStatus<S, V, A> =
  | { type: "none" }
  | { type: "loading"; instMetadata: InstMetadata }
  | { type: "loaded"; inst: InstClient<S, V, A> };

export default function SimpleClient<
  N extends string,
  P extends SpecParams,
  S,
  V,
  A,
>({ spec }: { spec: SpecClient<N, P, S, V, A> }) {
  const [instMetadatas, set_instMetadatas] = useState<InstMetadata[]>([]);
  const [logs, set_logs] = useState<string[]>([]);
  const [isShownPopupNew, set_isShownPopupNew] = useState(false);
  const [instStatus, set_instStatus] = useState<InstStatus<S, V, A>>({
    type: "none",
  });
  const turnsBottom_ref = useRef<HTMLDivElement>(null);
  const logsBottom_ref = useRef<HTMLDivElement>(null);
  const inputName_ref = useRef<HTMLInputElement>(null);

  async function updateInst() {
    set_logs((logs) => [...logs, `[updateInst]`]);
    await spec.saveInst();
    const inst = await spec.getInst();
    if (inst === undefined) {
      set_instStatus({ type: "none" });
      set_logs((logs) => [...logs, `[updateInst] failed to get inst`]);
      return;
    }
    set_instStatus({ type: "loaded", inst });
  }

  async function loadInst(id: string): Promise<void> {
    set_logs((logs) => [...logs, `[loadInst] id = ${id}`]);
    await spec.loadInst(id);
    await updateInst();
  }

  useEffect(
    () => {
      if (instStatus.type === "loading") {
        void loadInst(instStatus.instMetadata.id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec, instStatus],
  );

  async function update_instMetadatas() {
    set_logs((logs) => [...logs, `[update_instMetadatas]`]);
    set_instMetadatas(await spec.getInstMetadatas());
  }

  useEffect(
    () => {
      void update_instMetadatas();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec],
  );

  async function submitPrompt(params: P["initialization"]) {
    set_logs((logs) => [...logs, `[submitPrompt]`]);
    await spec.initialize(params);
    await update_instMetadatas();
    await updateInst();
  }

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
  });

  async function setInstName(name: string): Promise<void> {
    set_logs((logs) => [...logs, `[setInstName]`]);
    await spec.saveInst(name);
    await update_instMetadatas();
  }

  const PromptInitialization = spec.PromptInitializationComponent;
  const View = spec.ViewComponent;
  const PromptAction = spec.PromptActionComponent;
  const Turn = spec.TurnComponent;
  return (
    <div className={styles.SimpleClient}>
      <div
        className={[
          styles.popup,
          styles.New,
          isShownPopupNew ? styles.shown : styles.hidden,
        ].join(" ")}
      >
        <div className={styles.toolbar}>
          <div className={styles.title}>New</div>
          <button
            className={styles.button}
            onClick={() => set_isShownPopupNew(false)}
          >
            Cancel
          </button>
        </div>
        <PromptInitialization
          submit={async (params) => {
            await submitPrompt(params);
            set_isShownPopupNew(false);
          }}
        />
      </div>
      <div className={styles.sidebar}>
        <div className={styles.sectionTitle}>New</div>
        <button
          className={styles.button}
          onClick={() => set_isShownPopupNew(true)}
        >
          New
        </button>
        <div className={styles.sectionTitle}>Load</div>
        {instMetadatas.map((instMetadata, i) => (
          <div className={styles.item_load} key={i}>
            <div className={styles.date}>
              {formatDate(new Date(instMetadata.creationDate))
                .split(" ")
                .map((s, i) => (
                  <div key={i}>{s}</div>
                ))}
            </div>
            <button
              className={styles.button}
              key={i}
              onClick={() => set_instStatus({ type: "loading", instMetadata })}
            >
              {instMetadata.name ?? instMetadata.id}
            </button>
          </div>
        ))}
      </div>
      {instStatus.type === "none" ? (
        <></>
      ) : instStatus.type === "loading" ? (
        <></>
      ) : instStatus.type === "loaded" ? (
        <div className={styles.view}>
          <div className={styles.sidebar}>
            <div className={styles.metadata}>
              <input
                className={styles.inputName}
                ref={inputName_ref}
                defaultValue={instStatus.inst.metadata.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void setInstName(e.currentTarget.value);
                  }
                }}
              />
            </div>
            <div className={styles.turns}>
              {instStatus.inst.turns.map((turn, i) => (
                <Turn turn={turn} key={i} />
              ))}
              <div className={styles.turnsBottom} ref={turnsBottom_ref} />
            </div>
            <PromptAction view={instStatus.inst.view} update={updateInst} />
          </div>
          <View view={instStatus.inst.view} />
        </div>
      ) : (
        fromNever(instStatus)
      )}
      <div className={styles.logs}>
        {logs.map((log, index) => (
          <div className={styles.log} key={index}>
            {log}
          </div>
        ))}
        <div className={styles.logsBottom} ref={logsBottom_ref} />
      </div>
    </div>
  );
}
