import { Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from "@angular/core";

import { VibroService } from "./vibro.service";

@Directive({
  selector: "[appLongTap]",
})
export class LongTapDirective implements OnDestroy {
  @Input() longTapDelay = 650;
  @Input() longTapMoveTolerance = 14;
  @Input() longTapVibration = 35;

  @Output() longTap = new EventEmitter<void>();
  @Output() shortTap = new EventEmitter<void>();

  private active = false;
  private blockClickUntil = 0;
  private fired = false;
  private lastTouchUntil = 0;
  private startX = 0;
  private startY = 0;
  private timer: any;

  constructor(private vibro: VibroService) {}

  @HostListener("touchstart", ["$event"])
  onTouchStart(ev: TouchEvent) {
    this.lastTouchUntil = Date.now() + 900;
    this.start(ev);
  }

  @HostListener("touchmove", ["$event"])
  onTouchMove(ev: TouchEvent) {
    this.move(ev);
  }

  @HostListener("touchend", ["$event"])
  onTouchEnd(ev: TouchEvent) {
    this.lastTouchUntil = Date.now() + 900;
    this.end(ev);
  }

  @HostListener("touchcancel", ["$event"])
  onTouchCancel(ev: TouchEvent) {
    this.lastTouchUntil = Date.now() + 900;
    this.end(ev);
  }

  @HostListener("mousedown", ["$event"])
  onMouseDown(ev: MouseEvent) {
    if (Date.now() < this.lastTouchUntil || ev.button !== 0) {
      return;
    }

    this.start(ev);
  }

  @HostListener("mousemove", ["$event"])
  onMouseMove(ev: MouseEvent) {
    if (Date.now() < this.lastTouchUntil) {
      return;
    }

    this.move(ev);
  }

  @HostListener("mouseup", ["$event"])
  onMouseUp(ev: MouseEvent) {
    if (Date.now() < this.lastTouchUntil) {
      return;
    }

    this.end(ev);
  }

  @HostListener("mouseleave", ["$event"])
  onMouseLeave(ev: MouseEvent) {
    if (Date.now() < this.lastTouchUntil) {
      return;
    }

    this.cancel();
  }

  @HostListener("click", ["$event"])
  onClick(ev: MouseEvent) {
    if (Date.now() < this.blockClickUntil) {
      this.stop(ev);

      return false;
    }
  }

  @HostListener("contextmenu", ["$event"])
  onContextMenu(ev: MouseEvent) {
    this.stop(ev);
    if (this.active) {
      this.finishLongTap();
    }

    return false;
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private start(ev: TouchEvent | MouseEvent) {
    this.stop(ev);
    this.cancel();
    let point = this.getPoint(ev);
    this.active = true;
    this.fired = false;
    this.startX = point.x;
    this.startY = point.y;
    this.timer = setTimeout(() => this.finishLongTap(), this.longTapDelay);
  }

  private move(ev: TouchEvent | MouseEvent) {
    if (!this.active) {
      return;
    }

    this.stop(ev);
    let point = this.getPoint(ev);
    if (Math.abs(point.x - this.startX) > this.longTapMoveTolerance || Math.abs(point.y - this.startY) > this.longTapMoveTolerance) {
      this.cancel();
    }
  }

  private end(ev: TouchEvent | MouseEvent) {
    if (!this.active && !this.fired) {
      return;
    }

    this.stop(ev);
    if (!this.fired) {
      this.finishShortTap();
    } else {
      this.blockClickUntil = Date.now() + 1200;
    }
  }

  private finishLongTap() {
    if (this.fired) {
      return;
    }

    this.fired = true;
    this.active = false;
    this.blockClickUntil = Date.now() + 1200;
    this.clearTimer();
    this.vibrate();
    this.longTap.emit();
  }

  private finishShortTap() {
    if (this.fired) {
      return;
    }

    this.fired = true;
    this.active = false;
    this.blockClickUntil = Date.now() + 400;
    this.clearTimer();
    setTimeout(() => this.shortTap.emit(), 0);
  }

  private cancel() {
    this.active = false;
    this.clearTimer();
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private vibrate() {
    this.vibro.vibrate(this.longTapVibration);
  }

  private getPoint(ev: any) {
    let touch = ev && ev.touches && ev.touches.length ? ev.touches[0] : null;
    if (!touch && ev && ev.changedTouches && ev.changedTouches.length) {
      touch = ev.changedTouches[0];
    }

    return {
      x: touch ? touch.clientX : ev && ev.clientX ? ev.clientX : 0,
      y: touch ? touch.clientY : ev && ev.clientY ? ev.clientY : 0,
    };
  }

  private stop(ev: Event) {
    if (ev.preventDefault) {
      ev.preventDefault();
    }
    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  }
}
