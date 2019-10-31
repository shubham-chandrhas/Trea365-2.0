// TO DO :- Bug while edit mfg fail to check class type
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  Input
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormControl,
  Validators,
  FormGroup,
  FormBuilder
} from "@angular/forms";
import {
  IMultiSelectOption,
  IMultiSelectSettings,
  IMultiSelectTexts
} from "angular-2-dropdown-multiselect";
import { MatDialog } from "@angular/material";
import { ManufacturerPartDialog } from "./../manufacturer-part.component";
import { Observable, Subscription, fromEvent } from "rxjs";
import { map, startWith, debounceTime } from "rxjs/operators";
import { AdminService } from "../../../../../component/admin/admin.service";
import { UtilService } from "../../../../../shared/service/util.service";
import { HttpService } from "../../../../../shared/service/http.service";
import { ConstantsService } from "../../../../../shared/service/constants.service";
import { ManufacturerDialog } from "../../../manufacturer/manufacturer/manufacturer.component";
import { GlobalService } from "../../../../../shared/service/global.service";
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from "@angular/material";
declare var jQuery: any;
declare var $: any;
@Component({
  selector: "app-add-manufacturer-part",
  templateUrl: "./add-manufacturer-part.component.html",
  styleUrls: ["./add-manufacturer-part.component.css"]
})
export class AddManufacturerPartComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @Input() forItemDef: any;
  pageData: any = {
    manufacturerList: [],
    errMsg: "",
    isError: false,
    submitted: false,
    attributeList: [],
    upcAvailability: 0,
    nameAvailable: 0,
    itemType: "Product",
    upcType: "barcode",
    itemclass: [],
    module: "Item Definition",
    allManfParts: []
  };
  stateCtrl: FormControl;
  outputCtrl: FormControl;
  manufCtrl: FormControl;
  manufId: FormControl;
  @ViewChild("input", { read: MatAutocompleteTrigger })
  autoComplete: MatAutocompleteTrigger;
  addMFGForm: FormGroup;
  public manfPartsList: any;
  // public replacesList: IMultiSelectOption[] = [];
  // public equivalentList: IMultiSelectOption[] = [];
  //  public replacesList =  [];
  public manfList: IMultiSelectOption[] = [];
  public equivalentList = [];
  public currentPath: string;
  filteredManufacturer: Observable<string[]>;
  filteredClass: Observable<string[]>;
  mulSelSettings: IMultiSelectSettings = {
    displayAllSelectedText: true
    //  enableSearch: true,
    //  showCheckAll: true
  };
  public selectText: IMultiSelectTexts = {
    defaultTitle: "",
    checkAll: "Select all",
    uncheckAll: "Unselect all",
    searchEmptyResult: "Nothing found..."
  };
  public otfData: any;
  manfNames = [];
  type = "is_product_type";
  isOnTheFly = false;
  subscription: Subscription;
  public upcType: string;
  public productType = false;
  public assetType = true;
  public materialType = true;
  public sysUPCNo: any;
  public materialManf: any;
  dataLoading = false;

  constructor(
    public util: UtilService,
    private constant: ConstantsService,
    private http: HttpService,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private admin: AdminService,
    private global: GlobalService
  ) {
    this.stateCtrl = new FormControl();
    this.outputCtrl = new FormControl([]);
    this.manufCtrl = new FormControl([]);
    this.manufId = new FormControl([]);
  }
  ngOnInit() {
    this.currentPath = this.router.url.split("/")[3];
    this.currentPath === "add-manufacturer-part"
      ? this.router.url.split("/")[2] === "csa-onboarding"
        ? this.util.menuChange({
            menu: "guide",
            subMenu: ""
          })
        : this.util.menuChange({
            menu: 2,
            subMenu: 14
          })
      : (this.isOnTheFly = true);
    // console.log(this.pageData.addMfgPartStep, this.forItemDef);
    this.util.setWindowHeight();
    this.util.showProcessing("processing-spinner");
    this.getManufacturerList();
    this.getUOMList();
    this.util.setPageTitle(this.route);
    if (sessionStorage.getItem("newPart")) {
      this.createMFGForm(JSON.parse(sessionStorage.getItem("newPart")));
      this.pageData.attributeList = JSON.parse(
        sessionStorage.getItem("newPart")
      ).attribute;
    } else {
      this.createMFGForm("0");
      this.getSelectedEqAndReplaces(
        this.forItemDef ? this.forItemDef.value : 1
      );
    }
    this.forItemDef && this.forItemDef.item_type ? this.checkOTFType() : "";
    this.onChanges();
    this.subscription = this.util.changeDetection.subscribe(dataObj => {
      if (dataObj) {
        this.otfData = dataObj;
        if (dataObj.source === "MANUFACTURER") {
          this.getManufacturerList("REFRESH");
          this.util.changeEvent(null);
        } else if (dataObj.source === "ON_THE_FLY_ITEM_CATEGORY") {
        }
      }
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.pageData.manfObj = {};
  }
  ngAfterViewInit() {
    this.addMFGForm
      .get("manfUPC")
      .valueChanges.pipe(debounceTime(1000))
      .subscribe(searchString => {
        this.validateUPC(searchString);
      });
  }
  checkOTFType() {
    switch (this.forItemDef && this.forItemDef.item_type) {
      case "Product":
        this.productType = false;
        this.assetType = true;
        this.materialType = true;
        this.pageData.itemType = "Product";
        this.manageValidationOnItemType(1);

        break;
      case "Asset":
        this.productType = true;
        this.assetType = false;
        this.materialType = true;
        this.pageData.itemType = "Asset";
        this.manageValidationOnItemType(2);

        break;
      case "Material":
        this.productType = true;
        this.assetType = true;
        this.materialType = false;
        this.pageData.itemType = "Material";
        this.manageValidationOnItemType(3);
        break;
      case "Asset/Product":
        this.productType = false;
        this.assetType = false;
        this.materialType = true;
        // this.pageData.itemType = "Product";
        this.manageValidationOnItemType(1);
        break;
      default:
        this.productType = false;
        this.assetType = false;
        this.materialType = false;
    }
  }
  onChanges(): void {
    try {
      this.addMFGForm.get("manufacturerId").valueChanges.subscribe(selmfg => {
        if (selmfg !== "") {
          // this.replaces.setValue("");
          // this.equivalent.setValue("");
        }
      });
    } catch (err) {
      this.global.addException("Manufacturer", "onChanges()", err);
    }
    this.addMFGForm.get("itemType").valueChanges.subscribe(type => {
      this.pageData.itemType = this.constant.ITEM_TYPES[type];
      this.manageValidationOnItemType(type);
    });
    this.addMFGForm.get("upcType").valueChanges.subscribe(type => {
      this.pageData.upcType = "barcode";
      if (type === "barcode" && this.addMFGForm.get("itemType").value == 1) {
        this.util.updateValidators(this.addMFGForm, "manfUPC", [
          Validators.required,
          Validators.pattern(this.constant.CODE39_WITHOUT_SPACE_PATTERN),
          Validators.maxLength(30)
        ]);
      } else {
        this.util.updateValidators(this.addMFGForm, "manfUPC", []);
        this.addMFGForm.get("manfUPC").setValue("");
      }
    });
    this.addMFGForm
      .get("shortName")
      .valueChanges.pipe(debounceTime(1000))
      .subscribe(searchString => {
        this.validateName(searchString);
      });
  }
  manufSelected(selected: MatAutocompleteSelectedEvent) {
    // console.log(this.manufCtrl.value);
    const manufValues: string[] = this.manufCtrl.value;
    const index: number = manufValues.indexOf(selected.option.value);
    if (index >= 0) {
      this.manufCtrl.value.splice(index, 1);
    } else {
      manufValues.push(selected.option.value);
      this.manfNames = manufValues;
    }
    if (manufValues.length === 0) {
      this.manfNames = [];
    }
    //  console.log(this.manufCtrl.value, this.manfNames);
    this.manufacturer.setValue([]);
    const setVal = manufValues.length > 0 ? manufValues : [];
    this.manufCtrl.setValue(setVal);
  }
  isManufSelected(value) {
    //  setTimeout(() => {
    // console.log(this.manfNames.indexOf(value) >= 0 , value);
    return this.manfNames.indexOf(value) >= 0;

    // }, 3000);
  }
  manageValidationOnItemType(type) {
    type = parseInt(type, 10);
    switch (type) {
      case 1:
        this.commanValidation();
        this.util.updateValidators(this.addMFGForm, "manufacturerId", [
          Validators.required
        ]);
        // this.util.updateValidators(this.addMFGForm, "manufacturer", [Validators.required]);
        this.getSelectedEqAndReplaces(1);
        this.manufacturerId.setValue([]);
        this.manufacturer.setValue([]);
        this.manufCtrl.setValue([]);
        this.manfNames = [];
        break;
      case 2:
        this.util.updateValidators(this.addMFGForm, "minimumStock", []);
        this.util.updateValidators(this.addMFGForm, "UOM", []);
        this.util.updateValidators(this.addMFGForm, "salePrice", []);
        this.getSelectedEqAndReplaces(2);
        this.manufacturer.setValue("");
        this.manufacturerId.setValue("");
        break;
      case 3:
        this.commanValidation();
        this.util.updateValidators(this.addMFGForm, "manfUPC", []);
        this.util.updateValidators(this.addMFGForm, "manufacturerId", []);
        this.util.updateValidators(this.addMFGForm, "manufacturer", []);
        this.manufacturerId.setValue("");
        break;
    }
  }
  commanValidation() {
    this.util.updateValidators(this.addMFGForm, "minimumStock", [
      Validators.required,
      Validators.min(0),
      Validators.max(99999999)
    ]);
    this.util.updateValidators(this.addMFGForm, "UOM", [Validators.required]);
    this.util.updateValidators(this.addMFGForm, "salePrice", [
      Validators.pattern(this.constant.AMOUNT_PATTERN)
    ]);
  }
  // ================   MANUFACTURER  ===================== //
  private getManufacturerList(origin: string = "INIT"): void {
    const self = this;
    let url = "manufacturer/drop-down/filter";
    try {
      if (this.forItemDef && this.forItemDef.item_type) {
        url = "manufacturer/drop-down";
      } else {
        url = "manufacturer/drop-down/filter";
      }
      this.http.doGet(`${url}`, (error: boolean, response: any) => {
        if (error) {
          this.global.addException(
            "add-Manufacturer-part",
            "getManufacturerList()",
            error
          );
        } else {
          self.util.hideProcessing("processing-spinner");
          if (response.data.length > 0) {
            self.pageData.manufacturerList = response.data;
            const list = [];
            self.pageData.manufacturerList.map(item => {
              const obj: any = {
                id: item.manf_id,
                name: item.manf_name
              };
              list.push(obj);
            });
            self.manfList = list;
            self.pageData.manufacturerId = response.data.filter(
              item => item.manf_name === item.manf_name
            )[0].manf_id;
            self.filteredManufacturer = self.manufacturer.valueChanges.pipe(
              startWith(""),
              map(value => self.manufacturerFilter(value))
            );
            self.materialManf = response.data.filter(
              item => item.is_material_default == 1
            )[0];
            origin === "REFRESH" && self.pageData.itemType !== "Product"
              ? (self.getMfg(self.pageData.manufacturerList[0], {}),
                self.manufacturer.setValue(self.otfData.data.manf_name),
                self.manufacturerId.setValue(self.otfData.data.manf_id))
              : "";
          }
        }
      });
    } catch (err) {
      this.global.addException(
        "add-Manufacturer-part",
        "getManufacturerList()",
        err
      );
    }
  }
  getMfg(mfg, event: any = false): void {
    if (this.pageData.itemType === "Product") {
      const manufId: string[] = this.manufId.value;
      const index: number = manufId.indexOf(mfg.manf_id);
      if (index >= 0) {
        manufId.splice(index, 1);
      } else {
        manufId.push(mfg.manf_id);
      }
      const uniqueElem = manufId.filter((v, i) => manufId.indexOf(v) === i);
      event
        ? event.isUserInput
          ? this.manufacturerId.setValue(uniqueElem)
          : ""
        : "";
    } else {
      event
        ? event.isUserInput
          ? (this.manufacturerId.setValue(mfg.manf_id),
            this.manufacturer.setValue(mfg.manf_name))
          : ""
        : "";
    }
    this.util.focusHiddenInput("hiddenInput");
  }
  private manufacturerFilter(value: string): string[] {
    try {
      if (typeof value == "string") {
        const list = this.pageData.manufacturerList;
        return list.filter(option =>
          option.manf_name
            .toLowerCase()
            .includes(value ? value.toLowerCase() : "")
        );
      }
    } catch (err) {
      this.global.addException("Manufacturer", "manufacturerFilter()", err);
    }
  }
  showAddManufacturerPopup(): void {
    this.util.changeEvent(null);
    this.dialog.open(ManufacturerDialog, {
      data: {
        action: "addManufacturer"
      }
    });
  }

  public validateManf(event: any) {
    const manf = event.target.value;
    const match = this.pageData.manufacturerList.filter(
      item => item.manf_name.toLowerCase() === manf.toLowerCase()
    );
    if (manf === "") {
      this.manufacturerId.setValue("");
      // this.replacesList = [];
      this.equivalentList = [];
      return;
    }
    if (match.length > 0 && this.pageData.itemType === "Asset") {
      this.manufacturerId.setValue(match[0].manf_id);
      this.manufacturer.setValue(match[0].manf_name);
    } else {
      // this.replacesList = [];
      this.equivalentList = [];
    }
  }
  // ===============   END MANUFACTURER  =================== //
  public clearAutoComplete(name, id) {
    this.addMFGForm.get(id).setValue("");
    this.addMFGForm.get(name).setValue("");
  }
  validateName(string) {
    const self = this;
    const reqObj = { item_definition_name: string };
    this.http.doPost(
      "item-definition/isUniqueItemDefName",
      reqObj,
      (error: boolean, response: any) => {
        if (error) {
          this.global.addException(
            "add-Manufacturer-part",
            "validateName()",
            error
          );
        } else {
          self.pageData.nameAvailable = response.data.is_available;
        }
      }
    );
  }
  getSelectedEqAndReplaces(type?) {
    this.dataLoading = true;
    const self = this;
    const typeId = type ? type : this.itemType.value;
    this.http.doGet(
      `item-definition/drop-down/type/${typeId}`,
      (error: boolean, response: any) => {
        if (error) {
          this.global.addException(
            "add-Manufacturer-part",
            "getManufacturerList()",
            error
          );
          self.dataLoading = false;
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
          self.dataLoading = false;
        }
      }
    );
  }
  getUOMList() {
    const self = this;
    try {
      this.http.doGet("uom/list", (error: boolean, response: any) => {
        if (error) {
          this.global.addException(
            "add-Manufacturer-part",
            "getManufacturerList()",
            error
          );
        } else {
          self.pageData["uomList"] = response.data;
        }
      });
    } catch (err) {
      this.global.addException("Manufacturer", "getUOMList()", err);
    }
  }
  clearClass() {
    // this.replacesList = [];
    this.equivalentList = [];
  }
  getClass(itemClassType) {
    try {
      this.pageData.submitted = false;
      this.pageData.itemType = itemClassType;
      if (
        this.pageData.itemType === "Asset" ||
        this.pageData.itemType === "Product"
      ) {
        this.util.addBulkValidators(
          this.addMFGForm,
          ["manufacturerId", "UOM"],
          [Validators.required]
        );
        this.util.addBulkValidators(
          this.addMFGForm,
          ["manufacturerPartNo"],
          [Validators.pattern(this.constant.NO_SPACE_PATTERN)]
        );
        if (this.pageData.itemType === "Asset") {
          this.util.addBulkValidators(
            this.addMFGForm,
            ["manufacturer"],
            [Validators.required]
          );
          this.util.addBulkValidators(this.addMFGForm, ["UOM"], []);
          this.util.addBulkValidators(this.addMFGForm, ["minimumStock"], []);
        } else {
          this.util.addBulkValidators(
            this.addMFGForm,
            ["minimumStock"],
            [Validators.required, Validators.min(0), Validators.max(99999999)]
          );
        }
      } else if (this.pageData.itemType === "Material") {
        this.util.addBulkValidators(
          this.addMFGForm,
          [
            "manufacturer",
            "manufacturerId",
            "manufacturerPartNo",
            "UOM",
            "manfUPC"
          ],
          []
        );
        this.util.addBulkValidators(
          this.addMFGForm,
          ["UOM"],
          [Validators.required]
        );
        this.util.addBulkValidators(
          this.addMFGForm,
          ["minimumStock"],
          [Validators.required, Validators.min(0), Validators.max(99999999)]
        );
      }
      this.manageValidationOnItemType(this.itemType.value);
    } catch (err) {
      this.global.addException("Manufacturer", "getClass()", err);
    }
  }
  public createMFGForm(val) {
    // console.log(val);
    this.pageData.itemType = val === "0" ? "Product" : val.classType;
    this.pageData.upcType = val === "0" ? "barcode" : "barcode";
    this.addMFGForm = this.fb.group({
      // val.itemType.toString()
      itemType: new FormControl(val === "0" ? "1" : val.itemType.toString(), [
        Validators.required
      ]),
      manufacturer: new FormControl(val === "0" ? "" : val.manufacturer, [
        Validators.required
      ]),
      manufacturerId: new FormControl(val === "0" ? "" : val.manufacturerId, [
        Validators.required
      ]),
      salePrice: new FormControl(val === "0" ? "" : val.salePrice, [
        Validators.pattern(this.constant.AMOUNT_PATTERN)
      ]),
      manufacturerPartNo: new FormControl(
        val === "0" ? "" : val.manufacturerPartNo,
        [
          Validators.pattern(this.constant.NO_SPACE_PATTERN),
          Validators.maxLength(30)
        ]
      ),
      upcType: new FormControl(val === "0" ? "" : val.upcType),
      manfUPC: new FormControl(val === "0" ? "" : val.manfUPC, []),
      description: new FormControl(val === "0" ? "" : val.description, []),
      shortName: new FormControl(val === "0" ? "" : val.shortName, [
        Validators.required,
        Validators.maxLength(50)
      ]),
      equivalent: new FormControl(val === "0" ? "" : val.equivalent),
      minimumStock: new FormControl(val === "0" ? "" : val.minimumStock, [
        Validators.required,
        Validators.min(0),
        Validators.max(99999999)
      ]),
      UOM: new FormControl(val === "0" ? "" : val.UOM, [Validators.required])
      // replaces: new FormControl(val === "0" ? "" : val.replaces),
    });
    val === "0" ? "" : this.getClass(val.classType);
    val === "0" ? "" : this.checkOTFType();
    // if (this.pageData.itemType === "Product") {
    setTimeout(() => {
      this.addMFGForm.get("manufacturer").setValue(val.manufacturer);
      this.addMFGForm.get("manufacturerId").setValue(val.manufacturerId);
    }, 0);

    // }
  }
  get itemType() {
    return this.addMFGForm.get("itemType");
  }
  get manufacturer() {
    return this.addMFGForm.get("manufacturer");
  }
  get manufacturerId() {
    return this.addMFGForm.get("manufacturerId");
  }
  get salePrice() {
    return this.addMFGForm.get("salePrice");
  }
  get manufacturerPartNo() {
    return this.addMFGForm.get("manufacturerPartNo");
  }
  get manfUPC() {
    return this.addMFGForm.get("manfUPC");
  }
  get description() {
    return this.addMFGForm.get("description");
  }
  get shortName() {
    return this.addMFGForm.get("shortName");
  }
  get equivalent() {
    return this.addMFGForm.get("equivalent");
  }
  get minimumStock() {
    return this.addMFGForm.get("minimumStock");
  }
  get UOM() {
    return this.addMFGForm.get("UOM");
  }

  // get replaces() {
  //   return this.addMFGForm.get("replaces");
  // }

  sysUPC(form) {
    this.util.addSpinner("next-btn-id", "Next");
    this.http.doGet(`item-definition/upc`, (error: boolean, response: any) => {
      try {
        if (error) {
          this.global.addException("Manufacturer", "sysUPC()", response);
        } else {
          this.util.removeSpinner("next-btn-id", "Next");
          this.addMFGForm.get("upcType").value == ""
            ? this.addMFGForm.get("manfUPC").setValue(response.data)
            : "";
          this.setFormData(form);
        }
      } catch (err) {
        this.global.addException("Manufacturer", "sysUPC()", err);
      }
    });
  }
  setItemType() {
    if (this.pageData.itemType === "Product") {
      this.itemType.setValue("1");
    } else if (this.pageData.itemType === "Asset") {
      this.itemType.setValue("2");
    } else if (this.pageData.itemType === "Material") {
      this.itemType.setValue("3");
    }
  }
  setFormData(form) {
    if (
      form.valid &&
      this.pageData.upcAvailability === 0 &&
      this.pageData.nameAvailable === 0
    ) {
      let equivalentText = "";
      if (
        this.pageData.itemType === "Product" ||
        this.pageData.itemType === "Asset"
      ) {
        const equivalentId = document.getElementById(
          "equivalentId"
        ) as HTMLSelectElement;
        equivalentText = equivalentId.options[equivalentId.selectedIndex].text;
        form.value.equivalent && form.value.equivalent !== ""
          ? (equivalentText = this.equivalentList.filter(
              item => item.id === parseInt(form.value.equivalent, 10)
            )[0].name)
          : "";
      }
      form.value.selectedVal = {
        manufacturer:
          this.pageData.itemType === "Asset"
            ? this.pageData.manufacturerList.filter(
                item => item.manf_id == form.value.manufacturerId
              )[0].manf_name
            : this.pageData.itemType === "Product"
            ? !this.isOnTheFly
              ? this.getSelectedManfParts(form.value.manufacturer, "name")
              : form.value.manufacturer
            : "",
        equivalentName:
          this.pageData.itemType === "Material" ? "" : equivalentText,

        UOMName:
          form.value.UOM && form.value.UOM !== ""
            ? this.pageData.uomList.filter(
                item => item.uom_id === parseInt(form.value.UOM, 10)
              )[0].uom_name
            : ""
      };
      // this.pageData.itemType === "Material" ? form.value.manufacturerId = this.pageData.manufacturerId : "";
      form.value.attribute = this.pageData.attributeList;
      let manfPartDetails: any = {};
      form.value.UOM = parseInt(form.value.UOM, 10);
      form.value.itemType =
        this.pageData.itemType === "Product"
          ? 1
          : this.pageData.itemType === "Asset"
          ? 2
          : this.pageData.itemType === "Material"
          ? 3
          : 1;
      manfPartDetails = form.value;
      manfPartDetails.classType = this.pageData.itemType;
      manfPartDetails.materialManf = this.materialManf;
      manfPartDetails.isOnTheFly = this.isOnTheFly;
      // console.log(manfPartDetails);
      sessionStorage.setItem("newPart", JSON.stringify(manfPartDetails));
      this.currentPath === "add-manufacturer-part"
        ? this.router.url.split("/")[2] === "csa-onboarding"
          ? this.router.navigate(["/admin/csa-onboarding/mfg-attributes"])
          : this.router.navigate(["/admin/csa/mfg-attributes"])
        : this.onTheFlyEvent({
            step: "S2"
          });
    }
  }
  async addManufacturer(form: FormGroup) {
    try {
      this.pageData.errMsg = "";
      this.pageData.isError = false;
      this.pageData.submitted = true;
      if (this.pageData.itemType === "Product" && !this.isOnTheFly) {
        this.manufacturerId.setValue(
          this.getSelectedManfParts(form.value.manufacturer, "id")
        );
        // this.manufacturer.setValue(this.getSelectedManfParts(form.value.manufacturer, "name"));
      } else if (
        (this.pageData.itemType === "Product" ||
          this.pageData.itemType === "Asset") &&
        this.isOnTheFly
      ) {
        this.manufacturerId.setValue(this.forItemDef.manf_id);
        this.manufacturer.setValue(this.forItemDef.manf_name);
      }
      //  this.setItemType();
      this.sysUPC(form);
    } catch (err) {
      this.global.addException(
        "add-Manufacturer-part",
        "getManufacturerList()",
        err
      );
    }
  }

  getSelectedManfParts(partIds: any, type) {
    try {
      const partNames: any[] = [];
      const partId: any[] = [];
      for (let i = 0; i < this.pageData.manufacturerList.length; i++) {
        for (let j = 0; j < partIds.length; j++) {
          if (this.pageData.manufacturerList[i].manf_id == partIds[j]) {
            partId.push(this.pageData.manufacturerList[i].manf_id);
            partNames.push(this.pageData.manufacturerList[i].manf_name);
            break;
          }
        }
      }
      if (type === "id") {
        return partId;
      } else {
        return partNames;
      }
    } catch (err) {
      this.global.addException("Manufacturer", "getSelectedManfParts()", err);
    }
  }

  cancelAddManufacturerPart() {
    try {
      this.currentPath === "add-manufacturer-part"
        ? this.dialog.open(ManufacturerPartDialog, {
            data: {
              action: "cancelAddManufacturerPart"
            },
            autoFocus: false
          })
        : this.onTheFlyEvent({
            step: "S0"
          });
    } catch (err) {
      this.global.addException(
        "Manufacturer",
        "cancelAddManufacturerPart()",
        err
      );
    }
  }

  onTheFlyEvent(data): void {
    this.util.changeEvent({
      source: "ON_THE_FLY_MANUFACTURER_PART",
      action: "ADD",
      data: data
    });
  }

  validateUPC(event: any) {
    const self = this;
    self.pageData.isError = false;
    if (!self.manfUPC.valid && !self.manfUPC.dirty) {
      return;
    }
    try {
      if (this.manfUPC.value !== "") {
        this.http.doGet(
          `item-definition/isUniqueItemDefUpc/${this.manfUPC.value}`,
          (error: boolean, response: any) => {
            if (error) {
              this.global.addException("validate UPC", "validateUPC()", error);
            } else {
              self.pageData.isError = true;
              self.pageData.upcAvailability = response.data.is_available;
            }
          }
        );
      }
    } catch (err) {
      this.global.addException("validate UPC", "validateUPC()", err);
    }
  }
}
