import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith ,  map } from 'rxjs/operators';
import { ElementRef, NgZone, ViewChild } from '@angular/core';

import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { GlobalService } from '../../../../shared/service/global.service';
import { ConstantsService } from '../../../../shared/service/constants.service';

import { WorkOrderDialog } from '../work-order-dialog.component';
import { WorkOrderService } from '../work-order.service';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';
import { APP_CONFIG, AppConfig } from '../../../../app-config.module';



@Component({
    selector: 'app-work-order-review',
    templateUrl: './work-order-review.component.html',
    styleUrls: ['./work-order-review.component.css']
})
export class WorkOrderReviewComponent implements OnInit {
    public userInfo:any;
    today: number = Date.now();
    public pageData:any;
    public repeatOn:any[] = [];
    private routeObj: any;
    public isExternalWO:boolean = false;
    public errMsg: string = '';
    public isError: boolean = false;

    woType: string;
    constructor(
        public dialog: MatDialog,
        public util:UtilService,
        public http:HttpService,
        public global:GlobalService,
        public router: Router, 
        private route: ActivatedRoute,
        private fb: FormBuilder,
        public constant: ConstantsService,
        private WOService: WorkOrderService,
        @Inject(APP_CONFIG)
        private config: AppConfig 
    ) { }

    ngOnInit() {
        this.util.menuChange({'menu':4,'subMenu':26});
        window.scrollTo(0, 0);
        this.util.setPageTitle(this.route);
        this.routeObj = { 'list': '/workflow/wo/csa/work-order-list/0', 'add': '/workflow/wo/csa/work-order/services' };
        this.userInfo = JSON.parse(atob(localStorage.getItem('USER')));
        
        console.log("ngOnInit WorkOrderReviewComponent ::: ", JSON.stringify(JSON.parse(sessionStorage.getItem('WO_DETAILS'))));
        this.pageData = sessionStorage.getItem('WO_DETAILS') ? JSON.parse(sessionStorage.getItem('WO_DETAILS')) : {};
        this.woType = this.pageData.project_estimate_id ? 'external' : 'internal'; 

        if(this.woType == 'external'){
            this.pageData.scheduleDetails = this.pageData.scheduleInfo.schedule_items[0];
        }

        
    }

    edit() {
        try {
            sessionStorage.getItem('WO_EDIT') ? "" : this.pageData.assetsDetails ? this.pageData.assetsDetails.filter(item => (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)), item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date)))) : '';

            sessionStorage.getItem('WO_EDIT') ? "" : this.pageData.teamDetails ? this.pageData.teamDetails.filter(item => (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)), item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date)))) : '';

            sessionStorage.getItem('WO_EDIT') ? "" : this.pageData.scheduleInfo.schedule_items.filter(item => (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)), item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date))));

            sessionStorage.getItem('WO_EDIT') ? "" : sessionStorage.setItem('WO_DETAILS', JSON.stringify(this.pageData));

            if (this.woType == 'internal') {
                this.router.navigate(['/workflow/wo/csa/work-order/services']);
            } else {
                this.router.navigate(['/workflow/wo/csa/wo-external/services']);
            }
        }
        catch (err) {
            this.global.addException('Review Quotation', 'edit()', err,{  'routeURL': '/workflow/wo/csa/wo-external/services' + this.pageData.assetsDetails  });
           }
    }

    submit(){
        let self = this;
        self.isError = false;
        self.errMsg = '';
        try{
            let woDetails:any = JSON.parse(JSON.stringify(this.pageData));
            let reqObj: any = {
                'assign_to': 1,
                'status': 1,
                'require_client_sign': this.woType == 'external' ? woDetails.require_client_sign : 0,
    'requirements': this.woType == 'external' ? woDetails.requirements : woDetails.scheduleInfo.requirements,
                'work_order_type': this.woType == 'external' ? 2 : 1,
    'work_order_id': woDetails.work_order_id ? woDetails.work_order_id : '',            
    'is_repairing_asset': this.woType == 'external' ? 0 : woDetails.repairInfo ? woDetails.repairInfo.isRepairingAsset ? 1 : 0 : 0,
                'client_id': this.woType == 'external' ? woDetails.work_location.client_id : '',
                'client_name': this.woType == 'external' ? woDetails.work_location.client_name : '',
                'email_id': this.woType == 'external' ? woDetails.work_location.email_id : '',
                'phone_no': this.woType == 'external' ? woDetails.work_location.phone_no : '',
                'project_estimate_id': this.woType == 'external' ? woDetails.project_estimate_id : '',
                'asset_id': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.asset_id : '',
    'location_id': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location_id : '',
    'location': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location : '',
    'location_tag_id': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location_tag_id : '',
    'location_tag': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location_tag : '',
                'work_location_id': this.woType == 'external' ? woDetails.work_location.client_work_location_id : woDetails.repairInfo ? woDetails.repairInfo.location_id : '',
                'client_work_location': this.woType == 'external' ? woDetails.work_location.client_work_location : woDetails.repairInfo ? woDetails.repairInfo.client_work_location : '',
            };
            
            if(this.woType == 'internal'){
                reqObj.asset_details = woDetails.scheduleInfo.asset_details;
                reqObj.maintenance_request_id = woDetails.scheduleInfo.maintenance_request_id;
                reqObj.supplier_id = woDetails.scheduleInfo.supplier_id;
            }

            woDetails.work_order_id ? reqObj.schedule = [{
                'start_date':  this.util.getYYYYMMDDDate(woDetails.scheduleDetails.start_date),
                'end_date':  this.util.getYYYYMMDDDate(woDetails.scheduleDetails.end_date),
                'start_time': woDetails.scheduleDetails.start_time,
                'start_time_format': woDetails.scheduleDetails.start_time_format,
                'end_time': woDetails.scheduleDetails.end_time,
                'end_time_format': woDetails.scheduleDetails.end_time_format,
                'schedule_type': woDetails.scheduleDetails.schedule_type,
                'scheduling_id': woDetails.scheduleDetails.scheduling_id,
            }] : reqObj.schedule = [{
                'start_date':  this.util.getYYYYMMDDDate(this.util.stringToDate(woDetails.scheduleDetails.start_date)),
                'end_date':  this.util.getYYYYMMDDDate(this.util.stringToDate(woDetails.scheduleDetails.end_date)),
                'start_time': woDetails.scheduleDetails.start_time,
                'start_time_format': woDetails.scheduleDetails.start_time_format,
                'end_time': woDetails.scheduleDetails.end_time,
                'end_time_format': woDetails.scheduleDetails.end_time_format,
                'schedule_type': woDetails.scheduleDetails.schedule_type,
                'scheduling_id': woDetails.scheduleDetails.scheduling_id,
            }];
            reqObj.services = woDetails.servicesDetails.services;
            reqObj.team = woDetails.work_order_id ?  woDetails.teamDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(item.start_date),item.end_date = this.util.getYYYYMMDDDate(item.end_date) )) : woDetails.teamDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)),item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date)) ));

            reqObj.assets = woDetails.work_order_id ?  woDetails.assetsDetails ? woDetails.assetsDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(item.start_date),item.end_date = this.util.getYYYYMMDDDate(item.end_date) )) : [] : woDetails.assetsDetails ? woDetails.assetsDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)),item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date)) )) : [];
            
            reqObj.productMaterial = woDetails.materialsDetails;

            self.util.addSpinner('submit', "Submit");
            this.http.doPost('work-order/save', reqObj, function(error: boolean, response: any){
                self.util.removeSpinner('submit', "Submit");
                console.log(response);
                if( error ){
                    self.isError = true;
                    self.errMsg = response.message;
                }else{
                    sessionStorage.removeItem('PO_INFO');
                    sessionStorage.removeItem('WO_DETAILS');
                    sessionStorage.removeItem('WO_From_Maintenance');
                    
                    self.WOService.WO_DATA = {};
                    self.util.showDialog(DialogComponent, response.message, [self.routeObj.list, self.routeObj.add]);
                }
            });

        }catch(err){
            this.global.addException('Work Order Review','submit()',err);
        }
    }

    previewDoc(): void {
        this.previewDataSave('previewBtn', "Preview",'PREVIEW');
    }
    downloadPDF(): void {
        this.previewDataSave('downloadPDF', "Download as PDF", 'PDF');
    }

    previewDataSave(btnId, btnTxt, actionDoc)
    {
        let self = this;
        self.isError = false;
        self.errMsg = '';
        try{
            let woDetails:any = JSON.parse(JSON.stringify(this.pageData));
            let reqObj: any = {
                'assign_to': 1,
                'status': 1,
                'require_client_sign': this.woType == 'external' ? woDetails.require_client_sign : 0,
    'requirements': this.woType == 'external' ? woDetails.requirements : woDetails.scheduleInfo.requirements,
                'work_order_type': this.woType == 'external' ? 2 : 1,
    'work_order_id': woDetails.work_order_id ? woDetails.work_order_id : '',                
    'is_repairing_asset': this.woType == 'external' ? 0 : woDetails.repairInfo ? woDetails.repairInfo.isRepairingAsset ? 1 : 0 : 0,
                'client_id': this.woType == 'external' ? woDetails.work_location.client_id : '',
                'client_name': this.woType == 'external' ? woDetails.work_location.client_name : '',
                'email_id': this.woType == 'external' ? woDetails.work_location.email_id : '',
                'phone_no': this.woType == 'external' ? woDetails.work_location.phone_no : '',
                'project_estimate_id': this.woType == 'external' ? woDetails.project_estimate_id : '',
                'asset_id': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.asset_id : '',
    'location_id': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location_id : '',
    'location': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location : '',
    'location_tag_id': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location_tag_id : '',
    'location_tag': this.woType == 'external' ? '' : woDetails.repairInfo ? woDetails.repairInfo.location_tag : '',
                'work_location_id': this.woType == 'external' ? woDetails.work_location.client_work_location_id : woDetails.repairInfo ? woDetails.repairInfo.location_id : '',
                'client_work_location': this.woType == 'external' ? woDetails.work_location.client_work_location : woDetails.repairInfo ? woDetails.repairInfo.client_work_location : '',
            };
            
            if(this.woType == 'internal'){
                reqObj.asset_details = woDetails.scheduleInfo.asset_details;
                reqObj.maintenance_request_id = woDetails.scheduleInfo.maintenance_request_id;
                reqObj.supplier_id = woDetails.scheduleInfo.supplier_id;
            }

            woDetails.work_order_id ? reqObj.schedule = [{
                'start_date':  this.util.getYYYYMMDDDate(woDetails.scheduleDetails.start_date),
                'end_date':  this.util.getYYYYMMDDDate(woDetails.scheduleDetails.end_date),
                'start_time': woDetails.scheduleDetails.start_time,
                'start_time_format': woDetails.scheduleDetails.start_time_format,
                'end_time': woDetails.scheduleDetails.end_time,
                'end_time_format': woDetails.scheduleDetails.end_time_format,
                'schedule_type': woDetails.scheduleDetails.schedule_type,
                'scheduling_id': woDetails.scheduleDetails.scheduling_id,
            }] : reqObj.schedule = [{
                'start_date':  this.util.getYYYYMMDDDate(this.util.stringToDate(woDetails.scheduleDetails.start_date)),
                'end_date':  this.util.getYYYYMMDDDate(this.util.stringToDate(woDetails.scheduleDetails.end_date)),
                'start_time': woDetails.scheduleDetails.start_time,
                'start_time_format': woDetails.scheduleDetails.start_time_format,
                'end_time': woDetails.scheduleDetails.end_time,
                'end_time_format': woDetails.scheduleDetails.end_time_format,
                'schedule_type': woDetails.scheduleDetails.schedule_type,
                'scheduling_id': woDetails.scheduleDetails.scheduling_id,
            }];
            reqObj.services = woDetails.servicesDetails.services;
            reqObj.team = woDetails.work_order_id ?  woDetails.teamDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(item.start_date),item.end_date = this.util.getYYYYMMDDDate(item.end_date) )) : woDetails.teamDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)),item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date)) ));

            reqObj.assets = woDetails.work_order_id ?  woDetails.assetsDetails ? woDetails.assetsDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(item.start_date),item.end_date = this.util.getYYYYMMDDDate(item.end_date) )) : [] : woDetails.assetsDetails ? woDetails.assetsDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.start_date)),item.end_date = this.util.getYYYYMMDDDate(this.util.stringToDate(item.end_date)) )) : [];

            reqObj.productMaterial = woDetails.materialsDetails;

            console.log("Request Ext WO ",reqObj);
            self.util.addSpinner(btnId, btnTxt);
            this.http.doPost('work-order/save', reqObj, function(error: boolean, response: any){
                self.util.removeSpinner(btnId, btnTxt);
                console.log(response);
                if( error ){
                    self.isError = true;
                    self.errMsg = response.message;
                }else{
                    sessionStorage.removeItem('PO_INFO');
                    sessionStorage.removeItem('WO_DETAILS');
                    sessionStorage.removeItem('WO_From_Maintenance');
                    localStorage.removeItem('CREATE_WO');
                    self.WOService.WO_DATA = {};
                    var randomNo = response.data.wo_random_number;

                    if(response.data)
                    {
                        let wo_id: number = response.data.work_order_id;
                        // For same page Edit Functionlity 
                        self.pageData.work_order_id = wo_id;
                        self.pageData.servicesDetails.services = response.data.services;
                        self.pageData.materialsDetails = response.data.product_materials;
                        self.pageData.teamDetails = response.data.team;
                        self.pageData.assetsDetails = response.data.assets;
                        self.pageData.scheduleDetails = response.data.schedule;
                        // For form page Edit Functionality
                        const localObj: any = response.data;
                        localObj.scheduleInfo = {};
                        localObj.work_order_id = response.data.work_order_id;
                        localObj.scheduleInfo.supplier_id = response.data.suppliers ?
                            response.data.suppliers.supplier_id :
                            "";
                        localObj.scheduleInfo.supplier_name = response.data.suppliers ?
                            response.data.suppliers.supplier_name :
                            "";
                        localObj.scheduleInfo.requirements = response.data.requirements ?
                            response.data.requirements :
                            "";
                        localObj.scheduleInfo.schedule_items = [];
                        localObj.scheduleInfo.schedule_items.push(response.data.schedule);

                        localObj.services = localObj.services;
                        localObj.product_materials = localObj.product_materials;
                        localObj.assets = response.data.assets;
                        localObj.assets.map(item => {
                            item.is_delete = 0;
                        });
                        localObj.materialsDetails = [];

                        localObj.servicesDetails = [];
                        localObj.teamDetails = response.data.team;
                        localObj.teamDetails.map(item => {
                            item.is_delete = 0;
                        });
                        localObj.assign_to = response.data.assign_to;
                        localObj.client_work_location = response.data.client_work_location;
                        localObj.status_id = response.data.status_id;
                        localObj.materialsDetails = JSON.parse(
                            JSON.stringify(localObj.product_materials)
                            );
                            localObj.servicesDetails = {
                            services: JSON.parse(JSON.stringify(localObj.services))
                            };
                        localObj.assetsDetails = JSON.parse(JSON.stringify(localObj.assets)); 
                        localObj.is_repairing_asset = response.data.is_repairing_asset;
                        localObj.asset_id = response.data.asset_id ?  response.data.asset_id : '';
                        localObj.maintenance_request_id = response.data.maintenance_request_id ?  response.data.maintenance_request_id : '';

                        localObj.quote_number = response.data.quote_number ?  response.data.quote_number : '';
                        localObj.project_estimate_no = response.data.quote_number ?  response.data.quote_number.project_estimate_no : '';
                        localObj.require_client_sign = response.data.require_client_sign;
                        localObj.requirements = response.data.requirements;
                        console.log("WO_EDIT:::: ",JSON.stringify(localObj));
                        sessionStorage.setItem("WO_EDIT", JSON.stringify(localObj));
                    }
                    var pdfLink =
                    self.config.pdfEndpoint +
                    "work-order/" +randomNo
                    +
                    "/pdf";
                    var previewLink =
                    self.config.pdfEndpoint +
                    "work-order/" +
                    randomNo;

                    if(actionDoc === 'PDF') {
                        self.downloadPDFDoc(pdfLink);
                    } else if(actionDoc === 'PREVIEW'){
                        self.preview(previewLink);
                    } else{

                    }
                    //self.util.showDialog(DialogComponent, response.message, [self.routeObj.list, self.routeObj.add]);
                }
            });

        }catch(err){
            this.global.addException('Work Order Review','previewDataSave()',err);
        }
        
    }
    downloadPDFDoc(dataDownload) {
        window.open(dataDownload);
    }
    preview(dataPreview) {
        window.open(dataPreview);
    }
}
