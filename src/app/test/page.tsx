"use client";

import { useRef, useState } from "react";
import Test from "@/backend/ai/Test";
import style from "./page.module.css";
import { spawnAsync } from "@/utility";

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [output, set_output] = useState<string>("");

  return (
    <main className={style["main"]}>
      <input ref={inputRef} placeholder="prompt" className={style["input"]} />
      <button
        className={style["submit"]}
        onClick={() =>
          spawnAsync(async () => {
            if (inputRef.current === null) return;
            const { message: output } = await Test({
              message: inputRef.current.value,
            });
            set_output(output);
          })
        }
      >
        submit
      </button>
      <div className={style["output"]}>{output}</div>
    </main>
  );
}
