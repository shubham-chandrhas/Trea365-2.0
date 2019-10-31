import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators
} from "@angular/forms";

import { Observable, Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { UtilService } from "../../../../../shared/service/util.service";
import { HttpService } from "../../../../../shared/service/http.service";
import { ConstantsService } from "../../../../../shared/service/constants.service";
import { ProjectEstimatorService } from "../../project-estimator.service";
import { GlobalService } from "../../../../../shared/service/global.service";

@Component({
  selector: "app-payment-schedule",
  templateUrl: "./payment-schedule.component.html",
  styleUrls: [
    "../quotation-generation.component.css",
    "./payment-schedule.component.scss"
  ]
})
export class PaymentScheduleComponent implements OnInit {
  public payScheduleForm: FormGroup;
  scheduleType: string = 'due';
  public submitted: boolean = false;
  public minDate: any = new Date();
  public totalPayErr: boolean = false;
  public errMsg: string = "";
  public isError: boolean = false;
  public editMode: boolean = false;
  public pageVariables: any = {
    costOfOrder: "",
    subTotal: "",
    taxes: "",
    totalCost: "",
    totalPaymentAmount: "",
    paymentTerm: 0
  };
  subscription: Subscription;
  public settings: any;
  public default_tax_rate: any;

  constructor(
    public util: UtilService,
    private constant: ConstantsService,
    private fb: FormBuilder,
    private http: HttpService,
    private PEService: ProjectEstimatorService,
    private global: GlobalService
  ) {}

  ngOnInit() {
    this.settings = JSON.parse(atob(localStorage.getItem("USER"))).settings;
    for (let index = 0; index < this.settings.length; index++) {
      if (this.settings[index].setting_key == "tax_rate") {
        this.default_tax_rate = this.settings[index].setting_value;
      }
    }

    console.log(this.PEService.projectEstimatorData.payment_term);
    if (this.PEService.projectEstimatorData.paymentScheduleDetails) {
      
      this.paymentScheduleForm(
        "1",
        this.PEService.projectEstimatorData.paymentScheduleDetails
      );
    } else {
      this.paymentScheduleForm("0");
    }

    if(this.PEService.projectEstimatorData.payment_term)
    {
        this.pageVariables.paymentTerm = this.PEService.projectEstimatorData.payment_term;
    }

    this.subscription = this.util.changeDetection.subscribe(dataObj => {
      if (
        dataObj &&
        dataObj.source == "QUOTATION_GENERATION" &&
        dataObj.action == "ADD_PAYMENT_SCHEDULE"
      ) {
        this.reviewPaySchedule();
      }
      else if (
        dataObj &&
        dataObj.source == "PE_SCHEDULE_PAYMENT" &&
        dataObj.action == "EDIT_PE_SCHEDULE_PAYMENT"
      ) {
        if (this.PEService.projectEstimatorData.paymentScheduleDetails) {
      
            this.paymentScheduleForm(
                "1",
                this.PEService.projectEstimatorData.paymentScheduleDetails
            );
            }
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  paymentScheduleForm(option, val: any = {}) {
    try {
      let subTotal: number = 0;
      subTotal =
        subTotal +
        parseFloat(
          this.PEService.projectEstimatorData.servicesDetails &&
            this.PEService.projectEstimatorData.servicesDetails.services_amount
            ? this.PEService.projectEstimatorData.servicesDetails
                .services_amount
            : 0
        ) +
        parseFloat(
          this.PEService.projectEstimatorData.materialsDetails &&
            this.PEService.projectEstimatorData.materialsDetails
              .materials_amount
            ? this.PEService.projectEstimatorData.materialsDetails
                .materials_amount
            : 0
        );
      this.pageVariables.totalCost = this.pageVariables.subTotal = subTotal;
      this.payScheduleForm = this.fb.group({
        cost_of_service: new FormControl(
          this.PEService.projectEstimatorData.servicesDetails &&
          this.PEService.projectEstimatorData.servicesDetails.services_amount
            ? this.PEService.projectEstimatorData.servicesDetails
                .services_amount
            : 0
        ),
        cost_of_material: new FormControl(
          this.PEService.projectEstimatorData.materialsDetails &&
          this.PEService.projectEstimatorData.materialsDetails.materials_amount
            ? this.PEService.projectEstimatorData.materialsDetails
                .materials_amount
            : 0
        ),
        sub_total: new FormControl(subTotal),
        total_cost: new FormControl(subTotal),
        tax_amount: new FormControl(option == "1" ? val.tax_amount : ""),
        shipping_handling: new FormControl(
          option == "1" ? val.shipping_handling : "",
          [Validators.pattern(this.constant.AMOUNT_PATTERN)]
        ),
        adjustment: new FormControl(option == "1" ? val.adjustment : "", [
          Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)
        ]),
        taxes: new FormControl(
          option == "1" ? val.taxes : this.default_tax_rate,
          [
            Validators.min(0),
            Validators.max(100),
            Validators.pattern(this.constant.AMOUNT_PATTERN)
          ]
        ),
        scheduleType: new FormControl(option == "1" ? val.scheduleType : 'due'),
        date_items: this.fb.array([])
      });
      if (option == "1") {
        let paymentAmt: number = 0;
        for (var i = 0; i < val.date_items.length; i++) {
          paymentAmt = paymentAmt + parseFloat(val.date_items[i].amount);
          this.addpayment(option, val.date_items[i]);
        }
        this.pageVariables.totalPaymentAmount = paymentAmt;
      }
      this.calculateSubTotal();
    } catch (err) {
      this.global.addException(
        "Payment Schedule",
        "paymentScheduleForm()",
        err,
        {
          "": "",
          other: {
            ProjectEstimatorData: this.PEService.projectEstimatorData
              .servicesDetails,
            "": "",
            FormData: this.payScheduleForm.value
          }
        }
      );
    }
  }
  get shipping_handling() {
    return this.payScheduleForm.get("shipping_handling");
  }
  get adjustment() {
    return this.payScheduleForm.get("adjustment");
  }
  get taxes() {
    return this.payScheduleForm.get("taxes");
  }
  get tax_amount() {
    return this.payScheduleForm.get("tax_amount");
  }

  get total_cost() {
    return this.payScheduleForm.get("total_cost");
  }
  get date_items(): FormArray {
    return (<FormArray>this.payScheduleForm.get("date_items")) as FormArray;
  }

  addpayment(option, val: any = {}) {
    try {
      this.date_items.push(
        this.fb.group({
          payment_date: new FormControl(
            option == "1" ? this.util.getTimeZoneDate(val.payment_date) : "",
            []
          ),
          amount: new FormControl(option == "1" ? val.amount : "", [
            Validators.pattern(this.constant.AMOUNT_PATTERN)
          ]),
          pe_payment_schedule_id: new FormControl(option == "1" ? val.pe_payment_schedule_id : ""),
          is_delete: new FormControl(option == "1" ? val.is_delete  ? val.is_delete  : 0 : 0)
        })
      );
    } catch (err) {
      this.global.addException(
        "Payment Schedule - Add Payment",
        "addpayment()",
        err,
        { functionParameter: val }
      );
    }
  }

  public changeSchedule(type){
    this.scheduleType = type;
    this.payScheduleForm
            .get("scheduleType")
            .setValue(type);
  }

  removePaySchedule(position, item) {
    try {
        if(item.get('pe_payment_schedule_id').value == '')
        {
            this.date_items.removeAt(position);
        }
        else
        {
            item.get('is_delete').setValue(1);
        }
      this.calculatePaymentAmount();
    } catch (err) {
      this.global.addException(
        "Payment Schedule - Remove",
        "removePaySchedule()",
        err
      );
    }
  }

  private validateSTInput(callback) {
    try {
      this.util.removeCommas(this.shipping_handling);
      this.util.removeCommas(this.adjustment);
      if (
        (this.shipping_handling.value != "" &&
          this.shipping_handling.value != undefined &&
          !this.constant.AMOUNT_PATTERN.test(this.shipping_handling.value)) ||
        (this.adjustment.value != "" &&
          this.adjustment.value != undefined &&
          !this.constant.AMOUNT_NEG_PATTERN.test(this.adjustment.value))
      ) {
        return callback(false);
      }
      return callback(true);
    } catch (err) {
      this.global.addException(
        "Payment Schedule - Validate Input",
        "validateSTInput()",
        err
      );
    }
  }
  calculateSubTotal() {
    try {
      let self = this;
      this.validateSTInput(function(response) {
        if (!response) {
          return;
        }
        self.pageVariables.costOfOrder =
          parseFloat(self.payScheduleForm.get("cost_of_service").value) +
          parseFloat(self.payScheduleForm.get("cost_of_material").value);
        if (self.pageVariables.costOfOrder > 0) {
          self.payScheduleForm
            .get("sub_total")
            .setValue(self.pageVariables.costOfOrder);
        }
        self.calculateTaxes();
        
      });
    } catch (err) {
      this.global.addException(
        "Payment Schedule - calculate",
        "calculateSubTotal()",
        err
      );
    }
  }

  reviewPaySchedule() {
    console.log(this.payScheduleForm.value);
    this.submitted = true;

    

    if (this.payScheduleForm.valid) {

      this.PEService.projectEstimatorData.paymentScheduleDetails = this.payScheduleForm.value;
      this.PEService.projectEstimatorData.paymentScheduleDetails.totalPaymentAmount = this.pageVariables.totalPaymentAmount;
      this.PEService.projectEstimatorData.paymentScheduleDetails.paymentTerm = this.pageVariables.paymentTerm;
      this.PEService.updateFormStatus("paymentScheduleFm", true);
    } else {
      this.PEService.updateFormStatus("paymentScheduleFm", false);
    }
  }
  private validatePaymentInput(callback) {
    for (let i = 0; i < this.date_items.value.length; i++) {
      this.util.removeCommas(this.date_items.at(i).get("amount"));
      if (
        this.date_items.value[i].amount != "" &&
        this.date_items.value[i].amount != undefined &&
        !this.constant.AMOUNT_PATTERN.test(this.date_items.value[i].amount)
      ) {
        return callback(false);
      }
    }
    return callback(true);
  }

  calculatePaymentAmount() {
    let self = this;

    this.validatePaymentInput(function(response) {
      if (!response) {
        return;
      }

      let total = 0.0;
      for (let i = 0; i < self.date_items.value.length; i++) {
        if (self.date_items.value[i].amount != "" && self.date_items.value[i].is_delete == 0) {
          var payAmt =
            self.date_items.value[i].amount == null || ""
              ? 0
              : self.date_items.value[i].amount;
          total =
            self.editMode == true
              ? total + parseFloat(payAmt)
              : total + parseFloat(payAmt);
          //@@ Commented code by Yogesh for remove validation
          // if(self.pageVariables.totalCost < total){
          //     self.totalPayErr = true;
          //     self.errMsg = 'Total payment amount should not exceed Total cost.'
          // }else{
          //     self.totalPayErr = false;
          //     self.errMsg = ''
          // }
        }
      }
      self.pageVariables.totalPaymentAmount = total.toFixed(2);
      self.pageVariables.remainingPaymentAmount = (self.pageVariables
        .totalCost == "XXXX"
        ? 0
        : self.pageVariables.totalCost - total
      ).toFixed(2);
    });
  }

  
  private validateTaxInput(callback) {
    if (
      this.taxes.value != "" &&
      this.taxes.value != undefined &&
      !this.constant.AMOUNT_PATTERN.test(this.taxes.value)
    ) {
      return callback(false);
    }
    return callback(true);
  }
  calculateTaxes() {
    let self = this;
    this.validateTaxInput(function(response) {
      self.totalPayErr = false;
      self.errMsg = "";
      if (!response) {
        return;
      }
      let addSubtotal: any = 0;
      let itemShip =
        self.shipping_handling.value == null
          ? 0
          : self.shipping_handling.value == ""
          ? 0
          : self.shipping_handling.value;
      let itemAdjustment =
        self.adjustment.value == null
          ? 0
          : self.adjustment.value == ""
          ? 0
          : self.adjustment.value;
          //parseFloat(itemShip) +
      addSubtotal =
        
        parseFloat(itemAdjustment) +
        parseFloat(self.pageVariables.subTotal);

      var itemTax =
        self.taxes.value == null || self.taxes.value == ""
          ? 0
          : self.taxes.value;
      self.pageVariables.taxes = (
        (parseFloat(itemTax) / 100) *
        parseFloat(addSubtotal)
      ).toFixed(2);

      if (self.taxes.value != "" && self.pageVariables.subTotal >= 0) {
        self.payScheduleForm
          .get("tax_amount")
          .setValue(self.pageVariables.taxes);
        self.pageVariables.totalCost =
          parseFloat(self.pageVariables.taxes) + parseFloat(itemShip) + parseFloat(addSubtotal) ;
        self.pageVariables.totalCost = self.pageVariables.totalCost.toFixed(2);
        self.payScheduleForm
          .get("total_cost")
          .setValue(self.pageVariables.totalCost);
        self.pageVariables.taxPercent = self.taxes.value;
      } else {
        self.payScheduleForm
          .get("tax_amount")
          .setValue(self.pageVariables.taxes);
        self.pageVariables.totalCost =
          parseFloat(self.pageVariables.taxes) + parseFloat(itemShip) + parseFloat(addSubtotal);
        self.payScheduleForm
          .get("total_cost")
          .setValue(self.pageVariables.totalCost);
      }
      self.calculatePaymentAmount();
      

      if (
        itemAdjustment < 0 &&
        parseFloat(itemShip) + parseFloat(self.pageVariables.subTotal) <
          itemAdjustment * -1
      ) {
        self.totalPayErr = true;
        self.errMsg =
          "Adjustment(-) amount should not exceed (Subtotal + Shipping & Handling).";
      }
    });
  }



  /**
     * Calculate total payment amount
     * @return void
     */
    calculateTotal() {

        let subtotal = this.subtotalAmount();
            
        let calculatedPrices = this.util.calculatePrices(
            subtotal,
            parseFloat(this.payScheduleForm.get("adjustment").value),
            parseFloat(this.payScheduleForm.get("taxes").value),
            parseFloat(this.payScheduleForm.get("tax_amount").value),
            parseFloat(this.payScheduleForm.get("shipping_handling").value),
            parseFloat(this.payScheduleForm.get("total_cost").value)
        );
        console.log(calculatedPrices);
        this.payScheduleForm.patchValue({
            'subtotal' : subtotal,
            'tax_amount' : calculatedPrices['taxAmount'],
            'total_cost' : calculatedPrices['totalPaymentAmount']
        });

        this.pageVariables.taxes = this.payScheduleForm.get("tax_amount").value;
        this.pageVariables.totalCost = this.payScheduleForm.get("total_cost").value;
        this.calculatePaymentAmount();
    }

    subtotalAmount() {
    
      let self = this;
      
        self.pageVariables.costOfOrder =
          parseFloat(self.payScheduleForm.get("cost_of_service").value) +
          parseFloat(self.payScheduleForm.get("cost_of_material").value);
        

        return self.pageVariables.costOfOrder;
    } 
   
}
