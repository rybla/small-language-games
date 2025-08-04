"use server";

import { err, fromNever, Result, stringify } from "@/utility";
import { Inst, InstClient, SpecServer } from "../../library/sva-v1/ontology";
import * as server from "../../library/sva-v1/server";
import * as common from "./common";
import { A, N, name, P, S, V } from "./common";

var inst: Inst<N, S, A> | undefined;

const spec: SpecServer<N, P, S, V, A> = {
  ...common.spec,
  async initializeState(params) {
    return {
      counter: "counter1",
      counter1: 0,
      counter2: 0,
    };
  },
  async generateAction(view, prompt) {
    const action =
      prompt.type === "set counter"
        ? prompt
        : prompt.type === "increment this counter"
          ? { type: "increment counter", counter: view.counter }
          : fromNever(prompt);
    return {
      type: "ok",
      action,
      description: stringify(prompt),
    };
  },
  async interpretAction(inst, state, view, action) {
    switch (action.type) {
      case "increment counter": {
        state[action.counter] += 1;
        return `increment counter ${action.counter}`;
      }
      case "set counter": {
        console.log("set counter", action.counter);
        state.counter = action.counter;
        return `set counter to ${action.counter}`;
      }
    }
  },
  view(state) {
    return {
      counter: state.counter,
      value: state[state.counter],
    };
  },
};

export async function getInst(): Promise<InstClient<V, A> | undefined> {
  if (inst === undefined) return undefined;
  return server.toInstClient(spec, inst);
}

export async function loadInst(id: string): Promise<void> {
  inst = await server.load<N, S, A>(name, id);
}

export async function initialize(params: P["initialization"]): Promise<void> {
  inst = await server.initialize(spec, params);
}

export async function act(
  params: P["action"],
): Promise<Result<{ message: string }, {}>> {
  if (inst === undefined) return err({ message: "inst === unhdefined" });
  const result = await server.runPrompt(spec, inst, params);
  return result;
}

export async function saveInst(name?: string) {
  if (inst === undefined) return;
  if (name) inst.metadata.name = name;
  await server.saveInst(inst);
}

export async function getInstMetadatas() {
  return await server.getInstMetadatas(name);
}
