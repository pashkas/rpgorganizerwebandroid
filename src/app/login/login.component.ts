import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "../user.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  err: string = "";
  isNew: boolean = false;
  email: string = "";
  password: string = "";
  frome: string;
  type: string;

  constructor(private authService: AuthService, private router: Router, private usrSrv: UserService, private activatedRoute: ActivatedRoute) {}

  doLogin() {
    if (!this.isNew) {
      this.authService.doMailPasswordLogin(this.email, this.password).then(
        (res) => {
          this.usrSrv.getPers(this.type);
          this.router.navigate([this.frome]);
        },
        (err) => {
          this.err = err.message;
        }
      );
    } else {
      this.authService.makeMailPasswordLogin(this.email, this.password).then(
        (res) => {
          this.usrSrv.getPers(this.type);
          this.router.navigate([this.frome]);
        },
        (err) => {
          this.err = err.message;
        }
      );
    }
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((q) => {
      this.frome = q["frome"];
      this.type = q["type"];
      if(this.frome == null){
        this.frome = "/main";
      }
    });
  }

  tryGoogleLogin() {
    this.authService.doGoogleLogin().then((res) => {
      this.router.navigate([this.frome]);
    });
  }
}
