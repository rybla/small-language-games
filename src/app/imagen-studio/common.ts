import { SpecCommon, SpecParams } from "@/library/sva-v1/ontology";
import Paths from "@/library/sva-v1/paths";
import { Supertype } from "@/utility";

export const rootName = "imagen-studio" as const;

export type N = typeof name;
export const name = rootName;

export type P = Supertype<
  SpecParams,
  {
    initialization: {
      model: string;
      temperature: number;
    };
    action: { prompt: string };
  }
>;

export type S = {
  model: string;
  temperature: number;
  imageIds: string[];
};

export type V = S;

export type A = {
  imageId?: string;
  prompt_original: string;
  prompt_enhanced: string;
};

export const spec: SpecCommon<N> = {
  name,
};

export const getImageFilepath = (
  paths: Paths,
  instId: string,
  imageId: string,
) => paths.assetFilepath(name, instId, `${imageId}.png`);
