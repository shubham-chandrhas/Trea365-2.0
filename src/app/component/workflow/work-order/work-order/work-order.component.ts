import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRouteSnapshot,ActivatedRoute } from '@angular/router';
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

@Component({
    selector: 'app-work-order',
    templateUrl: './work-order.component.html',
    styleUrls: ['./work-order.component.css']
})
export class WorkOrderComponent implements OnInit {
    public minDate = new Date();
    public isBack: boolean = false;
    public isEdit: boolean = false;
    public fromMaintenance: boolean = false;
    public isScheduleValid: boolean = false;
    public timeNowError: boolean = false;
    EndDateType : string = '';
    public repeatList:any[] = [];
    public empList:any[] = [];
    is_after:boolean = false;
    filteredScheduleRepeat: Observable<string[]>;
    public isSchedule: boolean = false;
    public submitted: boolean = false;
    public submittedS: boolean = false;
    public contratorList:any[] = [];
    public assetsList:any[] = [];
    public assetsDetails:any = {};
    public filteredEmployee: Observable<any[]>;
    public filteredAssets: Observable<any[]>;
    public WOInfo:any = {};
    public userInfo:any;
    today: number = Date.now();
    public workOrderTab: string = 'services';
    filteredAssignee: Observable<string[]>;
    public subAssigneeList: any = [];
    errMsg: string = '';
    isError: boolean = false;
    isMainLocationLoad: boolean = false;
    isSubLocationLoad: boolean = false;

    public filteredLocations: Observable<string[]>;
    public filteredTags: Observable<string[]>;
    public locList: any[] = [];
    public locTagsList: any[] = [];
    setupForm: FormGroup;
    scheduleForm: FormGroup;
    public scheduleType: string = 'once';
    public assetType:string = 'Needs Maintenance';
    public filterAssetType: boolean = true;
    // pageData:any;
    pageData: any = { 'scheduleType': [] };
    currentAction: String;
    changeText: boolean = false;
    constructor(
        public dialog: MatDialog,
        public util:UtilService,
        public http:HttpService,
        public global:GlobalService,
        public router: Router,
        private fb: FormBuilder,
        public constant: ConstantsService,
        public WOService: WorkOrderService,
        public route: ActivatedRoute
    ) {

    }

    ngOnInit() {
      const d = new Date();
      let offset = d.getTimezoneOffset();
      console.log('off = ', offset);
// const date = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
d.setMinutes( d.getMinutes() + d.getTimezoneOffset() );


console.log('date normal =', d);
        this.WOService.setcurrentState('ADD');
        this.util.menuChange({'menu':4,'subMenu':26});
        this.util.setPageTitle(this.route);
        this.util.setWindowHeight();
        this.WOService.woType = 'Internal';
        this.WOService.isCRwithService = false;
        this.WOService.isCRwithProduct = false;
        this.isMainLocationLoad = true;
        this.WOService.deletedService = [];
        this.WOService.deletedProductMaterial = [];
        this.WOService.deletedTeamMember = [];
        this.WOService.deletedAsset = [];

        if(sessionStorage.getItem('WO_DETAILS')){
            this.assetsDetails = null;
            this.getAssetsList();
            this.getLocationList();
            this.getContractorList();
            this.getAssigneeList();
            this.pageData = this.WOService.WO_DATA = JSON.parse(sessionStorage.getItem('WO_DETAILS'));
            this.pageData.schedule =  this.pageData.scheduleInfo.schedule_items[0];
            console.log(this.pageData);
            this.isBack = true;
            this.createWOsetupForm('1',this.pageData);
            this.createForm('1',this.pageData);
            this.asset_details.setValue(this.pageData.scheduleInfo ? this.pageData.scheduleInfo.asset_details : '');
            this.maintenance_request_id.setValue(this.pageData.scheduleInfo ? this.pageData.scheduleInfo.maintenance_request_id : '');

            // Is Repare Asset
            if(sessionStorage.getItem('WO_From_Maintenance')){
                this.assetsDetails = JSON.parse(sessionStorage.getItem('WO_From_Maintenance'));
                this.pageData.asset_name = this.assetsDetails.asset_name;
                this.asset_name.setValue(this.assetsDetails.asset_name);
                this.asset_id.setValue(this.assetsDetails.asset_id);
                this.asset_details.setValue(this.assetsDetails.maintenance_details);
                this.maintenance_request_id.setValue(this.assetsDetails.maintenance_request_id);
                this.requirements.setValue(this.assetsDetails.maintenance_details);
                this.fromMaintenance = true;
            } else if(this.pageData.repairInfo) {
                this.asset_name.setValue(this.pageData.repairInfo.asset_name);
                this.asset_id.setValue(this.pageData.repairInfo.asset_id);
                this.assetsDetails = this.pageData.scheduleInfo ? this.pageData.scheduleInfo.asset_details : null;
            }
        }else if(sessionStorage.getItem('WO_EDIT')){
            this.pageData = JSON.parse(sessionStorage.getItem('WO_EDIT'));
            this.WOService.WO_DATA = JSON.parse(sessionStorage.getItem('WO_EDIT'));

            // const d = new Date('2019-05-25');
            // d.setMinutes( d.getMinutes() + d.getTimezoneOffset() );
            // this.minDate = d; 

            this.isSchedule = true;
            this.isScheduleValid = true;
            this.isEdit = true;
            console.log(this.pageData);
            this.WOInfo.assignee = this.pageData.assign_to;
            //this.WOInfo.assignee_id = this.pageData.assign.type_id;
            this.WOInfo.location_id = this.pageData.work_location_id ? this.pageData.work_location_id : '';
            this.WOInfo.work_location_id = this.pageData.work_location_id ? this.pageData.work_location_id : '';
            this.WOInfo.location = this.pageData.client_work_location ? this.pageData.client_work_location : 'N/A';
            this.WOInfo.client_work_location = this.pageData.client_work_location ? this.pageData.client_work_location : 'N/A';
    // Is Repare Asset
            if(this.pageData.maintenance_request){
                this.assetsDetails = JSON.parse(JSON.stringify(this.pageData.maintenance_request));
            }
            if(this.pageData.scheduleInfo && this.pageData.scheduleInfo.schedule_items[0]){
            let reqObj = {
                        start_date: this.util.getYYYYMMDDDate(this.pageData.scheduleInfo.schedule_items[0].start_date),
                        end_date: this.util.getYYYYMMDDDate(this.pageData.scheduleInfo.schedule_items[0].end_date),
                        start_time: this.pageData.scheduleInfo.schedule_items[0].start_time,
                        end_time: this.pageData.scheduleInfo.schedule_items[0].end_time,
                        start_time_format: this.pageData.scheduleInfo.schedule_items[0].start_time_format,
                        end_time_format: this.pageData.scheduleInfo.schedule_items[0].end_time_format
                    }
                sessionStorage.setItem('schedules', JSON.stringify(reqObj));    
                this.WOService.scheduleDetails = reqObj;
            }

            this.createForm('1',this.pageData);
            this.asset_details.setValue(this.pageData.details);
            this.maintenance_request_id.setValue(this.pageData.maintenance_request_id);
            this.WOService.setcurrentState('EDIT');


        }else if(sessionStorage.getItem('WO_From_Maintenance')){
            this.getLocationList();
            this.getContractorList();
            this.getAssigneeList();
            this.pageData = JSON.parse(sessionStorage.getItem('WO_From_Maintenance'));
            this.fromMaintenance = true;
            console.log(this.pageData);
            this.assetsDetails = this.pageData;
            this.createWOsetupForm('0');
            this.createForm('0');
            this.asset_name.setValue(this.pageData.asset_name);
            this.asset_id.setValue(this.pageData.asset_id);
            this.asset_details.setValue(this.pageData.maintenance_details);
            this.maintenance_request_id.setValue(this.pageData.maintenance_request_id);
            this.requirements.setValue(this.pageData.maintenance_details);
            this.WOService.WO_DATA = {};
        }else{
            this.assetsDetails = null;
            this.getAssetsList();
            this.getLocationList();
            this.getContractorList();
            this.getAssigneeList();
            this.isBack = this.isEdit = false;
            this.createWOsetupForm('0');
            this.createForm('0');
            this.WOService.WO_DATA = {};
        }

        if(localStorage.getItem('USER')){
            this.userInfo = JSON.parse(atob(localStorage.getItem('USER')));
        }
        this.workOrderTab = this.router.url.split('/')[this.router.url.split('/').length - 1];
        this.currentAction = this.WOService.getcurrentState();
        sessionStorage.removeItem('woSetupData');
        console.log('this.filterAssetType: '+this.filterAssetType);
        this.getPEScheduleType();
        if(this.currentAction == "EDIT"){
            this.WOService.updateFormStatus('servicesFm', true);
            this.WOService.updateFormStatus('teamFm', true);
            this.WOService.updateFormStatus('assetsFm', true);
            this.WOService.updateFormStatus('materialsFm', true);
        }

    }
    checkScheduleDates() {
        try {
            console.log(this.schedule_items.value);
            if(this.changeText){
                if (this.schedule_items.at(0).get('start_date').value != '' && this.schedule_items.at(0).get('end_date').value != '' && this.schedule_items.at(0).get('start_time').value != '' && this.schedule_items.at(0).get('end_time').value != '' && this.schedule_items.at(0).get('start_time').valid && this.schedule_items.at(0).get('end_time').valid) {
                    console.log('asd: ', this.schedule_items.at(0).get('end_time').valid);

                    let reqObj: any;
                    if (this.isEdit) {
                        reqObj = {
                            start_date: this.util.getYYYYMMDDDate(this.pageData.scheduleInfo.schedule_items[0].start_date),
                            end_date: this.util.getYYYYMMDDDate(this.pageData.scheduleInfo.schedule_items[0].end_date),
                            start_time: this.pageData.scheduleInfo.schedule_items[0].start_time,
                            end_time: this.pageData.scheduleInfo.schedule_items[0].end_time,
                            start_time_format: this.pageData.scheduleInfo.schedule_items[0].start_time_format,
                            end_time_format: this.pageData.scheduleInfo.schedule_items[0].end_time_format
                        }
                    } else {
                        reqObj = {
                            start_date: this.util.getYYYYMMDDDate(this.schedule_items.at(0).get('start_date').value),
                            end_date: this.util.getYYYYMMDDDate(this.schedule_items.at(0).get('end_date').value),
                            start_time: this.schedule_items.at(0).get('start_time').value,
                            end_time: this.schedule_items.at(0).get('end_time').value,
                            start_time_format: this.schedule_items.at(0).get('start_time_format').value,
                            end_time_format: this.schedule_items.at(0).get('end_time_format').value
                        }
                    }

                    console.log(this.scheduleForm.value);
                    this.isScheduleValid = true;
                    sessionStorage.setItem('schedules', JSON.stringify(reqObj));
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
        }
        catch (err) {
            this.global.addException('WO', 'checkScheduleDates()', err);
        }
    }


    changeTimeFormat(event:any, type){
        console.log(event.target.value);
        console.log(type);
    }

    getAssigneeList(){
        let self = this;
        try{
            // getSubContractor getCommonStatus
            this.http.doGet('getCommonStatus/WO_ASSIGN_TO', function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){ console.log(response) }else{
                    console.log("cotractor List =",response.data.statusList);
                    self.subAssigneeList = response.data.statusList;
                   
                    console.log("cotractor List =",self.subAssigneeList);
                    self.filteredAssignee = self.assignee.valueChanges.pipe(startWith(''),map(value => self.assigneeFilter(value)));
                }
            });
        }
        catch(err){
        this.global.addException('sub assignee list','getAssigneeList()',err);
        }
    }
    getSelectedAssignee(assignee, event: any): void {
        try {
            if (event.isUserInput) {
                console.log(assignee);
                this.assignee_id.setValue(assignee.type_id);
            }
        } catch (err) {
            this.global.addException('WO', 'getSelectedAssignee()', err);
        }
    }

    private assigneeFilter(value: string): string[] {
        try{
        return this.subAssigneeList.filter(option => option.status.toLowerCase().includes(value ? value.toLowerCase() : ''));
        }catch (err) {
            this.global.addException('WO', 'assigneeFilter()', err);
        }
    }

    public validateAssignee(event: any) {
        try {
            let assignee = event.target.value;
            let match = this.subAssigneeList.filter(item => item.status.toLowerCase() == assignee.toLowerCase());
            console.log(match);
            if (assignee == '') {
                this.assignee_id.setValue('');
                return;
            }
            if (match.length > 0) {
                this.assignee_id.setValue(match[0].type_id);
                this.assignee.setValue(match[0].status);
            }
        } catch (err) {
            this.global.addException('WO', 'validateAssignee()', err);
        }
    }

    getContractorList(){
        var self = this;
        try{
            this.http.doGet('admin/suppliers/dropdown', function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){
                    console.log("error",response);
                }else{
                    console.log(response);
                    self.contratorList = [];
                    self.contratorList = response.data;
                    console.log(self.contratorList);
                    self.filteredEmployee = self.supplier_name.valueChanges.pipe(startWith(''), map(data => data ? self.filterEmployee(data, self.contratorList) : self.contratorList.slice()) );

                }
            });
        }catch(err){
            this.global.addException('Work Order Internal', 'getClientList()', err);
        }
    }
    filterEmployee(name: string, list: any[]) {
        try{
            return list.filter(data => data.supplier_name.toLowerCase().indexOf(name.toLowerCase()) === 0);
        }catch(err){
            this.global.addException('Work Order Internal','filterEmployee()',err);
        }
    }
    getSelectedEmployee(event, selAsset: any){
        try{
            if(event && event.isUserInput){
                console.log(selAsset);
                this.supplier_id.setValue(selAsset.supplier_id);
            }
        }catch(err){
            this.global.addException('Work Order Internal','getSelectedEmployee()',err);
        }
    }
    public validateEmployee(event:any){
        try{
            let asset = event.target.value;
            if(asset == ''){
                this.supplier_id.setValue('');
                this.supplier_name.setValue('');
                return;
            }
            let match = this.contratorList.filter(item=>item.supplier_name.toLowerCase() == asset.toLowerCase());
            if(match.length > 0){
                this.supplier_id.setValue(match[0].supplier_id);
                this.supplier_name.setValue(match[0].supplier_name);
            }else{
                this.supplier_id.setValue('');
            }
        }catch(err){
            this.global.addException('Work Order Internal','validateEmployee()',err);
        }
    }


    getAssetsList(){
        var self = this;
        try{
            this.http.doGet('inventory/assets/maintainance', function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){
                    console.log("error",response);
                }else{
                    self.assetsList = response.data;
                    console.log(self.assetsList);
                    self.filteredAssets = self.asset_name.valueChanges.pipe(startWith(''), map(data => data ? self.filterAssets(data, self.assetsList) : self.assetsList.slice()) );
                    if(self.isBack){
                        let match = self.assetsList.filter(item=>item.short_tag.toLowerCase() == self.pageData.repairInfo.asset_name.toLowerCase());
                        if(match.length > 0){
                            self.assetsDetails = match[0];
                        }
                    }
                }
            });
        }catch(err){
            this.global.addException('Work Order Internal', 'getAssetsList()', err);
        }
    }
    filterAssets(name: string, list: any[]) {
        try{
            return list.filter(data => data.short_tag.toLowerCase().indexOf(name.toLowerCase()) === 0);
        }catch(err){
            this.global.addException('Work Order Internal','filterAssets()',err);
        }
    }
    getSelectedAsset(selAsset: any, event){
        try{
            if(event && event.isUserInput){
                console.log(selAsset);
                this.assetsDetails = selAsset;
                this.asset_id.setValue(selAsset.asset_id);
                this.asset_name.setValue(selAsset.short_tag);
                this.requirements.setValue(selAsset.maintenance_details);
            }
        }catch(err){
            this.global.addException('Work Order Internal','getSelectedAsset()',err);
        }
    }
    public validateAsset(event:any){
        try{
            let asset = event.target.value;
            if(asset == ''){
                this.asset_id.setValue('');
                this.asset_name.setValue('');
                this.assetsDetails = null;
                return;
            }
            let match = this.assetsList.filter(item=>item.short_tag.toLowerCase() == asset.toLowerCase());
            if(match.length > 0){
                this.assetsDetails = match[0];
                this.asset_id.setValue(match[0].asset_id);
                this.asset_name.setValue(match[0].short_tag);
            }else{
                this.asset_id.setValue('');
                this.assetsDetails = null;
            }
        }catch(err){
            this.global.addException('Work Order Internal','validateInspector()',err);
        }
    }
    statusFilterAssets(){
        try{
        // this.filterAssetType = this.filterAssetType ? false : true;
        console.log('this.filterAssetType: '+this.isRepairingAsset.value);
        this.assetType = this.isRepairingAsset.value ? '' : 'Needs Maintenance';
        this.asset_id.setValue('');
        this.asset_name.setValue('');
        this.assetsDetails = null;
        this.isRepairingAsset.value ? this.asset_id.setValidators([ Validators.required ]) : this.asset_id.setValidators([]);
        this.asset_id.updateValueAndValidity();
        }
        catch (err) {
            this.global.addException('WO', 'statusFilterAssets()', err);
        }
    }

    getLocationList(){
        let self = this;
        try{
            this.isMainLocationLoad = true;
            this.http.doGet('admin/location?view=min', function(error: boolean, response: any){
                self.isMainLocationLoad = false;
                if( error ){
                }else{
                    self.locList = response.data;
                    self.filteredLocations = self.location.valueChanges.pipe(startWith(''),map(value => self.locationFilter(value)));
                }
            });
        }catch(err){
            this.global.addException('Work Order Internal','getLocationList()',err);
        }
    }
    private locationFilter(value: string): string[] {
        try{
            return this.locList.filter(option => option.location_name.toLowerCase().includes(value ? value.toLowerCase() : ''));
        }catch(err){
            this.global.addException('Work Order Internal','locationFilter()',err);
        }
    }
    public validateLoc(event:any){
        try{
            let loc = event.target.value;
            let match = this.locList.filter(item=>item.location_name.toLowerCase() == loc.toLowerCase());
            if(match.length > 0){
                this.location.setValue(match[0].location_name);
                this.location_id.setValue(match[0].location_id);
                this.getLocationTags(match[0].location_id);
            }
        }catch(err){
            this.global.addException('Work Order Internal','validateLoc()',err);
        }
    }
    getSelectedLocation(event:any, selectedLoc: any){
        console.log();
        try{
            if(event.isUserInput){
                this.location_id.setValue(selectedLoc.location_id);
                console.log(selectedLoc);
                
                this.client_work_location.setValue(selectedLoc.address);
                this.WOInfo.client_work_location = selectedLoc.address;
                this.getLocationTags(selectedLoc.location_id);
            }
        }catch(err){
            this.global.addException('Work Order Internal','getSelectedLocation()',err);
        }
    }
    getSelectedTag(event:any, selectedTag: any){
        try{
            if(event.isUserInput){
                this.location_tag_id.setValue(selectedTag.location_tag_id);
            }
        }catch(err){
            this.global.addException('Work Order Internal','getSelectedTag()',err);
        }
    }
    getLocationTags(id){
        var self = this;
        try{
            self.isSubLocationLoad = true;
            this.http.doGet('admin/location/'+id+'/tags', function(error: boolean, response: any){
                self.isSubLocationLoad = false;
                console.log(response);
                if(error){  console.log("error",response); }else{
                    self.locTagsList = response.data;
                    self.filteredTags = self.location_tag.valueChanges.pipe(startWith(''),map(value => self.locationTagsFilter(value)));
                }
            });
        }catch(err){
            this.global.addException('Work Order Internal','getLocationTags()',err);
        }
    }
    private locationTagsFilter(value: string): string[] {
        try{
            return this.locTagsList.filter(option => option.location_tag.toLowerCase().includes(value ? value.toLowerCase() : ''));
        }catch(err){
            this.global.addException('Work Order Internal','locationTagsFilter()',err);
        }
    }
    public validateLocTags(event:any){
        try{
            let loc = event.target.value;
            let match = this.locTagsList.filter(item=>item.location_tag.toLowerCase() == loc.toLowerCase());
            if(match.length > 0){
                this.location_tag.setValue(match[0].location_tag);
                this.location_tag_id.setValue(match[0].location_tag_id);
            }
        }catch(err){
            this.global.addException('Work Order Internal','validateLocTags()',err);
        }
    }

    changeOccrence(type){
        this.EndDateType = type;
        this.is_after = false;
        if(type=='after'){
            this.is_after = true;
            this.schedule_items.at(1).get('end_date').setValidators([]);
            this.schedule_items.at(1).get('end_after_occurences').setValidators([Validators.required,Validators.min(1), Validators.max(52)]);
            this.schedule_items.at(1).get('end_date').updateValueAndValidity();
            this.schedule_items.at(1).get('end_after_occurences').updateValueAndValidity();
        }else{
            this.schedule_items.at(1).get('end_date').setValidators([Validators.required]);
            this.schedule_items.at(1).get('end_after_occurences').setValidators([]);
            this.schedule_items.at(1).get('end_date').updateValueAndValidity();
            this.schedule_items.at(1).get('end_after_occurences').updateValueAndValidity();
        }

        this.schedule_items.at(1).get('end_after_occurences').setValue('');
        this.schedule_items.at(1).get('end_date').setValue('');
    }
    
    getPEScheduleType(): void {
        try {
            let self = this;
            this.http.doGet('getCommonStatus/PE_SCHEDULE_TYPE', function (error: boolean, response: any) {
                self.util.hideProcessing('processing-spinner');
                if (error) {

                } else {
                    self.pageData.scheduleType = response.data.statusList;
                    
                    if(self.pageData.schedule)
                    {
                        self.addScheduleItem('1', self.pageData.schedule);
                    }
                    else{
                        self.addScheduleItem('0');
                    }
                    
                }
            });
        } catch (err) {
            this.global.addException('WO', 'getPEScheduleType()', err);
        }
    }


    public createWOsetupForm(option, val:any = {}){
        this.setupForm = this.fb.group({
            assignee: new FormControl(option == '0' ? '' : val.repairInfo.assignee, []),
            assignee_id: new FormControl(option == '0' ? '' : val.repairInfo.assignee_id, [Validators.required]),
            asset_name: new FormControl(option == '0' ? '' : val.repairInfo.asset_name, []),
            asset_id: new FormControl(option == '0' ? '' : val.repairInfo.asset_id, [Validators.required]),
            location: new FormControl(option == '0' ? '' : val.repairInfo.location, []),
            location_id: new FormControl(option == '0' ? '' : val.repairInfo.location_id, [Validators.required]),
            location_tag: new FormControl(option == '0' ? '' : val.repairInfo.location_tag, []),
            location_tag_id: new FormControl(option == '0' ? '' : val.repairInfo.location_tag_id, [Validators.required]),
            isRepairingAsset: new FormControl(option == '0' ? true : val.repairInfo.isRepairingAsset),
            
            client_work_location: new FormControl(option == '0' ? '' : val.repairInfo.client_work_location, [])
        });
        if(option != '0'){ this.statusFilterAssets(); };
    }
    get assignee(){return this.setupForm.get('assignee');}
    get assignee_id(){return this.setupForm.get('assignee_id');}
    get asset_name() { return this.setupForm.get('asset_name'); }
    get asset_id() { return this.setupForm.get('asset_id'); }
    get location() { return this.setupForm.get('location'); }
    get location_id() { return this.setupForm.get('location_id'); }
    get location_tag() { return this.setupForm.get('location_tag'); }
    get location_tag_id() { return this.setupForm.get('location_tag_id'); }
    get isRepairingAsset() { return this.setupForm.get('isRepairingAsset'); }
    get client_work_location() { return this.setupForm.get('client_work_location'); }

    next(form: FormGroup) {
        try {
            //console.log(form);
            this.submitted = true;

            if (this.isBack) {
                this.isScheduleValid = true;
            }
            if (form.valid) {
                this.WOInfo = form.value;
                this.WOInfo.assigned = form.value.assigned_to == 'internal' ? 'Staff/Subcontractor' : 'External Contractor';
                this.isSchedule = true;
                this.WOService.WO_DATA.repairInfo = form.value;
                localStorage.removeItem('CREATE_WO');
                if (this.isRepairingAsset.value) {
                    this.asset_details.setValue(this.assetsDetails ? this.assetsDetails : '');
                    this.maintenance_request_id.setValue(this.assetsDetails ? this.assetsDetails.maintenance_request_id : '');
                }
                if (this.assignee.value == 'Contractor') {
                    let create_WO_Obj: any = {};
                    create_WO_Obj.WO_TYPE = 'Internal Contractor';
                    create_WO_Obj.assetsDetails = this.assetsDetails;
                    create_WO_Obj.repairInfo = form.value;
                    create_WO_Obj.repairInfo.maintenance_request_id = this.maintenance_request_id.value;
                    localStorage.setItem('CREATE_WO', JSON.stringify(create_WO_Obj));
                    this.router.navigate(['/workflow/wo/csa/wo-sub-contractor']);
                }
            }
        } catch (err) {
            this.global.addException('WO', 'next()', err);
        }
    }
    save(form:FormGroup){
        this.submittedS = true;
        this.isError = false;
        this.errMsg = "";
        let scIndex ;
        try {
        scIndex =  this.scheduleType=='once' ? 0 : 1;
        if(this.scheduleType== 'once' ){


            this.schedule_items.at(0).get('start_time').setValidators([Validators.required,Validators.pattern(this.constant.TIME_PATTERN)]);

            this.schedule_items.at(0).get('end_time').setValidators([Validators.required,Validators.pattern(this.constant.TIME_PATTERN)]);

            this.schedule_items.at(0).get('start_time').updateValueAndValidity();
            this.schedule_items.at(0).get('end_time').updateValueAndValidity();

        }
        console.log(this.scheduleForm , this.timeNowError)
        if(form.valid && !this.timeNowError){
            this.WOService.WO_DATA.scheduleInfo = form.value;
            this.WOService.WO_DATA.scheduleDetails = JSON.parse(JSON.stringify(this.scheduleForm.value.schedule_items[scIndex])) ;
            if(this.currentAction != 'EDIT'){
                if(this.workOrderTab == 'services'){
                    this.checkFormStatusEvent('ADD_SERVICES', { 'validation': true });
                    if(this.WOService.getFormValidationStatus().servicesFm){
                        //this.quatationTab = 'materials';
                        this.changeQuotTab('team');
                    }
                    return;

                }
                if(this.workOrderTab == 'team'){
                    this.checkFormStatusEvent('ADD_TEAM', { 'validation': true });
                    if(this.WOService.getFormValidationStatus().teamFm){
                        //this.quatationTab = 'materials';
                        this.changeQuotTab('assets');
                    }
                    return;
                }
                if(this.workOrderTab == 'assets'){
                    this.checkFormStatusEvent('ADD_ASSETS', { 'validation': true });
                    if(this.WOService.getFormValidationStatus().assetsFm){
                        //this.quatationTab = 'materials';
                        this.changeQuotTab('products');
                    }
                    return;
                }
                if(this.workOrderTab == 'products'){
                    //this.changeQuotTab('images');
                    this.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': true });
                    if(this.WOService.getFormValidationStatus().materialsFm){
                         this.checkValidation();
                    }
                }
            }else{
                this.workOrderTab == 'services' ? this.checkFormStatusEvent('ADD_SERVICES', { 'validation': true }) : '';
                this.workOrderTab == 'team' ? this.checkFormStatusEvent('ADD_TEAM', { 'validation': true }) : '';
                this.workOrderTab == 'assets' ? this.checkFormStatusEvent('ADD_ASSETS', { 'validation': true }) : '';
                this.workOrderTab == 'products' ? this.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': true }) : '';
            }

            this.checkFormStatusEvent('ADD_TEAM', { 'validation': true });
            if(!this.WOService.getFormValidationStatus().teamFm){
                this.changeQuotTab('team');
                return;
            }

            this.checkFormStatusEvent('ADD_SERVICES', { 'validation': true });
            if(!this.WOService.getFormValidationStatus().servicesFm){
                this.changeQuotTab('services');
                return;
            }
            console.log("this.WOService.getFormValidationStatus().materialsFm",this.WOService.getFormValidationStatus().materialsFm);

            if(!this.WOService.getFormValidationStatus().materialsFm){
                return;
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

    // Commented Due to New Logic : Note = Don't remove this commented code @shubham
            // if(this.WOService.WO_DATA.materialsDetails){
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
            //         //     this.changeQuotTab('products');
            //         //     return;
            //         // }
            //     }
            // }

            console.log(this.WOService.WO_DATA);
            if(this.WOService.WO_DATA.assetsDetails){
                for(let i = 0; i < this.WOService.WO_DATA.assetsDetails.length; i++){
                    if(this.currentAction != 'EDIT'){
                        this.WOService.WO_DATA.assetsDetails[i].start_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.assetsDetails[i].start_date);
                        this.WOService.WO_DATA.assetsDetails[i].end_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.assetsDetails[i].end_date);
                    }
                    // if(this.isEdit && i < this.pageData.assetsDetails.length){
                    //     this.WOService.WO_DATA.assetsDetails[i].scheduling_id = this.pageData.assetsDetails[i].scheduling_id;
                    // }
                }
            }

            if(this.WOService.WO_DATA.scheduleInfo && this.WOService.WO_DATA.scheduleInfo){
                for(let i = 0; i < this.WOService.WO_DATA.scheduleInfo.schedule_items.length; i++){
                    if(this.currentAction != 'EDIT'){
                      // alert('1');
                      this.WOService.WO_DATA.scheduleInfo.schedule_items[i].start_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.scheduleInfo.schedule_items[i].start_date);
                      this.WOService.WO_DATA.scheduleInfo.schedule_items[i].end_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.scheduleInfo.schedule_items[i].end_date);
                    }
                    if(this.isEdit && i < this.pageData.scheduleInfo.schedule_items.length){
                      console.log('2 ==', this.WOService.WO_DATA.scheduleInfo.schedule_items[i].start_date);
                        this.WOService.WO_DATA.scheduleInfo.schedule_items[i].scheduling_id = this.pageData.scheduleInfo.schedule_items[i].scheduling_id;
                    }
                }
            }

            if(this.WOService.WO_DATA.teamDetails){
                for(let i = 0; i < this.WOService.WO_DATA.teamDetails.length; i++){
                    if(this.currentAction != 'EDIT'){
                        this.WOService.WO_DATA.teamDetails[i].start_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.teamDetails[i].start_date);
                        this.WOService.WO_DATA.teamDetails[i].end_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.teamDetails[i].end_date);

                    }
                    // if(this.isEdit && i < this.pageData.teamDetails.length){
                    //     this.WOService.WO_DATA.teamDetails[i].scheduling_id = this.pageData.teamDetails[i].scheduling_id;
                    // }

                }
            }

            // if(this.WOService.WO_DATA.servicesDetails){
            //     for(let i = 0; i < this.WOService.WO_DATA.servicesDetails.length; i++){

            //         if(this.isEdit && i < this.pageData.servicesDetails.length){
            //             this.WOService.WO_DATA.servicesDetails[i].wo_service_id = this.pageData.servicesDetails[i].wo_service_id;
            //         }
            //     }
            // }

            // if(this.WOService.WO_DATA.materialsDetails){
            //     for(let i = 0; i < this.WOService.WO_DATA.materialsDetails.length; i++){
            //         if(this.isEdit && i < this.pageData.materialsDetails.length){
            //             this.WOService.WO_DATA.materialsDetails[i].wo_material_id = this.pageData.materialsDetails[i].wo_material_id;
            //         }
            //     }
            // }

            this.WOService.WO_DATA.client_id = null;
            if(this.currentAction == 'EDIT'){
                this.addCR();
            }else{
              console.log('without stringify date = ',  this.WOService.WO_DATA.scheduleDetails.start_date);
              console.log('with stringify date = ',  JSON.stringify(this.WOService.WO_DATA.scheduleDetails.start_date));

                this.WOService.WO_DATA.scheduleDetails.start_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.scheduleDetails.start_date);
                this.WOService.WO_DATA.scheduleDetails.end_date = this.util.getDDMMYYYYDate(this.WOService.WO_DATA.scheduleDetails.end_date);


                sessionStorage.setItem('WO_DETAILS', JSON.stringify(this.WOService.WO_DATA));
                this.router.navigate(['/workflow/wo/csa/work-order-review']);
            }

        }
        } catch (err) {
            this.global.addException('WO', 'save()', err);
        }
    }
    checkValidation(): void {
        try {
            this.isError = false;
            this.checkFormStatusEvent('ADD_SERVICES', { 'validation': true });
            this.checkFormStatusEvent('ADD_TEAM', { 'validation': true });
            this.checkFormStatusEvent('ADD_ASSETS', { 'validation': true });
            this.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': true });
            if (!this.WOService.getFormValidationStatus().servicesFm) {
                this.workOrderTab = 'services';
                this.router.navigate(['//workflow/wo/csa/work-order/services']);
                return;
            } else if (!this.WOService.getFormValidationStatus().teamFm) {
                this.workOrderTab = 'team';
                this.router.navigate(['//workflow/wo/csa/work-order/team']);
                return;
            } else if (!this.WOService.getFormValidationStatus().assetsFm) {
                this.workOrderTab = 'assets';
                this.router.navigate(['//workflow/wo/csa/work-order/assets']);
                return;
            } else if (!this.WOService.getFormValidationStatus().materialsFm) {
                this.workOrderTab = 'products';
                this.router.navigate(['//workflow/wo/csa/work-order/products']);
                return;
            }
        } catch (err) {
            this.global.addException('WO', 'checkValidation()', err);
        }
    }
    changeQuotTab(tabName, checkValidation: boolean = true){
        console.log(tabName);
        if(this.workOrderTab == 'services'){
            this.checkFormStatusEvent('ADD_SERVICES', { 'validation': checkValidation });
            if(checkValidation && !this.WOService.getFormValidationStatus().servicesFm){
                console.log('1');
                return
            }
        }

        if(this.workOrderTab == 'products'){
            this.checkFormStatusEvent('ADD_PROD_MAT', { 'validation': checkValidation });
            if(checkValidation && !this.WOService.getFormValidationStatus().materialsFm){
                console.log('2');
                return;
            }
        }
        if(this.workOrderTab == 'team'){
            this.checkFormStatusEvent('ADD_TEAM', { 'validation': checkValidation });
            if(checkValidation && !this.WOService.getFormValidationStatus().teamFm){
                console.log('3');
                return;
            }
        }
        if(this.workOrderTab == 'assets'){
            this.checkFormStatusEvent('ADD_ASSETS', { 'validation': checkValidation });
            if(checkValidation && !this.WOService.getFormValidationStatus().assetsFm){
                console.log('4');
                return;
            }
        }

        this.workOrderTab = tabName;
        this.router.navigate(['/workflow/wo/csa/work-order/'+tabName]);
    }
    checkFormStatusEvent(action, data): void {
        this.util.changeEvent({
            'source': 'INTERNAL_WO',
            'action': action,
            'data': data
        });
    }


    public changeSchedule(type){
        try{
        console.log(type);
        this.scheduleType = type;
        this.timeNowError = false;
        if(this.scheduleType == 'now'){
            this.schedule_items.at(2).get('start_date').setValue(this.today);
            this.schedule_items.at(2).get('end_date').setValue(this.today);
        }
        }
        catch (err) {
            this.global.addException('WO', 'changeSchedule()', err);
        }

    }
    createForm(option, val:any = {}){
        this.scheduleForm = this.fb.group({
            supplier_name:new FormControl(option == '0' ? '' : val.scheduleInfo.supplier_name, []),
            supplier_id:new FormControl(option == '0' ? '' : val.scheduleInfo.supplier_id, []),
            asset_details:new FormControl(option == '0' ? '' : val.scheduleInfo.asset_details, {}),
            maintenance_request_id:new FormControl(option == '0' ? '' : val.scheduleInfo.maintenance_request_id, []),
            requirements: new FormControl(option == '0' ? '' : val.scheduleInfo.requirements),
            schedule_items: this.fb.array([])
        });
        if( option == '1' ){
            console.log('val.scheduleInfo.schedule_items.length: '+val.scheduleInfo.schedule_items.length);
            
            this.util.hideProcessing('processing-spinner');
        }else{
            
        }
      };
    get supplier_name() { return this.scheduleForm.get('supplier_name'); }
    get supplier_id() { return this.scheduleForm.get('supplier_id'); }
    get asset_details() { return this.scheduleForm.get('asset_details'); }
    get maintenance_request_id() { return this.scheduleForm.get('maintenance_request_id'); }
    get schedule_items(): FormArray{ return <FormArray>this.scheduleForm.get('schedule_items') as FormArray; }
    get requirements() { return this.scheduleForm.get('requirements'); }
   

    addScheduleItem(option,  formVal:any = {}){
        console.log("formval",formVal);

        const dStart = new Date(formVal.start_date);
        dStart.setMinutes( dStart.getMinutes() + dStart.getTimezoneOffset() );

        const dEnd = new Date(formVal.end_date);
        dEnd.setMinutes( dEnd.getMinutes() + dEnd.getTimezoneOffset() );

       try{
            this.schedule_items.push(this.fb.group({
                schedule_type: new FormControl(1), 
                start_date: new FormControl(option == '0' ? '' : this.util.getTimeZoneDate(formVal.start_date)), //Only for review
                //start_date: new FormControl(option == '0' ? '' : this.util.getYYYYMMDDDate(this.util.stringToDate(formVal.start_date)) ), //Only for review
                scheduling_id : new FormControl(option == '0' ? '' : formVal.scheduling_id), //Only for review
                end_date: new FormControl(option == '0' ? '' : this.util.getTimeZoneDate(formVal.end_date)),
                //end_date: new FormControl(option == '0' ? '' : this.util.getYYYYMMDDDate(this.util.stringToDate(formVal.end_date)) ),
                start_time: new FormControl(option == '0' ? '' : formVal.start_time.substring(0,5),[Validators.pattern(this.constant.TIME_PATTERN)] ), //Only for review
                start_time_format: new FormControl(option == '0' ? 'am' : formVal.start_time_format),
                end_time: new FormControl(option == '0' ? '' : formVal.end_time.substring(0,5),[Validators.pattern(this.constant.TIME_PATTERN)]),
                end_time_format: new FormControl(option == '0' ? 'am' : formVal.end_time_format),
            }));
            console.log("formval",formVal);
        }catch(err){
            this.global.addException('Schedule add','addScheduleItem()',err);
        }
    }
    startDateChange(event,index){
        console.log(event);
        console.log(this.schedule_items.at(index).get('start_date').value);
        this.schedule_items.at(index).get('start_date').setValue(event);
        this.schedule_items.at(index).get('end_date').setValue('');
        this.setSchedule(index);
    }


    clearendtime(event, index) {
        try {
            this.timeNowError = false;
            this.schedule_items.at(index).get('end_time').setValue('');
            this.setSchedule(index);
        }
        catch (err) {
            this.global.addException('WO', 'clearendtime()', err);
        }
    }

    compareendtime(event, index) {
        try {
            console.log(index)
            this.timeNowError = false;
            console.log(this.schedule_items.at(index).get('start_date').value);
            let startDate = new Date(this.schedule_items.at(index).get('start_date').value);
            let startDateDay = startDate.getDate();
            let startDateMonth = startDate.getMonth();
            let startDateYear = startDate.getFullYear();

            let startDatestring = new Date(String(startDateYear) + '-' + String(startDateMonth) + '-' + String(startDateDay) + " " + this.schedule_items.at(index).get('start_time').value + " " + this.schedule_items.at(index).get('start_time_format').value);

            let endDate = new Date(this.schedule_items.at(index).get('end_date').value);
            let endDateDay = endDate.getDate();
            let endDateMonth = endDate.getMonth();
            let endDateYear = endDate.getFullYear();

            let endDatestring = new Date(String(endDateYear) + '-' + String(endDateMonth) + '-' + String(endDateDay) + " " + this.schedule_items.at(index).get('end_time').value + " " + this.schedule_items.at(index).get('end_time_format').value);

            console.log(startDatestring.getTime(), endDatestring.getTime(), endDatestring, startDatestring);
            if (startDatestring.getTime() > endDatestring.getTime()) {
                this.timeNowError = true;
            }
            else {
                this.timeNowError = false;
            }
            if (this.schedule_items.at(index).get('start_date').value != '' && this.schedule_items.at(index).get('start_date').value != '') {
                // code...
            }
            this.setSchedule(index);
        } catch (err) {
            this.global.addException('WO Subcontractor', 'compareendtime()', err);
        }
    }

    scheduleStartDateChange(event, index){
        console.log(event);
        this.schedule_items.at(index).get('end_date').setValue('');
    }
    setSchedule(index){
        console.log(this.schedule_items.value);
        if(this.changeText){
            if(this.schedule_items.at(index).get('start_date').value != '' && this.schedule_items.at(index).get('end_date').value != '' && this.schedule_items.at(index).get('start_time').value != '' && this.schedule_items.at(index).get('end_time').value != '' && this.schedule_items.at(index).get('start_time').valid && this.schedule_items.at(index).get('end_time').valid){
                console.log('asd: ',this.schedule_items.at(index).get('end_time').valid);

                let reqObj:any;
                if(this.isEdit){
                    reqObj = {
                        start_date: this.util.getYYYYMMDDDate(this.pageData.scheduleInfo.schedule_items[0].start_date),
                        end_date: this.util.getYYYYMMDDDate(this.pageData.scheduleInfo.schedule_items[0].end_date),
                        start_time: this.pageData.scheduleInfo.schedule_items[0].start_time,
                        end_time: this.pageData.scheduleInfo.schedule_items[0].end_time,
                        start_time_format: this.pageData.scheduleInfo.schedule_items[0].start_time_format,
                        end_time_format: this.pageData.scheduleInfo.schedule_items[0].end_time_format
                    }
                }else{
                    reqObj = {
                        start_date: this.util.getYYYYMMDDDate(this.schedule_items.at(index).get('start_date').value),
                        end_date: this.util.getYYYYMMDDDate(this.schedule_items.at(index).get('end_date').value),
                        start_time: this.schedule_items.at(index).get('start_time').value,
                        end_time: this.schedule_items.at(index).get('end_time').value,
                        start_time_format: this.schedule_items.at(index).get('start_time_format').value,
                        end_time_format: this.schedule_items.at(index).get('end_time_format').value
                    }
                }
                this.WOService.scheduleDetails = reqObj;
                console.log(this.scheduleForm.value);
                console.log(reqObj);
                this.isScheduleValid = true;
                sessionStorage.setItem('schedules', JSON.stringify(reqObj) );
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
    }
    testClick(form:FormGroup){
        console.log(form);
    }

    showMemberSearchPopup(){
        this.dialog.open(WorkOrderDialog, { data: { 'action': 'memberSearch' } });
    }

    showAssetSearchPopup(){
        this.dialog.open(WorkOrderDialog, { data: { 'action': 'assetSearch' } });
    }

    addCR(): void {
        try {
            let self = this;
            let reqObj: any = {
                'assign_to': 1,
                'status' : this.WOService.WO_DATA.status_id,
                'require_client_sign': 0,
                'requirements': this.scheduleForm.value.requirements,
                'work_order_id': this.WOService.WO_DATA.work_order_id,
                'work_order_type': 1,
                'is_repairing_asset': this.WOService.WO_DATA.is_repairing_asset ? this.WOService.WO_DATA.is_repairing_asset : 0,
                'client_id': '',
                'client_name': '',
                'email_id': '',
                'phone_no': '',
                'project_estimate_id': '',
                'maintenance_request_id':this.WOService.WO_DATA.maintenance_request_id ? this.WOService.WO_DATA.maintenance_request_id : '',
                'asset_id': this.WOService.WO_DATA.asset_id ? this.WOService.WO_DATA.asset_id : '',
                'work_location_id': this.WOService.WO_DATA.work_location_id,
                'client_work_location': this.WOService.WO_DATA.client_work_location,
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

            self.util.addSpinner('update-btn', "Update");
            this.http.doPost('work-order/save', reqObj, function (error: boolean, response: any) {
                self.util.removeSpinner('update-btn', "Update");
                if (error) {
                    self.isError = true;
                    self.errMsg = response.message;
                } else {
                    self.util.showDialog(DialogComponent, response.message, ['/workflow/wo/csa/work-order-list/0'])
                }
            });
        }
        catch (err) {
            this.global.addException('WO', 'addCR()', err);
        }
    }
}
