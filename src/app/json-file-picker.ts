import { registerPlugin } from "@capacitor/core";

export interface JsonFilePickerPlugin {
  saveJsonFile(options: { fileName: string; data: string }): Promise<{ uri: string }>;
  openJsonFile(): Promise<{ uri: string; name: string; data: string }>;
}

export const JsonFilePicker = registerPlugin<JsonFilePickerPlugin>("JsonFilePicker");
