"use server";

import { err, fromDataUrlToBuffer, ok, Result } from "@/utility";
import { Inst, InstClient, SpecServer } from "../../library/sva-v1/ontology";
import * as server from "../../library/sva-v1/server";
import * as common from "./common";
import { A, N, name, P, S, V } from "./common";
import * as flow from "./flow";
import { randomUUID } from "crypto";
import Paths from "@/library/sva-v1/paths";
import { model } from "@/backend/ai";

const paths = new Paths("public");

var inst: Inst<N, S, A> | undefined;

const spec: SpecServer<N, P, S, V, A> = {
  ...common.spec,
  async initializeState(instMeta, params) {
    return {
      model: params.model,
      temperature: params.temperature,
      imageIds: [],
    };
  },
  async generateAction(view, prompt) {
    return ok({
      action: {
        prompt_original: prompt.prompt,
        prompt_enhanced: prompt.prompt,
      },
      description: `prompt: "${prompt.prompt}"`,
    });
  },
  async interpretAction(inst, state, view, action) {
    const { dataUrl } = await flow.GenerateImage({
      model: state.model,
      temperature: state.temperature,
      prompt: action.prompt_enhanced,
    });
    const imageId = randomUUID();
    const imageFilename = `${imageId}.png`;
    server.saveAsset(
      spec.name,
      inst.metadata.id,
      imageFilename,
      fromDataUrlToBuffer(dataUrl),
      "base64",
    );
    state.imageIds.push(imageId);
    return `generated image "${imageFilename}"`;
  },
  view(state) {
    return state;
  },
};

export async function get(): Promise<InstClient<V, A> | undefined> {
  if (inst === undefined) return undefined;
  return server.toInstClient(spec, inst);
}

export async function load(id: string): Promise<void> {
  inst = await server.load<N, S, A>(name, id);
}

export async function initialize(params: P["initialization"]): Promise<void> {
  inst = await server.initialize(spec, params);
}

export async function act(
  params: P["action"],
): Promise<Result<{ message: string }, {}>> {
  if (inst === undefined) return err({ message: "inst === undefined" });
  return await server.runPrompt(spec, inst, params);
}

export async function save(name?: string) {
  if (inst === undefined) return;
  if (name !== undefined) inst.metadata.name = name;
  await server.saveInst(inst);
}

export async function getInstMetadatas() {
  return await server.getInstMetadatas(name);
}

export async function getModels(): Promise<string[]> {
  return [model.image_cheap.name, model.image_power.name];
}
