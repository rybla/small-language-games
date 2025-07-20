"use client";

import { do_, stringify } from "@/utility";
import SimpleClient from "../library/sva/library/simple/SimpleClient";
import { SpecClient } from "../library/sva/ontology";
import * as common from "./common";
import { A, N, P, S, V } from "./common";
import styles from "./page.module.css";
import * as server from "./server";

const spec: SpecClient<N, P, S, V, A> = {
  ...common.spec,
  // components
  PromptInitializationComponent(props) {
    return <div className={styles.PromptInitialization}></div>;
  },
  ViewComponent(props) {
    return (
      <div className={styles.View}>
        <div className={styles.name}>{props.view.counter}</div>
        <div className={styles.value}>{props.view.counter}</div>
      </div>
    );
  },
  PromptActionComponent(props) {
    function makeButton(label: string, p: P["action"]) {
      return (
        <button
          className={styles.button}
          onClick={() =>
            void do_(async () => {
              const result = await server.act(p);
            })
          }
        >
          {label}
        </button>
      );
    }

    return (
      <div className={styles.PromptAction}>
        {makeButton("counter1", {
          type: "set counter",
          counter: "counter1",
        })}
        {makeButton("counter2", {
          type: "set counter",
          counter: "counter1",
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
        <div className={styles.action}>{stringify(props.turn.action)}</div>
        <div className={styles.description}>{props.turn.description}</div>
      </div>
    );
  },
  // callbacks
  async initialize(params) {
    return await server.initialize(params);
  },
  async loadInst(id) {
    await server.loadInst(id);
  },
  async getInst() {
    return await server.getInst();
  },
};

export default function Page() {
  return <SimpleClient spec={spec} />;
}
