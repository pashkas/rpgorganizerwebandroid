import { registerPlugin } from "@capacitor/core";

export type AndroidHapticFeedbackType = "tick" | "tap" | "success" | "error" | "longPress" | "contextClick";

export interface AndroidHapticFeedbackPlugin {
  perform(options: { type: AndroidHapticFeedbackType }): Promise<{ performed: boolean }>;
}

export const AndroidHapticFeedback = registerPlugin<AndroidHapticFeedbackPlugin>("AndroidHapticFeedback");
