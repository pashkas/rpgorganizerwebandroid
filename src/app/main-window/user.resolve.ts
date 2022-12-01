import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, Router } from "@angular/router";
import { Pers } from "src/Models/Pers";
import { FirebaseUserModel } from "src/Models/User";
import { PersService } from "../pers.service";
import { UserService } from "../user.service";

@Injectable({
  providedIn: "root",
})
export class UserResolver implements Resolve<any> {
  constructor(public userService: UserService, private router: Router, private srv: PersService) {}

  async resolve(route: ActivatedRouteSnapshot): Promise<any> {
    let prsJson = localStorage.getItem("pers");
    if (prsJson) {
      this.srv.setPers(prsJson);
      return await new Promise((resolve, reject) => {
        return resolve(true);
      });
    } else {
      let user = new FirebaseUserModel();
      return await new Promise((resolve, reject) => {
        this.userService.getCurrentUser().then(
          (res) => {
            user.name = res.displayName;
            user.provider = res.providerData[0].providerId;
            user.id = res.uid;

            return resolve(user);
          },
          (err) => {
            this.router.navigate(["/pers/login"], {
              queryParams: {
                frome: "/main",
              },
            });

            return reject(err);
          }
        );
      });
    }
  }
}
