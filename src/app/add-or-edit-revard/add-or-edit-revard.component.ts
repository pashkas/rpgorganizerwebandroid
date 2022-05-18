import { Component, OnInit, Inject } from '@angular/core';
import { Reward } from 'src/Models/Reward';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { Pers } from 'src/Models/Pers';
import { RequirementsAddDialogComponent } from '../pers/requirements-add-dialog/requirements-add-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { RevardDialogData } from 'src/Models/RevardDialogData';
import { Reqvirement } from 'src/Models/Task';

@Component({
  selector: 'app-add-or-edit-revard',
  templateUrl: './add-or-edit-revard.component.html',
  styleUrls: ['./add-or-edit-revard.component.css']
})
export class AddOrEditRevardComponent implements OnInit {
  private unsubscribe$ = new Subject();

  rev: Reward;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RevardDialogData,
    private dialog: MatDialog) { }

  addReq() {
    const dialogRef = this.openReqDialogHandler(null);

    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(n => {
        if (n) {
          this.rev.reqvirements.push(n);
        }
      });
  }

  private openReqDialogHandler(data: any) {
    return this.dialog.open(RequirementsAddDialogComponent, {
      data: data,
      backdropClass: 'backdrop'
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    if (this.data.rev.reqvirements == null) {
      this.data.rev.reqvirements = [];
    }

    this.rev = this.data.rev;
  }

  del(id: string) {
    this.rev.reqvirements = this.rev.reqvirements.filter(n => n.id != id);
  }

  edit(req: Reqvirement) {
    const dialogRef = this.openReqDialogHandler(req);

    dialogRef.afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(n => {
        if (n) {
          req.elId = n.elId;
          req.elName = n.elName;
          req.elVal = n.elVal;
          req.type = n.type;
        }
      });
  }
}
