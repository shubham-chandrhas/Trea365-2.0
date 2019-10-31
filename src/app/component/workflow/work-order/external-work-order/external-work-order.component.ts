import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { GlobalService } from '../../../../shared/service/global.service';
import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { ConstantsService } from '../../../../shared/service/constants.service';
import { WorkOrderService } from '../work-order.service';

import { WorkOrderDialog } from '../work-order-dialog.component';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';

@Component({
    selector: 'app-external-work-order',
    templateUrl: './external-work-order.component.html',
    styleUrls: [ './external-work-order.component.scss']
})
export class ExternalWorkOrderComponent implements OnInit {
    selectedQuotation: any = {};
    today = new Date();
    generatedBy: string;
    woForm: FormGroup;
    scheduleType: string = 'once';
    WOSubContractorObj: any = {};
    errMsg: string = '';
    isError: boolean = false;
    isEdit: boolean = false;
    isBack: boolean = false;
    submitted: boolean = false;
    currentAction: String;
    subscription: Subscription;
    minDate: any;
    maxDate: any;
    timeNowError: boolean = false;
    changeText: boolean = false;

    constructor(
        public dialog: MatDialog,
        public util: UtilService,
        public http: HttpService,
        public global: GlobalService,
        private fb: FormBuilder,
        public router: Router,
        public constant: ConstantsService, 
        public WOService: WorkOrderService,
        public route: ActivatedRoute
    ) { 
        this.WOService.setcurrentState('ADD');
        if(localStorage.getItem('CREATE_WO')){
            this.WOSubContractorObj = JSON.parse(localStorage.getItem('CREATE_WO'));
            this.WOSubContractorObj.WO_TYPE == 'Internal Contractor' ? this.selectedQuotation.generated_by = JSON.parse(atob(localStorage.getItem('USER'))) : this.getQuotation(this.WOSubContractorObj.project_estimate_id) ;
        }
        this.util.changeEvent(null);
    }

    ngOnInit() {
        this.WOService.isCRwithService = false;
        this.WOService.isCRwithProduct = false;
        this.WOService.deletedService = [];
        this.WOService.deletedProductMaterial = [];
        this.WOService.deletedTeamMember = [];
        this.WOService.deletedAsset = [];
        this.util.menuChange({'menu':4,'subMenu':26});
        this.util.setPageTitle(this.route);
        this.createWOForm('0');
        localStorage.getItem('quoteFromExternalWO') ? this.getQuotation(localStorage.getItem('quoteFromExternalWO')) : '';
        this.generatedBy = JSON.parse(atob(localStorage.getItem('USER'))).first_name+" "+(JSON.parse(atob(localStorage.getItem('USER'))).last_name ? JSON.parse(atob(localStorage.getItem('USER'))).last_name : '');
        //this.createWOForm('0');
        this.WOService.woType = 'Client';
        //this.WOService.associatedAsset = [];
        this.WOService.isCRwithService = false;
        this.WOService.quatationTab = this.router.url.split('/')[this.router.url.split('/').length - 1];
        if(sessionStorage.getItem('WO_DETAILS')){
            this.isBack = true;
            this.WOSubContractorObj = JSON.parse(sessionStorage.getItem('WO_DETAILS'));
            this.WOService.WO_DATA = JSON.parse(sessionStorage.getItem('WO_DETAILS'));
            this.getQuotation(this.WOSubContractorObj.project_estimate_id);
        }else if(sessionStorage.getItem('WO_EDIT')){
            this.isEdit = true;
            this.WOSubContractorObj = JSON.parse(sessionStorage.getItem('WO_EDIT'));
            this.WOService.WO_DATA = JSON.parse(sessionStorage.getItem('WO_EDIT'));
            this.WOSubContractorObj.schedules =  this.WOSubContractorObj.schedule;
            this.today = this.WOSubContractorObj.work_order_date;
            this.selectedQuotation = {};
            this.selectedQuotation.project_estimate_no = this.WOSubContractorObj.project_estimate_no;
            this.selectedQuotation.client = this.WOSubContractorObj.client_name;
            this.selectedQuotation.client_work_location = this.WOSubContractorObj.client_work_location;
            this.selectedQuotation.work_location_id = this.WOSubContractorObj.work_location_id ? this.WOSubContractorObj.work_location_id : 'N/A';
            this.createWOForm('1',this.WOSubContractorObj);
            this.checkScheduleDates();
            this.WOService.setcurrentState('EDIT');
        }

        this.currentAction = this.WOService.getcurrentState();
        this.initScheduleDates();
        this.WOService.scheduleDetails = sessionStorage.getItem('schedules') ? JSON.parse(sessionStorage.getItem('schedules')) : null;
        //this.checkScheduleDates();
        if(this.currentAction == "EDIT"){
            this.WOService.updateFormStatus('servicesFm', true);
            this.WOService.updateFormStatus('teamFm', true);
            this.WOService.updateFormStatus('assetsFm', true);
            this.WOService.updateFormStatus('materialsFm', true);
        }

        this.subscription = this.util.changeDetection.subscribe(dataObj => {
            if(dataObj && dataObj.source == 'EXTERNAL_WO' && dataObj.action == 'CONTINUE_CREATING_CR'){
                console.log("Change Detection In WO Parent .......", dataObj);
                this.checkValidation();    
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    scheduleStartDateChange(event,index){
        this.schedule.at(index).get('start_date').setValue(event);
        this.schedule.at(index).get('end_date').setValue('');
    }

    checkDates(event){
        console.log("checkDates");
        console.log(event);
        this.timeNowError = false;
        this.schedule.at(0).get('end_date').setValue(event);
        this.clearendtime(0);
        this.checkScheduleDates();
    }

    clearendtime(index) {
        this.timeNowError = false;
        this.schedule.at(index).get('end_time').setValue('');
    }


    initScheduleDates() {
        sessionStorage.setItem('schedules', JSON.stringify({
            start_date: this.util.getYYYYMMDDDate(this.woForm.value.schedule[0].start_date),
            end_date: this.util.getYYYYMMDDDate(this.woForm.value.schedule[0].end_date),
            start_time: this.woForm.value.schedule[0].start_time,
            end_time: this.woForm.value.schedule[0].end_time,
            start_time_format: this.woForm.value.schedule[0].start_time_format,
            end_time_format: this.woForm.value.schedule[0].end_time_format
        }));
        this.WOService.scheduleDetails = sessionStorage.getItem('schedules') ? JSON.parse(sessionStorage.getItem('schedules')) : null;
    }

    checkScheduleDates() {
        try {
            console.log("checkScheduleDates()");
            if(this.changeText){
                if(this.schedule.at(0).get('start_date').value != '' && this.schedule.at(0).get('end_date').value != '' && this.schedule.at(0).get('start_time').value != '' && this.schedule.at(0).get('end_time').value != '' && this.schedule.at(0).get('start_time').valid && this.schedule.at(0).get('end_time').valid){

                    sessionStorage.setItem('schedules', JSON.stringify({
                        start_date: this.util.getYYYYMMDDDate(this.woForm.value.schedule[0].start_date),
                        end_date: this.util.getYYYYMMDDDate(this.woForm.value.schedule[0].end_date),
                        start_time: this.woForm.value.schedule[0].start_time,
                        end_time: this.woForm.value.schedule[0].end_time,
                        start_time_format: this.woForm.value.schedule[0].start_time_format,
                        end_time_format: this.woForm.value.schedule[0].end_time_format
                    }));
                    this.WOService.scheduleDetails = sessionStorage.getItem('schedules') ? JSON.parse(sessionStorage.getItem('schedules')) : null;
                    console.log("this.WOService.scheduleDetails",this.WOService.scheduleDetails);
                    this.WOService.WO_DATA.assetsDetails = undefined;
                    this.WOService.WO_DATA.teamDetails = undefined;
                    this.WOService.updateFormStatus('teamFm', false);
                    this.WOService.updateFormStatus('assetsFm', false);
                    this.WOService.associatedAsset = [];
                    this.util.changeEvent({
                        'source': 'WO_INTERNAL', 
                        'action': 'SCHEDULE_CHANGE',
                        'data': ''
                    });
                }
            }
            

        } catch (err) {
            this.global.addException('External Work order', 'checkScheduleDates()', err);
        }
    }

    compareendtime(event, index) {
        try {
            console.log(index)
            this.timeNowError = false;
            console.log(this.schedule.at(index).get('start_date').value);
            let startDate = new Date(this.schedule.at(index).get('start_date').value);
            let startDateDay = startDate.getDate();
            let startDateMonth = startDate.getMonth();
            let startDateYear = startDate.getFullYear();

            let startDatestring = new Date(String(startDateYear) + '-' + String(startDateMonth) + '-' + String(startDateDay) + " " + this.schedule.at(index).get('start_time').value + " " + this.schedule.at(index).get('start_time_format').value);

            let endDate = new Date(this.schedule.at(index).get('end_date').value);
            let endDateDay = endDate.getDate();
            let endDateMonth = endDate.getMonth();
            let endDateYear = endDate.getFullYear();

            let endDatestring = new Date(String(endDateYear) + '-' + String(endDateMonth) + '-' + String(endDateDay) + " " + this.schedule.at(index).get('end_time').value + " " + this.schedule.at(index).get('end_time_format').value);

            console.log(startDatestring.getTime(), endDatestring.getTime(), endDatestring, startDatestring);
            if (startDatestring.getTime() > endDatestring.getTime()) {
                //this.timeNowError = true;
            }
            else {
                //this.timeNowError = false;
            }
            if (this.schedule.at(index).get('start_date').value != '' && this.schedule.at(index).get('start_date').value != '') {
                // code...
            }
            //this.setSchedule(index);
            this.checkScheduleDates();
        } catch (err) {
            this.global.addException('External Work order', 'compareendtime()', err);
        }
    }
    
    getQuotation(id){ 
        var self = this;
        this.util.showProcessing('processing-spinner');
        try{
            this.http.doGet('quotation/'+id+'/details/wo', function(error: boolean, response: any){
                if( error ){ console.log(response) }else{
                    self.selectedQuotation = response.data;
                    self.selectedQuotation.client = response.data.client_name;
                    self.selectedQuotation.schedules =  self.selectedQuotation.schedule;
                    self.util.hideProcessing('processing-spinner');
                    if(self.isEdit || self.isBack){
                        self.selectedQuotation.require_client_sign = self.WOSubContractorObj.require_client_sign == 1 ? true : false;
                        self.selectedQuotation.requirements = self.WOSubContractorObj.requirements;

                        if(sessionStorage.getItem('WO_DETAILS'))
                        {
                           self.selectedQuotation.schedules =  self.WOSubContractorObj.scheduleInfo.schedule_items[0];
                        }
                    }
                    self.createWOForm('1',self.selectedQuotation);
                    self.checkScheduleDates();
                    self.WOService.scheduleDetails = self.selectedQuotation.schedules;
                    sessionStorage.setItem('schedules', JSON.stringify(self.selectedQuotation.schedules) );
                    console.log('self.selectedQuotation:::::',self.selectedQuotation);
                }
            });
        }catch(err){
            this.global.addException('Error Log','constructor()',err);
        }
    }

    createWOForm(option, val: any={}){
        if(option == '1'){
            this.minDate = new Date(val.schedules ? val.schedules.start_date : '');
            this.maxDate = new Date(val.schedules ? val.schedules.end_date : '');
        }
        this.woForm = this.fb.group({
            schedule: this.fb.array([this.fb.group({
                start_date: new FormControl(option == '0' ? '' : val.schedules  ?  val.schedules.start_date ? this.util.getTimeZoneDate(val.schedules.start_date) : '' : '', [Validators.required] ), //Only for review
                end_date: new FormControl(option == '0' ? '' : val.schedules ? val.schedules.end_date ? this.util.getTimeZoneDate(val.schedules.end_date) : '' : '', [Validators.required] ), 
                start_time: new FormControl(option == '0' ? '' : val.schedules ? val.schedules.start_time ? val.schedules.start_time.substring(0,5) : '' : '', [Validators.required, Validators.pattern(this.constant.TIME_PATTERN)] ), //Only for review
                start_time_format: new FormControl(option == '0' ? 'am' : val.schedules ? val.schedules.start_time_format : 'am', [Validators.required]),
                end_time: new FormControl(option == '0' ? '' : val.schedules ? val.schedules.end_time ? val.schedules.end_time.substring(0,5) : '' : '', [Validators.required, Validators.pattern(this.constant.TIME_PATTERN)]),
                end_time_format: new FormControl(option == '0' ? 'am' : val.schedules ? val.schedules.end_time_format : 'am', [Validators.required]),
                schedule_id: new FormControl(option == '0' ? '' : val.schedules ? val.schedules.schedule_id : ''),
                schedule_type: new FormControl(1),
            })]),
            require_client_sign: new FormControl(option == '0' ? false : val.require_client_sign),
            requirements : new FormControl(option == '0' ? '' : val.requirements)
        })
    }

    get schedule(): FormArray{ return <FormArray>this.woForm.get('schedule') as FormArray; };
    get require_client_sign(){return this.woForm.get('require_client_sign');};
    get requirements(){return this.woForm.get('requirements');};

    changeQuotTabDirectly(tabName, checkFromStatus: boolean = true){
        if(this.WOService.quatationTab == 'services'){
            this.WOService.checkFormStatusEvent('ADD_SERVICES', { 'validation': checkFromStatus });
            if(checkFromStatus && !this.WOService.getFormValidationStatus().servicesFm)
                return
        }
        
        if(this.WOService.quatationTab == 'team'){    
            this.WOService.checkFormStatusEvent('ADD_TEAM', { 'validation': checkFromStatus });
            if(checkFromStatus && !this.WOService.getFormValidationStatus().teamFm)
                return;
        }    
        if(this.WOService.quatationTab == 'assets'){ 
            this.WOService.checkFormStatusEvent('ADD_ASSETS', { 'validation': checkFromStatus });
            if(checkFromStatus && !this.WOService.getFormValidationStatus().assetsFm)
                return;
        }
        if(this.WOService.quatationTab == 'products'){   
            this.WOService.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': checkFromStatus });
            if(checkFromStatus && !this.WOService.getFormValidationStatus().materialsFm)
                return;
        }

        this.WOService.quatationTab = tabName; 
        this.router.navigate(['/workflow/wo/csa/wo-external/'+tabName]);
    }

    changeQuotTab(tabName, checkFromStatus: boolean = true){
        if(this.WOService.quatationTab == 'services'){
            checkFromStatus ? this.WOService.checkFormStatusEvent('ADD_SERVICES', { 'validation': checkFromStatus }) : '';
            if(!this.WOService.getFormValidationStatus().servicesFm)
                return
        }
        
        if(this.WOService.quatationTab == 'team'){    
            checkFromStatus ? this.WOService.checkFormStatusEvent('ADD_TEAM', { 'validation': checkFromStatus }) : '';
            if(!this.WOService.getFormValidationStatus().teamFm)
                return;
        }    
        if(this.WOService.quatationTab == 'assets'){ 
            checkFromStatus ? this.WOService.checkFormStatusEvent('ADD_ASSETS', { 'validation': checkFromStatus }) : '';
            if(!this.WOService.getFormValidationStatus().assetsFm)
                return;
        }
        if(this.WOService.quatationTab == 'products'){   
            checkFromStatus ? this.WOService.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': checkFromStatus }) : '';
            if(!this.WOService.getFormValidationStatus().materialsFm)
                return;
        }

        this.WOService.quatationTab = tabName; 
        this.router.navigate(['/workflow/wo/csa/wo-external/'+tabName]);
    }

    save(): void {
        let self = this;
        this.submitted = true;
        this.WOService.currentClick = 'save';
        try {
            if (this.woForm.valid && !this.timeNowError) {
                if (this.WOService.quatationTab == 'services') {
                    this.WOService.checkFormStatusEvent('ADD_SERVICES', { 'validation': true });
                    if(self.currentAction != 'EDIT'){
                        if (this.WOService.getFormValidationStatus().servicesFm) {
                            this.changeQuotTab('team', false);
                            //this.WOService.isCRwithService == true ? '' : this.changeQuotTab('team', false);
                        }
                        return;
                    }
                }
                if (this.WOService.quatationTab == 'team') {
                    this.WOService.checkFormStatusEvent('ADD_TEAM', { 'validation': true });
                    if(self.currentAction != 'EDIT'){
                        if (this.WOService.getFormValidationStatus().teamFm) {
                           this.changeQuotTab('assets', false);
                        }
                        return;
                    }
                }
                if (this.WOService.quatationTab == 'assets') {
                    this.WOService.checkFormStatusEvent('ADD_ASSETS', { 'validation': true });
                    if(self.currentAction != 'EDIT'){
                        if (this.WOService.getFormValidationStatus().assetsFm) {
                           this.changeQuotTab('products', false);
                        }
                        return;
                    }
                }
                if (this.WOService.quatationTab == 'products') {
                    this.WOService.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': true });
                    // Commented Due to New Logic : Note = Don't remove this commented code : @shubham
                    // if (self.currentAction == 'EDIT' ||(self.currentAction == 'ADD' && this.WOService.getFormValidationStatus().materialsFm)) {
                    //     for(let i = 0; i < this.WOService.WO_DATA.materialsDetails.length; i++){
                    //         let validMaterialsDetails: boolean = true;
                    //         if(this.WOService.WO_DATA.materialsDetails[i].locations.length == 0){ validMaterialsDetails = false; }

                    //         this.WOService.WO_DATA.materialsDetails[i].locations.map(loc => {
                    //             if(loc.quantity == undefined){ validMaterialsDetails = false; }
                    //             if(loc.quantity == '' || loc.quantity == 0){ validMaterialsDetails = false; }
                    //         });
                            
                    //         // if(!validMaterialsDetails){    
                    //         //     this.isError = true;
                    //         //     this.errMsg = "Please add pickup quantity for all Products/Materials OR remove Product/Material from list.";
                    //         //     return;
                    //         // }
                    //     }    
                    // }
                }

                if(this.WOService.WO_DATA.assetsDetails){
                    for(let i = 0; i < this.WOService.WO_DATA.assetsDetails.length; i++){
                        let validAssetsDetails: boolean = true;

                        if(this.WOService.WO_DATA.assetsDetails[i].asset == "" || this.WOService.WO_DATA.assetsDetails[i].asset_id == "" || this.WOService.WO_DATA.assetsDetails[i].start_time == "" || this.WOService.WO_DATA.assetsDetails[i].end_time == ""){
                            validAssetsDetails = false;
                        }

                        if(!validAssetsDetails){    
                            this.isError = true;
                            this.errMsg = "Please add valid data for all Assets OR remove Asset from list.";
                            this.changeQuotTab('assets');
                            return;
                        }
                    }    
                }
                this.checkValidation();
            }
        } catch (err) {
            this.global.addException('External Work order - save', 'save()', err);
        }
    }

    checkValidation(): void {
        try {
            let self = this;
            let woData: any = {
                'woForm': this.woForm,
                'currentAction': this.currentAction,
                'isEdit': this.isEdit,
                'WOSubContractorObj': this.WOSubContractorObj,
                'selectedQuotation': this.selectedQuotation
            }
            this.WOService.checkValidation(woData, function (response) {
                if (response) {
                    if (self.currentAction == 'EDIT') {
                        self.submitWOData();
                    } else {

                        sessionStorage.setItem('WO_DETAILS', JSON.stringify(self.WOService.WO_DATA));
                        self.router.navigate(['/workflow/wo/csa/work-order-review']);
                    }
                }
            });
        } catch (err) {
            this.global.addException('External Work order', 'checkValidation()', err);
        }
    }


    submitWOData(): void {
        try {
            let self = this;
            let reqObj: any = {
                'assign_to': 1,
                'status' : this.WOService.WO_DATA.status_id,
                'require_client_sign': this.woForm.value.require_client_sign ? 1 : 0,
                'requirements': this.woForm.value.requirements,
                'work_order_id': this.WOService.WO_DATA.work_order_id,
                'work_order_type': this.WOService.WO_DATA.work_order_type,
                'is_repairing_asset': this.WOService.WO_DATA.is_repairing_asset ? this.WOService.WO_DATA.is_repairing_asset : '',
                'client_id': this.WOService.WO_DATA.client_id,
                'client_name': this.WOService.WO_DATA.client_name,
                'email_id': this.WOService.WO_DATA.email_id,
                'phone_no': this.WOService.WO_DATA.phone_no,
                'project_estimate_id': this.WOService.WO_DATA.project_estimate_id,
                'asset_id': this.WOService.WO_DATA.asset_id ? this.WOService.WO_DATA.asset_id : '',
                'work_location_id': this.selectedQuotation.work_location_id,
                'client_work_location': this.selectedQuotation.client_work_location,
            };
            
            if(this.WOService.WO_DATA.work_order_type == '1'){
                reqObj.asset_details = this.WOService.WO_DATA.asset_details;
                reqObj.maintenance_request_id = this.WOService.WO_DATA.maintenance_request_id ? this.WOService.WO_DATA.maintenance_request_id : '';
                reqObj.supplier_id = this.WOService.WO_DATA.supplier_id ? this.WOService.WO_DATA.supplier_id : '';
            }

            this.WOService.WO_DATA.scheduleDetails = this.WOService.WO_DATA.scheduleInfo.schedule_items[0];
            reqObj.schedule = [{
                'start_date':  this.util.getYYYYMMDDDate(this.WOService.WO_DATA.scheduleDetails.start_date),
                'end_date':  this.util.getYYYYMMDDDate(this.WOService.WO_DATA.scheduleDetails.end_date),
                'start_time': this.WOService.WO_DATA.scheduleDetails.start_time,
                'start_time_format': this.WOService.WO_DATA.scheduleDetails.start_time_format,
                'end_time': this.WOService.WO_DATA.scheduleDetails.end_time,
                'end_time_format': this.WOService.WO_DATA.scheduleDetails.end_time_format,
                'schedule_type': this.WOService.WO_DATA.scheduleDetails.schedule_type,
                'scheduling_id': this.WOService.WO_DATA.scheduleDetails.scheduling_id,
            }];

            reqObj.team = this.WOService.WO_DATA.teamDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(item.start_date),item.end_date = this.util.getYYYYMMDDDate(item.end_date) ));
            reqObj.assets = this.WOService.WO_DATA.assetsDetails ? this.WOService.WO_DATA.assetsDetails.filter(item=> (item.start_date = this.util.getYYYYMMDDDate(item.start_date),item.end_date = this.util.getYYYYMMDDDate(item.end_date) )) : [];

            reqObj.services = this.WOService.WO_DATA.servicesDetails.services;
            reqObj.productMaterial = this.WOService.WO_DATA.materialsDetails;

            this.WOService.deletedService.map(item => {
                reqObj.services.push({
                    'wo_service_id': item,
                    'is_delete': 1
                })
            });

            this.WOService.deletedProductMaterial.map(item => {
                reqObj.productMaterial.push({
                    'wo_material_id': item,
                    'is_delete': 1
                })
            });

            this.WOService.deletedTeamMember.map(item => {
                reqObj.team.push({
                    'scheduling_id': item,
                    'is_delete': 1
                })
            });

            this.WOService.deletedAsset.map(item => {
                reqObj.assets.push({
                    'scheduling_id': item,
                    'is_delete': 1
                })
            });

            console.log("reqObj ::: = ",JSON.stringify(reqObj));
            self.util.addSpinner('update-btn', "Update");
            this.http.doPost('work-order/save', reqObj, function (error: boolean, response: any) {
                self.util.removeSpinner('update-btn', "Update");
                if (error) {
                    self.isError = true;
                    self.errMsg = response.message;
                    self.global.addException('External Work order', 'submitWOData()', error);
                } else {
                    self.WOService.WO_DATA = {};
                    self.util.showDialog(DialogComponent, response.message, ['/workflow/wo/csa/work-order-list/0'])
                }
            });
        } catch (err) {
            this.global.addException('External Work order', 'submitWOData()', err);
        }
    }

}

