"use client";

import Image from "next/image";
import { ItemName } from "../ontology";
import styles from "./ItemCard.module.css";
import { useEffect, useState } from "react";
import { do_, fromNever } from "@/utility";
import * as server from "../server";
import { paths } from "../common_client";
import { A, spec, V } from "../constant";
import path from "path";
import { InstClient } from "@/library/sva/ontology";

type Format = "icon" | "large";

const formatSizes: { [K in Format]: number } = {
  icon: 200,
  large: 512,
};

const ratio_item_to_frame = 0.75;

type State = { type: "loading" } | { type: "loaded"; filename: string };

export default function ItemCard(props: {
  inst: InstClient<V, A>;
  itemName: ItemName;
  format: Format;
}) {
  const [state, set_state] = useState<State>({ type: "loading" });

  const size = formatSizes[props.format];

  useEffect(() => {
    void do_(async () => {
      const filename = await server.loadItemImageFilename(props.itemName);
      set_state({ type: "loaded", filename });
    });
  }, [props.itemName]);

  return (
    <div className={styles.ItemCard}>
      <div className={styles.item_container}>
        {state.type === "loading" ? (
          <video
            className={[styles.item, styles.placeholder].join(" ")}
            src={path.join(
              paths.rootDirpath(spec.name),
              "placeholder_item.mp4",
            )}
            width={size * ratio_item_to_frame}
            height={size * ratio_item_to_frame}
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        ) : state.type === "loaded" ? (
          <Image
            className={[styles.item].join(" ")}
            alt={props.itemName}
            src={paths.assetFilepath(
              spec.name,
              props.inst.metadata.id,
              state.filename,
            )}
            width={size * ratio_item_to_frame}
            height={size * ratio_item_to_frame}
          />
        ) : (
          fromNever(state)
        )}
        <Image
          className={styles.frame}
          alt={""}
          src={path.join(paths.rootDirpath(spec.name), "frame_item.png")}
          width={size}
          height={size}
        />
      </div>
      <div className={styles.name}>{props.itemName}</div>
    </div>
  );
}
