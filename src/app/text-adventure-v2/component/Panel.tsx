import { ReactNode } from "react";
import style from "./Panel.module.css";

export default function Panel(props: { children?: ReactNode }) {
  return <div className={style.Panel}>{props.children}</div>;
}
