import { useEffect, useState } from "react";
import showdown from "showdown";
import "./Markdown.css";

const converter = new showdown.Converter();

export default function Markdown(props: { content: string }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    setHtml(converter.makeHtml(props.content));
  }, [props.content]);

  return (
    <div className="Markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
