import { Component, OnInit, Inject, AfterViewInit, OnChanges, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { ApplicationRef } from "@angular/core";
import {
  FormControl, Validators, FormGroup, FormBuilder } from "@angular/forms";
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from "angular-2-dropdown-multiselect";
import { UploadEvent, FileSystemFileEntry } from "ngx-file-drop";
import { Observable } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { Location } from "@angular/common";
import * as _ from "underscore";
import { GlobalService } from "../../../../shared/service/global.service";
import { UtilService } from "../../../../shared/service/util.service";
import { FileService } from "../../../../shared/service/file.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
@Component({
  selector: "app-manufacturer-part",
  templateUrl: "./manufacturer-part.component.html",
  styleUrls: [
    "./manufacturer-part.component.css",
    "./mfg-attributes/mfg-attributes.component.scss"
  ]
})
export class ManufacturerPartComponent implements OnInit, AfterViewInit {
  pageData: any = {
    manufacturerPartList: [],
    listCount: 0,
    imageCount: 0,
    sortColumn: "manf_part_id",
    sortOrder: "DSC",
    partDetails: "details",
    isEdit: false,
    isError: false,
    pageData: false,
    dragOver: false,
    newFileUpload: false,
    isThumbnailSet: false,
    UPC_VALIDATORS: [
      Validators.required,
      Validators.max(999999999999999999999999999999)
    ]
  };
  listKeys: string[] = ["uomList", "itemclass"];
  sortColumnType: string = "A";
  editMFGForm: FormGroup;
  mulSelSettings: IMultiSelectSettings = {
    displayAllSelectedText: true
  };
  // replacesList: IMultiSelectOption[] = [];
  // equivalentList: IMultiSelectOption[] = [];
  // replacesList = [];
  equivalentList = [];
  public selectText: IMultiSelectTexts = {
    defaultTitle: ""
  };
  filteredClass: Observable < string[] > ;
  public searchTxt: string;
  searchList: string;
  private selectedIndex: number;
  public onBoarding = false;

  constructor(
    public router: Router,
    private fb: FormBuilder,
    public util: UtilService,
    private file: FileService,
    private dialog: MatDialog,
    private ref: ApplicationRef,
    private route: ActivatedRoute,
    private http: HttpService,
    public constant: ConstantsService,
    private location: Location,
    private global: GlobalService
  ) {}

  ngOnInit() {
    this.util.setWindowHeight();
    this.router.url.split("/")[2] === "csa-onboarding" ?
      this.util.menuChange({
        menu: "guide",
        subMenu: ""
      }) :
      this.util.menuChange({
        menu: 2,
        subMenu: 14
      });
    this.pageData.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.createMFGForm();
    this.util.showProcessing("processing-spinner");
    this.getManufacturerPart("1");
    this.util.setPageTitle(this.route);
    this.pageSetUp(this.pageData, this.listKeys);
    this.util.changeDetection.subscribe(recordObj => {
      const self = this;
      if (
        recordObj &&
        recordObj.source == "MANUFACTURER_PART" &&
        recordObj.action == "DELETE"
      ) {
        self.getManufacturerPart("0");
        self.searchTxt = self.searchList = "";
      }
    });
    this.onChanges();
  }
  ngAfterViewInit() {

    this.manfUPC.valueChanges.pipe(debounceTime(1000)).subscribe(searchString => {
      this.validateUPC(searchString);
    });
  }
  onChanges() {}
  validateUPC(event: any) {
    const self = this;
    self.pageData.isError = false;
    if (!self.manfUPC.valid && !self.manfUPC.dirty) {
      return;
    }
    try {
      if (this.manfUPC.value !== "" && this.manfUPC.value !== this.pageData.selectedPart.upc) {
        this.http.doGet(`item-definition/isUniqueItemDefUpc/${this.manfUPC.value}`, (error: boolean, response: any) => {
          if (error) {
            // console.log(response.message);
            this.global.addException("validate UPC", "validateUPC()", response);
          } else {
            self.pageData.isError = true;
            self.pageData.upcAvailability = response.data.is_available;
          }
        });
      }
    } catch (err) {
      this.global.addException("validate UPC", "validateUPC()", err);
    }
  }
  getSearchTxt(filterValue: string) {
    if (filterValue === "") {
      this.searchTxt = "";
    }
  }

  pageSetUp(pageObj, listArray, varArray: string[] = []) {
    for (let i = 0; i < listArray.length; i++) {
      pageObj[listArray[i]] = [];
    }
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = this.pageData.listCount = count;
  }
  addManufacturerPart() {
    try {
      sessionStorage.removeItem("newPart");
      sessionStorage.removeItem("class");
      this.util.setMfgPartData([]);
      this.router.url.split("/")[2] === "csa-onboarding" ?
        this.router.navigate([
          "/admin/csa-onboarding/add-manufacturer-part/" + btoa("1")
        ]) :
        this.router.navigate([
          "/admin/csa/add-manufacturer-part/" + btoa("1")
        ]);
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "addManufacturerPart()",
        err
      );
    }
  }

  getUOMLists() {
    try {
      const self = this;
      for (let i = 0; i < this.listKeys.length; i++) {
        this.http.doGet("uom/list", (error: boolean, response: any) => {
          if (error) {
            // console.log(response);
            this.global.addException("Manufacturer part", "getUOMLists()", response);
          } else {
            self.pageData.uomList = response.data;
          }
        });
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "getUOMLists()", err);
    }
  }

  getSelectedClass(obj: any, event: any): void {
    try {
      if (event.isUserInput) {
        this.class.setValue(obj.item_class_id);
        this.getClass(obj.item_class_type);
        this.getSelectedEqAndReplaces(this.pageData.selectedPart.item_type);
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "getSelectedClass()", err);
    }
  }
  getClass(itemType) {
    try {
      this.pageData.submitted = false;
      this.pageData.itemType = this.constant.ITEM_TYPES[itemType];
      if (
        this.pageData.itemType === "Asset" ||
        this.pageData.itemType === "Product"
      ) {
        this.util.addBulkValidators(
          this.editMFGForm,
          ["manufacturerId"],
          [Validators.required, Validators.maxLength(30)]
        );
        this.util.addBulkValidators(
          this.editMFGForm,
          ["itemDefinitionNo"],
          [Validators.maxLength(30)]
        );

        if (this.pageData.itemType === "Asset") {
          this.util.addBulkValidators(this.editMFGForm, ["UOM"], []);
          this.util.addBulkValidators(this.editMFGForm, ["minimumStock"], []);
          this.util.addBulkValidators(this.editMFGForm, ["salePrice"], []);
          this.util.addBulkValidators(
            this.editMFGForm,
            ["manfUPC"],
            []
          );
        } else {
          this.util.addBulkValidators(
            this.editMFGForm,
            ["minimumStock"],
            [Validators.required, Validators.min(1), Validators.max(99999999)]
          );
          if (this.manfUPC.value === "barcode") {
            this.util.addBulkValidators(
              this.editMFGForm,
              ["manfUPC"],
              [Validators.required, Validators.pattern(this.constant.CODE39_WITHOUT_SPACE_PATTERN), Validators.maxLength(30)]
            );
          }
          this.util.addBulkValidators(this.editMFGForm, ["salePrice"],
            [Validators.pattern(this.constant.AMOUNT_PATTERN)]);
        }
      } else if (this.pageData.itemType === "Material") {
        this.util.addBulkValidators(
          this.editMFGForm,
          ["manufacturerId", "itemDefinitionNo", "manfUPC"],
          []
        );
        this.util.addBulkValidators(
          this.editMFGForm,
          ["UOM"],
          [Validators.required, Validators.maxLength(30)]
        );
        this.util.addBulkValidators(
          this.editMFGForm,
          ["minimumStock"],
          [Validators.required, Validators.min(1), Validators.max(99999999)]
        );
        this.util.addBulkValidators(this.editMFGForm, ["salePrice"],
          [Validators.pattern(this.constant.AMOUNT_PATTERN)]);
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "getClass()", err);
    }
  }

  getManufacturerPart(option, id ? ) {
    try {
      const self = this;
      option === "1" ?
        ((this.pageData.selectedPart = this.pageData.selectedIndex = null),
          (this.pageData.isEdit = false)) :
        "";
      this.http.doGet("item-definition/list", (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        self.pageData.manufacturerPartList = [];
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException(
            "Manufacturer part",
            "getManufacturerPart()",
            response
          );
        } else {
          self.pageData.manufacturerPartList = response.data;
          // console.log(self.pageData.manufacturerPartList );
          if (self.pageData.manufacturerPartList.length === 0) {
            self.onBoarding = true;
          }
          self.ref.tick();
          // self.route.snapshot.paramMap.get("id") !== "0"
          window.location.href.split("/").pop() != "0" ?
            self.showMfgPartDetails(id) :
            "";
        }
      });
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "getManufacturerPart()",
        err
      );
    }
  }

  showMfgPartDetails(id ? ) {
    try {
      if (id) {
        this.getSelectedPart(id, this.pageData.selectedIndex);
      } else {
        const data = JSON.parse(JSON.stringify(this.pageData.manufacturerPartList));
        const sortedList: any[] = _.sortBy(
          data,
          "item_def_id"
        ).reverse();
        for (let i = 0; i < sortedList.length; ++i) {
          if (
            // this.route.snapshot.paramMap.get("id") == sortedList[i].item_def_id
            window.location.href.split("/").pop() == sortedList[i].item_def_id
          ) {
            this.getSelectedPart(sortedList[i].item_def_id, i);
            this.pageData.selectedIndex = i;
            break;
          }
        }
      }
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "showMfgPartDetails()",
        err
      );
    }
  }

  getSelectedPart(partId: any, index) {
    this.pageData.selectedIndex = index;
    this.util.showProcessing("processing-spinner");
    try {
      const self = this;
      this.http.doGet(`item-definition/${partId}/details`, (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          this.global.addException("Manufacturer part", "getSelectedPart()", response);
        } else {
          const part = response.data;
          self.pageData.isEdit = self.pageData.isError = self.pageData.newFileUpload = self.pageData.isThumbnailSet = false;
          self.pageData.selectedPart = JSON.parse(JSON.stringify(part));
          self.pageData.selectedPart.item_equivalent_id = part.item_equivalent_id;
          // self.pageData.selectedPart.item_replaces_id = part.item_replaces_id ;
          self.pageData.itemType = self.constant.ITEM_TYPES[part.item_type];
          self.createMFGForm(part);
          self.getSelectedEqAndReplaces(part.item_type);
          self.pageData.partBackup = JSON.parse(JSON.stringify(part));
          self.location.go(
            self.location
            .path()
            .split("/")
            .splice(0, self.location.path().split("/").length - 1)
            .join("/") +
            "/" +
            part.item_def_id
          );
          setTimeout(function () {
            self.util.scrollDown("mfgPartMark");
          }, 1000);
        }
      });

    } catch (err) {
      this.global.addException("Manufacturer part", "getSelectedPart()", err);
    }
  }

  getSelectedMultiSelArray(array: any, keyString) {
    try {
      const finalArray: any[] = [];
      for (let i = 0; i < array.length; i++) {
        keyString == "equ" ?
          finalArray.push(array[i].manf_part_equ_id) :
          finalArray.push(array[i].manf_part_rep_id);
      }
      return finalArray;
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "getSelectedMultiSelArray()",
        err
      );
    }
  }

  create2DList(list) {
    try {
      let listCont = 0,
        imgArr = [],
        inArr = [];
      while (listCont < list.length) {
        let count = 0;
        inArr = [];
        while (count < 3 && listCont < list.length) {
          inArr.push(list[listCont]);
          count++;
          listCont++;
        }
        imgArr.push({
          inArray: inArr
        });
      }
      return imgArr;
    } catch (err) {
      this.global.addException("Manufacturer part", "create2DList()", err);
    }
  }

  createManualList(list, type) {
    try {
      let listCont = 0;
      const imgArr = [];
      let inArr = [];
      if (list) {
        while (listCont < list.length) {
          let count = 0;
          inArr = [];
          while (count < 3 && listCont < list.length) {
            if (type === "pdf") {
              const fileName: string[] = list[listCont].doc_name.split(".");
              fileName.pop();
              inArr.push({
                doc_id: list[listCont].doc_id,
                extension: list[listCont].doc_name.split(".").pop(),
                doc_path: list[listCont].doc_path,
                doc_name: fileName,
                doc_desc: list[listCont].doc_desc,
                manf_part_id: list[listCont].manf_part_id,
                isDelete: 0
              });
            } else {
              const fileName: string[] = list[listCont].image_name.split(".");
              fileName.pop();
              inArr.push({
                image_id: list[listCont].image_id,
                extension: list[listCont].image_name.split(".").pop(),
                image_path: list[listCont].image_path,
                image_name: fileName,
                is_thumbnail: list[listCont].is_thumbnail,
                image_desc: list[listCont].image_desc,
                manf_part_id: list[listCont].manf_part_id,
                isDelete: 0
              });
            }
            // inArr.push(list[listCont]);
            count++;
            listCont++;
          }
          // imgArr.push({ 'inArray': inArr });
        }
      }
      // console.log("createManualList", inArr);
      return inArr;
    } catch (err) {
      this.global.addException("Manufacturer part", "createManualList()", err);
    }
  }

  createMFGForm(partObj ? ) {
    const upcType = partObj && partObj.is_system_generated === 0 ? "barcode" : "barcode";
    this.editMFGForm = this.fb.group({
      itemDefId: new FormControl(partObj ? partObj.item_def_id : ""),
      itemType: new FormControl(partObj ? partObj.item_type : ""),
      manufacturerId: new FormControl(partObj ? partObj.manufacturers[0].manf_id : ""),
      adminItemDef: new FormControl(partObj ? partObj.manufacturers[0].admin_manf_item_def_rel_id : ""),
      itemDefinitionNo: new FormControl(partObj ? partObj.item_definition_no : "", [
        Validators.maxLength(30)
      ]),
      upcType: new FormControl(partObj ? upcType : "barcode"),
      manfUPC: new FormControl(partObj ? partObj.upc : ""),
      description: new FormControl(partObj ? partObj.description : ""),
      shortName: new FormControl(partObj ? partObj.item_definition_name : "", [
        Validators.required,
        Validators.maxLength(50)
      ]),
      equivalent: new FormControl(partObj ? partObj.item_equivalent_id : ""),
      salePrice: new FormControl(partObj ? partObj.sales_price : "", []),
      minimumStock: new FormControl(partObj ? partObj.minimum_stock : "", [
        Validators.min(1),
        Validators.max(99999999)
      ]),
      UOM: new FormControl(partObj ? partObj.uom_id : "", []),
      // replaces: new FormControl(partObj ? partObj.item_replaces_id : "")
    });
    this.getClass(partObj ? partObj.item_type : "");
    if (partObj && (partObj.item_type === 1 || partObj.item_type === 3)) {
      this.getUOMLists();
    }
  }

  get itemDefId() {
    return this.editMFGForm.get("itemDefId");
  }
  get itemType() {
    return this.editMFGForm.get("itemType");
  }
  get upcType() {
    return this.editMFGForm.get("upcType");
  }
  get itemDefinitionNo() {
    return this.editMFGForm.get("itemDefinitionNo");
  }
  get manufacturerId() {
    return this.editMFGForm.get("manufacturerId");
  }
  get manfUPC() {
    return this.editMFGForm.get("manfUPC");
  }
  get description() {
    return this.editMFGForm.get("description");
  }
  get shortName() {
    return this.editMFGForm.get("shortName");
  }
  get equivalent() {
    return this.editMFGForm.get("equivalent");
  }
  get salePrice() {
    return this.editMFGForm.get("salePrice");
  }
  get minimumStock() {
    return this.editMFGForm.get("minimumStock");
  }
  get UOM() {
    return this.editMFGForm.get("UOM");
  }
  get class() {
    return this.editMFGForm.get("class");
  }
  // get replaces() {
  //   return this.editMFGForm.get("replaces");
  // }

  editFlageChange(option) {
    try {
      this.pageData.isEdit = true;
      this.pageData.isError = false;
      this.pageData.newFileUpload = false;
    } catch (err) {
      this.global.addException("Manufacturer part", "editFlageChange()", err);
    }
  }

  getSelectedEqAndReplaces(type) {
    const self = this;
    try {
      this.http.doGet(`item-definition/drop-down/type/${type}`, (error: boolean, response: any) => {
        if (error) {
          self.global.addException("Manufacturer part", "getSelectedEqAndReplaces()", response);
        } else {
          self.pageData.allManfParts = response.data;
          const list = [];
          self.pageData.allManfParts.map(item => {
            const obj: any = {
              id: item.item_def_id,
              name: item.item_definition_name
            };
            list.push(obj);
          });
          self.equivalentList = list;
        }
      });
    } catch (err) {
      this.global.addException("Manufacturer part", "getSelectedEqAndReplaces()", err);
    }
  }

  cancelEditPart() {
    try {
      this.pageData.isEdit = false;
      this.pageData.newFileUpload = false;
      this.pageData.selectedPart = JSON.parse(
        JSON.stringify(this.pageData.partBackup)
      );
      this.createMFGForm(this.pageData.selectedPart);
    } catch (err) {
      this.global.addException("Manufacturer part", "cancelEditPart()", err);
    }
  }
  setUpdateData(form) {
    const self = this;
    const type = parseInt(form.value.itemType, 10);
    const reqObj = {};
    if (type === 1) {
      const upc = form.value.upcType === "barcode" ? form.value.manfUPC : form.value.manfUPC;
      reqObj["upc"] = upc;
    }
    if (type === 1 || type === 3) {
      reqObj["sales_price"] = parseFloat(form.value.salePrice);
    }
    reqObj["documents"] = [];
    for (let i = 0; i < self.pageData.selectedPart.documents.length; i++) {
      const id = self.pageData.selectedPart.documents[i].attachment_id ? self.pageData.selectedPart.documents[i].attachment_id : "";
      const isDelete = self.pageData.selectedPart.documents[i].is_delete ? self.pageData.selectedPart.documents[i].is_delete : 0;
      const documents = {
        "attachment_type": self.pageData.selectedPart.documents[i].attachment_type,
        "attachment_name": self.pageData.selectedPart.documents[i].attachment_name,
        "attachment_path": self.pageData.selectedPart.documents[i].attachment_path,
        "comment": self.pageData.selectedPart.documents[i].comment,
        "attachment_id": id,
        "is_delete": isDelete,
        "is_thumbnail": self.pageData.selectedPart.documents[i].is_thumbnail,
      };
      reqObj["documents"].push(documents);
    }
    reqObj["item_def_id"] = form.value.itemDefId,
      reqObj["item_type"] = type,
      reqObj["description"] = form.value.description,
      reqObj["item_definition_name"] = form.value.shortName,
      reqObj["item_definition_no"] = form.value.itemDefinitionNo,
      reqObj["minimum_stock"] = form.value.minimumStock,
      reqObj["uom_id"] = form.value.UOM,
      // reqObj["item_replaces_id"] = parseInt(form.value.replaces, 10),
      reqObj["item_equivalent_id"] = parseInt(form.value.equivalent, 10),
      reqObj["manufacturers"] = [{
        "manf_id": form.value.manufacturerId,
        "admin_manf_item_def_rel_id": form.value.adminItemDef,
        "is_delete": 0
      }];
    return reqObj;
  }
  editManufacturerPart(form: FormGroup) {
    try {
      const self = this;
      self.pageData.submitted = true;
      self.pageData.isError = false;
      self.pageData.errMsg = "";
      if (form.valid) {
        const reqObj = this.setUpdateData(form);
        this.util.showProcessing("processing-spinner");
        this.http.doPost("item-definition/update", reqObj, (
          error: boolean,
          response: any
        ) => {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            self.pageData.isError = true;
            self.pageData.errMsg = response.message;
            self.global.addException("Manufacturer part", "editManufacturerPart()", response);
          } else {
            self.pageData.isEdit = false;
            self.getManufacturerPart("0", self.pageData.selectedPart.item_def_id);
            // self.pageData.selectedPart = response.data;
            self.pageData.partBackup = JSON.parse(
              JSON.stringify(self.pageData.selectedPart)
            );
          }
        });
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "cancelEditPart()", err);
    }
  }

  showDetails(option) {
    try {
      this.pageData.partDetails = option;
      this.pageData.isEdit = this.pageData.newFileUpload = this.pageData.isThumbnailSet = false;
      this.pageData.selectedPart = JSON.parse(
        JSON.stringify(this.pageData.partBackup)
      );
    } catch (err) {
      this.global.addException("Manufacturer part", "showDetails()", err);
    }
  }
  editManufacturerAttribute() {
    try {
      let self = this;
      self.pageData.isError = false;
      self.pageData.errMsg = "";
      let attArr: any = [];
      for (var i = 0; i < this.pageData.selectedPart.attributes.length; i++) {
        if (
          this.pageData.selectedPart.attributes[i].attribute_label.trim() ==
          "" ||
          this.pageData.selectedPart.attributes[i].attribute_data.trim() == ""
        ) {
          if (this.pageData.selectedPart.attributes.length != 1) {
            this.pageData.isError = true;
            this.pageData.errMsg = "Enter Attribute Label and Attribute Data.";
            return;
          }
        } else {
          attArr.push({
            attrId: this.pageData.selectedPart.attributes[i].attribute_id,
            label: this.pageData.selectedPart.attributes[i].attribute_label,
            format: this.pageData.selectedPart.attributes[i].attribute_data,
            isDelete: this.pageData.selectedPart.attributes[i].isDelete
          });
        }
      }

      self.util.addSpinner("update-attribute-btn", "Update");
      self.http.doPost(
        "manufPartEdit/attributes", {
          manufacturerPartId: self.pageData.selectedPart.manf_part_id,
          attribute: attArr
        }, (error: boolean, response: any) => {
          self.util.removeSpinner("update-attribute-btn", "Update");
          if (error) {
            self.pageData.isError = true;
            self.pageData.errMsg = response.message;
            this.global.addException(
              "Manufacturer part",
              "editManufacturerAttribute()",
              response
            );
          } else {
            self.pageData.isEdit = false;
            self.pageData.selectedPart.attributes = response.data.attributes;
            self.pageData.selectedPart.attributes.filter(
              item => (item.isDelete = 0)
            );
            self.pageData.partBackup = JSON.parse(
              JSON.stringify(self.pageData.selectedPart)
            );
            self.getManufacturerPart("0");
          }
        }
      );
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "editManufacturerAttribute()",
        err
      );
    }
  }

  changeUploadFileFlage() {
    this.pageData.newFileUpload = true;
    this.ref.tick();
  }

  onFileChange(event, option) {
    const fileList: FileList = event.target.files;
    this.pageData.errMsg = "";
    this.pageData.isError = false;
    this.fileProcessing(fileList, option);
  }

  fileProcessing(fileList, option) {
    try {
      const self = this;
      let conImgCount = 0;
      if (fileList.length > 0) {
        for (let i = 0; i < fileList.length; i++) {
          const file: File = fileList[i];
          const fileDetailsObj: any = {};
          const extension: string  = fileList[i].name ? fileList[i].name.split(".").pop() : "";
          const fileName: string[] = fileList[i].name ? fileList[i].name.split(".") : "";
          if (fileName) {
            fileName.pop();
          } else {
            self.pageData.isError = true;
            self.pageData.errMsg = "Invalid File Path - No file found at the path";
            return;
          }
          fileDetailsObj.fileName = fileName;
          fileDetailsObj.ext = extension;

          if (
            (option === "img" &&
              (extension === "jpg" ||
                extension === "png" ||
                extension === "jpeg")) ||
            (option === "doc" && extension === "pdf")
          ) {
            self.util.addSpinner("update-details-btn", "Update");
            self.util.addSpinner("update-image-btn", "Update");
            self.util.addSpinner("update-doc-btn", "Update");
            if (fileList[i].size / 1048576 < 10) {
              self.convertToBase64(file, function (base64) {
                fileDetailsObj.imgPath = base64;
                const formData: FormData = new FormData();
                formData.append("file", file);
                formData.append("company_id", self.pageData.selectedPart.company_id);
                self.file.formDataAPICall(formData, "attachments/upload", function (
                  error: boolean,
                  response: any
                ) {
                  self.util.removeSpinner("update-details-btn", "Update");
                  self.util.removeSpinner("update-image-btn", "Update");
                  self.util.removeSpinner("update-doc-btn", "Update");
                  if (error) {} else {
                    fileDetailsObj.fileDetails = response.data,
                      fileDetailsObj.type = extension === "pdf" ? 2 : 1;
                    self.pushNewFile(file, fileDetailsObj, option);
                    self.pageData.imageCount++;
                    conImgCount++;
                    self.ref.tick();
                  }
                });
              });
            } else {
              self.pageData.dragOver = false;
              self.pageData.isError = true;
              self.pageData.errMsg = "File must be less than 10 MB.";
              self.ref.tick();
            }
          } else {
            self.pageData.dragOver = false;
            self.pageData.isError = true;
            self.pageData.errMsg =
              option === "img" ?
              "Only jpg, jpeg, png or pdf file allowed." :
              "Only pdf file allowed.";
            self.ref.tick();
          }
        }
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "fileProcessing()", err);
    }
  }

  convertToBase64(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (fileLoadedEvent: any) => {
      return callback(fileLoadedEvent.target.result);
    };
  }
  pushNewFile(file, fileObj, option) {
    try {
      if (option === "img") {
        const newObj = {
          attachment_id: "0",
          attachment_name: fileObj.fileDetails.file_name,
          extension: fileObj.ext,
          is_thumbnail: this.pageData.selectedPart.documents.length == 0 ? 1 : 0,
          comment: "",
          attachment_path: fileObj.fileDetails.file_path,
          // file: file,
          attachment_type: 1
        };
        this.pageData.selectedPart.documents.push(newObj);
        this.ref.tick();
      } else {
        const newObj = {
          attachment_id: "0",
          attachment_name: fileObj.fileDetails.file_name,
          attachment_path: fileObj.fileDetails.file_path,
          extension: fileObj.ext,
          comment: "",
          attachment_type: 2
        };
        this.pageData.selectedPart.documents.push(newObj);
        this.ref.tick();
      }
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "editManufacturerDoc()",
        err
      );
    }
  }

  onSelectionChange(index) {
    for (
      let i = 0; i < this.pageData.selectedPart.documents.length; i++
    ) {
      this.pageData.selectedPart.documents[i].is_thumbnail = 0;
    }
    this.pageData.selectedPart.documents[index].is_thumbnail = 1;
  }

  removeImgDoc(id, index, option, isThumbnail) {
    try {
      const self = this;
      self.pageData.isError = false;
      self.pageData.errMsg = "";
      const reqObj = {
        manufPartFileId: id
      };
      self.ref.tick();
      if (option === "img") {
        if (
          isThumbnail == "1" &&
          this.pageData.selectedPart.documents.length > 1
        ) {
          self.pageData.isError = true;
          self.pageData.errMsg =
            "You can not remove thumbnail image. If you want to remove thumbnail image please set other image as thumbnail.";
          self.ref.tick();
        } else {
          this.dialog.open(ManufacturerPartDialog, {
            data: {
              action: "deleteRecord",
              url: "",
              id: id,
              idObj: {
                imageId: id
              },
              successMsg: "Item Definition Image ",
              type: option,
              index: index,
              partObj: this.pageData
            },
            autoFocus: false
          });
          self.ref.tick();
        }
      } else {
        this.dialog.open(ManufacturerPartDialog, {
          data: {
            action: "deleteRecord",
            url: "manufPartDelete/doc",
            id: id,
            idObj: {
              documentId: id
            },
            successMsg: "Item Definition Image ",
            type: option,
            index: index,
            partObj: this.pageData
          },
          autoFocus: false
        });
        self.ref.tick();
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "removeImgDoc()", err);
    }
  }

  showImage(url) {
    this.dialog.open(ManufacturerPartDialog, {
      data: {
        action: "image",
        url: url
      }
    });
    this.ref.tick();
  }

  dropped(event: UploadEvent, option) {
    try {
      this.pageData.errMsg = "";
      this.pageData.isError = false;
      for (const file of event.files) {
        const fileEntry = file.fileEntry as FileSystemFileEntry;
        fileEntry.file(info => {
          if (info) {
            this.fileProcessing([info], option);
            this.pageData.dragOver = false;
            this.ref.tick();
          }
        });
      }
    } catch (err) {
      this.global.addException("Manufacturer part", "dropped()", err);
    }
  }

  fileOver(event) {
    this.pageData.dragOver = true;
    this.ref.tick();
  }
  fileLeave(event) {
    this.pageData.dragOver = false;
    this.ref.tick();
  }
  downloadPDF(path) {
    window.location.href = path;
  }
}

@Component({
  selector: "",
  templateUrl: "./manufacturer-part-dialog.html",
  styleUrls: ["./manufacturer-part.component.css"]
})
export class ManufacturerPartDialog {
  public errMsg = "";
  public successMsg = "";
  public action: string;
  public isError = false;
  public isSuccess = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    public util: UtilService,
    private http: HttpService,
    private ref: ApplicationRef,
    public dialogRef: MatDialogRef < ManufacturerPartDialog > ,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
    private global: GlobalService
  ) {
    this.action = dataObj.action;
  }

  closeDialog(): void {
    this.dialogRef.close();
    this.ref.tick();
  }

  cancelAddManufacturerPart() {
    try {
      this.dialogRef.close();
      sessionStorage.removeItem("newPart");
      this.util.setMfgPartData([]);
      this.router.url.split("/")[2] === "csa-onboarding" ?
        this.router.navigate(["/csa-onboarding/guide"]) :
        this.router.navigate(["/admin/csa/manufacturer-part/0"]);
    } catch (err) {
      this.global.addException(
        "Manufacturer part",
        "cancelAddManufacturerPart()",
        err
      );
    }
  }

  deleteRecord() {
    const self = this;
    self.errMsg = "";
    self.isError = false;
    try {
      self.updateList(self.dataObj);
      this.dialogRef.close();
      this.ref.tick();
    } catch (err) {
      this.global.addException("Manufacturer part", "deleteRecord()", err);
    }
  }

  updateList(dataObj): void {
    try {
      const deletedObj = dataObj.partObj.selectedPart.documents[dataObj.index];
      deletedObj["is_delete"] = 1;
      if (dataObj.type === "img") {
        dataObj.partObj.selectedPart.documents.splice(
          dataObj.index,
          1,
          deletedObj
        );
        dataObj.partObj.imageCount--;
      } else {
        dataObj.partObj.selectedPart.documents.splice(dataObj.index, 1, deletedObj);
      }
      dataObj.partObj.partBackup = JSON.parse(
        JSON.stringify(dataObj.partObj.selectedPart)
      );
    } catch (err) {
      this.global.addException("Manufacturer part", "updateList()", err);
    }
  }

}
