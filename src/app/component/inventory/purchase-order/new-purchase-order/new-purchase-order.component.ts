import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder, FormArray } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import * as _ from "underscore";

import { AdminService } from "../../../admin/admin.service";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { PurchaseOrderDialog } from "../purchase-order-dialog.component";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { Observable, Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { InventoryDialog } from "../../inventory-dialog.component";
import { ManufacturerDialog } from "../../../../component/admin/manufacturer/manufacturer/manufacturer.component";
declare var jQuery: any;
declare var $: any;
@Component({
  selector: "app-new-purchase-order",
  templateUrl: "./new-purchase-order.component.html",
  styleUrls: ["./new-purchase-order.component.css"]
})
export class NewPurchaseOrderComponent implements OnInit {
  pageData: any = {
    "addOption": "WithPO",
    "itemClass": [],
    "manufacturerPartList": [],
    "manufacturerList": [],
    "supplierList": [],
    "submitted": false,
    "selectedVal": {},
    "selectedMfgPart": null,
    "defaultManf_id": null,
    "defaultManfName": null,
    "locationList": [],
    "addOpt": "WithPO",
    "supplier": null
  };
  addPurchaseOdrFm: FormGroup;
  public totalPayErr: boolean = false;
  public errMsg: string = "";
  public isError: boolean = false;
  isSupplierLoad: boolean = false;
  isManfLoad: boolean = false;
  isManfPartLoad: boolean = false;
  public backEdit: boolean = false;
  public editMode: boolean = false;
  public notFound: boolean = false;
  public submitted: boolean = false;
  public submittedSup: boolean = false;
  public submittedPartial: boolean = false;
  public submittedPartialDate: boolean = false;
  public is_material_default = 0;
  public pageVariables: any = {
    "costOfOrder": "",
    "subTotal": "",
    "taxes": "",
    "totalCost": "",
    "totalPaymentAmount": 0,
    "purchaseOrder": {}
  };
  public currentIndex: number = 0;
  public userInfo: any;
  public newData: any = {};
  today: number = Date.now();
  public suppliersList: any;
  public manufacturerList: any;
  mfgBkList: any[] = [];
  public manfPartsList: any;
  public minDate = new Date();
  private routeObj: any;
  private currentPath;
  autoNumber: number;
  filteredSupplier: Observable < string[] > ;
  itemClass: any[] = [];
  private otfData: any;
  subscription: Subscription;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    public util: UtilService,
    private constant: ConstantsService,
    private http: HttpService,
    private global: GlobalService,
    public router: Router,
    private admin: AdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log(this.minDate);
    this.util.showProcessing("processing-spinner");
    this.getManufacturerList();
    this.isSupplierLoad = true;
    this.routeObj = {
      "list": "/inventory/po/csa/purchase-order-list/",
      "add": "/inventory/po/csa/new-purchase-order"
    }
    this.currentPath = this.router.url.split("/")[this.router.url.split("/").length - 1];
    this.autoNumber = this.util.getUniqueString();
    this.subscription =   this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && this.currentPath === "new-purchase-order") {
            this.otfData = dataObj;
        if (dataObj.source === "ON_THE_FLY_SUPPLIER" && dataObj.data.step === "DONE") {
          this.getSupplierList("REFRESH",dataObj.data.supplier_id);
        } else if (dataObj.source === "ON_THE_FLY_MANUFACTURER_PART" && dataObj.data.step === "DONE") {
          this.getManufacturerPart("REFRESH", this.currentIndex, dataObj.data.id);
        } else if (dataObj.source === "MANUFACTURER") {
          this.getManufacturerList("REFRESH");
        }
      }
    });
  
    if (sessionStorage.getItem("PO_INFO")) {
      this.backEdit = true;
      console.log(JSON.parse(sessionStorage.getItem("PO_INFO")));
      this.newData = JSON.parse(sessionStorage.getItem("PO_INFO"));
      if (!this.newData.purchaseOrder.hasOwnProperty("items")) {
        this.editMode = true;
        this.minDate = new Date(this.newData.purchase_order_date);

        Object.assign(this.newData.purchaseOrder, {
            'items' : this.newData.order_items,
            'supplier' : this.newData.supplierName,
            'supplier_id' : this.newData.supplier_id,
            'comment' : this.newData.comment,
            'status' : this.newData.status,
            'purchase_order_id' : this.newData.purchase_order_id
        });

        // this.newData.purchaseOrder.items = this.newData.order_items;
        // this.newData.purchaseOrder.supplier = this.newData.supplierName;
        // this.newData.purchaseOrder.supplier_id = this.newData.supplier_id;
        // this.newData.purchaseOrder.comment = this.newData.comment;
        // this.newData.purchaseOrder.status = this.newData.status;
        // this.newData.purchaseOrder.purchase_order_id = this.newData.purchase_order_id;

        $("html,body").find("#edit-po").length > 0
            ? ($("html,body").animate(
                { scrollTop: $("#edit-po").offset().top },
                1500
              ),
              sessionStorage.removeItem("POID"))
            : "";

      } else {
        this.editMode = false;
      }
      this.editMode = this.util.poID == "0" ? false : true;
      console.log("this.editMode", this.editMode);
      this.createForm("1", this.newData);
      this.getSelectedSupplier(this.newData.supplier, { isUserInput : true});
    
    } else {
      this.backEdit = false;
      this.createForm("0");
    }
    this.onChanges();
    this.util.menuChange({
      "menu": 3,
      "subMenu": 22
    });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    sessionStorage.getItem("POID") ? ($("html,body").animate({
      scrollTop: $("#poHeader").offset().top
    }, 1500), sessionStorage.removeItem("POID")) : "";
    if (localStorage.getItem("USER")) {
      this.userInfo = JSON.parse(atob(localStorage.getItem("USER")));
    }
  }
  ngOnDestroy() {
    sessionStorage.removeItem("MFG_PART_FOR_NEW_PO");
    this.subscription.unsubscribe();
    this.util.changeEvent(null);
  }

  onChanges() {};
  public validateSupplier(event: any) {
    try {
      let supplier = event.target.value;
      let match = this.pageData.supplierList.filter(item => item.supplier_name.toLowerCase() == supplier.toLowerCase());
      if (supplier == "") {
        this.supplier_id.setValue("");
        return;
      }
      if (match.length > 0) {
        this.supplier_id.setValue(match[0].supplier_id);
        this.supplier.setValue(match[0].supplier_name);
        // this.getSelectedSupplier(match[0], {isUserInput: true});
      } else {
        this.supplier_id.setValue("");
      }
      this.notFound = match.length > 0 ? false : true;
    } catch (err) {
      this.global.addException("Purchase Order", "validateSupplier()", err);
    }
  }
  public clearDetails() {
    this.pageData.supplier = null;
  }
  public validateManf(event: any, item: any, index) {
    try {
      let manf = event.target.value;
      if (manf == "") {
        item.get("manf_id").setValue("");
        this.items.at(index).get("item_def_id").setValue("");
        this.items.at(index).get("item_definition_name").setValue("");
        this.items.at(index).get("filteredManufacturerPart").setValue("");
        return;
      }
      let match = this.pageData.manufacturerList.filter(item => item.manf_name.toLowerCase() == manf.toLowerCase());
      if (match.length > 0) {
        item.get("manf_id").setValue(match[0].manf_id);
        item.get("manf_name").setValue(match[0].manf_name);
        //this.is_material_default = match[0].is_material_default ? match[0].is_material_default : 0;

        item.get("is_material_default").setValue(match[0].is_material_default ? match[0].is_material_default : 0);


        // Comment due to issue occued using tab from manuf list to part list
        this.getManufacturerPart("INIT", index, match[0].manf_id);
        this.items.at(index).get("item_def_id").setValue("");
        this.items.at(index).get("item_definition_name").setValue("");
      } else {
        item.get("manf_id").setValue("");
      }
    } catch (err) {
      this.global.addException("Purchase Order", "validateManf()", err);
    }
  }
  public validateManfPart(event: any, item: any, index) {
    try {
      let manfPart = event.target.value;
      let match = this.items.at(index).get("manfPartsList").value.filter(item => item.item_definition_name.toLowerCase() == manfPart.toLowerCase());
      if (match.length > 0) {
        item.get("item_def_id").setValue(match[0].item_def_id);
        item.get("item_definition_name").setValue(match[0].item_definition_name);
        item.get("uom").setValue(match[0].uom_symbol);
      } else {
        item.get("item_def_id").setValue("");
      }
    } catch (err) {
      this.global.addException("Purchase Order", "validateManf()", err);
    }
  }

  // ===============   SUPPLIER  =================== //
  private getSupplierList(origin: string = "INIT", supplier_id?): void {
    var self = this;
    this.util.showProcessing("processing-spinner");
    this.isSupplierLoad = true;
    this.http.doGet("admin/suppliers/dropdown", function (error: boolean, response: any) {
      self.isSupplierLoad = false;

      try {
        if (error) {
          console.log("error", response);
        } else {
          self.util.hideProcessing("processing-spinner");
          self.pageData.supplierList = [];
          self.pageData.supplierList = response.data;
          self.pageData.supplierList = self.pageData.supplierList.length > 0 ? self.pageData.supplierList : [];
          self.filteredSupplier = self.supplier.valueChanges.pipe(startWith(""), map(value => self.supplierFilter(value)));
          origin == "REFRESH" ? self.setSupplierOTF(supplier_id) : "" ;

          // This is for edit
          if (sessionStorage.getItem("PO_INFO")) {
            console.log("PO_INFO data ::: ", JSON.parse(sessionStorage.getItem("PO_INFO")).purchaseOrder);
            let poId = JSON.parse(sessionStorage.getItem("PO_INFO")).purchaseOrder ?
            JSON.parse(sessionStorage.getItem("PO_INFO")).purchaseOrder.supplier_id : "";
            let list: any[] = self.pageData.supplierList.filter(item => item.supplier_id == poId);
            if (list.length > 0) {
              self.filterMfg(list[0].supplier_id, list[0].supplier_name, "edit");
            }
          }
        }
      } catch (err) {
        this.global.addException("Purchase Order", "getSupplierList()", err);
      }
    });
  }
    setSupplierOTF(supplier_id): void {
    try {
      let match = this.pageData.supplierList.filter(item => item.supplier_id == supplier_id);
      if (match.length > 0) {
          this.supplier_id.setValue(match[0].supplier_id);
          this.supplier.setValue(match[0].supplier_name);
          const event =  {isUserInput : true};
          this.getSelectedSupplier(match[0],event);
      }
    //   const supList: any[] = _.sortBy(this.pageData.supplierList, "supplier_id");
    //       this.supplier_id.setValue(supList[supList.length - 1].supplier_id);
    //       this.supplier.setValue(supList[supList.length - 1].supplier_name);
    //       const event =  {isUserInput : true};
    //       this.getSelectedSupplier(supList[supList.length - 1],event);
    } catch (err) {
      this.global.addException("Assets New", "setSupplierOTF()", err);
    }
     this.util.focusHiddenInput("hiddenInput");
  }
  getSelectedSupplier(supplier, event: any = {}): void {
    let self = this;
    if (event.isUserInput) {
      //self.filterMfg(supplier.supplier_id, supplier.supplier_name, "change");
      self.supplier_id.setValue(supplier.supplier_id);
      self.supplier.setValue(supplier.supplier_name);
      this.util.showProcessing("processing-spinner");
      this.http.doGet("admin/suppliers/" + supplier.supplier_id, function (error: boolean, response: any) {
        self.isSupplierLoad = false;
        try {
          if (error) {
            console.log("error", response);
            self.global.addException("Purchase Order", "getSelectedSupplier()", response);
          } else {
            self.util.hideProcessing("processing-spinner");
            self.pageData.supplier = response.data;

          self.email_id.setValue(self.pageData.supplier.email_id);
          self.phone_no.setValue(self.pageData.supplier.phone_no);
          self.address.setValue(self.pageData.supplier.address1);

          }
        } catch (err) {
          this.global.addException("Purchase Order", "getSelectedSupplier()", err);
        }
      });
    }
  }

  filterMfg(supplier_id, supplierName, from) {
    let self = this;
    let mfgList = [];
    self.pageData.manufacturerList = JSON.parse(JSON.stringify(self.mfgBkList));
    self.createForm("0")
    from == "change" ? "" : self.createForm("1", self.newData);
    self.supplier_id.setValue(supplier_id);
    self.supplier.setValue(supplierName);
    self.filteredSupplier = self.supplier.valueChanges.pipe(startWith(""), map(value => self.supplierFilter(value)));
    from == "change" ? self.pageVariables = {
      "costOfOrder": "",
      "subTotal": "",
      "taxes": "",
      "totalCost": "",
      "totalPaymentAmount": 0,
      "purchaseOrder": {}
    } : "";
    sessionStorage.getItem("MFG_PART_FOR_NEW_PO") ? self.setItem() : "";
  }

  private supplierFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(option => option.supplier_name.toLowerCase().includes(value ? value.toLowerCase() : ""));
    } catch (err) {
      this.global.addException("Purchase Order", "supplierFilter()", err);
    }
  }
  showAddSupplierPopup(): void {
    sessionStorage.removeItem("supplierObject");
    this.util.changeEvent(null);
    this.dialog.open(InventoryDialog, {
      data: {
        "action": "addNewSupplier"
      }
    });
  }
  // ==============   END SUPPLIER  =============== //

  //This function set mfg and item definition form tracker
  setItem(): void {
    let self = this;
    let dataFromTracker = JSON.parse(sessionStorage.getItem("MFG_PART_FOR_NEW_PO"));
    let checkManfOccurance = self.pageData.manufacturerList.filter(item => item.manf_id == dataFromTracker.mfgId);
    if (checkManfOccurance.length > 0) {
      this.setManf(0, checkManfOccurance[0]);
      this.getManufacturerPart("INIT", 0, dataFromTracker.mfgId);

    }
  }

  setItemDefForTrackerPO() {
    let dataFromTracker = JSON.parse(sessionStorage.getItem("MFG_PART_FOR_NEW_PO"));
    let checkManfOccurance = this.pageData.manufacturerList.filter(item => item.manf_id == dataFromTracker.mfgId);
    if (checkManfOccurance.length > 0) {
      this.autoSelectNewlyAddedMfgPart(0, JSON.parse(sessionStorage.getItem("MFG_PART_FOR_NEW_PO")).mfgId, this.items.at(0).get("manfPartsList").value.filter(item => item.item_def_id == JSON.parse(sessionStorage.getItem("MFG_PART_FOR_NEW_PO")).mfgPartId)[0]);
    }
  }

  // ================   MANUFACTURER  ===================== //
  private getManufacturerList(origin: string = "INIT"): void {
    const self = this;
     self.isManfLoad = true;
    try {
      this.http.doGet("manufacturer/drop-down", function (error: boolean, response: any) {
         self.isManfLoad = false;
        if (error) {
          console.log(response);
        } else {
          self.pageData.manufacturerList = response.data;
          self.mfgBkList = JSON.parse(JSON.stringify(response.data));
          if (origin === "REFRESH") {
            const lastItem = self.otfData.data;
            self.items.at(self.currentIndex).get("manf_name").setValue(lastItem.manf_name);
            self.items.at(self.currentIndex).get("manf_id").setValue(lastItem.manf_id);
            self.getManufacturerPart("INIT", self.currentIndex, lastItem.manf_id);
          }

          if (!self.backEdit && origin !== "REFRESH") {
            self.createForm("0");
          }
          self.getSupplierList();

          sessionStorage.getItem("MFG_PART_FOR_NEW_PO") ?
            self.getManufacturerPart("INIT", 0, JSON.parse(sessionStorage.getItem("MFG_PART_FOR_NEW_PO")).mfgId) : "";
        }
        self.util.focusHiddenInput("hiddenInput");
      });
    } catch (err) {
      this.global.addException("Purchase Order", "getManufacturerList()", err);
    }
  }
  setManf(index, manf) {
    this.items.at(index).get("manf_id").setValue(manf.manf_id);
    this.items.at(index).get("manf_name").setValue(manf.manf_name);
  }
  getMfg(mfg, event: any = false, index): void {
    event ? event.isUserInput ? (this.items.at(index).get("manf_id").setValue(mfg.manf_id),
    this.items.at(index).get("is_material_default").setValue(mfg.is_material_default ? mfg.is_material_default : 0),
        this.getManufacturerPart("INIT", index, mfg.manf_id)) : "" :
      (this.items.at(index).get("manf_id").setValue(mfg.manf_id), this.getManufacturerPart("INIT", index, mfg.manf_id));
  }
  private manufacturerFilter(value: string): string[] {
    try {
      return this.pageData.manufacturerList.filter(option => option.manf_name.toLowerCase().includes(value ? value.toLowerCase() :
        ""));
    } catch (err) {
      this.global.addException("Purchase Order", "manufacturerFilter()", err);
    }
  }
  showAddManufacturerPopup(index): void {
    this.currentIndex = index;
    this.util.changeEvent(null);
    this.dialog.open(ManufacturerDialog, {
      data: {
        "action": "addManufacturer"
      }
    });
  }
  // ===============   END MANUFACTURER  =================== //

  // ================   MANUFACTURER PART  ===================== //
  private getManufacturerPart(origin: string = "INIT", index, mfgId): void {
    const self = this;
     // self.isManfPartLoad = true;
     self.items
        .at(index)
        .get("isSubLocationLoad")
        .setValue(true);
    this.http.doGet("item-definition/drop-down/manf/" + mfgId, function (error: boolean, response: any) {
       self.items
        .at(index)
        .get("isSubLocationLoad")
        .setValue(false);
      try {
        if (error) {
          console.log(response);
        } else {
          self.pageData.manufacturerPartList = response.data;
          self.items.at(index).get("manfPartsList").setValue(response.data);
          self.items.at(index).get("filteredManufacturerPart").
          setValue(self.items.at(index).get("item_definition_name").
          valueChanges.pipe(startWith(""), map(value => self.manufacturerPartFilter(value, index))));
           let newObj: any = {};
          self.otfData && self.otfData.data ? response.data.map((item) => {
            if (item.item_definition_name === self.otfData.data.item_definition_name ) {
                    return newObj = item;
            }
            }) : "";
          origin === "REFRESH" ? self.autoSelectNewlyAddedMfgPart(index, mfgId, newObj) : "";

          sessionStorage.getItem("MFG_PART_FOR_NEW_PO") ? self.setItemDefForTrackerPO() : "";
        }
        self.util.focusHiddenInput("hiddenInput");
      } catch (err) {
        self.global.addException("Purchase Order", "getManufacturerPart()", err);
      }
    });
  }

  // Set data forn OTF added Item Definition and form tracker
  autoSelectNewlyAddedMfgPart(index, mfgId, newPart): void {
    this.getManfPart(newPart, false, index);
    this.items.at(index).get("manf_id").setValue(mfgId);
    const manf_name = this.otfData ? (this.otfData.data ? this.otfData.data.manf_name : "") : "";
    this.items.at(index).get("manf_name").setValue(manf_name);
     this.setManfPart(index, newPart);

  }

  setManfPart(index, manf) {
    this.items.at(index).get("item_def_id").setValue(manf.item_def_id);
    this.items.at(index).get("item_definition_name").setValue(manf.item_definition_name);
    this.items.at(index).get("uom").setValue(manf.uom ? manf.uom.uom_symbol ? manf.uom.uom_symbol : '' : '');
  }
  getManfPart(part, event: any = false, index): void {
    event ? event.isUserInput ? this.getMfgPartDetails(part, index) : "" : this.getMfgPartDetails(part, index);
  }
  getMfgPartDetails(part, index): void {
    console.log("part ::", part);
    this.items.at(index).get("item_def_id").setValue(part.item_def_id);
    this.items.at(index).get("item_definition_name").setValue(part.item_definition_name);
    this.items.at(index).get("uom").setValue(part.uom_symbol);
  }
  private manufacturerPartFilter(value: string, index): string[] {
    try {
      return this.items.at(index).get("manfPartsList").value.filter(option =>
        (option.item_definition_name.toLowerCase().includes(value ? value.toLowerCase() : "")));
    } catch (err) {
      this.global.addException("Purchase Order", "manufacturerPartFilter()", err);
    }
  }
  showAddManufacturerPartPopup(index): void {
    this.currentIndex = index;
    sessionStorage.removeItem("newPart");
    this.util.changeEvent(null);
    this.dialog.open(InventoryDialog, {
      data: {
        "action": "addNewManufacturerPart",
        params : {manf_id:  this.items.at(this.currentIndex).get("manf_id").value,
         manf_name: this.items.at(this.currentIndex).get("manf_name").value ,
         item_type: this.items.at(this.currentIndex).get("is_material_default").value == 1 ? "Material" : "Asset/Product"}
      }
    });
  }

  onClear(index)
  {
      if(this.editMode && this.items.at(index).get("manf_id").value!= '')
      {
          let mfgId = this.items.at(index).get("manf_id").value;
          this.getManufacturerPart("INIT", index, mfgId);
      }
  }
  // ==============   END MANUFACTURER PART  =================== //

  createForm(option, val: any = {}) {
      console.log(val, '');
    this.addPurchaseOdrFm = this.fb.group({
      supplier: new FormControl(option == "0" ? "" : val.purchaseOrder.supplier, []),
      supplier_id: new FormControl(option == "0" ? "" : val.purchaseOrder.supplier_id, []),
      email_id: new FormControl(option == "0" ? "" : "", []),
      phone_no: new FormControl(option == "0" ? "" : "", []),
      address: new FormControl(option == "0" ? "" : "", []),
      comment: new FormControl(option == "0" ? "" : val.purchaseOrder.comment, [Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)]),
      status: new FormControl(option == "0" ? "1" : val.purchaseOrder.status, []),
      purchase_order_id: new FormControl(option == "0" ? "" : val.purchaseOrder.purchase_order_id, []),
      items: this.fb.array([])
    });
    this.util.addBulkValidators(this.addPurchaseOdrFm, ["supplier", "supplier_id"], [Validators.required]);
    if (option == "1") {
      if (val.purchaseOrder.items.length == 0) {
        this.addPurchaseItem("0");
      } else {
        for (let i = 0; i < val.purchaseOrder.items.length; i++) {
          val.purchaseOrder.items.length > 0 ? this.addPurchaseItem(option, val.purchaseOrder.items[i]) : this.addPurchaseItem("0");
        }
      }
    } else {
      this.addPurchaseItem("0");
    }
  };
  get supplier() {
    return this.addPurchaseOdrFm.get("supplier");
  }
  get supplier_id() {
    return this.addPurchaseOdrFm.get("supplier_id");
  }
  get comment() {
    return this.addPurchaseOdrFm.get("comment");
  }
  get email_id() {
    return this.addPurchaseOdrFm.get("email_id");
  }
  get phone_no() {
    return this.addPurchaseOdrFm.get("phone_no");
  }
  get address() {
    return this.addPurchaseOdrFm.get("address");
  }
  get items(): FormArray {
    return <FormArray > this.addPurchaseOdrFm.get("items") as FormArray;
  }
  showMoreMfgPartsPopup() {
    this.dialog.open(PurchaseOrderDialog, {
      data: {
        "action": "newManufacturerPart"
      }
    });
  }
  addPurchaseItem(option, val: any = {}) {

    this.items.push(this.fb.group({
      is_delete: new FormControl("0"), //Only for edit
      purchase_order_item_id: new FormControl(option == "0" ? "0" : val.purchase_order_item_id), //Only for edit

      manf_name: new FormControl(option == "0" ? "" : val.manf_name), //Only for review
      manf_id: new FormControl(option == "0" ? "" : val.manf_id, []),
      item_definition_name: new FormControl(option == "0" ? "" : val.item_definition_name, []),
      item_def_id: new FormControl(option == "0" ? "" : val.item_def_id, []),
      quantity_ordered: new FormControl(option == "0" ? "" : val.quantity_ordered, [Validators.pattern(this.constant.AMOUNT_PATTERN)]), //ONLY_NUMBER
      price_per_unit: new FormControl(option == "0" ? "" : val.price_per_unit, [Validators.pattern(this.constant.AMOUNT_PATTERN)]),
      manfPartsList: new FormControl([]),
      uom: new FormControl(option == "0" ? "" : val.uom, []),
      is_material_default : new FormControl(0),
      isSubLocationLoad: new FormControl(false),
      filteredClass: new FormControl(new Observable < string[] > ()),
      filteredManufacturer: new FormControl(new Observable < string[] > ()),
      filteredManufacturerPart: new FormControl(new Observable < string[] > ())
    }));
    this.setObservable(this.items.length - 1);
    if (!this.backEdit) {}
  }
  setObservable(index): void {
    this.items.at(index).get("filteredManufacturer").setValue(this.items.at(index).get("manf_name").valueChanges.pipe(startWith(""), map(value => this.manufacturerFilter(value))));
    this.items.at(index).get("filteredManufacturerPart").setValue(this.items.at(index).get("item_definition_name").valueChanges.pipe(startWith(""), map(value => this.manufacturerPartFilter(value, index))));
  }

  removeItem(position, item) {
    item.get("purchase_order_item_id").value == "0" ? this.items.removeAt(position) : item.get("is_delete").setValue("1");
    console.log(item);
    console.log(this.items.value.length);
  }

  reviewOrder(form: FormGroup, type?) {
    try {
      console.log(form.valid);
      console.log(form.value);
      this.submitted = true;
      if (this.isError) {
        return;
      };
      for (let i = 0; i < this.items.length; i++) {
        this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("manf_id")], [Validators.required], "ARRAY");
        this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("item_def_id")], [Validators.required], "ARRAY");
        this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("quantity_ordered")], [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)], "ARRAY");
        this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("price_per_unit")], [Validators.pattern(this.constant.AMOUNT_PATTERN)], "ARRAY");
      }
      this.isError = false;
      this.errMsg = ""
      this.pageVariables.purchaseOrder = form.value;
      for (let i = 0; i < this.pageVariables.purchaseOrder.items.length; i++) {
        delete this.pageVariables.purchaseOrder.items[i].filteredClass;
        delete this.pageVariables.purchaseOrder.items[i].filteredManufacturer;
        delete this.pageVariables.purchaseOrder.items[i].filteredManufacturerPart;
      }
      this.pageVariables.supplier = this.pageData.supplier;
      this.pageVariables.type = type;
      if (form.valid) {
        sessionStorage.setItem("PO_INFO", JSON.stringify(this.pageVariables));
        this.router.navigate(["/inventory/po/csa/purchase-order-review"]);
      }
    } catch (err) {
      this.global.addException("Purchase Order", "reviewOrder()", err);
    }
  }
  createPurchaseOrder(form: FormGroup, type) {
    this.submittedSup = true;
    this.submitted = true;
    this.pageVariables.purchaseOrder = form.value;
    const self = this;
    let reqObj: any = {};
    self.isError = false;
    self.errMsg = "";
    reqObj = form.value;
    reqObj.items = this.pageVariables.purchaseOrder.items;
    if (parseInt(type, 10) === 1) {
      if (reqObj.items.length > 0) {
        for (let i = 0; i < reqObj.items.length; i++) {
          if (reqObj.items[i].manf_id === "" || reqObj.items[i].item_def_id === "" ||
            reqObj.items[i].quantity_ordered === "" || reqObj.items[i].price_per_unit === "") {
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("manf_id"),
              this.items.at(i).get("item_def_id")
            ], [Validators.required], "ARRAY");
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("quantity_ordered")],
              [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)], "ARRAY");
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("price_per_unit")],
              [Validators.pattern(this.constant.AMOUNT_PATTERN)], "ARRAY");
          } else if (reqObj.items[i].manf_id === "" && reqObj.items[i].item_def_id === "" &&
            reqObj.items[i].quantity_ordered === "" && reqObj.items[i].price_per_unit === "") {
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("manf_id"),
              this.items.at(i).get("item_def_id"), this.items.at(i).get("quantity_ordered"),
              this.items.at(i).get("price_per_unit")
            ], [], "ARRAY");
          }
        }
      }

      for (let i = 0; i < form.value.items.length; i++) {
        delete form.value.items[i].filteredClass;
        delete form.value.items[i].filteredManufacturer;
        delete form.value.items[i].filteredManufacturerPart;
      }
      if (form.valid) {
        try {
          self.util.addSpinner("savePO", "Save");
          this.http.doPost("purchase-order/create", reqObj, function (error: boolean, response: any) {
            self.util.removeSpinner("savePO", "Save");
            if (error) {
              self.isError = true;
              self.errMsg = response.message;
              self.global.addException("Purchase Order", "createPurchaseOrder()", response);
            } else {
              sessionStorage.removeItem("PO_INFO");

              self.util.showDialog(DialogComponent, response.message, [self.routeObj.list + "0"]);
            }
          });
        } catch (err) {
          this.global.addException("Purchase Order", "createPurchaseOrder()", err);
        }
      }
    } else {
      if (reqObj.items.length > 0) {
        for (let i = 0; i < reqObj.items.length; i++) {
          if (reqObj.items[i].manf_id === "" || reqObj.items[i].item_def_id === "" ||
            reqObj.items[i].quantity_ordered === "" || reqObj.items[i].price_per_unit === "") {
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("manf_id")],
              [Validators.required], "ARRAY");
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("item_def_id")],
              [Validators.required], "ARRAY");
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("quantity_ordered")],
              [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)], "ARRAY");
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("price_per_unit")],
              [Validators.pattern(this.constant.AMOUNT_PATTERN)], "ARRAY");
          } else if (reqObj.items[i].manf_id === "" && reqObj.items[i].item_def_id === "" &&
            reqObj.items[i].quantity_ordered === "" && reqObj.items[i].price_per_unit === "") {
            this.util.addBulkValidators(this.addPurchaseOdrFm, [this.items.at(i).get("manf_id"),
              this.items.at(i).get("item_def_id"), this.items.at(i).get("quantity_ordered"),
              this.items.at(i).get("price_per_unit")
            ], [], "ARRAY");
          }
        }
      }

      for (let i = 0; i < form.value.items.length; i++) {
        delete form.value.items[i].filteredClass;
        delete form.value.items[i].filteredManufacturer;
        delete form.value.items[i].filteredManufacturerPart;
      }
      if (form.valid) {
        try {
          reqObj.purchaseOrderId = this.newData.purchase_order_id;
          self.util.addSpinner("saveExsisting", "Save");
          this.http.doPost("purchase-order/update", reqObj, function (error: boolean, response: any) {
            self.util.removeSpinner("saveExsisting", "Save");
            if (error) {
              self.global.addException("Purchase Order", "createPurchaseOrder()", response);
            } else {
              // editMode = false;
              sessionStorage.removeItem("PO_INFO");
              self.util.poID = "0";
              self.util.showDialog(DialogComponent, response.message, [self.routeObj.list + self.newData.purchase_order_id]);
              self.util.changeEvent({
                "source": "PO_SAVED",
                "action": "SAVE",
                "data": reqObj
              });

            }
          });
        } catch (err) {
          this.global.addException("Purchase Order", "createPurchaseOrder()", err);
        }
      }
    }
  }

  cancel(type) {
    sessionStorage.removeItem("PO_INFO");
    if (type == 1) {
      this.router.navigate(["/inventory/po/csa/purchase-order-list/0"]);
    } else {
      this.util.changeEvent({
        "source": "CANCEL_EDIT",
        "action": "VIEW"
      });
    }
  }

}
