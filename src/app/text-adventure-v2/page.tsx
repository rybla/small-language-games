"use server";

import Link from "next/link";
import { rootName } from "./common";
import Panel from "./component/Panel";
import style from "./page.module.css";
import { getSavedGameMetadatas } from "./server";

export default async function Page() {
  const savedGameMetadatas = await getSavedGameMetadatas();

  return (
    <main className={style.main}>
      <Panel>
        <div>load a game:</div>
        <ul>
          {savedGameMetadatas.map((metadata, i) => (
            <li key={i}>
              <Link href={`${rootName}/play?gameId=${metadata.id}`}>
                {metadata.name}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
