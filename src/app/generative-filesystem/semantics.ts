import { bullets, findMap, fromNever, indent, ticks, trim } from "@/utility";
import path from "path";
import { name } from "./common";
import type {
  XFile,
  XFileId,
  XFileName,
  XPath,
  XState,
  XSystem,
} from "./ontology";
import { randomUUID } from "crypto";

// -----------------------------------------------------------------------------
// XError
// -----------------------------------------------------------------------------

export class XError {
  constructor(public message: string) {}
}

// -----------------------------------------------------------------------------
// functions
// -----------------------------------------------------------------------------

export function getFocus(state: XState): XFile {
  return getXFile(state, state.client.focus);
}

export function showXPath(path: XPath) {
  return path.join("/");
}

export function showXDirectory(
  state: XState,
  dir: XFile & { type: "directory" },
) {
  const kidIds = getKidIds(state, dir.id);
  return trim(`
directory ${ticks(dir.name)}:
  - children: ${kidIds.length === 0 ? "empty" : "\n" + indent(bullets(kidIds.map((kidId) => ticks(getXFile(state, kidId).name))))}
`);
}

export function showXFile(state: XState, file: XFile) {
  if (file.type === "directory") {
    const kidIds = getKidIds(state, file.id);
    return trim(`
file ${ticks(file.name)}:
  - type: "${file.type}"
  - children: ${kidIds.length === 0 ? "empty" : "\n" + indent(bullets(kidIds.map((kidId) => ticks(getXFile(state, kidId).name))))}
`);
  } else if (file.type === "text") {
    return trim(`
file ${ticks(file.name)}:
  - type: "${file.type}"
`);
  } else if (file.type === "image") {
    return trim(`
file ${ticks(file.name)}:
  - type: "${file.type}"
`);
  } else {
    fromNever(file);
  }
}

export function getXFile(state: XState, id: XFileId): XFile {
  const file = state.system.files[id];
  if (file === undefined) throw new XError(`XFile not found: ${id}`);
  return file;
}

export function addXFile(state: XState, file: XFile, parentId: XFileId) {
  state.system.files[file.id] = file;
  state.system.parents[file.id] = parentId;
}

export function deleteXFile(state: XState, id: XFileId) {
  delete state.system.parents[id];
}

export function freshXFileId() {
  return randomUUID() as XFileId;
}

export function getKidIds(state: XState, id: XFileId): XFileId[] {
  return Array.from(
    Object.entries(state.system.parents).flatMap(([kidId, parentId]) =>
      parentId === id ? [kidId as XFileId] : [],
    ),
  );
}

export function getParentId(state: XState, id: XFileId): XFileId | undefined {
  return state.system.parents[id];
}

// -----------------------------------------------------------------------------
// filepaths
// -----------------------------------------------------------------------------

export function getImageContentFilepath(root: string, id: XFileId): string {
  return path.join(root, name, "content", `${id}.png`);
}

export function getTextContentFilepath(root: string, id: XFileId): string {
  return path.join(root, name, "content", `${id}.md`);
}
