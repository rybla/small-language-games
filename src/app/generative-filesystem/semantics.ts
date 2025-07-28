import { bullets, findMap, fromNever, indent, trim } from "@/utility";
import path from "path";
import { name } from "./common";
import type { XFile, XFileId, XPath, XState, XSystem } from "./ontology";
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
  return getXFileAt(state.system, state.client.path);
}

export function showXPath(path: XPath) {
  return path.join("/");
}

export function showXFile(system: XSystem, file: XFile) {
  if (file.type === "directory") {
    return trim(`
file \`${file.name}\`:
  - type: ${file.type}
  - children: ${file.kidIds.length === 0 ? "empty" : "\n" + indent(bullets(file.kidIds.map((kidId) => getXFile(system, kidId).name)))}
`);
  } else if (file.type === "text") {
    return trim(`
file \`${file.name}\`:
  - type: ${file.type}
`);
  } else if (file.type === "image") {
    return trim(`
file \`${file.name}\`:
  - type: ${file.type}
`);
  } else {
    fromNever(file);
  }
}

export function getXFile(system: XSystem, id: XFileId): XFile {
  const file = system.files[id];
  if (file === undefined) throw new XError(`XFile not found: ${id}`);
  return file;
}

export function getXFileAt(system: XSystem, path: XPath): XFile {
  let curr: XFile = system.root;
  const pathCurr: XPath = [];
  for (const step of path) {
    if (!(curr.type === "directory"))
      throw new XError(
        `When looking for XFile at path \`${showXPath(path)}\`: XFile at \`${showXPath(pathCurr)}\` is not an XDirectory`,
      );
    pathCurr.push(step);

    const kid: XFile | undefined = findMap(curr.kidIds, (kidId) => {
      const kid = getXFile(system, kidId);
      if (kid.name === step) return kid;
      return undefined;
    });
    if (kid === undefined)
      throw new XError(
        `When looking for XFile at path \`${showXPath(path)}\`: XDirectory not found: \`${showXPath([step])}\``,
      );
    curr = kid;
  }
  return curr;
}

export function addXFile(
  system: XSystem,
  file: XFile,
  parent?: XFile & { type: "directory" },
) {
  system.files[file.id] = file;
  parent?.kidIds.push(file.id);
}

export function freshXFileId() {
  return randomUUID() as XFileId;
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
