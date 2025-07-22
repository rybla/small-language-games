import { Result } from "@/utility";
import { z } from "genkit";
import { ReactNode } from "react";

// -----------------------------------------------------------------------------
// Spec
// -----------------------------------------------------------------------------

export type SpecCommon<N extends string> = {
  name: N;
};

export type SpecParams = {
  initialization: unknown;
  action: unknown;
};

export type SpecServer<N extends string, P extends SpecParams, S, V, A> = {
  initializeState: (SpecParams: P["initialization"]) => Promise<S>;
  view: (state: S) => V;
  generateAction: (
    view: V,
    SpecParams: P["action"],
  ) => Promise<Result<{ message: string }, { action: A; description: string }>>;
  interpretAction: (state: S, action: A) => Promise<void>;
} & SpecCommon<N>;

export type SpecClient<N extends string, P extends SpecParams, S, V, A> = {
  // components
  PromptInitializationComponent: (props: {
    submit: (params: P["initialization"]) => Promise<void>;
  }) => ReactNode;
  ViewComponent: (props: { view: V }) => ReactNode;
  PromptActionComponent: (props: {
    view: V;
    update: () => Promise<void>;
  }) => ReactNode;
  TurnComponent: (props: { turn: Omit<Turn<S, A>, "state"> }) => ReactNode;
  // callbacks
  initialize: (params: P["initialization"]) => Promise<void>;
  loadInst: (id: string) => Promise<void>;
  saveInst: (name?: string) => Promise<void>;
  getInstMetadatas: () => Promise<InstMetadata[]>;
  getInst: () => Promise<InstClient<S, V, A> | undefined>;
} & SpecCommon<N>;

// -----------------------------------------------------------------------------
// Inst
// -----------------------------------------------------------------------------

export type Inst<N extends string, S, A> = {
  specName: N;
  metadata: InstMetadata;
  initialState: S;
  state: S;
  turns: Turn<S, A>[];
};

export type InstMetadata = {
  id: string;
  name: string;
  creationDate: number;
};

export type Turn<S, A> = {
  state: S;
  action: A;
  description: string;
};

export type InstClient<S, V, A> = {
  metadata: InstMetadata;
  view: V;
  turns: Turn<S, A>[];
};
