import { Injectable, Inject } from "@angular/core";

import { Router } from "@angular/router";
import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser
} from "amazon-cognito-identity-js/lib";

import { HttpService } from "../shared/service/http.service";
import { APP_CONFIG, AppConfig } from "../app-config.module";
import { UtilService } from "../shared/service/util.service";
import { ConstantsService } from "../shared/service/constants.service";
import { GlobalService } from "../shared/service/global.service";

declare var jquery: any;
declare var $: any;

import { 
    isNull as _isNull,
    isEmpty as _isEmpty
}  from 'underscore';

@Injectable()
export class AwsCognitoService {
  private userpool: any;

  constructor(
    public router: Router,
    @Inject(APP_CONFIG)
    private config: AppConfig,
    private http: HttpService,
    private util: UtilService,
    private global: GlobalService,
    private constant: ConstantsService
  ) {
    this.userpool = new CognitoUserPool({
      UserPoolId: this.config.awsUserPoolId, //"us-east-2_scrGK0WJO",
      ClientId: this.config.awsClientId //"68g4ktfiugs5v3nribkskg920n"
    });
  }

  public getCognitoUserData(userName: string) {
    return { Username: userName, Pool: this.userpool };
  }

  public getLoggedInCognitoUsername() {
    console.log(JSON.parse(atob(localStorage.getItem("USER"))).username);
    return JSON.parse(atob(localStorage.getItem("USER"))).username;
  }

  public getLoggedInCognitoUsernameRole() {
    return JSON.parse(atob(localStorage.getItem("USER"))).role_id;
  }

  // user sign in through aws cognito auth
  public authenticate(userReqObj: any, rememberMe: boolean, callback) {
    console.log("authenticate service call::::::");
    const self = this;
    const authData = new AuthenticationDetails(userReqObj);
    const cognitoUser = new CognitoUser(
      self.getCognitoUserData(userReqObj.Username)
    );
    cognitoUser.authenticateUser(authData, {
      onSuccess: function(result) {
        console.log("authenticated with", JSON.stringify(result));
        if (rememberMe) {
          localStorage.setItem("IS_REMEMBERME", "1");
        } else {
          localStorage.setItem("IS_REMEMBERME", "0");
        }
        localStorage.setItem("KEY", btoa(result.accessToken.jwtToken));
        localStorage.setItem("REFRESH_TOKEN", btoa(result.refreshToken.token));
        localStorage.setItem("TOKEN", btoa("access"));
        localStorage.setItem(
          "DEVICE_KEY",
          btoa(result.accessToken.payload.device_key)
        );

        return callback(false, true);
      },
      onFailure: function(err) {
        console.error(err);
        return callback(true, err);
      },
      newPasswordRequired: function(err) {
        console.log(err);
        // self.util.showAlertToast(
        //   "Suspended",
        //   self.constant.SET_PASSWORD_ERR_MSG
        // );
        setTimeout(function() {
          self.router.navigate(["/set-password-s1"]);
        }, 3000);
      }
    });
  }

  public forgotPassword(userName: string, callback) {
    console.log("forgotPassword service call::::::");
    let self = this;
    let cognitoUser = new CognitoUser(self.getCognitoUserData(userName));

    cognitoUser.forgotPassword({
      onSuccess: function(result) {
        console.log("call result::onSuccess ");
        console.log(result);
        return callback(false, result);
      },
      onFailure: function(err) {
        console.log("call result::onFailure ");
        console.log(err);
        return callback(true, err);
      },
      inputVerificationCode(code) {
        console.log("call result::inputVerificationCode ");
        console.log(code);
        return callback(false, code);
      }
    });
  }

  public confirmPassword(userName, verificationCode, newPassword, callback) {
    console.log("confirmPassword service call::::::");
    let self = this;
    let cognitoUser = new CognitoUser(self.getCognitoUserData(userName));

    cognitoUser.confirmPassword(verificationCode, newPassword, {
      onSuccess: function(result) {
        console.log("call result: :onSuccess" + result);
        return callback(false, result);
      },
      onFailure: function(err) {
        console.log("call result: :onFailure" + err);
        return callback(true, err);
      }
    });
  }

  public forgotUserID(reqObj, callback) {
    var self = this;
    self.http.doPost("forgot-username", reqObj, function(
      error: boolean,
      response: any
    ) {
      if (error) {
        return callback(true, response);
      } else {
        return callback(false, response);
      }
    });
  }

  public setPassword(reqObj, callback) {
    var self = this;
    self.http.doPost("login", reqObj, function(
      error: boolean,
      response: any
    ) {
      if (error) {
        return callback(true, response);
      } else {
        return callback(false, response);
      }
    });
  }
  public setNewPassword(reqObj, callback) {
    var self = this;
    self.http.doPost("set-password", reqObj, function(
      error: boolean,
      response: any
    ) {
      if (error) {
        return callback(true, response);
      } else {
        return callback(false, response);
      }
    });
  }

  public checkAccessTokan() {
    const self = this;
    self.util.removeWarningFlage();
    console.log(
      "localStorage.getItem(IS_REMEMBERME): " +
        localStorage.getItem("IS_REMEMBERME")
    );
    // @Commented By Yogesh
    // if( localStorage.getItem('KEY') && localStorage.getItem('IS_REMEMBERME') == '1' ){
    if (localStorage.getItem("KEY")) {
      this.router.navigate(["/client-login"]);
      this.getUserInfo();
    } else {
      this.router.navigate(["/login"]);
      this.util.hideLoading();
    }
  }

  public getUserInfo() {
    const self = this;
        self.http.doGet("user-info", function(error: boolean, response: any) {
      if (error) {
        // alert(response.message);
        console.log("In get User Info");
        self.util.showAlertToast("Suspended", response.message);
        localStorage.removeItem("KEY");
        window.localStorage.removeItem("KEY");
        localStorage.clear();
        self.router.navigate(["/login"]);
        self.util.hideLoading();
      } else { 
        let routeStr: String = "";
        if (response.data.role_id === 1) {
          routeStr = "/su/tsa";
          // self.router.navigate(['/su/tsa']);
        } else if (response.data.role_id == 2 || response.data.role_id == 3) {
          // This is for employee with no permission
          // Removed Condition for Employee : Dont remove this code
        //   if (
        //     response.data.role_id == 3 &&
        //     response.data.permission_role_id == null
        //   ) {
        //     // self.util.showAlertToast('Warning', self.constant.NO_PERMISSION_MSG);
        //     self.util.hideLoading();
        //     localStorage.setItem("USER", btoa(JSON.stringify(response.data)));
        //     self.util.setRole(
        //       JSON.parse(atob(localStorage.getItem("USER"))).role.role_id
        //     );
        //     sessionStorage.setItem("refreshStatus", "1");
        //     self.router.navigate(["/company-users"]);
        //     return;
        //   }
          if (response.data.company && response.data.company.is_active === 3) {
            self.util.showAlertToast(
              "Suspended",
              self.constant.SUSPENDED_AC_MSG
            );
            return;
          }
          if (response.data.company && response.data.company.is_active === 4) {
            self.util.showAlertToast(
              "Suspended",
              self.constant.DELETED_AC_MSG
            );
            return;
          }
          response.data.company && response.data.company.is_active === 2
            ? sessionStorage.setItem("WORNING_FLAGE", "1")
            : sessionStorage.removeItem("WORNING_FLAGE");
          routeStr =
            response.data.overall_flag == 1 ? "/csa" : "/csa-onboarding";
        } else {
          // routeStr = '/company-users';
          self.util.showAlertToast(
            "Suspended",
            self.constant.UNAUTHORISED_USER_MSG
          );
          localStorage.removeItem("IS_REMEMBERME");
          localStorage.removeItem("KEY");
          sessionStorage.removeItem("KEY");
          window.localStorage.removeItem("KEY");
          localStorage.clear();
          sessionStorage.clear();
          self.util.hideLoading();
          return;
        }

        self.util.hideLoading();
        localStorage.setItem("USER", btoa(unescape(encodeURI(JSON.stringify(response.data)))));
        self.util.setRole(
          JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem("USER"))))).role.role_id
        );
        sessionStorage.setItem("refreshStatus", "1");
        self.router.navigate([routeStr]);

        // else if( response.data.role_id == 15 ){
        //     self.router.navigate(['/client']);
        // }
      }
    });
  }

  public getCompanyInfo(callback) {

    const self = this;

    const company_id = JSON.parse(atob(localStorage.getItem("USER"))).company_id;

    let companyInfo = localStorage.getItem("COMPANY_INFO");

    if (companyInfo && !_isEmpty(companyInfo)) {

        let userId = JSON.parse(atob(localStorage.getItem("USER"))).id;

        let companyUserId = (JSON.parse(companyInfo).data.authorized_users['0']).id;

        // If loggedIn user id not match then fire request
        if (userId != companyUserId) {
            companyInfo = null;
        }
    }

    if (!_isNull(companyInfo) && !_isEmpty(companyInfo)) {

        return callback(false, JSON.parse(companyInfo));
        
    } else {

        self.http.doGet(`company/${company_id}/detail`, function(
        error: boolean,
        response: any
        ) {

        if (error) {

            // alert(response.message);
            return callback(true, response);

        } else {

            // localStorage.setItem('COMPANY_INFO', btoa(JSON.stringify(response))); 
            localStorage.setItem("COMPANY_INFO", JSON.stringify(response));

            return callback(false, response);
        }

        });
    }

  }

  public logout() {
    const self = this;
    if (localStorage.getItem("KEY")) {
      const cognitoUser = new CognitoUser(
        self.getCognitoUserData(self.getLoggedInCognitoUsername())
      );
      if (cognitoUser != null) {
        cognitoUser.signOut();
        localStorage.removeItem("IS_REMEMBERME");
        localStorage.removeItem("KEY");
        localStorage.removeItem("COMPANY_INFO");
        sessionStorage.removeItem("KEY");
        window.localStorage.removeItem("KEY");
        localStorage.clear();
        sessionStorage.clear();
        this.router.navigate(["login"]);
      }
    } else {
      this.util.forceLogout();
    }
  }
}
