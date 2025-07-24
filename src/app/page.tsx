import Link from "next/link";
import styles from "./page.module.css";

export default function Page() {
  return (
    <main className={styles.main}>
      <div className={styles.title}>small-language-games</div>
      <div className={styles.links}>
        <ul>
          <div className={styles.sectionTitle}>Games</div>
          <li>
            <Link href="/text-adventure-v1">text-adventure-v1</Link>
          </li>
          <li>
            <Link href="/text-adventure-v2">text-adventure-v2</Link>
          </li>
          <div className={styles.sectionTitle}>Tools</div>
          <li>
            <Link href="/imagen-studio">imagen-studio</Link>
          </li>
          <li>
            <Link href="/text-to-ui">text-to-ui</Link>
          </li>
          <div className={styles.sectionTitle}>Tests</div>
          <li>
            <Link href="/test">test</Link>
          </li>
          <li>
            <Link href="/test-streaming">test-streaming</Link>
          </li>
          <li>
            <Link href="/test-sva-v1">test-sva-v1</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
