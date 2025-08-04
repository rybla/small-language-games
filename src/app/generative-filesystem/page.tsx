"use client";

import { do_, fromNever, stringify, TODO } from "@/utility";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import type {
  XAction,
  XEffect,
  XFile,
  XFileId,
  XState,
  XTurn,
} from "./ontology";
import styles from "./page.module.css";
import {
  getFocus,
  getImageContentFilepath,
  getKidIds,
  getXFile,
} from "./semantics";
import "./globals.css";
import * as server from "./server";
import * as icon from "lucide-react";

export default function Page() {
  const [state, set_state] = useState<XState | undefined>();

  useEffect(() => {
    void do_(async () => {
      await server.load();
      set_state(await server.getXState());
    });
  }, []);

  return (
    <div className={styles.page}>
      {state === undefined ? (
        <Loading message={"loading XSystem"} />
      ) : (
        <XSystemPanel state={state}></XSystemPanel>
      )}
    </div>
  );
}

function XSystemPanel(props: { state: XState }) {
  const [state, set_state] = useState(props.state);
  const turnsBottomRef = useRef<HTMLDivElement>(null);
  const [logs, set_logs] = useState<string[]>([]);
  const logsBottomRef = useRef<HTMLDivElement>(null);

  async function update_state() {
    set_state(await server.getXState());
  }

  async function submit(prompt: string) {
    set_logs([...logs, `[submit] ${stringify({ prompt })}`]);
    await server.submit(prompt);
    await update_state();
  }

  useEffect(() => {
    turnsBottomRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [state.client.turns]);

  useEffect(() => {
    logsBottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [logs]);

  return (
    <div className={styles.XSystemViewer}>
      <div className={styles.MainPanel}>
        <div className={styles.console}>
          <div className={styles.turns}>
            {state.client.turns.map((turn, i) => (
              <div className={styles.turn} key={i}>
                <XTurnViewer state={state} turn={turn} />
              </div>
            ))}
            <div className={styles.turnsBottom} ref={turnsBottomRef} />
          </div>
          <div className={styles.input}>
            <textarea
              className={styles.prompt}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  const prompt = event.currentTarget.value;
                  event.currentTarget.value = "";
                  void submit(prompt);
                }
              }}
            />
          </div>
        </div>
        <div className={styles.focus}>
          <XFileViewer state={state} file={getFocus(state)} />
        </div>
      </div>
      <div className={styles.DebugPanel}>
        <div className={styles.json}>{stringify({ state })}</div>
      </div>
      <div className={styles.LogsPanel}>
        <div className={styles.title}>Logs</div>
        <div className={styles.logs}>
          {logs.map((log, i) => (
            <div className={styles.log} key={i}>
              {log}
            </div>
          ))}
          <div className={styles.logsBottom} ref={logsBottomRef} />
        </div>
      </div>
    </div>
  );
}

function XTurnViewer({ state, turn }: { state: XState; turn: XTurn }) {
  return (
    <div className={styles.XTurnViewer}>
      <div className={styles.prompt}>
        <icon.Quote className={styles.UIIcon} />
        <div className={styles.text}>{turn.prompt}</div>
      </div>
      <div className={styles.actions}>
        {turn.actions.map((action, i) => (
          <XActionViewer key={i} state={state} action={action} />
        ))}
      </div>
      <div className={styles.effects}>
        {turn.effects.map((effect, i) => (
          <XEffectViewer key={i} state={state} effect={effect} />
        ))}
      </div>
    </div>
  );
}

function XActionViewer({ state, action }: { state: XState; action: XAction }) {
  return (
    <div className={styles.XActionViewer}>
      <icon.ChevronRight className={styles.UIIcon} />
      {action.type === "CreateDirectory" ? (
        <div className={styles.message}>
          create directory <div className={styles.XFileName}>{action.name}</div>
        </div>
      ) : action.type === "CreateTextFile" ? (
        <div className={styles.message}>
          create text file <div className={styles.XFileName}>{action.name}</div>
        </div>
      ) : action.type === "DeleteFile" ? (
        <div className={styles.message}>
          delete file{" "}
          <XFileLabel state={state} file={getXFile(state, action.id)} />
        </div>
      ) : action.type === "OpenFile" ? (
        <div className={styles.message}>
          open file{" "}
          <XFileLabel state={state} file={getXFile(state, action.id)} />
        </div>
      ) : action.type === "ShowHelp" ? (
        <div className={styles.message}>show help</div>
      ) : action.type === "OpenParentDirectory" ? (
        <div className={styles.message}>open parent directory</div>
      ) : (
        fromNever(action)
      )}
    </div>
  );
}

function XEffectViewer({ state, effect }: { state: XState; effect: XEffect }) {
  return (
    <div className={styles.XEffectViewer}>
      {effect.type === "Error" ? (
        <span className={styles.message}>
          <Markdown>{effect.message}</Markdown>
        </span>
      ) : (
        fromNever(effect.type)
      )}
    </div>
  );
}

function XFileLabel({ state, file }: { state: XState; file: XFile }) {
  return (
    <div className={styles.XFileLabel}>
      {file.type === "directory" ? (
        <icon.Folder className={styles.XFileIcon} />
      ) : file.type === "text" ? (
        <icon.Text className={styles.XFileIcon} />
      ) : file.type === "image" ? (
        <icon.Image className={styles.XFileIcon} />
      ) : (
        fromNever(file)
      )}
      <div className={styles.XFileName}>{file.name}</div>
    </div>
  );
}

function XFileViewer({ state, file }: { state: XState; file: XFile }) {
  return (
    <div className={styles.XFileViewer}>
      {file.type === "directory" ? (
        <>
          <XFileLabel state={state} file={file} />
          <div className={styles.kids}>
            {getKidIds(state, file.id).map((kidId) => {
              return (
                <div className={styles.kid} key={kidId}>
                  <XFileLabel state={state} file={getXFile(state, kidId)} />
                </div>
              );
            })}
          </div>
        </>
      ) : file.type === "text" ? (
        <>
          <XFileLabel state={state} file={file} />
          <div className={styles.content}>
            <TextContent id={file.id} />
          </div>
        </>
      ) : file.type === "image" ? (
        <>
          <XFileLabel state={state} file={file} />
          <div className={styles.content}>
            <ImageContent id={file.id} />
          </div>
        </>
      ) : (
        fromNever(file)
      )}
    </div>
  );
}

function TextContent({ id }: { id: XFileId }) {
  const [content, set_content] = useState<string | undefined>();

  useEffect(() => {
    void do_(async () => {
      set_content(await server.fetchTextContent(id));
    });
  }, [id]);

  return (
    <div className={styles.TextContent}>
      {content === undefined ? (
        <Loading message={"loading text content"} />
      ) : (
        <Markdown>{content}</Markdown>
      )}
    </div>
  );
}

function ImageContent({ id }: { id: XFileId }) {
  return (
    <Image
      className={styles.ImageContent}
      src={getImageContentFilepath("/", id)}
      alt={id}
      width={512}
      height={512}
    />
  );
}

function Loading({ message }: { message: string }) {
  return (
    <div className={styles.Loading}>
      <div className={styles.message}>{message}</div>
      <div className={styles.animation}></div>
    </div>
  );
}
