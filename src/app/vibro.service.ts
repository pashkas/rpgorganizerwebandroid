import { Injectable } from "@angular/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

import { GameSettings, VibroEventSettings, VibroType } from "./GameSettings";

@Injectable({
  providedIn: "root",
})
export class VibroService {
  constructor(private gameSettings: GameSettings) {}

  abilityUp() {
    this.play(this.gameSettings.vibroEvents.abilityUp);
  }

  checklistDone() {
    this.play(this.gameSettings.vibroEvents.checklistDone);
  }

  counterClick() {
    this.play(this.gameSettings.vibroEvents.counterClick);
  }

  masonryQwestQwickAdd() {
    this.play(this.gameSettings.vibroEvents.masonryQwestQwickAdd);
  }

  qwestDone() {
    this.play(this.gameSettings.vibroEvents.qwestDone);
  }

  taskDone() {
    this.play(this.gameSettings.vibroEvents.taskDone);
  }

  taskFail() {
    this.play(this.gameSettings.vibroEvents.taskFail);
  }

  taskTimerOpen() {
    this.play(this.gameSettings.vibroEvents.taskTimerOpen);
  }

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

  private play(settings: VibroEventSettings) {
    if (!this.gameSettings.isVibro || !settings || !settings.isEnabled || settings.type == VibroType.None) {
      return;
    }

    switch (settings.type) {
      case VibroType.ImpactLight:
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => this.browserVibrate(settings.duration || 35));
        break;
      case VibroType.ImpactMedium:
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => this.browserVibrate(settings.duration || 60));
        break;
      case VibroType.ImpactHeavy:
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => this.browserVibrate(settings.duration || 90));
        break;
      case VibroType.Success:
        Haptics.notification({ type: NotificationType.Success }).catch(() => this.browserVibrate(settings.duration || 90));
        break;
      case VibroType.Warning:
        Haptics.notification({ type: NotificationType.Warning }).catch(() => this.browserVibrate(settings.duration || 140));
        break;
      case VibroType.Error:
        Haptics.notification({ type: NotificationType.Error }).catch(() => this.browserVibrate(settings.duration || 250));
        break;
      case VibroType.Selection:
        Haptics.selectionStart()
          .then(() => Haptics.selectionChanged())
          .then(() => Haptics.selectionEnd())
          .catch(() => this.browserVibrate(settings.duration || 25));
        break;
      case VibroType.Vibrate:
        this.vibrate(settings.duration || 35);
        break;
    }
  }
}
