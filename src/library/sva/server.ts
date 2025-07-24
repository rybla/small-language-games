import { deepcopy, err, isErr, ok, Result, stringify } from "@/utility";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import path from "path";
import Stream from "stream";
import {
  Inst,
  InstClient,
  InstMetadata,
  SpecParams,
  SpecServer,
  Turn,
  TurnClient,
} from "./ontology";
import Paths from "./paths";

const paths = new Paths("public");

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
  const id = randomUUID();
  return {
    specName: spec.name,
    metadata: {
      id,
      name: id,
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
  await spec.interpretAction(inst, state, action);
  const turn: Turn<S, A> = { state, action, description };
  inst.turns.push(turn);
  inst.state = state;
  return ok({});
}

export function toInstClient<N extends string, P extends SpecParams, S, V, A>(
  spec: SpecServer<N, P, S, V, A>,
  inst: Inst<N, S, A>,
): InstClient<V, A> {
  return {
    metadata: inst.metadata,
    view: spec.view(inst.state),
    turns: inst.turns.map((turn) => toTurnClient(spec, turn)),
  };
}

export function toTurnClient<N extends string, P extends SpecParams, S, V, A>(
  spec: SpecServer<N, P, S, V, A>,
  turn: Turn<S, A>,
): TurnClient<V, A> {
  return {
    view: spec.view(turn.state),
    action: turn.action,
    description: turn.description,
  };
}

// root

export async function getInstIds(specName: string): Promise<string[]> {
  await fs.mkdir(paths.rootDirpath(specName), { recursive: true });
  return (await fs.readdir(paths.rootDirpath(specName))).filter(
    (filename) => !filename.includes("."),
  );
}

export async function getInstMetadatas(
  specName: string,
): Promise<InstMetadata[]> {
  return (
    await Promise.all(
      (await getInstIds(specName)).map((id) => loadInstMetadata(specName, id)),
    )
  ).filter((result) => result !== undefined);
}

// Inst

export async function saveInst<N extends string, P extends SpecParams, S, V, A>(
  inst: Inst<N, S, A>,
): Promise<void> {
  await fs.mkdir(paths.instDirpath(inst.specName, inst.metadata.id), {
    recursive: true,
  });
  await fs.writeFile(
    paths.instFilepath(inst.specName, inst.metadata.id),
    stringify(inst),
    "utf8",
  );
  await fs.writeFile(
    paths.instMetadataFilepath(inst.specName, inst.metadata.id),
    stringify(inst.metadata),
    "utf8",
  );
}

export async function load<N extends string, S, A>(
  specName: string,
  instId: string,
): Promise<Inst<N, S, A> | undefined> {
  try {
    return JSON.parse(
      await fs.readFile(paths.instFilepath(specName, instId), "utf8"),
    );
  } catch {
    return undefined;
  }
}

export async function loadInstMetadata(
  specName: string,
  instId: string,
): Promise<InstMetadata | undefined> {
  try {
    return JSON.parse(
      await fs.readFile(paths.instMetadataFilepath(specName, instId), "utf8"),
    );
  } catch {
    return undefined;
  }
}

// Asset

export async function getAssetFilenames(
  specName: string,
  instId: string,
  ext: string,
): Promise<string[]> {
  return (await fs.readdir(paths.assetDirpath(specName, instId))).filter(
    (filename) => path.extname(filename) === ext,
  );
}

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
  await fs.mkdir(paths.assetDirpath(specName, instId), { recursive: true });
  await fs.writeFile(paths.assetFilepath(specName, instId, filename), content, {
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
    return await fs.readFile(paths.assetFilepath(specName, instId, filename), {
      encoding,
    });
  } catch {
    return undefined;
  }
}
