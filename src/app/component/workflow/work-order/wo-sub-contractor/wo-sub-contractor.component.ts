import { Component, OnInit, ApplicationRef } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";

import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
  NgForm,
  AbstractControl
} from "@angular/forms";
import { Observable ,  ObservableInput } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";

import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { WorkOrderService } from "../work-order.service";

@Component({
  selector: "app-wo-sub-contractor",
  templateUrl: "./wo-sub-contractor.component.html",
  styleUrls: ["./wo-sub-contractor.component.scss"]
})
export class WoSubContractorComponent implements OnInit {
  public userInfo: any;
  public selectedQuotation: any = {};
  public woSubContractorForm: FormGroup;
  public supplierList: any[] = [];
  filteredContractors: Observable<string[]>;
  public servicesList: any[] = [];
  filteredservices: Observable<string[]>;
  public repeatList: any[] = [];
  filteredScheduleRepeat: Observable<string[]>;
  public submitted = false;
  public minDate = new Date();
  public totalPayErr = false;
  public errMsg = "";
  public isError = false;
  public isBack = false;
  public isEdit = false;
  public is_after = false;
  public newWO = false;
  public pageVariables: any = {
    costOfOrder: 0,
    subTotal: 0,
    taxes: 0,
    totalCost: 0,
    totalPaymentAmount: 0
  };
  public scheduleType = "once";
  public today: number = Date.now();
  public pageData: any;
  backupServicesList: any[] = [];

  public WOSubContractorObj: any = {};
  autoNumber: number;
  public settings: any;
  public default_tax_rate: any;
  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    public util: UtilService,
    public constant: ConstantsService,
    private global: GlobalService,
    private http: HttpService,
    private router: Router,
    private ref: ApplicationRef,
    public WOService: WorkOrderService,
    public route: ActivatedRoute
  ) {
    if (localStorage.getItem("USER")) {
      this.userInfo = JSON.parse(atob(localStorage.getItem("USER")));
    }
    if (localStorage.getItem("CREATE_WO")) {
      this.WOSubContractorObj = JSON.parse(localStorage.getItem("CREATE_WO"));
      if (this.WOSubContractorObj.WO_TYPE == "Internal Contractor") {
         console.log("this.WOSubContractorObj :: ",this.WOSubContractorObj); 
        this.selectedQuotation.client_name = "Internal Work";
        this.selectedQuotation.client_work_location = this.WOSubContractorObj.repairInfo.client_work_location;
        this.selectedQuotation.client_work_location_id = this.WOSubContractorObj.repairInfo.location_id;
        
      } else if (this.WOSubContractorObj.WO_TYPE == "External Contractor") {
        this.selectedQuotation = JSON.parse(
          sessionStorage.getItem("woSetupData")
        );
        console.log(this.selectedQuotation);
        this.newWO = true;
      }
    }
  }
  ngOnInit() {
    this.util.menuChange({ menu: 4, subMenu: 26 });
    this.util.setPageTitle(this.route);
    this.util.setWindowHeight();
    this.util.showProcessing("processing-spinner");
    this.getContractorList();
    this.getservicesList();
    this.WOSubContractorForm("0");
    this.autoNumber = this.util.getUniqueString();
    this.setDefaultTaxRate();
  }

  // Set Tax Rate
  setDefaultTaxRate() {
    this.settings = JSON.parse(atob(localStorage.getItem("USER"))).settings;
    // // console.log(JSON.parse(atob(localStorage.getItem("USER"))).settings);
    for (let index = 0; index < this.settings.length; index++) {
      if (this.settings[index].setting_key == "tax_rate") {
        this.default_tax_rate = this.settings[index].setting_value;
      }
    }
  }

  getContractorEdit() {
    const self = this;
    if (sessionStorage.getItem("WO_EDIT")) {
      const editObj: any = JSON.parse(sessionStorage.getItem("WO_EDIT"));
      console.log("WO_EDIT", JSON.stringify(editObj));
      this.isEdit = true;
        self.selectedQuotation.client_name = editObj.client_name;
        self.selectedQuotation.client_id = editObj.client_id;
        self.selectedQuotation.client_work_location = editObj.client_work_location
        ? editObj.client_work_location
        : self.constant.N_A;
        self.selectedQuotation.email_id = editObj.email_id;
        self.selectedQuotation.phone_no = editObj.phone_no;
        self.selectedQuotation.assign_to = editObj.assign_to;
        self.selectedQuotation.supplier_id = editObj.supplier_id;
        self.selectedQuotation.supplier_name = editObj.supplier_name;
        self.selectedQuotation.schedules = editObj.schedule;
        self.selectedQuotation.schedules ? self.selectedQuotation.schedules.schedule_type  = 1 : "";
        self.selectedQuotation.services = editObj.services;
        self.selectedQuotation.is_delete = 0;
        self.selectedQuotation.payment_schedules = editObj.payment_schedule;


        if (editObj.maintenance_request) {
          self.WOSubContractorObj.assetsDetails =
            editObj.maintenance_request;
          
        } 
      // self.selectedQuotation.supplier_name = editObj.supplier_name;
      self.selectedQuotation.work_order_id = editObj.work_order_id;
      self.selectedQuotation.project_estimate_id = editObj.project_estimate_id;
      self.selectedQuotation.work_order_type = editObj.work_order_type;
      self.selectedQuotation.work_order_date = editObj.work_order_date;
      self.selectedQuotation.work_order_no = editObj.work_order_no;

      self.selectedQuotation.work_location_id = editObj.work_location_id;
      self.selectedQuotation.client_work_location_id = editObj.work_location_id;

      self.selectedQuotation.cost_of_services = editObj.cost_of_services;
      self.selectedQuotation.shipping_handling = editObj.shipping_and_handling;
      self.selectedQuotation.adjustment = editObj.adjustment;
      self.selectedQuotation.sub_total = editObj.subtotal;
      self.selectedQuotation.taxes = editObj.taxes;
      self.selectedQuotation.total_cost = editObj.total_cost;
      self.selectedQuotation.require_client_sign = editObj.require_client_sign;
      self.selectedQuotation.status = editObj.status;
      // self.selectedQuotation.asset_details =
      //   editObj.order_type.type_id == 1 ? editObj.details : "";
      self.selectedQuotation.generated_by = editObj.wo_genrated_by;

      self.WOSubContractorObj.WO_TYPE = editObj.work_order_type == 'Internal' ? "Internal Contractor" : "External Contractor";

      self.WOSubContractorObj.client_work_location = editObj.client_work_location;

      // console.log("selectedQuotation", self.selectedQuotation);
      this.WOSubContractorForm("1", self.selectedQuotation);
      // this.WOSubContractorForm('0');
    } else if (sessionStorage.getItem("WO_CONTRACTOR_DETAILS")) {
      this.selectedQuotation =
        sessionStorage.getItem("WO_CONTRACTOR_DETAILS");
      this.selectedQuotation = JSON.parse(this.selectedQuotation);
       console.log("selectedQuotation", self.selectedQuotation);
      this.selectedQuotation.schedules = this.selectedQuotation.schedules[0];
      this.scheduleType = "1";
      this.WOSubContractorObj.WO_TYPE =
        this.selectedQuotation.work_order_type == 2
          ? "External Contractor"
          : "Internal Contractor";
      this.WOSubContractorObj.assetsDetails = this.selectedQuotation.assetsDetails;
      self.selectedQuotation.client_work_location_id = this.selectedQuotation.work_location_id;
      // console.log("Page Data", this.selectedQuotation);
      this.isEdit = this.selectedQuotation.work_order_id ? true : false;
      this.isBack = this.selectedQuotation.work_order_id ? false : true;
      this.WOSubContractorForm("1", this.selectedQuotation);
    } else if (this.WOSubContractorObj.WO_TYPE == "External Contractor") {
      this.WOSubContractorForm("1", this.selectedQuotation);
    } else {
      this.WOSubContractorForm("0");
    }
    // console.log("this.selectedQuotation", this.selectedQuotation);
  }

  // Get Contractors From Suppliers List
  getContractorList() {
    const self = this;
    try {
      this.http.doGet("admin/suppliers/dropdown", function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          // console.log("error", response);
        } else {
          if (response.data) {
            self.supplierList = [];
            self.supplierList = response.data;
            // console.log("supplierList", self.supplierList);
                self.filteredContractors = self.woSubContractorForm
                .get("supplier_name")
                .valueChanges.pipe(
                startWith(""),
                map(value => self.contractorFilter(value))
                );
            }
        }
      });
    } catch (err) {
      this.global.addException("wo-sub-contractor", "getContractorList()", err);
    }
  }
  private contractorFilter(value: string): string[] {
    return this.supplierList.filter(option =>
      option.supplier_name
        .toLowerCase()
        .includes(value ? value.toLowerCase() : "")
    );
  }
  getSelectedContractor(contractor, event: any = false): void {
    if (event.isUserInput) {
      this.woSubContractorForm
        .get("supplier_id")
        .setValue(contractor.supplier_id);
    }
  }
  public validateContractor(event: any) {
    try {
      const contractor = event.target.value;
      if (contractor == "") {
        this.woSubContractorForm.get("supplier_id").setValue("");
        return;
      }
      const match = this.supplierList.filter(
        item => item.supplier_name.toLowerCase() == contractor.toLowerCase()
      );
      if (match.length > 0) {
        this.woSubContractorForm
          .get("supplier_id")
          .setValue(match[0].supplier_id);
        this.woSubContractorForm
          .get("supplier_name")
          .setValue(match[0].supplier_name);
      } else {
        this.woSubContractorForm.get("supplier_id").setValue("");
      }
    } catch (err) {
      this.global.addException(
        "wo-sub-contractor",
        "validateContractor()",
        err
      );
    }
  }

  // Get Service Definition List
  getservicesList() {
    const self = this;
    try {
      this.http.doGet("service-type/dropdown", function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.global.addException("wo-sub-contractor", "getservicesList()", response);
        } else {
          if (response.data) {
            self.servicesList = [];
            self.servicesList = response.data;
            self.backupServicesList = JSON.parse(
              JSON.stringify(self.servicesList)
            );
            self.services.at(0)
              ? self.services
                  .at(0)
                  .get("filteredService")
                  .setValue(
                    self.services
                      .at(0)
                      .get("service_definition")
                      .valueChanges.pipe(
                        startWith(""),
                        map(value => self.serviceFilter(value))
                      )
                  )
              : "";
            self.getContractorEdit();
          }
        }
      });
    } catch (err) {
      this.global.addException("wo-sub-contractor", "getservicesList()", err);
    }
  }
  private serviceFilter(value: string): string[] {
    return this.servicesList.filter(option => option.service_definition.toLowerCase().includes(value ? value.toLowerCase() : ''));
  }

  getSelectedService(service, event: any = false, index): void {
    try {
      if (event.isUserInput) {
        this.services
          .at(index)
          .get("service_definition_id")
          .setValue(service.service_definition_id);
        this.services.at(index).get("details").setValue(service.description);
        const totalAmt =
          this.services.at(index).get("cost").value *
          this.services.at(index).get("quantity").value;
        this.services
          .at(index)
          .get("total_amount")
          .setValue(totalAmt);
        this.addValidation(this.services, index);
        this.removeServiceFormList(
          service.service_definition_id,
          "service_definition_id",
          this.servicesList
        );
      }
    } catch (err) {
      this.global.addException(
        "wo-sub-contractor",
        "getSelectedService()",
        err
      );
    }
  }
  public validateService(event: any, item: any, index) {
    const service = event.target.value;

    try {
      if (service == "") {
        const checkOccurance = this.servicesList.filter(
          listItem =>
            listItem.service_definition_id ==
            item.get("service_definition_id").value
        );
        item.get("service_definition_id").value !== "" &&
        checkOccurance.length == 0
          ? this.backupServicesList.filter(
              listItem =>
                listItem.service_definition_id ==
                item.get("service_definition_id").value
            )[0]
            ? this.servicesList.push(
                this.backupServicesList.filter(
                  listItem =>
                    listItem.service_definition_id ==
                    item.get("service_definition_id").value
                )[0]
              )
            : ""
          : "";
        // console.log(this.servicesList);
        item.get("service_definition_id").setValue("");
        for (let i = 0; i < this.services.length; i++) {
          this.services.at(i).get("service_definition_id").value == ""
            ? this.setObservable(i)
            : "";
        }
        return;
      }
      this.addValidation(this.services, index);
      const match = this.servicesList.filter(items => items.service_definition.toLowerCase() == service.toLowerCase()
      );
      if (match.length > 0) {
        item
          .get("service_definition_id")
          .setValue(match[0].service_definition_id);
        item.get("service_definition").setValue(match[0].service_definition);
        item.get("details").setValue(match[0].description);
        this.removeServiceFormList(
          item.get("service_definition_id").value,
          "service_definition_id",
          this.servicesList
        );
      } else {
        if (item.get("service_definition_id").value != "") {
          const serviceName = this.backupServicesList.filter(
            listItem =>
              listItem.service_definition_id ==
              item.get("service_definition_id").value
          )[0].service_definition;
          if (serviceName.toLowerCase() != service.toLowerCase()) {
            const checkOccurance = this.servicesList.filter(
              listItem =>
                listItem.service_definition_id ==
                item.get("service_definition_id").value
            );
            checkOccurance.length == 0
              ? this.servicesList.push(
                  this.backupServicesList.filter(
                    listItem =>
                      listItem.service_definition_id ==
                      item.get("service_definition_id").value
                  )[0]
                )
              : "";
            item.get("service_definition_id").setValue("");
          }
        }
      }
    } catch (err) {
      this.global.addException("wo-sub-contractor", "validateService()", err);
    }
  }

  addValidation(control, index) {
    control
      .at(index)
      .get("cost")
      .setValidators([
        Validators.required,
        Validators.pattern(this.constant.AMOUNT_PATTERN)
      ]);
    control
      .at(index)
      .get("quantity")
      .setValidators([
        Validators.required,
        Validators.pattern(this.constant.AMOUNT_PATTERN)
      ]);
    control
      .at(index)
      .get("cost")
      .updateValueAndValidity();
    control
      .at(index)
      .get("quantity")
      .updateValueAndValidity();
  }

  removeServiceFormList = (id, key, list) => {
    this.servicesList = list.filter(item => item[key] != id);
    for (let i = 0; i < this.services.length; i++) {
      this.services.at(i).get("service_definition_id").value == ""
        ? this.setObservable(i)
        : "";
    }
  };

  addServiceToList = (id, key, list, backupList) => {
    list.push(backupList.filter(item => item[key] == id)[0]);
    for (let i = 0; i < this.services.length; i++) {
      this.services.at(i).get("service_definition_id").value == ""
        ? this.setObservable(i)
        : "";
    }
  };

  calculateTotal(event: any, item: any, index) {
    const service = event.target.value;
    try {
      if (service == "") {
        item.get("total_amount").setValue(0);
      } else {
          if (item.get("cost").value !== "") {
          const totalAmt =
            parseFloat(item.get("cost").value) *
            parseFloat(item.get("quantity").value);
          item.get("total_amount").setValue(totalAmt);
        }
      }
      this.util.removeCommas(item.get("cost"));
      this.calculateTotalServicesAmount();
    } catch (err) {
      this.global.addException("wo-sub-contractor", "calculateTotal()", err);
    }
  }

  clearService(service, amount) {
    try {
      this.woSubContractorForm
        .get("services_amount")
        .setValue(
          this.woSubContractorForm.get("services_amount").value > amount
            ? this.woSubContractorForm.get("services_amount").value - amount
            : 0
        );
      service.get("service_definition_id").value !== ""
        ? this.addServiceToList(
            service.get("service_definition_id").value,
            "service_definition_id",
            this.servicesList,
            this.backupServicesList
          )
        : "";
    } catch (err) {
      this.global.addException("Clear Service", "clearService()", err);
    }
  }

  calculateTotalServicesAmount() {
    try {
      let totalServiceAmt = 0;
      for (let i = 0; i < this.services.length; i++) {
        totalServiceAmt =
          totalServiceAmt +
          parseFloat(this.services.at(i).get("total_amount").value);
      }
      this.woSubContractorForm.get("services_amount").setValue(totalServiceAmt);
      this.costs
        .at(0)
        .get("cost_of_services")
        .setValue(totalServiceAmt);
        this.calculatePymTotal();
      //this.calculateSubTotal();
    } catch (err) {
      this.global.addException(
        "wo-sub-contractor",
        "calculateTotalServicesAmount()",
        err
      );
    }
  }
  startDateChange(event, index) {
    this.schedules
      .at(index)
      .get("end_date")
      .setValue("");
  }


  changeOccrence(type) {
    this.is_after = false;
    if (type == "after") {
      this.is_after = true;
    }

    this.schedules
      .at(0)
      .get("end_after_occurences")
      .setValue("");
    this.schedules
      .at(0)
      .get("end_date")
      .setValue("");
  }

  WOSubContractorForm(option, data: any = {}) {
    // console.log("form", option, data);
    this.woSubContractorForm = this.fb.group({
      work_order_id: new FormControl(
        option == "0" ? "" : data.work_order_id ? data.work_order_id : ""
      ),
      supplier_id: new FormControl(
        option == "0" ? "" : data.supplier_id ? data.supplier_id : "",
        [Validators.required]
      ),
      supplier_name: new FormControl(
        option == "0" ? "" : data.supplier_name ? data.supplier_name : "",
        [Validators.required]
      ),
      services_amount: new FormControl(
        option == "1" ? data.services_amount : 0,
        []
      ),
      schedules: this.fb.array([]),
      services: this.fb.array([]),
      costs: this.fb.array([]),
      payment_schedules: this.fb.array([]),
      requirements: new FormControl(option == "0" ? "" : data.requirements)
    });
    if (option == "1") {

        if (!this.isEdit) {
          if (data.services.length > 0) {
          for (let i = 0; i < data.services.length; i++) {
            if (parseFloat(data.services[i].quantity) > 0) {
              this.addServices(option, data.services[i]);
              this.removeServiceFormList(
                data.services[i].service_definition_id,
                "service_definition_id",
                this.servicesList
              );
            }
          }
        } else {
          this.addServices(option, {});
        }
      } else {
        for (let i = 0; i < data.services.length; i++) {
          this.addServices(option, data.services[i]);
          this.removeServiceFormList(
            data.services[i].service_definition_id,
            "service_definition_id",
            this.servicesList
          );
        }

      }
      if (!this.newWO || (this.newWO && this.isBack)) {
        for (let j = 0; j < data.payment_schedules.length; j++) {
          this.addPaymentSchedule(option, data.payment_schedules[j]);
        }
      } else {
        // this.addPaymentSchedule(0);
      }

      data.schedules ? data.schedules["schedule_type"] = 1 : ""; // This is for schedule onces/future remove this while implement recurring
      this.addScheduleItem(option, data.schedules ? data.schedules : {});
      this.addCosts(option, data);
      // this.woSubContractorForm.patchValue(data);
    } else {
      this.addScheduleItem(option);
      this.isEdit ? "" : this.addServices(option);
      this.addCosts(option);
      this.addPaymentSchedule(option);

      if (
        this.WOSubContractorObj.WO_TYPE == "Internal Contractor" &&
        this.WOSubContractorObj.assetsDetails
      ) {
        this.requirements.setValue(
          this.WOSubContractorObj.assetsDetails.requirements
        );
      }
    }
  }
  get supplier_id() {
    return this.woSubContractorForm.get("supplier_id");
  }
  get supplier_name() {
    return this.woSubContractorForm.get("supplier_name");
  }
  get requirements() {
    return this.woSubContractorForm.get("requirements");
  }

  get schedules(): FormArray {
    return (<FormArray>this.woSubContractorForm.get("schedules")) as FormArray;
  }
  get services(): FormArray {
    return (<FormArray>this.woSubContractorForm.get("services")) as FormArray;
  }
  get costs(): FormArray {
    return (<FormArray>this.woSubContractorForm.get("costs")) as FormArray;
  }
  get payment_schedules(): FormArray {
    return (<FormArray>(
      this.woSubContractorForm.get("payment_schedules")
    )) as FormArray;
  }

  getDaysOff(index): FormArray {
    return <FormArray>this.schedules.at(index).get("days_off");
  }

  addScheduleItem(option, formVal: any = {}) {
    // console.log("schedules", formVal);
    this.minDate =
      option == "0"
        ? new Date()
        : formVal && formVal.start_date
        ? this.checkPastDate(formVal.start_date)
        : new Date();
    this.schedules.push(
      this.fb.group({
        scheduling_id: new FormControl(
          option == "1"
            ? formVal && formVal.scheduling_id
              ? formVal.scheduling_id
              : ""
            : ""
        ),
        start_date: new FormControl(
          option == "0"
            ? ''
            : formVal
            ? formVal.start_date ? this.util.getTimeZoneDate(formVal.start_date) : ""
            : '',
          [Validators.required]
        ), // Only for review
        end_date: new FormControl(
          option == "0"
            ? ''
            : formVal
            ? formVal.end_date ? this.util.getTimeZoneDate(formVal.end_date) : ''
            : '',
          [Validators.required]
        ),
        start_time: new FormControl(
          option == "0"
            ? ""
            : formVal && formVal.start_time
            ? formVal.start_time.substring(0, 5)
            : "",
          [Validators.required, Validators.pattern(this.constant.TIME_PATTERN)]
        ), // Only for review
        start_time_format: new FormControl(
          option == "0" ? "am" : formVal && formVal.start_time_format ? formVal.start_time_format.toLowerCase() : "am",
          [Validators.required]
        ),
        end_time: new FormControl(
          option == "0"
            ? ""
            : formVal && formVal.end_time
            ? formVal.end_time.substring(0, 5)
            : "",
          [Validators.required, Validators.pattern(this.constant.TIME_PATTERN)]
        ),
        end_time_format: new FormControl(
          option == "0" ? "am" : formVal && formVal.end_time_format ? formVal.end_time_format.toLowerCase() : "am",
          [Validators.required]
        ),
        schedule_type: new FormControl("1")
      })
    );
  }

  checkPastDate(scheduleDate): Date {
    const today = new Date().getTime();
    const sDate = new Date(scheduleDate).getTime();
    if (today <= sDate) {
      return new Date();
    } else {
      return new Date(scheduleDate);
    }
  }
  // this.cvForm.get("lines") as FormArray;
  // linesFormArray.push(this.line);
  addServices(option, data: any = {}) {
    try {
      this.services.push(
        this.fb.group({
          wo_service_id: new FormControl(
            option == "1" ? data.wo_service_id ? data.wo_service_id : "" : ""),
          service_definition: new FormControl(option == "1" ? (data.service_definition ?
             data.service_definition : "") : "", [Validators.required]),
          service_definition_id: new FormControl(option == "1" ? (data.service_definition_id ? data.service_definition_id : "" ) : ""),
          ad_hoc_service: new FormControl(option == "1" ? (data.ad_hoc_service ? data.ad_hoc_service : "") : ""),
          cost: new FormControl(option == "1" ? (this.isBack || this.isEdit ? (data.cost ? data.cost : "")
          : (data.cost ? data.cost : "")) : "", [
              Validators.required,
              Validators.pattern(this.constant.AMOUNT_PATTERN)
            ]
          ),
          quantity: new FormControl(option == "1" ? data.quantity ? data.quantity : "" : "", [
            Validators.required,
            Validators.pattern(this.constant.AMOUNT_PATTERN)
          ]),
          total_amount: new FormControl(option == "1"
          ? this.isBack || this.isEdit
            ? data.total_amount ? data.total_amount : ""
            : 0 : 0 ),
          details: new FormControl(option == "1" ? data.details ? data.details : "" : ""),
          filteredService: new FormControl(new Observable<string[]>()),
          is_delete: new FormControl(0)
        })
      );
      this.setObservable(this.services.length - 1);
    } catch (err) {
      this.global.addException("WO Subcontractor", "addServices()", err);
    }
  }
  setObservable(index): void {
    this.services.at(index).get('filteredService').setValue(this.services.at(index).get('service_definition').valueChanges.pipe(startWith(''),map(value => this.serviceFilter(value))));
  }

  removeService(position, service): void {
    service.get("service_definition_id").value !== ""
      ? this.addServiceToList(
          service.get("service_definition_id").value,
          "service_definition_id",
          this.servicesList,
          this.backupServicesList
        )
      : "";

    this.services.removeAt(position);
    service.get("wo_service_id").value != ""
      ? this.WOService.deletedService.push(service.get("wo_service_id").value)
      : "";
    this.calculateTotalServicesAmount();
  }
  addCosts(option, data: any = {}) {
    try {
      this.costs.push(
        this.fb.group({
          cost_of_services: new FormControl(
            option == "1" ? (data.cost_of_services ? data.cost_of_services : this.calServiceCost())  : 0
          ),
          sub_total: new FormControl(option == "1" ? data.sub_total : 0),
          total_cost: new FormControl(option == "1" ? data.total_cost : 0),
          tax_amount: new FormControl(option == "1" ? data.tax_amount ? data.tax_amount : 0 : 0 ),
          shipping_handling: new FormControl(
            option == "1"
              ? this.newWO && !this.isBack
                ? ""
                : data.shipping_handling
              : "",
            [Validators.pattern(this.constant.AMOUNT_PATTERN)]
          ),
          adjustment: new FormControl(
            option == "1"
              ? this.newWO && !this.isBack
                ? ""
                : data.adjustment
              : "",
            [Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)]
          ),
          taxes: new FormControl(
            option == "1"
              ? this.newWO && !this.isBack
                ? this.default_tax_rate
                : data.taxes
              : this.default_tax_rate,
            [
              Validators.min(0),
              Validators.pattern(this.constant.AMOUNT_PATTERN)
            ]
          )
        })
      );

      if (option == "1") {
        this.calculateTotalServicesAmount();
      }
      this.calculatePymTotal();
      //this.calculateSubTotal();
    } catch (err) {
      this.global.addException("WO Subcontractor", "addCosts()", err);
    }
  }

  async calServiceCost() {
    let total = 0;
     await this.services.controls.map((item, i) => {
     const totalAmount  =  this.services.at(i).get("total_amount").setValue(parseFloat(item.get("quantity").value)
      * parseFloat(item.get("cost").value));
        total += parseFloat(this.services.at(i).get("total_amount").value);
    });

    // return await total;
  }
  addPaymentSchedule(option, data: any = {}) {
    try {
      this.payment_schedules.push(
        this.fb.group({
          wo_payment_schedule_id: new FormControl(
            option == "1"
              ? data.wo_payment_schedule_id
                ? data.wo_payment_schedule_id
                : ""
              : ""
          ),
          pe_payment_schedule_id: new FormControl(""),
          date: new FormControl(
            option == "1" ? data.date ? this.util.getTimeZoneDate(data.date) : "" : "",
            [Validators.required]
          ),
          amount: new FormControl(option == "1" ? data.amount : "", [
            Validators.required,Validators.pattern(this.constant.AMOUNT_PATTERN)
          ]),
          is_delete: new FormControl(0)
        })
      );
    } catch (err) {
      this.global.addException("WO Subcontractor", "addPaymentSchedule()", err);
    }
  }
  removePaySchedule(position, item) {
    try {
      // deletedPaySchedule
      item.get("wo_payment_schedule_id").value !== ""
        ? this.WOService.deletedPaySchedule.push(
            item.get("wo_payment_schedule_id").value
          )
        : "";
      this.payment_schedules.removeAt(position);
      this.calculatePaymentAmount();
    } catch (err) {
      this.global.addException("WO Subcontractor", "removePaySchedule()", err);
    }
  }

  // Payment Schedule Calculations Start
  private validateSTInput(callback) {
    this.util.removeCommas(this.costs.at(0).get("shipping_handling"));
    this.util.removeCommas(this.costs.at(0).get("adjustment"));
    if (
      (this.costs.at(0).get("shipping_handling").value !== "" &&
        this.costs.at(0).get("shipping_handling").value !== undefined &&
        !this.constant.AMOUNT_PATTERN.test(
          this.costs.at(0).get("shipping_handling").value
        )) ||
      (this.costs.at(0).get("adjustment").value !== "" &&
        this.costs.at(0).get("adjustment").value !== undefined &&
        !this.constant.AMOUNT_NEG_PATTERN.test(
          this.costs.at(0).get("adjustment").value
        ))
    ) {
      return callback(false);
    }
    return callback(true);
  }
//   calculateSubTotal() {
//     const self = this;
//     const total = 0;
//     try {
//       this.validateSTInput(function(response) {
//         if (!response) {
//           return;
//         }
//         self.pageVariables.costOfOrder = parseFloat(
//           self.costs.at(0).get("cost_of_services").value
//         );
//         if (self.pageVariables.costOfOrder > 0) {
//           const itemShip =
//             self.costs.at(0).get("shipping_handling").value == null
//               ? 0
//               : self.costs.at(0).get("shipping_handling").value == ""
//               ? 0
//               : self.costs.at(0).get("shipping_handling").value;
//           const itemAdjustment =
//             self.costs.at(0).get("adjustment").value == null
//               ? 0
//               : self.costs.at(0).get("adjustment").value == ""
//               ? 0
//               : self.costs.at(0).get("adjustment").value;
//             //   (parseFloat(itemShip) +
//             //   parseFloat(itemAdjustment) +
//           self.pageVariables.subTotal =
//             total +
            
//               parseFloat(self.pageVariables.costOfOrder);
//           self.costs
//             .at(0)
//             .get("sub_total")
//             .setValue(self.pageVariables.subTotal);
//         } else {
//           self.costs
//             .at(0)
//             .get("sub_total")
//             .setValue(0);
//           self.pageVariables.subTotal = 0;
//         }
//         self.calculateTaxes();
//       });
//     } catch (err) {
//       this.global.addException("Review Quotation", "calculateSubTotal()", err);
//     }
//   }
  private validateTaxInput(callback) {
    try {
      if (
        this.costs.at(0).get("taxes").value != "" &&
        this.costs.at(0).get("taxes").value != undefined &&
        !this.constant.AMOUNT_PATTERN.test(this.costs.at(0).get("taxes").value)
      ) {
        return callback(false);
      }
      return callback(true);
    } catch (err) {
      this.global.addException("WO Subcontractor", "validateTaxInput()", err);
    }
  }
//   calculateTaxes() {
//     const self = this;
//     // console.log(self.pageVariables);
//     try {
//       this.validateTaxInput(function(response) {
//         if (!response) {
//           return;
//         }

//         if (
//           self.costs.at(0).get("taxes").value != "" &&
//           self.costs.at(0).get("sub_total").value > 0
//         ) {
//           const itemTax =
//             self.costs.at(0).get("taxes").value == null
//               ? 0
//               : self.costs.at(0).get("taxes").value;
//           self.pageVariables.taxes = (
//             (parseFloat(itemTax) / 100) *
//             parseFloat(self.pageVariables.subTotal)
//           ).toFixed(2);
//           self.costs
//             .at(0)
//             .get("tax_amount")
//             .setValue(self.pageVariables.taxes);
//           self.pageVariables.totalCost =
//             parseFloat(self.pageVariables.taxes) +
//             parseFloat(self.pageVariables.subTotal);
//           self.pageVariables.totalCost = self.pageVariables.totalCost.toFixed(
//             2
//           );
//           self.costs
//             .at(0)
//             .get("total_cost")
//             .setValue(
//               self.pageVariables.totalCost ? self.pageVariables.totalCost : 0
//             );
//           self.pageVariables.taxPercent = self.costs.at(0).get("taxes").value;
//         } else {
//           self.pageVariables.taxes = 0;
//           self.costs
//             .at(0)
//             .get("tax_amount")
//             .setValue(0);
//           self.pageVariables.totalCost =
//             parseFloat(self.pageVariables.taxes) +
//             parseFloat(self.pageVariables.subTotal);
//           self.costs
//             .at(0)
//             .get("total_cost")
//             .setValue(
//               self.pageVariables.totalCost ? self.pageVariables.totalCost : 0
//             );
//         }
//         self.pageVariables.remainingPaymentAmount =
//           self.pageVariables.totalCost;
//         self.calculatePaymentAmount();
//       });
//     } catch (err) {
//       this.global.addException("WO SubContractor", "calculateTaxes()", err);
//     }
//   }
  private validatePaymentInput(callback) {
    try {
      for (let i = 0; i < this.payment_schedules.value.length; i++) {
        this.util.removeCommas(this.payment_schedules.at(i).get("amount"));
        if (
          !this.constant.AMOUNT_PATTERN.test(
            this.payment_schedules.value[i].amount
              ? this.payment_schedules.value[i].amount
              : 0
          )
        ) {
          return callback(false);
        }
      }
      return callback(true);
    } catch (err) {
      this.global.addException(
        "WO Subcontractor",
        "validatePaymentInput()",
        err
      );
    }
  }
  calculatePaymentAmount() {
    const self = this;
    try {
      this.validatePaymentInput(function(response) {
        if (!response) {
          return;
        }
        let total: any = 0.0;
        for (let i = 0; i < self.payment_schedules.value.length; i++) {
          const payAmt: any =
            self.payment_schedules.value[i].amount == null ||
            self.payment_schedules.value[i].amount == ""
              ? 0
              : parseFloat(self.payment_schedules.value[i].amount);
          total = parseFloat(total) + parseFloat(payAmt);
          // console.log("total ::::::", total);
          // console.log("total toFixed ::::::", total.toFixed(2));

          if (
            parseFloat(self.pageVariables.totalCost) > total.toFixed(2) &&
            total.toFixed(2) > 0
          ) {
            self.totalPayErr = true;
            self.errMsg = "Payment schedule amount must be equal to total amount of work order.";
            //self.errMsg = 'Total payment amount should not exceed Total cost.'
          } else if (
            parseFloat(self.pageVariables.totalCost) < total.toFixed(2) &&
            total.toFixed(2) > 0
          ) {
            self.totalPayErr = true;
            self.errMsg = "Payment schedule amount must be equal to total amount of work order.";
            //self.errMsg = 'Total payment amount should not exceed Total cost.'
          } else {
            self.totalPayErr = false;
            self.errMsg = "";
          }
        }
        self.pageVariables.totalPaymentAmount = total.toFixed(2);
        self.pageVariables.remainingPaymentAmount = (self.pageVariables
          .totalCost == "XXXX"
          ? 0
          : parseFloat(self.pageVariables.totalCost) - total
        ).toFixed(2);
        
      });
    } catch (err) {
      this.global.addException(
        "WO Subcontractor",
        "calculatePaymentAmount()",
        err
      );
    }
  }


    /**
     * Calculate total payment amount
     * @return void
     */
    calculatePymTotal() {

        let subtotal = this.subtotalAmount();
        let calculatedPrices = this.util.calculatePrices(
            subtotal,
            parseFloat(this.costs.at(0).get("adjustment").value),
            parseFloat(this.costs.at(0).get("taxes").value),
            parseFloat(this.costs.at(0).get("tax_amount").value),
            parseFloat(this.costs.at(0).get("shipping_handling").value),
            parseFloat(this.costs.at(0).get("total_cost").value)
        );
        console.log(calculatedPrices);
        this.costs.at(0).patchValue({
            'subtotal' : subtotal,
            'tax_amount' : calculatedPrices['taxAmount'],
            'total_cost' : calculatedPrices['totalPaymentAmount']
        });

        this.pageVariables.taxes = this.costs.at(0).get("tax_amount").value;
        this.pageVariables.totalCost = this.costs.at(0).get("total_cost").value;
        this.calculatePaymentAmount();
    }

    subtotalAmount() {
    
        const self = this;
        const total = 0;
    
        self.pageVariables.costOfOrder = parseFloat(
          self.costs.at(0).get("cost_of_services").value
        );
        if (self.pageVariables.costOfOrder > 0) {
          
          self.pageVariables.subTotal =
            total + parseFloat(self.pageVariables.costOfOrder);
          self.costs
            .at(0)
            .get("sub_total")
            .setValue(self.pageVariables.subTotal);
        } else {
          self.costs
            .at(0)
            .get("sub_total")
            .setValue(0);
          self.pageVariables.subTotal = 0;
        }
        return self.pageVariables.costOfOrder;
    } 

  // Payment Schedule Calculations End

  createExtWorkOrder(form: FormGroup) {
    // console.log(this.scheduleType);
     console.log(form.valid, form.value);
    this.submitted = true;
    //this.totalPayErr = false;
    const self = this;
    try {
        //this.totalPayErr = false;
        //this.errMsg = "";
        if (form.valid && !this.totalPayErr) {
          this.totalPayErr = false;
          this.errMsg = "";
          let reqObj: any = {};
          // reqObj = form.value;
          reqObj = form.value.costs[0];
          reqObj.work_order_id = form.value.work_order_id;
          reqObj.supplier_id = form.value.supplier_id;
          reqObj.supplier_name = form.value.supplier_name;
          reqObj.schedules = form.value.schedules;
          reqObj.payment_schedules = form.value.payment_schedules;
          reqObj.requirements = form.value.requirements;
          reqObj.services = form.value.services;
          reqObj.project_estimate_id =
            self.selectedQuotation.project_estimate_id;
          reqObj.work_location_id =
            self.selectedQuotation.client_work_location_id;
          reqObj.client_id = self.selectedQuotation.client_id;
          reqObj.email_id = self.selectedQuotation.email_id;
          reqObj.phone_no = self.selectedQuotation.phone_no;
          reqObj.assign_to = 2;
          reqObj.maintenance_request_id =
            this.WOSubContractorObj.WO_TYPE == "Internal Contractor" &&
            this.WOSubContractorObj.assetsDetails
              ? this.WOSubContractorObj.assetsDetails.maintenance_request_id
                ? this.WOSubContractorObj.assetsDetails
                    .maintenance_request_id
                : ""
              : "";
          reqObj.asset_id =
            this.WOSubContractorObj.WO_TYPE == "Internal Contractor" &&
            this.WOSubContractorObj.assetsDetails
              ? this.WOSubContractorObj.assetsDetails.asset_id
              : "";
          reqObj.is_repairing_asset =
            reqObj.maintenance_request_id ||
            this.WOSubContractorObj.isRepairingAsset
              ? 1
              : 0;
          reqObj.work_order_type =
            this.WOSubContractorObj.WO_TYPE == "Internal Contractor" ? 1 : 2;
          reqObj.status = 1;
          reqObj.require_client_sign = 0;

          for (let i = 0; i < reqObj.payment_schedules.length; i++) {
              if(reqObj.payment_schedules[i].date != '')
              {
                  reqObj.payment_schedules[i].date = this.util.getYYYYMMDDDate(
                    reqObj.payment_schedules[i].date
                  );
              }
            
          }
          for (let i = 0; i < reqObj.schedules.length; i++) {
            reqObj.schedules[i].start_date = this.util.getYYYYMMDDDate(
              reqObj.schedules[i].start_date
            );
            reqObj.schedules[i].end_date = this.util.getYYYYMMDDDate(
              reqObj.schedules[i].end_date
            );
          }
          this.WOService.deletedService.map(item => {
            reqObj.services.push({
              wo_service_id: item,
              is_delete: 1
            });
          });

          this.WOService.deletedPaySchedule.map(item => {
            reqObj.payment_schedules.push({
              wo_payment_schedule_id: item,
              is_delete: 1
            });
          });

          reqObj.client_name = this.WOSubContractorObj.WO_TYPE == "Internal Contractor" ? '' : self.selectedQuotation.client_name;
          reqObj.client_work_location = self.selectedQuotation.client_work_location;
          if (this.isEdit) {
            reqObj.paymentSchedules = reqObj.payment_schedules;
            
            reqObj.shipping_and_handling = reqObj.shipping_handling;
            
            reqObj.subtotal = reqObj.sub_total;
            reqObj.schedule = reqObj.schedules;

            self.util.addSpinner("updateWO", "Update");
            this.http.doPost("work-order/save", reqObj, function(
              error: boolean,
              response: any
            ) {
              self.util.removeSpinner("updateWO", "Update");
              if (error) {
                self.totalPayErr = true;
                self.errMsg = response.message;
              } else {
                // console.log("Ext Work Order Edited", response);
                localStorage.removeItem("CREATE_WO");
                sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
                self.util.showDialog(DialogComponent, response.message, [
                  "/workflow/wo/csa/work-order-list/0"
                ]);
              }
            });
          } else {
            sessionStorage.removeItem("WO_EDIT");
            sessionStorage.setItem(
              "WO_CONTRACTOR_DETAILS",
              JSON.stringify(reqObj)
            );
            this.router.navigate(["/workflow/wo/csa/wo-contractor-review"]);
          }
        }
     // }
    } catch (err) {
      this.global.addException(
        "External Work Order",
        "createExtWorkOrder()",
        err
      );
    }
  }
}
