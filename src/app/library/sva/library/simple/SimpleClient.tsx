import { fromNever } from "@/utility";
import { useState } from "react";
import type { InstClient, SpecClient, SpecParams, Turn } from "../../ontology";
import styles from "./SimpleClient.module.css";

type State<S, V, A> =
  | { type: "New" }
  | { type: "Initializing" }
  | { type: "Loading"; id: string }
  | { type: "Loaded"; inst: InstClient<S, V, A> };

export default function SimpleClient<
  N extends string,
  P extends SpecParams,
  S,
  V,
  A,
>(props: { spec: SpecClient<N, P, S, V, A> }) {
  const [state, set_state] = useState<State<S, V, A>>({ type: "New" });
  const [logs, set_logs] = useState<string[]>([]);

  function New({ state }: { state: State<S, V, A> & { type: "New" } }) {
    const Prompt = props.spec.PromptInitializationComponent;
    return (
      <div className={styles.New}>
        <Prompt
          submit={async (params: P["initialization"]) => {
            set_state({ type: "Initializing" });
            await props.spec.initialize(params);
            const inst = await props.spec.getInst();
            if (inst === undefined) {
              logs.push(
                "[New.Prompt.submit] await props.spec.getInst() ==> undefined",
              );
              return;
            }
            set_state({ type: "Loaded", inst });
          }}
        />
      </div>
    );
  }

  function Initializing({
    state,
  }: {
    state: State<S, V, A> & { type: "Initializing" };
  }) {
    return <div className={styles.Initializing}>{"Initializing..."}</div>;
  }

  function Loading({ state }: { state: State<S, V, A> & { type: "Loading" } }) {
    return <div className={styles.Loading}>{"Loading..."}</div>;
  }

  function Loaded({ state }: { state: State<S, V, A> & { type: "Loaded" } }) {
    const View = props.spec.ViewComponent;
    const PromptAction = props.spec.PromptActionComponent;
    const Turn = props.spec.TurnComponent;
    return (
      <div className={styles.Loaded}>
        <View view={state.inst.view} />
        <div className={styles.column}>
          <PromptAction
            view={state.inst.view}
            set_inst={(inst) => set_state((state) => ({ ...state, inst }))}
          />
          <div className={styles.turns}>
            {state.inst.turns.map((turn, i) => (
              <div key={i}>
                <Turn turn={turn} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.SimpleClient}>
      <div className={styles.content}>
        {state.type === "New" ? (
          <New state={state} />
        ) : state.type === "Initializing" ? (
          <Initializing state={state} />
        ) : state.type === "Loading" ? (
          <Loading state={state} />
        ) : state.type === "Loaded" ? (
          <Loaded state={state} />
        ) : (
          fromNever(state)
        )}
      </div>
      <div className={styles.logs}>
        {logs.map((log, index) => (
          <div className={styles.log} key={index}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
