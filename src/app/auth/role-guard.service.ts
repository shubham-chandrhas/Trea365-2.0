import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";
import { UtilService } from "../shared/service/util.service";
// import decode from "jwt-decode";


@Injectable()
export class RoleGuardService implements CanActivate {

  constructor(public auth: AuthService, public router: Router, private util: UtilService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // this will be passed from the route config
    // on the data property
    const expectedRole = route.data.expectedRole;
    const moduleId = route.children.length > 0 ? route.children[0].data.permission_slug : false;
    // const token = atob(localStorage.getItem("KEY"));
    // decode the token to get its payload
    // const tokenPayload = decode(token);
    // console.log("Token Payload :::"+JSON.stringify(tokenPayload));
    // console.log(decode(token));
// tslint:disable-next-line: max-line-length
    const loggedInUserRole = localStorage.getItem("USER") ? parseInt(JSON.parse(atob(localStorage.getItem("USER"))).role_id, 10) : this.router.navigate(["login"]);
    // loggedInUserRole !== expectedRole
    if (moduleId && !this.util.canAccess(moduleId)) {
      console.log("User doesn't have permissions to access this route.");
      this.router.navigate(["/unauthorized-access"]);
      return false;
    }

    if (expectedRole.indexOf(loggedInUserRole) === -1) {
      console.log("Route Authentication Fail");
      this.router.navigate(["404"]);
      return false;
    }
    return true;
  }
}
