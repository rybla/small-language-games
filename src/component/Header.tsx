import style from "./Header.module.css";
import Link from "next/link";
import { intercalateWithIndex, unwords } from "@/utility";

export default function Header(props: {
  classNames: {
    header: string;
    separator: string;
    branch: string;
  };
  root: { label: string; href: string };
  branches: { label: string; href: string }[];
}) {
  return (
    <header className={unwords(style.header, props.classNames.header)}>
      <div className={style.root}>
        <Link href={props.root.href}>{props.root.label}</Link>
      </div>
      <div className={unwords(style.separator, props.classNames.separator)}>
        /
      </div>
      {intercalateWithIndex(
        (i) => (
          <div
            className={unwords(style.separator, props.classNames.separator)}
            key={`sep-${i}`}
          >
            {"•"}
          </div>
        ),
        ...props.branches.map((branch, i) => (
          <div
            className={unwords(style.branch, props.classNames.branch)}
            key={`branch-${i}`}
          >
            <Link href={branch.href}>{branch.label}</Link>
          </div>
        )),
      )}
    </header>
  );
}
