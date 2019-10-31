
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder, FormArray } from "@angular/forms";
import { Observable, Subscription } from "rxjs";
import * as _ from "underscore";
import { map, startWith } from "rxjs/operators";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { InventoryDialog } from "../../inventory-dialog.component";
import { ManufacturerDialog } from "../../../../component/admin/manufacturer/manufacturer/manufacturer.component";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { BreakpointObserver } from '@angular/cdk/layout';
declare var $: any;
@Component({
  selector: "app-add-receiving-slip",
  templateUrl: "./add-receiving-slip.component.html",
  styleUrls: ["./add-receiving-slip.component.css"]
})
export class AddReceivingSlipComponent implements OnInit, OnDestroy {
  pageData: any = {
    "supplierList": [],
    "supplier": null
  };
  public pageVariables: any = {
    "costOfOrder": 0,
    "subTotal": 0,
    "taxes": "",
    "totalCost": 0,
    "totalPaymentAmount": 0,
    "purchaseOrder": {}
  };
  addUnlistedItemFm: FormGroup;
  today = new Date();
  public totalPayErr = false;
  problemItemFm: FormGroup;
  isError = false;
  submitted = false;
  errMsg = "";
  isErrorPI = false;
  isSupplierLoad = false;
  isManfLoad = false;
  isManfPartLoad = false;
  errMsgPI = "";
  poData: any = {
    "order_items": []
  };
  inventoryCart: any[] = [];
  manufacturerList: any[] = [];
  materialManufacturerList: any[] = [];
  classList: any[] = [];
  unlistedExtraItem: any[] = [];
  receiveAll;
  poDate: any;
  private receivingSlipId: number;
  private currentRow: number;
  public settings: any;
  public default_tax_rate: any;
  private otfData: any;
  subscription: Subscription;
  filteredSupplier: Observable < string[] > ;
  private  getFormData: any;
  private currentPath: any;
  public is_material_default = 0;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    public util: UtilService,
    public constant: ConstantsService,
    private http: HttpService,
    private fb: FormBuilder,
    private global: GlobalService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.createForm(0);
    this.util.menuChange({
      "menu": 3,
      "subMenu": 23
    });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.settings = JSON.parse(atob(localStorage.getItem("USER"))).settings;
    for (let index = 0; index < this.settings.length; index++) {
      if (this.settings[index].setting_key === "tax_rate") {
        this.default_tax_rate = this.settings[index].setting_value;
      }
    }
    try {
      this.currentPath = this.router.url.split("/")[this.router.url.split("/").length - 1];
      if (JSON.parse(sessionStorage.getItem("po"))) {
        this.getPOById(JSON.parse(sessionStorage.getItem("po")).purchase_order_id);
        this.getManufacturerList();
      } else {
        this.getManufacturerList("NEW");
      }

      this.util.setReceivingItemCount(0);
      this.subscription = this.util.changeDetection.subscribe(ofDataObj => {
        console.log(this.currentRow);
        if (ofDataObj && this.currentPath === "add-receiving-slip") {
            this.otfData = ofDataObj;console.log(this.currentRow);
          if (ofDataObj.data && ofDataObj.source === "INVENTORY_DIALOG" && ofDataObj.data.step === "CONTINUE_ADDING") {
            this.inventoryCart.length > 0 ? this.continueAdding() :
              this.inventoryCart.length === 0 ? this.getPOById(JSON.parse(sessionStorage.getItem("po")).purchase_order_id) : "";
          } else if (ofDataObj.data && ofDataObj.source === "ON_THE_FLY_MANUFACTURER_PART" && ofDataObj.data.step === "DONE") {
            // this.getManufacturerList("REFRESH");
            console.log(this.currentRow);
            this.getManufacturerPart("REFRESH", this.currentRow, ofDataObj.data.id);
          } else if (ofDataObj.source === "ON_THE_FLY_SUPPLIER" && ofDataObj.data.step === "DONE") {
            this.getSupplierList("REFRESH");
          } else if (ofDataObj.source === "MANUFACTURER") {
            this.getManufacturerList("REFRESH");
          } else if (ofDataObj.data && ofDataObj.source === "ON_THE_FLY_DIALOG" && ofDataObj.data.step === "CLOSE") {
            this.inventoryCart = [];
            if (this.getFormData) {
                this.addUnlistedItemFm.patchValue(this.getFormData);
            }else if (JSON.parse(sessionStorage.getItem("po"))) {
              this.getPOById(JSON.parse(sessionStorage.getItem("po")).purchase_order_id);
            } else {
              this.getManufacturerList("NEW");
            }
          }
        }
      });

    } catch (err) {
      this.global.addException("Add Receiving Slip", "ngOnInit()", err);
    }
    this.getSupplierList();
    console.log("Onload.....");
  }

  ngOnDestroy() {
    this.util.setReceivingItemCount(0);
    this.otfData = {};
    this.subscription.unsubscribe();
    this.util.changeEvent(null);
    // if (JSON.parse(sessionStorage.getItem("po"))) {
    //   this.subscription.unsubscribe();
    // }
  }



  getPOById(poId, origin: string = "INIT"): void {
    const self = this;
    try {
      this.util.showProcessing("processing-spinner");
      this.http.doGet(`purchase-order/${poId}/details`, function (error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.global.addException("Add Receiving Slip", "getPOById()", response);
        } else {
          response.data.supplier_name = response.data.supplier.supplier_name;
          self.poData = response.data;
          self.poDate = self.util.getDateObjet(response.data.purchase_order_date);
          self.createForm(1, self.poData);
          self.getSelectedSupplier(response.data.supplier, {
            isUserInput: true
          });
        }
      });
    } catch (err) {
      this.global.addException("Add Receiving Slip", "getPOById()", err);
    }
  };


  // ###############################  ORDER ITEMS  ###############################
  continueAdding(): void {
    try {
      if (parseInt(this.inventoryCart[0].item_type, 10) === 1 || parseInt(this.inventoryCart[0].item_type, 10) === 3) {
        this.inventoryCart.shift();
      } else {
        this.inventoryCart[0].quantity_received_OTF < this.inventoryCart[0].qty_received ?
          this.inventoryCart[0].quantity_received_OTF++ : this.inventoryCart.shift();
      }
      this.inventoryCart.length > 0 ? this.processInventory() : this.getPOById(this.poData.purchase_order_id, "REFRESH");
    } catch (err) {
      this.global.addException("Add Receiving Slip", "continueAdding()", err);
    }
  }

  addReceivingslip(): void {
    const self = this;
    try {
      this.submitted = true;
      if (this.addUnlistedItemFm.valid) {
        let reqObj: any = {};
        reqObj = this.addUnlistedItemFm.value;
        reqObj.payment_due_date = reqObj.payment_due_date ? reqObj.payment_due_date!='' ? self.util.getYYYYMMDDDate(reqObj.payment_due_date) : '' : '';

        self.util.addSpinner("add-inventory", "Add to inventory");
        this.http.doPost("receiving-slip/create", reqObj, function (error: boolean, response: any) {
          self.util.removeSpinner("add-inventory", "Add to inventory");
          self.submitted = false;
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
            self.global.addException("Add Receiving Slip", "addReceivingslip()", response);
          } else {
            self.receivingSlipId = response.data.receiving_slip_id;
            self.setRSData();
            self.checkUnlistedItems();
          }
        });
      }
    } catch (err) {
      this.global.addException("Add Receiving Slip", "addReceivingslip()", err);
    }
  }

  setRSData() {
    this.getFormData = this.addUnlistedItemFm.value;
  }
  checkUnlistedItems(): void {
    try {
      if (this.items.length > 0) {
        this.inventoryCart = [];
        const unlistedItems = [...this.addUnlistedItemFm.value.items];
        for (let i = 0; i < unlistedItems.length; ++i) {
          const itemObj: any = unlistedItems[i];
          if (itemObj.selectedMfgPart.item_type === 1 || itemObj.item_type === 3) {
            itemObj.remaining_quantity = itemObj.quantity_received;
            itemObj.quantity_received_OTF = 0;
          } else {
            itemObj.quantity_received_OTF = 1;
            itemObj.qty_received = itemObj.quantity_received;
          }
          this.inventoryCart.push(itemObj);
        }
        this.inventoryCart.length > 0 ? this.processInventory() :
          this.getPOById(JSON.parse(sessionStorage.getItem("po")).purchase_order_id, "REFRESH");
      } else {
        this.inventoryCart.length > 0 ? this.processInventory() :
          this.getPOById(JSON.parse(sessionStorage.getItem("po")).purchase_order_id, "REFRESH");
      }
    } catch (err) {
      this.global.addException("Add Receiving Slip", "checkUnlistedItems()", err);
    }
  }

  processInventory(): void {
    try {
      this.calculateReceivingItemCount(this.inventoryCart);
      this.inventoryCart[0].item_type == 1 || this.inventoryCart[0].item_type == 3 ?
        this.createInventoryObject(this.inventoryCart[0]) : this.createInventoryObject(this.inventoryCart[0], "ASSET");
      this.util.changeEvent(null);
    } catch (err) {
      this.global.addException("Add Receiving Slip", "processInventory()", err);
    }
  }

  createInventoryObject(poItem: any, inventoryType: string = "PRODUCT/MATERIAL"): void {
    try {
      const inventoryObject = {
        "po_id": this.poData.purchase_order_id,
        "po_item_id": poItem.purchase_order_item_id,
        "receiving_slip_id": this.receivingSlipId,
        "manf_id": poItem.manf_id,
        "manufacturer": poItem.manufacturer,
        "item_def_id": poItem.item_def_id,
        "manufacturerPart": poItem.manufacturerPart,
        "item_type": poItem.item_type,
        "quantity_ordered": poItem.quantity_received,
        "supplier_id": this.poData.supplier_id,
        "supplier": this.poData.supplier_name,
        "totalQuantity": poItem.quantity_received,
        "remainingQuantity": poItem.quantity_received,
        "purchase_price": poItem.price_per_unit,
        "comment": "",
        "quantity_received_OTF": poItem.quantity_received_OTF
      }
      console.log("inventoryObject :: -", inventoryObject);
      inventoryType === "PRODUCT/MATERIAL" ?
        this.prepareAddProductAndMaterial(poItem, inventoryObject) : this.prepareAddAsset(poItem, inventoryObject);
    } catch (err) {
      this.global.addException("Add Receiving Slip", "createInventoryObject()", err);
    }
  }

  prepareAddProductAndMaterial(poItem: any, itemObj): void {
    try {
      const locKey = "locations";
      itemObj[locKey] = [{
        "location_name": "",
        "location_id": "",
        "location_tag_id": "",
        "location_tag_name": "",
        "quantity": "",
        // "purchase_price": "",
        "locationList": [],
      }];

      if (parseInt(itemObj.item_type, 10) === 3) {
        sessionStorage.setItem("materialInfo", JSON.stringify({
          "requestData": itemObj,
          "displayData": {}
        }));
        this.dialog.open(InventoryDialog, {
          data: {
            "action": "addMaterial"
          }, disableClose: true
        });
      } else {
        sessionStorage.setItem("productInfo", JSON.stringify({
          "requestData": itemObj,
          "displayData": {}
        }));
        this.dialog.open(InventoryDialog, {
          data: {
            "action": "addProduct"
          }, disableClose: true
        });
      }

    } catch (err) {
      this.global.addException("Add Receiving Slip", "prepareAddProductAndMaterial()", err);
    }
  }

  prepareAddAsset(poItem: any, assetObj): void {
    try {
      assetObj.serial_no = "";
      assetObj.short_tag = "";
      assetObj.scan_code = "";
      assetObj.location = "";
      assetObj.location_id = "";
      assetObj.location_tag = "";
      assetObj.location_tag_id = "";
      assetObj.assign_to = "";
      assetObj.assign_name = "";
      assetObj.supplier = this.poData.supplier_name;
      assetObj.supplier_id = this.poData.supplier_id;
      assetObj.purchase_date = this.util.getYYYYMMDDDate(this.poDate);
      assetObj.purchase_price = poItem.price_per_unit;

      assetObj.quantity_status = assetObj.quantity_received_OTF + "/" + parseInt(assetObj.quantity_ordered, 10);
      assetObj.scan_code = "System Generated";
      sessionStorage.setItem("ASSET_OLD", JSON.stringify(assetObj));
      this.dialog.open(InventoryDialog, {
        data: {
          "action": "addAsset"
        }, disableClose: true
      });
    } catch (err) {
      this.global.addException("Add Receiving Slip", "prepareAddAsset()", err);
    }
  }
  // #############################  END ORDER ITEMS  ###############################

  calculateReceivingItemCount(cart): void {
    let count = 0;
    this.inventoryCart.map(item => {
      if (item.item_type == "1" || item.item_type == "3") {
        count++;
      } else {
        count = count + (this.inventoryCart[0].qty_received - item.quantity_received_OTF) + 1;
      }
    });
    this.util.setReceivingItemCount(count);

  }

  // ===============   SUPPLIER  =================== //
  private getSupplierList(origin: string = "INIT"): void {
    const self = this;

    self.isSupplierLoad = true;
    this.http.doGet("admin/suppliers/dropdown", function (error: boolean, response: any) {
      self.isSupplierLoad = false;
      try {
        if (error) {
          console.log("error", response);
        } else {
          self.pageData.supplierList = [];
          self.pageData.supplierList = response.data;
          self.filteredSupplier = self.supplier.valueChanges.pipe(startWith(""), map(value => self.supplierFilter(value)));
          origin === "REFRESH" ? self.setSupplierDetails() : "";


        }
      } catch (err) {
        self.global.addException("RS", "getSupplierList()", err);
      }
    });
  }
  setSupplierDetails() {
            const event =  {isUserInput : true};
            this.getSelectedSupplier(this.otfData.data, event);
            this.util.focusHiddenInput("hiddenInput");
  }
  getSelectedSupplier(supplier, event: any = {}): void {
    const self = this;
    if (event.isUserInput) {
      this.util.showProcessing("processing-spinner");
      this.http.doGet("admin/suppliers/" + supplier.supplier_id, function (error: boolean, response: any) {
        try {
          if (error) {
            console.log("error", response);
            self.global.addException("RS", "getSelectedSupplier()", response);
          } else {
            self.util.hideProcessing("processing-spinner");
            self.pageData.supplier = response.data;
            self.addUnlistedItemFm.patchValue({
              "supplier_id": supplier.supplier_id,
              "supplier"   : supplier.supplier_name,
              "email_id"   : self.pageData.supplier.email_id,
              "phone_no"   : self.pageData.supplier.phone_no,
              "address"    : self.pageData.supplier.address1,
              "payment_due_date"    : self.pageData.supplier.payment_due_date,
            });
            console.log(self.addUnlistedItemFm.value);
          }
        } catch (err) {
          self.global.addException("RS", "getSelectedSupplier()", err);
        }
      });
    }
  }

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
        this.getSelectedSupplier(match[0], {
          isUerInput: true
        });
      } else {
        this.supplier_id.setValue("");
      }
    } catch (err) {
      this.global.addException("RS", "validateSupplier()", err);
    }
  }

  private supplierFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(option => option.supplier_name.toLowerCase().includes(value ? value.toLowerCase() : ""));
    } catch (err) {
      this.global.addException("RS", "supplierFilter()", err);
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
  private clearDetails() {
    this.pageData.supplier = null;
  }
  // ==============   END SUPPLIER  =============== //


  // ================   MANUFACTURER  ===================== //
  private getManufacturerList(origin: string = "INIT"): void {
    const self = this;
    self.isManfLoad = true;
    try {
      this.http.doGet("manufacturer/drop-down", function (error: boolean, response: any) {
         self.isManfLoad = false;
        if (error) {
          console.log(response);
          self.global.addException("Add Receiving Slip", "getManufacturerList()", response);
        } else {
          self.manufacturerList = response.data;
          self.materialManufacturerList = response.data;

          origin === "NEW" ? self.createForm(0) : "";
          if (origin == "REFRESH" && self.currentRow >= 0) {
             self.items.at(self.currentRow).get("manufacturer").setValue(self.otfData.data.manf_name);
             self.items.at(self.currentRow).get("manf_id").setValue(self.otfData.data.manf_id);
            // self.getMfg(self.otfData.data, {}, self.currentRow);
          }
          // self.getSupplierList();
        }
      });
    } catch (err) {
      this.global.addException("Add Receiving Slip", "getManufacturerList()", err);
    }
  }
  getMfg(mfg, event: any = false, index): void {
    try {
        event ? event.isUserInput ? this.setMfgValue(mfg, index) : "" :
          (this.items.at(index).get("manf_id").setValue(mfg.manf_id), this.getManufacturerPart("INIT", index, mfg.manf_id));

        this.items.at(index).get("manufacturerPart").setValue("");
        this.items.at(index).get("item_def_id").setValue("");
         this.otfData = {};
      this.util.focusHiddenInput("hiddenInput");
    } catch (err) {
      this.global.addException("Add Receiving Slip", "getMfg()", err);
    }
  }

  setMfgValue(mfg, index) {
     this.items.at(index).get("manf_id").setValue(mfg.manf_id);
     this.items.at(index).get("manufacturer").setValue(mfg.manf_name);
     //this.is_material_default = mfg.is_material_default ? mfg.is_material_default : 0;
     this.items.at(index).get("is_material_default").setValue(mfg.is_material_default ? mfg.is_material_default : 0);
     this.getManufacturerPart("INIT", index, mfg.manf_id);
  }
  private manufacturerFilter(value: string): string[] {
    try {
      return this.manufacturerList.filter(option => option.manf_name.toLowerCase().includes(value ? value.toLowerCase() : ""));
    } catch (err) {
      this.global.addException("Add Receiving Slip", "manufacturerFilter()", err);
    }
  }
  public validateManf(event: any, item: any, index) {
    try {
      const manf = event.target.value;
      if (manf === "") {
        item.get("manf_id").setValue("");
        this.items.at(index).get("item_def_id").setValue("");
        this.items.at(index).get("manufacturerPart").setValue("");
        return;
      }
      const match = this.manufacturerList.filter(itemData => itemData.manf_name.toLowerCase() == manf.toLowerCase());
      if (match.length > 0) {
        item.get("manf_id").setValue(match[0].manf_id);
        item.get("manufacturer").setValue(match[0].manf_name);
        //this.is_material_default = match[0].is_material_default ? match[0].is_material_default : 0;
        item.get("is_material_default").setValue(match[0].is_material_default ? match[0].is_material_default : 0);
        // Comment due to issue occued using tab button from manuf list to part list
        this.getManufacturerPart("INIT", index, match[0].manf_id);
        this.items.at(index).get("item_def_id").setValue("");
        this.items.at(index).get("manufacturerPart").setValue("");
      } else {
        item.get("manf_id").setValue("");
      }
    } catch (err) {
      this.global.addException("Add Receiving Slip", "validateManf()", err);
    }
  }
  showAddManufacturerPopup(index): void {
    this.currentRow = index;
    this.util.changeEvent(null);
    this.dialog.open(ManufacturerDialog, {
      data: {
        "action": "addManufacturer"
      }
    });
  }
  // ===============   END MANUFACTURER  =================== //

  // ================   ITEM DEFINITION  ===================== //
  private getManufacturerPart(origin: string = "INIT", index, mfgId): void {
    const self = this;
     self.items
        .at(index)
        .get("isSubLocationLoad")
        .setValue(true);
    try {
      this.http.doGet("item-definition/drop-down/manf/" + mfgId, function (error: boolean, response: any) {
          self.items
        .at(index)
        .get("isSubLocationLoad")
        .setValue(false);
        if (error) {
          self.global.addException("Add Receiving Slip", "getManufacturerPart()", response);
        } else {
          self.items.at(index).get("manfPartsList").setValue(response.data);
          self.items.at(index).get("filteredManufacturerPart").
          setValue(self.items.at(index).get("manufacturerPart").valueChanges.pipe(startWith(""),
            map(value => self.manufacturerPartFilter(value, index))));
           let newObj: any = {};
          self.otfData && self.otfData.data ? response.data.map((item) => {
            if (item.item_definition_name === self.otfData.data.item_definition_name ) {
                    return newObj = self.otfData.data;
            }
            }) : "";
          origin === "REFRESH" ? self.autoSelectNewlyAddedMfgPart(index, mfgId, newObj) : "";
           self.otfData ?  self.otfData = {} : "";
        }
        self.util.focusHiddenInput("hiddenInput");
      });
    } catch (err) {
      this.global.addException("Add Receiving Slip", "getManufacturerPart()", err);
    }
  }
  setNewPart() {
    //  this.otfData.item_definition_name  =
  }
  autoSelectNewlyAddedMfgPart(index, mfgId, newPart): void {
    this.getManfPart(newPart, false, index);
    this.items.at(index).get("manf_id").setValue(newPart.manf_id);
    this.items.at(index).get("manufacturer").setValue(newPart.manf_name);
    this.items.at(index).get("manufacturerPart").setValue(newPart.item_definition_name ? newPart.item_definition_name : "");
    this.items.at(index).get("item_type").setValue(newPart.item_type);
    this.items.at(index).get("uom").setValue(newPart.uom ? newPart.uom.uom_symbol ? newPart.uom.uom_symbol : "" : "");
  }

  getManfPart(part, event: any = false, index): void {
    event ? event.isUserInput ? this.getMfgPartDetails(part, index) : "" : this.getMfgPartDetails(part, index);
  }
  getMfgPartDetails(part, index): void {
    try {
      this.items.at(index).get("item_def_id").setValue(part.item_def_id);
      this.items.at(index).get("manufacturerPart").setValue(part.item_definition_name);
      this.items.at(index).get("item_type").setValue(part.item_type);
      this.items.at(index).get("selectedMfgPart").setValue(part);
      this.items.at(index).get("uom").setValue(part.uom_symbol);
    } catch (err) {
      this.global.addException("Add Receiving Slip", "getMfgPartDetails()", err);
    }
  }
  private manufacturerPartFilter(value: string, index): string[] {
    try {
      return this.items.at(index).get("manfPartsList").value.filter(option =>
        (option.item_definition_name.toLowerCase().includes(value ? value.toLowerCase() : "")));
    } catch (err) {
      this.global.addException("Add Receiving Slip", "manufacturerPartFilter()", err);
    }
  }
  public validateManfPart(event: any, item: any, index) {
    try {
      const manfPart = event.target.value;
      const match = this.items.at(index).get("manfPartsList").value.filter(itemRow =>
        itemRow.item_definition_name.toLowerCase() == manfPart.toLowerCase());
      if (match.length > 0) {
        item.get("item_def_id").setValue(match[0].item_def_id);
        item.get("manufacturerPart").setValue(match[0].item_definition_name);
        item.get("selectedMfgPart").setValue(match[0]);
        item.get("uom").setValue(match[0].uom_symbol);
      } else {
        if (item.get("item_def_id").value == "") {
        item.get("item_def_id").setValue("");
        }
      }
    } catch (err) {
      this.global.addException("Add Receiving Slip", "validateManfPart()", err);
    }
  }
  showAddManufacturerPartPopup(index): void {
    this.currentRow = index;
    sessionStorage.removeItem("newPart");
    this.util.changeEvent(null);
    this.dialog.open(InventoryDialog, {
      data: {
        "action": "addNewManufacturerPart",
        params : {manf_id:  this.items.at(this.currentRow).get("manf_id").value,
         manf_name: this.items.at(this.currentRow).get("manufacturer").value,
         item_type: this.items.at(this.currentRow).get("is_material_default").value == 1 ? "Material" : "Asset/Product" }
      }
    });
  }
  // ===============   END ITEM DEFINITION  =================== //

  // ===============   ORDER ITEM =================== //
  showUnlistedItem() {
    try {
      this.items.length == 0 ? (this.addPurchaseItem(0), $("html,body").animate({
        scrollTop: $("#unlistedItemFm").offset().top
      }, 1500)) : "";
    } catch (err) {
      this.global.addException("Add Receiving Slip", "showUnlistedItem()", err);
    }
  }
  createForm(option, val: any = {}) {
    try {
      this.addUnlistedItemFm = this.fb.group({
        supplier: new FormControl(option == "0" ? "" : val.supplier_name, [Validators.required]),
        supplier_id: new FormControl(option == "0" ? "" : val.supplier_id, [Validators.required]),
        email_id: new FormControl(option == "0" ? "" : "", []),
        phone_no: new FormControl(option == "0" ? "" : "", []),
        address: new FormControl(option == "0" ? "" : "", []),
        purchase_order_id: new FormControl(option == "0" ? "" : val.purchase_order_id, []),
        purchase_order_no: new FormControl(option == "0" ? "" : val.purchase_order_no, []),
        comment: new FormControl(option == "0" ? "" : val.comment, []),
        payment_due_date: new FormControl(""),
        shipping_handling: new FormControl(option == "0" ? "" : "", [Validators.pattern(this.constant.AMOUNT_PATTERN)]),
        tax: new FormControl(option == "0" ? this.default_tax_rate : val.tax ?
          val.tax : this.default_tax_rate, [Validators.pattern(this.constant.AMOUNT_PATTERN), Validators.min(0), Validators.max(100)]),
        adjustment: new FormControl(option == "0" ? "" : "", [Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)]),
        items: this.fb.array([])
      });
      if (option == "1") {
        if (val.order_items.length == 0) {
          this.addPurchaseItem("0");
        } else {
          for (let i = 0; i < val.order_items.length; i++) {
            val.order_items.length > 0 ? this.addPurchaseItem(option, val.order_items[i]) : this.addPurchaseItem("0");
          }
          this.calculateCostOfOrder();
          // this.calculatePaymentAmount();
        }
      } else {
        this.addPurchaseItem("0");
      }
    } catch (err) {
      this.global.addException("Add Receiving Slip", "createForm()", err);
    }
  }
  get supplier() {
    return this.addUnlistedItemFm.get("supplier");
  }
  get supplier_id() {
    return this.addUnlistedItemFm.get("supplier_id");
  }
  get comment() {
    return this.addUnlistedItemFm.get("comment");
  }
  get tax() {
    return this.addUnlistedItemFm.get("tax");
  }
  get shipping_handling() {
    return this.addUnlistedItemFm.get("shipping_handling");
  }
  get adjustment() {
    return this.addUnlistedItemFm.get("adjustment");
  }
  get items(): FormArray {
    return <FormArray > this.addUnlistedItemFm.get("items") as FormArray;
  }
  addPurchaseItem(option, val: any = {}) {
    this.isError = false;
    this.submitted = false;
    this.items.push(this.fb.group({
      is_delete: new FormControl("0"), // Only for edit
      manf_id: new FormControl(option == "0" ? "" : val.manf_id, [Validators.required]),
      manufacturer: new FormControl(option == "0" ? "" : val.manf_name), // Only for review
      filteredManufacturer: new FormControl(new Observable < string[] > ()),
      item_def_id: new FormControl(option == "0" ? "" : val.item_def_id, [Validators.required]),
      manufacturerPart: new FormControl(option == "0" ? "" : val.item_definition_name), // Only for review
      selectedMfgPart: new FormControl(option == "0" ? {} : val),
      manfPartsList: new FormControl([]),
      is_material_default: new FormControl(0),
      filteredManufacturerPart: new FormControl(new Observable < string[] > ()),
      purchase_order_item_id: new FormControl(option == "0" ? "0" : val.purchase_order_item_id), // Only for edit
      comment: new FormControl(""),
       isSubLocationLoad: new FormControl(false),
      uom: new FormControl(option == "0" ? "" : val.uom),
      item_type: new FormControl(option == "0" ? "" : val.item_type), // Only for review
      quantity_received: new FormControl(option == "0" ? "" : val.remaining_quantity, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
      price_per_unit: new FormControl(option == "0" ? "" : val.price_per_unit, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
    }));
    this.setObservable(this.items.length - 1);
  }

  setObservable(index): void {
    try {
      this.items.at(index).get("filteredManufacturer").setValue(this.items.at(index).get("manufacturer").valueChanges.pipe(startWith(""), map(value => this.manufacturerFilter(value))));
      this.items.at(index).get("filteredManufacturerPart").setValue(this.items.at(index).get("manufacturerPart").valueChanges.pipe(startWith(""), map(value => this.manufacturerPartFilter(value, index))));
    } catch (err) {
      this.global.addException("Add Receiving Slip", "setObservable()", err);
    }
  }

  removeItem(position, item) {
    item.get("purchase_order_item_id").value == "0" ? this.items.removeAt(position) : this.items.removeAt(position);
    this.calculateCostOfOrder();
  }

  calculateCostOfOrder() {
    let self = this;
    let total = 0;

    this.validateCOOInput(function (response) {
      if (!response) {
        return;
      }
      // console.log(self.items.value.length);
      for (let i = 0; i < self.items.value.length; i++) {
        if (self.items.value[i].is_delete == "0") {
          self.items.value[i].quantity_received = isNaN(self.items.value[i].quantity_received) ? self.items.value[i].quantity_received.setValue("") : self.items.value[i].quantity_received;
          self.items.value[i].price_per_unit = isNaN(self.items.value[i].price_per_unit) ? self.items.value[i].price_per_unit.setValue("") : self.items.value[i].price_per_unit;
          var itemQty = self.items.value[i].quantity_received == null ? 0 : self.items.value[i].quantity_received == "" ? 0 : self.items.value[i].quantity_received;
          var itemPrice = self.items.value[i].price_per_unit == null ? 0 : self.items.value[i].price_per_unit == "" ? 0 : self.items.value[i].price_per_unit;
          total = (total + (itemPrice * itemQty));
        }
      }
      self.pageVariables.costOfOrder =   self.pageVariables.subTotal  = (total).toFixed(2);
      self.calculateTaxes();
    });

  }
  /**
   * Calculate total payment amount
   * @return void
   */
  calculateTaxes() {
    const self = this;
    this.validateTaxInput(function (response) {
      if (!response) {
        return;
      }
      if (self.pageVariables.subTotal >= 0) {
        const itemTax = (self.tax.value == null || self.tax.value == "") ? 0 : self.tax.value;
        self.pageVariables.taxes = self.tax.value ? ((parseFloat(itemTax) / 100) * parseFloat(self.pageVariables.subTotal)).toFixed(2) : 0;
        self.pageVariables.totalCost = parseFloat(self.pageVariables.taxes) + parseFloat(self.pageVariables.subTotal);
        self.pageVariables.totalCost = self.pageVariables.totalCost.toFixed(2);
        self.pageVariables.taxPercent = self.tax.value ? self.tax.value : 0;
        if (self.pageVariables.totalPaymentAmount > 0) {
          // self.calculatePaymentAmount();
        } else {
          self.pageVariables.remainingPaymentAmount = self.pageVariables.totalCost;
        }
      }
    });
  }

    /**
     * Calculate total payment amount
     * @return void
     */
    calculatePymTotal() {
       this.validateTaxInput((response) =>  {
      if (!response) {
        return;
      }

   const subtotal =   this.pageVariables.subTotal ;
        const calculatedPrices = this.util.calculatePrices(
            subtotal,
            parseFloat(this.adjustment.value),
            parseFloat(this.tax.value),
            parseFloat(this.pageVariables.taxes),
            parseFloat(this.shipping_handling.value),
            parseFloat(this.pageVariables.totalCost)
        );
        // console.log(calculatedPrices);
        this.pageVariables.taxes = calculatedPrices["taxAmount"];
        this.pageVariables.totalCost = calculatedPrices["totalPaymentAmount"];
        // this.pageVariables.taxes = calculatedPrices.taxAmount;
       });
    }
  private validateTaxInput(callback) {
    if (!this.constant.AMOUNT_PATTERN.test(this.tax.value ? this.tax.value : 0)) {
      return callback(false);
    }
    return callback(true);
  }
  private validateSTInput(callback) {
    this.util.removeCommas(this.shipping_handling);
    this.util.removeCommas(this.adjustment);
    if (!this.constant.AMOUNT_PATTERN.test(this.shipping_handling.value ? this.shipping_handling.value : 0) || !this.constant.AMOUNT_NEG_PATTERN.test(this.adjustment.value ? this.adjustment.value : 0)) {
      return callback(false);
    }
    return callback(true);
  }
  private validateCOOInput(callback) {
    for (let i = 0; i < this.items.value.length; i++) {
      //  this.items.at(i).get("quantity_received").value != 0 ?
      this.util.removeCommas(this.items.at(i).get("quantity_received"));
      this.util.removeCommas(this.items.at(i).get("price_per_unit"));
      if (!this.constant.AMOUNT_PATTERN.test(this.items.value[i].quantity_received ? this.items.value[i].quantity_received : 0) || !this.constant.AMOUNT_PATTERN.test(this.items.value[i].price_per_unit ? this.items.value[i].price_per_unit : 0)) {
        return callback(false);
      }
    }
    return callback(true);
  }

}
