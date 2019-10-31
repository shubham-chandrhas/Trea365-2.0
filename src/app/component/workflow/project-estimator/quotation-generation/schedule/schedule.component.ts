import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, NativeDateAdapter  } from '@angular/material';
import { Router } from '@angular/router';
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder, FormArray } from '@angular/forms';

import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { GlobalService } from '../../../../../shared/service/global.service';
import { UtilService } from '../../../../../shared/service/util.service';
import { HttpService } from '../../../../../shared/service/http.service';
import { AdminService } from '../../../../admin/admin.service';
import { ConstantsService } from '../../../../../shared/service/constants.service';
import { ProjectEstimatorService } from '../../project-estimator.service';
import { element } from '../../../../../../../node_modules/protractor';

@Component({
	selector: 'app-schedule',
	templateUrl: './schedule.component.html',
	styleUrls: ['../quotation-generation.component.css', './schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
    //scheduleType: string = 'once';
    scheduleType: string = 'not_known';
    EndDateType : string = '';
    is_after:boolean = false;
	scheduleForm: FormGroup;
    submitted:boolean = false;
    startTimeNow:any = '';
    public repeatList:any[] = [];
    public empList:any[] = [];
    filteredScheduleRepeat: Observable<string[]>;
    timeNowError:boolean = false;
    pageData: any = { 'scheduleType': [] };
    public minDate = new Date();
    public today = new Date();
    mapTypeId: string;
    showMap: boolean = false;
    subscription: Subscription;
	constructor(
		private fb: FormBuilder,
		private constant: ConstantsService,
		public util: UtilService,
	    public http: HttpService,
	    public global: GlobalService,
	    public dialog: MatDialog,
        public router: Router,
        private admin: AdminService,
        private PEService: ProjectEstimatorService
	) {

		this.createForm('0');

	}

	ngOnInit() {
        this.mapTypeId = 'roadmap';
        this.showMap = this.PEService.locationDetails.latitude && this.PEService.locationDetails.longitude && this.PEService.locationDetails.latitude != '' && this.PEService.locationDetails.longitude ? true : false;
        this.util.showProcessing('processing-spinner');
        this.getPEScheduleType();
        this.subscription = this.util.changeDetection.subscribe(dataObj => {
            if(dataObj && dataObj.source == 'QUOTATION_GENERATION' && dataObj.action == 'ADD_SCHEDULE'){
                this.reviewSchedule();
            }
        });

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    setMapType(mapTypeId: string) { this.mapTypeId = mapTypeId; }

    

    getPEScheduleType(): void {
        let self = this;
        this.http.doGet('getCommonStatus/PE_SCHEDULE_TYPE', function(error: boolean, response: any){
            self.util.hideProcessing('processing-spinner');
            if( error ){

            }else{
                self.pageData.scheduleType = response.data.statusList;
                if(self.PEService.projectEstimatorData.project_estimate_id){
                    self.minDate = self.PEService.projectEstimatorData.schedules ? new Date(self.PEService.projectEstimatorData.schedules.start_date) : new Date();
                }
                for (var i = 0; i < self.pageData.scheduleType.length ; i++) {
                    if(self.PEService.projectEstimatorData.scheduleDetails && (self.pageData.scheduleType[i].type_id == self.PEService.projectEstimatorData.scheduleDetails.schedule_type)){
                        if(self.PEService.projectEstimatorData.scheduleDetails.start_date && self.PEService.projectEstimatorData.scheduleDetails.start_date.toString().indexOf('/') > -1)
                            self.PEService.projectEstimatorData.scheduleDetails.start_date = self.util.stringToDate(self.PEService.projectEstimatorData.scheduleDetails.start_date);
                        if(self.PEService.projectEstimatorData.scheduleDetails.end_date && self.PEService.projectEstimatorData.scheduleDetails.end_date.toString().indexOf('/') > -1)
                            self.PEService.projectEstimatorData.scheduleDetails.end_date = self.util.stringToDate(self.PEService.projectEstimatorData.scheduleDetails.end_date);
                            

                            self.scheduleType = self.PEService.projectEstimatorData.scheduleDetails.schedule_type=='1'?'once':self.PEService.projectEstimatorData.scheduleDetails.schedule_type=='4'?'not_known':'now';
                        self.addScheduleItem('1', self.pageData.scheduleType[i], self.PEService.projectEstimatorData.scheduleDetails);
                         self.is_after =  !self.PEService.projectEstimatorData.scheduleDetails.end_date ? true : false;
                    }else{
                        self.addScheduleItem('0', self.pageData.scheduleType[i]);
                    }
                }
            }
        });
    }

   
	public changeSchedule(type){

        this.scheduleType = type;
        this.timeNowError = false;

        if(this.scheduleType == 'now'){
            this.schedule_items.at(this.schedule_items.length - 2).get('start_date').setValue(this.today);
            this.schedule_items.at(this.schedule_items.length - 2).get('end_date').setValue(this.today);
            this.showMap = this.PEService.locationDetails.latitude && this.PEService.locationDetails.longitude && this.PEService.locationDetails.latitude != '' && this.PEService.locationDetails.longitude ? true : false;
            this.getCurrentTime();
        }
    }

    getCurrentTime(){
        let date = new Date();


        var hours = date.getHours();
        var minutes = date.getMinutes();
        var minutesStr;
        var hoursStr;
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        hoursStr = hours < 10 ? '0'+hours: hours;
        minutesStr = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hoursStr + ':' + minutesStr + ' ' + ampm;
        var hM  = hoursStr + ':' + minutesStr ;
          this.schedule_items.at(this.schedule_items.length - 2).get('start_time').setValue(hM);
        this.schedule_items.at(this.schedule_items.length - 2).get('end_time').setValue(hM);

        this.schedule_items.at(this.schedule_items.length - 2).get('start_time_format').setValue(ampm);
        this.schedule_items.at(this.schedule_items.length - 2).get('end_time_format').setValue(ampm);
    
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
	createForm(option, val:any = {}){
  		this.scheduleForm = this.fb.group({
            schedule_items: this.fb.array([]),
        });

  	};
    get schedule_items(): FormArray{ return <FormArray>this.scheduleForm.get('schedule_items') as FormArray; };
    get schedule_days(): FormArray{  return <FormArray>this.scheduleForm.get('schedule_items.schedule_days') as FormArray; };

    addScheduleItem(option, masterVal:any = {}, formVal:any = {}){
        console.log("formval",formVal);
       try{
            this.schedule_items.push(this.fb.group({
                schedule_type_name: new FormControl(masterVal.status, [ ]), //Only for edit
                schedule_type: new FormControl(masterVal.type_id, [ ]), //Only for edit
                
                start_date: new FormControl(option == '0' ? '' : formVal.start_date != '' ?  this.util.getTimeZoneDate(formVal.start_date) : ''), //Only for review
                //start_date: new FormControl(option == '0' ? '' : this.util.getYYYYMMDDDate(this.util.stringToDate(formVal.start_date)) ), //Only for review
                end_date: new FormControl(option == '0' ? '' : formVal.end_date != '' ?   this.util.getTimeZoneDate(formVal.end_date) : ''),
                //end_date: new FormControl(option == '0' ? '' : this.util.getYYYYMMDDDate(this.util.stringToDate(formVal.end_date)) ),
                start_time: new FormControl(option == '0' ? '' : formVal.start_time ? formVal.start_time.substring(0,5) : '',[] ), //Only for review   // Validators.pattern(this.constant.TIME_PATTERN)
                start_time_format: new FormControl(option == '0' ? 'am' : formVal.start_time_format),
                end_time: new FormControl(option == '0' ? '' : formVal.end_time ? formVal.end_time.substring(0,5) : '',[]), //  Validators.pattern(this.constant.TIME_PATTERN)
                end_time_format: new FormControl(option == '0' ? 'am' : formVal.end_time_format),
                //schedule_days: new FormControl(option == '0' ? [] : formVal.schedule_days, []),
                
                pe_schedule_id: new FormControl(option == '0' ? '' : formVal.pe_schedule_id),
            }));
            console.log("formval",formVal);
        }catch(err){
            this.global.addException('Schedule add','addScheduleItem()',err);
        }
    }

    startDateChange(event,index){
     	this.schedule_items.at(index).get('end_date').setValue('');
    }


    clearendtime(event,index){
        this.timeNowError = false;
        this.schedule_items.at(index).get('end_time').setValue('');
    }

    compareendtime(event,index){
        console.log(index)
        this.timeNowError = false;
        let startDate = new Date(this.schedule_items.at(index).get('start_date').value);
            let startDateDay = startDate.getDate();
            let startDateMonth = startDate.getMonth();
            let startDateYear = startDate.getFullYear();

            let startDatestring = new Date(String(startDateYear) + '-'+  String(startDateMonth) + '-'+  String(startDateDay) + " "+ this.schedule_items.at(index).get('start_time').value + " " + this.schedule_items.at(index).get('start_time_format').value);

        let endDate = new Date(this.schedule_items.at(index).get('end_date').value);
            let endDateDay = endDate.getDate();
            let endDateMonth = endDate.getMonth();
            let endDateYear = endDate.getFullYear();

            let endDatestring = new Date(String(endDateYear) + '-'+  String(endDateMonth) + '-'+  String(endDateDay) + " "+ this.schedule_items.at(index).get('end_time').value + " " + this.schedule_items.at(index).get('end_time_format').value);

                console.log(startDatestring.getTime(),endDatestring.getTime(),endDatestring,startDatestring);
                if(startDatestring.getTime() > endDatestring.getTime()){
                    this.timeNowError = true;
                }
                else{
                    this.timeNowError = false;
                }

    }


    reviewSchedule(){
        console.log(this.scheduleForm.value);
        try{
        let scIndex ;
        scIndex =  this.scheduleType=='once' ? 0 :this.scheduleType=='now' ? 1 : 2;
        this.scheduleForm.value.schedule_items[scIndex].schedule_type_name = scIndex == 0 ? 'Once' : scIndex == 1 ?  'Now' : 'Not Known';
        this.submitted = true;

            if(this.scheduleType== 'once' ){
                if(this.schedule_items.at(0).get('start_time').value != ''){
                    this.schedule_items.at(0).get('start_time').setValidators([Validators.required,Validators.pattern(this.constant.TIME_PATTERN)]);
                    this.schedule_items.at(0).get('start_time').updateValueAndValidity();
                }

                if(this.schedule_items.at(0).get('end_time').value != ''){
                    this.schedule_items.at(0).get('end_time').setValidators([Validators.required,Validators.pattern(this.constant.TIME_PATTERN)]);
                    this.schedule_items.at(0).get('end_time').updateValueAndValidity();
                }
            }else {
                this.schedule_items.at(0).get('start_date').setValidators([]);
                this.schedule_items.at(0).get('end_date').setValidators([]);
                this.schedule_items.at(0).get('start_time').setValidators([Validators.pattern(this.constant.TIME_PATTERN)]);
                this.schedule_items.at(0).get('end_time').setValidators([Validators.pattern(this.constant.TIME_PATTERN)]);

                this.schedule_items.at(0).get('start_date').updateValueAndValidity();
                this.schedule_items.at(0).get('end_date').updateValueAndValidity();
                this.schedule_items.at(0).get('start_time').updateValueAndValidity();
                this.schedule_items.at(0).get('end_time').updateValueAndValidity();

            }
       console.log(this.scheduleForm , this.timeNowError)
        if(this.scheduleForm.valid && !this.timeNowError){
            this.PEService.projectEstimatorData.scheduleDetails = JSON.parse(JSON.stringify(this.scheduleForm.value.schedule_items[scIndex])) ;
            if(this.scheduleType=='reccuring'){
                this.PEService.projectEstimatorData.scheduleDetails.is_after = this.is_after;
                let arr = Object.keys(this.PEService.projectEstimatorData.scheduleDetails.schedule_days).map(key => ({type: key, value: this.PEService.projectEstimatorData.scheduleDetails.schedule_days[key]}));
                this.PEService.projectEstimatorData.scheduleDetails.schedule_days=[];
                arr.forEach((element) => {
                if(element.value===true)
                        this.PEService.projectEstimatorData.scheduleDetails.schedule_days.push(element.type)
                });
            }
            else{
                this.PEService.projectEstimatorData.scheduleDetails.schedule_days=[];
            }
            this.PEService.projectEstimatorData.scheduleDetails.start_date = this.util.getDDMMYYYYDate(this.PEService.projectEstimatorData.scheduleDetails.start_date);
            this.PEService.projectEstimatorData.scheduleDetails.end_date = this.util.getDDMMYYYYDate(this.PEService.projectEstimatorData.scheduleDetails.end_date);
            this.PEService.updateFormStatus('scheduleFm', true);
        }else{
            this.PEService.updateFormStatus('scheduleFm', false);
        }
    }catch(err){
        this.global.addException('Schedule Review','reviewSchedule()',err);
    }
    }

}
