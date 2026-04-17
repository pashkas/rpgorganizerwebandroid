import { Directive, EventEmitter, HostListener, Input, Output } from "@angular/core";

@Directive({ selector: "[swipe]" })
export class CustomSwipeDirective {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() up = new EventEmitter<void>();
  @Output() down = new EventEmitter<void>();

  /** Минимальная дистанция свайпа в пикселях */
  @Input() swipeThreshold = 50;

  /** Максимальная длительность свайпа в мс */
  @Input() swipeMaxDuration = 800;

  /** Коэффициент перевеса основного направления над побочным */
  @Input() swipeDirectionRatio = 3;

  private startCoord: [number, number] = [0, 0];
  private startTime = 0;

  constructor() {}

  @HostListener("touchstart", ["$event"])
  onTouchStart(e: TouchEvent) {
    this.startCoord = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
    this.startTime = Date.now();
  }

  @HostListener("touchmove", ["$event"])
  onTouchMove(e: TouchEvent) {
    if (!this.startTime) {
      return;
    }

    const dx = e.changedTouches[0].clientX - this.startCoord[0];
    const dy = e.changedTouches[0].clientY - this.startCoord[1];
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Если жест уже распознан как горизонтальный свайп — блокируем скролл
    if (absDx > 15 && absDx > absDy * 2) {
      e.preventDefault();
    }
  }

  @HostListener("touchend", ["$event"])
  onTouchEnd(e: TouchEvent) {
    if (!this.startTime) {
      return;
    }

    const dx = e.changedTouches[0].clientX - this.startCoord[0];
    const dy = e.changedTouches[0].clientY - this.startCoord[1];
    const duration = Date.now() - this.startTime;

    if (duration > this.swipeMaxDuration) {
      this.reset();

      return;
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Горизонтальный свайп
    if (absDx > this.swipeThreshold && absDx > absDy * this.swipeDirectionRatio) {
      if (dx < 0) {
        this.next.emit();
      } else {
        this.previous.emit();
      }
    }

    // Вертикальный свайп
    if (absDy > this.swipeThreshold && absDy > absDx * this.swipeDirectionRatio) {
      if (dy < 0) {
        this.up.emit();
      } else {
        this.down.emit();
      }
    }

    this.reset();
  }

  private reset() {
    this.startTime = 0;
  }
}
