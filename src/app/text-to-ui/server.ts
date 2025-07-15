"use server";

import { do_, fromDataUrlToBuffer } from "@/utility";
import { existsSync } from "fs";
import * as fs from "fs/promises";
import path from "path";
import * as flow from "./flow";
import {
  Applet,
  AppletDesign,
  AppletMetadata,
  AppletState,
  PlaceholderElement,
} from "./ontology";
import Paths from "./paths";
import { foldElement } from "./semantics";

const paths = new Paths(path.join(".", "public"));

export type AppletInfo = {
  id: AppletMetadata["id"];
  name: AppletDesign["name"];
};

export async function getAppletInfos(): Promise<AppletInfo[]> {
  return (
    await Promise.all(
      (await fs.readdir(path.join(paths.appletsDirpath))).map(
        async (filename) => {
          if (filename.includes(".")) return [];
          console.log(filename);
          const appletId = filename;
          const applet = await getApplet(appletId);
          return [{ id: appletId, name: applet.design.name }];
        },
      ),
    )
  ).flat();
}

export async function getApplet(appletId: string): Promise<Applet> {
  return Applet.parse(
    JSON.parse(await fs.readFile(paths.appletFilepath(appletId), "utf8")),
  );
}

export async function interpretEffect(
  applet: Applet,
  state: AppletState,
  effect: string,
): Promise<AppletState> {
  const output = await flow.interpretEffect({ applet, state, effect });
  return output.state;
}

export async function fillPlaceholder(
  applet: Applet,
  placeholder: PlaceholderElement,
): Promise<Applet> {
  const output = await flow.fillPlaceholder({ applet, placeholder });
  await saveApplet(output.applet);
  await generateAppletImages(output.applet.metadata.id);
  return output.applet;
}

export async function saveApplet(applet: Applet): Promise<void> {
  await fs.mkdir(paths.appletDirpath(applet.metadata.id), { recursive: true });
  await fs.writeFile(
    paths.appletFilepath(applet.metadata.id),
    JSON.stringify(applet, null, 4),
  );
}

export async function generateApplet(prompt: string): Promise<Applet> {
  const { applet } = await flow.generateApplet({ prompt });
  await saveApplet(applet);
  await generateAppletImages(applet.metadata.id);
  return applet;
}

export async function generateAppletImages(appletId: string) {
  const applet = await getApplet(appletId);

  await Promise.all(
    foldElement((element) => {
      if (element.type === "image") {
        return [
          do_(async () => {
            if (existsSync(paths.appletImageFilepath(appletId, element.slug)))
              return;
            const result = await flow.generateImage({ element });
            await fs.mkdir(paths.appletImagesDirpath(applet.metadata.id), {
              recursive: true,
            });
            await fs.writeFile(
              paths.appletImageFilepath(applet.metadata.id, element.slug),
              fromDataUrlToBuffer(result.dataUrl),
            );
          }),
        ];
      } else return [];
    }, applet.body),
  );
}
