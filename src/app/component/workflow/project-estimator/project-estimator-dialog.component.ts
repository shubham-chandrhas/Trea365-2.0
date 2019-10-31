import { Component, Inject, OnInit, ElementRef, NgZone, ViewChild,
  ApplicationRef, Renderer, ViewChildren, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import {Location} from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Observable } from 'rxjs';
import { startWith ,  map } from 'rxjs/operators';
import { MapsAPILoader } from '@agm/core';
import { GlobalService } from '../../../shared/service/global.service';
import { UtilService } from '../../../shared/service/util.service';
import { HttpService } from '../../../shared/service/http.service';
import { ConstantsService } from '../../../shared/service/constants.service';
import { DialogComponent } from '../../../shared/model/dialog/dialog.component';

import { has as _has } from 'underscore';

import { ProjectEstimatorService } from './project-estimator.service';
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from 'angular-2-dropdown-multiselect';
import { ValueTransformer } from '../../../../../node_modules/@angular/compiler/src/util';
@Component({
    selector: '',
    templateUrl: './project-estimator-dialog.component.html',
    styleUrls: ['./project-estimator-dialog.component.css']
})

export class ProjectEstimatorDialog{
    public minDate = new Date();
    inspectForm: FormGroup;
    followInspectForm: FormGroup;
    addClientForm: FormGroup;
    addWorkLocationForm: FormGroup;
    addContactForm:FormGroup;
    addServiceDefinationForm:FormGroup;
    addApproveConfirmationNoteForm:FormGroup;
    errMsg: string = '';
    isError: boolean = false;
    public addTyp:any[] = [];
    public action: string;
    public requestFrom : string;
    public getClientId: any[];
    public locationType:string;
    public clientId:number=0;
    public submitted: boolean = false;
    public inspectorList:any[] = [];
    public followUpList:any[] = [];
    public site_inspection:any ={};
    public filteredInspectors: Observable<any[]>;
    public filteredFollowUp: Observable<any[]>;
    public countries: any = [];
    public siteInspection:any={};
    public followupDetails:any={};
    // @ViewChildren("div", { read: ElementRef }) divList: QueryList<any>;
    // @ViewChildren("value", { read: ElementRef }) valueList: QueryList<any>;
    @ViewChild("search")
    public searchElementRef: ElementRef;
    constructor(
        public dialog: MatDialog,
        public util: UtilService,
        public http: HttpService,
        public global: GlobalService,
        private fb: FormBuilder,
        public router: Router,
        public constant: ConstantsService,
        private mapsAPILoader: MapsAPILoader,
        private ngZone: NgZone,
        public dialogRef: MatDialogRef<ProjectEstimatorDialog>,
        @Inject(MAT_DIALOG_DATA) public dataObj: any,
        private PEService: ProjectEstimatorService ,
        private _location: Location,
        public route:ActivatedRoute

    ) {
        this.action = dataObj.action;
        this.getClientId = dataObj.clientId;
        this.locationType = dataObj.type;
        this.action == 'siteInspection' ?  this.setInspectForm() : '';
        this.action == 'saveForFollowUp' ? this.setFollowUpForm() : '';
        this.createAddClientForm();
        this.createAddServiceDefinationForm();
        this.action == 'saveForFollowUp' ? this.getEmployeeForFollowUp() : '' ;

    }
    setFollowUpForm(){
        console.log(JSON.stringify(this.PEService.projectEstimatorData.follow_by));
        if(this.PEService.projectEstimatorData.follow_by){
            this.createFollowUpForm(1,this.PEService.projectEstimatorData.follow_by);
        }else{
            this.createFollowUpForm(0);
        }

    }
    setInspectForm(){
         console.log(this.PEService.projectEstimatorData);

        if(this.PEService.projectEstimatorData.site_inspections){
            this.createInspectForm(1,this.PEService.projectEstimatorData.site_inspections);
            if(this.PEService.projectEstimatorData.site_inspections){
                let reqObj: any = {
                    'date': this.PEService.projectEstimatorData.site_inspections.inspection_date,
                    'start_time': this.PEService.projectEstimatorData.site_inspections.start_time,
                    'start_time_format': this.PEService.projectEstimatorData.site_inspections.start_time_format,
                    'end_time': this.PEService.projectEstimatorData.site_inspections.end_time,
                    'end_time_format': this.PEService.projectEstimatorData.site_inspections.end_time_format
                }
                this.getInspectorList(reqObj);
            }
		}else{
            this.createInspectForm(0);
        }
    }

    ngOnInit() {

        this.requestFrom = _has(this.dataObj, 'requestFrom') 
                            ? this.dataObj.requestFrom 
                            : 'QUOTATION_GENERATION';
        this.util.setPageTitle(this.route);
        this.dataObj.action == 'addWorkLocation' ? this.createAddWorkLocationForm() : '' ;
        this.dataObj.action == 'addWorkLocation' ? this.getCountries() : '' ;
        this.createApproveConfirmationForm();
        console.log(this.requestFrom);
    }

    getEmployeeForFollowUp()
    {
        var self = this;
        try{
            // employees
            this.http.doGet('quotation/followers', function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){
                    console.log("error",response);
                }else{
                    self.followUpList = [];
                    self.followUpList = response.data;
                    self.filteredFollowUp = self.follow_up_by_name.valueChanges.pipe(startWith(''), map(data => data ? self.filterFollowUps(data, self.followUpList) : self.followUpList.slice()) );
                }
            });
        }catch(err){
            this.global.addException('Schedule Site Inspection','getInspectorListForFollowUp()',err);
        }
    }

    getInspectorList(reqObj){
        var self = this;
        try{
            // inspectors
            this.http.doPost('quotation/inspectors', reqObj, function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){
                    console.log("error",response);
                }else{
                    self.inspectorList = [];
                    self.inspectorList = response.data;
                    self.filteredInspectors = self.inspector_name.valueChanges.pipe(startWith(''), map(data => data ? self.filterInspectors(data, self.inspectorList) : self.inspectorList.slice()) );
                }
            });
        }catch(err){
            this.global.addException('Schedule Site Inspection','getInspectorList()',err);
        }
    }

    getList(){
        if(this.inspection_date.valid && this.start_time.valid && this.start_time_format.valid && this.end_time.valid && this.end_time_format.valid){
            let reqObj = {
                'date': this.util.getYYYYMMDDDate(this.inspection_date.value),
                'start_time': this.start_time.value,
                'start_time_format': this.start_time_format.value,
                'end_time': this.end_time.value,
                'end_time_format': this.end_time_format.value
            }
            this.getInspectorList(reqObj);
        }
    }

    filterInspectors(full_name: string, list: any[]) {
        try{
            //return list.filter(data => data.full_name.toLowerCase().indexOf(full_name.toLowerCase()) === 0);
            return list.filter(option =>
                option.full_name.toLowerCase().includes(full_name ? full_name.toLowerCase() : "")
              );

        }catch(err){
            this.global.addException('Schedule Site Inspection','filterInspectors()',err);
        }
    }
    getSelectedInspector(selInspector: any, event){
        try{
            if(event && event.isUserInput){
                console.log(selInspector);
                this.inspector.setValue(selInspector.id);
                this.inspector_name.setValue(selInspector.full_name);
            }
        }catch(err){
            this.global.addException('Schedule Site Inspection','getSelectedInspector()',err);
        }
    }
    public validateInspector(event:any){
        try{
            let inspector = event.target.value;
            if(inspector == ''){
                this.inspector.setValue('');
                this.inspector_name.setValue('');
                return;
            }
            let match = this.inspectorList.filter(item=>item.full_name.toLowerCase() == inspector.toLowerCase());
            if(match.length > 0){
                this.inspector.setValue(match[0].id);
                this.inspector_name.setValue(match[0].full_name);
            }else{
                this.inspector.setValue('');
            }
        }catch(err){
            this.global.addException('Schedule Site Inspection','validateInspector()',err);
        }
    }

    getSelectedFolloUp(selInspector: any, event){
        try{
            if(event && event.isUserInput){
                console.log(selInspector);
                this.follow_up_by.setValue(selInspector.id);
                this.follow_up_by_name.setValue(selInspector.name);
            }
        }catch(err){
            this.global.addException('PE getSelectedFolloUp','getSelectedFolloUp()',err);
        }
    }

    filterFollowUps(name: string, list: any[]) {
        try{
            return list.filter(option =>
                option.name.toLowerCase().includes(name ? name.toLowerCase() : "")
            );
        }catch(err){
            this.global.addException('PE filterFollowUps','filterFollowUps()',err);
        }
    }

    public validateFollowUps(event:any){
        try{
            let inspector = event.target.value;
            if(inspector == ''){
                this.follow_up_by.setValue('');
                this.follow_up_by_name.setValue('');
                return;
            }
            let match = this.followUpList.filter(item=>item.name.toLowerCase() == inspector.toLowerCase());
            if(match.length > 0){
                this.follow_up_by.setValue(match[0].id);
                this.follow_up_by_name.setValue(match[0].name);
            }else{
                this.follow_up_by.setValue('');
            }
        }catch(err){
            this.global.addException('Schedule Site Inspection','validateFollowUps()',err);
        }
    }

    public createInspectForm(option, data: any = {}){
        this.inspectForm = this.fb.group({
            inspection_date: new FormControl(option == '1' ? this.util.getTimeZoneDate(data.inspection_date ): '', [Validators.required]),
            start_time: new FormControl(option == '1' ? data.start_time : '', [Validators.required, Validators.pattern(this.constant.TIME_PATTERN)]),
            start_time_format: new FormControl(option == '1' ? data.start_time_format : 'am', [Validators.required]),
            end_time: new FormControl(option == '1' ? data.end_time : '', [Validators.required, Validators.pattern(this.constant.TIME_PATTERN)]),
            end_time_format: new FormControl(option == '1' ? data.end_time_format :'am', [Validators.required]),
            inspector: new FormControl(option == '1' ? data.inspector :'', [Validators.required]),
            inspector_name: new FormControl(option == '1' ? data.inspector_name :''),
            pe_site_inspection_id: new FormControl(option == '1' ? data.pe_site_inspection_id :'')
        });
    }

    get inspection_date() { return this.inspectForm.get('inspection_date'); }
    get start_time() { return this.inspectForm.get('start_time'); }
    get start_time_format() { return this.inspectForm.get('start_time_format'); }
    get end_time() { return this.inspectForm.get('end_time'); }
    get end_time_format() { return this.inspectForm.get('end_time_format'); }
    get inspector() { return this.inspectForm.get('inspector'); }
    get inspector_name() { return this.inspectForm.get('inspector_name'); }
    get pe_site_inspection_id() { return this.inspectForm.get('pe_site_inspection_id'); }

    public createFollowUpForm(option,data: any = {}){
        this.followInspectForm = this.fb.group({
            follow_up_comment: new FormControl(option == '1' ? data.follow_up_comment : '', []),
            follow_up_by: new FormControl(option == '1' ? data.follow_up_by :'', [Validators.required]),
            follow_up_by_name: new FormControl(option == '1' ? data.follow_up_by_name :'')
        });
    }
    get follow_up_comment() { return this.followInspectForm.get('follow_up_comment'); }
    get follow_up_by() { return this.followInspectForm.get('follow_up_by'); }
    get follow_up_by_name() { return this.followInspectForm.get('follow_up_by_name'); }

    public createAddClientForm() {

        this.addClientForm = this.fb.group({

            client_type: new FormControl('',[Validators.required]),
            client_name:new FormControl('',[Validators.required]),
            payment_term:new FormControl('',[Validators.min(0)]),
            legal_name:new FormControl(''),
            comment:new FormControl(''),
        });
        this.clientTypeValueChanged();
    }

    public clientTypeValueChanged() {
        this.addClientForm.get('client_type').valueChanges.subscribe(type=>{
        });
    }
    public createAddWorkLocationForm(){
        let self = this;
        this.addWorkLocationForm = this.fb.group({
            client_id: new FormControl(this.getClientId),
            address_line_1:new FormControl('',[Validators.required]),
            address_line_2:new FormControl(''),
            country_id:new FormControl(''),
            city_id : new FormControl(''),
            province_id:new FormControl(''),
            postal_code:new FormControl(''), //Hidden
            latitude: new FormControl(''), //Hidden
            longitude: new FormControl(''), //Hidden
            contact_type:new FormControl(''),
            is_work:new FormControl(''),
            is_billing:new FormControl(''),
            name:new FormControl(''),
            phone_no : new FormControl('',[Validators.pattern(this.constant.PHONE_PATTERN)]),
            email_id:new FormControl('',[Validators.pattern(this.constant.EMAIL_PATTERN)])
        });
        // this.mapInit();
    }

    get client_id() { return this.addWorkLocationForm.get('client_id'); }
    get address_line_1() { return this.addWorkLocationForm.get('address_line_1'); }
    get address_line_2() { return this.addWorkLocationForm.get('address_line_2'); }
    get country_id() { return this.addWorkLocationForm.get('country_id'); }
    get city_id() { return this.addWorkLocationForm.get('city_id'); }
    get province_id() { return this.addWorkLocationForm.get('province_id'); }
    get postal_code() { return this.addWorkLocationForm.get('postal_code'); }
    get latitude() { return this.addWorkLocationForm.get('latitude'); }
    get longitude() { return this.addWorkLocationForm.get('longitude'); }
    get contact_type() { return this.addWorkLocationForm.get('contact_type'); }
    get is_work() { return this.addWorkLocationForm.get('is_work'); }

    getCountries() {
        try {
            var self = this;
                setTimeout(()=>{
                    self.util.mapInit(self.mapsAPILoader,
                      self.searchElementRef, self.ngZone,
                      self.addWorkLocationForm.get("address_line_1"),
                      [ null, null, null, self.addWorkLocationForm.get("postal_code"), null, self.addWorkLocationForm.get("latitude"),
                      self.addWorkLocationForm.get("longitude") ]);
                },500);
        } catch (err) {
            this.global.addException('PE Add Address OTF', 'getCountries()', err);
        }
    }

    public createApproveConfirmationForm(){
        this.addApproveConfirmationNoteForm = this.fb.group({
            approve_note: new FormControl(''),
        });
    }

    public createAddServiceDefinationForm(){
        this.addServiceDefinationForm = this.fb.group({
            service_type: new FormControl('',[Validators.required]),
            service_definition: new FormControl('',[Validators.required]),
            description: new FormControl(''),
            price:new FormControl('',[Validators.required,Validators.pattern(this.constant.AMOUNT_PATTERN)]),
            });
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
    submit(form: FormGroup): void {
        let self = this;
        self.errMsg = '';
        self.isError = false;
        console.log("DAta:" + JSON.stringify(this.PEService.projectEstimatorData));
        try {
            if (form.valid) {
                form.value.project_estimate_id = this.PEService.projectEstimatorData.project_estimate_id ? this.PEService.projectEstimatorData.project_estimate_id : '';
                form.value.inspection_date = this.util.getFormatedDate(form.value.inspection_date);
                
                    self.util.addSpinner('submit-btn', "Submit");
                    this.http.doPost('quotation/site-inspection', form.value, function (error: boolean, response: any) {
                        self.util.removeSpinner('submit-btn', "Submit");
                        if (error) {
                            self.errMsg = response.message;
                            self.isError = true;
                        } else {
                            self.dialogRef.close();
                            self.util.showDialog(DialogComponent, response.message);
                            self.PEService.projectEstimatorData.site_inspections = response.data.site_inspections;
                            self.setInspectForm();
                            if(self._location.path().includes("quotation-list")){
                                console.log("Include");
                                self.util.changeEvent({
                                    'source': 'SITE_INSPECTION',
                                    'action': 'INSPECTION',
                                    'data': response.data
                                });
                            }
                        }
                    });
               
            }
        } catch (err) {
            this.global.addException('Project Estimator', 'submit()', err);
        }
    }

    saveForFollowUp(form: FormGroup): void {
        try {
            let self = this;
            self.errMsg = '';
            self.isError = false;
            console.log(form);
            if (form.valid) {
                form.value.project_estimate_id = this.PEService.projectEstimatorData.project_estimate_id ? this.PEService.projectEstimatorData.project_estimate_id : '';
                self.util.addSpinner('save-btn', "Save");
                
                    this.http.doPost('quotation/follow-up', form.value, function (error: boolean, response: any) {
                        self.util.removeSpinner('save-btn', "Save");
                        if (error) {
                            self.errMsg = response.message;
                            self.isError = true;
                        } else {
                            self.dialogRef.close();
                            self.util.showDialog(DialogComponent, response.message);
                            self.PEService.projectEstimatorData.follow_by = response.data.follow_by;
                            self.setFollowUpForm();
                            if(self._location.path().includes("quotation-list")){
                                self.util.changeEvent({
                                    'source': 'SAVE_FOR_FOLLOW_UP',
                                    'action': 'FOLLOW_UP',
                                    'data': response.data
                                });
                            }
                        }
                    });
                

            }
        } catch (err) {
            this.global.addException('Project Estimator', 'saveForFollowUp()', err);
        }
    }

    addClient(form: FormGroup): void {
        try {
            let self = this;
            self.errMsg = '';
            self.submitted = true;

            if (form.valid) {
                JSON.stringify(form.value);
                self.util.addSpinner('save-btn', "Save");
                this.http.doPost('client/add', form.value, function (error: boolean, response: any) {
                    self.util.removeSpinner('save-btn', "Save");
                    if (error) {
                        self.errMsg = response.message;
                        self.isError = true;
                        console.log(response.message);
                    } else {
                        console.log(response);
                      
                        self.util.changeEvent({
                            'source': self.requestFrom,//'QUOTATION_GENERATION',
                            'action': 'ADD_CLIENT',
                            'data': response.data
                        });
                        self.util.removeSpinner('save-btn', "Save");
                        self.closeDialog();
                    }
                });
            }
            else {
                console.log(form);
            }
        } catch (err) {
            this.global.addException('Project Estimator', 'addClient()', err);
        }
    }
    addWorkLocation(form: FormGroup): void {
        try {
            let self = this;
            self.errMsg = '';
            self.submitted = true;
            if (form.valid) {
                JSON.stringify(form.value);
                console.log(form.value);

                if(self.locationType == 'workLocation')
                {
                    this.addWorkLocationForm.get("is_work").setValue(1);
                }
                else if(self.locationType == 'billLocation')
                {
                    this.addWorkLocationForm.get("is_billing").setValue(1);
                }
                self.util.addSpinner('save-btn', "Save");
                this.http.doPost('client/address/save', form.value, function (error: boolean, response: any) {
                    self.util.removeSpinner('save-btn', "Save");
                    if (error) {
                        self.errMsg = response.message;
                        self.isError = true;
                   } else {

                        self.util.changeEvent({
                            'source': self.requestFrom,//'QUOTATION_GENERATION',
                            'action': 'ADD_LOCATION',
                            'type': self.locationType,
                            'data': { 'client_id': form.value.client_id, 'client_address_id' : response.data.client_address_id }
                        });
                        self.util.removeSpinner('save-btn', "Save");
                        self.closeDialog();
                    }
                });
            }
        } catch (err) {
            this.global.addException('Project Estimator', 'addWorkLocation()', err);
        }

    }

    addServiceDefinition(form: FormGroup): void {
        let self = this;
        self.errMsg = '';
        self.submitted = true;
        try {
            if (form.valid) {

                let reqObj = {
                    'service_type': '',
                    'service_definitions': []
                };
                reqObj.service_type = form.value.service_type;
                reqObj.service_definitions.push({'service_definition':form.value.service_definition,'price':form.value.price , 'description':form.value.description});
                self.util.addSpinner('add-service-btn', "Submit");
                this.http.doPost('service-type/create', reqObj, function (error: boolean, response: any) {
                    self.util.removeSpinner('add-service-btn', "Submit");
                    if (error) {
                        self.errMsg = response.message;
                        self.isError = true;
                    } else {
                        self.util.changeEvent({
                            'source': 'QUOTATION_GENERATION',
                            'action': 'ADD_SERVICE_DEFINITION',
                            'data': { 'service_definition': form.value.service_type+' ( '+form.value.service_definition+' )' }
                        });

                        self.closeDialog();
                    }
                });
            }
        } catch (err) {
            this.global.addException('Project Estimator', 'addServiceDefinition()', err);
        }
    }

    confirm(): void {
        let self = this;
        let responseData;
        self.errMsg = '';
        self.isError = false;
        try {
            let updatedPE = JSON.parse(sessionStorage.getItem('quotationDetails'));
            updatedPE.approveNote = this.addApproveConfirmationNoteForm.get('approve_note').value;
            sessionStorage.setItem('quotationDetails', JSON.stringify(updatedPE));

            self.util.addSpinner('confirm-btn', 'Confirm');
            this.PEService.saveProjectEstimator(this.dataObj.apiAction, 'APPROVE', function (error: boolean, response: any) {
                self.util.removeSpinner('confirm-btn', 'Confirm');
                if (error) {
                    self.errMsg = response.message;
                    self.isError = true;
                } else {
                    self.closeDialog();
                    self.PEService.updateFormStatus('materialsFm', false);
                    self.PEService.updateFormStatus('paymentScheduleFm', false);
                    self.PEService.updateFormStatus('servicesFm', false);
                    self.PEService.updateFormStatus('scheduleFm', false);
                    self.util.showDialog(DialogComponent, response.message, ['/workflow/quote/csa/quotation-list/0']);
                    if(self._location.path().includes("quotation-list")){
                        console.log("include");
                        self.util.changeEvent({
                            'source': 'APPROVE_PE',
                            'action': 'APPROVE_PE',
                            'data': response.data
                        });
                    }
                }
            });
        } catch (err) {
            this.global.addException('Project Estimator', 'confirm()', err);
        }

    }

    confirmFromOverview(form: FormGroup): void {
        try {
            let self = this;
            self.errMsg = '';
            self.submitted = true;
            if (form.valid) {
                let reqObj: any = {
                    project_estimate_id: self.dataObj.project_estimate_id,
                    status: 5,
                    approve_note :form.value.approve_note
                  };
                self.util.addSpinner('confirm-btn', 'Confirm');
                this.http.doPost('quotation/status/update', reqObj, function (error: boolean, response: any) {
                    self.util.removeSpinner('confirm-btn', 'Confirm');
                    if (error) {
                        self.errMsg = response.message;
                        self.isError = true;
                   } else {

                        self.util.changeEvent({
                            'source': 'APPROVE_PE',
                            'action': 'APPROVE_PE',
                            'data': { 'project_estimate_id': self.dataObj.project_estimate_id }
                        });
                        self.util.removeSpinner('save-btn', "Save");
                        self.closeDialog();
                    }
                });
            }
        } catch (err) {
            this.global.addException('Project Estimator', 'addWorkLocation()', err);
        }
    }
}
