import { generate } from "@/common_frontend";
import { useState } from "react";

export default function App(props: {}) {
  const [output, set_output] = useState("");

  const test1 = async () => {
    const res = await generate({
      prompt: "What is 1 + 2?",
    });
    set_output(res.message?.content[0].text || "{{empty}}");
  };

  return (
    <div>
      <h1>DatingSimV1</h1>
      <button onClick={test1}>test1</button>
      <div>{output}</div>
    </div>
  );
}
