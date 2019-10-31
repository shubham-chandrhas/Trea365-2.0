import { Component, OnInit, OnDestroy, DoCheck } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
} from "@angular/forms";
import { MatDialog } from "@angular/material";
import { Location } from "@angular/common";
import * as _ from "underscore";
import { Subscription , Observable } from "rxjs";
import { HttpService } from "../../../shared/service/http.service";
import { UtilService } from "../../../shared/service/util.service";
import { ConstantsService } from "../../../shared/service/constants.service";
import { FileService } from "../../../shared/service/file.service";
import { DialogComponent } from "../../../shared/model/dialog/dialog.component";
import { TSADialogComponent } from "../tsa.dialog";
import { EmployeeDialog } from "../../hr/employee/employee-dialog.component";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalService } from "../../../shared/service/global.service";

@Component({
  selector: "app-dash",
  templateUrl: "./dashboard.html",
  styleUrls: [
    "./landing.scss",
    "./item-classes.css"
  ]
})
export class TSADashboardComponent implements OnInit, OnDestroy, DoCheck {
  companyList: any = "";
  searchTxt: string;
  paginationKey: any;
  listCount = 0;

  editAccDetailsFrm: FormGroup;
  editTab;
  selCompany: any;
  selectedIndex;
  isEdit = false;
  pageData: any = {
    sortColumn: "company_id",
    sortColumnType: "N",
    sortOrder: "DSC"
  };
  isError = false;
  errMsg = "";
  userCount = 0;
  submitted = false;
  subscription: Subscription;

  constructor(
    private http: HttpService,
    public util: UtilService,
    public constant: ConstantsService,
    private fb: FormBuilder,
    private file: FileService,
    public dialog: MatDialog,
    public route: ActivatedRoute,
    private location: Location,
    private global: GlobalService,
    private router: Router

  ) {
    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
  }

  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.getCompanyList("INIT");
    this.getStatusList();
     this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.action === "delete") {
        const url  = this.router.url.split("/");
        url.pop();
        url.shift();
        if (url.toString() === "su,tsa,dashboard") {
            this.getCompanyList("update");
        }
      }
     });
  }


  ngOnDestroy() {
    this.subscription ? this.subscription.unsubscribe() : "";
  }
  ngDoCheck() {
  }
  getStatusList(): void {
    try {
      const self = this;
      this.http.doGet("getCommonStatus/COMP_ACC_STATUS", function(
        error: boolean,
        response: any
      ) {
        self.pageData.accountStatusList = [];
        if (error) {
          console.log(error);
        } else {
          self.pageData.accountStatusList = response.data.statusList;
        }
      });

      this.http.doGet("getCommonStatus/COMP_PAY_STATUS", function(
        error: boolean,
        response: any
      ) {
        self.pageData.paymentStatusList = [];
        if (error) {
          console.log(error);
        } else {
          self.pageData.paymentStatusList = response.data.statusList;
        }
      });
    } catch (err) {
      this.global.addException("Dashboard", "getStatusList()", err);
    }
  }

  getCompanyList(option): void {
    try {
      const self = this;
      self.companyList = [];
      this.util.showProcessing("processing-spinner");
      this.http.doGet("company/list", function(
        error: boolean,
        response: any
      ) {
        if (error) {
          self.util.hideProcessing("processing-spinner");
        } else {
          self.companyList = response.data;
          self.companyList.map((item) => { item.price_per_user = parseFloat(item.price_per_user) });
          self.constant.ITEM_COUNT = response.data.length;
          self.util.hideProcessing("processing-spinner");
          const details = self.route.snapshot.paramMap.get("id") !== "0" || option === "update"
            ? self.showCompanyDetails(option)
            : "";
        }
      });
    } catch (err) {
      this.global.addException("Dashboard", "getCompanyList()", err);
    }
  }

  changeItemPerPage() {
    window.scrollTo(0, 0);
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }
  getSearchTxt(filterValue: string) {
    if (filterValue === "") {
      this.pageData.searchTxt = "";
    }
  }

  showCompanyDetails(option?) {
    try {
    const sortedList: any[] = _.sortBy(this.companyList, "company_id").reverse();
      for (let i = 0; i < sortedList.length; ++i) {
        // if (this.route.snapshot.paramMap.get("id") == sortedList[i].company_id) {
        if (window.location.href.split("/").pop() == sortedList[i].company_id) {
          this.getSelectedCompany(sortedList[i].company_id, i, option);
          this.selectedIndex = i;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Dashboard", "showCompanyDetails()", err);
    }
  }

  getSelectedCompany(company_id, indx, option?): void {
    const self = this;
    this.isEdit = false;
    this.selectedIndex = indx;
    this.util.showProcessing("processing-spinner");
    try{
    this.http.doGet(`company/${company_id}/detail`, function(
      error: boolean,
      response: any
    ) {
      self.util.hideProcessing("processing-spinner");
      if (error) {
        self.global.addException("Dashboard", "getSelectedCompany()", response);
      } else {
        self.selCompany = response.data;
        self.setDashBoardUrl(company_id);
        if (option == "update") {
           self.updateMessage();

        }
      }
    });
  }  catch (err) {
    this.global.addException("Dashboard", "getSelectedCompany()", err);
  }
  }
 updateMessage() {
  this.util.showDialog(DialogComponent, "Company updated successfully.", []);
  this.util.changeEvent({
    source: "UPDATE_STATUS",
    action: "update",
    data: {}
  });
 }
  setDashBoardUrl(company_id) {
    const self = this;
    if (company_id) {
      this.userCount = 0;
      this.editCompanyDetailsForm();
      this.getUsersList();
      self.location.go(
        self.location
          .path()
          .split("/")
          .splice(0, self.location.path().split("/").length - 1)
          .join("/") +
          "/" + company_id
      );
      setTimeout(function() {
        self.util.scrollDown("compMark");
      }, 1000);
    }
  }
  editCompany(): void {
    this.isEdit = true;
  }

  cancelEdit(): void {
    this.isEdit = false;
  }

  public editCompanyDetailsForm() {
    const mainPhone = this.selCompany ? (this.selCompany.main_phone ? this.selCompany.main_phone.replace(/\D/g, "").slice(-10) : "" ): "";
    this.editAccDetailsFrm = this.fb.group({
      companyId: new FormControl(
        this.selCompany && this.selCompany.company_id
          ? this.selCompany.company_id
          : ""
      ),
      organization: new FormControl(
        this.selCompany && this.selCompany.company_name,
        [Validators.required, Validators.minLength(2), Validators.maxLength(30)]
      ),
      addressLine1: new FormControl(
        this.selCompany && this.selCompany.address_line1,
        [Validators.required]
      ),
      country: new FormControl(this.selCompany && this.selCompany.country_id, [
        Validators.required
      ]),
      postalCode: new FormControl(
        this.selCompany && this.selCompany.postal_code
          ? this.selCompany.postal_code
          : ""
      ),
      price_per_user: new FormControl(
        this.selCompany && this.selCompany.price_per_user,
        [
          // Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30)
        ]
      ),
      currency: new FormControl(this.selCompany && this.selCompany.currency, [
        Validators.required
      ]),
      mainPhone: new FormControl(
        this.selCompany && this.util.maskPhoneNumber(mainPhone),
        [Validators.required, Validators.pattern(this.constant.PHONE_PATTERN)]
      ),
      account_status: new FormControl(
        this.selCompany && this.selCompany.account_status_details.type_id,
        [Validators.required]
      ),
      payment_status: new FormControl(
        this.selCompany && this.selCompany.payment_status_details.type_id,
        [Validators.required]
      ),
      companyLogo: new FormControl(""),
      isLogoDelete: new FormControl(0),
      users: this.fb.array([])
    });
  }

  get users(): FormArray {
    return (<FormArray>this.editAccDetailsFrm.get("users")) as FormArray;
  }

  updateCompanyDetails(form): void {
    const self = this;
    self.submitted = true;
    self.isError = false;
    try {
      if (form.valid) {
        for (let i = 0; i < form.value.users.length; i++) {
          form.value.users[i].mobile_no = self.util.unMaskPhoneNumber(
            form.value.users[i].mobile_no
          );
          if (
            form.value.users[i].isValidEmail === true ||
            form.value.users[i].isValidUserName === true
          ) {
            return;
          }
        }
        form.value.mainPhone = self.util.unMaskPhoneNumber(
          form.value.mainPhone
        );
        const formData: FormData = new FormData();
        formData.append("company_id", form.value.companyId);
        formData.append("company_name", form.value.organization);
        formData.append("address_line1", form.value.addressLine1);
        formData.append("country", form.value.country);
        formData.append("postal_code", form.value.postalCode);
        formData.append("price_per_user", form.value.price_per_user);
        formData.append("currency", form.value.currency);
        formData.append("users", JSON.stringify(form.value.users));
        formData.append("main_phone", form.value.mainPhone);
        formData.append("isLogoDelete", form.value.isLogoDelete);
        // formData.append("companyLogo", form.value.companyLogo);
        formData.append("account_status", form.value.account_status);
        formData.append("payment_status", form.value.payment_status);

        if (parseInt(form.value.account_status, 10) === 4) {
          const urlId =  this.route.snapshot.paramMap.get("id");
          const data: any = {
            API_URL: "company/update",
            reqObj: formData,
            event: {
              source: "DELETE_COMPANY",
              action: "DELETE"
            }
          };
          this.util.showDialog(
            TSADialogComponent,
            "Are you sure you want to delete " +
            this.selCompany.company_name +
              " ?",
            [`su/tsa/dashboard/${urlId}`],
            "Delete Confirmation ?",
            "DELETE_CONFIRMATION",
            data
          );
          return;
        }

        self.util.addSpinner("updateComp", "Update");
        this.file.formDataAPICall(formData, "company/update", function(
          error: boolean,
          response: any
        ) {
          self.util.removeSpinner("updateComp", "Update");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
          } else {
            self.isEdit = false;
            self.getCompanyList("update");
            // "/su/tsa/dashboard/"+form.value.companyId

            // self.dialog.open(EditAccountDialog, { data: { 'action': 'updateSuccess' } });
          }
        });
      }
    } catch (err) {
      this.global.addException("Dashboard", "updateCompanyDetails()", err);
    }
  }

  getUsersList(): void {
    try {
        for (const key of this.selCompany.authorized_users) {
            this.addUser("1", key);
        }
    } catch (err) {
      this.global.addException("Dashboard", "getUsersList()", err);
    }
  }

  removeUser(position, user) {
    this.userCount--;
    user.get("user_id").value === ""
      ? this.users.removeAt(position)
      : user.get("is_delete").setValue("1");
  }

  addUser(option, userData) {
    this.submitted = false;
    const mobile = option == "1" ? (userData.mobile_no ? userData.mobile_no.replace(/\D/g, "").slice(-10) : "") : "";
    try {
      this.users.push(
        this.fb.group({
          user_id: new FormControl(option === "1" ? userData.id : ""),
          name: new FormControl(option === "1" ? userData.first_name : "", [
            Validators.required,
            Validators.maxLength(30)
          ]),
          username: new FormControl(option === "1" ? userData.username : "", [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(30)
          ]),
          designation: new FormControl(
            option === "1" ? userData.user_details.designation : "",
            [
              Validators.required,
              Validators.minLength(2),
              Validators.maxLength(30)
            ]
          ),
          email_id: new FormControl(option === "1" ? userData.email_id : "", [
            Validators.required,
            Validators.pattern(this.constant.EMAIL_PATTERN)
          ]),
          mobile_no: new FormControl(
            option === "1" ? this.util.maskPhoneNumber(mobile) : "",
            [
              Validators.required,
              Validators.pattern(this.constant.PHONE_PATTERN)
            ]
          ),
          isValidEmail: new FormControl(option === "1" ? false : false),
          isValidUserName: new FormControl(option === "1" ? false : false),
          is_delete: new FormControl("0")
        })
      );
      this.userCount++;
    } catch (err) {
      this.global.addException("Dashboard", "addUser()", err);
    }
  }

  resetPassword(username): void {
    this.dialog.open(EmployeeDialog, {
      data: { action: "resetPassword", empUsername: username },
      autoFocus: false
    });
  }

  validateEmail(user) {
    const self = this;
    const reqObj = {
      email: user.get("email_id").value,
      user_id: user.get("user_id").value
    };
    if (user.get("email_id").value !== "") {
      this.global.checkUnique(
        user.get("email_id"),
        "hr/employees/check-availability",
        reqObj,
        function(response) {
          user.get("isValidEmail").setValue(response);
        }
      );
    }
  }

  validateUsername(user) {
    const self = this;
    const reqObj = {
      username: user.get("username").value,
      user_id: user.get("user_id").value
    };
    if (user.get("username").value !== "") {
      this.global.checkUnique(
        user.get("username"),
        "hr/employees/check-availability",
        reqObj,
        function(response) {
          user.get("isValidUserName").setValue(response);
        }
      );
    }
  }
  getPaymentStatus(type) {
    return  this.constant.PAYMENT_STATUS[type];
  }
}
