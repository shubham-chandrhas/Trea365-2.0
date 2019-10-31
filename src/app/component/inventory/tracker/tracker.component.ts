import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import * as _ from "underscore";

import { UtilService } from "../../../shared/service/util.service";
import { AdminService } from "../../admin/admin.service";
import { ExportService } from "../../../shared/service/export.service";
import { HttpService } from "../../../shared/service/http.service";
import { ConstantsService } from "../../../shared/service/constants.service";
import { GlobalService } from "../../../shared/service/global.service";

@Component({
  selector: "app-tracker",
  templateUrl: "./tracker.component.html",
  styleUrls: ["./tracker.component.scss"]
})
export class TrackerComponent implements OnInit {
  pageData: any = {
    productMaterialList: [],
    listCount: 0,
    action: "",
    isEdit: false,
    isError: false
  };
  public sortColumn: string = "company_id";
  public sortColumnType: string = "N";
  public sortOrder: string = "ASC";
  public searchList: string;
  public searchTxt: string;
  public paginationKey: any;
  public listCount: number = 0;
  public selectedIndex: number;
  public errMsg: string = "";
  public isError: boolean = false;
  public submitted: boolean = false;
  public isEdit: boolean = false;
  public selectedProMat: any = null;

  public onBoarding:boolean = false;

  // public invSearch;
  // public minStockSearch;
  // public dateSearch;
  // public currentStockSearch;

  constructor(
    public util: UtilService,
    public constant: ConstantsService,
    private admin: AdminService,
    private http: HttpService,
    private file: ExportService,
    public router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private global: GlobalService
  ) {}

  ngOnInit() {
    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.productMaterialList();
    this.util.setWindowHeight();
    this.util.menuChange({ menu: 3, subMenu: 35 });
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
  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }

  productMaterialList() {
    try {
      let self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("tracker", function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.global.addException("Tracker", "productMaterialList()", response);
        } else {
          self.pageData.productMaterialList = response.data;

          if (self.pageData.productMaterialList.length === 0) {
            self.onBoarding = true;
          }

          self.route.snapshot.paramMap.get("id") != "0"
            ? self.showDetails()
            : "";
        }
        // console.log("tracker dataaaaa====", self.pageData.productMaterialList);
      });
    } catch (err) {
      this.global.addException("Tracker", "productMaterialList()", err);
    }
  }

  showDetails() {
    try {
      let sortedList: any[] = _.sortBy(
        _.sortBy(this.pageData.productMaterialList, "item_def_id").reverse(),
        "runout_date"
      );
      for (var i = 0; i < sortedList.length; ++i) {
        if (
          this.route.snapshot.paramMap.get("id") == sortedList[i].item_def_id
        ) {
          this.getSelectedProductMaterial(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Tracker", "productMaterialList()", err);
    }
  }

  getSelectedProductMaterial(selProMatObj: any, index: number) {
    try {
      let self = this;
      this.selectedProMat = selProMatObj;
      this.isEdit = false;
      this.selectedIndex = index;
      self.location.go(
        self.location
          .path()
          .split("/")
          .splice(0, self.location.path().split("/").length - 1)
          .join("/") +
          "/" +
          selProMatObj.item_def_id
      );
      setTimeout(function() {
        self.util.scrollDown("trackMark");
      }, 1000);
      // console.log("selected product::::" + JSON.stringify(this.selectedProMat));
    } catch (err) {
      this.global.addException("Tracker", "getSelectedProductMaterial()", err);
    }
  }

  viewInventory(selProMatObj: any): void {
    try {
      this.router.navigate([
        selProMatObj.item_type == 1
          ? "/inventory/csa/product-list/"
          : "/inventory/csa/material-list/",
        selProMatObj.item_def_id
      ]);
    } catch (err) {
      this.global.addException("Tracker", "viewInventory()", err);
    }
  }

  newPO(selProMatObj): void {
    try {
      let prodMatObj: any = {
        mfgPartId: selProMatObj.item_def_id
      };
      sessionStorage.setItem("MFG_PART_FOR_NEW_PO", JSON.stringify(prodMatObj));
      this.router.navigate(["/inventory/po/csa/new-purchase-order"]);
    } catch (err) {
      this.global.addException("Tracker", "newPO()", err);
    }
  }
}
