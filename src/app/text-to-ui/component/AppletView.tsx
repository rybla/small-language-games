"use client";

import { findMap, spawnAsync } from "@/utility";
import Image from "next/image";
import { ReactNode, useState } from "react";
import {
  type Applet,
  type AppletState,
  type Element,
  type GroupElement,
  type PlaceholderElement,
  TextElement,
  type Value,
} from "../ontology";
import Paths from "../paths";
import * as server from "../server";
import styles from "./AppletView.module.css";

const paths = new Paths("/");

type ConsoleMessage = {
  label: string;
  content: string;
};

export default function AppletView(props: {
  applet: Applet;
  mode?: string;
  fillPlaceholder: (placeholder: PlaceholderElement) => Promise<void>;
}): ReactNode {
  const [consoleMessages, set_consoleMessages] = useState<ConsoleMessage[]>([]);
  const [state, set_state] = useState<AppletState>(props.applet.initialState);

  async function interpretAction(effect: string) {
    set_consoleMessages((consoleMessages) => [
      ...consoleMessages,
      { label: "interpretAction", content: effect },
    ]);
    set_state(await server.interpretEffect(props.applet, state, effect));
  }

  function renderValue(value: Value | undefined): ReactNode {
    if (value === undefined) {
      return <div className={styles.value}>Undefined</div>;
    } else {
      switch (value.type) {
        case "string":
          return (
            <div className={[styles.value, styles.string].join(" ")}>
              {value.value}
            </div>
          );
        case "number":
          return (
            <div className={[styles.value, styles.number].join(" ")}>
              {value.value}
            </div>
          );
        case "boolean":
          return (
            <div className={[styles.value, styles.boolean].join(" ")}>
              {value.value ? "True" : "False"}
            </div>
          );
        default:
          value satisfies never;
      }
    }
  }

  function fromLayoutToClassName(layout: GroupElement["layout"]) {
    switch (layout) {
      case "column":
        return styles.column;
      case "row":
        return styles.row;
      default:
        layout satisfies never;
    }
  }

  function fromTextStyleToClassName(style: TextElement["style"]) {
    switch (style) {
      case "heading":
        return styles.heading;
      case "normal":
        return styles.normal;
    }
  }

  function renderElement(element: Element, key?: string): ReactNode {
    switch (element.type) {
      case "text":
        return (
          <div
            className={[
              styles.text,
              fromTextStyleToClassName(element.style),
            ].join(" ")}
            key={key}
          >
            {element.text}
          </div>
        );
      case "group": {
        return (
          <div
            className={[
              styles.group,
              fromLayoutToClassName(element.layout),
              element.scrollable ? styles.scrollable : "",
            ].join(" ")}
            key={key}
          >
            {element.kids.map((kid, i) => renderElement(kid, `${i}`))}
          </div>
        );
      }
      case "image": {
        return (
          <div className={styles.image} key={key}>
            <Image
              src={paths.appletImageFilepath(
                props.applet.metadata.id,
                element.slug,
              )}
              width={512}
              height={512}
              alt={element.description}
            ></Image>
          </div>
        );
      }
      case "variable": {
        return (
          <div className={styles.variable} key={key}>
            {findMap(state, (x) =>
              x.key === element.key ? renderValue(x.value) : undefined,
            ) ?? <div className={styles.unknown_variable}>{element.key}</div>}
          </div>
        );
      }
      case "button": {
        return (
          <div className={styles.button} key={key}>
            <button
              onClick={() =>
                spawnAsync(async () => interpretAction(element.clickEffect))
              }
            >
              {element.label}
            </button>
          </div>
        );
      }
      case "placeholder": {
        return (
          <div
            className={styles.placeholder}
            key={key}
            onClick={() =>
              spawnAsync(async () => await props.fillPlaceholder(element))
            }
          >
            {element.description}
          </div>
        );
      }
      default:
        element satisfies never;
    }
  }

  function renderBody() {
    return (
      <div className={styles.body}>{renderElement(props.applet.body)}</div>
    );
  }

  function renderConsole() {
    return (
      <div className={styles.console}>
        {consoleMessages.map((consoleMessage, i) => (
          <div className={styles.message} key={i}>
            <div className={styles.label}>{consoleMessage.label}</div>
            <div className={styles.content}>{consoleMessage.content}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.applet}>
      <div className={styles.name}>{props.applet.design.name}</div>
      <div className={styles.columns}>
        {renderBody()}
        {renderConsole()}
      </div>
    </div>
  );
}
