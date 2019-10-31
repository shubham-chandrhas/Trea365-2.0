import { Component, OnInit } from '@angular/core';
import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from "../../../../shared/service/http.service";
import { DashboardService } from '../../dashboard.service';
import { GlobalService } from "../../../../shared/service/global.service";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  Validators
} from "@angular/forms";

declare var $: any;

@Component({
  selector: 'app-summary1',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class OldSummaryComponent implements OnInit {
  userHub: FormGroup;
  checkbox_value: any;
  today = new Date();
  public useHubData: any = {};
  public dayType: string;
  constructor(
    private fb: FormBuilder,
    public util: UtilService,
    public dashboard: DashboardService,
    private http: HttpService,
    private global: GlobalService,
    public route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.util.menuChange({ menu: 1000, subMenu: 9000 });
    this.util.setPageTitle(this.route);
    this.createForm("0");
    this.getUserHubDetails();
    if (sessionStorage.getItem("userHubDetails")) {
      let userHubDetails = JSON.parse(
        sessionStorage.getItem("userHubDetails")
      );
      this.createForm("1", userHubDetails);
    }
    this.dayType = this.util.getDayType();

  }
  changed(evt, form: FormGroup) {
    this.userHub.get("isInventoryChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "userHubDetails",
      JSON.stringify(form.value)
    );
  }

  changedClientWorkflow(evt, form: FormGroup) {
    this.userHub.get("isClientWorkflowChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "userHubDetails",
      JSON.stringify(form.value)
    );
  }

  changedFinancial(evt, form: FormGroup) {
    this.userHub.get("isFinancialChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "userHubDetails",
      JSON.stringify(form.value)
    );
  }

  public createForm(option, val: any = {}) {
    this.userHub = this.fb.group({
      isInventoryChecked: new FormControl(option == "1" ? val.isInventoryChecked : false),
      isClientWorkflowChecked: new FormControl(option == "1" ? val.isClientWorkflowChecked : false),
      isFinancialChecked: new FormControl(option == "1" ? val.isFinancialChecked : false),
    });
  }

  get isInventoryChecked() {
    return this.userHub.get("isInventoryChecked");
  }

  get isClientWorkflowChecked() {
    return this.userHub.get("isClientWorkflowChecked");
  }

  get isFinancialChecked() {
    return this.userHub.get("isFinancialChecked");
  }

  getUserHubDetails() {
    let self = this;
    self.util.showProcessing("processing-spinner");
    try {
      let url = "user-dashboard";
      this.http.doGet(url, function (error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response);
          self.util.showAlert(response.message);
          self.global.addException("User hub Details", "getUserHubDetails()", error);
        } else {
          self.useHubData = response.data;
        }
      });
    } catch (err) {
      this.global.addException("User hub Details", "getUserHubDetails()", err);
    }
  }


    openChatBox() {
        $('#live-chat').css({'display': 'block'});
    }
}
