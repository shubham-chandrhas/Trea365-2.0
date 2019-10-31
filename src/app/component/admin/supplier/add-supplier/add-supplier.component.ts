import {
  Component,
  OnInit,
  Inject,
  NgZone,
  ViewChild,
  ElementRef
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { MapsAPILoader } from "@agm/core";
import {
  FormControl,
  FormGroupDirective,
  Validators,
  FormGroup,
  FormBuilder
} from "@angular/forms";
import {
  IMultiSelectOption,
  IMultiSelectSettings,
  IMultiSelectTexts
} from "angular-2-dropdown-multiselect";

import { HttpService } from "../../../../shared/service/http.service";
import { UtilService } from "../../../../shared/service/util.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";
@Component({
  selector: "app-add-supplier",
  templateUrl: "./add-supplier.component.html",
  styleUrls: ["./add-supplier.component.css"]
})
export class AddSupplierComponent implements OnInit {
  public errMsg: string = "";
  public isEdit: boolean = false;
  public isError: boolean = false;
  public submitted: boolean = false;
  public isCountry: boolean = false;
  public isProvince: boolean = false;
  public isCity: boolean = false;
  addNewSupFrm: FormGroup;
  public suppliertypeList: any[] = [];
  public countries: any = [];
  public stateList: any = [];
  public cityList: any = [];
  private routeObj: any;
  currentPath: string;
  currentPathOnList: string;

  filteredCountry: Observable<string[]>;
  filteredProvince: Observable<string[]>;
  filteredCity: Observable<string[]>;

  @ViewChild("search")
  public searchElementRef: ElementRef;

  constructor(
    public util: UtilService,
    private http: HttpService,
    private router: Router,
    private fb: FormBuilder,
    public constant: ConstantsService,
    private route: ActivatedRoute,
    public mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private global: GlobalService
  ) {}

  ngOnInit() {
    this.currentPath = this.router.url.split("/")[
      this.router.url.split("/").length - 1
    ];
    this.currentPathOnList = this.router.url.split("/")[
      this.router.url.split("/").length - 2
    ];

    this.currentPath == "add-supplier"
      ? this.router.url.split("/")[2] == "csa-onboarding"
        ? this.util.menuChange({ menu: "guide", subMenu: "" })
        : this.util.menuChange({ menu: 2, subMenu: 16 })
      : "";
    this.router.url.split("/")[2] == "csa-onboarding"
      ? (this.routeObj = {
          list: "/csa-onboarding/guide",
          review: "/admin/csa-onboarding/supplier-review"
        })
      : (this.routeObj = {
          list: "/admin/csa/supplier-list/0",
          review: "/admin/csa/supplier-review"
        });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    if (sessionStorage.getItem("supplierObject")) {
      this.isEdit = true;
      let supObj: any = {};
      supObj = JSON.parse(sessionStorage.getItem("supplierObject"));

      this.createSupplierForm("edit", supObj.reqObj);
    } else {
      this.isEdit = false;
      this.createSupplierForm("add");
    }
    this.getCountries();
    this.onChanges();
  }

  ngOnDestroy() {}

  getCountries() {
    try {
      var self = this;
      // this.isCountry = true;
      this.isCountry = this.isEdit ? false : true;
      this.http.doGet("company/country-list", function(
        error: boolean,
        response: any
      ) {
        if (error) {
          self.countries = [];
        } else {
          console.log("searchElementRef", self.searchElementRef);
          console.log("address1", self.addNewSupFrm.get("address1"));
          self.countries = response.data;
          // self.filteredCountry = self.countryName.valueChanges.pipe(startWith(''),map(value => self.countryFilter(value)));
          self.isCountry = false;
          self.util.mapInit(
            self.mapsAPILoader,
            self.searchElementRef,
            self.ngZone,
            self.addNewSupFrm.get("address1"),
            [
              self.addNewSupFrm.get("countryId"),
              self.addNewSupFrm.get("provinceId"),
              self.addNewSupFrm.get("cityId"),
              self.addNewSupFrm.get("postalCode"),
              { countries: self.countries },
              self.addNewSupFrm.get("latitude"),
              self.addNewSupFrm.get("longitude")
            ]
          );
        }
      });
    } catch (err) {
      this.global.addException("Add Supplier", "getCountries()", err);
    }
  }
  onChanges(): void {}

  public createSupplierForm(action, supplierObj: any = {}) {
    this.addNewSupFrm = this.fb.group({
      supplierName: new FormControl(
        action === "edit" ? supplierObj.supplierName : "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(this.constant.DEFAULT_TEXT_MAXLENGTH)
        ]
      ),
      paymentTerms: new FormControl(
        action === "edit" ? supplierObj.paymentTerms : "",
        [
         Validators.min(0),
        ]
      ),
      address1: new FormControl(
        action === "edit" ? supplierObj.address1 : "",
        []
      ),
      address2: new FormControl(
        action == "edit" ? supplierObj.address2 : "",
        []
      ),
      countryName: new FormControl(
        action == "edit" ? supplierObj.countryName : ""
      ),
      provinceName: new FormControl(
        action == "edit" ? supplierObj.provinceName : ""
      ),
      emailId: new FormControl(action == "edit" ? supplierObj.emailId : "", [
        Validators.pattern(this.constant.EMAIL_PATTERN)
      ]),
      phoneNumber: new FormControl(
        action == "edit" ? supplierObj.phoneNumber : "",
        [Validators.pattern(this.constant.PHONE_PATTERN)]
      ),
      countryId: new FormControl(action == "edit" ? supplierObj.countryId : ""),
      provinceId: new FormControl(
        action == "edit" ? supplierObj.provinceId : ""
      ),
      cityId: new FormControl(action == "edit" ? supplierObj.cityId : ""),
      postalCode: new FormControl(
        action == "edit" ? supplierObj.postalCode : ""
      ),
      latitude: new FormControl(""),
      longitude: new FormControl(""),
      comment: new FormControl(action == "edit" ? supplierObj.comment : "", [
        Validators.maxLength(this.constant.DEFAULT_COMMENT_MAXLENGTH)
      ])
    });
  }
  get supplierName() {
    return this.addNewSupFrm.get("supplierName");
  }
  get paymentTerms() {
    return this.addNewSupFrm.get("paymentTerms");
  }
  get address1() {
    return this.addNewSupFrm.get("address1");
  }
  get address2() {
    return this.addNewSupFrm.get("address2");
  }
  get countryName() {
    return this.addNewSupFrm.get("countryName");
  }
  get countryId() {
    return this.addNewSupFrm.get("countryId");
  }
  get provinceName() {
    return this.addNewSupFrm.get("provinceName");
  }
  get provinceId() {
    return this.addNewSupFrm.get("provinceId");
  }
  get cityName() {
    return this.addNewSupFrm.get("cityName");
  }
  get cityId() {
    return this.addNewSupFrm.get("cityId");
  }
  get postalCode() {
    return this.addNewSupFrm.get("postalCode");
  }
  get emailId() {
    return this.addNewSupFrm.get("emailId");
  }
  get phoneNumber() {
    return this.addNewSupFrm.get("phoneNumber");
  }
  get comment() {
    return this.addNewSupFrm.get("comment");
  }

  addsupplier(form: FormGroup) {
    let self = this;
    this.errMsg = "";
    this.isError = false;
    this.submitted = true;
    try {
      if (form.valid) {
        let supplier: any = { supTyps: [] };
        supplier.reqObj = form.value;

        sessionStorage.setItem("supplierObject", JSON.stringify(supplier));
        this.currentPath == "add-supplier"
          ? this.router.navigate([this.routeObj.review])
          : this.onTheFlyEvent({ step: "S2" });
      }
    } catch (err) {
      this.global.addException("Add Supplier", "addsupplier()", err);
    }
  }

  cancelSupplier() {
    try {
      this.currentPath == "add-supplier"
        ? this.router.navigate([this.routeObj.list])
        : this.onTheFlyEvent({ step: "S0" });
    } catch (err) {
      this.global.addException("Add Supplier", "cancelSupplier()", err);
    }
  }

  onTheFlyEvent(data): void {
    this.util.changeEvent({
      source: "ON_THE_FLY_SUPPLIER",
      action: "ADD",
      data: data
    });
  }
}
