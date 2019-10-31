import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute, Event } from "@angular/router";
import {FormControl, Validators, FormGroup, FormBuilder } from "@angular/forms";
import { Location } from "@angular/common";
import * as _ from "underscore";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { GlobalService } from "../../../../shared/service/global.service";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";
import { OnboardingGuideDialogComponent } from "../../../../component/onboarding/onboarding-guide/onboarding-guide.component";
import { AdminService } from "../../admin.service";
@Component({
  selector: "app-manufacturer",
  templateUrl: "./manufacturer.component.html",
  styleUrls: ["./manufacturer.component.css"]
})
export class ManufacturerComponent implements OnInit, OnDestroy {
  public manufacturerList: any = [];
  public selectedIndex: number;
  public selectedManufacturer: any;
  public isEditManufacturer = false;
  public manufacturerBackup: any;
  public errMsg: string;
  public isError = false;
  public searchList;
  public searchTxt: string;
  public paginationKey: any;
  public listCount = 0;
  private currentPath: string;
  editManufacturFm: FormGroup;
  public sortColumn = "manf_id";
  public sortOrder = "DSC";
  commentSearch;
  typeSearch;
  manfSearch;
  public onBoarding = false;
  private paramsUrl: string;

  constructor(
    @Inject(APP_CONFIG)
    private config: AppConfig,
    public util: UtilService,
    private router: Router,
    private route: ActivatedRoute,
    public constant: ConstantsService,
    public dialog: MatDialog,
    private http: HttpService,
    private fb: FormBuilder,
    private location: Location,
    private global: GlobalService,
    private admin: AdminService
  ) {
  }

  ngOnInit() {
    const self = this;
    this.util.showProcessing("processing-spinner");
    this.currentPath = this.router.url.split("/")[
      this.router.url.split("/").length - 2
    ];
    this.currentPath === "manufacturer"
      ? this.router.url.split("/")[2] === "csa-onboarding"
        ? this.util.menuChange({ menu: "guide", subMenu: "" })
        : this.util.menuChange({ menu: 2, subMenu: 13 })
      : "";
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.getManufacturerList();
    this.createManufacturerForm();
    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };

    this.util.changeDetection.subscribe(dataObj => {

      if (dataObj && dataObj.source === "MANUFACTURER") {
        self.getManufacturerList();
        self.selectedManufacturer = null;
        self.selectedIndex = null;
        self.searchTxt = self.searchList = "";
      }
    });
  }

  ngOnDestroy() {
    this.util.setPopupFlag(false);
  }

  public createManufacturerForm() {
    this.editManufacturFm = this.fb.group({
      manfName: new FormControl("", [Validators.required, Validators.maxLength(this.constant.DEFAULT_NAME_MAXLENGTH)]),
      comment: new FormControl("", [
        Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ])
    });
  }

  get manfName() {
    return this.editManufacturFm.get("manfName");
  }
  get comment() {
    return this.editManufacturFm.get("comment");
  }

  getManufacturerList() {
    const self = this;
    try {
      this.admin.getManufacturerList((error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException("Manufacturer", "getManufacturerList()", response);
        } else {
          self.manufacturerList = response.data;
          if (self.manufacturerList.length == 0) {
            self.onBoarding = true;
          }
          if (self.util.getPopupFlag()) {
            self.addManufacturer();
            self.util.setPopupFlag(false);
          }
          window.location.href.split("/").pop() != "0"
            ? self.showMfgDetails()
            : "";
        }
      });
    } catch (err) {
      this.global.addException("Manufacturer", "getManufacturerList()", err);
    }
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

  showMfgDetails() {
    const sortedList: any[] = _.sortBy(
      this.manufacturerList,
      "manf_id"
    ).reverse();
    for (let i = 0; i < sortedList.length; ++i) {
      if (window.location.href.split("/").pop() == sortedList[i].manf_id) {
        this.getSelectedManufacturer(sortedList[i].manf_id, i);
        this.selectedIndex = i;
        break;
      }
    }
  }
  addFromCSV() {
    const self = this;
    let route: string,
      apiEndPoint: string,
      csvTemplateUrl: string,
      redirectUrl: string;
    route = "/csa/csv-preview/manufacturer";
    apiEndPoint = "manufacturer/csv";
    csvTemplateUrl = this.config.domainIP + "api/public/download/csv/manufacturer.csv";
    redirectUrl = "/admin/csa/manufacturer/0";

 self.util.showProcessing("processing-spinner");
 try {
  this.http.doGet("company/download-invalid-data/Manufacturer", function (error: boolean, response: any) {
    self.util.hideProcessing("processing-spinner");
    if (error) {
      self.global.addException("services", "addFromCSV()", response);
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

  getSelectedManufacturer(manufactureId: any, index: number) {
      const self = this;
      this.isError = false;
      this.isEditManufacturer = false;
      this.errMsg = "";
      this.selectedIndex = index;
      self.util.showProcessing("processing-spinner");
      this.http.doGet(`manufacturer/${manufactureId}/details`, function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.global.addException(
            "Manufacturer",
            "getSelectedManufacturer()",
            response
          );
        } else {
          try {
            const manufacturerObj = self.selectedManufacturer = response.data;
            self.manufacturerBackup = JSON.parse(JSON.stringify(manufacturerObj));
            self.editManufacturFm.get("manfName").setValue(manufacturerObj.manf_name);
            self.editManufacturFm.get("comment").setValue(manufacturerObj.comment);
            self.location.go(
              self.location
                .path()
                .split("/")
                .splice(0, self.location.path().split("/").length - 1)
                .join("/") +
                "/" +
                manufacturerObj.manf_id
            );
              setTimeout(() => {self.util.scrollDown("mfgMark");
              self.paramsUrl = window.location.href.split("/").pop();

              } , 1000);
          } catch (err) {
            self.global.addException(
              "Manufacturer",
              "getSelectedManufacturer()",
              err
            );
          }
        }
      });
  }

  editManufacturerFlageChange() {
    try {
      this.isEditManufacturer = true;
      this.editManufacturFm
        .get("manfName")
        .setValue(this.selectedManufacturer.manf_name);
      this.editManufacturFm
        .get("comment")
        .setValue(this.selectedManufacturer.comment);
    } catch (err) {
      this.global.addException(
        "Manufacturer",
        "editManufacturerFlageChange()",
        err
      );
    }
  }

  updateManufacturer(form: FormGroup) {
    const self = this;
    self.isError = false;
    self.errMsg = "";
    try {
      if (form.valid) {
        const reqObj = {
          manf_id: self.selectedManufacturer.manf_id,
          manf_name: form.value.manfName,
          comment: form.value.comment
        };

        self.util.addSpinner("update-manufacturer-btn", "Update");
        this.http.doPost("manufacturer/update", reqObj, (
          error: boolean,
          response: any
        ) => {
          self.util.removeSpinner("update-manufacturer-btn", "Update");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
            this.global.addException("Manufacturer", "updateManufacturer()", response);
          } else {
            self.selectedManufacturer.manf_name = form.value.manfName;
            self.selectedManufacturer.comment = form.value.comment;
            self.isEditManufacturer = false;
            // self.util.showProcessing("processing-spinner");
            self.getManufacturerList();
          }
        });
      }
    } catch (err) {
      this.global.addException("Manufacturer", "updateManufacturer()", err);
    }
  }

  cancelEditManufacturer() {
    try {
      this.isEditManufacturer = false;
      this.selectedManufacturer = JSON.parse(
        JSON.stringify(this.manufacturerBackup)
      );
    } catch (err) {
      this.global.addException("Manufacturer", "cancelEditManufacturer()", err);
    }
  }

  showDeleteConfirmation() {
    try {
      const data: any = {
        API_URL: "manufacturer/delete",
        reqObj: {
          manf_id: this.selectedManufacturer.manf_id
        },
        event: {
          source: "MANUFACTURER",
          action: "DELETE"
        }
      };
      this.util.showDialog(
        DialogComponent,
        "Are you sure you want to delete " + //@ Shahebaz - Start
        this.selectedManufacturer.manf_name + //@ Shahebaz - End
          " ?",
        [],
        "Delete Confirmation ?",
        "CONFIRMATION",
        data
      );
    } catch (err) {
      this.global.addException("Manufacturer", "showDeleteConfirmation()", err);
    }
  }

  addManufacturer() {
    try {
      const self = this;
      this.dialog.open(ManufacturerDialog, {
        data: { action: "addManufacturer" },
        autoFocus: false
      });
    } catch (err) {
      this.global.addException("Manufacturer", "addManufacturer()", err);
    }
  }
  showImage(url) {
    this.dialog.open(ManufacturerDialog, {
      data: { action: "image", url: url }
    });
    // this.ref.tick();
  }
}

@Component({
  selector: "",
  templateUrl: "./manufacturer-dialog.component.html",
  styleUrls: ["./manufacturer.component.css"]
})
export class ManufacturerDialog implements OnInit, OnDestroy {
  public errMsg = "";
  public isError = false;
  public isSuccess = false;
  public submitted = false;
  public successMsg = "";
  public action: string;
  private currentPath: string;

  addManufacturFm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ManufacturerDialog>,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
    private util: UtilService,
    public constant: ConstantsService,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpService,
    private global: GlobalService
  ) {
    this.action = dataObj.action;
  }

  ngOnInit() {
    this.currentPath = this.router.url.split("/")[3];
    this.createManufacturerForm();
  }

  ngOnDestroy() {
    this.router.url.split("/")[2] === "csa-onboarding" &&
    this.router.url.split("/")[3] === "manufacturer"
      ? this.router.navigate(["/csa-onboarding/guide"])
      : "";
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  public createManufacturerForm() {
    this.addManufacturFm = this.fb.group({
      manfName: new FormControl("", [Validators.required, Validators.maxLength(this.constant.DEFAULT_NAME_MAXLENGTH) ] ),
      comment: new FormControl("", [
        Validators.minLength(2),
        Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ])
    });
  }

  get manfName() {
    return this.addManufacturFm.get("manfName");
  }
  get comment() {
    return this.addManufacturFm.get("comment");
  }

  addManufacturer(form: FormGroup) {
    try {
      const self = this;
      self.errMsg = "";
      self.submitted = true;
      self.isError = false;
      if (form.valid) {
        const reqObj = {
          manf_name: form.value.manfName,
          comment: form.value.comment
        };
        self.util.addSpinner("add-manufacturer-btn", "Submit");
        this.http.doPost("manufacturer/create", reqObj, (
          error: boolean,
          response: any
        ) => {
          self.util.removeSpinner("add-manufacturer-btn", "Submit");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
            this.global.addException("Manufacturer", "addManufacturer()", response);
          } else {
            const manfObj = {"manf_id": response.data.manf_id, "manf_name": response.data.manf_name};
            self.util.setPopupFlag(false);
            self.util.changeEvent({ source: "MANUFACTURER", action: "ADD", "data": manfObj });
            self.currentPath === "manufacturer"
              ? ((self.isSuccess = true), (self.successMsg = response.message))
              : self.closeDialog();
          }
        });
      }
    } catch (err) {
      this.global.addException("Manufacturer", "addManufacturer()", err);
    }
  }

  continueCreating(): void {
    this.errMsg = "";
    this.isError = false;
    this.submitted = false;
    this.createManufacturerForm();
    this.isSuccess = false;
  }
}
