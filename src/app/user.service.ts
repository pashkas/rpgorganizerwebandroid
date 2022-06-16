import { Injectable } from "@angular/core";
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { PersModule } from "./pers/pers.module";
import { Pers } from "src/Models/Pers";
import { map, share, take } from "rxjs/operators";
import { Observable } from "rxjs";
import { PersService } from "./pers.service";
import { curpersview } from "src/Models/curpersview";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    public db: AngularFirestore,
    public afAuth: AngularFireAuth,
    private srv: PersService,
    public dialog: MatDialog,
    private router: Router,
  ) {
  }

  async getCurrentUser() {
    return await new Promise<any>((resolve, reject) => {
      var user = firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          resolve(user);
        } else {
          reject('No user logged in');
        }
      })
    })
  }

  updateCurrentUser(value) {
    return new Promise<any>((resolve, reject) => {
      var user = firebase.auth().currentUser;
      user.updateProfile({
        displayName: value.name,
        photoURL: user.photoURL
      }).then(res => {
        resolve(res)
      }, err => reject(err))
    })
  }

  /**
   * Загрузить персонажа из БД.
   * @param userId Идентификатор пользователя
   */
  loadPers(userId: string) {
    return this.db.collection<Pers>('pers').doc(userId).valueChanges().pipe(take(1), share());
  }

  /**
   * Загрузить персонажей с уровнем, большим чем 0;
   */
  getChampions(): Observable<any> {
    return this.db.collection<Pers>('/pers', ref => ref.where('level', '>=', 1)
      .orderBy('level', 'desc'))
      .valueChanges()
      .pipe(
        map(champ => champ.map(n => {
          return { Name: n.name, Level: n.level, Pic: n.image ? n.image : n.rang.img, Id: n.id, date: new Date(n.dateLastUse) };
        })),
        take(1),
        share()
      );
  }

  sync(isDownload) {
    if (isDownload) {
      // download
      this.loadPers(this.srv.pers$.value.userId)
        .pipe(take(1))
        .subscribe(n => {
          let prs: Pers = n as Pers;
          prs.currentView = curpersview.SkillTasks;
          this.srv.savePers(false, null, prs);
        });
    } else {
      // upload
      this.srv.savePers(false);
      let prs = this.srv.pers$.value;
      const persJson = JSON.parse(JSON.stringify(prs));
      this.db.collection('pers').doc(prs.id)
        .set(persJson);
    }
  }

  setNewPers(userid: string) {
    const prs = new Pers();
    prs.userId = userid;
    prs.id = userid;
    prs.level = 0;
    prs.prevExp = 0;
    prs.nextExp = 0;
    prs.isOffline = true;

    this.srv.setPers(JSON.stringify(prs));
  }

  getPers() {
    this.getCurrentUser()
      .then(res => {
        this.loadPers(res.uid)
          .pipe(take(1))
          .subscribe(n => {
            let prs: Pers = n as Pers;
            if (prs != null) {
              this.srv.setPers(JSON.stringify(prs));
            } else {
              const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                panelClass: 'custom-black'
              });

              dialogRef.afterClosed()
                .pipe(take(1))
                .subscribe(result => {
                  if (result) {
                    this.setNewPers(res.uid);
                  }
                });
            }
          });
      }, err => {
        this.router.navigate(['/login']);
      });
  }
}
