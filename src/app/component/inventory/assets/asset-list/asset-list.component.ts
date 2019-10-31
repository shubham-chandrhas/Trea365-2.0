import { Component, OnInit, ApplicationRef, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import {FormControl, Validators, FormGroup, FormBuilder } from "@angular/forms";
import { Location } from "@angular/common";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { AdminService } from "../../../admin/admin.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { InventoryDialog} from "../../inventory-dialog.component";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";
import { MaintenanceDialog } from "../../maintenance/maintenance-list/maintenance-list.component";
import { ExportService } from "../../../../shared/service/export.service";
import * as _ from "underscore";
import { OnboardingGuideDialogComponent } from "../../../onboarding/onboarding-guide/onboarding-guide.component";
import { constants } from 'os';
declare var jQuery: any;
declare var $: any;
@Component({
  selector: "app-asset-list",
  templateUrl: "./asset-list.component.html",
  styleUrls: ["./asset-list.component.css"]
})
export class AssetListComponent implements OnInit {
  pageData: any = {
    addOption: "WithPO",
    manufacturerPartList: [],
    manufacturerList: [],
    supplierList: [],
    submitted: false,
    selectedVal: {},
    selectedMfgPart: null,
    locationList: [],
    addOpt: "WithPO",
    allSupplier: []
  };
  public locList: any[] = [];
  public age_of_equip: any = 0;
  public locTagsList: any[] = [];
  public assetList: any[] = [];
  public assetInfo: any = null;
  public assetData: any;
  public itemDefinationList: any = "";
  public searchList;
  public searchTxt;
  public empIdSearch: string;
  public nameSearch: string;
  public statusSearch: string;
  public titleSearch: string;
  public roleSearch: string;
  public name: string;
  public appliedFilter: any = [];
  public selectedIndex: number;
  public activeSearch: string;
  public lockedSearch: string;
  public paginationKey: any;
  public listCount: number = 0;
  public sortColumn: string = "asset_id";
  public sortColumnType: string = "N";
  public sortOrder: string = "DSC";
  public assetSuppliers: any[] = [];
  public financeSuppliers: any[] = [];
  public errMsg: string = "";
  public isError: boolean = false;
  public onBoarding: boolean = false;
  public isEditDetails: boolean = false;
  public isEditFinancial: boolean = false;
  public assetListTab: string = "Available";
  public assetDetails: string = "details";
  public selectedAsset: any = null;
  public action: string;
  public isOwned: boolean = false;
  public isLeased: boolean = false;
  public isFinanced: boolean = false;
  public submitted: boolean = false;
  public finSubmitted: boolean = false;
  public barCode: string;
  public isShowScanCode = false;
  itemForm: FormGroup;
  financialForm: FormGroup;
  public locationSearch;
  public serialSearch;
  public scanCodeSearch;
  public assignToSearch;
  public manfNameSearch;
  public itemNameSearch;
  public itemTypeSearch;
  filteredEmployee: Observable < string[] > ;
  filteredSupplier: Observable < string[] > ;
  filteredLeasedFrom: Observable < string[] > ;
  filteredFinancedFrom: Observable < string[] > ;
  filteredWarrantySupplier: Observable < string[] > ;
  public filteredLocations: Observable < string[] > ;
  public filteredTags: Observable < string[] > ;
  private currentPath;
  public documentDetail;
  public isCalculation = false;
  empList: any[] = [];
  woList: any[] = [];
  maxDate = new Date();
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    public dialog: MatDialog,
    public util: UtilService,
    public constant: ConstantsService,
    private ref: ApplicationRef,
    public http: HttpService,
    public global: GlobalService,
    private admin: AdminService,
    private file: ExportService,
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private loc: Location,
  ) {}

  ngOnInit() {
    const self = this;
    self.createItemForm();
    self.createFinancialForm();
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.currentPath = this.router.url.split("/")[
      this.router.url.split("/").length - 2
    ];
    this.util.setCurrentPath(this.currentPath);
    if (this.router.url.split("/")[2] === "csa-onboarding") {
      this.util.menuChange({
        menu: "guide",
        subMenu: ""
      }); // for onboarding dashboard
    } else {
      this.util.menuChange({
        menu: 3,
        subMenu: 20
      });
    }
    this.util.showProcessing("processing-spinner");
    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.getAssetList();

    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && this.util.getCurrentPath() === "asset-list") {
        if (
          dataObj.source === "ON_THE_FLY_SUPPLIER" &&
          dataObj.data.step === "DONE"
        ) {
          this.getSupplierList("REFRESH");
        }
        if (dataObj.source === "ASSET" || dataObj.source === "ASSET_LIST") {
          self.getAssetList();
          self.cancelEdit();
        }
        if (dataObj.source === "UPLOAD_ASSET_DOC") {
          self.assetInfo = dataObj.data;
          self.getAssetList();
        }
      }
    });
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
  sortList(columnName: string, sortType) {
    this.sortColumn = columnName;
    this.sortColumnType = sortType;
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
  getAssetList() {
    const self = this;
    try {
      this.http.doGet("inventory/assets", function (error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.assetList = [];
          self.util.showAlert(response.message);
          self.global.addException("Assets List", "getAssetList()", response);
        } else {
          self.assetList = response.data;
          // self.route.snapshot.paramMap.get("id") != "0"
          window.location.href.split("/").pop() != "0" ? self.showAssetDetails() : "";

          if (self.assetList.length == 0) {
            self.onBoarding = true;
          }
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "getAssetList()", err);
    }
  }

  showAssetDetails() {
    try {
      const sortedList: any[] = _.sortBy(this.assetList, "asset_id").reverse();
      for (let i = 0; i < sortedList.length; ++i) {
        // this.route.snapshot.paramMap.get("id")
        if (window.location.href.split("/").pop() == sortedList[i].asset_id) {
          this.selectAsset(sortedList[i].asset_id, i);
          this.selectedIndex = i;
          this.assetListTab = sortedList[i].asset_status;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Invoice List", "showInvoiceDetails()", err);
    }
  }

  getEmployeeList(): void {
    const self = this;
    try {
      this.http.doGet("hr/employees", function (error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.empList = [];
        } else {
          self.empList = response.data;
        }
        self.filteredEmployee = self.assign_name.valueChanges.pipe(
          startWith(""),
          map(value => self.empFilter(value))
        );
      });
    } catch (err) {
      this.global.addException("Employee List", "getEmployeeList()", err);
    }
  }

  getSelectedEmp(emp, event: any): void {
    if (event.isUserInput) {
      this.assign_to.setValue(emp.id);
    }
  }
  clearSelEmp() {
    // this.personDetails = null;
  }
  private empFilter(value: string): string[] {
    return this.empList.filter(option =>
      option.name ? option.name.toLowerCase().includes(value ? value.toLowerCase() : "") : ""
    );
  }
  public validateEmp(event: any) {
    const asset = event.target.value;
    const match = this.empList.filter(
      item => item.emp_name.toLowerCase() == asset.toLowerCase()
    );
    if (asset == "") {
      this.assign_to.setValue("");
      return;
    }
    if (match.length > 0) {
      this.assign_to.setValue(match[0].id);
      this.assign_name.setValue(match[0].emp_name);
    }
  }

  // ===============   SUPPLIER  =================== //
  private getSupplierList(origin: string = "INIT"): void {
    const self = this;
    try {
      this.util.showProcessing("processing-spinner");
      this.http.doGet("admin/suppliers/dropdown", function (error: boolean, response: any) {
        if (error) {} else {
          self.util.hideProcessing("processing-spinner");
          self.pageData.supplierList = [];
          self.pageData.supplierList = response.data;
          self.filteredSupplier = self.supplier.valueChanges.pipe(
            startWith(""),
            map(value => self.assetSupplierFilter(value))
          );
          self.filteredLeasedFrom = self.leased_from.valueChanges.pipe(
            startWith(""),
            map(value => self.financeSupplierFilter(value))
          );
          self.filteredFinancedFrom = self.financed_from.valueChanges.pipe(
            startWith(""),
            map(value => self.financeSupplierFilter(value))
          );
          self.filteredWarrantySupplier = self.warranty_supplier.valueChanges.pipe(
            startWith(""),
            map(value => self.financeWarrantyFilter(value))
          );
          origin === "REFRESH" ? self.setSupplierOTF() : "";
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "getSupplierList()", err);
    }
  }
  getSelectedSupplier(supplier): void {
    this.supplier_id.setValue(supplier.supplier_id);
  }
  private supplierFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(option =>
        option.supplier_name
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Assets List", "supplierFilter()", err);
    }
  }
  private assetSupplierFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(
        option =>
        // option.supplier_type == "Assets" &&
        option.supplier_name
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Assets New", "assetSupplierFilter()", err);
    }
  }
  private financeWarrantyFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(
        option =>
        option.supplier_name
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Assets New", "financeSupplierFilter()", err);
    }
  }
  private financeSupplierFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(
        option =>
        // option.supplier_type == "Finance" &&
        option.supplier_name
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Assets New", "financeSupplierFilter()", err);
    }
  }

  showAddSupplierPopup(supType, otfSupType): void {
    this.pageData.supTypeOTF = supType;
    this.util.setOTFSupType(otfSupType);
    // sessionStorage.setItem("supOTF", supType);
    sessionStorage.removeItem("supplierObject");
    this.util.changeEvent(null);
    this.dialog.open(InventoryDialog, {
      data: {
        action: "addNewSupplier"
      }
    });
  }
  setSupplierOTF(): void {
    try {
      const supList: any[] = _.sortBy(this.pageData.supplierList, "supplier_id");
      switch (this.pageData.supTypeOTF) {
        case "ASSET":
          this.supplier_id.setValue(supList[supList.length - 1].supplier_id);
          this.supplier.setValue(supList[supList.length - 1].supplier_name);
          break;
        case "LEASED":
          this.leased_from_id.setValue(supList[supList.length - 1].supplier_id);
          this.leased_from.setValue(supList[supList.length - 1].supplier_name);
          break;
        case "FINANCED":
          this.financed_from_id.setValue(
            supList[supList.length - 1].supplier_id
          );
          this.financed_from.setValue(
            supList[supList.length - 1].supplier_name
          );
          break;
        case "WARRANTY":
          this.warranty_supplier_id.setValue(
            supList[supList.length - 1].supplier_id
          );
          this.warranty_supplier.setValue(
            supList[supList.length - 1].supplier_name
          );
          break;
        default:
          break;
      }
    } catch (err) {
      this.global.addException("Assets New", "setSupplierOTF()", err);
    }
  }
  // ==============   END SUPPLIER  =============== //

  getSelectedFSupplier(supplier, event: any): void {
    try {
      if (event.isUserInput) {
        this.financed_from_id.setValue(supplier.supplier_id);
      }
    } catch (err) {
      this.global.addException("Assets New", "getSelectedFSupplier()", err);
    }
  }
  public validateFSupplier(event: any) {
    try {
      let supplier = event.target.value;
      let match = this.pageData.supplierList.filter(
        item =>
        item.supplier_type == "Finance" &&
        item.supplier_name.toLowerCase() == supplier.toLowerCase()
      );
      if (supplier == "") {
        this.financed_from_id.setValue("");
        return;
      }
      if (match.length > 0) {
        this.financed_from_id.setValue(match[0].supplier_id);
        this.financed_from.setValue(match[0].supplier_name);
      }
    } catch (err) {
      this.global.addException("Assets New", "validateFSupplier()", err);
    }
  }
  getSelectedLSupplier(supplier, event: any): void {
    try {
      if (event.isUserInput) {
        this.leased_from_id.setValue(supplier.supplier_id);
      }
    } catch (err) {
      this.global.addException("Assets New", "getSelectedLSupplier()", err);
    }
  }
  public validateLSupplier(event: any) {
    try {
      let supplier = event.target.value;
      let match = this.pageData.supplierList.filter(
        item =>
        item.supplier_type == "Finance" &&
        item.supplier_name.toLowerCase() == supplier.toLowerCase()
      );
      if (supplier == "") {
        this.leased_from_id.setValue("");
        return;
      }
      if (match.length > 0) {
        this.leased_from_id.setValue(match[0].supplier_id);
        this.leased_from.setValue(match[0].supplier_name);
      }
    } catch (err) {
      this.global.addException("Assets New", "validateLSupplier()", err);
    }
  }
  getSelectedWSupplier(supplier, event: any): void {
    try {
      if (event.isUserInput) {
        this.warranty_supplier_id.setValue(supplier.supplier_id);
        this.warranty_supplier.setValue(supplier.supplier_name);
      }
    } catch (err) {
      this.global.addException("Assets New", "getSelectedWSupplier()", err);
    }
  }
  public validateWSupplier(event: any) {
    try {
      let supplier = event.target.value;
      let match = this.pageData.supplierList.filter(
        item =>
        item.supplier_type == "Finance" &&
        item.supplier_name.toLowerCase() == supplier.toLowerCase()
      );
      if (supplier == "") {
        this.warranty_supplier_id.setValue("");
        return;
      }
      if (match.length > 0) {
        this.warranty_supplier_id.setValue(match[0].supplier_id);
        this.warranty_supplier.setValue(match[0].supplier_name);
      }
    } catch (err) {
      this.global.addException("Assets New", "validateWSupplier()", err);
    }
  }
  addNewAsset() {
    // this.router.navigate(["/inventory/csa-onboarding/add-asset"]);
    sessionStorage.removeItem("ASSET_OLD");
    if (this.router.url.split("/")[2] == "csa-onboarding") {
      this.router.navigate(["/inventory/csa-onboarding/add-asset"]);
    } else {
      this.router.navigate(["/inventory/csa/add-asset"]);
    }
  }

  // @Shahebaz (Start)

  showProductListPopup() {
    this.dialog.open(InventoryDialog, {
      data: {
        action: "purchaseOrderList",
        redirectPath: ["/inventory/rs/csa/add-receiving-slip"]
      }
    });
  }

  // @Shahebaz (End)

  updateAsset(assetObj: any) {
    try {
      // this.util.showProcessing('processing-spinner');
      const self = this;
      self.errMsg = "";
      self.isError = false;
      self.submitted = true;
      const data: any = {};
      data.asset_id = assetObj.asset_id;
      data.manf_id = assetObj.manf_id;
      data.item_def_id = assetObj.item_def_id;
      data.is_metal_barcode = this.isShowScanCode === false ? 0 : 1;
      data.po_id = "";
      data.scan_code = this.scan_code.value;
      data.short_tag = this.short_tag.value;
      data.serial_no = this.serial_no.value;
      data.location_id = this.location_id ? this.location_id.value : assetObj.location_id;
      data.location_tag_id = this.location_tag_id ? this.location_tag_id.value : assetObj.location_tag_id;
      data.assign_to = this.assign_to.value;
      data.status = this.assetInfo.status_info.type_id;
      data.warranty_supplier_id = this.warranty_supplier_id.value;
      data.warranty_end_date = this.util.getYYYYMMDDDate(this.warranty_end_date.value);
      data.comment = assetObj.asset_comment;

      if (this.itemForm.valid) {
        self.util.addSpinner("update-asset-btn", "Update");
        this.http.doPost("inventory/assets/edit", data, function (
          error: boolean,
          response: any
        ) {
          // self.util.hideProcessing('processing-spinner');
          self.util.removeSpinner("update-asset-btn", "Update");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
          } else {
            self.getAssetList();
            self.cancelEdit();
            self.util.showDialog(DialogComponent, response.message, []);
          }
        });
      }
    } catch (err) {
      this.global.addException("Assets List", "updateAsset()", err);
    }
  }
  updateFinancial(form: FormGroup, assetObj: any) {
    try {
      // this.util.showProcessing('processing-spinner');
      const self = this;
      self.errMsg = "";
      self.isError = false;
      self.finSubmitted = true;
      const financials = [];
      const subMenu = {};

      subMenu["asset_id"] = assetObj.asset_id;
      subMenu["ownership_type"] = assetObj.financials.ownership_type ? assetObj.financials.ownership_type.type_id : 1
      subMenu["purchase_date"] = this.util.getYYYYMMDDDate(form.value.purchase_date);
      subMenu["acc_ref_no"] = form.value.acc_ref_no;
      if (assetObj.financials.ownership_type.type_id === 1) {
        subMenu["supplier_id"] = form.value.supplier_id;
        subMenu["age_of_equipment"] = form.value.age_of_equipment;
        subMenu["montly_depreciation"] = assetObj.financials.montly_depreciation;
        subMenu["present_value"] = assetObj.financials.present_value;
      } else if (assetObj.financials.ownership_type.type_id === 2) {
        subMenu["paid_capital"] = form.value.paid_capital;
        subMenu["leased_from"] = form.value.leased_from_id;
      } else if (assetObj.financials.ownership_type.type_id === 3) {
        subMenu["financed_from"] = form.value.financed_from_id;
      }
      if (assetObj.financials.ownership_type.type_id === 1 || assetObj.financials.ownership_type.type_id === 3) {
        subMenu["purchase_price"] = form.value.purchase_price;
        subMenu["esti_useful_life"] = form.value.esti_useful_life;
        subMenu["residual_value"] = form.value.residual_value;
      }
      if (assetObj.financials.ownership_type.type_id === 2 || assetObj.financials.ownership_type.type_id === 3) {
        subMenu["monthly_payment"] = assetObj.financials.monthly_payment;
        subMenu["end_date"] = this.util.getYYYYMMDDDate(form.value.end_date);
      }
      if (form.valid) {
        self.util.addSpinner("fin-update-btn", "Update");
        this.http.doPost("inventory/assets/financial/edit", subMenu, function (
          error: boolean,
          response: any
        ) {
          self.util.removeSpinner("fin-update-btn", "Update");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
          } else {
            self.getAssetList();
            self.cancelEdit();
            self.util.showDialog(DialogComponent, response.message, []);
          }
        });
      }
    } catch (err) {
      this.global.addException("Assets List", "updateFinancial()", err);
    }
  }
  cancelEdit() {
    this.isEditDetails = false;
    this.isEditFinancial = false;
    this.assetInfo = null;
    this.action = "";
    this.selectedIndex = null;
  }
  private validateMDInput(callback) {
    try {
      if (
        !this.constant.AMOUNT_PATTERN.test(this.esti_useful_life.value) ||
        !this.constant.AMOUNT_PATTERN.test(this.residual_value.value)
      ) {
        return callback(false);
      }
      return callback(true);
    } catch (err) {
      this.global.addException("Assets New", "validateMDInput()", err);
    }
  }
  calcMonthlyDepriciation(event: any, field: any) {
    const self = this;
    try {
      if ((!this.purchase_price.valid && !this.purchase_price.dirty) && (!this.esti_useful_life.valid && !this.esti_useful_life.dirty) &&
        (!this.residual_value.valid && !this.residual_value.dirty) && (!this.purchase_date.valid && !this.purchase_date.dirty)) {
        return;
      } else {
        this.validateMDInput(function (res) {
          if (!res) {
            return;
          } else {
            self.isCalculation = true;
            self.util.addSpinner("next-btn-id", "Next");
            const reqObj = {
              "purchase_date": self.util.getYYYYMMDDDate(self.purchase_date.value),
              "purchase_price": self.purchase_price.value,
              "estimated_useful_life": self.esti_useful_life.value,
              "residual_value": self.residual_value.value
            };
            self.http.doPost(
              "inventory/assets/financial-calculation", reqObj,
              function (error: boolean, response: any) {
                self.isCalculation = false;
                self.util.removeSpinner("next-btn-id", "Next");
                if (error) {
                  this.global.addException("Assets New", "calcMonthlyDepriciation()", error);
                } else {
                  self.assetInfo.financials.monthly_depreciation = response.data.monthly_depreciation;
                  self.age_of_equip = response.data.age_of_asset;
                  self.assetInfo.financials.present_value = response.data.present_value;
                }
              });
          }
        });
      }
    } catch (err) {
      this.global.addException("Assets New", "calcMonthlyDepriciation()", err);
    }
  }
  searchEmployee(filterValue: string, filterType: string) {
    try {
      if (filterValue == "") {
        // this.removeTag(filterType);
      } else {
        if (this.appliedFilter.length > 0) {
          for (let i = 0; i < this.appliedFilter.length; i++) {
            if (filterType == this.appliedFilter[i].tagName) {
              this.appliedFilter[i].tagValue = filterValue;
              return;
            }
          }
        } else {}
      }
    } catch (err) {
      this.global.addException("Assets List", "searchEmployee()", err);
    }
  }
  changeLocation(obj: any) {
    this.getLocationTags(obj.location_id);
  }
  getLocationList() {
    const self = this;
    try {
      this.http.doGet("admin/location", function (error: boolean, response: any) {
        if (error) {
          self.locList = [];
        } else {
          self.locList = response.data;
          self.filteredLocations = self.location.valueChanges.pipe(
            startWith(""),
            map(value => self.locationFilter(value))
          );
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "getLocationList()", err);
    }
  }
  private locationFilter(value: string): string[] {
    try {
      return this.locList.filter(option =>
        option.location_name
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Assets List", "locationFilter()", err);
    }
  }
  public validateLoc(event: any) {
    try {
      let loc = event.target.value;
      if (loc == "") {
        this.location_id.setValue("");
        this.location.setValue("");
        return;
      }
      let match = this.locList.filter(
        item => item.location_name.toLowerCase() == loc.toLowerCase()
      );
      if (match.length > 0) {
        this.location.setValue(match[0].location_name);
        this.location_id.setValue(match[0].location_id);
        this.getLocationTags(match[0].location_id);
      }
    } catch (err) {
      this.global.addException("Assets List", "validateLoc()", err);
    }
  }
  getSelectedLocation(event: any, selectedLoc: any) {
    try {
      if (event.isUserInput) {
        this.location_id.setValue(selectedLoc.location_id);
        this.getLocationTags(selectedLoc.location_id);
      }
    } catch (err) {
      this.global.addException("Assets List", "getSelectedLocation()", err);
    }
  }
  getSelectedTag(event: any, selectedTag: any) {
    try {
      if (event.isUserInput) {
        this.location_tag_id.setValue(selectedTag.location_tag_id);
      }
    } catch (err) {
      this.global.addException("Assets List", "getSelectedTag()", err);
    }
  }
  getLocationTags(id) {
    const self = this;
    try {
      this.http.doGet(`admin/location/${id}/tags`, function (
        error: boolean,
        response: any
      ) {
        if (error) {} else {
          self.locTagsList = response.data ? response.data : [];
          if (self.assetInfo) {
            const tag = self.locTagsList.filter(
              item => item.location_tag_id == self.location_tag_id.value
            );
            if (tag.length > 0) {
              self.location_tag.setValue(tag[0].scan_code);
              self.assetInfo.location_tag = tag[0].scan_code;
            }
          }
          self.filteredTags = self.location_tag.valueChanges.pipe(
            startWith(""),
            map(value => self.locationTagsFilter(value))
          );
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "getLocationTags()", err);
    }
  }
  private locationTagsFilter(value: string): string[] {
    try {
      return this.locTagsList.filter(option =>
        option.scan_code
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Assets List", "locationTagsFilter()", err);
    }
  }
  public validateLocTags(event: any) {
    try {
      const loc = event.target.value;
      const match = this.locTagsList.filter(
        item => item.scan_code.toLowerCase() == loc.toLowerCase()
      );
      if (match.length > 0) {
        this.location_tag.setValue(match[0].scan_code);
        this.location_tag_id.setValue(match[0].location_tag_id);
      }
    } catch (err) {
      this.global.addException("Assets List", "validateLocTags()", err);
    }
  }
  selectAsset(asset_id: any = {}, index) {

    if (!this.util.canAccess('asset_general_details')) {
      return false;
    }

    this.selectedIndex = index;
    const self = this;
    this.isEditDetails = false;
    this.isEditFinancial = false;
    this.util.showProcessing("processing-spinner");
    this.http.doGet(`inventory/assets/details/${asset_id}`, function (
      error: boolean,
      response: any
    ) {
      self.util.hideProcessing("processing-spinner");
      if (error) {
        self.isError = true;
        self.assetInfo = null;
        self.errMsg = response ? response.message : self.constant.EXCEPTIONAL_MSG;
        self.global.addException("Assets List", "selectAsset()", response);
      } else {
        try {
          self.isError = false;
          const assetObj = response.data;
          self.assetData = response.data;
          self.assetInfo = response.data;
          self.loc.go("/inventory/csa/asset-list/" + assetObj.asset_id);
          self.assetDetails = "details";
          self.selectedIndex = index;
          setTimeout(function () {
            self.util.scrollDown("assetMark");
          }, 1000);
          let supName: any;
          for (let i = 0; i < self.assetSuppliers.length; i++) {
            if (self.assetSuppliers[i].supplier_id == assetObj.supplier_id) {
              supName = self.assetSuppliers[i].supplier_name;
            }
          }
          if (assetObj.ownership_type == "Owned") {
            self.util.addBulkValidators(
              self.financialForm,
              ["esti_useful_life", "residual_value"],
              [
                Validators.required,
                Validators.pattern(self.constant.AMOUNT_PATTERN)
              ]
            );
            self.financialForm.controls["supplier"].setValue(supName);
            self.financialForm.controls["supplier_id"].setValue(
              assetObj.supplier_id
            );
            self.financialForm.controls["esti_useful_life"].setValue(
              assetObj.esti_useful_life
            );
            self.financialForm.controls["residual_value"].setValue(
              assetObj.residual_value
            );
            self.financialForm.controls["age_of_equipment"].setValue(
              assetObj.age_of_equipment
            );
          } else if (
            assetObj.ownership_type == "Financed" ||
            assetObj.ownership_type == "Leased"
          ) {
            self.util.addBulkValidators(
              self.financialForm,
              ["term"],
              [Validators.required]
            );
            self.financialForm.controls["start_date"].setValue(assetObj.start_date);
            self.financialForm.controls["end_date"].setValue(assetObj.end_date);
            self.financialForm.controls["term"].setValue(assetObj.term);
            self.financialForm.controls["paid_capital"].setValue(
              assetObj.paid_capital
            );
          }
          if (assetObj.ownership_type == "Leased") {
            const financeSupplier = self.pageData.supplierList.filter(
              option => option.supplier_id == assetObj.leased_from
            );
            self.util.addBulkValidators(
              self.financialForm,
              ["leased_from"],
              [Validators.required]
            );
            self.financialForm.controls["leased_from"].setValue(
              financeSupplier.length > 0 ? financeSupplier[0].supplier_name : ""
            );
            self.financialForm.controls["leased_from_id"].setValue(
              assetObj.leased_from
            );
          } else if (assetObj.ownership_type == "Financed") {
            const financeSupplier = self.pageData.supplierList.filter(
              option => option.supplier_id == assetObj.financed_from
            );
            self.util.addBulkValidators(
              self.financialForm,
              ["financed_from"],
              [Validators.required]
            );
            self.financialForm.controls["financed_from"].setValue(
              financeSupplier.length > 0 ? financeSupplier[0].supplier_name : ""
            );
            self.financialForm.controls["financed_from_id"].setValue(
              assetObj.financed_from
            );
          }
          self.financialForm.controls["acc_ref_no"].setValue(assetObj.acc_ref_no);
          self.financialForm.controls["purchase_date"].setValue(
            assetObj.purchase_date ? assetObj.purchase_date : ""
          );
          self.financialForm.controls["purchase_price"].setValue(
            assetObj.purchase_price ? assetObj.purchase_price : ""
          );
        } catch (err) {
          self.global.addException("Assets List", "selectAsset()", err);
        }
      }
    });
  }

  checkAssignedWO(assetId): void {
    const self = this;
    self.util.addSpinner("delete-btn", "Delete");
    this.http.doGet("getAllWorkOrders/asset/" + assetId, function (
      error: boolean,
      response: any
    ) {
      self.util.removeSpinner("delete-btn", "Delete");
      if (error) {} else {
        self.woList = response.data.work_orders;
      }
    });
  }
  showDetails(option) {
    try {
      this.assetDetails = option;
      this.errMsg = "";
      this.isError = false;
      this.isEditDetails = false;
      this.isEditFinancial = false;
    } catch (err) {
      this.global.addException("Assets List", "showDetails()", err);
    }
  }
  changeAction(action) {
    const self = this;
    try {
      self.action = action;
      if (action === "editDetails") {
        self.isEditDetails = true;
        self.getLocationList();
        if (this.assetInfo.location_id) {
          self.getLocationTags(this.assetInfo.location_id);
        }
        self.getEmployeeList();
        self.getSupplierList();
        self.setFormValues();
      } else if (action === "editFinancial") {
        self.isEditFinancial = true;
        self.setFinacialFormValues();
      }
    } catch (err) {
      this.global.addException("Assets List", "changeAction()", err);
    }
  }
  setFormValues() {
    const assingToName = this.assetInfo.assign_to ? this.assetInfo.assign_to.first_name + "" + this.assetInfo.assign_to.last_name : "";
    const assingTo = this.assetInfo.assign_to ? this.assetInfo.assign_to.id : "";
    const locationId = this.assetInfo.location_id;
    const location = this.assetInfo.location ? this.assetInfo.location.location_name : "";
    const locationTagId = this.assetInfo.location_tag_id;
    const locationTag = this.assetInfo.location_tag ? this.assetInfo.location_tag.scan_code : "";
    const warrantySupplierId = this.assetInfo.warranty_supplier_id ? this.assetInfo.warranty_supplier_id : "";
    const warrantySupplier = this.assetInfo.warranty_supplier ? this.assetInfo.warranty_supplier : "";
    const warrantyEndDate = this.assetInfo.warranty_end_date ?
      this.util.stringToDate(this.util.getDDMMYYYYDate(this.assetInfo.warranty_end_date)) : "";
    if (this.assetInfo.is_metal_barcode === 1) {
      this.barCode = "barcode";
      this.isShowScanCode = true;
      this.itemForm.get("scan_code").setValue(this.assetInfo.scan_code);
    } else {
      this.barCode = "";
      this.isShowScanCode = false;
    }

    this.itemForm.get("location_id").setValue(locationId);
    this.itemForm.get("location").setValue(location);
    this.itemForm.get("location_tag_id").setValue(locationTagId);
    this.itemForm.get("location_tag").setValue(locationTag);
    this.itemForm.get("assign_name").setValue(assingToName);
    this.itemForm.get("assign_to").setValue(assingTo);
    this.itemForm.get("warranty_supplier").setValue(warrantySupplier);
    this.itemForm.get("warranty_supplier_id").setValue(warrantySupplierId);
    this.itemForm.get("warranty_end_date").setValue(warrantyEndDate);
    this.itemForm.get("short_tag").setValue(this.assetInfo.short_tag);
    this.itemForm.get("serial_no").setValue(this.assetInfo.serial_no);

  }
  setFinacialFormValues() {
    // Owned Const
    const supplier = this.assetInfo.financials.supplier ? this.assetInfo.financials.supplier : "";
    const purchasePrice = this.assetInfo.financials.purchase_price;
    const supplierId = this.assetInfo.financials.supplier ? this.assetInfo.financials.supplier_id : "";
    const useFullLife = this.assetInfo.financials.esti_useful_life;
    const resudualValue = this.assetInfo.financials.residual_value ? this.assetInfo.financials.residual_value : 0;
    const ageOfAsset = this.assetInfo.financials.age_of_equipment ? this.assetInfo.financials.age_of_equipment : 0;
    // Leased Const
    const leaseFrom = this.assetInfo.financials.leased_from ? this.assetInfo.financials.leased_from_supplier : "";
    const leaseFromId = this.assetInfo.financials.leased_from ? this.assetInfo.financials.leased_from : "";
    const purchaseDate = this.util.stringToDate(this.util.getDDMMYYYYDate(this.assetInfo.financials.purchase_date));
    const leaseExpiryDate = this.util.stringToDate(this.util.getDDMMYYYYDate(this.assetInfo.financials.end_date));
    const paidCapital = this.assetInfo.financials.paid_capital ? this.assetInfo.financials.paid_capital : 0;
    const accRefNo = this.assetInfo.financials.acc_ref_no;
    // Financed Const
    const financeFrom = this.assetInfo.financials.financed_from ? this.assetInfo.financials.financed_from_supplier : "";
    const financeFromId = this.assetInfo.financials.financed_from ? this.assetInfo.financials.financed_from : "";

    // Owend
    this.financialForm.get("supplier").setValue(supplier);
    this.financialForm.get("supplier_id").setValue(supplierId);
    this.financialForm.get("purchase_price").setValue(purchasePrice);
    this.financialForm.get("esti_useful_life").setValue(useFullLife);
    this.financialForm.get("age_of_equipment").setValue(ageOfAsset);
    this.financialForm.get("residual_value").setValue(resudualValue);
    // Leased
    this.financialForm.get("leased_from").setValue(leaseFrom);
    this.financialForm.get("leased_from_id").setValue(leaseFromId);
    this.financialForm.get("purchase_date").setValue(purchaseDate);
    this.financialForm.get("end_date").setValue(leaseExpiryDate);
    this.financialForm.get("paid_capital").setValue(paidCapital);
    this.financialForm.get("acc_ref_no").setValue(accRefNo);
    // Financed
    this.financialForm.get("financed_from").setValue(financeFrom);
    this.financialForm.get("financed_from_id").setValue(financeFromId);

  }
  deleteAction(assetId) {
    try {
      const data: any = {
        API_URL: "inventory/assets/delete",
        reqObj: {
          asset_id: assetId
        },
        event: {
          source: "ASSET",
          action: "DELETE"
        },
        // assignedWO: this.woList
      };

      this.woList.length == 0 ?
        this.util.showDialog(
          DialogComponent,
          "Are you sure you want to delete " +
          this.assetInfo.short_tag +
          " ?",
          [],
          "Delete Confirmation ?",
          "CONFIRMATION",
          data
        ) :
        this.util.showDialog(
          DialogComponent,
          this.assetInfo.short_tag +
          " is assigned to the following work orders:",
          [],
          "Delete " + this.assetInfo.short_tag + " ?",
          "CONFIRMATION_WITH_WARNING",
          data
        );
    } catch (err) {
      this.global.addException("Assets List", "deleteAction()", err);
    }
  }

  addFromCSV() {
    let route: string,
      apiEndPoint: string,
      csvTemplateUrl: string,
      redirectUrl: string;
    route = "/csa-onboarding/csv-preview/assets";
    apiEndPoint = "assets/csv";
    csvTemplateUrl = this.config.domainIP + "api/download/csv/asset.csv";
    redirectUrl = "/inventory/csa/asset-list/0";
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
  addNewDoc() {
    try {
      this.assetInfo.inventoryId = this.assetInfo.asset_id;
      this.assetInfo.inventoryType = "asset";
      this.dialog.open(InventoryDialog, {
        data: {
          action: "UPLOAD_ASSET_DOC",
          assetInfo: this.assetInfo
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "addNewDoc()", err);
    }
  }
  public createItemForm() {
    this.itemForm = this.fb.group({
      short_tag: new FormControl("", [Validators.required]),
      serial_no: new FormControl("", [Validators.pattern(this.constant.DECIMAL_ALPHA_PATTERN)]),
      scan_code: new FormControl("", []),
      location: new FormControl("", []),
      location_id: new FormControl("", []),
      location_tag: new FormControl("", []),
      location_tag_id: new FormControl("", []),
      assign_to: new FormControl("", []),
      assign_name: new FormControl("", []),
      warranty_supplier: new FormControl("", []),
      warranty_supplier_id: new FormControl("", []),
      warranty_end_date: new FormControl("", []),
    });
  }
  get short_tag() {
    return this.itemForm.get("short_tag");
  }
  get serial_no() {
    return this.itemForm.get("serial_no");
  }
  get scan_code() {
    return this.itemForm.get("scan_code");
  }
  get location() {
    return this.itemForm.get("location");
  }
  get location_id() {
    return this.itemForm.get("location_id");
  }
  get location_tag() {
    return this.itemForm.get("location_tag");
  }
  get location_tag_id() {
    return this.itemForm.get("location_tag_id");
  }
  get assign_to() {
    return this.itemForm.get("assign_to");
  }
  get assign_name() {
    return this.itemForm.get("assign_name");
  }
  get warranty_supplier() {
    return this.itemForm.get("warranty_supplier");
  }
  get warranty_supplier_id() {
    return this.itemForm.get("warranty_supplier_id");
  }
  get warranty_end_date() {
    return this.itemForm.get("warranty_end_date")
  }
  public createFinancialForm() {
    this.financialForm = this.fb.group({
      supplier: new FormControl("", []),
      supplier_id: new FormControl("", []),
      leased_from: new FormControl("", []),
      purchase_date: new FormControl("", []),
      purchase_price: new FormControl("", []),
      leased_from_id: new FormControl("", []),
      financed_from: new FormControl("", []),
      financed_from_id: new FormControl("", []),
      esti_useful_life: new FormControl("", []),
      residual_value: new FormControl("", []),
      age_of_equipment: new FormControl("", []),
      term: new FormControl("", []),
      acc_ref_no: new FormControl("", []),
      start_date: new FormControl("", []),
      end_date: new FormControl("", []),

      paid_capital: new FormControl("", [])
    });
  }
  get supplier() {
    return this.financialForm.get("supplier");
  }
  get supplier_id() {
    return this.financialForm.get("supplier_id");
  }
  get purchase_date() {
    return this.financialForm.get("purchase_date");
  }
  get purchase_price() {
    return this.financialForm.get("purchase_price");
  }
  get leased_from() {
    return this.financialForm.get("leased_from");
  }
  get leased_from_id() {
    return this.financialForm.get("leased_from_id");
  }
  get financed_from() {
    return this.financialForm.get("financed_from");
  }
  get financed_from_id() {
    return this.financialForm.get("financed_from_id");
  }
  get esti_useful_life() {
    return this.financialForm.get("esti_useful_life");
  }
  get residual_value() {
    return this.financialForm.get("residual_value");
  }
  get age_of_equipment() {
    return this.financialForm.get("age_of_equipment");
  }
  get term() {
    return this.financialForm.get("term");
  }
  get acc_ref_no() {
    return this.financialForm.get("acc_ref_no");
  }
  get start_date() {
    return this.financialForm.get("start_date");
  }
  get end_date() {
    return this.financialForm.get("end_date");
  }

  get paid_capital() {
    return this.financialForm.get("paid_capital");
  }
  generatepdf() {
    this.file.generatePortraitpdf("asset-tbl", "Asset List", "asset_list");
  }
  generatecsv() {
    this.file.generatecsv("asset-tbl", "asset_list");
  }

  needMaintenanceRequest() {
    try {
      this.dialog.open(MaintenanceDialog, {
        data: {
          action: "addNewMaintenance",
          source: "ASSET_LIST",
          reqObj: {
            asset_id: this.assetInfo.asset_id,
            short_tag: this.assetInfo.short_tag
          }
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "needMaintenanceRequest()", err);
    }
  }
  showImage(url) {
    try {
      this.dialog.open(DialogComponent, {
        data: {
          action: "image",
          url: url
        }
      });
      this.ref.tick();
    } catch (err) {
      this.global.addException("Assets List", "showImage()", err);
    }
  }
  startDateChange(event) {
    this.financialForm.get("end_date").setValue("");
  }

  changeStatusToAvailable(asset_id) {
    const self = this;
    self.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("assets/available/" + asset_id, function (
        error: boolean,
        response: any
      ) {
        if (error) {
        } else {
          self.assetInfo = null;
          self.action = "";
          self.selectedIndex = null;
          self.getAssetList();

          self.util.hideProcessing("processing-spinner");
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "getLocationTags()", err);
    }
  }
  purchaseDateChange(event: any) {

  }

  public dateDiffInDays(a, b) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  }
  validateAssetName(event: any) {
    const self = this;
    self.pageData.isError = false;
    if (!self.short_tag.valid && !self.short_tag.dirty) {
      return;
    }
    try {
      let reqObj = {};
      if (self.short_tag.value !== "" && self.short_tag.value !== self.assetInfo.short_tag) {
        reqObj = {
          asset_name: this.short_tag.value
        };
        this.http.doPost(
          "inventory/assets/unique-asset", reqObj,
          function (
            error: boolean,
            response: any
          ) {
            if (error) {
            } else {
              self.pageData.isError = true;
              self.pageData.assetNameAvailability = response.data.is_available;
            }
          });
      }
    } catch (err) {
      this.global.addException(
        "validate Asset Name",
        "validateAssetName()",
        err
      );
    }
  }
  validateSerialNo(event: any) {
    const self = this;
    self.pageData.isError = false;
    if ((!self.serial_no.valid && !self.serial_no.dirty) || (self.serial_no.value !== self.assetInfo.short_tag)) {
      return;
    }
    try {
      const reqObj = {
        "serial_no": this.serial_no.value
      };
      this.http.doPost(
        "inventory/assets/unique-asset", reqObj,
        function (error: boolean, response: any) {
          if (error) {
          } else {
            self.pageData.isError = true;
            self.pageData.serialNoAvailability = response.data.is_available;
          }
        }
      );
    } catch (err) {
      this.global.addException(
        "validate Serial Number",
        "validateSerialNo()",
        err
      );
    }
  }
  scanCodeClick(): void {
    this.isShowScanCode = true;
    this.util.updateValidators(this.itemForm, "scan_code", [
      Validators.required
    ]);
  }
  sysGeneratedCodeClick(): void {
    this.isShowScanCode = false;
    this.util.updateValidators(this.itemForm, "scan_code", []);
  }


}
