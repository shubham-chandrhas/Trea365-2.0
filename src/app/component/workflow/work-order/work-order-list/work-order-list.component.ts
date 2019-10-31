import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import * as _ from "underscore";

import { HttpService } from "../../../../shared/service/http.service";
import { UtilService } from "../../../../shared/service/util.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";

import { WorkOrderDialog } from "../work-order-dialog.component";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { WorkOrderService } from "../work-order.service";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";
@Component({
  selector: "app-work-order-list",
  templateUrl: "./work-order-list.component.html",
  styleUrls: ["./work-order-list.component.scss"]
})
export class WorkOrderListComponent implements OnInit {
  public sortColumn = "work_order_date";
  public sortOrder = "DSC";
  public WorkOrderList: any = "";
  public completeWOList: any[] = [];
  public WorkOrderListBackup: any = "";
  public selectedWorkOrder: any = "";
  public searchTxt: string;
  public searchList;
  public paginationKey: any;
  public listCount = 0;
  public errMsg = "";
  public isError = false;
  public successMsg = "";
  public isSuccess = false;
  public selectedIndex;
  public woListTab = "All";
  public currentDate: any;

  public statusSearch: string;
  public dateSearch: string;
  public clientSearch: string;
  public quoteNoSearch: string;
  public woNoSearch: string;
  public woTypeSearch: string;
  public assignToSearch: string;
  public appliedFilter: any = [];
  columnType;
  public company_id: any;

  public onBoarding = false;

  constructor(
    public dialog: MatDialog,
    private http: HttpService,
    public util: UtilService,
    public router: Router,
    private route: ActivatedRoute,
    public constant: ConstantsService,
    private global: GlobalService,
    private location: Location,
    private woService: WorkOrderService,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {
    sessionStorage.removeItem("WO_From_Maintenance");
    sessionStorage.removeItem("WO_EDIT");
    sessionStorage.removeItem("WO_DETAILS");
    sessionStorage.removeItem("WO_CONTRACTOR_DETAILS");
    sessionStorage.removeItem("woSetupData");
    sessionStorage.removeItem("woDetails");
    localStorage.removeItem("CREATE_WO");
    this.woService.WO_DATA = {};
  }

  ngOnInit() {
    const self = this;
    self.company_id = JSON.parse(atob(localStorage.getItem("USER"))).company_id;

    self.util.menuChange({
      menu: 4,
      subMenu: 26
    });
    self.paginationKey = {
      itemsPerPage: self.constant.ITEMS_PER_PAGE,
      currentPage: self.constant.CURRENT_PAGE
    };
    self.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.getWorkOrderList();
    self.currentDate = self.util.getFormatedDate(new Date());
    this.woService.deletedService = [];
    this.woService.deletedProductMaterial = [];
    this.woService.deletedTeamMember = [];
    this.woService.deletedAsset = [];
    this.woService.deletedPaySchedule = [];
    this.woService.associatedAsset = [];
    this.util.changeDetection.subscribe(dataObj => {
      if (
        dataObj &&
        dataObj.source === "WORKORDER" &&
        dataObj.action === "DELETE"
      ) {
        self.getWorkOrderList(dataObj.source);
        self.selectedWorkOrder = "";
      } else if (
        dataObj &&
        dataObj.source === "WORKORDER" &&
        dataObj.action === "CANCEL"
      ) {
        self.getWorkOrderList();
        self.selectedWorkOrder = "";
      } else if (
        dataObj &&
        dataObj.source === "APPROVAL_WO" &&
        dataObj.action === "COMPLETE"
      ) {
        self.getWorkOrderList();
        self.selectedWorkOrder = "";
      }
      else if (
        dataObj &&
        dataObj.source === "WORKORDER_EDIT" &&
        dataObj.action === "EDIT_PM"
      ) {
          self.editWO(dataObj.data,"products");
      }
    });
  }

  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }

  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }

  applyFilter(filterValue: string) {}

  getWorkOrderList(option: any = "") {
    const self = this;
    self.WorkOrderList = [];
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("work-order", function (
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.global.addException("WO list", "getWorkOrderList()", response);
          self.errMsg = response.message;
          self.onBoarding = false;
          self.util.showAlert(response.message);
        } else {
          self.WorkOrderList = response.data;
          self.constant.ITEM_COUNT = response.data.length;
          self.WorkOrderListBackup = self.WorkOrderList;
          self.route.snapshot.paramMap.get("id") != "0" && option == "" ?
            self.showWODetails() :
            "";
            if (self.WorkOrderList.length === 0) {
              self.onBoarding = true;
            }
        }

      });
    } catch (err) {
      this.global.addException("WO list", "getWorkOrderList()", err);
    }
  }

  showWODetails(): void {
    const sortedList: any[] = _.sortBy(
      this.WorkOrderList,
      "work_order_date"
    ).reverse();
    for (let i = 0; i < sortedList.length; ++i) {
      this.route.snapshot.paramMap.get("id") == sortedList[i].work_order_id ?
        (this.getSelectedWorkOrder(sortedList[i].work_order_id, i),
          (this.selectedIndex = i)) :
        "";
    }
  }

  getSelectedWorkOrder(wo_id, index): void {

    if(!this.util.canAccess('wo_details'))
    {
    return;
    }
      
    const self = this;
    self.selectedWorkOrder = "";
    self.errMsg = "";
    self.successMsg = "";
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet(`work-order/${wo_id}/details`, function (
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
            self.util.showAlert(response.message);
            self.global.addException("WO Select", "getSelectedWorkOrder()", error);
        } else {
          self.selectedWorkOrder = response.data;
          // self.selectedWorkOrder.assign_to = "Contractor";
          self.selectedWorkOrder.pdfLink =
            self.config.pdfEndpoint +
            "work-order/" +
            self.selectedWorkOrder.wo_random_number +
            "/pdf";
          self.selectedWorkOrder.preview =
            self.config.pdfEndpoint +
            "work-order/" +
            self.selectedWorkOrder.wo_random_number;
          self.selectedIndex = index;
          self.location.go(
            "/workflow/wo/csa/work-order-list/" + wo_id
          );
          setTimeout(function () {
            self.util.scrollDown("woMark");
          }, 1000);
        }
        self.util.hideProcessing("processing-spinner");
      });
    } catch (err) {
      this.global.addException("WO Select", "getSelectedWorkOrder()", err);
    }
  }
  editWO(obj,tab: any = "services") {
    try {
      sessionStorage.removeItem("WO_DETAILS");
      sessionStorage.removeItem("WO_EDIT");
      sessionStorage.removeItem("CREATE_WO");
      localStorage.removeItem("CREATE_WO");

      const localObj: any = obj;
      localObj.scheduleInfo = {};
      localObj.work_order_id = obj.work_order_id;
      localObj.scheduleInfo.supplier_id = obj.suppliers ?
        obj.suppliers.supplier_id :
        "";
      localObj.scheduleInfo.supplier_name = obj.suppliers ?
        obj.suppliers.supplier_name :
        "";
      localObj.scheduleInfo.requirements = obj.requirements ?
        obj.requirements :
        "";
      localObj.scheduleInfo.schedule_items = [];
      localObj.scheduleInfo.schedule_items.push(obj.schedule);

      localObj.services = localObj.services;
      localObj.product_materials = localObj.product_materials;
      localObj.assets = obj.assets;
      localObj.assets.map(item => {
        item.is_delete = 0;
      });
      localObj.materialsDetails = [];

      localObj.servicesDetails = [];
      localObj.teamDetails = obj.team;
      localObj.teamDetails.map(item => {
        item.is_delete = 0;
      });
      localObj.assign_to = obj.assign_to;
      localObj.client_work_location = obj.client_work_location;
      localObj.status_id = obj.status_id;
      localObj.materialsDetails = JSON.parse(
          JSON.stringify(localObj.product_materials)
        );
        localObj.servicesDetails = {
          services: JSON.parse(JSON.stringify(localObj.services))
        };
       localObj.assetsDetails = JSON.parse(JSON.stringify(localObj.assets)); 
       localObj.is_repairing_asset = obj.is_repairing_asset;
       localObj.asset_id = obj.asset_id ?  obj.asset_id : '';
       localObj.maintenance_request_id = obj.maintenance_request_id ?  obj.maintenance_request_id : '';
       
      console.log("WO_EDIT:::: ",JSON.stringify(localObj));
      if (obj.assign_to === "Staff" && !obj.client_id) {

        sessionStorage.setItem("WO_EDIT", JSON.stringify(localObj));
        this.router.navigate(["/workflow/wo/csa/work-order/"+tab]);
      } else if (obj.assign_to === "Staff" && obj.client_id) {
        
        localObj.quote_number = obj.quote_number ?  obj.quote_number : '';
        localObj.project_estimate_no = obj.quote_number ?  obj.quote_number.project_estimate_no : '';
        localObj.require_client_sign = obj.require_client_sign;
        localObj.requirements = obj.requirements;
        console.log("WO_EDIT:::: ",JSON.stringify(localObj));
        sessionStorage.setItem("WO_EDIT", JSON.stringify(localObj));
        this.router.navigate(["/workflow/wo/csa/wo-external/"+tab]);
      } else {
        sessionStorage.setItem("WO_EDIT", JSON.stringify(localObj));

        const create_WO_Obj: any = {};
        create_WO_Obj.WO_TYPE = "Edit Contractor";
        localStorage.setItem("CREATE_WO", JSON.stringify(create_WO_Obj));
        this.router.navigate(["/workflow/wo/csa/wo-sub-contractor"]);
      }
    } catch (err) {
      this.global.addException("WO", "editWO()", err);
    }
  }
  showQuotationListPopup() {
    this.dialog.open(WorkOrderDialog, {
      data: {
        action: "quotationList"
      }
    });
  }
  getSearchTxt(filterValue: string) {
    if (filterValue === "") {
      this.searchTxt = "";
    }
  }
  changeWoList(woType) {
    this.WorkOrderList = "";
    this.woListTab = woType;
    if (this.woListTab === "All") {
      this.WorkOrderList = this.WorkOrderListBackup;
    } else if (this.woListTab === "Internal") {
      this.WorkOrderList = this.WorkOrderListBackup.filter(
        wo => wo.woType === "Staff"
      );
    } else if (this.woListTab === "Contractor") {
      this.WorkOrderList = this.WorkOrderListBackup.filter(
        wo => wo.woType === "Contractor"
      );
    } else if (this.woListTab === "Complete") {
      this.WorkOrderList = this.completeWOList;
    }
  }
  // Start WO
  startWO(obj) {
    const self = this;
    this.util.showProcessing("processing-spinner");
    try {
        let reqObj = {
            'work_order_id' : obj.work_order_id,
            'status': '5'
        };
      this.http.doPost("work-order/update/status",reqObj, function (
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.errMsg = response.message;
          self.isError = true;
        } else {
          if (response.status) {
            self.isSuccess = true;
            self.util.showDialog(DialogComponent, response.message);
            self.location.go(
                    "/workflow/wo/csa/work-order-list/" + obj.work_order_id
                );
            self.selectedWorkOrder = "";
            self.getWorkOrderList();
          } else {
            self.dialog.open(WorkOrderDialog, {
                data: {
                action: "startWorkOrderEditProduct",
                work_order_id: obj.work_order_id,
                pmObj : response,
                selectedWO : obj
                }
            });  
            // self.errMsg = response.message;
            // self.isError = true;
          }
        }
      });
    } catch (err) {
      this.global.addException("Error Log", "constructor()", err);
    }
  }

  // Complete WO
  completeWO(obj) {
    const self = this;
    try {
      this.dialog.open(WorkOrderDialog, {
        data: {
          action: "approvalConfirmation",
          work_order_id: obj.work_order_id
        }
      });
    } catch (err) {
      this.global.addException("Complete Work Order", "completeWO()", err);
    }
  }

  // Cancel Work Order 
  cancelWO(obj) {
    try {
      const data: any = {
        API_URL: "work-order/update/status",
        reqObj: {
          'work_order_id': obj.work_order_id,
          'status': '6'  
        },
        event: {
          source: "WORKORDER",
          action: "CANCEL"
        }
      };
      this.util.showDialog(
        DialogComponent,
        "Are you sure to Cancel Work Order?",
        [],
        "Cancel Confirmation",
        "CONFIRMATION",
        data,
        'Ok'
      );
    } catch (err) {
      this.global.addException("Error Log", "constructor()", err);
    }
  }

  //  Delete WOrk Order
  deleteWO(obj) {
    try {
      const data: any = {
        API_URL: "work-order/delete",
        reqObj: {
          work_order_id: obj.work_order_id
        },
        event: {
          source: "WORKORDER",
          action: "DELETE"
        }
      };
      this.util.showDialog(
        DialogComponent,
        "Are you sure to delete Work Order No : " + obj.work_order_no + " ?",
        [],
        "Delete Confirmation",
        "CONFIRMATION",
        data
      );
    } catch (err) {
      this.global.addException("Error Log", "constructor()", err);
    }
  }

  preview(dataPreview) {
    window.open(dataPreview);
  }
  downloadPDF(dataDownload) {
    window.open(dataDownload);
  }
}
