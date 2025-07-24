import { rootName } from "./common";
import styles from "./layout.module.css";
import Header from "@/component/Header";

export default function Layout(
  input: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <>
      <Header
        classNames={{
          header: styles.header,
          separator: styles.header_separator,
          branch: styles.header_branch,
        }}
        root={{ label: rootName, href: `/${rootName}` }}
        branches={[]}
      />
      {input.children}
    </>
  );
}
