import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { FormControl } from "@angular/forms";
import { Location } from "@angular/common";

import { BehaviorSubject ,  Observable, Subscription } from "rxjs";
import { startWith ,  map } from "rxjs/operators";


import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { AppConfig, APP_CONFIG } from "../../../../app-config.module";
import { OnboardingGuideDialogComponent } from "../../../onboarding/onboarding-guide/onboarding-guide.component";
import { NewClientDialog } from "../client-dialog.component";
import { ConstantsService } from "../../../../shared/service/constants.service";
import * as _ from "underscore";
import { AdminService } from "../../../admin/admin.service";
import { NewCrmService } from "../../crm-service";


@Component({
  selector: "app-client-list",
  templateUrl: "./client-list.component.html",
  styleUrls: ["./client-list.component.css"]
})
export class NewClientListComponent implements OnInit, OnDestroy {
  pageData: any = {
    clientList: [],
    fields: [],
    listCount: 0,
    sortColumn: "id",
    sortColumnType: "N",
    sortOrder: "DSC",
    isEdit: false,
    isError: false,
    additionalFieldSearchTxt: "",
    additionalFieldSearchKey: "",
    permissionAvailability: true,
    companyId: ""
  };
  public clientDetails = "details";
  public selectedClient: any = null;
  public isEdit = false;
  public sortColumn = "client_id";
  public sortColumnType = "N";
  public sortOrder = "DSC";
  public paginationKey: any;
  public listCount = 0;
  public selectedIndex;
  public searchTxt;
  public searchList;
  typeSearch;
  addressSerach;
  emailIdSearch;
  phoneSearch;
  extraSearch;
  public clientID = 0;
  subscription: Subscription;
  public onBoarding = false;
  public fields: any[] = [];
  public referralTypeList: any = [];
  dataClientDetails: any = [];
  extraFields: any = [];
  public isError = false;
  constructor(
    @Inject(APP_CONFIG)
    private config: AppConfig,
    public dialog: MatDialog,
    public util: UtilService,
    private admin: AdminService,
    public constant: ConstantsService,
    public crm: NewCrmService,
    private http: HttpService,
    public router: Router,
    private route: ActivatedRoute,
    private global: GlobalService,
    private location: Location
  ) {
  }

  ngOnInit() {
    const self = this;
    this.util.showProcessing("processing-spinner");
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    if (this.router.url.split("/")[2] === "csa-onboarding") {
      this.util.menuChange({ menu: "guide", subMenu: "" }); // for onboarding dashboard
    } else {
      this.util.menuChange({ menu: 5, subMenu: 5 });
    }
    this.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.getClientList();
    this.subscription =  this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source === "DELETE_CLIENT") {
        self.pageData.clientList = [];
        self.getClientList();
        self.selectedClient = null;
        self.isEdit = false;
        self.crm.isEditFromList = false;
        self.selectedIndex = null;
      } else if (dataObj && dataObj.source === "UPDATE_CLIENT") {
        self.pageData.clientList = [];
        self.getClientList("REFRESH");
      } else if (dataObj && dataObj.source === "ADD_FIELDS") {
        self.getClientList();
      }
    });

  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.crm.isEditFromList = false;
  }
  addFromCSV() {
    const self = this;
    let route: string,
      apiEndPoint: string,
      csvTemplateUrl: string,
      redirectUrl: string;
    route = "/csa/csv-preview/client";
    apiEndPoint = "client/csv";
    csvTemplateUrl = this.config.domainIP + "api/public/download/csv/client.csv";
    redirectUrl = "/crm/csa/client-list/0";
    self.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("company/download-invalid-data/Client", (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response,error)
          this.util.showAlert(response.message);
          self.global.addException("services", "addFromCSV()", response);
        } else {
          const invalidUrl = response.data.length > 0 ? `${self.config.domainIP}api/public/download/csv${response.data}` : "";
    self.dialog.open(OnboardingGuideDialogComponent, {
      data: {
        action: "csvUpload",
        route: route,
        apiEndPoint: apiEndPoint,
        csvTemplateUrl: csvTemplateUrl,
        redirectUrl: redirectUrl,
        invalidDataUrl: invalidUrl
      }
    });
      }
      });
    } catch (err) {
      this.global.addException("services", "addFromCSV()", err);
    }
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


  /** for sorting **/
  sortList(columnName: string, sortType) {
    this.sortColumn = columnName;
    this.sortColumnType = sortType;
    if (this.sortColumn === columnName) {
      if (this.sortOrder === "ASC") {this.sortOrder = "DSC"; } else { this.sortOrder = "ASC"; }
    } else {
      this.sortOrder = "ASC";
    }
  }
  /** end for sorting **/

  getClientFields() {
    try {
      const  self = this;
      self.util.showProcessing("processing-spinner");
      // NOTE:For Client Extra Field user_type = 5.
      this.http.doGet(`extra-fields/5`, function(
        error: boolean,
        response: any
      ) {
         self.util.hideProcessing("processing-spinner");
        if (error) {
          self.global.addException("Client List", "getClientFields()", response);
        } else {
          self.fields = response.data
            ? response.data
            : [];
        }
        self.getExtraFields();
      });
    } catch (err) {
      this.global.addException("Client List", "getClientFields()", err);
    }
  }

  addFields() {
    this.getClientFields();
  }
  getExtraFields() {
    this.dialog.open(OnboardingGuideDialogComponent, {
      data: {
        action: "addFields",
        fields: JSON.parse(JSON.stringify(this.fields)),
        fieldType: "client",
        msgHeader: "New Client",
        userType: 5
      },
      autoFocus: false
    });
  }
  getSearchTxt(filterValue: string) {
    if (filterValue === "") {
      this.searchTxt = "";
    }
  }

  getClientList(option: any = "INIT") {
    const self = this;
    try {
      this.util.showProcessing("processing-spinner");
      this.http.doGet("client", function(error: boolean, response: any) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          self.pageData.clientList = [];
          self.isError = true;
          self.global.addException("Client List", "getClientList()", response);
        } else {
          // console.log(self.crm);
          self.isError = false;
          self.pageData.clientList = response.data;
           window.location.href.split("/").pop() != "0" || option == "REFRESH"
            ? self.showClientDetails()
            : "";
        }
        if (self.pageData.clientList.length == 0) {
            self.onBoarding = true;
          }
      });
    } catch (err) {
      this.global.addException("Client List", "getClientList()", err);
    }
  }

  showClientDetails() {
    try {
      const sortedList: any[] = _.sortBy(this.pageData.clientList, "client_id").reverse();
      for (let i = 0; i < sortedList.length; ++i) {
        if ( window.location.href.split("/").pop() == sortedList[i].client_id) {
          this.getSelectedClient(sortedList[i], i);
          this.selectedIndex = i;
          this.isEdit = false;
          this.crm.isEditFromList = false;
          break;
        }
      }
    } catch (err) {
      this.global.addException("Invoice List", "showInvoiceDetails()", err);
    }
  }
  getAdditionalFieldData(dataType, data): any {
    switch (dataType) {
      case "Number":
        return parseInt(data, 10);
      case "Decimal":
        return parseFloat(data);
      default:
        return data;
    }
  }
  getSelectedClient(selClientObj: any, index: number) {

      if (!this.util.canAccess('client_details')) {
        return false;
      }
    this.selectedClient  = null;
    this.clientDetails =  "details";
    const self = this;
    self.isEdit = false;
    self.crm.isEditFromList = false;
    self.selectedIndex = index;
    self.clientID = selClientObj.client_id;
    try {
      self.util.showProcessing("processing-spinner");
      this.http.doGet(
        `client/${selClientObj.client_id}/details`,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            self.global.addException(
              "Client details List",
              "getSelectedClient()",
              response
            );
          } else {
            self.selectedClient = response.data;
            self.location.go("/crm/csa/client-list/" + selClientObj.client_id);
              setTimeout(function() {
                self.util.scrollDown("clientMark");
              }, 1000);
          }
        });
      } catch (err) {
        this.global.addException(
          "Client details List",
          "getSelectedClient()",
          err
        );
      }
  }

  showDetails(detailOption) {
    const self = this;
    try {
      self.util.showProcessing("processing-spinner");
      self.selectedClient  = null;
      self.clientDetails = detailOption;
      this.http.doGet(
        "client/" + self.clientID + "/" + detailOption,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
          } else {
            self.selectedClient = response.data;
            self.location.go("/crm/csa/client-list/" + self.clientID);
              setTimeout(function() {
                self.util.scrollDown("clientMark");
              }, 1000);
          }
        });
      } catch (err) {
        this.global.addException(
          "Client tabs details List",
          "showDetails()",
          err
        );
      }
  }

  showQuotationListPopup(selClientObj: any) {
    this.dialog.open(NewClientDialog, { data: { action: "quotationList", client_id : selClientObj.client_id } });
  }

  showQuotationListForInvoice(selClientObj: any) {
    this.util.changeEvent({
      source: "QuotationListForInvoice",
      action: "LIST_INVOICE",
      data: {
        client_id: selClientObj.client_id
      }
    });
    this.router.navigate(["/account/csa/new-invoice"]);
  }

  showInvoiceForPayment(selClientObj: any) {
    this.util.changeEvent({
      source: "InvoiceForPayment",
      action: "INVOICE_PAYMENT",
      data: {
        client_id: selClientObj.client_id
      }
    });
    this.router.navigate(["/account/csa/invoice-list/0"]);
  }

  deleteDailog() {
    this.dialog.open(NewClientDialog, {
      data: {
        action: "deleteRecord",
        clientId: this.selectedClient.client_id,
        successMsg: this.selectedClient.client_name
      },
      autoFocus: false
    });
  }

  addNew() {
    this.isEdit = false;
    this.crm.isEditFromList = false;
    sessionStorage.removeItem("client");
    if (this.router.url.split("/")[2] == "csa-onboarding") {
      this.router.navigate(["/crm/csa-onboarding/add-client"]);
    } else {
      this.router.navigate(["/crm/csa/add-client"]);
    }
  }

  editClient() {
    this.isEdit = true;
    this.crm.isEditFromList = true;
    try {
      this.selectedClient.additional_fields = this.selectedClient.extra_fields;
      sessionStorage.setItem("client", JSON.stringify(this.selectedClient));
      const self = this;
      setTimeout(function() {
        self.util.scrollDown("clientMark");
      }, 1000);
    } catch (err) {
      this.global.addException("Client List", "editClient()", err);
    }
  }
}
