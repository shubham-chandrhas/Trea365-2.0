import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router } from "@angular/router";
import { FileService } from "../../../../../shared/service/file.service";
import { UtilService } from "../../../../../shared/service/util.service";
import { ManufacturerPartDialog } from "./../manufacturer-part.component";
import { DialogComponent } from "../../../../../shared/model/dialog/dialog.component";
import { GlobalService } from "../../../../../shared/service/global.service";
import { HttpService } from "../../../../../shared/service/http.service";

@Component({
  selector: "app-manufacturer-part-review",
  templateUrl: "./manufacturer-part-review.component.html",
  styleUrls: ["./manufacturer-part-review.component.css"]
})
export class ManufacturerPartReviewComponent implements OnInit {
  isError: boolean = false;
  errMsg: string = "";
  mfgPartObj: any;
  routeObj: any;
  currentPath: string;
  constructor(
    public router: Router,
    public util: UtilService,
    public dialog: MatDialog,
    private file: FileService,
    private global: GlobalService,
    private http: HttpService
  ) {}

  ngOnInit() {
    this.currentPath = this.router.url.split("/")[3];
    this.router.url.split("/")[2] === "csa-onboarding" ? this.routeObj = {
      "list": "/csa-onboarding/guide",
      "add": "/admin/csa-onboarding/add-manufacturer-part/" + btoa("0"),
      "edit": "/admin/csa-onboarding/add-manufacturer-part/" + btoa("1")
    } : this.routeObj = {
      "list": "/admin/csa/manufacturer-part/0",
      "add": "/admin/csa/add-manufacturer-part/" + btoa("0"),
      "edit": "/admin/csa/add-manufacturer-part/" + btoa("1")
    };
    this.currentPath === "manufacturer-part-review" ? this.router.url.split("/")[2] === "csa-onboarding" ?
      this.util.menuChange({
        "menu": "guide",
        "subMenu": ""
      }) : this.util.menuChange({
        "menu": 2,
        "subMenu": 14
      }) : "";
    this.util.setWindowHeight();
    this.mfgPartObj = JSON.parse(sessionStorage.getItem("newPart"));
    if (typeof this.mfgPartObj.selectedVal.manufacturer === "object") {
      this.mfgPartObj.selectedVal.manufacturer = this.mfgPartObj.selectedVal.manufacturer.toString();
      // console.log(this.mfgPartObj.selectedVal.manufacturer, this.mfgPartObj.selectedVal.manufacturer.toString());
    }
    this.mfgPartObj.imgDocArr = this.util.getMfgPartData();
  }
  async submitNewMfgPart() {
    try {
      const self = this;
      const imgDocPriArr = this.util.getMfgPartData();
      self.util.addSpinner("sub-btn", "Submit");
      const description = "";
      const thumbnail = -1;
      const type = parseInt(self.mfgPartObj.itemType, 10);
      const reqObj = {
        "item_type"           : type,
        "item_definition_name": self.mfgPartObj.shortName,
        "description"         : self.mfgPartObj.description,
        "documents"           : []
      } ;
      if (type === 1 || type === 3) {
         if (type === 1) {
            self.getDataTypeWise(reqObj);
        }
        reqObj["minimum_stock"] = self.mfgPartObj.minimumStock;
        reqObj["uom_id"]        = self.mfgPartObj.UOM;
        reqObj["sales_price"]   = parseFloat(self.mfgPartObj.salePrice);
      }
      if (type === 2) {
          self.getDataTypeWise(reqObj);
      }
      await this.getFormData(type, reqObj, imgDocPriArr);
      await this.postData(reqObj);
    } catch (err) {
      this.global.addException("Manufacturer", "submitNewMfgPart()", err);
    }
  }
  getDataTypeWise(reqObj) {
          reqObj["manufacturers"]      = [];
          reqObj["item_definition_no"] = this.mfgPartObj.manufacturerPartNo;
          reqObj["item_equivalent_id"] = this.mfgPartObj.equivalent;
          this.getManufData(reqObj);
  }
  getManufData(reqObj) {
    if (typeof this.mfgPartObj.manufacturerId === "object") {
      for (let i = 0; i < this.mfgPartObj.manufacturerId.length; i++) {
        const mauf_id = {
          "manf_id": this.mfgPartObj.manufacturerId[i]
        };
        reqObj["manufacturers"].push(mauf_id);
      }
    } else {
      const mauf_id = {
        "manf_id": this.mfgPartObj.manufacturerId
      };
      reqObj["manufacturers"].push(mauf_id);
    }
  }
  getFormData(type, reqObj, imgDocPriArr) {
    const self = this;
    if (type === 1) {
      reqObj["upc"] = self.mfgPartObj.upcType === "barcode" ? self.mfgPartObj.manfUPC : "";
    }
    for (let i = 0; i < imgDocPriArr.length; i++) {
      const documents = {
        "attachment_type": imgDocPriArr[i].type,
        "attachment_name": imgDocPriArr[i].fileName,
        "attachment_path": imgDocPriArr[i].fileDetails.file_path,
        "comment"        : imgDocPriArr[i].description,
        "is_delete"      : 0,
        "is_thumbnail"   : imgDocPriArr[i].thumbnail
      };
      reqObj.documents.push(documents);
    }
  }
  postData(reqObj) {
    const self = this;
    try {
    this.http.doPost("item-definition/create", reqObj, (
      error: boolean,
      response: any
    ) => {
      self.util.removeSpinner("sub-btn", "Submit");
      if (error) {
        self.isError = true;
        self.errMsg = response.message;
         this.global.addException("Manufacturer-review", "postData()", response);
      } else {
        sessionStorage.removeItem("newPart");
        self.util.setMfgPartData([]);
        // console.log(self.mfgPartObj);
        const obj = {
          "step"                : "DONE",
          "id"                  : reqObj.item_type  === 3 && self.mfgPartObj.isOnTheFly ? self.getManfId() : self.mfgPartObj.manufacturerId,
          "manf_id"             : reqObj.item_type  === 3 && self.mfgPartObj.isOnTheFly ? self.getManfId() : self.mfgPartObj.manufacturerId,
          "manf_name"           : reqObj.item_type  === 3 && self.mfgPartObj.isOnTheFly ? self.getManfName() : self.mfgPartObj.manufacturer,
          "item_definition_name": self.mfgPartObj.shortName,
          "item_def_id"         : response.data.item_def_id,
          "item_type"           : reqObj.item_type,
          "uom"                 : {
                                    "uom_name"   : self.mfgPartObj.selectedVal.UOMName,
                                    "uom_id"     : self.mfgPartObj.UOM,
                                    "uom_symbol" : response.data.uom_symbol
                                  },
          "upc": response.data.upc
        };
        self.currentPath === "manufacturer-part-review" ?
          self.util.showDialog(DialogComponent, response.message,
            [self.routeObj.list, self.routeObj.add]) : self.onTheFlyEvent(obj);
      }
    });
     } catch (err) {
      this.global.addException("Manufacturer-review", "postData()", err);
    }
  }
  getManfId() {
    return this.mfgPartObj.materialManf.manf_id;
  }
  getManfName() {
    return this.mfgPartObj.materialManf.manf_name;
  }
  editDetails() {
    try {
      this.currentPath == "manufacturer-part-review" ? this.router.navigate([this.routeObj.edit]) : this.onTheFlyEvent({
        "step": "S1"
      });
    } catch (err) {
      this.global.addException("Manufacturer", "editDetails()", err);
    }
  }

  cancelAddManufacturer() {
    try {
      this.currentPath == "manufacturer-part-review" ? this.dialog.open(ManufacturerPartDialog, {
        data: {
          "action": "cancelAddManufacturerPart"
        },
        autoFocus: false
      }) : this.onTheFlyEvent({
        "step": "S0"
      });
    } catch (err) {
      this.global.addException("Manufacturer", "cancelAddManufacturer()", err);
    }
  }

  getSelectedValuesArray(array: any[], keyString) {
    try {
      let result = [];
      keyString = keyString + "_id";
      for (let i = 0; i < array.length; i++) {
        let obj: any = {};
        obj[keyString] = array[i];
        result.push(obj);
      }
      return result;
    } catch (err) {
      this.global.addException("Manufacturer", "getSelectedValuesArray()", err);
    }
  }

  onTheFlyEvent(data): void {
    this.util.changeEvent({
      "source": "ON_THE_FLY_MANUFACTURER_PART",
      "action": "ADD",
      "data": data
    });
  }

}
