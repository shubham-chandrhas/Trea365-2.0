import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

import { UtilService } from '../../../shared/service/util.service';
import { HttpService } from '../../../shared/service/http.service';
import { AdminService } from '../../admin/admin.service';
import { GlobalService } from '../../../shared/service/global.service';
import { DialogComponent } from '../../../shared/model/dialog/dialog.component';
declare var $ :any;

@Component({
    selector: '',
    templateUrl: './purchase-order-dialog.component.html',
    styleUrls: ['./purchase-order-dialog.component.css']
})
  
export class PurchaseOrderDialog{
    public errMsg: string = '';
    public successMsg: string = '';
    public isSuccess: boolean = false;
    public isError: boolean = false;
    public action: string;
    public dataId: any;
    addApproveConfirmationNoteForm:FormGroup;
    routeObj: any;
    constructor(
        private util: UtilService,
        private router: Router,
        private http:HttpService,
        private admin: AdminService,
        private global: GlobalService,
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<PurchaseOrderDialog>, 
        @Inject(MAT_DIALOG_DATA) public dataObj: any, 
    ) {
        this.action = dataObj.action;
        this.dataId = dataObj.dataId;
        this.successMsg = this.dataObj.successMsg;
    }

    ngOnInit() {
        this.routeObj = { 'list': '/inventory/po/csa/purchase-order-list/0', 'add': '/inventory/po/csa/new-purchase-order' }
        this.createApproveConfirmationForm();
    }

     
    closeDialog(): void {
        this.dialogRef.close();
    }

    addSuccess(){
        this.closeDialog();
        this.router.navigate(['/inventory/po/csa/purchase-order-list/0']);
        
        // if(this.router.url.split('/')[2]=='csa-onboarding'){
        //     this.router.navigate(['/inventory/csa-onboarding/purchase-order-list/0']);
        // }else{
        //     this.router.navigate(['/inventory/po/csa/purchase-order-list/0']);
        // }
    }

    removeData() {
        try {
            var self = this;
            let reqObj: any = {};
            reqObj.asset_id = this.dataId;

            console.log(reqObj);
            $('#removeButton').addClass('ptrN');
            $('#removeButton').html('<i class="fa fa-spinner fa-pulse fa-3x fa-fw action"></i> Yes');
            this.http.doPost('assets/delete', reqObj, function (error: boolean, response: any) {
                $('#removeButton').removeClass('ptrN');
                $('#removeButton').html('Yes');
                console.log(response);
                if (error) {
                    self.isError = true;
                    self.errMsg = response.message;
                    console.log("error");
                } else {
                    self.isSuccess = true;
                    self.successMsg = response.message;
                    self.admin.deleteRecordFromList(response.status);
                }
            });
        }
        catch (err) {
            this.global.addException('Tracker', 'removeData()', err);
        }
    }

    public createApproveConfirmationForm(){
        this.addApproveConfirmationNoteForm = this.fb.group({
            approve_note: new FormControl(''),
        });
    }

    confirmPO(){
        let self = this;
        try{
            this.isError = false;
            this.errMsg = '';
            let reqObj:any = JSON.parse(JSON.stringify(this.dataObj.dataObj.allData.purchaseOrder));
            console.log("JSON response ::",JSON.parse(JSON.stringify(this.dataObj.dataObj.allData.purchaseOrder)));
            reqObj.items = JSON.parse(JSON.stringify(this.dataObj.dataObj.allData.purchaseOrder.items));
            reqObj.status = "4";
            reqObj.approve_note = this.addApproveConfirmationNoteForm.value.approve_note;
            console.log(reqObj);
            let url
            if(this.util.poID != '0'){
                url = 'purchase-order/update';  
                reqObj.purchase_order_id = this.util.poID;
            }else{
                url = 'purchase-order/create';
            }
            self.util.addSpinner('confirm-btn', "Confirm");
            this.http.doPost(url, reqObj, function(error: boolean, response: any){
                self.util.removeSpinner('confirm-btn', "Confirm");
                console.log(error);
                console.log(response);
                if( error ){
                    self.isError = true;
                    self.errMsg = response.message;
                    self.global.addException('Purchase Order Review','createPurchaseOrder()',response);
                }else{
                    self.closeDialog();
                    sessionStorage.removeItem('PO_INFO');
                    self.util.showDialog(DialogComponent, response.message, self.util.poID != '0' ? [ self.routeObj.list ] : [ self.routeObj.list, self.routeObj.add ]);
                }
            });
        }catch(err){
            this.global.addException('Purchase Order Review','createPurchaseOrder()',err);
        }
    }
}