import { Component, OnInit, AfterViewInit,OnChanges, DoCheck } from "@angular/core";
import { AdminService } from "../admin.service";
import { HttpService } from "../../../shared/service/http.service";
import { UtilService } from "../../../shared/service/util.service";
import { ExportService } from "../../../shared/service/export.service";
import { GlobalService } from "../../../shared/service/global.service";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";

declare var $: any;
@Component({
  selector: "app-print-label",
  templateUrl: "./print-label.component.html",
  styleUrls: ["./print-label.component.css"]
})
export class PrintLabelComponent implements OnInit, AfterViewInit, DoCheck {
  public pageData: any = {
    "labelType": "location",
    "locList": [],
    "assetsList": [],
    "productList": [],
    "selItemList": [],
    "printList": []
  };
  selItemList: Observable < any[] >;
  public onBoarding = false;
  public promiseTask: any;
  constructor(
    public util: UtilService,
    private route: ActivatedRoute,
    private http: HttpService,
    private admin: AdminService,
    private global: GlobalService,
    private exportDoc: ExportService,
  ) {}

  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.util.menuChange({
      "menu": 2,
      "subMenu": 18
    });

    $(function () {
      const thHeight = $("table#lblToPrintTbl th:first").height();
      $("table#lblToPrintTbl th").resizable({
        handles: "e",
        minHeight: thHeight,
        maxHeight: thHeight,
        minWidth: 40,
        resize: function (event, ui) {
          const sizerID = "#" + $(event.target).attr("id") + "-sizer";
          $(sizerID).width(ui.size.width);
        }
      });
    });
    this.getLocationTags();
  }
  ngAfterViewInit() {
    // this.pageData.selItemList
  }
  ngDoCheck() {
    // console.log(this.pageData.selItemList,this.pageData.selItemList.length);
  }
  getLocationTags() {
    const self = this;
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("admin/labels/locations", (error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException("print label", "getLocationTags()", response);
          return;
        } else {
          self.pageData.locList = response.data ?
            response.data.filter(item => (item.name = item.location_tag,
              item.labelType = "location", item.noOfCopy = 1, item.scanCode = item.scan_code, item.id = item.location_tag_id)) : [];
        }
        self.getAssetList();
      });
    } catch (err) {
      this.global.addException("print label", "getLocationTags()", err);
    }
  }
  showLoader() {
    // setTimeout(() => {
     this.util.showProcessing("processing-spinner");

    // }, 100);
  }
  getProductList() {
    const self = this;
    try {
      this.http.doGet("admin/labels/products", (error: boolean, response: any) => {
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException("print label", "getProductList()", response);
          return;
        } else {
          if (response.data.length > 0) {
            self.pageData.productList = response.data ?
              response.data.filter(item => (item.name = item.item_definition_name,
                item.labelType = "products", item.noOfCopy = 1,
                item.scanCode = item.upc, item.id = item.item_def_id)) : [];

          }
        }
        if (self.pageData.locList.length === 0 && self.pageData.productList.length === 0 && self.pageData.assetsList.length === 0) {
          self.onBoarding = true;
        }
      });
    } catch (err) {
      this.global.addException("print label", "getProductList()", err);
    }
  }

  getAssetList() {
    const self = this;
    try {
      this.http.doGet("admin/labels/assets", (error: boolean, response: any) => {
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException("print label", "getAssetList()", response);
          return;
        } else {
          self.pageData.assetsList = response.data ?
            response.data.filter(item => (item.name = item.short_tag,
              item.labelType = "assets", item.noOfCopy = 1,
              item.scanCode = item.scan_code, item.id = item.asset_id)) : [];
        }
        self.getProductList();
      });
    } catch (err) {
      this.global.addException("print label", "getAssetList()", err);
    }
  }

  // ----- :: LOCATION :: -----
  addItemToPrint(listFrom, listTo, index, id): void {
    for (let i = 0; i < listFrom.length; i++) {
      if (listFrom[i].id == id) {
        listFrom[i].noOfCopy = 1;
        listTo.push(listFrom[i]);
        listFrom.splice(i, 1);
        break;
      }
    }
    this.updatePrintTable(listTo);
  }

  removeItemFromPrint(listFrom, listTo, index, id): void {
    try {
      //  this.util.showProcessing("processing-spinner");
       setTimeout(() => {
           for (let i = 0; i < listFrom.length; i++) {
              if (listFrom[i].id == id) {
                if (listFrom[i].labelType == "location")
                  this.pageData.locList.push(listFrom[i]);
                else if (listFrom[i].labelType == "assets")
                  this.pageData.assetsList.push(listFrom[i]);
                else
                  this.pageData.productList.push(listFrom[i]);
                listFrom.splice(i, 1);
              }
          }
      this.updatePrintTable(listFrom);
       }, 0);
    } catch (err) {
      this.global.addException("print label", "removeItemFromPrint()", err);
    }
  }

 doAsyncTask(listFrom, listTo) {
  Promise.resolve("done")
  .then(
    (val) => {
      this.util.showProcessing("processing-spinner");
      // console.log(val);
    },
    (err) => console.error(err)
  )
  .then(
    (val) => {
      setTimeout(() => {
        this.addItemToPrintAll(listFrom, listTo);
      }, 100);
      // console.log(val);
     },
    (err) => console.error(err)
  );
// 'done'
// 'done2'
}
  addItemToPrintAll(listFrom, listTo): void {
    for (let i = 0; i < listFrom.length; i) {
      listFrom[i].noOfCopy = 1;
      listTo.push(listFrom[i]);
      listFrom.splice(i, 1);
     // //console.log(i, listFrom, listTo);
    }
    this.updatePrintTable(listTo);
  }

  updateNoOfCopy(list, option, index): void {
    if (option == "+") {
      list[index].noOfCopy++;
    } else {
      list[index].noOfCopy = list[index].noOfCopy == 0 ? 0 : list[index].noOfCopy - 1;
    }
    this.updatePrintTable(list);
  }

  updateNoOfCopyOnInput(list, index): void {
    this.updatePrintTable(list);
  }

  updatePrintTable(list): void {
    const count = 0,
      j = 0,
      labelList: any = [];
    try {
      this.pageData.printList = [];
      for (let i = 0; i < list.length; i++) {
        if (i === 0 ) {
        //  this.util.showProcessing("processing-spinner");
        }
        for (let k = 0; k < list[i].noOfCopy; k++) {
          this.pageData.printList.push(list[i]);
          if ( i === list.length - 1 && k === list[i].noOfCopy - 1 ) {
             // console.log("full end", k, i);
          }
        }
        if ( i === list.length - 1) {
            this.util.hideProcessing("processing-spinner");
            // console.log("end");
        }
      }

    } catch (err) {
      this.global.addException("print label", "updatePrintTable()", err);
    }
  }

  onItemDrop(e: any) {
    try {
      // Get the dropped data here
      this.pageData.selItemList.push(e.dragData);
      let currentList: any[] = [];
      if (e.dragData.labelType == "location")
        currentList = this.pageData.locList;
      else if (e.dragData.labelType == "assets")
        currentList = this.pageData.assetsList;
      else
        currentList = this.pageData.productList;
      if (currentList.length > 0) {
        for (let i = 0; i < currentList.length; i++) {
          // console.log(currentList[i].id + "==" + e.dragData.id);
          if (currentList[i].id == e.dragData.id) {
            currentList.splice(i, 1);
            this.updatePrintTable(this.pageData.selItemList);
            return;
          }
        }
      }
    } catch (err) {
      this.global.addException("print label", "onItemDrop()", err);
    }
  }

  cancel() {
    try {
      this.util.showProcessing("processing-spinner");
        setTimeout(() => {
      for (let i = this.pageData.selItemList.length - 1; i >= 0; i--) {
        if (this.pageData.selItemList[i].labelType == "location") {
          this.pageData.locList.push(this.pageData.selItemList[i]);
        } else if (this.pageData.selItemList[i].labelType == "assets") {
          this.pageData.assetsList.push(this.pageData.selItemList[i]);
        } else {
          this.pageData.productList.push(this.pageData.selItemList[i]);
        }
        this.pageData.selItemList.splice(i, 1);
        if (i === 0) {
          this.util.hideProcessing("processing-spinner");
        }
      }
      this.updatePrintTable(this.pageData.selItemList);
        }, 100);
      //  this.util.hideProcessing("processing-spinner");
    } catch (err) {
      this.global.addException("print label", "cancle()", err);
    }
  }

  printPreview(id): void {
    this.admin.printPreview(id);
  }

  exportpdf(): void {
    this.exportDoc.downloadLabel("print-section");
  }
}
