import "./Generating.css";

export default function Generating(props: { text: string }) {
  return (
    <>
      <span className="placeholder-container">
        <span className="placeholder-text">{props.text}</span>
        <span className="ellipsis-container">
          <span
            className="dot bouncing-dot"
            style={{ animationDelay: "-0.32s" }}
          ></span>
          <span
            className="dot bouncing-dot"
            style={{ animationDelay: "-0.16s" }}
          ></span>
          <span className="dot bouncing-dot"></span>
        </span>
      </span>
    </>
  );
}
