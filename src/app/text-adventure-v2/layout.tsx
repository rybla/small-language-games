import { rootName } from "./common";
import style from "./layout.module.css";
import Header from "@/app/component/Header";

export default function Layout(
  input: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <>
      <Header
        className={style.header}
        root={{ label: rootName, href: `/${rootName}` }}
        branches={[{ label: "new", href: `/${rootName}/new` }]}
      />
      {input.children}
    </>
  );
}
