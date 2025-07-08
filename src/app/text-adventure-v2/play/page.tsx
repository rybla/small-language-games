/** eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Game, GameId } from "../ontology";
import { getGame } from "../server";
import Markdown from "react-markdown";
import { presentGameWorld } from "../semantics";
import style from "./page.module.css";

export default function Page() {
  const [status, set_status] = useState("initial status");

  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");

  // @ts-expect-error mismatch when inferring type from zod schema
  const [game, set_game]: [Game, Dispatch<SetStateAction<Game>>] = useState<
    Game | undefined
  >(undefined);

  async function update_game() {
    if (gameId !== null) {
      try {
        set_status("loading game...");
        set_game(await getGame(gameId as GameId));
        set_status("loaded game");
      } catch (exception: unknown) {
        console.error(exception);
        if (exception instanceof Error) set_status(exception.toString());
        else throw exception;
      }
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

  if (gameId === null)
    return (
      <main>
        <div className={style.panel}>{status}</div>
        <div>must provide gameName</div>
      </main>
    );
  if (game === undefined)
    return (
      <main>
        <div className={style.panel}>{status}</div>
      </main>
    );

  return (
    <main>
      <div className={style.panel}>
        <Markdown>{presentGameWorld(game)}</Markdown>
      </div>
    </main>
  );
}
