import Head from "next/head";
import "./global.css";
import Header from "../component/Header";
import { app_name } from "@/context";
import styles from "./layout.module.css";

export default function RootLayout(
  input: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <html lang="en" className="dark">
      <Head>
        <title>{app_name}</title>
      </Head>
      <body className="vsc-initialized">
        <Header
          classNames={{
            header: styles.header,
            separator: styles.header_separator,
            branch: styles.header_branch,
          }}
          root={{ label: app_name, href: "/" }}
          branches={[
            {
              label: "register",
              href: "/register",
            },
            {
              label: "login",
              href: "/login",
            },
            {
              label: "about",
              href: "/about",
            },
          ]}
        />
        {input.children}
      </body>
    </html>
  );
}
