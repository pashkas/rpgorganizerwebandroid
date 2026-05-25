import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

@Component({
  selector: "app-qwick-add-task-dialog",
  templateUrl: "./qwick-add-task-dialog.component.html",
  styleUrls: ["./qwick-add-task-dialog.component.css"],
})
export class QwickAddTaskDialogComponent implements AfterViewInit {
  @ViewChild("nameInput", { static: false }) nameInput: ElementRef<HTMLInputElement>;

  constructor(@Inject(MAT_DIALOG_DATA) public data, public dialogRef: MatDialogRef<QwickAddTaskDialogComponent>) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.nameInput || !this.nameInput.nativeElement) {
        return;
      }

      this.nameInput.nativeElement.focus();
      this.nameInput.nativeElement.select();
    }, 80);
  }

  ok() {
    let name = this.data && this.data.text ? this.data.text.trim() : "";
    if (!name) {
      return;
    }

    this.dialogRef.close(name);
  }
}
