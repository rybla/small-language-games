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
    specName: spec.name,
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

export const rootDirpath = (specName: string) => path.join("public", specName);

export async function getInstIds(specName: string): Promise<string[]> {
  await fs.mkdir(rootDirpath(specName), { recursive: true });
  return (await fs.readdir(rootDirpath(specName))).filter(
    (filename) => !filename.includes("."),
  );
}

// Inst

export const instDirpath = (specName: string, instId: string) =>
  path.join(rootDirpath(specName), instId);

export const instFilepath = (specName: string, instId: string) =>
  path.join(instDirpath(specName, instId), "inst.json");

export async function saveInst<N extends string, P extends SpecParams, S, V, A>(
  inst: Inst<N, S, A>,
): Promise<void> {
  await fs.mkdir(instDirpath(inst.specName, inst.metadata.id), {
    recursive: true,
  });
  await fs.writeFile(
    instFilepath(inst.specName, inst.metadata.id),
    stringify(inst),
    "utf8",
  );
}

export async function loadInst<N extends string, S, A>(
  specName: string,
  instId: string,
): Promise<Inst<N, S, A> | undefined> {
  try {
    return JSON.parse(
      await fs.readFile(instFilepath(specName, instId), "utf8"),
    );
  } catch {
    return undefined;
  }
}

// Asset

export const assetDirpath = (specName: string, instId: string): string =>
  path.join(instDirpath(specName, instId), "asset");

export async function getAssetFilenames(
  specName: string,
  instId: string,
  ext: string,
): Promise<string[]> {
  return (await fs.readdir(assetDirpath(specName, instId))).filter(
    (filename) => path.extname(filename) === ext,
  );
}

export const assetFilepath = (
  specName: string,
  instId: string,
  filename: string,
) => path.join(assetDirpath(specName, instId), filename);

export async function saveAsset(
  specName: string,
  instId: string,
  filename: string,
  content:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
  encoding: BufferEncoding,
): Promise<void> {
  await fs.mkdir(assetDirpath(specName, instId), { recursive: true });
  await fs.writeFile(assetFilepath(specName, instId, filename), content, {
    encoding,
  });
}

export async function loadAsset(
  specName: string,
  instId: string,
  filename: string,
  encoding: BufferEncoding,
): Promise<string | undefined> {
  try {
    return await fs.readFile(assetFilepath(specName, instId, filename), {
      encoding,
    });
  } catch {
    return undefined;
  }
}
