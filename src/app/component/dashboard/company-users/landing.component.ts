/* *
 *     	Company Super Admin Landing Component
 *  	cognitoService used to logout the current logged in user
 * */
import { Component, Inject, OnInit, HostListener, ViewChild } from "@angular/core";
import { AwsCognitoService } from "../../../auth/aws-cognito.service";
import { UtilService } from "../../../shared/service/util.service";
declare var $ :any;

@Component({
  selector: "",
  templateUrl: "./landing.html",
})

export class CompanyUsersLandingComponent implements OnInit {
  public companyInfo: any;
  public screenWidth: any;
  public screenHeight: any;
  public contentWidth: any;
  public contentMinHeight: any;
  public contentHeight: any;
  public loggedInUser: any;
  public userData: any;
  constructor(private cognitoService: AwsCognitoService, public util: UtilService) {
    this.userData = JSON.parse(atob(localStorage.getItem("USER")));
    // this.screenWidth = window.innerWidth;

  }

  ngOnInit() {

    // this.util.setWindowWidth();
    this.util.setWindowHeight();
    this.getCompanyInfo();
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
  }
  // @HostListener('window:resize') onResize() {
  // 	this.util.setWindowWidth();
  // }


  toggleNav(): void {
    this.util.toggleNavFromUtil();
  }


  getCompanyInfo(): void {
    const self = this;
    this.cognitoService.getCompanyInfo(function (err, res) {
      if (!err) {

        self.companyInfo = res.data;
        self.util.setCompanyId(res.data.company_id);
        self.util.setCompanyName(res.data.company_name);
        self.util.setCurrency(res.data.currency);
        self.util.setCurrencySign(res.data.currency_sign);
        self.util.setCountryCode(self.loggedInUser.country_code);
        self.util.setRole(self.loggedInUser.role_id);
        self.util.setCompanyLogo(res.data.company_logo);

        // self.userRole = JSON.parse(atob(localStorage.getItem("USER"))).role.role_name;
        // self.user.id = JSON.parse(atob(localStorage.getItem("USER"))).id;
        // console.log(JSON.parse(atob(localStorage.getItem("USER"))));
      }
    });
  }

  logout(): void {
    this.cognitoService.logout();
  }
}
