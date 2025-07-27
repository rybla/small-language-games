"use client";

import Image from "next/image";
import { RoomName } from "../ontology";
import styles from "./RoomCard.module.css";
import { useEffect, useState } from "react";
import { do_, fromNever } from "@/utility";
import * as server from "../server";
import { paths } from "../common_client";
import { A, spec, V } from "../constant";
import path from "path";
import { InstClient } from "@/library/sva/ontology";

type Format = "icon" | "large";

const formatSizes: { [K in Format]: number } = {
  icon: 400,
  large: 400,
};

const ratio_room_to_frame = 0.85;

type State = { type: "loading" } | { type: "loaded"; filename: string };

export default function RoomCard(props: {
  inst: InstClient<V, A>;
  roomName: RoomName;
  format: Format;
}) {
  const [state, set_state] = useState<State>({ type: "loading" });

  const size = formatSizes[props.format];

  useEffect(() => {
    void do_(async () => {
      set_state({ type: "loading" });
      const filename = await server.loadRoomImageFilename(props.roomName);
      set_state({ type: "loaded", filename });
    });
  }, [props.roomName]);

  return (
    <div className={styles.RoomCard}>
      <div className={styles.room_container}>
        {state.type === "loading" ? (
          <video
            className={[styles.room, styles.placeholder].join(" ")}
            src={path.join(
              paths.rootDirpath(spec.name),
              "placeholder_room.mp4",
            )}
            width={Math.floor(size * (4 / 3) * ratio_room_to_frame)}
            height={Math.floor(size * ratio_room_to_frame)}
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        ) : state.type === "loaded" ? (
          <Image
            className={[styles.room].join(" ")}
            alt={props.roomName}
            src={paths.assetFilepath(
              spec.name,
              props.inst.metadata.id,
              state.filename,
            )}
            width={Math.floor(size * (4 / 3) * ratio_room_to_frame)}
            height={Math.floor(size * ratio_room_to_frame)}
          />
        ) : (
          fromNever(state)
        )}
        <Image
          className={styles.frame}
          alt={""}
          src={path.join(paths.rootDirpath(spec.name), "frame_room.png")}
          width={Math.floor(size * (4 / 3))}
          height={Math.floor(size)}
        />
      </div>
      <div className={styles.name}>{props.roomName}</div>
    </div>
  );
}
