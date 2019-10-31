import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";

import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";

@Component({
    selector: "app-asset-review",
    templateUrl: "./asset-review.component.html",
    styleUrls: ["./asset-review.component.css"]
})
export class AssetReviewComponent implements OnInit {
    public errMsg:string = "";
    public isError:boolean = false;
    public backupObj:any;
    public assetObj:any;
    public assetFinal:any;
    private routeObj: any;
    currentPath: string;
    constructor(
        public dialog: MatDialog,
        public util:UtilService,
        public http:HttpService,
        public global:GlobalService,
        public router: Router,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        this.util.setWindowHeight();
        this.util.setPageTitle(this.route);
        this.currentPath = this.router.url.split("/")[this.router.url.split("/").length - 1];
        if (this.router.url.split("/")[2] === "csa-onboarding") {
            this.routeObj = { "list": "/csa-onboarding/guide", "add": "/inventory/csa-onboarding/add-asset" }
        }else {
            this.routeObj = { "list": "/inventory/csa/asset-list/0", "add": "/inventory/csa/add-asset" }
        }
        this.router.url.split("/")[this.router.url.split("/").length - 1] == "add-asset" ?
        this.router.url.split("/")[2] === "csa" ? this.util.menuChange({"menu":3,"subMenu":20}) :
        this.util.menuChange({"menu": "guide", "subMenu": ""}) : "";
        if (sessionStorage.getItem("ASSET_NEW")) {
            this.backupObj = JSON.parse(sessionStorage.getItem("ASSET_NEW"));
            this.assetObj = JSON.parse(sessionStorage.getItem("ASSET_NEW"));
            this.assetFinal = JSON.parse(sessionStorage.getItem("ASSET_NEW"));
            this.assetObj.scan_code = this.assetObj.scan_code == "" ? "System Generated" : this.assetObj.scan_code;
            console.log("this.assetObj::::", this.assetObj);
        }
    }
    addAsset() {
        const self = this;
        try {
            self.util.addSpinner("submit-asset", "Submit");
            this.errMsg = "";
            this.isError = false;
            const quantityStatus = self.assetFinal.quantity_status;
            const finacialObj = self.assetFinal.financials[0];
            self.assetFinal.scan_code = self.assetFinal.scan_code === "" ? "" : self.assetFinal.scan_code;
            self.assetFinal["is_metal_barcode"] = self.assetFinal.scan_code === "" ? 0 : 1;
            self.assetFinal["status"] = 1;
            delete self.assetFinal.location;
            delete self.assetFinal.manf_part;
            if ( self.assetFinal.isOwned) {
                delete self.assetFinal.supplierDetails;
                self.assetFinal.present_value = self.assetObj.financials[0].present_value;
            }else if (self.assetFinal.isLeased) {
                delete self.assetFinal.leasedSupplier;
                self.assetFinal.present_value = "";
            }else if (self.assetFinal.isFinanced) {
                delete self.assetFinal.financedSupplier;
                self.assetFinal.present_value = "";
            }
            delete self.assetFinal.isOwned;
            delete self.assetFinal.isLeased;
            delete self.assetFinal.isFinanced;
            delete self.assetFinal.quantity_status;
            self.assetFinal.purchase_date = finacialObj.purchase_date ?
            this.util.getYYYYMMDDDate(this.util.stringToDate(finacialObj.purchase_date)) : "";
            self.assetFinal.start_date = finacialObj.start_date ?
            this.util.getYYYYMMDDDate(this.util.stringToDate(finacialObj.start_date)) : "";
            self.assetFinal.warranty_end_date = finacialObj.warranty_end_date ?
            this.util.getYYYYMMDDDate(this.util.stringToDate(finacialObj.warranty_end_date)) : "";
            if (finacialObj.ownership_type === "Owned") {
                self.assetFinal.supplier_id = finacialObj.supplier_id;
                self.assetFinal.ownership_type = 1;
            } else if (finacialObj.ownership_type === "Leased") {
                self.assetFinal.leased_from = finacialObj.leased_from_id;
                self.assetFinal.ownership_type = 2;
            } else if (finacialObj.ownership_type === "Financed") {
                self.assetFinal.financed_from = finacialObj.financed_from_id;
                self.assetFinal.ownership_type = 3;
            }
             if (finacialObj.ownership_type === "Leased" || finacialObj.ownership_type === "Financed") {
              self.assetFinal.end_date = finacialObj.end_date ?
              this.util.getYYYYMMDDDate(this.util.stringToDate(finacialObj.end_date)) : "";
              self.assetFinal.paid_capital = finacialObj.paid_capital;
              self.assetFinal.monthly_payment = finacialObj.monthly_payment;
              delete self.assetFinal.supplier_id;

            }
            if (finacialObj.ownership_type === "Owned" || finacialObj.ownership_type === "Financed") {
              self.assetFinal.purchase_price = finacialObj.purchase_price;
              self.assetFinal.esti_useful_life = finacialObj.esti_useful_life;
              self.assetFinal.residual_value = finacialObj.residual_value;
            }
            self.assetFinal.warranty_supplier = finacialObj.warranty_supplier_id;
            self.assetFinal.acc_ref_no = finacialObj.acc_ref_no;
            delete self.assetFinal.financials;
            this.http.doPost("inventory/assets/add", self.assetFinal, function(error: boolean, response: any){
                self.util.removeSpinner("submit-asset", "Submit");
                if (error ) {
                    self.isError = true;
                    self.errMsg = response.message + " Please edit the information.";
                }else {
                    sessionStorage.removeItem("ASSET_NEW");
                    self.currentPath === "asset-review" ? self.util.showDialog(DialogComponent, response.message,
                      [self.routeObj.list, self.routeObj.add]) :
                      self.onTheFlyEvent({ "msg": "New item (" + quantityStatus + " item) succesfully added." }, "OTF_ADD_SUCCESS");
                }
            });
        }catch (err) {
            this.global.addException("Assets List","addAsset()",err);
        }
    }

    editAsset() {
        try {
            console.log("asset on review", this.assetObj);
            sessionStorage.setItem("ASSET_OLD", JSON.stringify(this.assetObj));
            sessionStorage.setItem("BACKUP", JSON.stringify(this.backupObj));
            this.currentPath == "asset-review" ? this.router.navigate([this.routeObj.add]) : this.onTheFlyEvent({"step": "S1"});
        }catch(err){
            this.global.addException("Assets List","editAsset()",err);
        }
    }
    cancelAsset(){
        try{
            sessionStorage.removeItem("ASSET_NEW")
            this.currentPath == "asset-review" ? this.router.navigate([this.routeObj.list]) : this.onTheFlyEvent({"step": "S0"});
        }catch(err){
            this.global.addException("Assets List","cancelAsset()",err);
        }
    }
    onTheFlyEvent(data: any, source: string = "ON_THE_FLY_ASSET"): void {
        try {
            this.util.changeEvent({
                "source": source,
                "action": "ADD",
                "data": data
            });
        }catch (err) {
            this.global.addException("Assets List","onTheFlyEvent()",err);
        }
    }
}
