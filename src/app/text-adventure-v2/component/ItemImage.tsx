// import type { GameId, ItemName } from "../ontology";
// import style from "./ItemImage.module.css";
// import { getItemImage } from "../server";

// export default async function ItemImage(props: {
//   gameId: GameId;
//   name: ItemName;
// }) {
//   const blob: Blob = await getItemImage(props.gameId, props.name);
//   const url = URL.createObjectURL(blob);

//   return (
//     <div className={style.ItemImage}>
//       {/* <Image alt={props.name} src={url} width={100} height={100} /> */}
//       <img src={url} />
//     </div>
//   );
// }

import type { GameId, ItemName } from "../ontology";
import style from "./ItemImage.module.css";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ItemImage(props: { gameId: GameId; name: ItemName }) {
  return <div className={style.ItemImage}>TODO:ItemImage</div>;
}
