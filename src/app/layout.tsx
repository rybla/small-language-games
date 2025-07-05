import Head from "next/head";
import "./global.css";
import Header from "./component/Header";
import { app_name } from "@/context";

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
        <Header />
        <main>{input.children}</main>
      </body>
    </html>
  );
}
