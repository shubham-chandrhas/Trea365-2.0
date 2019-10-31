import { Component, OnInit, ApplicationRef, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormControl,
  Validators,
  FormGroup,
  FormBuilder,
  FormArray
} from "@angular/forms";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { Location } from "@angular/common";
import * as _ from "underscore";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";
import { UtilService } from "../../../../shared/service/util.service";
import { ExportService } from "../../../../shared/service/export.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { InventoryDialog } from "../../inventory-dialog.component";
import { GlobalService } from "../../../../shared/service/global.service";
import { OnboardingGuideDialogComponent } from "../../../onboarding/onboarding-guide/onboarding-guide.component";

@Component({
  selector: "app-product-list",
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.css"]
})
export class ProductListComponent implements OnInit {
  pageData: any = {
    productList: [],
    listCount: 0,
    imageCount: 0,
    sortColumn: "item_def_id",
    sortOrder: "DSC",
    sortColumnType: "N",
    prodDetails: "details",
    action: "",
    isEdit: false,
    isError: false,
    submitted: false
  };
  searchList;
  searchTxt;
  editProductForm: FormGroup;
  removedLocation: any = [];
  deletedLoc: string = "0";
  public onBoarding:boolean = false;
  public thumbnail_image: any;
  constructor(
    @Inject(APP_CONFIG)
    private config: AppConfig,
    public dialog: MatDialog,
    public util: UtilService,
    public router: Router,
    private http: HttpService,
    private file: ExportService,
    private fb: FormBuilder,
    public constant: ConstantsService,
    private ref: ApplicationRef,
    private route: ActivatedRoute,
    private location: Location,
    private global: GlobalService
  ) {}

  ngOnInit() {
    let self = this;
    this.router.url.split("/")[2] == "csa-onboarding"
      ? this.util.menuChange({ menu: "guide", subMenu: "" })
      : this.util.menuChange({ menu: 3, subMenu: 19 });
    this.pageData.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.getProductList();
    this.getLocationList();
    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source == "PRODUCT") {
        self.getProductList();
        self.pageData.selectedProduct = null;
        self.pageData.selectedIndex = null;
        self.pageData.searchTxt = self.pageData.searchList = "";
      }
      else if (dataObj && dataObj.source == "UPLOAD_PRODUCT_DOC") {
        self.pageData.selectedProduct = dataObj.data;
        self.getProductList();
      }
      else if (dataObj && dataObj.source == "MOVE_INVENTORY") {
        self.pageData.backup.totalQuantity = dataObj.data ? dataObj.data.total_quantity : '';
        self.getProductList("REFRESH");
        self.cancelEdit();
        self.removedLocation = [];
      }
    });
  }

  getProductList(origin: string = "INIT") {
    try {
      let self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("product/list", function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.global.addException("Add product", "getProductList()", response);
        } else {
          self.pageData.productList = [];
          self.pageData.productList = response.data;
          // self.pageData.productList.map((item) => {item.quantity = parseFloat(item.quantity);});
          if(self.pageData.productList.length == 0) {
            self.onBoarding = true;
          }
          if (origin == "REFRESH" || self.pageData.selectedProduct) {
            self.selectProduct(
              self.pageData.productList.filter(
                item => item.item_def_id == self.pageData.selectedProduct.item_def_id
              )[0]
            );
          }
          self.route.snapshot.paramMap.get("id") != "0"
            ? self.showProductDetails()
            : "";
        }
      });
    } catch (err) {
      this.global.addException("Add product", "getProductList()", err);
    }
  }

  updateCount(count) {
    this.constant.ITEM_COUNT = this.pageData.listCount = count;
  }
  getSearchTxt(filterValue: string) {
    if (filterValue == "") {
      this.pageData.searchTxt = "";
    }
  }

  addNewProduct() {
    try {
      sessionStorage.removeItem("productInfo");
      this.router.url.split("/")[2] == "csa"
        ? this.router.navigate(["/inventory/csa/add-product"])
        : this.router.navigate(["/inventory/csa-onboarding/add-product"]);
    } catch (err) {
      this.global.addException("Product list", "addNewProduct()", err);
    }
  }

  showProductListPopup() {
    this.dialog.open(InventoryDialog, {
      data: {
        action: "purchaseOrderList",
        redirectPath: ["/inventory/rs/csa/add-receiving-slip"]
      }
    });
  }

  showProductDetails(): void {
    try {
      let sortedList: any[] = _.sortBy(
        this.pageData.productList,
        "item_def_id"
      ).reverse();
      for (var i = 0; i < sortedList.length; ++i) {
        if (
          this.route.snapshot.paramMap.get("id") == sortedList[i].item_def_id
        ) {
          this.selectProduct(sortedList[i]);
          this.pageData.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Product list", "showProductDetails()", err);
    }
  }

  selectProduct(product) {
    console.log("product = ", product);
    try {
      var self = this;
      this.pageData.prodDetails = "details";
      this.thumbnail_image = null;
      this.util.showProcessing("processing-spinner");
      this.http.doGet("product/"+product.item_def_id+"/details", function(
            error: boolean,
            response: any
        ) {
            self.util.hideProcessing("processing-spinner");
            if (error) {
            self.global.addException("Product list", "selectProduct()", response);
            } else {
                self.pageData.selectedProduct = response.data;
                self.createLocationForm(self.pageData.selectedProduct.locations);
                self.pageData.selectedProduct.totalQuantity = 0;
                self.pageData.selectedProduct.remainingQuantity = 0;
                for (let i = 0; i < self.pageData.selectedProduct.locations.length; i++) {
                    self.pageData.selectedProduct.totalQuantity =
                    parseFloat(self.pageData.selectedProduct.totalQuantity) +
                    parseFloat(self.pageData.selectedProduct.locations[i].quantity);
                    self.pageData.selectedProduct.remainingQuantity = parseFloat(
                    self.pageData.selectedProduct.remainingQuantity
                    );
                }
                for (let i = 0; i < self.pageData.selectedProduct.documents.length; i++) {
                  if (self.pageData.selectedProduct.documents[i].is_thumbnail === 1) {
                    self.thumbnail_image = self.pageData.selectedProduct.documents[i].attachment_path;
                  }
                }
                self.pageData.backup = JSON.parse(
                    JSON.stringify(self.pageData.selectedProduct)
                );
                self.location.go("/inventory/csa/product-list/" + product.item_def_id);
                setTimeout(function() {
                    self.util.scrollDown("prodMark");
                }, 1000);
            }
        });
    } catch (err) {
      this.global.addException("Product list", "selectProduct()", err);
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
  get totalQuantity() {
    return this.locations.get("quantity");
  }

  removeLocation(position, location): void {
    console.log('location in remove == ', location.value);
    try {
      console.log(
        "this.totalQuantity = ",
        this.pageData.selectedProduct.totalQuantity
      );
      let locRemoved = this.locations.value.splice(position, 1);
      if (locRemoved.length > 0) {
        this.locations.removeAt(position);
      }
      if(location.value.location_tag_name !== ""  && location.value.inventory_id !== null) {
        console.log('in if');
        this.removedLocation.push(locRemoved[0]);
      } else{
        console.log('in else');

      }
        if (
          this.constant.AMOUNT_PATTERN.test(
            this.pageData.selectedProduct.totalQuantity
          )
        ) {
          this.pageData.selectedProduct.remainingQuantity = parseFloat(
            this.pageData.selectedProduct.totalQuantity
          ).toFixed(2);
          let total: number = 0;
          for (let i = 0; i < this.locations.length; i++) {
            this.util.removeCommas(this.locations.at(i).get("quantity"));
            if (
              this.constant.AMOUNT_PATTERN.test(
                this.locations.at(i).get("quantity").value
              )
            ) {
              total += parseFloat(this.locations.at(i).get("quantity").value);
            }
          }
          this.pageData.selectedProduct.remainingQuantity = (
            parseFloat(this.pageData.selectedProduct.totalQuantity) - total
          ).toFixed(2);
        }

    } catch (err) {
      this.global.addException("Add Material", "removeLocation()", err);
    }
  }
  calculateRemainingQuantity(position, location): void {
    try {
      if (
        this.constant.AMOUNT_PATTERN.test(
          this.pageData.selectedProduct.totalQuantity
        )
      ) {
        this.pageData.selectedProduct.remainingQuantity = parseFloat(
          this.pageData.selectedProduct.totalQuantity
        ).toFixed(2);
        let total: number = 0;
        for (let i = 0; i < this.locations.length; i++) {
          this.util.removeCommas(this.locations.at(i).get("quantity"));
          if (
            this.constant.AMOUNT_PATTERN.test(
              this.locations.at(i).get("quantity").value
            )
          ) {
            total += parseFloat(this.locations.at(i).get("quantity").value);
          }
        }
        this.pageData.selectedProduct.remainingQuantity = (
          parseFloat(this.pageData.selectedProduct.totalQuantity) - total
        ).toFixed(2);
      }
    } catch (err) {
      this.global.addException("Add Material", "removeLocation()", err);
    }
  }

  updateProductDetails() {
    try {
      let self = this;
      self.util.addSpinner("prod-update-btn", "Update");
      this.http.doPost(
        "product/updateDetail",
        {
          item_def_id: self.pageData.selectedProduct.item_def_id,
          comment: self.pageData.selectedProduct.comment
        },
        function(error: boolean, response: any) {
          self.util.removeSpinner("prod-update-btn", "Update");
          if (error) {
            self.pageData.isError = true;
            self.pageData.errMsg = response.message;
          } else {
            self.pageData.backup.comment =
              self.pageData.selectedProduct.comment;
            self.getProductList();
            self.cancelEdit();
          }
        }
      );
    } catch (err) {
      this.global.addException("Product list", "updateProductDetails()", err);
    }
  }

  createLocationForm(locDetails): void {
    try {
      this.editProductForm = this.fb.group({
        locations: this.fb.array([])
      });

      if (locDetails) {
        for (var i = 0; i < locDetails.length; ++i) {
            this.addLocation("1", locDetails[i]);
            this.getLocationTagList(i, locDetails[i].location_id);
        }
      }
    } catch (err) {
      this.global.addException("Product list", "createLocationForm()", err);
    }
  }

  get locations(): FormArray {
    return (<FormArray>this.editProductForm.get("locations")) as FormArray;
  }

  addLocation(option, val: any = {}): void {
    console.log("val =", val);
    try {
      this.locations.push(
        this.fb.group({
          inventory_id: new FormControl(val.inventory_id),
          location_name: new FormControl(
            option == "0"
              ? ""
              : val.main_location
          ),
          location_id: new FormControl(
            option == "0" ? "" : val.location_id,
            [Validators.required]
          ),
          location_tag_id: new FormControl(
            option == "0" ? "" : val.location_tag_id,
            [Validators.required]
          ),
          location_tag_name: new FormControl(
            option == "0" ? "" : val.sub_location,
            [Validators.required]
          ),
          quantity: new FormControl(option == "0" ? "" : val.quantity, [
            Validators.required,
            Validators.pattern(this.constant.AMOUNT_PATTERN)
          ]),
          locationTagList: new FormControl([]),
          filteredLocation: new FormControl(new Observable<string[]>()),
          filteredLocationTag: new FormControl(new Observable<string[]>()),
          created_at: new FormControl(
            this.util.unixTimestampToLocalDate(val.created_at_unix).localDate,
            []
          )
        })
      );

      this.setObservable(this.locations.length - 1);
    } catch (err) {
      this.global.addException("Product list", "addLocation()", err);
    }
  }

  setObservable(index): void {
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
  }

  // ================   LOCATION  ===================== //
  getLocationList(): void {
    try {
      var self = this;
      this.http.doGet("admin/location?view=min", function(error: boolean, response: any) {
        if (error) {
          console.log("error", response);
        } else {
          self.pageData.locationList = response.data;
        }
      });
    } catch (err) {
      this.global.addException("Product list", "getLocationList()", err);
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
      this.global.addException("Add product", "getLocation()", err);
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
      this.global.addException("Product list", "locationFilter()", err);
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
      this.global.addException("Product list", "validateLocation()", err);
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
      this.http.doGet("admin/location/" + locId + "/tags", function(
        error: boolean,
        response: any
      ) {
        if (error) {
          console.log("error", response);
        } else {
          self.locations
            .at(index)
            .get("locationTagList")
            .setValue(response.data ? response.data : []);
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
      this.global.addException("Product list", "getLocationTagList()", err);
    }
  }

  getLocationTag(tag, event: any = false, index): void {
    try {
      event
        ? event.isUserInput
          ? this.getTagDetails(tag, index)
          : ""
        : this.getTagDetails(tag, index);
    } catch (err) {
      this.global.addException("Product list", "getLocationTag()", err);
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
      this.global.addException("Product list", "getTagDetails()", err);
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
      this.global.addException("Product list", "locationTagFilter()", err);
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
      this.global.addException("Product list", "validateLocationTag()", err);
    }
  }
  // ================  END LOCATION TAG  ===================== //

  updateLocationDetails(form: FormGroup) {
    var flag="";
    try {
      let self = this;
      let reqObj = {
        updated_quantity : self.pageData.selectedProduct.totalQuantity,
        item_def_id: self.pageData.selectedProduct.item_def_id,
        locations: []
      };
      let totalQuantity: any = 0;
      self.pageData.submitted = true;
      self.pageData.isError = false;
      if (form.valid) {
        console.log(this.removedLocation.length);
        if (this.removedLocation && this.removedLocation.length > 0) {
          for (let i = 0; i < this.removedLocation.length; i++) {
          let rmObj =   {
            inventory_id: this.removedLocation[i].inventory_id,
              location_tag_id: this.removedLocation[i].location_tag_id,
              quantity: this.removedLocation[i].quantity,
              isDelete: 1
            }
            reqObj.locations.push(rmObj);
          }
        }
        for (let i = 0; i < form.value.locations.length; i++) {
          totalQuantity =
            parseFloat(totalQuantity) +
            parseFloat(form.value.locations[i].quantity);
          reqObj.locations.push({
            inventory_id: form.value.locations[i].inventory_id,
            location_tag_id: form.value.locations[i].location_tag_id,
            quantity: form.value.locations[i].quantity,
            isDelete: 0
          });
        }
        console.log('reqObj.locations = ', JSON.stringify(reqObj));
        if (this.pageData.selectedProduct.remainingQuantity != 0) {
            self.util.addSpinner("update-loc-btn", "Update");
            self.dialog.open(InventoryDialog, {
              data: {
                action: "moveInventory",
                reqData: reqObj,
                apiEndPoint: "product/update/location",
                type: 'Product'
              },
              autoFocus: false
            });
            self.util.removeSpinner("update-loc-btn", "Update");
        }
        else {
            self.util.addSpinner("update-loc-btn", "Update");
            this.http.doPost("product/update/location", reqObj, function(
            error: boolean,
            response: any
            ) {
            self.util.removeSpinner("update-loc-btn", "Update");
            if (error) {
                self.pageData.isError = true;
                self.pageData.errMsg = response.message;
            } else {
                self.pageData.backup = JSON.parse(
                JSON.stringify(self.pageData.selectedProduct)
                );
                self.pageData.backup.totalQuantity = self.pageData.selectedProduct.totalQuantity = totalQuantity;
                self.getProductList("REFRESH");
                self.cancelEdit();
                self.removedLocation = [];
            }
            });
        }

      } else{
        console.log('error');
      }
    } catch (err) {
      this.global.addException("Product list", "updateLocationDetails()", err);
    }
  }

  showDetails(option) {
    this.pageData.prodDetails = option;
  }
  changeAction(action) {
    this.pageData.action = action;
  }
  cancelEdit() {
    try {
    this.removedLocation=[];

      this.pageData.selectedProduct = JSON.parse(
        JSON.stringify(this.pageData.backup)
      );
      this.createLocationForm(this.pageData.selectedProduct.location);
      this.pageData.action = "";
    } catch (err) {
      this.global.addException("Product list", "cancelEdit()", err);
    }
  }
  showDeleteDialog() {
    let data: any = {
      API_URL: "product/delete",
      reqObj: {
        item_def_id: this.pageData.selectedProduct.item_def_id
      },
      event: {
        source: "PRODUCT",
        action: "DELETE"
      }
    };
    this.util.showDialog(
      DialogComponent,
      "Are you sure you want to delete " +
      this.pageData.selectedProduct.name +
        " ?",
      [],
      "Delete Confirmation ?",
      "CONFIRMATION",
      data
    );
  }
  generatepdf() {
    this.file.generatePortraitpdf(
      "product-tbl",
      "Product List",
      "product_list"
    );
  }
  generatecsv() {
    this.file.generatecsv("product-tbl", "product_list");
  }

  addFromCSV() {
    let route: string,
      apiEndPoint: string,
      csvTemplateUrl: string,
      redirectUrl: string;
    route = "/csa-onboarding/csv-preview/product";
    apiEndPoint = "product/csv";
    csvTemplateUrl = this.config.domainIP + "api/download/csv/products.csv";
    redirectUrl = "/inventory/csa/product-list/0";

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
}
