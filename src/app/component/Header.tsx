import { app_name } from "@/context";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles["header"]}>
      <div className={styles["app-name"]}>{app_name}</div>
    </header>
  );
}
