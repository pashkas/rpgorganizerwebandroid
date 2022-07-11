import { Component, OnInit } from '@angular/core';
import { PersService } from '../pers.service';
import { Subject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '../user.service';


@Component({
  selector: 'app-turnir-table',
  templateUrl: './turnir-table.component.html',
  styleUrls: ['./turnir-table.component.css']
})
export class TurnirTableComponent implements OnInit {

  private unsubscribe$ = new Subject();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  champions$: Observable<any>;

  goBack() {
    this.location.back();
  }

  constructor(
    private usrService: UserService,
    public srv: PersService,
    private router: Router,
    private location: Location) { }

  ngOnInit() {
    this.champions$ = this.usrService.getChampions();

    if (!this.srv.pers$.value) {
      this.router.navigate(['/main']);
    }
  }

}
