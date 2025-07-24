"use client";

import { InstClient, InstMetadata, TurnClient } from "@/library/sva/ontology";
import Paths from "@/library/sva/paths";
import { do_, formatDate, fromNever } from "@/utility";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { A, getImageFilepath, P, V } from "./common";
import styles from "./page.module.css";
import * as server from "./server";

const paths = new Paths("/");

type InstStatus =
  | { type: "none" }
  | { type: "loading"; instMetadata: InstMetadata }
  | { type: "loaded"; inst: InstClient<V, A> };

export default function Page() {
  const [instMetadatas, set_instMetadatas] = useState<InstMetadata[]>([]);
  const [logs, set_logs] = useState<string[]>([]);
  const [isShownPopupNew, set_isShownPopupNew] = useState(false);
  const [instStatus, set_instStatus] = useState<InstStatus>({
    type: "none",
  });
  const turnsBottom_ref = useRef<HTMLDivElement>(null);
  const logsBottom_ref = useRef<HTMLDivElement>(null);
  const inputName_ref = useRef<HTMLInputElement>(null);

  async function updateInst() {
    set_logs((logs) => [...logs, `[updateInst]`]);
    await server.save();
    const inst = await server.get();
    if (inst === undefined) {
      set_instStatus({ type: "none" });
      set_logs((logs) => [...logs, `[updateInst] failed to get inst`]);
      return;
    }
    set_instStatus({ type: "loaded", inst });
    if (inputName_ref.current !== null) {
      inputName_ref.current.value = inst.metadata.name;
    }
  }

  async function loadInst(id: string): Promise<void> {
    set_logs((logs) => [...logs, `[loadInst] id = ${id}`]);
    await server.load(id);
    await updateInst();
  }

  useEffect(
    () => {
      if (instStatus.type === "loading") {
        void loadInst(instStatus.instMetadata.id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instStatus],
  );

  async function update_instMetadatas() {
    set_logs((logs) => [...logs, `[update_instMetadatas]`]);
    set_instMetadatas(await server.getInstMetadatas());
  }

  useEffect(() => {
    void update_instMetadatas();
  }, []);

  async function submitPromptInitialization(params: P["initialization"]) {
    set_logs((logs) => [...logs, `[submitPromptInitialization]`]);
    await server.initialize(params);
    await update_instMetadatas();
    await updateInst();
  }

  async function submitPromptAction(params: P["action"]) {
    set_logs((logs) => [...logs, `[submitPromptAction]`]);
    await server.act(params);
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
    await server.save(name);
    await update_instMetadatas();
  }

  return (
    <div className={styles.page}>
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
        <div className={styles.PromptInitialization}>
          <PromptInitializationComponent
            submit={async (params) => {
              await submitPromptInitialization(params);
              set_isShownPopupNew(false);
            }}
          />
        </div>
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
        {instMetadatas
          .toSorted((x, y) => y.creationDate - x.creationDate)
          .map((instMetadata, i) => (
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
                onClick={() =>
                  set_instStatus({ type: "loading", instMetadata })
                }
              >
                {instMetadata.name ?? instMetadata.id}
              </button>
            </div>
          ))}
      </div>
      {instStatus.type === "none" ? (
        <></>
      ) : instStatus.type === "loading" ? (
        <div className={styles.loading}>
          <span className={styles.label}>Loading</span>
          <span className={styles.symbol}>.</span>
          <span className={styles.symbol}>.</span>
          <span className={styles.symbol}>.</span>
        </div>
      ) : instStatus.type === "loaded" ? (
        <div className={styles.loaded}>
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
                <div className={styles.Turn} key={i}>
                  <TurnComponent turn={turn} />
                </div>
              ))}
              <div className={styles.turnsBottom} ref={turnsBottom_ref} />
            </div>
            <div className={styles.PromptAction}>
              <PromptActionComponent
                view={instStatus.inst.view}
                submit={submitPromptAction}
              />
            </div>
          </div>
          <div className={styles.View}>
            <ViewComponent inst={instStatus.inst} view={instStatus.inst.view} />
          </div>
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

function PromptInitializationComponent(props: {
  submit: (params: P["initialization"]) => Promise<void>;
}) {
  const [models, set_models] = useState<string[]>([]);
  const modelRef = useRef<HTMLSelectElement>(null);

  useEffect(
    () => void do_(async () => set_models(await server.getModels())),
    [],
  );

  const temperatureRef = useRef<HTMLInputElement>(null);

  function submit() {
    void props.submit({
      temperature: parseFloat(temperatureRef.current!.value),
      model: modelRef.current!.value,
    });
  }

  return (
    <div className={styles.PromptInitialization}>
      <div className={styles.title}>Initialization</div>
      <table className={styles.params}>
        <tbody>
          <tr>
            <td className={styles.label}>model</td>
            <td className={styles.input_container}>
              <select
                className={styles.model}
                ref={modelRef}
                defaultValue="default"
              >
                <option value="default" disabled>
                  choose an image model
                </option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <td className={styles.label}>temperature</td>
            <td className={styles.input_container}>
              <input
                className={styles.temperature}
                ref={temperatureRef}
                type="number"
                defaultValue={0.5}
                min={0}
                max={1}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button className={styles.button} onClick={submit}>
        Submit
      </button>
    </div>
  );
}

function PromptActionComponent(props: {
  view: V;
  submit: (params: P["action"]) => Promise<void>;
}) {
  const promptRef = useRef<HTMLInputElement>(null);

  function submit() {
    void props.submit({ prompt: promptRef.current!.value });
    promptRef.current!.value = "";
  }

  return (
    <div className={styles.PromptAction}>
      <div className={styles.title}>Prompt Action</div>
      <table>
        <tbody>
          <tr>
            <td className={styles.label}>Prompt</td>
            <td className={styles.input_container}>
              <input
                className={styles.prompt}
                ref={promptRef}
                placeholder="..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ViewComponent(props: { inst: InstClient<V, A>; view: V }) {
  return (
    <div className={styles.View}>
      <div className={styles.library}>
        {props.inst.view.imageIds.map((imageId, i) => (
          <div className={styles.item} key={i}>
            <ImageFull instId={props.inst.metadata.id} imageId={imageId} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TurnComponent(props: { turn: TurnClient<V, A> }) {
  return (
    <div className={styles.Turn}>
      <div className={styles.description}>{props.turn.description}</div>
    </div>
  );
}

function ImageFull(props: { instId: string; imageId: string }) {
  return (
    <Image
      alt={props.imageId}
      className={styles.LargeImage}
      src={getImageFilepath(paths, props.instId, props.imageId)}
      width={1024}
      height={1024}
    />
  );
}

function ImageThumbnail(props: { instId: string; imageId: string }) {
  return (
    <Image
      alt={props.imageId}
      className={styles.ThumbnailImage}
      src={getImageFilepath(paths, props.instId, props.imageId)}
      width={256}
      height={256}
    />
  );
}
