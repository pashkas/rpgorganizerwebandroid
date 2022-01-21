import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { PersService } from '../pers.service';

@Component({
  templateUrl: './pers-import-export-dialog.component.html',
  styleUrls: ['./pers-import-export-dialog.component.css']
})
export class PersImportExportDialogComponent implements OnInit {
  isImport: boolean = false;
  persData: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData,
    private srv: PersService,
  ) { }

  copy(inputElement) {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

  ngOnInit() {
    this.isImport = this.dialogData.isImport;
    if (!this.isImport) {
      this.persData = JSON.stringify(this.srv.pers$.value);
    }
    else {
      this.persData = '';
    }
  }
}
