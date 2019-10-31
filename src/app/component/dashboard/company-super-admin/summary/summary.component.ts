import { Component, OnInit } from "@angular/core";
import { Chart } from "chart.js";

import { UtilService } from "../../../../shared/service/util.service";
import { DashboardService } from "../../dashboard.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  Validators
} from "@angular/forms";
declare var $: any;

@Component({
  selector: "app-summary",
  templateUrl: "./summary.component.html",
  styleUrls: ["./summary.component.css"]
})
export class SummaryComponent implements OnInit {
    reports: FormGroup;
  public screenHeight: any;
  public chartData: any = {};
  public pageData: any = { dashboard: null };

  inventoryTimeLineData: any = {
    seven: false,
    fourteen: false,
    thirty: true,
    ninty: false,
    threesixtyfive: false,
    seventhirty: false
  };
  workflowTimeLineData: any = {
    seven: false,
    fourteen: false,
    thirty: true,
    ninty: false,
    threesixtyfive: false,
    seventhirty: false
  };
  clientTimeLineData: any = {
    seven: false,
    fourteen: false,
    thirty: true,
    ninty: false,
    threesixtyfive: false,
    seventhirty: false
  };
  staffTimeLineData: any = {
    seven: false,
    fourteen: false,
    thirty: true,
    ninty: false,
    threesixtyfive: false,
    seventhirty: false
  };
  financialTimeLineData: any = {
    seven: false,
    fourteen: false,
    thirty: true,
    ninty: false,
    threesixtyfive: false,
    seventhirty: false
  };

  constructor(
    public util: UtilService,
    public constant: ConstantsService,
    public dashboard: DashboardService,
    private router: Router,
    private http: HttpService,
    private global: GlobalService,
    public route: ActivatedRoute,
    private fb: FormBuilder, 
  ) {}

  ngOnInit() {
    this.util.menuChange({ menu: 1000, subMenu: 10000 });
    this.util.setPageTitle(this.route);
    this.createForm("0");
    let headerHeight = $(".main-header").height();
    let footerHeight = $(".main-footer").height();
    this.screenHeight = window.innerHeight - headerHeight - headerHeight - 6;
    $(".content-wrapper").css("min-height", this.screenHeight + "px");
    this.getAdminData("all", "30");



    if (sessionStorage.getItem("dashboardReportDetails")) {
        let dashboardReportDetails = JSON.parse(
            sessionStorage.getItem("dashboardReportDetails")
        );
        console.log("dashboardReportDetails ::",dashboardReportDetails);
        this.createForm("1",dashboardReportDetails);
      }
    this.chartData.auData = {
      label: "Asset Utilization",
      data: [0, 100],
      backgroundColor: [
        "#01a89e", //fill color
        "#f6f6f6" //empty color
      ]
    };

    this.chartData.wosData = {
      label: "Total Work Orders Schedule",
      data: [1, 99],
      backgroundColor: [
        "#1e3346", //fill color
        "#f6f6f6" //empty color
      ]
    };

    this.chartData.wocData = {
      label: "Work Orders Completed",
      data: [2, 98],
      backgroundColor: [
        "#01a89e", //fill color
        "#f6f6f6" //empty color
      ]
    };

  }

  // Admin Summary service : Neha
  getAdminData(module= "all", days) {
    let self = this;
    self.util.showProcessing("processing-spinner");
    try {
      let url = "dashboard/" + "all" + "/" + days;
      this.http.doGet(url, function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response);
        } else {
           self.pageData.dashboard = response.data;
          // if (module == "all") {
          //   self.pageData.dashboard = response.data;
          // } else if (module == "inventory") {
          //   self.pageData.dashboard.inventory = response.data.inventory;
          // } else if (module == "workflow") {
          //   self.pageData.dashboard.workflow = response.data.workflow;
          // } else if (module == "client") {
          //   self.pageData.dashboard.client = response.data.client;
          // } else if (module == "staff") {
          //   self.pageData.dashboard.staff = response.data.staff;
          // } else if (module == "financial") {
          //   self.pageData.dashboard.financial = response.data.financial;
          // }

            // self.dashboard.createDoughnutChart(
            //     "auChart",
            //     self.chartData.auData
            //   );
            if(self.pageData.dashboard.workflow && self.pageData.dashboard.workflow.ocupied_staff && self.pageData.dashboard.workflow.ocupied_staff_remaining)
            {
                self.chartData.auChart = {
                    "label": "Scheduling Rate",
                    "data": [parseFloat(self.pageData.dashboard.workflow.ocupied_staff), parseFloat(self.pageData.dashboard.workflow.ocupied_staff_remaining)],
                    "backgroundColor": [
                    "#01a89e",
                    "#f6f6f6"
                ]}
                self.dashboard.createDoughnutChart('auChart', self.chartData.auChart);
            }
              

        }

      });
    } catch (err) {
      this.global.addException("admin data list", "getAdminData()", err);
    }
  }

  timeLineChangeSummary(event, id, module, timeLineData) {
    console.log(id, event);
    timeLineData.seven = id == "seven" ? true : false;
    timeLineData.fourteen = id == "fourteen" ? true : false;
    timeLineData.thirty = id == "thirty" ? true : false;
    timeLineData.ninty = id == "ninty" ? true : false;
    timeLineData.threesixtyfive = id == "threesixtyfive" ? true : false;
    timeLineData.seventhirty = id == "seventhirty" ? true : false;
    this.getAdminData(module, event.target.value);
  }

  public createForm(option, val: any = {}) {
    this.reports = this.fb.group({
      isInventoryAssetChecked: new FormControl(option == "1" ? val.isInventoryAssetChecked :  false),
      isClientChecked: new FormControl(option == "1" ? val.isClientChecked :  false),
      isFinancialChecked: new FormControl(option == "1" ? val.isFinancialChecked :  false),
      isWorkflowChecked: new FormControl(option == "1" ? val.isWorkflowChecked :  false),
      isStaffChecked: new FormControl(option == "1" ? val.isStaffChecked :  false),
    });
  }

  get isInventoryAssetChecked() {
    return this.reports.get("isInventoryAssetChecked");
  }

  get isClientChecked() {
    return this.reports.get("isClientChecked");
  }

  get isFinancialChecked() {
    return this.reports.get("isFinancialChecked");
  }

  get isWorkflowChecked() {
    return this.reports.get("isWorkflowChecked");
  }

  get isStaffChecked() {
    return this.reports.get("isStaffChecked");
  }

  changedInventoryAsset(evt,form: FormGroup) {
    this.reports.get("isInventoryAssetChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "dashboardReportDetails",
      JSON.stringify(form.value)
    );
  }

  changedClient(evt,form: FormGroup) {
    this.reports.get("isClientChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "dashboardReportDetails",
      JSON.stringify(form.value)
    );
  }

  changedFinancial(evt,form: FormGroup) {
    this.reports.get("isFinancialChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "dashboardReportDetails",
      JSON.stringify(form.value)
    );
  }

  changedWorkflow(evt,form: FormGroup) {
    this.reports.get("isWorkflowChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "dashboardReportDetails",
      JSON.stringify(form.value)
    );
  }
  changedStaff(evt,form: FormGroup) {
    this.reports.get("isStaffChecked").setValue(evt.target.checked);
    sessionStorage.setItem(
      "dashboardReportDetails",
      JSON.stringify(form.value)
    );
  }
}
