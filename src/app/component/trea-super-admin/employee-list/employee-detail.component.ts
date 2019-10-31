import { Component, OnInit, ApplicationRef, Inject } from "@angular/core";
import { MatDialog } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { EmployeeDialog } from "../../hr/employee/employee-dialog.component";
import * as _ from "underscore";
import { OnboardingGuideDialogComponent } from "../../onboarding/onboarding-guide/onboarding-guide.component";
import { HrService } from "../../hr/hr.service";
import { AdminService } from "../../admin/admin.service";
import { UtilService } from "../../../shared/service/util.service";
import { HttpService } from "../../../shared/service/http.service";
import { ExportService } from "../../../shared/service/export.service";
import { ConstantsService } from "../../../shared/service/constants.service";
import { DialogComponent } from "../../../shared/model/dialog/dialog.component";
import { GlobalService } from "../../../shared/service/global.service";
import { AppConfig, APP_CONFIG } from "../../../app-config.module";

@Component({
  selector: "app-employee-detail",
  templateUrl: "./employee-detail.component.html",
  styleUrls: ["./employee-detail.component.scss"]
})
export class EmployeeDetailComponent implements OnInit {
  pageData: any = {
    empList: [],
    fields: [],
    listCount: 0,
    sortColumn: "id",
    sortColumnType: "N",
    sortOrder: "DSC",
    isEdit: false,
    isError: false,
    additionalFieldSearchTxt: "",
    additionalFieldSearchKey: "",
    permissionAvailability: true,
    companyId: ""
  };
  searchTxt;
  searchList;
  isTSA: boolean = false; //if Trea Super Admin is logged in
  routStrArr;
  loggedInUser;
  tableWidth: string = "auto";
  //defaultLocation : string = "";
  searchKeywords: string =
    "employee_id,name,title,role_name,email_id,work_phone,permission_role_name";
  assinedAssetList: any = [];
  assinedAssetListObj: any;
  public onBoarding:boolean = false;
  constructor(
    @Inject(APP_CONFIG)
    private config: AppConfig,
    public router: Router,
    private route: ActivatedRoute,
    public util: UtilService,
    public dialog: MatDialog,
    private hr: HrService,
    private http: HttpService,
    private admin: AdminService,
    private exportDoc: ExportService,
    public constant: ConstantsService,
    private ref: ApplicationRef,
    private global: GlobalService,
    private location: Location
  ) {}

  ngOnInit() {
    const self = this;
    try {
      this.pageData.paginationKey = {
        itemsPerPage: this.constant.ITEMS_PER_PAGE,
        currentPage: this.constant.CURRENT_PAGE
      };
      this.pageData.companyId = this.route.snapshot.paramMap.get("compId");
      this.routStrArr = this.router.url.split("/");
      this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
      this.getCompanyName(this.pageData.companyId);
      this.router.url.split("/")[2] == "csa-onboarding"
        ? this.util.menuChange({ menu: "guide", subMenu: "" })
        : this.util.menuChange({ menu: 6, subMenu: 28 });
      this.util.setWindowHeight();
      this.util.setPageTitle(this.route);
      this.getEmpList(this.pageData.companyId);
        this.isTSA = true;


      this.admin.newRecord.subscribe(status => {
        if (status) {
          self.getEmpList(this.pageData.companyId);
            self.isTSA = true;

          self.pageData.selectedEmp = self.pageData.selectedIndex = null;
        }
      });

      this.util.changeDetection.subscribe(dataObj => {
        if (dataObj && dataObj.source == "EMPLOYEE") {
          this.getEmpList(this.pageData.companyId);
            this.isTSA = true;
          self.pageData.selectedEmp = self.pageData.selectedIndex = null;
        }
      });


    } catch (err) {
      this.global.addException("employee list", "ngOnInit()", err);
    }
  }
  getCompanyName(companyId) {
    this.http.doGet(`company/${companyId}/detail`, ((error: boolean, response: any)  => {
      this.util.hideProcessing("processing-spinner");
      if (error) {
        this.global.addException("empdetails", "getCompanyName()", response);
      } else {
        this.util.setCompanyName(response.data.company_name ? response.data.company_name : "")
      }

    }));
  }
  getEmpFields(id: any = "") {
    let self = this;
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet(
        id ? "extrafields/" + id + "?type=emp" : "extrafields?type=emp",
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
          } else {
            self.pageData.fields = response.data.additional_emp_fields
              ? response.data.additional_emp_fields
              : [];
            self.tableWidth =
              self.pageData.fields.length > 0
                ? 1650 + 180 * self.pageData.fields.length + "px"
                : "auto";
          }
        }
      );
    } catch (err) {
      this.global.addException("employee list", "getEmpFields()", err);
    }
  }

  getEmpList(id: any = "") {
    const self = this;
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet(`company/users-list/${id}`,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            console.log(response);
          } else {
            self.pageData.empList = response.data
          }

          if(self.pageData.empList.length == 0) {
            self.onBoarding = true;
          }
        }
      );
    } catch (err) {
      this.global.addException("employee list", "getEmpList()", err);
    }
  }

  getAdditionalFieldData(dataType, data): any {
    switch (dataType) {
      case "Number":
        return parseInt(data);
      case "Decimal":
        return parseFloat(data);
      default:
        return data;
    }
  }

  showEmpDetails() {
    let sortedList: any[] = _.sortBy(this.pageData.empList, "id").reverse();
    for (var i = 0; i < sortedList.length; ++i) {
      if (this.route.snapshot.paramMap.get("id") == sortedList[i].id) {
        this.getSelectedEmp(sortedList[i], i);
        this.pageData.selectedIndex = i;
        break;
      }
    }
  }

  getSelectedEmp(emp, indx) {
    try {
      const self = this;
      this.pageData.selectedEmp = JSON.parse(JSON.stringify(emp));
      this.pageData.empDetails = "details";
      this.pageData.empBackup = JSON.parse(
        JSON.stringify(this.pageData.selectedEmp)
      );
      self.location.go(
        self.location
          .path()
          .split("/")
          .splice(0, self.location.path().split("/").length - 1)
          .join("/") +
          "/" +
          emp.id
      );
      setTimeout(function() {
        self.util.scrollDown("empMark");
      }, 1000);
    } catch (err) {
      this.global.addException("employee list", "getSelectedEmp()", err);
    }
  }
  getAssignedAssets(emp, indx) {
    const self = this;
    // console.log('assigned === ', emp.assigned_assets);
    this.assinedAssetListObj = emp.assigned_assets;
    console.log("this.assinedAssetListObj === ", JSON.stringify(this.assinedAssetListObj));
  }

  checkAssignedWO(): void {
    let self = this;
    self.util.addSpinner("delete-btn", "Delete");
    this.http.doGet(
      "getAllWorkOrders/person/" + this.pageData.selectedEmp.id,
      function(error: boolean, response: any) {
        self.util.removeSpinner("delete-btn", "Delete");
        if (error) {
          console.log(response);
        } else {
          self.pageData.selectedEmp.assignedWO = response.data.work_orders;
          self.pageData.empBackup = JSON.parse(
            JSON.stringify(self.pageData.selectedEmp)
          );
        }
      }
    );
  }

  create2DList(list) {
    let listCont = 0,
      imgArr = [],
      inArr = [];
    try {
      while (listCont < list.length) {
        let count = 0;
        inArr = [];
        while (count < 3 && listCont < list.length) {
          inArr.push(list[listCont]);
          count++;
          listCont++;
        }
        imgArr.push({ inArray: inArr });
      }
      return imgArr;
    } catch (err) {
      this.global.addException("employee list", "create2DList()", err);
    }
  }

  showDetails(option) {
    this.pageData.empDetails = option;
    this.pageData.selectedEmp = JSON.parse(
      JSON.stringify(this.pageData.empBackup)
    );
  }
  showSchedule(option) {
    this.pageData.empDetails = option;
    this.pageData.selectedEmp = JSON.parse(
      JSON.stringify(this.pageData.empBackup)
    );
  }
  showAssets(option) {
    this.pageData.empDetails = option;
    this.pageData.selectedEmp = JSON.parse(
      JSON.stringify(this.pageData.empBackup)
    );
  }

  editEmp() {
    try {
      sessionStorage.setItem("emp", JSON.stringify(this.pageData.selectedEmp));
      sessionStorage.setItem("previousPage", "list");
      if (this.loggedInUser.role_id == "1") {
        this.router.navigate(["/su/tsa/add-user/" + this.pageData.companyId]);
      } else {
        this.router.url.split("/")[2] == "csa-onboarding"
          ? this.router.navigate(["/hr/csa-onboarding/new-employee"])
          : this.router.navigate(["/hr/csa/new-employee"]);
      }
    } catch (err) {
      this.global.addException("employee list", "editEmp()", err);
    }
  }

  getSearchTxt(filterValue: string) {
    if (filterValue == "") {
      this.pageData.searchTxt = "";
    }
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = this.pageData.listCount = count;
  }
  addEmp() {
    try {
      sessionStorage.removeItem("emp");
      sessionStorage.setItem("previousPage", "list");
      this.util.setDocumentObj([]);
      if (this.loggedInUser.role_id == "1") {
        this.router.navigate(["/su/tsa/add-user/" + this.pageData.companyId]);
      } else {
        this.router.url.split("/")[2] == "csa-onboarding"
          ? this.router.navigate(["/hr/csa-onboarding/new-employee"])
          : this.router.navigate(["/hr/csa/new-employee"]);
      }
    } catch (err) {
      this.global.addException("employee list", "addEmp()", err);
    }
  }
  addFromCSV() {
    let route: string,
      apiEndPoint: string,
      csvTemplateUrl: string,
      redirectUrl: string;
    route = "/csa-onboarding/csv-preview/employee";
    apiEndPoint = "employee/csv";
    csvTemplateUrl = this.config.domainIP + "api/download/csv/employee.csv";
    redirectUrl = "/csa/employee-list/0";
    redirectUrl = "/hr/csa/employee-list/0";
    this.dialog.open(OnboardingGuideDialogComponent, {
      data: {
        action: "csvUpload",
        route: route,
        apiEndPoint: apiEndPoint,
        csvTemplateUrl: csvTemplateUrl,
        redirectUrl: redirectUrl
      }
    });
  }
  exportEmpAsPdf() {
    this.exportDoc.generateLandscapepdf(
      "empTbl",
      "Employee List",
      "employee_details"
    );
  }
  exportEmpAsCSV() {
    this.exportDoc.generatecsv("empTbl", "employee_details");
  }
  resetPassword() {
    this.dialog.open(EmployeeDialog, {
      data: {
        action: "resetPassword",
        empUsername: this.pageData.selectedEmp.username
      },
      autoFocus: false
    });
    // this.ref.tick();
  }
  addFields() {
    console.log(this.pageData);
    this.dialog.open(OnboardingGuideDialogComponent, {
      data: {
        action: "addFields",
        fields: JSON.parse(JSON.stringify(this.pageData.fields)),
        fieldType: "emp",
        msgHeader: "Employee"
      },
      autoFocus: false,
      panelClass: "custom-width"
    });
  }
  deleteEmployee() {
    let url;
    this.loggedInUser.role_id == "1"
      ? (url = "user/delete/" + this.pageData.companyId)
      : (url = "user/delete");
    const data: any = {
      API_URL: url,
      reqObj: {
        user_id: this.pageData.selectedEmp.id,
        userType: "EMPLOYEE"
      },
      event: {
        source: "EMPLOYEE",
        action: "DELETE"
      },
      // assignedWO: this.pageData.selectedEmp.assignedWO
    };
     this.util.showDialog(
          DialogComponent, "Are you sure want to delete?", [],
          "Delete " + this.pageData.selectedEmp.first_name + " ?",
          "CONFIRMATION_WITH_WARNING",
          data
        );
  }

  showImage(url) {
    this.dialog.open(DialogComponent, { data: { action: "image", url: url } });
    this.ref.tick();
  }
}
