"use client";

import { useEffect, useState } from "react";
import type { GameName } from "./ontology";
import { getSavedGameNames } from "./server";
import Link from "next/link";
import { rootName } from "./common";

export default function Page() {
  const [savedGameNames, set_savedGameNames] = useState<GameName[]>([]);

  async function update_savedGameNames() {
    set_savedGameNames(await getSavedGameNames());
  }

  useEffect(() => {
    update_savedGameNames();
  }, []);

  return (
    <div>
      <div>save games:</div>
      <ul>
        {savedGameNames.map((gameName, i) => (
          <li key={i}>
            <Link
              href={`${rootName}/play?gameName=${encodeURIComponent(gameName)}`}
            >
              {gameName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
