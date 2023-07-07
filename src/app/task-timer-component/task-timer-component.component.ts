import { AfterViewInit, Component, OnInit } from "@angular/core";
import { interval, Observable, Subject, timer } from "rxjs";
import { map, shareReplay, takeUntil } from "rxjs/operators";
import { PersService } from "../pers.service";
import { Calendar } from "@awesome-cordova-plugins/calendar";
import { Vibration } from "@awesome-cordova-plugins/vibration";
import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";

@Component({
  templateUrl: "./task-timer-component.component.html",
  styleUrls: ["./task-timer-component.component.css"],
})
export class TaskTimerComponentComponent implements OnInit {
  private unsubscribe$ = new Subject();

  dif: number;
  public timeLeft$: Observable<timeComponents>;
  event: { title: string; location: string; notes: string; startDate: Date; endDate: Date; reminders: { minutes: number }[] };
  calendarId: any;
  isDelEv: boolean;

  constructor(private srv: PersService, private dialogRef: MatDialogRef<TaskTimerComponentComponent>) {}

  calcDateDiff(endDay: number): timeComponents {
    const dDay = endDay;

    const milliSecondsInASecond = 1000;
    const hoursInADay = 24;
    const minutesInAnHour = 60;
    const secondsInAMinute = 60;

    let timeDifference = dDay - Date.now();

    if (timeDifference < 0) {
      timeDifference = 0;
    }

    this.dif = timeDifference;

    const daysToDday = Math.floor(timeDifference / (milliSecondsInASecond * minutesInAnHour * secondsInAMinute * hoursInADay));

    const hoursToDday = Math.floor((timeDifference / (milliSecondsInASecond * minutesInAnHour * secondsInAMinute)) % hoursInADay);

    const minutesToDday = Math.floor((timeDifference / (milliSecondsInASecond * minutesInAnHour)) % secondsInAMinute);

    const secondsToDday = Math.floor(timeDifference / milliSecondsInASecond) % secondsInAMinute;

    return { secondsToDday, minutesToDday, hoursToDday, daysToDday };
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    let tsk = this.srv.currentTask$.value;
    if (tsk.secondsDone == null) {
      tsk.secondsDone = 0;
    }
    if (tsk.secondsToDone == null) {
      tsk.secondsToDone == 0;
    }

    let leftSeconds = tsk.secondsToDone - tsk.secondsDone;

    let endTime = new Date().valueOf();
    endTime += leftSeconds * 1000;

    this.setCalendar(leftSeconds);

    // Получаем текущую дату и время

    this.timeLeft$ = timer(0, 1000).pipe(
      takeUntil(this.unsubscribe$),
      map((x) => {
        const diff = this.calcDateDiff(endTime);
        // if (diff.hoursToDday == 0 && diff.minutesToDday == 0 && diff.secondsToDday == 0) {
        //   BackgroundMode.unlock();
        //   Vibration.vibrate(1000);
        // }

        return diff;
      }),
      shareReplay(1)
    );
  }

  private setCalendar(leftSeconds: number) {
    const event = {
      title: "Таймер!",
      location: "",
      notes: "",
      startDate: new Date(new Date().getTime() + leftSeconds * 1000),
      endDate: new Date(new Date().getTime() + leftSeconds * 1000 + 1000),
      reminders: [{ minutes: 0 }],
    };

    this.event = event;

    try {
      Calendar.createEventWithOptions(event.title, event.location, event.notes, event.startDate, event.endDate, {
        firstReminderMinutes: 0,
      })
        .then((q) => {
          this.isDelEv = false;
        })
        .catch((err) => {});
    } catch (err) {}
  }

  close() {
    if (this.isDelEv == false) {
      this.deleteEvent()
        .then(() => {
          this.isDelEv = true;
        })
        .catch((err) => {})
        .finally(() => this.dialogRef.close(this.dif));
    } else {
      this.dialogRef.close(this.dif);
    }
  }

  private deleteEvent() {
    return Calendar.deleteEvent(this.event.title, this.event.location, this.event.notes, this.event.startDate, this.event.endDate);
  }
}

interface timeComponents {
  daysToDday: number;
  hoursToDday: number;
  minutesToDday: number;
  secondsToDday: number;
}
