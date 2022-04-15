import { Component, OnInit } from '@angular/core';
import { interval, Observable, Subject, timer } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { PersService } from '../pers.service';

@Component({
  templateUrl: './task-timer-component.component.html',
  styleUrls: ['./task-timer-component.component.css']
})
export class TaskTimerComponentComponent implements OnInit {
  public timeLeft$: Observable<timeComponents>;
  private unsubscribe$ = new Subject();
  dif: number;

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  constructor(private srv: PersService) { }

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

    this.timeLeft$ = timer(0, 1000).pipe(
      takeUntil(this.unsubscribe$),
      map(x => this.calcDateDiff(endTime)),
      shareReplay(1)
    );
  }


  calcDateDiff(endDay: number): timeComponents {
    const dDay = endDay;

    const milliSecondsInASecond = 1000;
    const hoursInADay = 24;
    const minutesInAnHour = 60;
    const secondsInAMinute = 60;

    let timeDifference = dDay - Date.now();

    if(timeDifference < 0){
      timeDifference = 0;
    }

    this.dif = timeDifference;

    const daysToDday = Math.floor(
      timeDifference /
      (milliSecondsInASecond * minutesInAnHour * secondsInAMinute * hoursInADay)
    );

    const hoursToDday = Math.floor(
      (timeDifference /
        (milliSecondsInASecond * minutesInAnHour * secondsInAMinute)) %
      hoursInADay
    );

    const minutesToDday = Math.floor(
      (timeDifference / (milliSecondsInASecond * minutesInAnHour)) %
      secondsInAMinute
    );

    const secondsToDday =
      Math.floor(timeDifference / milliSecondsInASecond) % secondsInAMinute;

    return { secondsToDday, minutesToDday, hoursToDday, daysToDday };
  }

}

interface timeComponents {
  secondsToDday: number;
  minutesToDday: number;
  hoursToDday: number;
  daysToDday: number;
}
