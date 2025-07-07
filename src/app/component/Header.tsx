import { app_name } from "@/context";
import style from "./Header.module.css";
import Link from "next/link";
import { unwords } from "@/utility";

export default function Header() {
  return (
    <header className={style["header"]}>
      <div className={style["root"]}>
        <Link href="/">{app_name}</Link>
      </div>
      <div className={unwords(style["separator"], style["separator-1"])}>/</div>
      <div className={style["branch"]}>
        <Link href="/register">register</Link>
      </div>
      <div className={unwords(style["separator"], style["separator-2"])}>
        {"∨"}
      </div>
      <div className={style["branch"]}>
        <Link href="/login">login</Link>
      </div>
      <div className={unwords(style["separator"], style["separator-2"])}>
        {"∨"}
      </div>
      <div className={style["branch"]}>
        <Link href="/about">about</Link>
      </div>
    </header>
  );
}
