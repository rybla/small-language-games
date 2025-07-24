"use server";

import { Inst, InstClient, SpecServer } from "@/library/sva/ontology";
import { N, S, A, V, P, name } from "./constant";
import * as constant from "./constant";
import * as server from "@/library/sva/server";
import { err, Result, TODO } from "@/utility";

var inst: Inst<N, S, A> | undefined;

const spec: SpecServer<N, P, S, V, A> = {
  ...constant.spec,
  async initializeState(params) {
    return TODO();
  },
  async generateAction(params) {
    return TODO();
  },
  async interpretAction(inst, state, action) {
    return TODO();
  },
  view(state) {
    return TODO();
  },
};

export async function getInst(): Promise<InstClient<V, A> | undefined> {
  if (inst === undefined) return undefined;
  return server.toInstClient(spec, inst);
}

export async function loadInst(id: string): Promise<void> {
  inst = await server.load<N, S, A>(name, id);
}

export async function initializeInst(
  params: P["initialization"],
): Promise<void> {
  inst = await server.initialize(spec, params);
}

export async function actInst(
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
