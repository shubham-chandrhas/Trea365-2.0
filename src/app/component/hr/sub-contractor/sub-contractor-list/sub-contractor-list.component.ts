import { Component, OnInit, ApplicationRef, Inject } from "@angular/core";
import { MatDialog } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import * as _ from "underscore";

import { OnboardingGuideDialogComponent } from "../../../onboarding/onboarding-guide/onboarding-guide.component";
import { HrService } from "../../hr.service";
import { AdminService } from "../../../admin/admin.service";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ExportService } from "../../../../shared/service/export.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { GlobalService } from "../../../../shared/service/global.service";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";
import { EmployeeDialog } from "../../employee/employee-dialog.component";
@Component({
    selector: "app-sub-contractor-list",
    templateUrl: "./sub-contractor-list.component.html",
    styleUrls: ["./sub-contractor-list.component.css"]
  })
export class SubContractorListComponent implements OnInit {
    empyDetail: any;
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
    searchKeywords: string =
        "name,title,user_service_type,hourly_cost,email_id,mobile_no";
    assinedAssetList: any = [];
    assinedAssetListObj: any;
    public onBoarding: boolean = false;

    wage_frequencies_array = [
        { 1: 'Hourly' },
        { 2: 'Weekly' },
        { 3: 'Bi-Weekly' },
        { 4: 'Monthly' }
    ];

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
        private location: Location,
    ) { }

    ngOnInit() {
        let self = this;



        try {

            this.pageData.paginationKey = {
                itemsPerPage: this.constant.ITEMS_PER_PAGE,
                currentPage: this.constant.CURRENT_PAGE
            };
            this.pageData.companyId = this.route.snapshot.paramMap.get("compId");
            this.routStrArr = this.router.url.split("/");
            this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
            this.router.url.split("/")[2] == "csa-onboarding"
                ? this.util.menuChange({ menu: "guide", subMenu: "" })
                : this.util.menuChange({ menu: 6, subMenu: 29 });
            this.util.setWindowHeight();
            this.util.setPageTitle(this.route);
            this.getEmpList();
            this.loggedInUser.role_id == "1"
                ? this.getEmpFields(this.pageData.companyId)
                : this.getEmpFields();

            this.admin.newRecord.subscribe(status => {
                if (status) {
                    self.loggedInUser.role_id == "1"
                        ? self.getEmpFields(this.pageData.companyId)
                        : self.getEmpFields();
                    self.loggedInUser.role_id == "1"
                        ? (self.getEmpList(this.pageData.companyId), (self.isTSA = true))
                        : self.getEmpList();
                    self.pageData.selectedEmp = self.pageData.selectedIndex = null;
                }
            });

            this.util.changeDetection.subscribe(dataObj => {
                if (dataObj && dataObj.source == "SUB_CONTRACTOR") {
                    this.loggedInUser.role_id == "1"
                        ? (this.getEmpList(this.pageData.companyId), (this.isTSA = true))
                        : this.getEmpList();
                    self.pageData.selectedEmp = self.pageData.selectedIndex = null;
                }
            });

            this.loggedInUser.role_id == "1"
                ? this.checkPermissionAvailability()
                : "";
        } catch (err) {
            this.global.addException("employee list", "ngOnInit()", err);
        }
    }

    checkPermissionAvailability(): void {
        let self = this;
        this.http.doGet(
            "check-company-permissions/" + this.pageData.companyId,
            function (error: boolean, response: any) {
                if (!error) {
                    self.pageData.permissionAvailability =
                        response.data.available == 1 ? true : false;
                }
            }
        );
    }

    /**
     * Redirect on timeline
     */
    showScheduleTimeline(item) {
        
        item['user_id'] = this.pageData.selectedEmp.updateFormData.id;

        this.util.changeEvent({
            source : 'SHOW_SCHEDULES',
            data   : item
        });

        this.router.navigateByUrl('workflow/schedule/csa/schedule-timeline');
    }

    getEmpFields(id: any = "4") {
        let self = this;

        this.util.showProcessing("processing-spinner");
        try {
            this.http.doGet(
                // id ? "extrafields/" + id + "?type=emp" : "extrafields?type=emp",
                "extra-fields/" + id,
                function (error: boolean, response: any) {
                    self.util.hideProcessing("processing-spinner");
                    if (error) {
                        self.util.showAlert(response.message);
                    } else {
                        self.pageData.fields = response.data
                            ? response.data
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
        let self = this;
        this.util.showProcessing("processing-spinner");
        try {
            this.http.doGet("hr/sub-contractors",
                function (error: boolean, response: any) {
                  
                    if (error) { 
                        self.onBoarding = false;
                        self.pageData.empList = [];
                        self.util.hideProcessing("processing-spinner");
                        self.util.showAlert(response.message);
                        self.global.addException("Subcontactors List", "getEmpList()", response);
                    } else {
                        self.pageData.empList = response.data;
                        if (self.pageData.empList.length == 0) {
                            self.onBoarding = true;
                        }
                        self.util.hideProcessing("processing-spinner");
                    }
                    
                }
            );
        } catch (err) {
            this.global.addException("Subcontactors list", "getEmpList()", err);
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
        
        if (!this.util.canAccess('subcontractor_details')) {
            return false;
        }

        let self = this;
        this.util.showProcessing("processing-spinner");
        try {
            let self = this;
            this.http.doGet("hr/sub-contractors/details/" + emp.id,
                function (error: boolean, response: any) {
                    self.util.hideProcessing("processing-spinner");
                    if (error) {self.pageData.selectedEmp = '';} else {
                        self.pageData.selectedEmp = response.data;
                        self.pageData.empDetails = "details";

                        self.location.go(
                            self.location
                                .path()
                                .split("/")
                                .splice(0, self.location.path().split("/").length - 1)
                                .join("/") +
                            "/" +
                            emp.id
                        );
                        setTimeout(function () {
                            self.util.scrollDown("empMark");
                        }, 1000);
                    }
                }
            );

        } catch (err) {
            this.global.addException("employee list", "getSelectedEmp()", err);
        }
    }
    getAssignedAssets(emp, indx) {
        var self = this;
        this.assinedAssetListObj = emp.assigned_assets;
    }

    checkAssignedWO(): void {
        let self = this;
        self.util.addSpinner("delete-btn", "Delete");
        this.http.doGet(
            "getAllWorkOrders/person/" + this.pageData.selectedEmp.id,
            function (error: boolean, response: any) {
                self.util.removeSpinner("delete-btn", "Delete");
                if (error) {} else {
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
    }

    showSchedule(option) {
        this.pageData.empDetails = option;
    }
    showAssets(option) {
        this.pageData.empDetails = option;
    }

    editEmp() {
        try {
            sessionStorage.setItem("SUBCONTRACTOR_ADD", JSON.stringify(this.pageData.selectedEmp.updateFormData));
            sessionStorage.setItem("previousPage", "list");
            if (this.loggedInUser.role_id == "1") {
                this.router.navigate(["/su/tsa/add-user/" + this.pageData.companyId]);
            } else {
                this.router.url.split("/")[2] == "csa-onboarding"
                    ? this.router.navigate(["/hr/csa-onboarding/add-subcontractor"])
                    : this.router.navigate(["/hr/csa/add-subcontractor"]);
            } 
        } catch (err) {
            this.global.addException("Subcontractor list", "editEmp()", err);
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
            sessionStorage.removeItem("SUBCONTRACTOR_ADD");
            sessionStorage.setItem("previousPage", "list");
            this.util.setDocumentObj([]);
            if (this.loggedInUser.role_id == "1") {
                this.router.navigate(["/su/tsa/add-user/" + this.pageData.companyId]);
            } else {
                this.router.url.split("/")[2] == "csa-onboarding"
                    ? this.router.navigate(["/hr/csa-onboarding/add-subcontractor"])
                    : this.router.navigate(["/hr/csa/add-subcontractor"]);
            }
        } catch (err) {
            this.global.addException("Subcontractor list", "addEmp()", err);
        }
    }
    addFromCSV() {
        let route: string,
            apiEndPoint: string,
            csvTemplateUrl: string,
            redirectUrl: string;
        route = "/csa-onboarding/csv-preview/employee";
        apiEndPoint = "hr/employees/csv";
        csvTemplateUrl = this.config.domainIP + "api/download/csv/employee.csv";
        redirectUrl = "/csa/sub-contractor-list/0";
        redirectUrl = "/hr/csa/sub-contractor-list/0";
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
            reset_message: "Reset the subcontractor's password?",
            empUsername: this.pageData.selectedEmp.updateFormData.username
          },
          autoFocus: false
        });
        //this.ref.tick();
      }
    addFields() {
        this.dialog.open(OnboardingGuideDialogComponent, {
            data: {
                action: "addFields",
                fields: JSON.parse(JSON.stringify(this.pageData.fields)),
                fieldType: "subcont",
                msgHeader: "Sub-contractor",
                userType : 4
            },
            autoFocus: false,
            panelClass: "custom-width"
        });
    }

    deleteEmployee() {

        let url;
        this.loggedInUser.role_id == "1"
        ? (url = "hr/sub-contractors/delete/" + this.pageData.updateFormData.company_id)
        : (url = "hr/sub-contractors/delete");
        let data: any = {
            API_URL: url,
            reqObj: {
                subcont_id  : this.pageData.selectedEmp.updateFormData.id,
                userType    : "SUB-CONTRACTOR"
            },
            event: {
                source: "SUB_CONTRACTOR",
                action: "DELETE"
            },
            assignedWO: this.pageData.selectedEmp.detailsPage.schedule_list
        };
        this.pageData.selectedEmp.detailsPage.schedule_list.length == 0
        ? this.util.showDialog(
            DialogComponent,
            "Are you sure you want to delete " +
            this.pageData.selectedEmp.updateFormData.first_name+" ?",
            ['hr/csa/sub-contractor-list/0'],
            "Delete Confirmation ?",
            "CONFIRMATION",
            data
            )
        : this.util.showDialog(
            DialogComponent,
            this.pageData.selectedEmp.updateFormData.first_name +
                " is assigned to the following work orders:",
            ['hr/csa/sub-contractor-list/0'],
            "Delete " + this.pageData.selectedEmp.updateFormData.first_name + " ?",
            "CONFIRMATION_WITH_WARNING",
            data
            );
    }

    showImage(url) {
        this.dialog.open(DialogComponent, { data: { action: "image", url: url } });
        this.ref.tick();
    }
}
