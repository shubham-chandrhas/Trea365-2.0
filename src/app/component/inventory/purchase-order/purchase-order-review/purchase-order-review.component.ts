import { Component, OnInit } from "@angular/core";

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import {  Subscription } from 'rxjs';

import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { PurchaseOrderDialog } from "../purchase-order-dialog.component";

declare var $: any;
@Component({
  selector: "app-purchase-order-review",
  templateUrl: "./purchase-order-review.component.html",
  styleUrls: ["./purchase-order-review.component.css"]
})
export class PurchaseOrderReviewComponent implements OnInit {
  public backupData: any = {};
  public pageData: any = {};
  public userInfo: any;
  today: number = Date.now();
  public editMode: boolean = false;
  public isExistingOrder: boolean = false;
  public orderStatus: any = "Saved";
  private routeObj: any;
  poId: any = "";
  isError: boolean = false;
  public errMsg: string = "";
  currentPath: string;

  subscription: Subscription;

  constructor(
    public dialog: MatDialog,
    public util: UtilService,
    public http: HttpService,
    public global: GlobalService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const self = this;
    this.orderStatus = null;
    this.isError = false;
    this.errMsg = "";
    this.util.menuChange({ menu: 3, subMenu: 22 });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.currentPath = this.router.url.split("/")[
      this.router.url.split("/").length - 1
    ];
    window.scrollTo(0, 0);
    this.routeObj = {
      list: "/inventory/po/csa/purchase-order-list/",
      add: "/inventory/po/csa/new-purchase-order"
    };
    if (localStorage.getItem("USER")) {
      this.userInfo = JSON.parse(atob(localStorage.getItem("USER")));
      console.log(this.userInfo);
    }
    this.subscription = this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source === "PURCHASE_ORDER") {
        console.log("Subscribe ::", dataObj);
        this.editMode = false;
        this.errMsg = "";
        self.pageDataInit(dataObj);
        this.poId =
          dataObj.data.purchase_order_id && dataObj.data.purchase_order_id != ""
            ? dataObj.data.purchase_order_id
            : "";
        sessionStorage.getItem("POID")
          ? $("html,body").find("#poMark").length > 0
            ? ($("html,body").animate(
                { scrollTop: $("#poMark").offset().top },
                1500
              ),
              sessionStorage.removeItem("POID"))
            : ""
          : "";
      }
    if (dataObj && dataObj.source == "PO_SAVED") {
        this.editMode = false;

    }

    });

    if (sessionStorage.getItem("PO_INFO")) {
      this.orderStatus = null;
      this.poId =
        this.pageData &&
        this.pageData.purchase_order_id &&
        this.pageData.purchase_order_id != ""
          ? this.pageData.purchase_order_id
          : "";
      this.isExistingOrder =
        this.currentPath != "purchase-order-review"
          ? true
          : this.util.poID == "0"
          ? false
          : true;
      this.backupData = JSON.parse(sessionStorage.getItem("PO_INFO"));
      this.pageData = JSON.parse(sessionStorage.getItem("PO_INFO"));

      console.log("sessionStorage.getItem('PO_INFO')", this.pageData);
      this.pageData.supplierName = this.pageData.purchaseOrder.supplier;
    }
    if (this.util.poAction == "back_to_edit") {
      this.editMode =
        this.currentPath != "purchase-order-review" ? true : false;
      console.log("this.editMode :: ",this.editMode);
    } else {
       this.editMode = false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  pageDataInit(getObj: any) {
    try {
      const obj = getObj.data;
      this.isExistingOrder =
        this.currentPath != "purchase-order-review"
          ? true
          : this.util.poID == "0"
          ? false
          : true;
      this.pageData = obj;
      this.pageData.redirectFrom = getObj.redirectFrom;
      this.orderStatus = this.pageData.po_status ? this.pageData.po_status.status : '';
      const purchaseOrder: any = [];
      let purchase_items: any[] = [];
      purchase_items = obj.order_items;
      purchaseOrder.items = purchase_items;
      this.pageData.purchaseOrder = purchaseOrder;
      this.pageData.supplierName = this.pageData.supplier ? this.pageData.supplier.supplier_name : '';

      Object.assign(this.pageData.purchaseOrder, {
            'comment' : this.pageData.comment,
            'status' : this.pageData.status,
            'purchase_order_id' : this.pageData.purchase_order_id
      });
    //   this.pageData.purchaseOrder.comment = this.pageData.comment;
    //   this.pageData.purchaseOrder.status = this.pageData.status;
    //   this.pageData.purchaseOrder.purchase_order_id = this.pageData.purchase_order_id;
    } catch (err) {
      this.global.addException("Purchase Order Review", "pageDataInit()", err);
    }
  }

  createPurchaseOrder(type) {
    let self = this;
    self.isError = false;
    self.errMsg = "";
    let url = "";
    try {
      let reqObj: any = {};
      reqObj = JSON.parse(JSON.stringify(this.pageData.purchaseOrder));
      if (this.util.poID && this.util.poID != "0") {
        url = "purchase-order/update";
        reqObj.purchase_order_id = this.util.poID;
      } else {
        url = "purchase-order/create";
      }

      if (type == 1) {
        self.util.addSpinner("addData", "Save");
      }
      this.http.doPost(url, reqObj, function(error: boolean, response: any) {
        self.util.removeSpinner("addData", "Save");
        self.util.removeSpinner(
          "sendOrderToSupplier" + type,
          "Send Order to Supplier"
        );
        if (error) {
          self.isError = true;
          self.errMsg = response.message;
          self.global.addException("Purchase Order Review", "createPurchaseOrder()", response);
        } else {
          self.util.poID = "0";
          sessionStorage.removeItem("PO_INFO");
          self.util.showDialog(
            DialogComponent,
            response.message,
            self.util.poID && self.util.poID != "0"
              ? [self.routeObj.list + "0"]
              : [self.routeObj.list + "0", self.routeObj.add]
          );
        }
      });
    } catch (err) {
      this.global.addException(
        "Purchase Order Review",
        "createPurchaseOrder()",
        err
      );
    }
  }
  editPurchaseOrder(obj: any, type) {
    try {
      const typeId = this.pageData.type ? this.pageData.type : 1;
      if (this.util.poID && this.util.poID != "0" ) {
        this.util.poAction = "back_to_edit";
      } else {
        this.util.poAction = "";
        this.util.poID = obj.purchase_order_id;
      }
      if (type == "backup") {
        console.log(this.backupData);
        this.editMode = false;

        sessionStorage.setItem("PO_INFO", JSON.stringify(this.backupData));
        if (this.util.poID && this.util.poID != "0" ) {
          this.router.navigate([this.routeObj.list + "/" + this.util.poID]);
        } else {
          this.router.navigate([this.routeObj.add]);
        }
      } else {
        this.editMode = true;
        sessionStorage.setItem("PO_INFO", JSON.stringify(obj));
        
      }
    } catch (err) {
      this.global.addException(
        "Purchase Order Review",
        "editPurchaseOrder()",
        err
      );
    }
  }
  cancel() {
    sessionStorage.removeItem("PO_INFO");
    this.router.navigate([this.routeObj.list + "0"]);
  }
  continueReceiving(obj: any) {
    console.log(obj);
  }
  receiveItems(obj: any) {
    console.log(obj);
    sessionStorage.setItem("po", JSON.stringify(obj));
    this.router.navigate(["/inventory/rs/csa/add-receiving-slip"]);
  }
  sendOrderToSupplier(obj: any, type) {
    let self = this;
    self.isError = false;
    self.errMsg = "";
    try {
      console.log(obj);

        this.errMsg = "";
        self.util.addSpinner(
          "sendOrderToSupplier" + type,
          "Send Order to Supplier"
        );
        if (type == 1) {
          this.pageData.purchaseOrder.status = '2';
          this.createPurchaseOrder(1);
        } else {
            let reqObj: any = {};
            reqObj.purchase_order_id = obj.purchase_order_id;
            reqObj.status = '2';
          this.http.doPost(
            "purchase-order/update/status",reqObj,
            function(error: boolean, response: any) {
              console.log(response);
              self.util.removeSpinner(
                "sendOrderToSupplier" + type,
                "Send Order to Supplier"
              );
              if (error) {
                self.global.addException(
                    "Purchase Order Review",
                    "sendOrderToSupplier()",
                    response
                  );
                self.isError = true;
                self.errMsg = response.message;
              } else {
                self.util.showDialog(
                  DialogComponent,
                  response.message,
                  type == "2"
                    ? [self.routeObj.list + obj.purchase_order_id]
                    : [
                        self.routeObj.list + obj.purchase_order_id,
                        self.routeObj.add
                      ]
                );
                self.util.changeEvent({
                  source: "PO_SENT",
                  action: "VIEW",
                  data: obj
                });
              }
            }
          );
        }

    } catch (err) {
      this.global.addException(
        "Purchase Order Review",
        "sendOrderToSupplier()",
        err
      );
    }
  }
  

  approvePOFromReview(data: any, type) {
    this.dialog.open(PurchaseOrderDialog, {
      data: {
        action: "approveConfirmation",
        dataObj: { allData: data, type: type }
      },
      autoFocus: false
    });
  }

  approvePurchaseOrder(obj: any) {
    let self = this;
    try {
      this.errMsg = "";
        self.util.addSpinner("approvePurchaseOrder", "Approve");
        let reqObj: any = {};
            reqObj.purchase_order_id = obj.purchase_order_id;
            reqObj.status = '4';
        this.http.doPost(
          "purchase-order/update/status",reqObj,
          function(error: boolean, response: any) {
            console.log(response);
            self.util.removeSpinner("approvePurchaseOrder", "Approve");
            if (error) {
              // console.log('error');
              this.errMsg = response.message;
              self.global.addException(
                "Purchase Order Review",
                "approvePurchaseOrder()",
                response
              );
            } else {
              self.util.showDialog(DialogComponent, response.message, [
                self.routeObj.list + obj.purchase_order_id
              ]);
              self.util.changeEvent({
                source: "PO_SENT",
                action: "VIEW",
                data: { obj: obj, purchase_order_id: obj.purchase_order_id }
              });
            }
          }
        );

    } catch (err) {
      this.global.addException(
        "Purchase Order Review",
        "approvePurchaseOrder()",
        err
      );
    }
  }

  cancelPurchaseOrder(obj: any) {
    let self = this;
    try {
      this.errMsg = "";
        self.util.addSpinner("cancelPurchaseOrder", "Cancel P/O");
        let reqObj: any = {};
            reqObj.purchase_order_id = obj.purchase_order_id;
            reqObj.status = '7';
        this.http.doPost(
          "purchase-order/update/status",reqObj,
          function(error: boolean, response: any) {
            console.log(response);
            self.util.removeSpinner("cancelPurchaseOrder", "Cancel P/O");
            if (error) {
              // console.log('error');
              this.errMsg = response.message;
              self.global.addException(
                "Purchase Order Review",
                "cancelPurchaseOrder()",
                response
              );
            } else {
              self.util.changeEvent({
                source: "PO_SENT",
                action: "VIEW",
                data: { obj: obj, purchase_order_id: obj.purchase_order_id }
              });  
              self.util.showDialog(DialogComponent, response.message, [
                self.routeObj.list + obj.purchase_order_id
              ]);
              
            }
          }
        );

    } catch (err) {
      this.global.addException(
        "Purchase Order Review",
        "approvePurchaseOrder()",
        err
      );
    }
  }

  resendMail(emailLog: any, id) {
    console.log(emailLog);
    let self = this;
    try {
      this.errMsg = "";
      self.util.addSpinner("resendEmail", "Resend");
      this.http.doGet("resend-email/" + emailLog.email_logs_id, function(
        error: boolean,
        response: any
      ) {
        console.log(response);
        self.util.removeSpinner("resendEmail", "Resend");
        if (error) {
          // console.log('error');
          this.errMsg = response.message;
        } else {
          self.util.showDialog(DialogComponent, response.message, [
            self.routeObj.list + id
          ]);
          self.util.changeEvent({
            source: "PO_SENT",
            action: "VIEW",
            data: { emailLog: emailLog, id: id }
          });
          // console.log('no error');
        }
      });
    } catch (err) {
      this.global.addException("Purchase Order Review", "resendMail()", err);
    }
  }

  //    Delete Purchase Order
  deletePurchaseOrder(obj: any) {
    console.log(obj.purchase_order_id);
    let self = this;
    try {
      let data: any = {
        API_URL: "purchase-order/delete",
        reqObj: {
          purchase_order_id: obj.purchase_order_id
        },
        event: {
          source: "CANCEL_PO",
          action: "DELETE"
        }
      };
      this.util.showDialog(
        DialogComponent,
        "Are you sure you want to delete P/O No: " +
          this.pageData.purchase_order_no +
          " ?",
        [],
        "Delete Confirmation ?",
        "CONFIRMATION",
        data
      );
    } catch (err) {
      this.global.addException("Purchase Order Review", "deletePurchaseOrder()", err);
    }
  }
}
