import { Component, Inject, OnInit } from "@angular/core";
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
import * as _ from "underscore";

import { UtilService } from "../../../../shared/service/util.service";
import { AdminService } from "../../../admin/admin.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";

import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { GlobalService } from "../../../../shared/service/global.service";
import { WorkOrderService } from "../../../workflow/work-order/work-order.service";
declare var $: any;

@Component({
  selector: "app-maintenance-list",
  templateUrl: "./maintenance-list.component.html",
  styleUrls: ["./maintenance-list.component.css"]
})
export class MaintenanceListComponent implements OnInit {
  public sortColumn = "maintenance_request_id";
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
  public maintenanceList: any = [];
  public selectedMaintenance: any = null;
  public action: string;
  public emptyData = false;
  editMaintenanceFrm: FormGroup;

  public locationSearch;
  public nameSearch;
  public serialNoSearch;
  public scanCodeSearch;
  public statusSearch;

  public onBoarding = false;

  constructor(
    public dialog: MatDialog,
    public util: UtilService,
    public constant: ConstantsService,
    public admin: AdminService,
    private http: HttpService,
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    public global: GlobalService,
    private location: Location,
    private woService: WorkOrderService
  ) {}

  ngOnInit() {
    this.util.showProcessing("processing-spinner");
    this.util.menuChange({ menu: 3, subMenu: 21 });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);

    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.getMaintenanceList();
    this.createMaintenanceForm();

    this.admin.newRecord.subscribe(maintenance => {
      if (maintenance) {
        this.getMaintenanceList();
        this.selectedMaintenance = null;
        this.selectedIndex = null;
        this.searchTxt = this.searchList = "";
      }
    });

    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source === "MAINTENANCE") {
        this.getMaintenanceList();
        this.selectedMaintenance = this.selectedIndex = null;
        this.searchTxt = this.searchList = "";
      }
    });
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

  public createMaintenanceForm() {
    this.editMaintenanceFrm = this.fb.group({
      maintenance_details: new FormControl("", [
        Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ])
    });
  }
  get maintenance_details() {
    return this.editMaintenanceFrm.get("maintenance_details");
  }

  newMaintenanceRequest() {
    this.dialog.open(MaintenanceDialog, {
      data: { action: "addNewMaintenance", source: "MAINTENANCE_LIST" }
    });
  }
  getMaintenanceList() {
    try {
      const self = this;
      this.http.doGet("inventory/maintenances", function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.global.addException("Maintenence List", "getMaintenanceList()", response);
        } else {
          if (response.data) {
            self.maintenanceList = [];
            self.maintenanceList = response.data;
            if (self.maintenanceList.length === 0) {
                self.onBoarding = true;
            }
            self.route.snapshot.paramMap.get("id") != "0"
              ? self.showMaintenanceDetails()
              : "";
          }
        }
      });
    } catch (err) {
      this.global.addException("Maintenence List", "getMaintenanceList()", err);
    }
  }

  showMaintenanceDetails() {
    try {
      const sortedList: any[] = _.sortBy(
        this.maintenanceList,
        "maintenance_request_id"
      ).reverse();
      for (let i = 0; i < sortedList.length; ++i) {
        if (
          this.route.snapshot.paramMap.get("id") ==
          sortedList[i].maintenance_request_id
        ) {
          this.selectMaintenance(sortedList[i], i);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Add Material", "showMaintenanceDetails()", err);
    }
  }

  showDeleteClassPopup() {
    const data: any = {
      API_URL: "inventory/maintenances/delete",
      reqObj: {
        maintenance_request_id: this.selectedMaintenance.maintenance_request_id
      },
      event: {
        source: "MAINTENANCE",
        action: "DELETE"
      }
    };
    this.util.showDialog(
      DialogComponent,
      "Are you sure you want to delete " +
      this.selectedMaintenance.asset_name +
        " ? If there are no other maintenance requests, this asset will become available for WOs.",
      [],
      "Delete Confirmation ?",
      "CONFIRMATION",
      data
    );
  }
  showDisposeItemPopup() {
    const data: any = {
      API_URL: "inventory/maintenances/dispose-assets",
      reqObj: {
        maintenance_request_id: this.selectedMaintenance.maintenance_request_id
      },
      event: {
        source: "MAINTENANCE",
        action: "DELETE"
      }
    };
    this.util.showDialog(
      DialogComponent,
      `Retiring an asset will delete it from your list of assets and make it unavailable for further use.
      Are you sure you want to retire this asset?`,
      [],
      "Retire Asset?",
      "CONFIRMATION",
      data
    );
  }
  selectMaintenance(maintenanceObj: any, index) {
    try {
      const self = this;
      this.selectedIndex = index;
      this.util.showProcessing("processing-spinner");
      this.http.doGet(`inventory/maintenances/details/${maintenanceObj.maintenance_request_id}`, function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response);
        } else {
            if (response.data) {
                self.emptyData = false;
                self.selectedMaintenance = response.data;
                self.location.go(
                    self.location
                    .path()
                    .split("/")
                    .splice(0, self.location.path().split("/").length - 1)
                    .join("/") +
                    "/" +
                    maintenanceObj.maintenance_request_id
                );
                setTimeout(function() {
                    self.util.scrollDown("maintenanceMark");
                }, 1000);
            } else {
                self.selectedMaintenance = null;
                self.emptyData = true;
            }
        }
        });
    } catch (err) {
      this.global.addException("Add Material", "selectMaintenance()", err);
    }
  }
  createWO() {
    try {
      console.log(this.selectedMaintenance);
      sessionStorage.removeItem("WO_EDIT");
      sessionStorage.removeItem("WO_DETAILS");
      sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
      sessionStorage.removeItem("woSetupData");
      sessionStorage.removeItem("woDetails");
      localStorage.removeItem("CREATE_WO");
      sessionStorage.setItem(
        "WO_From_Maintenance",
        JSON.stringify(this.selectedMaintenance)
      );
      this.woService.deletedService = [];
      this.woService.deletedProductMaterial = [];
      this.woService.deletedTeamMember = [];
      this.woService.deletedAsset = [];
      this.woService.deletedPaySchedule = [];
      this.woService.associatedAsset = [];
      this.router.navigate(["/workflow/wo/csa/work-order/services"]);
    } catch (err) {
      this.global.addException("Create WO from Maintenance", "createWO()", err);
    }
  }
  updateMaintenance(form: FormGroup) {
    try {
      const self = this;
      self.errMsg = "";
      self.isError = false;
      self.submitted = true;
      if (form.valid) {
        const data: any = {};
        data.maintenance_request_id =
          self.selectedMaintenance.maintenance_request_id;
        data.maintenance_details = self.editMaintenanceFrm.get(
          "maintenance_details"
        ).value;
        self.util.addSpinner("updateMaintenance", "Update");
        this.http.doPost("inventory/maintenances/edit", data, function(
          error: boolean,
          response: any
        ) {
          self.util.removeSpinner("updateMaintenance", "Update");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            self.cancelEdit();
            self.selectedMaintenance.maintenance_details =
              form.value.maintenance_details;
          }
        });
      }
    } catch (err) {
      this.global.addException("Add Material", "updateMaintenance()", err);
    }
  }

  changeAction(action) {
    try {
      this.action = action;
      if (action === "editDetails") {
        this.editMaintenanceFrm
          .get("maintenance_details")
          .setValue(this.selectedMaintenance.maintenance_details);
      }
    } catch (err) {
      this.global.addException("Add Material", "changeAction()", err);
    }
  }
  cancelEdit() {
    this.action = "";
  }
  changeStatusToAvailable(asset_id) {
    const self = this;
    self.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("inventory/maintenances/available/" + asset_id, function(
        error: boolean,
        response: any
      ) {
        if (error) {
          console.log("error", response);
        } else {
          self.maintenanceList = [];
          self.action = "";
          self.selectedIndex = null;
          self.getMaintenanceList();
          self.selectedMaintenance = null;
          self.util.hideProcessing("processing-spinner");
        }
      });
    } catch (err) {
      this.global.addException("Assets List", "getLocationTags()", err);
    }
  }
}

@Component({
  selector: "",
  templateUrl: "./maintenance-dialog.component.html",
  styleUrls: ["./maintenance-list.component.css"]
})
export class MaintenanceDialog {
  public errMsg = "";
  public isError = false;
  public isSuccess = false;
  public submitted = false;
  public successMsg = "";
  public action: string;
  public source: string;
  public assetsList: any = [];
  public selectedAsset: any = null;
  addMaintenanceFrm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<MaintenanceDialog>,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
    private util: UtilService,
    public constant: ConstantsService,
    private admin: AdminService,
    private fb: FormBuilder,
    private router: Router,
    private http: HttpService,
    public dialog: MatDialog,
    private global: GlobalService
  ) {
    this.action = dataObj.action;
    this.source = dataObj.source;
  }

  ngOnInit() {
    this.getAssetList();
    if (this.dataObj.reqObj) {
      this.createClassForm(1, this.dataObj.reqObj);
    } else {
      this.createClassForm(0);
    }
  }

  getAssetList() {
    try {
      const self = this;
      this.http.doGet("inventory/assets/dropdown", function(error: boolean, response: any) {
        if (error) {
          console.log(response);
        } else {
          self.assetsList = response.data;
          console.log("self.assetsList", self.assetsList);
        }
      });
    } catch (err) {
      this.global.addException("Material list", "getAssetList()", err);
    }
  }

  selectAsset(assetId) {
    try {
      this.selectedAsset = this.assetsList.filter(
        item => item.asset_id == assetId.value
      )[0];
    } catch (err) {
      this.global.addException("Material list", "selectAsset()", err);
    }
  }

  public createClassForm(option, assetObj: any = {}) {
    this.addMaintenanceFrm = this.fb.group({
      asset_id: new FormControl(option == 1 ? assetObj.asset_id : "", [
        Validators.required
      ]),
      maintenance_details: new FormControl("", [
        Validators.required,
        Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ])
    });
  }

  get asset_id() {
    try {
      return this.addMaintenanceFrm.get("asset_id");
    } catch (err) {
      this.global.addException("Material list", "asset_id()", err);
    }
  }
  get maintenance_details() {
    try {
      return this.addMaintenanceFrm.get("maintenance_details");
    } catch (err) {
      this.global.addException("Material list", "maintenance_details()", err);
    }
  }

  addMaintenanceRequest(form: FormGroup) {
    try {
      let self = this;
      this.errMsg = "";
      this.isError = false;
      this.submitted = true;
      console.log(form.value);
      if (form.valid) {
        const itemClassObj = form.value;
        $("#addItemClass").addClass("ptrN");
        $("#addItemClass").html(
          "<i class=\"fa fa-spinner fa-pulse fa-3x fa-fw action\"></i> Submit"
        );
        this.http.doPost("inventory/maintenances/create", itemClassObj, function(
          error: boolean,
          response: any
        ) {
          $("#addItemClass").removeClass("ptrN");
          $("#addItemClass").html("Submit");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            self.isSuccess = true;
            self.admin.updateList(response.status);
            self.util.changeEvent(self.dataObj);
            self.successMsg = response.message;
          }
        });
      }
    } catch (err) {
      this.global.addException("Material list", "addItemClass()", err);
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
