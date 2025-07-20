"use client";

import { spawnAsync, stringify, unwords } from "@/utility";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { paths } from "../common_frontend";
import type {
  Game,
  GameId,
  Item,
  ItemName,
  PlayerAction,
  PlayerTurn,
  Room,
  RoomName,
} from "../ontology";
import {
  getItem,
  getPlayerItems,
  getPlayerRoom,
  getRoom,
  presentGame,
  presentGameFromPlayerPerspective,
} from "../semantics";
import * as server from "../server";
import style from "./futuristic.page.module.css";
// import style from "./rustic.page.module.css";

/**
 * The component for playing the text adventure game.
 */
export default function Page() {
  /**
   * A simple status message.
   */
  const [status, set_status] = useState<string | undefined>(undefined);
  /**
   * The current game, which starts as undefined before it's loaded asynchronously when the component is started.
   */
  const [gameOrUndefined, set_gameOrUndefined] = useState<Game | undefined>(
    undefined,
  );
  /**
   * The prompt submitted by the user that is currently getting processed. This is stored in the react state so that the prompt can be rendered as a "pre-turn" that just has the prompt before the response is generated.
   */
  const [submittedPrompt, set_submittedPrompt] = useState<string | undefined>(
    undefined,
  );
  /**
   * The focussed image url, showing a big view of a particular item image or room image that the user clicked on.
   */
  const [imageUrl_focus, set_imageUrl_focus] = useState<string | null>(null);

  /**
   * A reference to the text area where the user inputs their prompt.
   */
  const promptRef = useRef<HTMLTextAreaElement>(null);
  /**
   * A reference to an empty div at the bottom of the list of turns, which is useful for scrolling the list of turns to the bottom when a new turn is added, via `scrollIntoView`.
   */
  const turnsBottomRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");
  const mode = searchParams.get("mode");

  /**
   * Update the game state by getting it from the server.
   */
  async function update_game() {
    if (gameId === null) {
      set_status("you must set the `gameId` URL parameter");
      return;
    }

    try {
      set_status("loading game...");
      set_gameOrUndefined(await server.getGame(gameId as GameId));
      set_status(undefined);
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
      void update_game();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameId],
  );

  /**
   * Whenever the game state is changed, the user submits a prompt, or a new turn is added (in which case `submittedPrompt` will be reset to `undefined`), scroll the list of turns to the very bottom smoothly.
   */
  useEffect(() => {
    turnsBottomRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [gameOrUndefined, submittedPrompt]);

  /**
   * Render the entire user-facing presentation of the game.
   */
  function renderGame(game: Game) {
    /**
     * Render a card representing a room. The card emphasizes the room's image, and also has the room's name as a caption.
     */
    function renderRoom(room: Room, key?: number) {
      const room_imageUrl = paths.getRoomImageFilepath(
        game.metadata.id,
        room.name,
      );
      return (
        <div className={style.RoomView} key={key}>
          <Image
            className={style.image}
            alt={room.name}
            src={room_imageUrl}
            onClick={() => set_imageUrl_focus(room_imageUrl)}
            width={512}
            height={512}
          />
          <div className={style.name}>{room.name}</div>
        </div>
      );
    }

    /**
     * Render a card representing a room. The card emphasizes the rooms image and also has the rooms name as a caption.
     */
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

    /**
     * Render the name of an item specially so that it is clear that is referencing a particular game item. This can be used in line with other text.
     */
    function renderItemName(item: ItemName) {
      return <span className={style.ItemName}>{item}</span>;
    }

    /**
     * Render the name of a room, specially, so that it is clear that it is referencing a particular room in the game. This can be used in line with other text.
     */
    function renderRoomName(room: RoomName) {
      return <span className={style.RoomName}>{room}</span>;
    }

    /**
     * Render a "pre-turn", which is a sort of representation of an incomplete term where only the prompt has been inputted, and the response part of the term has not been generated yet. This is presented right after the user inputs their prompt and before the response is generated.
     */
    function renderPrePlayerTurn(prompt: string): ReactNode {
      return (
        <div className={style.PrePlayerTurn}>
          <div className={style.input}>
            <div className={style.prompt}>{prompt}</div>
          </div>
          <div className={style.output}>
            <div className={style.processing}>
              processing
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        </div>
      );
    }

    /**
     * Render a single player action as one of many that the player did on their turn.
     */
    function renderPlayerAction(action: PlayerAction, key?: number) {
      switch (action.type) {
        case "PlayerDropsItem": {
          const item = getItem(game.world, action.item);
          return (
            <div className={style.PlayerAction} key={key}>
              <div className={style.label}>
                you drop {renderItemName(item.name)}
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
                you take {renderItemName(item.name)}
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
                you inspect {renderItemName(item.name)}
              </div>
              {renderItem(item)}
            </div>
          );
        }
        case "PlayerMovesInsideCurrentRoom": {
          return (
            <div className={style.PlayerAction} key={key}>
              <div className={style.label}>you move around inside the room</div>
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
        case "PlayerMovesToDifferentRoom": {
          const room = getRoom(game.world, action.room);
          return (
            <div className={style.PlayerAction} key={key}>
              <div className={style.label}>
                you go to {renderRoomName(room.name)}
              </div>
              {renderRoom(room)}
            </div>
          );
        }
        case "PlayerUsesItem": {
          const item = getItem(game.world, action.item);
          return (
            <div className={style.PlayerAction} key={key}>
              <div className={style.label}>
                you use {renderItemName(item.name)}
              </div>
              {renderItem(item)}
            </div>
          );
        }
        default: {
          throw new Error(
            `no view for action: ${stringify(action satisfies never)}`,
          );
        }
      }
    }

    /**
     * Render all the user-presented info about what happened on a player turn. This includes both the prompt that the user inputted and the resulting actions that the player did a description of what happened in the game on the turn.
     */
    function renderPlayerTurn(turn: PlayerTurn, key?: number) {
      return (
        <div className={style.PlayerTurn} key={key}>
          <div className={style.input}>
            <div className={style.prompt}>{turn.prompt}</div>
          </div>
          <div className={style.output}>
            <div className={style.description}>{turn.description}</div>
            <div className={style.actions}>
              {turn.actions.map((action, i) => renderPlayerAction(action, i))}
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
              onKeyUp={(event) =>
                spawnAsync(async () => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (promptRef.current === null) return;
                    if (promptRef.current.value.length === 0) return;
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
                })
              }
              placeholder="..."
            ></textarea>
            <div className={style.player_info}>
              <div className={style.heading}>Player</div>
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
            <div className={style.room_info}>
              <div className={style.heading}>Room</div>
              {renderRoom(getPlayerRoom(game.world))}
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
  }

  function renderStatusPanel(status: string) {
    return <div className={unwords(style.panel, style.status)}>{status}</div>;
  }

  function renderDevPanel(game: Game) {
    return (
      <div className={unwords(style.panel, style.dev)}>
        <div className={style.Markdown}>
          <Markdown>{presentGame(game)}</Markdown>
        </div>
        <div className={style.Markdown}>
          <Markdown>{presentGameFromPlayerPerspective(game)}</Markdown>
        </div>
      </div>
    );
  }

  return (
    <main className={style.main}>
      {gameOrUndefined === undefined ? <></> : renderGame(gameOrUndefined)}
      {status !== undefined ? renderStatusPanel(status) : <></>}
      {gameOrUndefined !== undefined && mode === "dev" ? (
        renderDevPanel(gameOrUndefined)
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

/**
 * A component that presents an image (at the specified `imageUrl`) overlayed on top of the entire screen, with a darkened background. When the user clicks on anywhere other than the image, then `onClose` is called.
 */
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

/**
 * A component that shows a label and a value together, where the label is _for_ the value.
 */
function LabeledValue(props: { label: ReactNode; value: ReactNode }) {
  return (
    <div className={style.LabeledValue}>
      <div className={style.label}>{props.label}</div>
      <div className={style.value}>{props.value}</div>
    </div>
  );
}
