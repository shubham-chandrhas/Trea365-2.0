import { Component, OnInit, Inject, ViewChild, ElementRef, NgZone } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { MapsAPILoader } from "@agm/core";
import { map, startWith, debounceTime } from "rxjs/operators";
import { Observable, fromEvent } from "rxjs";
import { HttpService } from "../../../../shared/service/http.service";
import { UtilService } from "../../../../shared/service/util.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { FileService } from "../../../../shared/service/file.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
declare var jquery: any;
declare var $: any;
@Component({
  selector: "app-edit-account",
  templateUrl: "./edit-account.component.html",
  styleUrls: ["./edit-account.component.scss"]
})
export class EditAccountComponent implements OnInit {
  editAccDetailsFrm: FormGroup;

  public errMsg: string = "";
  public imgPath: string;
  public isError: boolean = false;
  public submitted: boolean = false;
  public accountDetails;
  public compLogo: File;
  public countries: any = [];
  public stateList: any = [];
  public cityList: any = [];
  public userCount: number = 0;
  public usernameAvailability: boolean = false;
  // public ischeckEmailLoad: boolean = false;


  @ViewChild("search")
  public searchElementRef: ElementRef;
  emailChangeConfirm: boolean = false;

  constructor(
    public util: UtilService,
    private http: HttpService,
    private router: Router,
    private fb: FormBuilder,
    public constant: ConstantsService,
    private route: ActivatedRoute,
    private file: FileService,
    public dialog: MatDialog,
    private global: GlobalService,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.util.menuChange({
      menu: "accountDetails",
      subMenu: ""
    });
    this.accountDetails = JSON.parse(sessionStorage.getItem("accountDetails"));
    this.imgPath = this.accountDetails.company_logo;
    this.editAccDetailsForm();
    if (this.util.getRole() == 2) {
      this.getCountries();
    }
    this.onChanges();

    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source == "EMAIL_CHANGE" && dataObj.data.email_id == "email changed") {
        this.emailChangeConfirm = true;
        //console.log("usersss", this.users);
      } else if (dataObj && dataObj.source == "EMAIL_CHANGE" && dataObj.data.email_id == "email not changed") {
        this.emailChangeConfirm = false;
        let i = dataObj.data.index;
      } else {
        this.emailChangeConfirm = false;
      }
    });
  }

  getCountries() {
    this.util.showProcessing("processing-spinner");
    const self = this;
    this.global.getCountries(function (list) {
      self.util.hideProcessing("processing-spinner");
      self.countries = list;
      self.util.mapInit(
        self.mapsAPILoader,
        self.searchElementRef,
        self.ngZone,
        self.editAccDetailsFrm.get("address"),
        [
          self.editAccDetailsFrm.get("country"),
          self.editAccDetailsFrm.get("provinence"),
          self.editAccDetailsFrm.get("city"),
          self.editAccDetailsFrm.get("postalCode"),
          {
            countries: self.countries
          },
          self.editAccDetailsFrm.get("latitude"),
          self.editAccDetailsFrm.get("longitude")
        ]
      );
    });
  }
  onChanges(): void {
    this.editAccDetailsFrm.get("country").valueChanges.subscribe(selCountry => {
      if (selCountry != "") {
        for (let i = 0; i < this.countries.length; i++) {
          if (this.countries[i].country_id == selCountry) {
            this.editAccDetailsFrm
              .get("currency")
              .setValue(this.countries[i].currency);
            break;
          }
        }
      }
    });
    //  const email_id = document.getElementById("email_id");
    // const valuechanged = fromEvent(email_id, "keyup").map((x: any) => x.currentTarget.value);
    // valuechanged.pipe(debounceTime(1000)).subscribe(searchString => {
    //   this.validateEmail(searchString);
    // });
  }

  public editAccDetailsForm() {
    const mainPhone = this.accountDetails.main_phone ? this.accountDetails.main_phone.replace(/\D/g, "").slice(-10) : "";

    this.editAccDetailsFrm = this.fb.group({
      companyId: new FormControl(this.accountDetails.company_id),
      organization: new FormControl(this.accountDetails.company_name, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60)
      ]),
      address: new FormControl(this.accountDetails.address_line1, [
        Validators.required
      ]),
      addressLine2: new FormControl(this.accountDetails.address_line2),
      country: new FormControl(this.accountDetails.country_id, [
        Validators.required
      ]),
      postalCode: new FormControl(
        this.accountDetails.postal_code ? this.accountDetails.postal_code : ""
      ),
      currency: new FormControl(this.accountDetails.currency, [
        Validators.required
      ]),
      busiStructure: new FormControl(this.accountDetails.business_structure, [
        Validators.required
      ]),
      mainPhone: new FormControl(this.util.maskPhoneNumber(mainPhone), [
        Validators.required,
        Validators.pattern(this.constant.PHONE_PATTERN)
      ]),
      latitude: new FormControl(""),
      longitude: new FormControl(""),
      users: this.fb.array([])
    });

    for (let i = 0; i < this.accountDetails.authorized_users.length; i++) {
      this.addUser("1", this.accountDetails.authorized_users[i]);
    }
  }

  get organization() {
    return this.editAccDetailsFrm.get("organization");
  }
  get address() {
    return this.editAccDetailsFrm.get("address");
  }
  get addressLine2() {
    return this.editAccDetailsFrm.get("addressLine2");
  }
  get country() {
    return this.editAccDetailsFrm.get("country");
  }
  get provinence() {
    return this.editAccDetailsFrm.get("provinence");
  }
  get city() {
    return this.editAccDetailsFrm.get("city");
  }
  get postalCode() {
    return this.editAccDetailsFrm.get("postalCode");
  }
  get currency() {
    return this.editAccDetailsFrm.get("currency");
  }
  get busiStructure() {
    return this.editAccDetailsFrm.get("busiStructure");
  }
  get mainPhone() {
    return this.editAccDetailsFrm.get("mainPhone");
  }
  get users(): FormArray {
    return ( < FormArray > this.editAccDetailsFrm.get("users")) as FormArray;
  }

  onFileChange(event) {
    const self = this;
    const reader = new FileReader();
    try {
      if (event.target.files && event.target.files.length > 0) {
        const typeOfFile = event.target.files[0].type.split("/");
        if (
          typeOfFile[0] === "image" &&
          (typeOfFile[1] === "png" ||
            typeOfFile[1] === "jpg" ||
            typeOfFile[1] === "jpeg" ||
            typeOfFile[1] === "gif")
        ) {
          if (event.target.files[0].size / 1048576 < 10) {
            const file = event.target.files[0];
            self.compLogo = file;
            reader.readAsDataURL(file);
            reader.onload = (fileLoadedEvent: any) => {
              this.imgPath = fileLoadedEvent.target.result;
            };
            self.isError = false;
          } else {
            self.errMsg = "File must be less than 10 MB.";
            self.isError = true;
          }
        } else {
          self.errMsg = "Allowed file types png, jpg and gif.";
          self.isError = true;
        }
      }
    } catch (err) {
      this.global.addException("Edit Account", "onFileChange()", err);
    }
  }
  removeLogo() {
    this.imgPath = null;
    this.compLogo = null;
  }

  removeUser(position, user) {
    this.userCount--;
    user.get("user_id").value == "" ?
      this.users.removeAt(position) :
      user.get("is_delete").setValue("1");
  }
  addUser(option, userData) {
    this.submitted = false;
    const mobile = option == "1" ? userData.mobile_no.replace(/\D/g, "").slice(-10) : "";
    try {
      this.users.push(
        this.fb.group({
          user_id: new FormControl(option == "1" ? userData.id : ""),
          name: new FormControl(option == "1" ? userData.first_name : "", [
            Validators.required,
            Validators.maxLength(30)
          ]),
          username: new FormControl(option == "1" ? userData.username : "", [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(30)
          ]),
          designation: new FormControl(
            option == "1" ? userData.user_details ? userData.user_details.designation : "" : "",
            [
              Validators.minLength(2),
              Validators.maxLength(30)
            ]
          ),
          email_id: new FormControl(option == "1" ? userData.email_id : "", [
            Validators.required,
            Validators.pattern(this.constant.EMAIL_PATTERN)
          ]),
          ischeckEmailLoad: new FormControl(false),
          mobile_no: new FormControl(
            option == "1" ? this.util.maskPhoneNumber(mobile) : "",
            [
              Validators.required,
              Validators.pattern(this.constant.PHONE_PATTERN)
            ]
          ),
          employee_id: new FormControl(
            "", []
          ),
          isValidEmail: new FormControl(option == "1" ? false : false),
          isValidUserName: new FormControl(option == "1" ? false : false),
          is_delete: new FormControl("0")
        })
      );
      this.userCount++;
    } catch (err) {
      this.global.addException("Edit account", "addUser()", err);
    }
  }

  updateAccDetails(form: FormGroup) {
    const self = this;
    this.errMsg = "";
    this.isError = false;
    this.submitted = true;
    try {
      if (form.valid) {
        form.value.mainPhone = self.util.unMaskPhoneNumber(
          form.value.mainPhone
        );
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
          if (this.emailChangeConfirm === true) {
            this.users.value[i].email_id = this.users.value[i].email_id;
          } else {
            // Commented by subodh error occured with this condition
            // this.users.value[i].email_id = self.accountDetails.authorized_users[i].email_id;
            this.users.value[i].email_id = this.users.value[i].email_id;

          }
        }
        const formData: FormData = new FormData();
        formData.append("company_id", form.value.companyId);
        formData.append("company_name", form.value.organization);
        formData.append("address_line1", form.value.address);
        formData.append("address_line2", form.value.addressLine2);
        formData.append("country", form.value.country);
        formData.append("postal_code", form.value.postalCode);
        formData.append("price_per_user", self.accountDetails.price_per_user);
        formData.append("currency", form.value.currency);
        formData.append("users", JSON.stringify(form.value.users));
        formData.append("main_phone", form.value.mainPhone);
        formData.append("latitude", form.value.latitude);
        formData.append("longitude", form.value.longitude);
        formData.append(
          "isLogoDelete",
          self.compLogo == null && self.imgPath == null ? "1" : "0"
        );
        self.compLogo ? formData.append("companyLogo", self.compLogo) : "";
        self.util.addSpinner("edit-acc-btn", "Update");
        this.file.formDataAPICall(formData, "company/update", function (
          error: boolean,
          response: any
        ) {
          self.util.removeSpinner("edit-acc-btn", "Update");
          if (error) {
            self.isError = true;
            self.errMsg = response.message;
            self.global.addException("Edit Account", "updateAccDetails()", response);
          } else {
            self.dialog.open(EditAccountDialog, {
              data: {
                action: "updateSuccess"
              }
            });
            self.util.setCompanyLogo(response.data.logo);
          }
        });
      }
    } catch (err) {
      this.global.addException("Edit Account", "updateAccDetails()", err);
    }
  }

  getIndex(index) {
    let count = 1;
    for (let i = 0; i < index; i++) {
      if (this.users.at(i).get("is_delete").value == "0") {
        count++;
      }
    }
    return count;
  }

  validateEmail(user, index ? ) {
    try {
      user.get("ischeckEmailLoad").setValue(true);
      this.util.addSpinner("edit-acc-btn", "Update");
      const reqObj = {
        email: user.get("email_id").value,
        user_id: user.get("user_id").value
      };
      if (user.get("email_id").value != "") {
        this.global.checkUnique(
          user.get("email_id"),
          "hr/employees/check-availability",
          reqObj, (response: any) => {
            user.get("ischeckEmailLoad").setValue(false);
            this.util.removeSpinner("edit-acc-btn", "Update");
              user.get("isValidEmail").setValue(response);
              !response ? this.openDialogConfirm(index) : "";
          }
        );
      }
    } catch (err) {
      this.global.addException("Edit Account", "validateEmail()", err);
    }
  }
  openDialogConfirm(index) {
    if (index != 0) { // conditon Applied by Subodh
      return;
    }
    let self = this;
    let data: any = {
      // API_URL: "schedule/delete",

      event: {
        source: "CONFIRM_CHANGE_EMAIL",
        action: "EMAIL",
        data: index
      }
    };
    self.util.showDialog(
      DialogComponent,
      `Are you sure you want to change your email address?
      This will remove your current email ID and register you as a new user with your new email ID`,
      [],
      "Email Change ",
      "CONFIRMATION_EMAIL",
      data
    );
  }
  validateUsername(user) {
    let self = this;
    var reqObj = {
      username: user.get("username").value,
      user_id: user.get("user_id").value
    };
    if (user.get("username").value != "") {
      this.global.checkUnique(
        user.get("username"),
        "hr/employees/check-availability",
        reqObj,
        function (response) {
          user.get("isValidUserName").setValue(response);
        }
      );
    }
  }
}

@Component({
  selector: "",
  templateUrl: "./edit-account-dialog.html",
  styleUrls: ["./edit-account.component.scss"]
})
export class EditAccountDialog {
  public action: string;
  constructor(
    public dialogRef: MatDialogRef < EditAccountDialog > ,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
    private router: Router
  ) {
    this.action = dataObj.action;
  }

  closeDialog(): void {
    this.dialogRef.close();
    this.router.navigate(["/csa-onboarding/account-details"]);
  }
}
