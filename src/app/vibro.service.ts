import { Injectable } from "@angular/core";
import { Haptics } from "@capacitor/haptics";

import { GameSettings } from "./GameSettings";

@Injectable({
  providedIn: "root",
})
export class VibroService {
  constructor(private gameSettings: GameSettings) {}

  short() {
    this.vibrate(35);
  }

  long() {
    this.vibrate(250);
  }

  vibrate(duration: number) {
    if (!this.gameSettings.isVibro || duration <= 0) {
      return;
    }

    Haptics.vibrate({ duration }).catch(() => this.browserVibrate(duration));
  }

  private browserVibrate(duration: number) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }
}
