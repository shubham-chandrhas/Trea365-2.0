import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
  NgForm,
  AbstractControl
} from "@angular/forms";
import { Location } from "@angular/common";

import { HttpService } from "../../../../shared/service/http.service";
import { UtilService } from "../../../../shared/service/util.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import * as _ from "underscore";

import { ProjectEstimatorService } from "../../project-estimator/project-estimator.service";
import { ProjectEstimatorDialog } from "../project-estimator-dialog.component";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";

import { Observable, Subscription } from 'rxjs';

@Component({
  selector: "app-quotation-list",
  templateUrl: "./quotation-list.component.html",
  styleUrls: ["./quotation-list.component.css"]
})
export class QuotationListComponent implements OnInit {
  pageData: any = {
    QuotationList: [],
    listCount: 0,
    sortColumn: "project_estimate_id",
    sortOrder: "DSC",
    sortColumnType: "N",
    prodDetails: "details",
    action: "",
    isEdit: false,
    isError: false,
    submitted: false
  };
  searchList;
  public sortColumn: string = "project_estimate_id";
  public sortOrder: string = "DSC";
  columnType: string = "N";
  public QuotationList: any = "";
  public selectedQuotation: any = "";
  public versions: any = "";
  public latest: string;
  public clientDetails: any = "";
  public searchTxt: string;
  public paginationKey: any;
  public listCount: number = 0;
  public errMsg: string = "";
  public isError: boolean = false;
  public successMsg: string = "";
  public isSuccess: boolean = false;
  public selectedIndex;
  public versionlist: any = '0';
  public versionData: any = "";
  public statusSearch;
  public dateSearch;
  public clientSearch;
  public followedBySearch;
  public quoteNoSearch;
  inspectionSearch;
  remarkDiv: string = "hide";
  peRemark: string = "";
  loggedInUser: any;
  submittedPay: boolean;
  remarksArr: any = [];
  public onBoarding:boolean = false;
  subscription: Subscription;

  constructor(
    public dialog: MatDialog,
    private http: HttpService,
    public util: UtilService,
    public router: Router,
    private route: ActivatedRoute,
    public constant: ConstantsService,
    private global: GlobalService,
    private PEService: ProjectEstimatorService,
    private location: Location,
    @Inject(APP_CONFIG)
    private config: AppConfig
  ) {}

  ngOnInit() {
    let self = this;
    self.util.menuChange({
      menu: 4,
      subMenu: 25
    });
    self.paginationKey = {
      itemsPerPage: self.constant.ITEMS_PER_PAGE,
      currentPage: self.constant.CURRENT_PAGE
    };
    self.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.getQuotationList("INIT");
    this.subscription =  this.util.changeDetection.subscribe(dataObj => {

      if (dataObj && dataObj.source == "QUOTATION") {
        self.getQuotationList("INIT");
        self.selectedQuotation = null;
      } else if (
        dataObj &&
        (dataObj.source == "SAVE_FOR_FOLLOW_UP" ||
          dataObj.source == "SITE_INSPECTION")
      ) {
        self.getQuotationList("APPROVE", dataObj.data.project_estimate_id);
      } else if (dataObj && (dataObj.source == "APPROVE_PE" || dataObj.source == "REMARK_CREATE" )) {
        self.getQuotationList("APPROVE", dataObj.data.project_estimate_id);
      }
    });
    console.log("Quotation List.....");
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

  addNewQuotation() {
    sessionStorage.removeItem("quotationDetails");
    this.util.setRandomNumber(JSON.stringify(Math.random()));
    this.PEService.projectEstimatorData = {};
    sessionStorage.removeItem("quotationFormFlag");
    this.router.navigate(["/workflow/quote/csa/quotation/services"]);
  }

  getQuotationList(option: string = "REFRESH", id: number = 0) {
    this.selectedIndex = null;
    var self = this;
    self.QuotationList = [];
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("quotation/list", function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
                self.onBoarding = false;
                self.QuotationList = [];
                self.util.showAlert(response.message);
                self.global.addException("PE List", "getQuotationList()", response);
        } else {
          self.QuotationList = response.data;
          self.constant.ITEM_COUNT = response.data.length;
          
          self.route.snapshot.paramMap.get("id") != "0" || option == "APPROVE"
            ? self.showQuotationDetails(option, id)
            : "";
            if(self.QuotationList.length == 0) {
                self.onBoarding = true;
            }
        }

        
      });
    } catch (err) {
      this.global.addException("PE List", "getQuotationList()", err);
    }
  }

  showQuotationDetails(option, id): void {
    let sortedList: any[] = _.sortBy(
      this.QuotationList,
      "project_estimate_id"
    ).reverse();
    if (option == "INIT") {
      for (var i = 0; i < sortedList.length; ++i) {
        if (
          this.route.snapshot.paramMap.get("id") ==
          sortedList[i].project_estimate_id
        ) {
          this.getSelectedQuotation(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } else if ((option == "REFRESH" || option == "APPROVE") && id != 0) {
      for (var i = 0; i < sortedList.length; ++i) {
        if (id == sortedList[i].project_estimate_id) {
          this.getSelectedQuotation(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } else {
      this.getSelectedQuotation(sortedList[0], 0);
      this.selectedIndex = 0;
    }
  }

  getSearchTxt(filterValue: string) {
    if (filterValue == "") {
      this.searchTxt = "";
    }
  }

  clearCR() {
    sessionStorage.removeItem("CrDetails");
  }

  getSelectedQuotation(quotation, index) {

    if(!this.util.canAccess('quotation_details'))
    {
    return;
    }
    var self = this;
    self.selectedQuotation = "";
    self.errMsg = "";
    self.successMsg = "";
    self.latest = "";
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet(
        "quotation/" + quotation.project_estimate_id + "/details",
        function(error: boolean, response: any) {
          if (error) {
            self.global.addException("PE Details", "getSelectedQuotation()", error);
          } else {
            self.selectedQuotation = response.data;
            self.selectedQuotation.pdfLink =
              self.config.pdfEndpoint +
              "quotation/" +
              self.selectedQuotation.pe_random_number +
              "/pdf";
            self.selectedQuotation.preview =
              self.config.pdfEndpoint +
              "quotation/" +
              self.selectedQuotation.pe_random_number;
            self.selectedIndex = index;
            self.util.hideProcessing("processing-spinner");
            self.location.go(
              "/workflow/quote/csa/quotation-list/" +
                quotation.project_estimate_id
            );
            setTimeout(function() {
              self.util.scrollDown("qutationMark");
            }, 1000);
          }
        }
      );
    } catch (err) {
      this.global.addException("PE Details", "getSelectedQuotation()", err);
    }
  }

  calculateCost() {
    var cost: any = {
      cost_of_services: "0.0",
      cost_of_materials: "0.0",
      shipping_and_handling: "0.0",
      adjustment: "0.0",
      subtotal: "0.0",
      taxes: "0.0",
      tax_amount: "0.0",
      total_cost: "0.0"
    };
    console.log(this.selectedQuotation.services);
    console.log(this.selectedQuotation.product_materials);
    if (this.selectedQuotation.services) {
      for (let i = 0; i < this.selectedQuotation.services.length; i++) {
        cost.cost_of_services =
          parseFloat(cost.cost_of_services) +
          parseFloat(this.selectedQuotation.services[i].cost);
      }
    }
    if (this.selectedQuotation.product_materials) {
      for (
        let i = 0;
        i < this.selectedQuotation.product_materials.length;
        i++
      ) {
        cost.cost_of_materials =
          parseFloat(cost.cost_of_materials) +
          parseFloat(this.selectedQuotation.product_materials[i].cost);
      }
    }
    cost.subtotal = cost.total_cost =
      parseFloat(cost.cost_of_services) + parseFloat(cost.cost_of_materials);
    this.selectedQuotation.costs = [cost];
  }

  setVersion(index) {
    var pe_id = this.selectedQuotation.versions[index].project_estimate_id;
    var self = this;
    self.selectedQuotation = "";
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("quotation/" + pe_id + "/details", function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response.error.error);
          self.global.addException("PE Versions", "setVersion()", error);
        } else {
            self.selectedQuotation = response.data;
            self.selectedQuotation.pdfLink =
              self.config.pdfEndpoint +
              "quotation/" +
              self.selectedQuotation.pe_random_number +
              "/pdf";
            self.selectedQuotation.preview =
              self.config.pdfEndpoint +
              "quotation/" +
              self.selectedQuotation.pe_random_number;
        }
      });
    } catch (err) {
      this.global.addException("PE Versions", "setVersion()", err);
    }
  }

  editQuotation(pe_id) {
    var self = this;
    self.selectedQuotation.reviewVersion = [];
    sessionStorage.removeItem("quotationDetails");
    self.PEService.projectEstimatorData = "";
    sessionStorage.removeItem("quotationFormFlag");
    try {
      if (self.versions.length > 0) {
        for (var i = 0; i < self.versions.length; i++) {
          self.selectedQuotation.reviewVersion.push(
            self.PEService.setResponseForPE(self.versions[i])
          );
          self.selectedQuotation.reviewVersion[i] = JSON.parse(
            self.selectedQuotation.reviewVersion[i]
          );
        }
      }
      //self.selectedQuotation.randomKey = JSON.stringify(Math.random());
      self.util.setRandomNumber(JSON.stringify(Math.random()));
      sessionStorage.setItem(
        "quotationDetails",
        self.PEService.setResponseForPE(self.selectedQuotation)
      );
      sessionStorage.setItem(
        "quotationFormFlag",
        JSON.stringify(self.PEService.getFormValidationStatus())
      );
    } catch (err) {
      this.global.addException("Quatation list", "editQuotation()", err);
    }
    self.router.navigate(["/workflow/quote/csa/quotation/services"]);
  }

  deleteQuotation(pe_id) {
    let data: any = {
      API_URL: "quotation/delete",
      reqObj: {
        project_estimate_id: pe_id
      },
      event: {
        source: "QUOTATION",
        action: "DELETE"
      }
    };
    this.util.showDialog(
      DialogComponent,
      "Are you sure you want to delete Quote No: " +
        this.selectedQuotation.project_estimate_no +
        " ?", 
      [],
      "Delete Confirmation ?",
      "CONFIRMATION",
      data
    );
  }

  sendQuote(peId) {
    var self = this;
    this.util.showProcessing("processing-spinner");
    try {
        let reqObj: any = {
            project_estimate_id: peId,
            status: 4
          };
      this.http.doPost('quotation/status/update',reqObj, function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.errMsg = response.message;
          self.isError = true;
        } else {
          if (response.status) {
            self.isSuccess = true;
            self.util.showDialog(DialogComponent, response.message);
            self.getQuotationList("APPROVE", peId);
          } else {
            self.errMsg = response.message;
            self.isError = true;
          }
        }
      });
    } catch (err) {
      this.global.addException("PE sent quote", "sendQuote()", err);
    }
  }

  approvePE(pe_id) {
    var self = this;
    let reqObj: any = {
      project_estimate_id: pe_id,
      status: 5
    };

    self.util.addSpinner("approveBtn", "Approve");
    self.selectedQuotation.reviewVersion = [];
    sessionStorage.removeItem("quotationDetails");
    self.PEService.projectEstimatorData = "";
    sessionStorage.removeItem("quotationFormFlag");
    if (self.versions.length > 0) {
      for (var i = 0; i < self.versions.length; i++) {
        self.selectedQuotation.reviewVersion.push(
          self.PEService.setResponseForPE(self.versions[i])
        );
        self.selectedQuotation.reviewVersion[i] = JSON.parse(
          self.selectedQuotation.reviewVersion[i]
        );
      }
    }
    sessionStorage.setItem(
      "quotationDetails",
      self.PEService.setResponseForPE(self.selectedQuotation)
    );
    sessionStorage.setItem(
      "quotationFormFlag",
      JSON.stringify(self.PEService.getFormValidationStatus())
    );
    
    self.util.removeSpinner("approveBtn", "Approve");
    this.dialog.open(ProjectEstimatorDialog, {
      data: {
        action: "approveConfirmationFromOverView",
        dataObj: "APPROVE_PE",
        project_estimate_id: pe_id,
      },
      autoFocus: false
    });
  }
  showSaveForFollowUpPopup() {
    this.setUpQuotationDetails();
    this.dialog.open(ProjectEstimatorDialog, {
      data: { action: "saveForFollowUp" }
    });
  }

  showSiteInspectionPopup() {
    this.setUpQuotationDetails();
    this.dialog.open(ProjectEstimatorDialog, {
      data: { action: "siteInspection" }
    });
  }

  setUpQuotationDetails() {
    var self = this;
    try {
      self.selectedQuotation.reviewVersion = [];
      sessionStorage.removeItem("quotationDetails");
      self.PEService.projectEstimatorData = "";
      sessionStorage.removeItem("quotationFormFlag");
      sessionStorage.setItem(
        "quotationDetails",
        self.PEService.setResponseForPE(self.selectedQuotation)
      );
      sessionStorage.setItem(
        "quotationFormFlag",
        JSON.stringify(self.PEService.getFormValidationStatus())
      );
    } catch (err) {
      this.global.addException(
        "Quatation list",
        "showSaveForFollowUpPopup()",
        err
      );
    }
  }

  resendMail(emailLog: any) {
    console.log(emailLog);
    let self = this;
    try {
      this.errMsg = "";
      self.util.addSpinner("resendEmail", "Resend");
      this.http.doGet("resend-email/" + emailLog.email_logs_id, function(
        error: boolean,
        response: any
      ) {
        console.log(response);
        self.util.removeSpinner("resendEmail", "Resend");
        if (error) {
          // console.log('error');
          this.errMsg = response.message;
        } else {
          self.util.showDialog(DialogComponent, response.message);
          self.getQuotationList("REFRESH");
          // console.log('no error');
        }
      });
    } catch (err) {
      this.global.addException("Quotation List Component", "resendMail()", err);
    }
  }

  //   Create Work Order From PE
  goToWoSetup(project_estimate_id) {
    try {
      if (project_estimate_id !== null && project_estimate_id !== "") {
        let create_WO_Obj: any = {};
        create_WO_Obj.project_estimate_id = project_estimate_id;
        create_WO_Obj.WO_TYPE = "External Contractor";
        localStorage.setItem("CREATE_WO", JSON.stringify(create_WO_Obj));
        this.router.navigate(["/workflow/wo/csa/wo-setup"]);
      } else {
        this.isError = true;
        this.errMsg = "Please select Valid quotation from the list to proceed.";
      }
    } catch (err) {
      this.global.addException("PE", "goToWoSetup()", err);
    }
  }
  downloadPDF(dataDownload) {
    window.open(dataDownload);
  }
  preview(dataPreview) {
    window.open(dataPreview);
  }
  addRemark() {
    this.remarkDiv = "show";
  }
  saveRemark(formRremark) {
    let self = this;
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
    console.log(this.loggedInUser);
    let userName = this.loggedInUser.first_name;

    let formattedDate = this.getFormattedDate();
    // alert(formattedDate);
    let remarkString = `${formRremark} - by ${userName} on ${formattedDate}`;

    console.log("remark string = ", remarkString);
    try {
        if(formRremark != '')
        {
            let reqObj: any = {};
            //   if (self.selectedQuotation.remarks && self.selectedQuotation.remarks.length > 0) {
            //     for (let item of self.selectedQuotation.remarks) {
            //       this.remarksArr.push({ remarks: item.remarks });
            //     }
            //   } else{
            //     console.log('self.selectedQuotation.remarks  does not have any value');
            //   }
            this.remarksArr.push({ remarks: remarkString });

            reqObj.remarks = this.remarksArr;
            reqObj.project_estimate_id = this.selectedQuotation.project_estimate_id;
            self.isError = false;
            self.errMsg = "";
            self.util.addSpinner("save_remark_btn", "Save");
            console.log("reqObj", reqObj);
            this.util.showProcessing('processing-spinner');

            this.http.doPost("quotation/remark", reqObj, function(
                error: boolean,
                response: any
            ) {
                self.util.hideProcessing('processing-spinner');
                self.util.removeSpinner("save_remark_btn", "Save");
                self.submittedPay = false;
                if (error) {
                console.log("error", response);
                self.isError = true;
                self.errMsg = response.message;
                } else {
                console.log("response = ", response.message);

                // self.util.showDialog(DialogComponent, response.message, ['/workflow/quote/csa/quotation-list/'+self.selectedQuotation.project_estimate_id]);
                self.util.showDialog(DialogComponent, response.message, ['/workflow/quote/csa/quotation-list/0']);
                    self.util.changeEvent({
                    source: "REMARK_CREATE",
                    action: "ADD_REMARK",
                    data: {
                        project_estimate_id: self.selectedQuotation.project_estimate_id
                    }
                    });
                    self.peRemark = "";
                    self.remarksArr = [];
                self.remarkDiv = "hide";
                }
            });
        }
    
    } catch (error) {
      console.log(error);
    }
  }
  getFormattedDate() {
    let currentDate = new Date();
    let date = currentDate.getDate();
    let month = currentDate.getMonth();
    let year = currentDate.getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    let formattedDate = [date, monthNames[month], year].join(" ");
    return formattedDate;
  }
  cancelRemark() {
    this.remarkDiv = 'hide';
    this.peRemark = "";
  }
}
