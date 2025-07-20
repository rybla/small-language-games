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
          <li>
            <Link href="/text-adventure-v1">text-adventure-v1</Link>
          </li>
          <li>
            <Link href="/text-adventure-v2">text-adventure-v2</Link>
          </li>
          <li>
            <Link href="/text-to-ui">text-to-ui</Link>
          </li>
          <li>
            <Link href="/test-streaming">test-streaming</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
