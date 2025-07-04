import { app_name } from "@/context";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles["footer"]}>
      <div className={styles["app-name"]}>{app_name}</div>
    </footer>
  );
}
