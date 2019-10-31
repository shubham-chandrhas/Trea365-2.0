import { Component, OnInit, Inject} from "@angular/core";
import { MatDialog } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import * as _ from "underscore";
import { UtilService } from "../../../../shared/service/util.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { HttpService } from "../../../../shared/service/http.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { OnboardingGuideDialogComponent } from "../../../../component/onboarding/onboarding-guide/onboarding-guide.component";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";

@Component({
  selector: "app-service",
  templateUrl: "./service.component.html",
  styleUrls: ["./service.component.css"]
})
export class ServiceComponent implements OnInit {
  public selectedBusinessNature: any = null;
  public action = "view";
  public selectedIndex: number;
  public businessNatureList: any[] = [];
  public sortColumn = "service_type_id";
  public sortColumnType = "N";
  public sortOrder = "DSC";
  public paginationKey: any;
  public listCount = 0;

  public searchList: string;
  public searchTxt: string;
  public typeSearch;
  public nameSearch;
  public definitionSearch;
  public priceSearch;
  private routeObj: any;

  public onBoarding = false;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    public util: UtilService,
    public constant: ConstantsService,
    public dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpService,
    private global: GlobalService,
    private location: Location
  ) {}

  ngOnInit() {
    const self = this;
    this.util.showProcessing("processing-spinner");
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    try {
      if (this.router.url.split("/")[2] == "csa-onboarding") {
        this.util.menuChange({
          menu: "guide",
          subMenu: ""
        }); // for onboarding dashboard
        this.routeObj = {
          add: "/admin/csa-onboarding/add-service/" + btoa("0"),
          edit: "/admin/csa-onboarding/add-service/" + btoa("1")
        };
      } else {
        this.util.menuChange({
          menu: 2,
          subMenu: 11
        });
        this.routeObj = {
          add: "/admin/csa/add-service/" + btoa("0"),
          edit: "/admin/csa/add-service/" + btoa("1")
        };
      }
      this.paginationKey = {
        itemsPerPage: this.constant.ITEMS_PER_PAGE,
        currentPage: this.constant.CURRENT_PAGE
      };
      this.getBusinessNatureList();
      this.util.changeDetection.subscribe(dataObj => {
        if (dataObj && dataObj.source == "SERVICE_TYPE") {
          self.getBusinessNatureList();
          self.selectedBusinessNature = null;
        }
      });
    } catch (err) {
      this.global.addException("Business Nature", "ngOnInit()", err);
    }
  }

  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }
  getSearchTxt(filterValue: string) {
    if (filterValue == "") {
      this.searchTxt = "";
    }
  }
  sortListType(columnName: string) {
    // this.empList = JSON.parse(JSON.stringify(this.backupList));
    this.sortColumn = columnName;
    if (this.sortColumn === columnName) {
      this.sortOrder = this.sortOrder === "ASC" ? "DSC" : "ASC";
    } else {
      this.sortOrder = "ASC";
    }
  }
  sortListDefination(columnName: string) {
    this.sortColumn = columnName;
    if (this.sortColumn === columnName) {
      this.sortOrder = this.sortOrder === "ASC" ? "DSC" : "ASC";
    } else {
      this.sortOrder = "ASC";
    }
  }
  newBusinessType() {
    try {
      sessionStorage.removeItem("businessNature");
      this.router.navigate([this.routeObj.add]);
    } catch (err) {
      this.global.addException("Business-nature", "newBusinessType()", err);
    }
  }

  // Get Business Nature List
  getBusinessNatureList() {
    const self = this;
    try {
      this.http.doGet("service-type/list", (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException("Service", "getBusinessNatureList()", response);
        } else {
          if (response.data) {
            self.businessNatureList = [];
            self.businessNatureList = response.data;
          }

          if (self.businessNatureList.length == 0) {
            self.onBoarding = true;
          }

          self.route.snapshot.paramMap.get("id") != "0" ?
            self.showBusinessNatureDetails() :
            "";
          // console.log("parsed value==", self.businessNatureList);
        }
      });
    } catch (err) {
      this.global.addException(
        "Service",
        "getBusinessNatureList()",
        err
      );
    }
  }

  showBusinessNatureDetails() {
    try {
      const sortedList: any[] = _.sortBy(
        this.businessNatureList,
        "service_type_id"
      ).reverse();
      for (let i = 0; i < sortedList.length; ++i) {
        if (
          this.route.snapshot.paramMap.get("id") == sortedList[i].service_type_id
        ) {
          this.getSelectedBusinessNature(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException(
        "Business-nature",
        "showBusinessNatureDetails()",
        err
      );
    }
  }

  getSelectedBusinessNature(businessNatureObj: any, index: number) {
    try {
      const self = this;
      this.selectedIndex = index;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("service-type/" + businessNatureObj.service_type_id + "/details", (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
           this.global.addException("Service", "getSelectedBusinessNature()", response);
        } else {
          if (response.data) {
            self.selectedBusinessNature = response.data;
            self.location.go(
              self.location
              .path()
              .split("/")
              .splice(0, self.location.path().split("/").length - 1)
              .join("/") +
              "/" +
              businessNatureObj.service_type_id
            );
            setTimeout(function () {
              self.util.scrollDown("businessNatureMark");
            }, 1000);
          }
        }
      });
    } catch (err) {
      this.global.addException(
        "Business Nature",
        "getSelectedBusinessNature()",
        err
      );
    }
  }

  editBusinessNature() {
    try {
      sessionStorage.setItem(
        "businessNature",
        JSON.stringify(this.selectedBusinessNature)
      );
      this.router.navigate([this.routeObj.edit]);
    } catch (err) {
      this.global.addException("Business Nature", "editBusinessNature()", err);
    }
  }

  deleteBusinessNatureDailog() {
    try {
      const data: any = {
        API_URL: "service-type/delete",
        reqObj: {
          service_type_id: this.selectedBusinessNature.service_type_id
        },
        event: {
          source: "SERVICE_TYPE",
          action: "DELETE"
        }
      };
      this.util.showDialog(
        DialogComponent,
        "Are you sure you want to delete " +
        this.selectedBusinessNature.service_type +
        " ?",
        [],
        "Delete Confirmation ?",
        "CONFIRMATION",
        data
      );
    } catch (err) {
      this.global.addException(
        "Services delete",
        "deleteBusinessNatureDailog()",
        err
      );
    }
  }
  addFromCSV() {
    const self = this;
    let route: string,
      apiEndPoint: string,
      csvTemplateUrl: string,
      redirectUrl: string;
    route = "/csa/csv-preview/service";
    apiEndPoint = "service-type/csv";
    csvTemplateUrl =
      this.config.domainIP + "api/public/download/csv/services.csv";
    redirectUrl = "/admin/csa/service/0";
    self.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("company/download-invalid-data/Service", (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          this.global.addException("services", "addFromCSV()", response);
        } else {
          const invalidUrl = response.data.length > 0 ? `${self.config.domainIP}api/public/download/csv${response.data}` : "";
          self.dialog.open(OnboardingGuideDialogComponent, {
            data: {
              action: "csvUpload",
              route: route,
              apiEndPoint: apiEndPoint,
              csvTemplateUrl: csvTemplateUrl,
              redirectUrl: redirectUrl,
              invalidDataUrl: invalidUrl,

            }
          });
       }
      });
    } catch (err) {
      this.global.addException("services", "addFromCSV()", err);
    }
  }
}
