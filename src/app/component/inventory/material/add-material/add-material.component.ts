import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ElementRef
} from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import {
  FormControl,
  Validators,
  FormGroup,
  FormBuilder,
  FormArray
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";

import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { InventoryDialog } from "../../inventory-dialog.component";
import { ManufacturerDialog } from "../../../../component/admin/manufacturer/manufacturer/manufacturer.component";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";
declare var $: any;
declare var jQuery: any;

@Component({
  selector: "app-add-material",
  templateUrl: "./add-material.component.html",
  styleUrls: ["./add-material.component.css"]
})
export class AddMaterialComponent implements OnInit {
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
    materialInfo: {},
    isError: false
  };
  addMaterialForm: FormGroup;
  @ViewChild("comment") commentElement: ElementRef;
  filteredSupplier: Observable<string[]>;
  filteredManufacturer: Observable<string[]>;
  filteredManufacturerPart: Observable<string[]>;
  currentPath: string;

  itemClass: any[] = [];
  filteredClass: Observable<string[]>;
  isMainLocationLoad: boolean = false;
  isSupplierLoad: boolean = false;
  private otfData: any;
  constructor(
    public dialog: MatDialog,
    public util: UtilService,
    public constant: ConstantsService,
    public router: Router,
    private route: ActivatedRoute,
    private http: HttpService,
    private fb: FormBuilder,
    private global: GlobalService
  ) {}

  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.isMainLocationLoad = true;
    this.isSupplierLoad = true;
    this.currentPath = this.router.url.split("/")[
      this.router.url.split("/").length - 1
    ];
    this.currentPath == "add-material"
      ? this.router.url.split("/")[2] == "csa-onboarding"
        ? this.util.menuChange({ menu: "guide", subMenu: "" })
        : this.util.menuChange({ menu: 3, subMenu: 34 })
      : "";
    this.pageData.addOption =
      this.router.url.split("/")[2] == "csa" &&
      this.router.url.split("/")[this.router.url.split("/").length - 1] ==
        "add-material"
        ? "WithPO"
        : "WithOutPO";

    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && this.currentPath == "add-material") {
        this.otfData = dataObj;
        if (
          dataObj.source == "ON_THE_FLY_SUPPLIER" &&
          dataObj.data.step == "DONE"
        ) {
          this.getSupplierList("REFRESH");
        } else if (
          dataObj.source == "ON_THE_FLY_MANUFACTURER_PART" &&
          dataObj.data.step == "DONE"
        ) {
          this.getManufacturerPart(dataObj.data.id, "REFRESH");
        }
        this.util.changeEvent(null);
      }
    });

    this.materialFormSetup();
    this.getLocationList();
    this.getSupplierList();
    this.getManufacturerPart(0);
  }

  materialFormSetup(): void {
    try {
      if (sessionStorage.getItem("materialInfo")) {
        this.createMaterialForm(
          "1",
          JSON.parse(sessionStorage.getItem("materialInfo")).requestData
        );
        // this.getManufacturerPart(JSON.parse(sessionStorage.getItem('materialInfo')).requestData.manf_id);
        this.pageData.materialInfo = JSON.parse(
          sessionStorage.getItem("materialInfo")
        );
        console.log(this.pageData.materialInfo);
        this.pageData.addOption = "WithOutPO";
      } else {
        this.createMaterialForm("0");
      }
    } catch (err) {
      this.global.addException("Add Material", "materialFormSetup()", err);
    }
  }

  next(): void {
    try {
      if (this.pageData.addOpt == "WithPO") {
        this.dialog.open(InventoryDialog, {
          data: {
            action: "purchaseOrderList",
            redirectPath: ["/inventory/rs/csa/add-receiving-slip"]
          }
        });
      } else {
        this.pageData.addOption = "WithOutPO";
      }
    } catch (err) {
      this.global.addException("Add Material", "next()", err);
    }
  }

  public clearAutoComplete(id, name) {
    try {
      let self = this;
      let backspaceEvent = jQuery.Event("keyup", { keyCode: 20 });
      $("#" + id).trigger(backspaceEvent);
      setTimeout(function() {
        self.addMaterialForm.get(id).setValue("");
        self.addMaterialForm.get(name).setValue("");
      }, 1);
    } catch (err) {
      this.global.addException("Add Material", "clearAutoComplete()", err);
    }
  }

  // ===============   SUPPLIER  =================== //
  private getSupplierList(origin: string = "INIT"): void {
    try {
      var self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("admin/suppliers/dropdown", function(error: boolean, response: any) {
        self.isSupplierLoad = false;
        if (error) {
          console.log("error", response);
        } else {
          self.util.hideProcessing("processing-spinner");
          self.pageData.supplierList = response.data;
          self.filteredSupplier = self.supplier.valueChanges.pipe(
            startWith(""),
            map(value => self.supplierFilter(value))
          );
          origin == "REFRESH"
            ? (self.getSelectedSupplier(
                self.otfData.data
              ),
              self.supplier.setValue(
                self.otfData.data.supplier_name
              ))
            : "";
          console.log("self.pageData.supplierList", self.pageData.supplierList);
        }
      });
    } catch (err) {
      this.global.addException("Add Material", "getSupplierList()", err);
    }
  }
  getSelectedSupplier(supplier, event: any = false): void {
    event
      ? event.isUserInput
        ? (this.supplier_id.setValue(supplier.supplier_id),
        this.supplier.setValue(supplier.supplier_name))
        : ""
      : (this.supplier_id.setValue(supplier.supplier_id),
      this.supplier.setValue(supplier.supplier_name));
      this.util.focusHiddenInput("hiddenInput");
  }
  private supplierFilter(value: string): string[] {
    try {
      return this.pageData.supplierList.filter(option =>
        option.supplier_name
          .toLowerCase()
          .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Add Material", "supplierFilter()", err);
    }
  }
  public validateSupplier(event: any) {
    try {
      let sup = event.target.value;
      let match = this.pageData.supplierList.filter(
        item => item.supplier_name.toLowerCase() == sup.toLowerCase()
      );
      if (match.length > 0) {
        this.supplier_id.setValue(match[0].supplier_id);
        this.supplier.setValue(match[0].supplier_name);
      } else {
        this.supplier_id.setValue("");
      }
    } catch (err) {
      this.global.addException("Add Material", "validateSupplier()", err);
    }
  }
  showAddSupplierPopup(): void {
    sessionStorage.removeItem("supplierObject");
    this.util.changeEvent(null);
    this.dialog.open(InventoryDialog, { data: { action: "addNewSupplier" } });
  }
  // ==============   END SUPPLIER  =============== //


  // ================   ITEM DEFINITION  ===================== //
  private getManufacturerPart(id, origin: string = "INIT"): void {
    try {
      let self = this;
      this.http.doGet("item-definition/drop-down/type/3", function(error: boolean, response: any) {
        if (error) {
          console.log("error", response);
        } else {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            console.log(response);
          } else {
            self.pageData.manufacturerPartList = response.data;
            sessionStorage.getItem("materialInfo")
              ? self.getMfgPart(
                  self.pageData.manufacturerPartList.filter(
                    item =>
                      item.item_def_id ==
                      JSON.parse(sessionStorage.getItem("materialInfo"))
                        .requestData.item_def_id
                  )[0]
                )
              : "";
              self.filteredManufacturerPart = self.item_definition_name.valueChanges.pipe(
                startWith(""),
                map(value => self.manufacturerPartFilter(value))
              );
            origin == "REFRESH" ? self.setNewlyAddedMaterial() : "";
            console.log(
              "manufacturerPartList",
              self.pageData.manufacturerPartList
            );
          }
        }
      });
    } catch (err) {
      this.global.addException("Add Material", "getManufacturerPart()", err);
    }
  }
  setNewlyAddedMaterial(): void {
    try {
      let newAdded: any[] = this.pageData.manufacturerPartList;
      this.getMfgPart(this.otfData.data);
      this.item_definition_name.setValue(this.otfData.data.item_definition_name);

      this.pageData.selectedMfgPart = this.otfData.data;

      this.uom_id.setValue(this.otfData.data.uom.uom_id);
      this.uom.setValue(this.otfData.data.uom.uom_name);
    } catch (err) {
      this.global.addException("Add Material", "setNewlyAddedMaterial()", err);
    }
  }
  getMfgPart(part, event: any = false): void {
    try {
      event
        ? event.isUserInput
          ? (this.item_def_id.setValue(part.item_def_id),
             this.item_definition_name.setValue(part.item_definition_name),

            (this.pageData.selectedMfgPart = part),
            this.uom_id.setValue(part.uom.uom_id),
            this.uom.setValue(part.uom.uom_name))
          : ""
        : (this.item_def_id.setValue(part.item_def_id),

          (this.pageData.selectedMfgPart = part),
          this.uom_id.setValue(part.uom.uom_id),
          this.uom.setValue(part.uom.uom_name));
    } catch (err) {
      this.global.addException("Add Material", "getMfgPart()", err);
    }
     this.util.focusHiddenInput("hiddenInput");
  }
  private manufacturerPartFilter(value: string): string[] {
    try {
      return this.pageData.manufacturerPartList.filter(option =>
        option.item_definition_name
          .toLowerCase()
          .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Add materials", "manufacturerPartFilter()", err);
    }
  }
  public validateManfPart(event: any) {
    try {
      let manfPart = event.target.value;
      let match = this.pageData.manufacturerPartList.filter(
        item => item.item_definition_name.toLowerCase() == manfPart.toLowerCase()
      );
      console.log(match);
      if (match.length > 0) {
        this.item_def_id.setValue(match[0].item_def_id);
        this.item_definition_name.setValue(match[0].item_definition_name);
        this.pageData.selectedMfgPart = match[0];
        this.uom_id.setValue(match[0].uom.uom_id);
        this.uom.setValue(match[0].uom.uom_name);
      } else {
        this.item_def_id.setValue("");
        this.pageData.selectedMfgPart = null;
      }
    } catch (err) {
      this.global.addException("Add Material", "validateManfPart()", err);
    }
  }

  showAddManufacturerPartPopup(index : number = 0): void {
    try {
      sessionStorage.removeItem("newPart");
      sessionStorage.setItem("class", JSON.stringify(["Material"]));
      this.util.changeEvent(null);
      this.dialog.open(InventoryDialog, {
        data: { action: "addNewManufacturerPart",  params :
        {manf_id: "", manf_name: "", item_type: "Material"} }
      });
    } catch (err) {
      this.global.addException(
        "Add Material",
        "showAddManufacturerPartPopup()",
        err
      );
    }
  }
  // ==============   END ITEM DEFINITION  =================== //

  // ================   LOCATION  ===================== //
  getLocationList(): void {
    try {
      var self = this;
      this.http.doGet("admin/location?view=min", function(error: boolean, response: any) {
        self.isMainLocationLoad = false;
        if (error) {
          console.log("error", response);
        } else {
          self.pageData.locationList = response.data;
          self.locations
            .at(0)
            .get("filteredLocation")
            .setValue(
              self.locations
                .at(0)
                .get("location_name")
                .valueChanges.pipe(
                  startWith(""),
                  map(value => self.locationFilter(value))
                )
            );
        }
      });
    } catch (err) {
      this.global.addException("Add Material", "getLocationList()", err);
    }
  }
  getLocation(location, event: any = false, index): void {
    try {
      event
        ? event.isUserInput
          ? (this.locations
              .at(index)
              .get("location_id")
              .setValue(location.location_id),
            this.getLocationTagList(index, location.location_id))
          : ""
        : (this.locations
            .at(index)
            .get("location_id")
            .setValue(location.location_id),
          this.getLocationTagList(index, location.location_id));
      this.locations
        .at(index)
        .get("location_tag_id")
        .setValue("");
      this.locations
        .at(index)
        .get("location_tag_name")
        .setValue("");
    } catch (err) {
      this.global.addException("Add Material", "getLocation()", err);
    }
  }

  private locationFilter(value: string): string[] {
    try {
      return this.pageData.locationList.filter(option =>
        option.location_name
          .toLowerCase()
          .includes(value ? value.toLowerCase() : "")
      );
    } catch (err) {
      this.global.addException("Add Material", "locationFilter()", err);
    }
  }
  public validateLocation(event: any, item: any, index) {
    try {
      let location = event.target.value;
      if (location == "") {
        item.get("location_id").setValue("");
        this.locations
          .at(index)
          .get("location_tag_id")
          .setValue("");
        this.locations
          .at(index)
          .get("location_tag_name")
          .setValue("");
        return;
      }
      let match = this.pageData.locationList.filter(
        item => item.location_name.toLowerCase() == location.toLowerCase()
      );
      if (match.length > 0) {
        item.get("location_id").setValue(match[0].location_id);
        item.get("location_name").setValue(match[0].location_name);
        this.getLocationTagList(index, match[0].location_id);
        this.locations
          .at(index)
          .get("location_tag_id")
          .setValue("");
        this.locations
          .at(index)
          .get("location_tag_name")
          .setValue("");
      } else {
        item.get("location_id").setValue("");
      }
    } catch (err) {
      this.global.addException("Add Material", "validateLocation()", err);
    }
  }
  // ================   END LOCATION  ===================== //

  // ================   LOCATION TAG  ===================== //
  getLocationTagList(index, locId) {
    try {
      let self = this;
      if (locId == "") {
        return;
      }
      self.locations
        .at(index)
        .get("isSubLocationLoad")
        .setValue(true);
      this.http.doGet("admin/location/" + locId + "/tags", function(
        error: boolean,
        response: any
      ) {
        self.locations
          .at(index)
          .get("isSubLocationLoad")
          .setValue(false);
        if (error) {
          console.log("error", response);
        } else {
          self.locations
            .at(index)
            .get("locationTagList")
            .setValue(response.data);
          self.locations
            .at(index)
            .get("filteredLocationTag")
            .setValue(
              self.locations
                .at(index)
                .get("location_tag_name")
                .valueChanges.pipe(
                  startWith(""),
                  map(value => self.locationTagFilter(value, index))
                )
            );
        }
      });
    } catch (err) {
      this.global.addException("Add Material", "getLocationTagList()", err);
    }
  }

  getLocationTag(tag, event: any = false, index): void {
    try {
      console.log(tag);
      event
        ? event.isUserInput
          ? this.getTagDetails(tag, index)
          : ""
        : this.getTagDetails(tag, index);
    } catch (err) {
      this.global.addException("Add Material", "getLocationTag()", err);
    }
  }
  getTagDetails(tag, index): void {
    try {
      this.locations
        .at(index)
        .get("location_tag_id")
        .setValue(tag.location_tag_id);
      this.locations
        .at(index)
        .get("location_tag_name")
        .setValue(tag.scan_code);
    } catch (err) {
      this.global.addException("Add Material", "getTagDetails()", err);
    }
  }

  private locationTagFilter(value: string, index): string[] {
    try {
      return this.locations
        .at(index)
        .get("locationTagList")
        .value.filter(option =>
          option.scan_code
            .toLowerCase()
            .includes(value ? value.toLowerCase() : "")
        );
    } catch (err) {
      this.global.addException("Add Material", "locationTagFilter()", err);
    }
  }
  public validateLocationTag(event: any, item: any, index) {
    try {
      let locTag = event.target.value;
      let match = this.locations
        .at(index)
        .get("locationTagList")
        .value.filter(
          item => item.scan_code.toLowerCase() == locTag.toLowerCase()
        );
      if (match.length > 0) {
        item.get("location_tag_id").setValue(match[0].location_tag_id);
        item.get("location_tag_name").setValue(match[0].scan_code);
      } else {
        item.get("location_tag_id").setValue("");
      }
    } catch (err) {
      this.global.addException("Add Material", "validateLocationTag()", err);
    }
  }
  // ================  END LOCATION TAG  ===================== //

  createMaterialForm(option, val: any = {}): void {
    this.addMaterialForm = this.fb.group({
      po_id: new FormControl(option == "0" ? "" : val.po_id), //only for API call with PO (hidden)
      po_item_id: new FormControl(option == "0" ? "" : val.po_item_id), //only for API call with PO (hidden)
      receiving_slip_id: new FormControl(
        option == "0" ? "" : val.receiving_slip_id
      ), //only for API call with PO (hidden)
      is_unlisted: new FormControl(option == "0" ? 0 : val.is_unlisted), //only for API call with PO (hidden)
      supplier_id: new FormControl(option == "0" ? "" : val.supplier_id),
      item_def_id: new FormControl(option == "0" ? "" : val.item_def_id, [
        Validators.required
      ]),
      comment: new FormControl(option == "0" ? "" : val.comment, [
        Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ]),
      supplier: new FormControl(option == "0" ? "" : val.supplier), //only for review (hidden)
      item_definition_name: new FormControl(option == "0" ? "" : val.item_definition_name), //only for review (hidden)
      uom_id: new FormControl(option == "0" ? "" : val.uom_id, [
        Validators.required
      ]),
      uom: new FormControl(option == "0" ? "" : val.uom, [Validators.required]),
      purchase_price: new FormControl(option == "0" ? "" : val.purchase_price, [
        Validators.required,
        Validators.pattern(this.constant.AMOUNT_PATTERN)
      ]),
      locations: this.fb.array([]),
      totalQuantity: new FormControl(option == "0" ? "" : val.totalQuantity, [
        Validators.required,
        Validators.pattern(this.constant.AMOUNT_PATTERN)
      ]),
      remainingQuantity: new FormControl(
        option == "0" ? 0 : val.remainingQuantity
      )
    });
    if (option == "1") {
      for (let i = 0; i < val.locations.length; i++) {
        this.addLocation(option, val.locations[i]);
        this.getLocationTagList(i, val.locations[i].location_id);
      }
    } else {
      this.addLocation("0");
    }
  }

  get supplier_id() {
    return this.addMaterialForm.get("supplier_id");
  }
  get manf_id() {
    return this.addMaterialForm.get("manf_id");
  }
  get item_def_id() {
    return this.addMaterialForm.get("item_def_id");
  }
  get comment() {
    return this.addMaterialForm.get("comment");
  }
  get supplier() {
    return this.addMaterialForm.get("supplier");
  }
  get item_definition_name() {
    return this.addMaterialForm.get("item_definition_name");
  }
  get uom_id() {
    return this.addMaterialForm.get("uom_id");
  }
  get uom() {
    return this.addMaterialForm.get("uom");
  }
  get purchase_price() {
    return this.addMaterialForm.get("purchase_price");
  }
  get sales_price() {
    return this.addMaterialForm.get("sales_price");
  }
  get locations(): FormArray {
    return (<FormArray>(
      this.addMaterialForm.get("locations")
    )) as FormArray;
  }
  get totalQuantity() {
    return this.addMaterialForm.get("totalQuantity");
  }
  get remainingQuantity() {
    return this.addMaterialForm.get("remainingQuantity");
  }

  calculateRemainingQuantity() {
    console.log("CalculateRemainingQuantity ::");
    try {
      this.util.removeCommas(this.totalQuantity);
      if (this.constant.AMOUNT_PATTERN.test(this.totalQuantity.value)) {
        this.remainingQuantity.setValue(
          parseFloat(this.totalQuantity.value).toFixed(2)
        );
        let total: number = 0;
        for (let i = 0; i < this.locations.length; i++) {
          this.util.removeCommas(this.locations.at(i).get("quantity"));
          if (
            this.constant.AMOUNT_PATTERN.test(
              this.locations.at(i).get("quantity").value
            )
          ) {
            total += parseFloat(
              this.locations.at(i).get("quantity").value
            );
          }
        }
        this.remainingQuantity.setValue(
          (parseFloat(this.totalQuantity.value) - total).toFixed(2)
        );
      }
    } catch (err) {
      this.global.addException(
        "Add Product",
        "calculateRemainingQuantity()",
        err
      );
    }
  }

  addLocation(option, val: any = {}): void {
    try {
      this.locations.push(
        this.fb.group({
          location_name: new FormControl(
            option == "0" ? "" : val.location_name ? val.location_name : ""
          ), //Only for review
          location_id: new FormControl(option == "0" ? "" : val.location_id, [
            Validators.required
          ]),
          location_tag_id: new FormControl(
            option == "0" ? "" : val.location_tag_id,
            [Validators.required]
          ),
          location_tag_name: new FormControl(
            option == "0"
              ? ""
              : val.location_tag_name
              ? val.location_tag_name
              : "",
            [Validators.required]
          ),
          quantity: new FormControl(option == "0" ? "" : val.quantity, [
            Validators.required,
            Validators.pattern(this.constant.AMOUNT_PATTERN)
          ]),
          locationTagList: new FormControl([]),
          filteredLocation: new FormControl(new Observable<string[]>()),
          filteredLocationTag: new FormControl(new Observable<string[]>()),
          isSubLocationLoad: new FormControl(false)
        })
      );
      console.log(this.locations);
      this.setObservable(this.locations.length - 1);
    } catch (err) {
      this.global.addException("Add Material", "addLocation()", err);
    }
  }

  setObservable(index): void {
    try {
      this.locations
        .at(index)
        .get("filteredLocation")
        .setValue(
          this.locations
            .at(index)
            .get("location_name")
            .valueChanges.pipe(
              startWith(""),
              map(value => this.locationFilter(value))
            )
        );
      this.locations
        .at(index)
        .get("filteredLocationTag")
        .setValue(
          this.locations
            .at(index)
            .get("location_tag_name")
            .valueChanges.pipe(
              startWith(""),
              map(value => this.locationTagFilter(value, index))
            )
        );
    } catch (err) {
      this.global.addException("Add Material", "setObservable()", err);
    }
  }

  // removeLocation(position, location): void {
  //     try {
  //         this.locations.removeAt(position);
  //     } catch (err) {
  //         this.global.addException('Add Material', 'removeLocation()', err);
  //     }
  // }
  removeLocation(position, location): void {
    try {
      this.locations.removeAt(position);
      this.util.removeCommas(this.totalQuantity);
      if (this.constant.AMOUNT_PATTERN.test(this.totalQuantity.value)) {
        this.remainingQuantity.setValue(
          parseFloat(this.totalQuantity.value).toFixed(2)
        );
        let total: number = 0;
        for (let i = 0; i < this.locations.length; i++) {
          this.util.removeCommas(this.locations.at(i).get("quantity"));
          if (
            this.constant.AMOUNT_PATTERN.test(
              this.locations.at(i).get("quantity").value
            )
          ) {
            total += parseFloat(
              this.locations.at(i).get("quantity").value
            );
          }
        }
        this.remainingQuantity.setValue(
          (parseFloat(this.totalQuantity.value) - total).toFixed(2)
        );
      }
    } catch (err) {
      this.global.addException("Add Material", "removeLocation()", err);
    }
  }

  reviewMaterial(form: FormGroup): void {
    this.pageData.submitted = true;
    this.pageData.isError = false;
    console.log(form.value);
    try {
      if (form.valid) {
        if (this.remainingQuantity.value != 0) {
          this.pageData.isError = true;
          this.pageData.errMsg =
            "Total material quantity(sum of all location quantity) should match with quantity.";
          return;
        }
        if (this.currentPath != "add-material") {
          let totalQ: number = 0;
          for (let i = 0; i < form.value.locations.length; ++i) {
            totalQ =
              totalQ + parseInt(form.value.locations[i].quantity);
          }
          if (
            parseInt(this.pageData.materialInfo.requestData.quantity_ordered) !=
            totalQ
          ) {
            this.pageData.isError = true;
            this.pageData.errMsg =
              "Total material quantity should match with received quantity.";
            return;
          }
          form.value.quantity_ordered = this.pageData.materialInfo.requestData.quantity_ordered;
        }
        for (let i = 0; i < form.value.locations.length; ++i) {
          delete form.value.locations[i].filteredLocation;
          delete form.value.locations[i].filteredLocationTag;
        }
        let reqObj: any = {};
        reqObj = form.value;
        sessionStorage.setItem(
          "materialInfo",
          JSON.stringify({
            requestData: reqObj,
            displayData: this.pageData.selectedMfgPart
          })
        );
        this.currentPath == "add-material"
          ? this.router.url.split("/")[2] == "csa-onboarding"
            ? this.router.navigate([
                "/inventory/csa-onboarding/material-review"
              ])
            : this.router.navigate(["/inventory/csa/material-review"])
          : this.onTheFlyEvent({ step: "S2" });
        console.log("UOMName = ", reqObj);
        console.log(this.pageData.selectedMfgPart);
      }
    } catch (err) {
      this.global.addException("Add Material", "reviewMaterial()", err);
    }
  }
  cancelMaterial(): void {
    try {
      sessionStorage.removeItem("materialInfo");
      this.currentPath == "add-material"
        ? this.router.url.split("/")[2] == "csa-onboarding"
          ? this.router.navigate(["/csa-onboarding/guide"])
          : this.router.navigate(["/inventory/csa/material-list/0"])
        : this.onTheFlyEvent({ step: "S0" });
    } catch (err) {
      this.global.addException("Add Material", "cancelMaterial()", err);
    }
  }

  onTheFlyEvent(data): void {
    this.util.changeEvent({
      source: "ON_THE_FLY_MATERIAL",
      action: "ADD",
      data: data
    });
  }
}
