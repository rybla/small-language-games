"use client";

import { do_, unwords } from "@/utility";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { paths } from "../common_frontend";
import type { Game, GameId, Item, PlayerAction, PlayerTurn } from "../ontology";
import {
  getItem,
  getPlayerItems,
  getPlayerRoom,
  presentGame,
  presentGameFromPlayerPerspective,
} from "../semantics";
import * as server from "../server";
import style from "./page.module.css";

export default function Page() {
  const [status, set_status] = useState("initial status");
  const [ungame, set_ungame] = useState<Game | undefined>(undefined);
  const [submittedPrompt, set_submittedPrompt] = useState<string | undefined>(
    undefined,
  );
  const [imageUrl_focus, set_imageUrl_focus] = useState<string | null>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const turnsBottomRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");
  const mode = searchParams.get("mode");

  async function update_game() {
    if (gameId === null) {
      set_status("you must set the `gameId` URL parameter");
      return;
    }

    try {
      set_status("loading game...");
      set_ungame(await server.getGame(gameId as GameId));
      set_status("loaded game");
    } catch (exception: unknown) {
      console.error(exception);
      if (exception instanceof Error) {
        set_status(exception.toString());
        return;
      } else throw exception;
    }
  }

  useEffect(
    () => {
      update_game();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameId],
  );

  useEffect(() => {
    turnsBottomRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [ungame, submittedPrompt]);

  return (
    <main className={style.main}>
      {ungame === undefined ? (
        <></>
      ) : (
        do_(() => {
          const game: Game = ungame;

          function renderItem(item: Item, key?: number) {
            const item_imageUrl = paths.getItemImageFilepath(
              game.metadata.id,
              item.name,
            );
            return (
              <div className={style.ItemView} key={key}>
                <Image
                  className={style.image}
                  alt={item.name}
                  src={item_imageUrl}
                  onClick={() => set_imageUrl_focus(item_imageUrl)}
                  width={512}
                  height={512}
                />
                <div className={style.name}>{item.name}</div>
              </div>
            );
          }

          function renderItemName(item: Item) {
            return <span className={style.ItemName}>{item.name}</span>;
          }

          function renderPrePlayerTurn(prompt: string) {
            return (
              <div className={style.PlayerTurn}>
                <div className={style.input}>
                  <div className={style.prompt}>{prompt}</div>
                </div>
                <div className={style.output}>
                  <div className={style.processing}>processing...</div>
                </div>
              </div>
            );
          }

          function renderPlayerAction(action: PlayerAction, key?: number) {
            switch (action.type) {
              case "PlayerDropsItem": {
                const item = getItem(game.world, action.item);
                return (
                  <div className={style.PlayerAction} key={key}>
                    <div className={style.label}>
                      you drop {renderItemName(item)}
                    </div>
                    {renderItem(item)}
                  </div>
                );
              }
              case "PlayerTakesItem": {
                const item = getItem(game.world, action.item);
                return (
                  <div className={style.PlayerAction} key={key}>
                    <div className={style.label}>
                      you take {renderItemName(item)}
                    </div>
                    {renderItem(item)}
                  </div>
                );
              }
              case "PlayerInspectsItem": {
                const item = getItem(game.world, action.item);
                return (
                  <div className={style.PlayerAction} key={key}>
                    <div className={style.label}>
                      you inspect {renderItemName(item)}
                    </div>
                    {renderItem(item)}
                  </div>
                );
              }
              case "PlayerMovesInsideCurrentRoom": {
                return (
                  <div className={style.PlayerAction} key={key}>
                    <div className={style.label}>
                      you move around inside the room
                    </div>
                  </div>
                );
              }
              case "PlayerInspectsRoom": {
                return (
                  <div className={style.PlayerAction} key={key}>
                    <div className={style.label}>you inspect the room</div>
                  </div>
                );
              }
            }
          }

          function renderPlayerTurn(turn: PlayerTurn, key?: number) {
            return (
              <div className={style.PlayerTurn} key={key}>
                <div className={style.input}>
                  <div className={style.prompt}>{turn.prompt}</div>
                </div>
                <div className={style.output}>
                  <div className={style.description}>{turn.description}</div>
                  <div className={style.actions}>
                    {turn.actions.map((action, i) =>
                      renderPlayerAction(action, i),
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className={style.content_column}>
              <div className={style.content}>
                <div className={style.turns}>
                  {game.turns.map((turn, i) => renderPlayerTurn(turn, i))}
                  {submittedPrompt === undefined ? (
                    <></>
                  ) : (
                    renderPrePlayerTurn(submittedPrompt)
                  )}
                  <div ref={turnsBottomRef}></div>
                </div>
                <div className={style.separator}></div>
                <div className={style.Prompt}>
                  <textarea
                    ref={promptRef}
                    onKeyUp={async (event) => {
                      if (promptRef.current === null)
                        throw new Error(
                          "impossible: promptRef.current === null",
                        );

                      if (event.key === "Enter") {
                        const prompt = promptRef.current.value.trim();
                        promptRef.current.value = "";
                        set_submittedPrompt(prompt);
                        try {
                          await server.promptGame(game.metadata.id, prompt);
                          set_submittedPrompt(undefined);
                          await update_game();
                        } catch (exception: unknown) {
                          if (exception instanceof Error) {
                            set_status(exception.message);
                          } else {
                            set_status("An unknown error occurred.");
                          }
                          promptRef.current.value = prompt;
                        }
                      }
                    }}
                    placeholder="prompt"
                  ></textarea>
                  <div className={style.player_info}>
                    <div className={style.heading}>Player Info</div>
                    <LabeledValue label="Name" value={game.world.player.name} />
                    <LabeledValue
                      label="Description"
                      value={game.world.player.shortDescription}
                    />
                    <LabeledValue
                      label="Appearance"
                      value={game.world.player.appearanceDescription}
                    />
                    <LabeledValue
                      label="Personality"
                      value={game.world.player.personalityDescription}
                    />
                  </div>
                  <div className={style.player_info}>
                    <div className={style.heading}>Room Info</div>
                    {/* TODO: <Image src={} /> */}
                    <LabeledValue
                      label="Name"
                      value={game.world.playerLocation.room}
                    />
                    <LabeledValue
                      label="Description"
                      value={getPlayerRoom(game.world).shortDescription}
                    />
                    <LabeledValue
                      label="Player Location"
                      value={game.world.playerLocation.description}
                    />
                  </div>
                  <div className={style.inventory_info}>
                    <div className={style.heading}>Inventory</div>
                    <div className={style.items}>
                      {getPlayerItems(game.world).map((itemLocation, i) => {
                        const item = getItem(game.world, itemLocation.item);
                        return renderItem(item, i);
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      {gameId === null || ungame === undefined ? (
        <div className={unwords(style.panel, style.status)}>{status}</div>
      ) : (
        <></>
      )}
      {ungame !== undefined && mode === "dev" ? (
        <div className={unwords(style.panel, style.dev)}>
          <div className={style.Markdown}>
            <Markdown>{presentGame(ungame)}</Markdown>
          </div>
          <div className={style.Markdown}>
            <Markdown>{presentGameFromPlayerPerspective(ungame)}</Markdown>
          </div>
        </div>
      ) : (
        <></>
      )}
      <ImageModal
        imageUrl={imageUrl_focus}
        onClose={() => set_imageUrl_focus(null)}
      />
    </main>
  );
}

function ImageModal(props: { imageUrl: string | null; onClose: () => void }) {
  if (!props.imageUrl) return null;

  return (
    <div className={style.ImageModal} onClick={() => props.onClose()}>
      <Image
        className={style.image}
        src={props.imageUrl}
        alt="Focus Image"
        width={1024}
        height={1024}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

function LabeledValue(props: { label: ReactNode; value: ReactNode }) {
  return (
    <div className={style.LabeledValue}>
      <div className={style.label}>{props.label}</div>
      <div className={style.value}>{props.value}</div>
    </div>
  );
}
