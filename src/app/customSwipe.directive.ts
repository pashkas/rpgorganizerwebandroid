import { Directive, EventEmitter, HostListener, Output } from "@angular/core";

@Directive({ selector: "[swipe]" })
export class CustomSwipeDirective {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() up = new EventEmitter<void>(); // Новое событие
  @Output() down = new EventEmitter<void>(); // Новое событие

  swipeCoord = [0, 0];
  swipeTime = new Date().getTime();

  constructor() {}

  @HostListener("touchstart", ["$event"]) onSwipeStart($event) {
    this.onSwipe($event, "start");
  }

  @HostListener("touchend", ["$event"]) onSwipeEnd($event) {
    this.onSwipe($event, "end");
  }

  onSwipe(e: TouchEvent, when: string) {
    this.swipe(e, when);
  }

  swipe(e: TouchEvent, when: string): void {
    const coord: [number, number] = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    const time = new Date().getTime();

    if (when === "start") {
      this.swipeCoord = coord;
      this.swipeTime = time;
    } else if (when === "end") {
      const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
      const duration = time - this.swipeTime;

      if (duration < 1000) {
        // Горизонтальный свайп
        if (Math.abs(direction[0]) > 30 && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) {
          const swipeDir = direction[0] < 0 ? "next" : "previous";
          if (swipeDir === "next") {
            this.next.emit();
          } else {
            this.previous.emit();
          }
        }

        // Вертикальный свайп
        if (Math.abs(direction[1]) > 30 && Math.abs(direction[1]) > Math.abs(direction[0] * 3)) {
          const swipeDir = direction[1] < 0 ? "up" : "down";
          if (swipeDir === "up") {
            this.up.emit();
          } else {
            this.down.emit();
          }
        }
      }
    }
  }
}
