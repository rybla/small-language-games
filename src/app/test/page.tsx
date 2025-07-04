"use client";

import { useRef, useState } from "react";
import Test from "@/backend/ai/flow/Test";
import style from "./page.module.css";

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [output, set_output] = useState<string>("");

  return (
    <div className={style["panel"]}>
      <input ref={inputRef} placeholder="prompt" className={style["input"]} />
      <button
        className={style["submit"]}
        onClick={async () => {
          if (inputRef.current === null) return;
          const { message: output } = await Test({
            message: inputRef.current.value,
          });
          set_output(output);
        }}
      >
        submit
      </button>
      <div className={style["output"]}>{output}</div>
    </div>
  );
}
