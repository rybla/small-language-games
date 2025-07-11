"use client";

import { useRef, useState } from "react";
import { rootName } from "../common";
import style from "./page.module.css";
import * as server from "../server";
import type { GameMetadata } from "../ontology";
import Link from "next/link";

type Phase =
  | {
      type: "prompt";
    }
  | {
      type: "processing";
      prompt: string;
      message: string;
    }
  | {
      type: "done";
      metadata: GameMetadata;
    };

export default function Page() {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [phase, set_phase] = useState<Phase>({ type: "prompt" });

  async function submitPrompt(prompt: string) {
    set_phase({ type: "processing", message: "TODO", prompt });
    const metadata = await server.initializeGame(prompt);
    set_phase({ type: "done", metadata });
  }

  switch (phase.type) {
    case "prompt": {
      return (
        <main className={style.main}>
          <div className={style.prompt}>
            <div className={style.heading}>Prompt</div>
            <textarea
              ref={promptRef}
              onKeyUp={(event) => {
                event.preventDefault();
                if (event.key === "Enter") {
                  if (promptRef.current === null) return;
                  if (promptRef.current.value.length === 0) return;
                  submitPrompt(promptRef.current.value);
                }
              }}
            />
            <button
              onClick={() => {
                if (promptRef.current === null) return;
                if (promptRef.current.value.length === 0) return;
                submitPrompt(promptRef.current.value);
              }}
            >
              Submit
            </button>
          </div>
        </main>
      );
    }
    case "processing": {
      return (
        <main className={style.main}>
          <div className={style.processing}>
            <div className={style.heading}>Processing</div>
          </div>
        </main>
      );
    }
    case "done": {
      return (
        <main className={style.main}>
          <div className={style.done}>
            <div className={style.heading}>Initialized Game</div>
            <Link
              className={style.link}
              href={`/${rootName}/play?gameId=${phase.metadata.id}`}
            >
              {phase.metadata.name}
            </Link>
          </div>
        </main>
      );
    }
  }
}
