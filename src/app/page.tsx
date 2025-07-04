"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Page() {
  return (
    <>
      <div className={styles["links"]}>
        <ul>
          <li>
            <Link href="/test">test</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
