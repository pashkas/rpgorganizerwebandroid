import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PersService } from 'src/app/pers.service';
import { Characteristic } from 'src/Models/Characteristic';

@Component({
  templateUrl: './quick-add-ability.component.html',
  styleUrls: ['./quick-add-ability.component.css']
})
export class QuickAddAbilityComponent implements OnInit {

  myForm: FormGroup;
  characts$: Observable<Characteristic[]>;

  constructor(public dialogRef: MatDialogRef<QuickAddAbilityComponent>,
    private fb: FormBuilder,
    private srv: PersService,
    private router: Router) {
  }

  ngOnInit() {
    this.characts$ = this.srv.pers$.pipe(
      map(n => n.characteristics)
    );

    this.myForm = this.fb.group({
      charact: [undefined, Validators.required],
      abilName: [undefined, Validators.required]
    });
  }

  ok() {
    let abilId = this.srv.addAbil(
      this.myForm.get('charact').value,
      this.myForm.get('abilName').value
    );

    this.srv.savePers(false);

    // this.router.navigate(['pers/task', abilId, true]);

    this.dialogRef.close();
  }
}
