import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { auth } from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(public db: AngularFirestore,
    public afAuth: AngularFireAuth) { }

  makeMailPasswordLogin(mail: string, pass: string) {
    return new Promise<any>((resolve, reject) => {
      this.afAuth.auth
        .createUserWithEmailAndPassword(mail, pass)
        .then(res => {
          resolve(res);
        }, err => {
          console.log(err);
          reject(err);
        })
    });
  }

  doMailPasswordLogin(mail: string, pass: string) {
    return new Promise<any>((resolve, reject) => {
      this.afAuth.auth
        .signInWithEmailAndPassword(mail, pass)
        .then(res => {
          resolve(res);
        }, err => {
          console.log(err);
          reject(err);
        })
    });
  }

  doGoogleLogin() {
    return new Promise<any>((resolve, reject) => {
      this.afAuth.auth
        .signInWithPopup(new auth.GoogleAuthProvider())
        .then(res => {
          resolve(res);
        }, err => {
          console.log(err);
          reject(err);
        })
    });
  }

}
