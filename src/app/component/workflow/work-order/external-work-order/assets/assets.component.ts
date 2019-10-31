/*
    TO DO : Commonout code form getAssetList() and setAssetList()
*/


import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl, FormGroupDirective } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { UtilService } from '../../../../../shared/service/util.service';
import { HttpService } from '../../../../../shared/service/http.service';
import { ConstantsService } from '../../../../../shared/service/constants.service';
import { GlobalService } from '../../../../../shared/service/global.service';
import { WorkOrderService } from '../../work-order.service';

import { WorkOrderDialog } from './../../work-order-dialog.component';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss']
})
export class WOAssetsComponent implements OnInit {
    minDate = new Date();
    maxDate: any;
    public assetForm: FormGroup;
    public assetsList: any[] = [];
    backupAssetList: any[] = [];
    public submitted: boolean = false;
    public pageData:any = {};
    subscription: Subscription;

    @Input() asset: any;
  dStart: Date;
  dEnd: Date;

    constructor(
        public router: Router,
        public util: UtilService,
        public global: GlobalService,
        private constant: ConstantsService,
        private fb: FormBuilder,
        private http:HttpService,
        public woService: WorkOrderService,
        public route: ActivatedRoute
    ) { }

    ngOnInit() {
        let self = this;
        this.pageData.currentUrl = this.router.url.split('/')[5];
        this.woService.quatationTab = 'assets';
        this.util.setPageTitle(this.route);
        this.getAssetList(0);
        if(this.woService.WO_DATA.assetsDetails){
            if(this.woService.WO_DATA.scheduleInfo){
                this.minDate = new Date(this.woService.WO_DATA.scheduleInfo.schedule_items[0].start_date);
            }
            console.log("his.woService.WO_DATA.assetsDetails ::",this.woService.WO_DATA.assetsDetails);
            this.addAssetForm('1', this.woService.WO_DATA.assetsDetails);
            this.addAssociatedAsset();
        }else{
            this.addAssetForm('0');
            this.addAssociatedAsset();
        }

        this.subscription = this.util.changeDetection.subscribe(dataObj => {
            if(dataObj && (dataObj.source == 'INTERNAL_WO' || dataObj.source == 'EXTERNAL_WO') && dataObj.action == 'ADD_ASSETS'){
            	console.log('ggggggggggggggg  aaaa');
                this.review();
            }
            if(dataObj && dataObj.source == 'WO_INTERNAL' && dataObj.action == 'SCHEDULE_CHANGE'){
                console.log('SCHEDULE_CHANGE in assets');

                this.minDate = new Date(this.woService.scheduleDetails ? this.woService.scheduleDetails.start_date : '');
                this.maxDate = new Date(this.woService.scheduleDetails ? this.woService.scheduleDetails.end_date : '');

                delete this.woService.WO_DATA.assetsDetails;
                for (let i = self.assets.length - 1; i >= 0; i--) {
                    self.assets.removeAt(i);
                }
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    //Get Material/Product List
    getAssetList(index, scheduleObj: any = JSON.parse(sessionStorage.getItem('schedules'))) {
        var self = this;
        let reqObj: any = {
            'start_date': this.util.getYYYYMMDDDate(scheduleObj.start_date),
            'end_date': this.util.getYYYYMMDDDate(scheduleObj.end_date),
            'start_time': scheduleObj.start_time.substring(0, 5),
            'end_time': scheduleObj.end_time.substring(0, 5),
            'start_time_format': scheduleObj.start_time_format,
            'end_time_format': scheduleObj.end_time_format,
            'work_order_id': this.woService.WO_DATA.work_order_id ? this.woService.WO_DATA.work_order_id : 0
        }
        try {
            this.util.showProcessing('processing-spinner');
            this.http.doPost('work-order/asset', reqObj, function (error: boolean, response: any) {
                self.util.hideProcessing('processing-spinner');
                if (error) { console.log(response) } else {
                    self.assetsList = [];
                    // for (let i = response.data.length - 1 ; i >= 0; i--) {
                    //     for (let j = 0; j < self.assets.length; j++) {
                    //         if(response.data[i] && self.assets.at(j).get('asset_id').value == response.data[i].asset.asset_id){
                    //             response.data = response.data.filter(item => item.asset.asset_id != self.assets.at(j).get('asset_id').value);
                    //         }
                    //     }
                    // }
                    self.assetsList = response.data;
                    self.backupAssetList = JSON.parse(JSON.stringify(self.assetsList));
                    
                    for (let i = 0; i < self.assets.length; i++) {
                        let asset: any = self.assetsList.filter(option => option.asset_id == self.assets.at(i).get('asset_id').value)[0];
                        if (asset) {
                            self.getSelectedAsset(asset, { isUserInput: true }, i);
                        }
                    }
                }
            });
        } catch (err) {
            this.global.addException('Work order', 'getAssetList()', err);
        }
    }
    private assetFilter(value: string, index: number = 0): string[] {
            return this.assetsList.filter(option => option.asset_name.toLowerCase().includes(value ? value.toLowerCase() : ''));
    }
    clearSelAssetList(asset,index) {
        try {
            this.assets.at(index).get('remark').setValue('');
            asset.get('asset_id').value != '' ? this.addServiceToList(asset.get('asset_id').value, 'asset_id', this.assetsList, this.backupAssetList) : '' ;
        } catch (err) {
            this.global.addException('Work order', 'clearSelAssetList()', err);
        }
    }

    removeServiceFormList = (id, key, list) => {
        this.assetsList = list.filter(item => item[key] != id);
        for (let i = 0; i < this.assets.length; i++) {
            this.assets.at(i).get('asset_id').value == '' ? this.setObservable(i) : '';
        }
    };

    addServiceToList = (id, key, list, backupList) => {
        if(backupList.filter(item => item[key] == id).length > 0){
            list.push(backupList.filter(item => item[key] == id)[0]);
        }
        for (let i = 0; i < this.assets.length; i++) {
            this.assets.at(i).get('asset_id').value == '' ? this.setObservable(i) : '';
        }
    }
    getSelectedAsset(asset, event: any = false, index): void {
        try{
        console.log("event",event,asset);
            if(event.isUserInput){
                console.log("getSelectedAsset",asset);
                this.assets.at(index).get('asset_id').setValue(asset.asset_id);
                this.assets.at(index).get('asset_name').setValue(asset.asset_name);
                this.assets.at(index).get('remark').setValue(asset.remark);
                this.removeServiceFormList(asset.asset_id, 'asset_id', this.assetsList);
            }
        } catch (err) {
            this.global.addException('Work order', 'getSelectedAsset()', err);
        }
    }

    public validateAsset(event: any, item: any, index) {
        try {
            let team = event.target.value;
            if (team == '') {
                item.get('asset_id').setValue('');
                return;
            }
            let match = this.assetsList.filter(item => item.short_tag.toLowerCase() == team.toLowerCase());
            if (match.length > 0) {
                item.get('asset_id').setValue(match[0].asset_id);
                item.get('asset_name').setValue(match[0].asset_name);
                item.get('remark').setValue(match[0].remark);
                this.removeServiceFormList(match[0].asset_id, 'asset_id', this.assetsList);
            } else {
                item.get('asset_id').setValue('');
            }
        } catch (err) {
            this.global.addException('Work order', 'validateAsset()', err);
        }
    }


    addAssetForm(option, data: any = {}){
        try {
            this.minDate = new Date(this.woService.scheduleDetails ? this.woService.scheduleDetails.start_date : '');
            this.maxDate = new Date(this.woService.scheduleDetails ? this.woService.scheduleDetails.end_date : '');
            this.assetForm = this.fb.group({
                assets: this.fb.array([])
            });
            if (option == '1') {
                for (var i = 0; i < data.length; i++) {
                    this.addAssets(option, data[i]);
                    this.removeServiceFormList(data[i].asset_id, 'asset_id', this.assetsList);
                }
            }
        } catch (err) {
            this.global.addException('Work order', 'addAssetForm()', err);
        }
    }

    get assets(): FormArray{ return <FormArray>this.assetForm.get('assets') as FormArray;};

    addAssets(option, val: any = {}){
        try{
          if(val) {
            this.dStart = new Date(val.start_date);
            this.dStart.setMinutes( this.dStart.getMinutes() + this.dStart.getTimezoneOffset() );
            this.dEnd = new Date(val.end_date);
            this.dEnd.setMinutes( this.dEnd.getMinutes() + this.dEnd.getTimezoneOffset() );
          }
            this.assets.push(this.fb.group({
                asset_name: new FormControl(option == '1' ? val.asset_name : ''),
                asset_id: new FormControl(option == '1' ? val.asset_id : '', []), //Validators.required
                scheduling_id: new FormControl(option == '1' ? val.scheduling_id : ''),
                start_date: new FormControl(option == '1' ?  this.dStart : this.woService.scheduleDetails ? this.util.getDateObjet(this.woService.scheduleDetails.start_date) : '', [Validators.required]),
                start_time: new FormControl(option == '1' ? val.start_time.substring(0,5) : this.woService.scheduleDetails ? this.woService.scheduleDetails.start_time.substring(0,5) : '', [Validators.pattern(this.constant.TIME_PATTERN)]), //Validators.required
                start_time_format: new FormControl(option == '1' ? val.start_time_format : this.woService.scheduleDetails ? this.woService.scheduleDetails.start_time_format : ''),
                end_date: new FormControl(option == '1' ?  this.dEnd : this.woService.scheduleDetails ? this.util.getDateObjet(this.woService.scheduleDetails.end_date) : '', [Validators.required]),
                end_time: new FormControl(option == '1' ? val.end_time.substring(0,5) : this.woService.scheduleDetails ? this.woService.scheduleDetails.end_time.substring(0,5) : '', [Validators.pattern(this.constant.TIME_PATTERN)]), //Validators.required
                end_time_format: new FormControl(option == '1' ? val.end_time_format : this.woService.scheduleDetails ? this.woService.scheduleDetails.end_time_format : ''),
                filteredAsset: new FormControl( new Observable<string[]>() ),
                remark: new FormControl(''),
                is_delete: new FormControl(0)
            }));
            this.setObservable(this.assets.length - 1);
        }catch(err){
            this.global.addException('Work order', 'addAssets()', err, { 'assetParam': val, 'woServiceData': this.woService, 'formData': this.assetForm.value });
        }
    }
    test(form:FormGroup){
    	console.log(form);
    	this.submitted = true;
    }
    setObservable(index): void {
        this.assets.at(index).get('filteredAsset').setValue(this.assets.at(index).get('asset_name').valueChanges.pipe(startWith(''),map(value => this.assetFilter(value))));
    }

    removeAsset(position, asset): void {
        //this.util.focusHiddenInput('hiddenInput');
        if(this.assets.at(position).get('scheduling_id').value != ""){
            this.woService.deletedAsset.push(this.assets.at(position).get('scheduling_id').value);
        }
        asset.get('asset_id').value != '' ? this.addServiceToList(asset.get('asset_id').value, 'asset_id', this.assetsList, this.backupAssetList) : '' ;
        this.assets.removeAt(position);
    }
    review() {
        try {
            console.log(this.assetForm);
            this.submitted = true;
            if (this.assetForm.valid) {
                let assets: any[] = [];
                for (var i = 0; i < this.assetForm.value.assets.length; i++) {
                    assets.push({
                        "asset": this.assetForm.value.assets[i].asset_name,
                        "asset_id": this.assetForm.value.assets[i].asset_id,
                        "scheduling_id": this.assetForm.value.assets[i].scheduling_id,
                        "start_date": this.util.getYYYYMMDDDate(this.assetForm.value.assets[i].start_date),
                        "end_date": this.util.getYYYYMMDDDate(this.assetForm.value.assets[i].end_date),
                        "start_time": this.assetForm.value.assets[i].start_time,
                        "start_time_format": this.assetForm.value.assets[i].start_time_format,
                        "end_time": this.assetForm.value.assets[i].end_time,
                        "end_time_format": this.assetForm.value.assets[i].end_time_format,
                        "is_delete": 0
                    });
                }
                this.woService.WO_DATA.assetsDetails = assets;
                this.woService.updateFormStatus('assetsFm', true);
            } else {
                this.woService.updateFormStatus('assetsFm', false);
            }
        } catch (err) {
            this.global.addException('Work order', 'review()', err, { 'woServiceData': this.woService, 'formData': this.assetForm.value });
        }
    }

    addAssociatedAsset(): void {
        if(this.woService.WO_DATA.teamDetails){
            this.woService.WO_DATA.teamDetails.map(member => {
                if(member.associatedAssetList && member.associatedAssetList.length > 0){
                    console.log("member.associatedAssetList::",member.associatedAssetList);
                    member.associatedAssetList.map(associatedAsset => {
                        this.woService.associatedAsset.map( aAsset => {
                            if(aAsset.asset_id == associatedAsset.asset_id && aAsset.status == 'Not Added'){
                                let search: boolean = true;
                                for (let i = 0; i < this.assetForm.value.assets.length; i++) {
                                    search = true;
                                    if(this.assetForm.value.assets[i].asset_id == aAsset.asset_id){
                                        search = false;
                                        break;
                                    }
                                }
                                if(search){
                                    let asset = JSON.parse(JSON.stringify(member));
                                    asset.asset_id = associatedAsset.asset_id;
                                    asset.asset_name = associatedAsset.short_tag;
                                    this.addAssets('1', asset);
                                    aAsset.status = 'Added';
                                };
                            }
                        })
                    });
                }
            });
        }
    }
}



