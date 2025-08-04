"use client";

import { do_, isErr, stringify } from "@/utility";
import SimpleClient from "@/library/sva-v1/library/simple/SimpleClient";
import { SpecClient } from "@/library/sva-v1/ontology";
import * as common from "./common";
import { A, N, P, S, V } from "./common";
import styles from "./page.module.css";
import * as server from "./server";

const spec: SpecClient<N, P, S, V, A> = {
  ...common.spec,
  // components
  PromptInitializationComponent(props) {
    return (
      <div className={styles.PromptInitialization}>
        <button className={styles.button} onClick={() => void props.submit({})}>
          start
        </button>
      </div>
    );
  },
  ViewComponent(props) {
    return (
      <div className={styles.View}>
        <div className={styles.name}>{props.view.counter}</div>
        <div className={styles.value}>{props.view.value}</div>
      </div>
    );
  },
  PromptActionComponent(props) {
    function makeButton(label: string, p: P["action"]) {
      return (
        <button className={styles.button} onClick={() => void props.submit(p)}>
          {label}
        </button>
      );
    }

    return (
      <div className={styles.PromptAction}>
        {makeButton("view counter 1", {
          type: "set counter",
          counter: "counter1",
        })}
        {makeButton("view counter 2", {
          type: "set counter",
          counter: "counter2",
        })}
        {makeButton("increment", {
          type: "increment this counter",
        })}
      </div>
    );
  },
  TurnComponent(props) {
    return (
      <div className={styles.Turn}>
        <div className={styles.description}>{props.turn.description}</div>
      </div>
    );
  },
  // callbacks
  async initialize(params) {
    return await server.initialize(params);
  },
  async loadInst(id) {
    return await server.loadInst(id);
  },
  async getInst() {
    return await server.getInst();
  },
  async saveInst(name) {
    return await server.saveInst(name);
  },
  async getInstMetadatas() {
    return await server.getInstMetadatas();
  },
};

export default function Page() {
  return <SimpleClient spec={spec} />;
}
