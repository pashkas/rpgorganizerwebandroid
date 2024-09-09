import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PersService } from 'src/app/pers.service';
import { RevardService } from 'src/app/revard.service';
import { ReqItem, ReqItemType } from 'src/Models/ReqItem';
import { Reqvirement } from 'src/Models/Task';
import { v4 as uuid } from 'uuid';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-requirements-add-dialog',
  templateUrl: './requirements-add-dialog.component.html',
  styleUrls: ['./requirements-add-dialog.component.css']
})
export class RequirementsAddDialogComponent implements OnInit {
  private unsubscribe$ = new Subject();

  ReqForm: FormGroup;
  elements$ = new BehaviorSubject<ReqItem[]>([]);
  types$ = new BehaviorSubject<string[]>([]);

  constructor(private fb: FormBuilder,
    private srv: PersService,
    private revSrv: RevardService,
    private dialogRef: MatDialogRef<RequirementsAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: Reqvirement) { }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.types$.next(this.revSrv.getRevTypes());

    this.initForm();

    if (this.data) {
      let elements = this.revSrv.getElements(this.srv.pers$.value, this.data.type);
      this.elements$.next(elements);
      this.ReqForm.get('type').setValue(this.data.type);
      this.ReqForm.get('elId').setValue(elements.find(e => e.elId == this.data.elId));
      this.ReqForm.get('elVal').setValue(this.data.elVal);
    }

    this.ReqForm.get('type')
      .valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(q => {
        this.elements$.next(this.revSrv.getElements(this.srv.pers$.value, q));
        this.ReqForm.get('elVal').setValue(this.revSrv.getDefaultValue(q));
      });

    this.elements$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(q => {
        if (q[0] != null) {
          this.ReqForm.get('elId').setValue(q[0]);
        }
      });

    if (!this.ReqForm.get('type').value) {
      this.ReqForm.get('type').setValue(ReqItemType.abil);
    }
  }

  private initForm() {
    this.ReqForm = this.fb.group({
      type: this.fb.control(undefined, [Validators.required]),
      elId: this.fb.control(undefined, [Validators.required]),
      elVal: this.fb.control(undefined, [Validators.required])
    });
  }

  ok() {
    let result: Reqvirement = {
      id: uuid(),
      elId: this.ReqForm.get('elId').value.elId,
      elVal: this.ReqForm.get('elVal').value,
      elName: this.ReqForm.get('elId').value.elName,
      type: this.ReqForm.get('type').value
    };

    this.dialogRef.close(result);
  }
}
