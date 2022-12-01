import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PersService } from "../pers.service";
import { UserService } from "../user.service";
import { Location } from "@angular/common";
import { take } from "rxjs/operators";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material";

@Component({
  selector: "app-sync-module",
  templateUrl: "./sync-module.component.html",
  styleUrls: ["./sync-module.component.css"],
})
export class SyncModuleComponent implements OnInit {
  constructor(private usrSrv: UserService, public srv: PersService, private activatedRoute: ActivatedRoute, private router: Router, private _location: Location, private dialog: MatDialog) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((q) => {
      let type = q["type"];
      let frome = q["frome"];

      let userId = null;
      if (this.srv.pers$ != null && this.srv.pers$.value != null) {
        userId = this.srv.pers$.value.userId;
      }

      if (type == "load") {
        // Скачивание
        this.usrSrv.sync(true);
        this.router.navigate([frome]);
      } else if (type == "upload") {
        // Загрузка
        this.usrSrv.sync(false);
        this.router.navigate([frome]);
      } else if (type == "newGame") {
        // Новая игра
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          panelClass: "custom-black",
        });

        dialogRef
          .afterClosed()
          .pipe(take(1))
          .subscribe((result) => {
            if (result) {
              this.usrSrv.setNewPers(userId);
              this.router.navigate(["/main"]);
            } else {
              this.router.navigate([frome]);
            }
          });
      }
    });
  }
}
