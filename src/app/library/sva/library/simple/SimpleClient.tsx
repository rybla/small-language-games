import { do_, fromNever } from "@/utility";
import { useEffect, useRef, useState } from "react";
import {
  InstMetadata,
  type InstClient,
  type SpecClient,
  type SpecParams,
  type Turn,
} from "../../ontology";
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
  const [instIds, set_instIds] = useState<string[]>([]);
  const [logs, set_logs] = useState<string[]>([]);

  async function update_instIds() {
    set_instIds(await props.spec.getInstIds());
  }

  useEffect(
    () => {
      void update_instIds();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.spec],
  );

  function New({
    state,
    set_state,
    set_logs,
  }: {
    state: State<S, V, A> & { type: "New" };
    set_state: (state: State<S, V, A>) => void;
    set_logs: (k: (logs: string[]) => string[]) => void;
  }) {
    const Prompt = props.spec.PromptInitializationComponent;
    return (
      <div className={styles.New}>
        <Prompt
          submit={async (params: P["initialization"]) => {
            set_state({ type: "Initializing" });
            await props.spec.initialize(params);
            const inst = await props.spec.getInst();
            if (inst === undefined) {
              set_logs((logs) => [
                ...logs,
                "[New.Prompt.submit] await spec.getInst() ==> undefined",
              ]);
              return;
            }
            set_state({ type: "Loaded", inst });
          }}
        />
      </div>
    );
  }

  function Initializing<N extends string, P extends SpecParams, S, V, A>({
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
    const [inst, set_inst] = useState<InstClient<S, V, A>>(state.inst);
    const turnsBottom_ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      turnsBottom_ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, [inst]);

    const View = props.spec.ViewComponent;
    const PromptAction = props.spec.PromptActionComponent;
    const Turn = props.spec.TurnComponent;
    return (
      <div className={styles.Loaded}>
        <div className={styles.sidebar}>
          <div className={styles.controls}>
            <button
              className={styles.button}
              onClick={() =>
                void do_(async () => {
                  await props.spec.saveInst();
                  await update_instIds();
                  set_state({ type: "New" });
                })
              }
            >
              Save
            </button>
          </div>
          <div className={styles.turns}>
            {inst.turns.map((turn, i) => (
              <Turn turn={turn} key={i} />
            ))}
            <div className={styles.turnsBottom} ref={turnsBottom_ref} />
          </div>
          <PromptAction view={inst.view} set_inst={(inst) => set_inst(inst)} />
        </div>
        <View view={inst.view} />
      </div>
    );
  }

  return (
    <div className={styles.SimpleClient}>
      <div className={styles.controls}>
        <div className={styles.sectionTitle}>Load</div>
        {instIds.map((id, i) => (
          <button
            className={styles.button}
            key={i}
            onClick={() =>
              void do_(async () => {
                set_state({ type: "Loading", id });
                await props.spec.loadInst(id);
                const inst = await props.spec.getInst();
                if (inst === undefined) {
                  set_state({ type: "New" });
                  set_logs((logs) => [
                    ...logs,
                    `[load] Failed to load instance: "${id}"`,
                  ]);
                  return;
                }
                set_state({ type: "Loaded", inst });
              })
            }
          >
            {id}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {state.type === "New" ? (
          <New state={state} set_state={set_state} set_logs={set_logs} />
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
