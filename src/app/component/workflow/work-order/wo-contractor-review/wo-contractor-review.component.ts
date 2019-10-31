import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from "@angular/forms";
import { Observable } from "rxjs";
import { startWith ,  map } from "rxjs/operators";
import { ElementRef, NgZone, ViewChild } from "@angular/core";

import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { ConstantsService } from "../../../../shared/service/constants.service";

import { WorkOrderDialog } from "../work-order-dialog.component";
import { WorkOrderService } from "../work-order.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { APP_CONFIG, AppConfig } from "../../../../app-config.module";


@Component({
  selector: "app-wo-contractor-review",
  templateUrl: "./wo-contractor-review.component.html",
  styleUrls: ["./wo-contractor-review.component.scss"]
})
export class WoContractorReviewComponent implements OnInit {

  public userInfo: any;
  today: number = Date.now();
  public subContractor: any = {};
  private routeObj: any;
  public isExternalWO = false;
  public errMsg = "";
  public isError = false;
  public isBack = false;
  public isEdit = false;
  public WOSubContractorObj: any = {};
  public repeatOn: any[] = [];
  constructor(
    public dialog: MatDialog,
    public util: UtilService,
    public http: HttpService,
    public global: GlobalService,
    public router: Router,
    private fb: FormBuilder,
    public constant: ConstantsService,
    private WOService: WorkOrderService,
    public route: ActivatedRoute,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {
    // console.log("CREATE_WO", localStorage.getItem("CREATE_WO"));
    if (localStorage.getItem("CREATE_WO")) {
      this.WOSubContractorObj = JSON.parse(localStorage.getItem("CREATE_WO"));
      // console.log("this.WOSubContractorObj", this.WOSubContractorObj);

      if (this.WOSubContractorObj.WO_TYPE === "Internal Contractor") {
        this.subContractor.generated_by = JSON.parse(atob(localStorage.getItem("USER")));

      } else {

      }
    }
  }

  ngOnInit() {
    this.util.menuChange({
      "menu": 4,
      "subMenu": 26
    });
    this.util.setPageTitle(this.route);
    window.scrollTo(0, 0);
    if (localStorage.getItem("USER")) {
      this.userInfo = JSON.parse(atob(localStorage.getItem("USER")));
    }
    if (sessionStorage.getItem("WO_CONTRACTOR_DETAILS")) {
      this.subContractor = JSON.parse(sessionStorage.getItem("WO_CONTRACTOR_DETAILS"));
    }
    this.isEdit = this.WOSubContractorObj.WO_TYPE === "Edit Contractor" ? true : false;
    // console.log( this.subContractor, JSON.parse(sessionStorage.getItem("WO_CONTRACTOR_DETAILS")));
  }
  createNewWorkOrder() {
    const self = this;
    try {
      let reqObj: any = {};
      reqObj = JSON.parse(JSON.stringify(this.subContractor));
      reqObj.paymentSchedules = this.subContractor.payment_schedules;
      delete reqObj.payment_schedules;
      reqObj.shipping_and_handling = this.subContractor.shipping_handling;
      delete reqObj.shipping_handling;
      delete reqObj.schedules;
      reqObj.subtotal = this.subContractor.sub_total;
      reqObj.schedule = this.subContractor.schedules;
      if (reqObj.repairInfo) {
        reqObj.maintenance_request_id = reqObj.repairInfo ? reqObj.repairInfo.maintenance_request_id : "";
        reqObj.is_repairing_asset = reqObj.repairInfo ? reqObj.repairInfo.maintenance_request_id ? 1 : 0 : "";
        reqObj.asset_id = reqObj.repairInfo ? reqObj.repairInfo.asset_id : "";
      }

      // console.log("Request Ext WO", reqObj, JSON.stringify(reqObj));
      self.util.addSpinner("saveWorkOrder", "Submit");
      if (this.WOSubContractorObj.WO_TYPE === "Edit Contractor") {
        this.http.doPost("work-order/save", reqObj, function (error: boolean, response: any) {
          self.util.removeSpinner("saveWorkOrder", "Submit");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            // console.log("Ext Work Order Edited", response);
            localStorage.removeItem("CREATE_WO");
            sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
            self.util.showDialog(DialogComponent, response.message, ["/workflow/wo/csa/work-order-list/0"]);

          }
        });
      } else {
        this.http.doPost("work-order/save", reqObj, function (error: boolean, response: any) {
          self.util.removeSpinner("saveWorkOrder", "Submit");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            // console.log("Ext Work Order Created", response);
            localStorage.removeItem("CREATE_WO");
            sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
            self.util.showDialog(DialogComponent, response.message, ["/workflow/wo/csa/work-order-list/0"]);

          }
        });
      }



    } catch (err) {
      this.global.addException("External Work Order", "createExtWorkOrder()", err);
    }
  }

  edit() {
    // console.log( this.subContractor, JSON.parse(sessionStorage.getItem("WO_CONTRACTOR_DETAILS")));
    this.router.navigate(["/workflow/wo/csa/wo-sub-contractor"]);
  }

  previewDoc(): void {
    this.previewDataSave("previewBtn", "Preview", "PREVIEW");
  }

  downloadPDF(): void {
    this.previewDataSave("downloadPDF", "Download as PDF", "PDF");
  }

  previewDataSave(btnId, btnTxt, actionDoc) {
    const self = this;
    try {
      let reqObj: any = {};
      reqObj = JSON.parse(JSON.stringify(this.subContractor));
      reqObj.paymentSchedules = this.subContractor.payment_schedules;
      delete reqObj.payment_schedules;
      reqObj.shipping_and_handling = this.subContractor.shipping_handling;
      delete reqObj.shipping_handling;
      delete reqObj.schedules;
      reqObj.subtotal = this.subContractor.sub_total;
      reqObj.schedule = this.subContractor.schedules;
      if (reqObj.repairInfo) {
        reqObj.maintenance_request_id = reqObj.repairInfo ? reqObj.repairInfo.maintenance_request_id : "";
        reqObj.is_repairing_asset = reqObj.repairInfo ? reqObj.repairInfo.maintenance_request_id ? 1 : 0 : "";
        reqObj.asset_id = reqObj.repairInfo ? reqObj.repairInfo.asset_id : "";
      }

      // console.log("Request Ext WO", reqObj, JSON.stringify(reqObj));
      self.util.addSpinner(btnId, btnTxt);
      if (this.WOSubContractorObj.WO_TYPE === "Edit Contractor") {
        this.http.doPost("work-order/save", reqObj, function (error: boolean, response: any) {
          self.util.removeSpinner(btnId, btnTxt);
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            // console.log("Ext Work Order Edited", response);
            localStorage.removeItem("CREATE_WO");
            sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
            self.util.showDialog(DialogComponent, response.message, ["/workflow/wo/csa/work-order-list/0"]);

          }
        });
      } else {
        this.http.doPost("work-order/save", reqObj, function (error: boolean, response: any) {
          self.util.removeSpinner(btnId, btnTxt);
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            // console.log("Ext Work Order Created", response);
            localStorage.removeItem("CREATE_WO");
            // sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
            let WO_CONTRACTOR_DETAILS: any = {};
            WO_CONTRACTOR_DETAILS = JSON.parse(sessionStorage.getItem("WO_CONTRACTOR_DETAILS"));
            console.log(WO_CONTRACTOR_DETAILS);
            let wo_id: number = response.data.work_order_id;
            WO_CONTRACTOR_DETAILS.work_order_id = wo_id;
            WO_CONTRACTOR_DETAILS.services = response.data.services;
            WO_CONTRACTOR_DETAILS.schedules[0] = response.data.schedule;
            WO_CONTRACTOR_DETAILS.payment_schedules = response.data.payment_schedule;
    console.log(WO_CONTRACTOR_DETAILS);
            sessionStorage.setItem(
              "WO_CONTRACTOR_DETAILS",
              JSON.stringify(WO_CONTRACTOR_DETAILS)
            );
            const randomNo = response.data.wo_random_number;

            self.subContractor = JSON.parse(sessionStorage.getItem("WO_CONTRACTOR_DETAILS"));
            
            const pdfLink =
              self.config.pdfEndpoint +
              "work-order/" + randomNo +
              "/pdf";
            const previewLink =
              self.config.pdfEndpoint +
              "work-order/" +
              randomNo;

            if (actionDoc === "PDF") {
              self.downloadPDFDoc(pdfLink);
              //return;
            } else if (actionDoc === "PREVIEW") {
              self.preview(previewLink);
              //return;
            } else {

            }
            //self.util.showDialog(DialogComponent, response.message, ["/workflow/wo/csa/work-order-list/0"]);

          }
        });
      }
    } catch (err) {
      this.global.addException("External Work Order", "previewDataSave()", err);
    }
  }
  downloadPDFDoc(dataDownload) {
    window.open(dataDownload);
  }
  preview(dataPreview) {
    window.open(dataPreview);
  }

}
