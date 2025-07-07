import style from "./Header.module.css";
import Link from "next/link";
import { intercalateWithIndex, unwords } from "@/utility";

export default function Header(props: {
  className?: string;
  root: { label: string; href: string };
  branches: { label: string; href: string }[];
}) {
  return (
    <header className={unwords(style.header, props.className ?? "")}>
      <div className={style.root}>
        <Link href={props.root.href}>{props.root.label}</Link>
      </div>
      <div className={unwords(style.separator, style.separator)}>/</div>
      {intercalateWithIndex(
        (i) => (
          <div
            className={unwords(style.separator, style.separator)}
            key={`sep-${i}`}
          >
            {"∨"}
          </div>
        ),
        ...props.branches.map((branch, i) => (
          <div className={style.branch} key={`branch-${i}`}>
            <Link href={branch.href}>{branch.label}</Link>
          </div>
        )),
      )}
    </header>
  );
}

/*
<div className={style.branch}>
  <Link href="/register">register</Link>
</div>
<div className={unwords(style.separator, style.separator"])}>
  {"∨"}
</div>
<div className={style.branch}>
  <Link href="/login">login</Link>
</div>
<div className={unwords(style.separator, style.separator"])}>
  {"∨"}
</div>
<div className={style.branch}>
  <Link href="/about">about</Link>
</div>
*/
