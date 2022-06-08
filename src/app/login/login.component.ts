import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  err: string = '';
  isNew: boolean = false;
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private usrSrv: UserService, ) { }

  doLogin() {
    if (!this.isNew) {
      this.authService.doMailPasswordLogin(this.email, this.password)
        .then(res => {
          this.usrSrv.getPers();
          this.router.navigate(['/main']);
        }, err => {
          this.err = err.message;
        });
    }
    else {
      this.authService.makeMailPasswordLogin(this.email, this.password)
        .then(res => {
          this.usrSrv.getPers();
          this.router.navigate(['/main']);
        }, err => {
          this.err = err.message;
        });
    }
  }

  ngOnInit() {
  }

  tryGoogleLogin() {
    this.authService.doGoogleLogin()
      .then(res => {
        this.router.navigate(['/main']);
      });
  }
}
