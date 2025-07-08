"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import type { Game, GameId, PlayerTurn } from "../ontology";
import { presentGameWorld } from "../semantics";
import { getGame } from "../server";
import style from "./page.module.css";
import { stringify, unwords } from "@/utility";
import * as example1 from "../example/example1";

export default function Page() {
  const [status, set_status] = useState("initial status");
  const [game, set_game] = useState<Game | undefined>(undefined);

  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");
  const mode = searchParams.get("mode");

  // const mode =

  async function update_game() {
    if (gameId === null) {
      // set_status("you must set the ?gameId URL parameter");
      set_game(example1.game);
      return;
    }

    try {
      set_status("loading game...");
      set_game(await getGame(gameId as GameId));
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

  // --------------------------------

  return (
    <main className={style.main}>
      {game !== undefined ? (
        <div className={style.content}>
          <div className={style.heading}>Turns</div>
          <div className={style.turns}>
            {game.turns.map((turn, i) => (
              <ViewPlayerTurn playerTurn={turn} key={i} />
            ))}
          </div>
        </div>
      ) : (
        <></>
      )}
      {gameId === null || game === undefined ? (
        <div className={unwords(style.panel, style.status)}>{status}</div>
      ) : (
        <></>
      )}
      {game !== undefined && mode === "dev" ? (
        <div className={unwords(style.panel, style.dev)}>
          <Markdown>{presentGameWorld(game)}</Markdown>
        </div>
      ) : (
        <></>
      )}
    </main>
  );
}

function ViewPlayerTurn(props: { playerTurn: PlayerTurn }) {
  return <div className={style.PlayerTurn}>{stringify(props.playerTurn)}</div>;
}
