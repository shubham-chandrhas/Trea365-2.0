/* *
 *     	Company Super Admin Landing Component
 *  	cognitoService used to logout the current logged in user
 * */
// import "rxjs/add/operator/filter";
// import "rxjs/add/operator/pairwise";
import { Component, Inject, OnInit, Renderer } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router } from "@angular/router";

import { AwsCognitoService } from "../../../auth/aws-cognito.service";
import { UtilService } from "../../../shared/service/util.service";
declare var $: any;

@Component({
  selector: "app-onbord-landing",
  templateUrl: "./landing.html",
})

export class CSAOnboardingComponent implements OnInit {
  public companyInfo: any;
  public onboardArrowIcon = false;
  public selL1Menu: string;
  public selL2Menu: string;
  public isPlatform: any;
  public loggedInUser;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private cognitoService: AwsCognitoService,
    public util: UtilService,
    private renderer: Renderer,
    private router: Router
  ) {
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));

  }

  ngOnInit() {
    const self = this;
    this.renderer.setElementClass(document.body, "bg-img", false);
    this.util.newMenuSelection.subscribe(menu => setTimeout(() => {
      if (menu) {
        this.selL1Menu = menu.menu;
        this.selL2Menu = menu.subMenu;
      }
    }, 0));
    this.isPlatform = JSON.parse(atob(localStorage.getItem("USER"))).overall_flag;

    this.util.setLoggedInUserName(this.loggedInUser.last_name ?
      this.loggedInUser.first_name
    + " " + this.loggedInUser.last_name :
    this.loggedInUser.first_name);

    this.toggleArrow();
    this.util.setRole(JSON.parse(atob(localStorage.getItem("USER"))).role.role_id);
    this.util.setRoleName(JSON.parse(atob(localStorage.getItem("USER"))).role.role_name);
    this.util.updatePagination();
  }

  goToAdminDashboard() {
    sessionStorage.setItem("refreshStatus", "1");
    this.router.navigate(["/csa"]);
  }


  toggleArrow(): void {
    this.onboardArrowIcon = !this.onboardArrowIcon;
    this.renderer.setElementClass(document.body, "sidebar-collapse", !this.onboardArrowIcon);
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
      }
    });
  }

  logout(): void {
    this.cognitoService.logout();
  }
}
