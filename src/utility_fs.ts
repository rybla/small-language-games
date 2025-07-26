import * as fs from "fs/promises";

export async function stat_safe(filepath: string) {
  try {
    return await fs.stat(filepath);
  } catch {
    return undefined;
  }
}

export async function exists(filepath: string): Promise<boolean> {
  return (await stat_safe(filepath)) !== undefined;
}
