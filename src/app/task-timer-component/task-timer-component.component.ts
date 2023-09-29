import { Component, OnInit } from "@angular/core";
import { Observable, Subject, timer } from "rxjs";
import { map, shareReplay, takeUntil } from "rxjs/operators";
import { PersService } from "../pers.service";
import { MatDialogRef } from "@angular/material/dialog";
import { CancelOptions, LocalNotificationSchema, LocalNotifications } from "@capacitor/local-notifications";
import { Task } from "src/Models/Task";

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
  notification: LocalNotificationSchema;

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

    // this.setCalendar(leftSeconds);
    this.sheduleNotification(tsk, leftSeconds);

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

  private sheduleNotification(tsk: Task, leftSeconds: number) {
    const randomId = Math.floor(Math.random() * 10000) + 1;

    const seconds = leftSeconds * 1000;
    const date = new Date(Date.now() + seconds);

    this.notification = {
      title: "Таймер",
      body: tsk.tittle,
      id: randomId,
      schedule: {
        at: date,
        allowWhileIdle: true,
      },
    };

    try {
      LocalNotifications.schedule({
        notifications: [this.notification],
      }).then(() => {});
    } catch {}
  }

  close() {
    try {
      if (this.notification) {
        LocalNotifications.cancel({
          notifications: [this.notification],
        }).then(() => {});
      }
    } catch {}

    this.dialogRef.close(this.dif);
  }
}

interface timeComponents {
  daysToDday: number;
  hoursToDday: number;
  minutesToDday: number;
  secondsToDday: number;
}
