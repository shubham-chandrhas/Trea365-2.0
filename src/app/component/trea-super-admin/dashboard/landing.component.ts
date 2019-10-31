/* *
 *     	Trea Super Admin Landing Component
 *  	cognitoService used to logout the current logged in user
 * */
import { Component, Inject, OnInit, AfterViewInit, HostListener, ViewChild, Renderer } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router, ActivatedRoute, RoutesRecognized } from "@angular/router";

import { AwsCognitoService } from "../../../auth/aws-cognito.service";
import { UtilService } from "../../../shared/service/util.service";

declare var $: any;

@Component({
  selector: "",
  templateUrl: "./landing.html",
})

export class TSALandingComponent implements OnInit {

  public userData: any;
  public companyInfo: any;
  public onboardArrowIcon: boolean = false;
  public selL1Menu: string;
  public selL2Menu: string;
  public userName: string;
  public routeUrl: string;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private cognitoService: AwsCognitoService,
    public util: UtilService,
    private renderer: Renderer,
    private router: Router
  ) {
    this.routeUrl = this.router.url;
    this.util.updatePagination();
    this.getCurrentUserInfo();
  }

  public getCurrentUserInfo() {
    this.userData = JSON.parse(atob(localStorage.getItem("USER")));
  }

  ngOnInit() {
    const self = this;
    this.renderer.setElementClass(document.body, "bg-img", false);
    this.toggleArrow();
    this.userName = JSON.parse(atob(localStorage.getItem("USER"))).first_name;
    this.util.setRole(JSON.parse(atob(localStorage.getItem("USER"))).role.role_id);
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
        self.util.setCompanyName(res.data.company_display_name);
        self.util.setCurrency(res.data.currency);
        self.util.setCountryCode(JSON.parse(atob(localStorage.getItem("USER"))).country_code);
        console.log(JSON.parse(atob(localStorage.getItem("USER"))).country_code);
        console.log(JSON.parse(atob(localStorage.getItem("USER"))).company_status.is_active);
      }
    });
  }
  setUrl(url) {
    this.routeUrl = url;
  }
  logout(): void {
    this.cognitoService.logout();
  }
}
