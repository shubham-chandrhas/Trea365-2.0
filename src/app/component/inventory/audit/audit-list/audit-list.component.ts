import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormGroup,
  FormBuilder,
  FormArray
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";

import * as _ from "underscore";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";

import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";

declare var $: any;
@Component({
  selector: "app-audit-list",
  templateUrl: "./audit-list.component.html",
  styleUrls: ["./audit-list.component.css"]
})
export class AuditListComponent implements OnInit {
  public auditLocationList: any = [];
  public sortColumn: string = "audit_id";
  public sortColumnType: string = "N";
  public sortOrder: string = "DSC";
  public searchList: string;
  public searchTxt: string;
  public auditNoSearch;
  public statusSearch;
  public dateSearch;
  public auditorSearch;
  public paginationKey: any;
  public listCount: number = 0;

  public listPaginationKey: any;
  public itemListCount: number = 0;
  public ITEM_COUNT: number = 0;

  public assetSearchTxt: string;
  public assetSearchList: string;
  public assetSortColumn: string = "prod_loc_id";
  public assetSortColumnType: string = "N";
  public assetSortOrder: string = "DSC";
  public mfgSearch;
  public mfgPartSearch;
  public scanCodeSearch;
  public upcSearch;

  public selectedAudit: any = null;
  public selectedIndex;
  public auditListTab: string = "audit";

  public auditList: any = [];
  public auditReport: any = [];
  public auditReportLocationList: any = [];
  public selectedReportAudit: any = null;
  public submitted: boolean = false;
  auditForm: FormGroup;
  public errMsg: string = "";
  public isError: boolean = false;

  public onBoarding:boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    public util: UtilService,
    public constant: ConstantsService,
    public http: HttpService,
    public router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private global: GlobalService,
    @Inject(APP_CONFIG)
    private config: AppConfig
  ) {}

  ngOnInit() {
    this.util.menuChange({ menu: 3, subMenu: 24 });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    window.scrollTo(0, 0);
    this.paginationKey = {
      id: "AuditList",
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.listPaginationKey = {
      id: "AuditItemList",
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.getAuditList();

    this.createForm("0");

    let self = this;
    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source == "AUDIT_REPORT_CONFIRM") {
        self.getAuditList("confirm");
        self.getAuditReportsList("confirm");
        self.selectedReportAudit = null;
        self.selectedAudit = null;
        self.router.navigate(["/inventory/audit/csa/audit-list/0"]);
      }
    });
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
  getAssetSearchTxt(filterValue: string) {
    if (filterValue == "") {
      this.assetSearchTxt = "";
    }
  }
  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }

  //For Product List
  //itemListChangePage(event){this.listPaginationKey.currentPage = event;}
  itemListUpdateCount(count) {
    this.ITEM_COUNT = count;
    this.itemListCount = count;
  }

  getAuditList(confirm_data: any = "") {
    try {
      let self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("inventory/audits", function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.onBoarding = false;
          self.global.addException("Audit list", "getAuditList()", response);
        } else {
          if (response.data) {
            self.auditList = response.data;
            self.route.snapshot.paramMap.get("id") != "0" && confirm_data == ""
              ? self.showAuditDetails()
              : "";
            // console.log("Audit List", self.auditList);
          }
        }

        self.getAuditReportsList();
      });
    } catch (err) {
      this.global.addException("Audit list", "getAuditList()", err);
    }
  }

  getAuditReportsList(confirm_data: any = "") {
    try {
      let self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("inventory/audits/reports", function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.onBoarding = false;
          self.global.addException("Audit list", "getAuditReportsList()", response);
        } else {
          if (response.data) {
            self.auditReport = response.data;
            self.route.snapshot.paramMap.get("id") != "0" && confirm_data == ""
              ? self.showAuditReportDetails()
              : "";
            // console.log("Audit Report", self.auditReport);
          }
          if(self.auditList.length == 0 && self.auditReport.length == 0) {
            self.onBoarding = true;
          }
        }


      });
    } catch (err) {
      this.global.addException("Audit list", "getAuditReportsList()", err);
    }
  }

  changeAuditList(auditList) {
    try {
      this.auditListTab = auditList;
    } catch (err) {
      this.global.addException("Audit list", "changeAuditList()", err);
    }
  }

  showAuditDetails() {
    try {
      let sortedList: any[] = _.sortBy(this.auditList, "audit_id").reverse();
      for (var i = 0; i < sortedList.length; ++i) {
        if (this.route.snapshot.paramMap.get("id") == sortedList[i].audit_id) {
          this.selectAudit(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Audit list", "showAuditDetails()", err);
    }
  }

  showAuditReportDetails() {
    try {
      let sortedList: any[] = _.sortBy(this.auditList, "audit_id").reverse();
      for (var i = 0; i < sortedList.length; ++i) {
        if (this.route.snapshot.paramMap.get("id") == sortedList[i].audit_id) {
          this.selectAuditReport(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Audit list", "showAuditDetails()", err);
    }
  }

  selectAudit(selItem: any, index: number) {
    try {

      this.selectedIndex = index;
      let self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet(
        "inventory/audits/details/" + selItem.audit_id,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
          } else {
            // console.log("MFG List",response.data);
            self.selectedAudit = response.data;
            self.auditLocationList = [];
            if (response.data) {
              self.auditLocationList = [
                ...response.data.assets,
                ...response.data.products,
                ...response.data.materials
              ];
            }
            for (let i = 0; i < self.auditLocationList.length; i++) {
              self.auditLocationList[i].scan_code = self.auditLocationList[i]
                .scan_code
                ? self.auditLocationList[i].scan_code.toString()
                : "";
              self.auditLocationList[i].upc = self.auditLocationList[i].upc
                ? self.auditLocationList[i].upc.toString()
                : "";
            }
            // console.log("MFG List", self.auditLocationList);
            self.location.go(
              self.location
                .path()
                .split("/")
                .splice(0, self.location.path().split("/").length - 1)
                .join("/") +
                "/" +
                self.selectedAudit.audit_id
            );
            setTimeout(function() {
              self.util.scrollDown("auditMark");
            }, 1000);
          }
        }
      );
      this.listPaginationKey = {
        id: "AuditItemList",
        itemsPerPage: this.constant.ITEMS_PER_PAGE,
        currentPage: this.constant.CURRENT_PAGE
      };
    } catch (err) {
      this.global.addException("Audit list", "selectAudit()", err);
    }
  }

  createForm(option, val: any = {}) {
    try {
      this.auditForm = this.fb.group({
        comment: new FormControl(""),
        audit_id: new FormControl(option == "0" ? "" : val.audit_id),
        location_id: new FormControl(option == "0" ? "" : val.location_id),
        audited_items: this.fb.array([])
      });
    } catch (err) {
      this.global.addException("Create Account", "createForm()", err);
    }
  }

  get comment() {
    return this.auditForm.get("comment");
  }
  get audited_items(): FormArray {
    return (<FormArray>this.auditForm.get("audited_items")) as FormArray;
  }

  addItem(option, val: any = {}) {
    try {
      this.audited_items.push(
        this.fb.group({
          location_tag: new FormControl(
            option == "0"
              ? ""
              : val.location_tag.location_tag
              ? val.location_tag.location_tag
              : ""
          ),
          manf_name: new FormControl(option == "0" ? "" : val.manf_name),
          item_definition_name: new FormControl(
            option == "0" ? "" : val.item_definition_name
          ),
          audit_item_id: new FormControl(
            option == "0" ? "" : val.audit_item_id
          ),
          location_tag_id: new FormControl(
            option == "0" ? "" : val.location_tag_id
          ),
          item_id: new FormControl(option == "0" ? "" : val.item_id),
          item_type: new FormControl(option == "0" ? "" : val.item_type),
          is_unlisted: new FormControl(option == "0" ? "" : val.is_unlisted),
          audited_quantity: new FormControl(
            option == "0" ? "" : val.audited_quantity
          ),
          listed_quantity: new FormControl(
            option == "0" ? "" : val.listed_quantity
          ),
          discrepancies: new FormControl(
            option == "0" ? "" : val.discrepancies
          ),
          accept_quantity: new FormControl(
            option == "0" ? "" : val.audited_quantity,
            [Validators.min(0)]
          )
        })
      );
    } catch (err) {
      this.global.addException("Accept Discrepancies", "addItem()", err);
    }
  }

  selectAuditReport(selItem: any, index: number) {
    try {
      this.selectedIndex = index;
      let self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet(
        "inventory/audits/reports/details/" + selItem.audit_id,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
          } else {
            self.selectedReportAudit = response.data;
            // console.log(response.data);
            self.createForm("1", self.selectedReportAudit);
            for (
              let i = 0;
              i < self.selectedReportAudit.audit_items.length;
              i++
            ) {
              self.addItem("1", self.selectedReportAudit.audit_items[i]);
            }
            self.location.go(
              "/inventory/audit/csa/audit-list/" +
                self.selectedReportAudit.audit_id
            );
            setTimeout(function() {
              self.util.scrollDown("auditMark");
            }, 1000);
          }
        }
      );
    } catch (err) {
      this.global.addException("Audit Report list", "selectAuditReport()", err);
    }
  }
  downloadPDF(audit_id): void {
    var pdfLink = this.config.pdfEndpoint+"audit-report/pdf/"+audit_id;
    //this.downloadAPI('exportPDF', "Download as PDF", 'PDF');
    window.open(pdfLink);
  }
//   downloadAPI(btnId, btnTxt, actionDoc){
//     let self = this;
//     self.errMsg = '';
//     self.isError = false;
//     let reqObj: any = {};
//     self.util.addSpinner(btnId, btnTxt);
//     try {
//         this.http.doPost('inventory/audits/create', reqObj, function (error: boolean, response: any) {
//             self.util.removeSpinner(btnId, btnTxt);
//             if (error) {
//                 self.errMsg = response.message;
//                 self.isError = true;
//             } else {
//                 if (btnId == 'exportPDF' || btnId == 'previewBtn') {
//                   var pdfLink = self.config.pdfEndpoint;
//                   if(actionDoc === 'PDF') {
//                     self.downloadPDFDoc(pdfLink);
//                   }
//                 }
//             }
//         });
//         } catch (err) {
//             this.global.addException('Audit Export', 'saveAPICall()', err);
//         }
//     }
// downloadPDFDoc(dataDownload) {
//   window.open(dataDownload);
// }

  accept(form: FormGroup) {
    try {
      this.submitted = true;
      var self = this;
      if (form.valid) {
        let data: any = {
          API_URL: "acceptAuditDiscrepancies",
          reqObj: form.value,
          event: {
            source: "AUDIT_REPORT_CONFIRM",
            action: "CONFIRM"
          }
        };
        this.util.showDialog(
          DialogComponent,
          "Are you sure you want to update these quantities in your inventory? This action cannot be reversed. ",
          [],
          "Accept Discrepancies ?",
          "AUDIT-CONFIRMATION",
          data
        );
      }
    } catch (err) {
      this.global.addException("Accept Discrepancies", "accept()", err);
    }
  }
}
