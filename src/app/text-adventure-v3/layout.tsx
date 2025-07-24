import { name } from "./constant";
import style from "./layout.module.css";
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
          header: style.header,
          separator: style.header_separator,
          branch: style.header_branch,
        }}
        root={{ label: name, href: `/${name}` }}
        branches={[]}
      />
      {input.children}
    </>
  );
}
