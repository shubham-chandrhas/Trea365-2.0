import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import * as _ from "underscore";

import { UtilService } from "../../../../shared/service/util.service";
import { AdminService } from "../../../admin/admin.service";
import { ExportService } from "../../../../shared/service/export.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { InventoryDialog } from "../../inventory-dialog.component";
import { GlobalService } from "../../../../shared/service/global.service";
@Component({
  selector: "app-receiving-slips-list",
  templateUrl: "./receiving-slips-list.component.html",
  styleUrls: ["./receiving-slips-list.component.scss"]
})
export class ReceivingSlipsListComponent implements OnInit {
  pageData: any = {
    "receivingSlipList": [],
    "listCount": 0,
    "action": "",
    "isEdit": false,
    "isError": false
  };
  public sortColumn = "receiving_slip_id";
  public sortColumnType = "N";
  public sortOrder = "DSC";
  public searchList: string;
  public searchTxt: string;
  public paginationKey: any;
  public listCount = 0;
  public selectedIndex: number;
  public errMsg = "";
  public isError = false;
  public submitted = false;
  public isEdit = false;
  public selectedRS: any = null;

  public rsNoSearch;
  public poNoSearch;
  public dateSearch;
  public supplierSearch;
  public onBoarding = false;
  constructor(
    public dialog: MatDialog,
    public util: UtilService,
    public router: Router,
    public constant: ConstantsService,
    private admin: AdminService,
    private http: HttpService,
    private file: ExportService,
    private route: ActivatedRoute,
    private location: Location,
    private global: GlobalService
  ) {}

  ngOnInit() {
    const self = this;
    this.router.url.split("/")[2] === "csa-onboarding" ?
      this.util.menuChange({
        "menu": "guide",
        "subMenu": ""
      }) : this.util.menuChange({
        "menu": 3,
        "subMenu": 23
      });
    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.receivingSlipList();
  }

  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }
  getSearchTxt(filterValue: string) {
    if (filterValue === "") {
      this.searchTxt = "";
    }
  }
  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }

  addNewRSWithoutPO() {
    try {
      sessionStorage.removeItem("po");
      this.router.navigate(["/inventory/rs/csa/add-receiving-slip"]);
    } catch (err) {
      this.global.addException("RS Add", "addNewRSWithoutPO()", err);
    }
  }

  receivingSlipList() {
    try {
      const self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("receiving-slip/list", function (error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.global.addException("Receiving slip", "receivingSlipList()", response);
        } else {
          self.pageData.receivingSlipList = [];
          self.pageData.receivingSlipList = response.data;
          self.route.snapshot.paramMap.get("id") != "0" ? self.showRSDetails() : "";
          if (self.pageData.receivingSlipList.length === 0) {
            self.onBoarding = true;
          }
        }

      });
    } catch (err) {
      this.global.addException("Receiving slip", "receivingSlipList()", err);
    }
  }

  showRSDetails(): void {
    try {
      const sortedList: any[] = _.sortBy(this.pageData.receivingSlipList, "receiving_slip_id").reverse();
      for (let i = 0; i < sortedList.length; ++i) {
        if (this.route.snapshot.paramMap.get("id") == sortedList[i].receiving_slip_id) {
          this.getSelectedRS(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("RS", "showRSDetails()", err);
    }
  }

  getSelectedRS(selSuppObj: any, index: number) {
    try {

        if(!this.util.canAccess('rs_details'))
        {
            return;
        }
      const self = this;

      this.isEdit = false;
      this.selectedIndex = index;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("receiving-slip/" + selSuppObj.receiving_slip_id + "/details", function (error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response.message);
          self.global.addException("Receiving slip", "getSelectedRS()", response);
        } else {
          self.selectedRS = response.data;
          self.location.go(self.location.path().split("/").splice(0,
            self.location.path().split("/").length - 1).join("/") + "/" + selSuppObj.receiving_slip_id);
          setTimeout(function () {
            self.util.scrollDown("rsMark");
          }, 1000);
        }
      });

    } catch (err) {
      this.global.addException("Receiving slip", "getSelectedRS()", err);
    }
  }

  sortList(columnName: string) {
    this.sortColumn = columnName;
    if (this.sortColumn === columnName) {
        if (this.sortOrder === "ASC") {
          this.sortOrder = "DSC";
        } else {
          this.sortOrder = "ASC";
        }
    } else {
      this.sortOrder = "ASC";
    }
  }

  addNewRS() {
    try {
      this.util.changeEvent(null);
      this.dialog.open(InventoryDialog, {
        data: {
          "action": "purchaseOrderList",
          "redirectPath": ["/inventory/rs/csa/add-receiving-slip"]
        }
      });
    } catch (err) {
      this.global.addException("Tracker", "addNewRS()", err);
    }
  }
}
