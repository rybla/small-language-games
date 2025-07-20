import { deepcopy, err, isErr, ok, Result, stringify } from "@/utility";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import path from "path";
import Stream from "stream";
import { Inst, InstClient, SpecParams, SpecServer, Turn } from "./ontology";

export async function initialize<
  N extends string,
  P extends SpecParams,
  S,
  V,
  A,
>(
  spec: SpecServer<N, P, S, V, A>,
  params: P["initialization"],
): Promise<Inst<N, S, A>> {
  const initialState = await spec.initializeState(params);
  return {
    name: spec.name,
    metadata: {
      id: randomUUID(),
      creationDate: Date.now(),
    },
    initialState,
    state: initialState,
    turns: [],
  };
}

export async function runPrompt<
  N extends string,
  P extends SpecParams,
  S,
  V,
  A,
>(
  spec: SpecServer<N, P, S, V, A>,
  inst: Inst<N, S, A>,
  params: P["action"],
): Promise<Result<{ message: string }, {}>> {
  const view = spec.view(inst.state);
  const result = await spec.generateAction(view, params);
  if (isErr(result)) {
    return err({
      message: `while generating action: ${result.message}`,
    });
  }
  const { action, description } = result;
  const state = deepcopy(inst.state);
  await spec.interpretAction(state, action);
  const turn: Turn<S, A> = { state, action, description };
  inst.turns.push(turn);
  inst.state = state;
  return ok({});
}

export function toInstClient<N extends string, P extends SpecParams, S, V, A>(
  spec: SpecServer<N, P, S, V, A>,
  inst: Inst<N, S, A>,
): InstClient<S, V, A> {
  return {
    view: spec.view(inst.state),
    turns: inst.turns,
  };
}

// root

export const rootDirpath = (name: string) => path.join("public", name);

// Inst

export const instDirpath = (name: string, id: string) =>
  path.join(rootDirpath(name), id);

export const instFilepath = (name: string, id: string) =>
  path.join(instDirpath(name, id), "inst.json");

export async function saveInst<N extends string, P extends SpecParams, S, V, A>(
  inst: Inst<N, S, A>,
): Promise<void> {
  await fs.mkdir(rootDirpath(inst.name), { recursive: true });
  await fs.writeFile(
    instFilepath(inst.name, inst.metadata.id),
    stringify(inst),
  );
}

export async function loadInst<N extends string, S, A>(
  name: string,
  id: string,
): Promise<Inst<N, S, A> | undefined> {
  try {
    return JSON.parse(await fs.readFile(instFilepath(name, id), "utf8"));
  } catch {
    return undefined;
  }
}

// Asset

export const assetDirpath = (name: string, id: string): string =>
  path.join(instDirpath(name, id), "asset");

export const assetFilepath = (name: string, id: string, filename: string) =>
  path.join(assetDirpath(name, id), filename);

export async function saveAsset(
  name: string,
  id: string,
  filename: string,
  content:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
  encoding: BufferEncoding,
): Promise<void> {
  await fs.mkdir(assetDirpath(name, id), { recursive: true });
  await fs.writeFile(assetFilepath(name, id, filename), content, {
    encoding,
  });
}

export async function loadAsset(
  name: string,
  id: string,
  filename: string,
  encoding: BufferEncoding,
): Promise<string | undefined> {
  try {
    return await fs.readFile(assetFilepath(name, id, filename), {
      encoding,
    });
  } catch {
    return undefined;
  }
}
