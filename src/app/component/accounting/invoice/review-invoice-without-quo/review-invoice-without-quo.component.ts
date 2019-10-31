import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { GlobalService } from '../../../../shared/service/global.service';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';
import { APP_CONFIG, AppConfig } from '../../../../app-config.module';

@Component({
    selector: 'app-review-invoice-without-quo',
    templateUrl: './review-invoice-without-quo.component.html',
    styleUrls: ['./review-invoice-without-quo.component.css']
})
export class ReviewInvoiceWithoutQuoComponent implements OnInit {
    
    pageData:any;
    formData:any;
    private routeObj: any;
    public errMsg:string = '';
    public isError:boolean = false;
    public isSendInvoices:boolean = true;
    constructor(
        public dialog: MatDialog,
        public util:UtilService,
        public http:HttpService,
        public router: Router,
        private global: GlobalService,
        public route: ActivatedRoute,
        @Inject(APP_CONFIG)
        private config: AppConfig
    ) { }

    ngOnInit() {

        this.util.menuChange({'menu':7,'subMenu':33});

        this.util.setPageTitle(this.route);

        this.util.setWindowHeight();

        this.routeObj = { 'list': '/account/csa/invoice-list/0', 'add': '/account/csa/new-invoice-without-quotation' }

        if (sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO')) {
            
            this.pageData = JSON.parse(sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO'));  
            this.formData = JSON.parse(sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO')); 

            console.log(`pageData => `, this.pageData);
            console.log(`formData => `, this.formData);
        }
    }

    IsSendInvoice(isSend){

        this.isSendInvoices = isSend.isSendInvoices;
    }

    collectAdHocServices() {
        
        return new Promise((resolve) => {

            let servicesContainer = [];
            let productAndMaterial = [];
            this.formData.services = [];
            this.formData.product_materials = [];

            if (this.pageData.services.length > 0) {
        
                (this.pageData.services).forEach((element, index) => {
                    servicesContainer.push(element);
                });
            }

            if (this.pageData.product_materials.length > 0) {
        
                (this.pageData.product_materials).forEach((element, index) => {
                    productAndMaterial.push(element);
                });
            }

            if (this.pageData.additional_items.length > 0) {
        
                (this.pageData.additional_items).forEach((element, index) => {
                    
                    if (element.is_hoc_service) {

                        servicesContainer.push({
                            "invoice_service_id" : element.invoice_service_id,
                            "ad_hoc_service"     : element.ad_hoc_service,
                            "service_definition" : element.ad_hoc_service,
                            "cost"               : element.cost,
                            "quantity"           : element.quantity,
                            "total_amount"       : element.total_amount
                        });

                    } 
                    
                    if (element.is_hoc_service == false && element.service_definition_id) {

                        servicesContainer.push({
                            "invoice_service_id"    : element.invoice_service_id,
                            "service_definition_id" : element.service_definition_id,
                            "service_definition"    : element.name,
                            "cost"                  : element.cost,
                            "quantity"              : element.quantity,
                            "total_amount"          : element.total_amount,
                            "details"               : element.details
                        });

                    } 
                    
                    if (element.is_hoc_service == false && element.item_def_id) {

                        productAndMaterial.push({
                            "invoice_product_material_id" : element.invoice_product_material_id,
                            "type"                  : element.type,
                            "item_def_id"           : element.item_def_id,
                            "item_definition_name"  : element.name,
                            "cost"                  : element.cost,
                            "quantity"              : element.quantity,
                            "total_amount"          : element.total_amount,
                            "details"               : element.details,
                            "uom"                   : element.uom
                        });

                    }

                });
            }

            this.formData.services = servicesContainer;
            this.formData.product_materials = productAndMaterial;

            resolve(this.formData);

        });
    }

    sendInvoice() {

        this.util.addSpinner('send', "Submit");
      
        try {
            
            this.isError = false;

            this.errMsg = '';

            this.collectAdHocServices().then( ()  => {
                
                this.formData.due_date = this.util.getYYYYMMDDDate(this.formData.due_date);

                Object.assign(this.formData, {
                    isSendInvoices : this.isSendInvoices,
                    isPreview      : false
                });

                this.http.doPost('financials/invoices/create', this.formData, (error: boolean, response: any) => {

                    this.util.removeSpinner('send', "Submit");

                    if (error) {

                        this.isError = true;

                        this.errMsg = response.message;

                    } else {

                        sessionStorage.removeItem('INV_DETAILS_WITHOUT_QUO');
                        sessionStorage.removeItem('CREATE_INVOICE_WITHOUT_QUO');

                        this.formData = response.data;
                        
                        Object.assign(this.formData, {
                            is_edit : true
                        });

                        this.util.showDialog(DialogComponent, response.message, [this.routeObj.list, this.routeObj.add]);
                    }
                });

            });

        } catch (err) {

            this.global.addException('Invoice - Review Invoice', 'sendInvoice()', err);
        }    
    }

    previewDoc(): void {
        this.previewDataSave('previewBtn', "Save & Preview",'PREVIEW');
    }

    previewDataSave(btnId, btnTxt, actionDoc) {

        this.util.addSpinner(btnId, btnTxt);

        try {

            this.isError = false;

            this.errMsg = '';

            this.collectAdHocServices().then( ()  => {

                this.formData.due_date = this.util.getYYYYMMDDDate(this.formData.due_date);

                Object.assign(this.formData, {
                    isSendInvoices : this.isSendInvoices,
                    isPreview      : true
                });

                this.http.doPost('financials/invoices/create', this.formData, (error: boolean, response: any) => {

                    this.util.removeSpinner(btnId, btnTxt);

                    if (error) {

                        this.isError = true;

                        this.errMsg = response.message;

                    } else {

                        sessionStorage.removeItem('INV_DETAILS_WITHOUT_QUO');

                        var randomNo = response.data.invoice_random_number;

                        this.formData = response.data;
                        
                        Object.assign(this.formData, {
                            is_edit : true
                        });
                       
                        var previewLink =
                        this.config.pdfEndpoint +
                        "invoice/" +
                        randomNo;

                        if (actionDoc === 'PREVIEW'){
                            this.preview(previewLink);
                        } 
                    }

                });
                
            });

        } catch(err) {

            this.global.addException('Invoice - Review Invoice', 'previewDataSave()', err);
        }    
    }

    edit() {
        
        this.collectAdHocServices().then( () => {

            this.formData.additional_items = [];

            this.formData.due_date = this.pageData.due_date;
            
            sessionStorage.setItem('INV_DETAILS_WITHOUT_QUO', JSON.stringify(this.formData));
                
            this.router.navigate(['/account/csa/new-invoice-without-quotation']);

        });

    }

    cancel() {

        sessionStorage.removeItem('CREATE_INVOICE_WITHOUT_QUO');
        sessionStorage.removeItem('INV_DETAILS_WITHOUT_QUO');

        this.router.navigate(['/account/csa/invoice-list/0']);
    }

    preview(dataPreview) {
        window.open(dataPreview);
    }
}
