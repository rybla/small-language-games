"use client";

import Image from "next/image";
import type { InstClient, InstMetadata } from "@/library/sva/ontology";
import { do_, formatDate, fromNever, stringify } from "@/utility";
import { useEffect, useRef, useState } from "react";
import { A, P, spec, V } from "./constant";
import styles from "./page.module.css";
import * as server from "./server";
import { markdownifyGameView } from "./semantics";
import Markdown from "react-markdown";
import { ChevronRight, MoveRight, Quote } from "lucide-react";
import { ItemName, RoomName } from "./ontology";
import path from "path";
import { paths } from "./common_client";

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

type PageState =
  | { type: "none" }
  | { type: "initializing"; params: P["initialization"] }
  | { type: "loaded"; inst: InstClient<V, A> };

export default function Page() {
  const [saveds, set_saveds] = useState<InstMetadata[]>([]);
  const [logs, set_logs] = useState<string[]>([]);
  const [isShown_NewPanel, set_isShown_NewPanel] = useState(false);
  const [state, set_state] = useState<PageState>({ type: "none" });
  const [turnPrompt, set_turnPrompt] = useState<string | undefined>();

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
      set_state({ type: "none" });
      set_logs((logs) => [...logs, `[updateInst] inst is undefined`]);
      return;
    }
    set_state({ type: "loaded", inst });
    if (name_ref.current !== null) name_ref.current.value = inst.metadata.name;
  }

  async function loadInst(id: string) {
    set_logs((logs) => [...logs, `[loadInst]`]);
    await server.loadInst(id);
    await updateInst();
  }

  async function saveInst(name?: string): Promise<void> {
    set_logs((logs) => [
      ...logs,
      `[saveInst] ${stringify({ name: name ?? "undefined" })}`,
    ]);
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
    set_turnPrompt(params.prompt);
    await server.actInst(params);
    set_turnPrompt(undefined);
    await updateInst();
  }

  async function resetInstToRightBeforeTurn(i: number) {
    await server.resetInstToRightBeforeTurn(i);
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
  }, [state, turnPrompt]);

  useEffect(() => {
    if (logsBottom_ref.current === null) return;
    logsBottom_ref.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [logs]);

  // ---------------------------------------------------------------------------

  return (
    <div
      className={styles.page}
      style={{
        flex: "1 1 0",
        minHeight: "0",
        width: "100%",
      }}
    >
      <div
        className={`${styles.NewPanel} ${isShown_NewPanel ? styles.shown : styles.hidden}`}
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
        {state.type === "none" ? (
          <></>
        ) : state.type === "initializing" ? (
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
                      <td className={styles.value}>{state.params.prompt}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : state.type === "loaded" ? (
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
                            defaultValue={state.inst.metadata.name}
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
                    {state.inst.turns.map((turn, i) => (
                      <div className={styles.turn} key={i}>
                        <div className={styles.controls}>
                          <SmallButton
                            onClick={() => resetInstToRightBeforeTurn(i)}
                          >
                            Undo
                          </SmallButton>
                        </div>
                        <div className={styles.prompt}>
                          <div className={styles.label}>
                            <Quote size={20} />
                          </div>
                          <div className={styles.content}>
                            {turn.action.prompt}
                          </div>
                        </div>
                        <div className={styles.gameActions}>
                          {turn.action.gameActions.map((gameAction, i) => (
                            <div className={styles.gameAction} key={i}>
                              {gameAction.type === "PlayerGoesToRoom" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    go to{" "}
                                    <span className={styles.roomName}>
                                      {gameAction.room}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <RoomCard
                                      inst={state.inst}
                                      roomName={gameAction.room}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : gameAction.type ===
                                "PlayerInspectsCurrentRoom" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    inspect{" "}
                                    <span className={styles.roomName}>
                                      {state.inst.view.game.world.room.name}
                                    </span>
                                  </div>
                                </>
                              ) : gameAction.type === "PlayerDropsItem" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    drop{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.item}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.item}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : gameAction.type === "PlayerTakesItem" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    take{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.item}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.item}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : gameAction.type === "PlayerInspectsItem" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    inspect{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.item}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.item}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : gameAction.type === "PlayerCombinesItems" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    combine{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.item1}
                                    </span>{" "}
                                    with{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.item2}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.item1}
                                      format="chat"
                                    />
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.item2}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : gameAction.type ===
                                "PlayerInspectsConnectionToAnotherRoom" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    inspect connection to{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.room}
                                    </span>
                                  </div>
                                </>
                              ) : gameAction.type === "PlayerOpensContainer" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    open{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.container}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.container}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : gameAction.type ===
                                "PlayerPutsItemIntoContainer" ? (
                                <>
                                  <div className={styles.label}>
                                    <ChevronRight size={20} />
                                  </div>
                                  <div className={styles.content}>
                                    put{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.item}
                                    </span>{" "}
                                    into{" "}
                                    <span className={styles.itemName}>
                                      {gameAction.container}
                                    </span>
                                  </div>
                                  <div className={styles.assets}>
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.item}
                                      format="chat"
                                    />
                                    <MoveRight size={30} />
                                    <ItemCard
                                      inst={state.inst}
                                      itemName={gameAction.container}
                                      format="chat"
                                    />
                                  </div>
                                </>
                              ) : (
                                fromNever(gameAction)
                              )}
                            </div>
                          ))}
                        </div>
                        <div className={styles.description}>
                          <Markdown>{turn.description}</Markdown>
                        </div>
                      </div>
                    ))}
                    {turnPrompt === undefined ? (
                      <></>
                    ) : (
                      <div className={styles.turn}>
                        <div className={styles.prompt}>
                          <div className={styles.label}>
                            <Quote size={20} />
                          </div>
                          <div className={styles.content}>{turnPrompt}</div>
                        </div>
                      </div>
                    )}
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
                  <div className={styles.currentRoom}>
                    <div className={styles.title}>Current Room</div>
                    <RoomCard
                      inst={state.inst}
                      roomName={state.inst.view.game.world.room.name}
                      format="view"
                    />
                  </div>
                  <div className={styles.player}>
                    <div className={styles.title}>Player</div>
                    <table className={styles.table}>
                      <tbody>
                        <tr>
                          <td className={styles.label}>name</td>
                          <td className={styles.value}>
                            {state.inst.view.game.world.player.name}
                          </td>
                        </tr>
                        <tr>
                          <td className={styles.label}>description</td>
                          <td className={styles.value}>
                            {state.inst.view.game.world.player.description}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.inventory}>
                    <div className={styles.title}>Inventory</div>
                    <div className={styles.items}>
                      {state.inst.view.game.world.player.items.map(
                        (item, i) => (
                          <ItemCard
                            inst={state.inst}
                            itemName={item.name}
                            format="view"
                            key={i}
                          />
                        ),
                      )}
                    </div>
                  </div>
                  <Markdown>
                    {markdownifyGameView(state.inst.view.game)}
                  </Markdown>
                </div>
              </div>
            </div>
          </>
        ) : (
          fromNever(state)
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

// -----------------------------------------------------------------------------
// PromptInitializationPanel
// -----------------------------------------------------------------------------

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
              <textarea
                className={styles.textarea}
                ref={prompt_ref}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.altKey || event.metaKey)
                  ) {
                    event.preventDefault();
                    void props.submit({ prompt: prompt_ref.current!.value });
                  }
                }}
              />
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

// -----------------------------------------------------------------------------
// RoomCard
// -----------------------------------------------------------------------------

type RoomCardFormat = "chat" | "view";

type RoomCardState = { type: "loading" } | { type: "loaded"; filename: string };

export function RoomCard(props: {
  inst: InstClient<V, A>;
  roomName: RoomName;
  format: RoomCardFormat;
}) {
  const [state, set_state] = useState<RoomCardState>({ type: "loading" });

  const ratioRoomImageToFrameImage = 0.85;
  const size = {
    chat: 300,
    view: 400,
  }[props.format];

  useEffect(() => {
    void do_(async () => {
      set_state({ type: "loading" });
      const filename = await server.loadRoomImageFilename(props.roomName);
      set_state({ type: "loaded", filename });
    });
  }, [props.roomName]);

  // the `.frame` has a transparent cutout and is layered on top of the `.item` such that they are both centered around the same center point
  return (
    <div className={styles.RoomCard}>
      <div className={styles.container}>
        {state.type === "loading" ? (
          <video
            className={[styles.room, styles.placeholder].join(" ")}
            src={path.join(
              paths.rootDirpath(spec.name),
              "placeholder_room.mp4",
            )}
            width={Math.floor(size * (4 / 3) * ratioRoomImageToFrameImage)}
            height={Math.floor(size * ratioRoomImageToFrameImage)}
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        ) : state.type === "loaded" ? (
          <Image
            className={[styles.room].join(" ")}
            alt={props.roomName}
            src={paths.assetFilepath(
              spec.name,
              props.inst.metadata.id,
              state.filename,
            )}
            width={Math.floor(size * (4 / 3) * ratioRoomImageToFrameImage)}
            height={Math.floor(size * ratioRoomImageToFrameImage)}
          />
        ) : (
          fromNever(state)
        )}
        <Image
          className={styles.frame}
          alt={""}
          src={path.join(paths.rootDirpath(spec.name), "frame_room.png")}
          width={Math.floor(size * (4 / 3))}
          height={Math.floor(size)}
        />
      </div>
      <div className={styles.roomName}>{props.roomName}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ItemCard
// -----------------------------------------------------------------------------

type ItemCardFormat = "view" | "chat";

type ItemCardState = { type: "loading" } | { type: "loaded"; filename: string };

function ItemCard(props: {
  inst: InstClient<V, A>;
  itemName: ItemName;
  format: ItemCardFormat;
}) {
  const [state, set_state] = useState<ItemCardState>({ type: "loading" });

  const size = {
    chat: 200,
    view: 200,
  }[props.format];
  const ratioOfItemImageToFrameImage = 0.75;

  useEffect(() => {
    void do_(async () => {
      set_state({ type: "loading" });
      const filename = await server.loadItemImageFilename(props.itemName);
      set_state({ type: "loaded", filename });
    });
  }, [props.itemName]);

  // the `.frame` has a transparent cutout and is layered on top of the `.item` such that they are both centered around the same center point
  return (
    <div className={styles.ItemCard}>
      <div className={styles.container}>
        {state.type === "loading" ? (
          <video
            className={[styles.item, styles.placeholder].join(" ")}
            src={path.join(
              paths.rootDirpath(spec.name),
              "placeholder_item.mp4",
            )}
            width={size * ratioOfItemImageToFrameImage}
            height={size * ratioOfItemImageToFrameImage}
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        ) : state.type === "loaded" ? (
          <Image
            className={[styles.item].join(" ")}
            alt={props.itemName}
            src={paths.assetFilepath(
              spec.name,
              props.inst.metadata.id,
              state.filename,
            )}
            width={size * ratioOfItemImageToFrameImage}
            height={size * ratioOfItemImageToFrameImage}
          />
        ) : (
          fromNever(state)
        )}
        <Image
          className={styles.frame}
          alt={""}
          src={path.join(paths.rootDirpath(spec.name), "frame_item.png")}
          width={size}
          height={size}
        />
      </div>
      <div className={styles.itemName}>{props.itemName}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Button
// -----------------------------------------------------------------------------

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

function SmallButton(props: {
  onClick: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`${styles.button} ${styles.SmallButton}`}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
        void props.onClick()
      }
    >
      {props.children}
    </button>
  );
}
