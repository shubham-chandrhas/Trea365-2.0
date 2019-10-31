import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDatepickerInputEvent } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import * as _ from 'underscore';

import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { ExportService } from '../../../../shared/service/export.service';
import { ConstantsService } from '../../../../shared/service/constants.service';
import { GlobalService } from '../../../../shared/service/global.service';
import { FormControl, FormGroupDirective, Validators, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';
@Component({
    selector: 'app-timesheet-list',
    templateUrl: './timesheet-list.component.html',
    styleUrls: ['./timesheet-list.component.css']
})
export class TimesheetListComponent implements OnInit {
    public sortColumn: string = 'timesheet_summary_id';
    public sortColumnType: string = 'N';
    public isError: boolean = false;
    public errMsg: string;
    public sortOrder: string = 'DSC';
    public timesheetList: any = [];
    public selectedTimeSheet: any = null;
    public paginationKey: any;
    public listCount: number = 0;
    public selectedIndex: number;
    public searchList: string;
    public searchTxt: string;
    public employeeNameSearch;
    public employeeRoleSearch;
    public expectedHrSearch;
    public recordedHrSearch;
    public discrepanciesHrSearch;
    public timesheetdate:any;
    public timesheetDetails:any=[];
    editEmpFrm:FormGroup;
    public isEdit: boolean = false;
    minDate: any = new Date();
    strtDate: string;
    endDate: string;
    singleDate: string;
    public old_date: any;
    public onBoarding:boolean = false;
    inlineEditFormControls;

    isDBClickOnStartHr = false;
    isDBClickOnEndHr   = false;
    isUpdatig = false;

    isProcessingField;
    isProcessingId;
    submitted = false;
    constructor(
        public util: UtilService, 
        public dialog: MatDialog, 
        public constant: ConstantsService, 
        private http: HttpService, 
        public router: Router, 
        private route: ActivatedRoute, 
        public global: GlobalService, 
        private file: ExportService, 
        private ts: FormBuilder, 
        private location: Location
    ) { }
    ngOnInit() {
        let self = this;
        this.util.showProcessing('processing-spinner');
        this.util.setWindowHeight();
        this.util.setPageTitle(this.route);
        this.util.menuChange({ 'menu': 6, 'subMenu': 30 });
        this.paginationKey = { itemsPerPage: this.constant.ITEMS_PER_PAGE, currentPage: this.constant.CURRENT_PAGE };
        var dte = new Date();
        dte.setDate(dte.getDate() - 1);
        this.singleDate = this.util.getYYYYMMDDDate(dte);

        // TODO : Remove When New API is build 

        this.getTimesheetList(this.util.getYYYYMMDDDate(dte));
        
        this.editTimesheetForm(); 
        this.strtDate = this.endDate = this.util.getYYYYMMDDDate(dte);
        
    }
    changePage(event) {
        this.paginationKey.currentPage = event;
        window.scrollTo(0, 0);
    }
    changeItemPerPage() {
        window.scrollTo(0, 0);
    }
    updateCount(count) { this.constant.ITEM_COUNT = count; this.listCount = count; }
    getSearchTxt(filterValue: string) {
        if (filterValue == '') {
            this.searchTxt = '';
        }
    }
    
    generatepdf(){ this.file.generateLandscapepdf('timesheet_detail', 'Timesheet', 'timesheet_edit'); }
    generatecsv(){ this.file.generatecsv('timesheet_detail', 'timesheet_edit'); }
    dateChange(event:MatDatepickerInputEvent<Date>){
       this.getTimesheetList(this.util.getYYYYMMDDDate(event.value)); 
    }

    createInlineEditForm() {
       
        const toGroups = this.timesheetList.map(entity => {

            return new FormGroup({
                id                        : new FormControl(entity.id, Validators.required),
                staff_id                  : new FormControl(entity.staff_id),
                starting_hours            : new FormControl(entity.starting_hours ? entity.starting_hours.substring(0,5) : '00:00', Validators.required),
                ending_hours              : new FormControl({
                    value    : entity.ending_hours ? entity.ending_hours.substring(0,5) : '00:00',
                    disabled : _.isNull(entity.timesheet_summary_id)
                }, Validators.required),
                timesheet_summary_id      : new FormControl(entity.timesheet_summary_id),
                remarks                   : new FormControl(''),
                date                      : new FormControl(this.util.getYYYYMMDDDate(this.singleDate))
            });

        });

        this.inlineEditFormControls = new FormArray(toGroups);
    }

    getControl(id: number, field: string) : FormControl {

        let control = (this.inlineEditFormControls.controls).filter( (data, index) => {
            return data.value.id == id;
        });

        return (control[0]).get(field);
    }

    getTimesheetList(date) {
        let self = this;
        self.selectedTimeSheet ='';
        self.selectedIndex = null;
        this.util.showProcessing('processing-spinner');
        try {
            this.http.doGet(`hr/timesheet/summary/${date}`, (error: boolean, response: any) => {
                self.util.hideProcessing('processing-spinner');
                if (error) {
                    self.util.showAlert(response.message);
                }
                else {
                    self.timesheetList = response.data ? response.data : [];
                    self.constant.ITEM_COUNT = self.timesheetList.length;
                    self.util.hideProcessing('processing-spinner');
                    self.route.snapshot.paramMap.get('id') != '0' ? self.showTimesheetDetails() : '';
                    self.createInlineEditForm();
                }

                if (self.timesheetList.length == 0) {
                    self.onBoarding = true;
                }
            });
        }
        catch (err) {
            this.global.addException('invoice list', 'getInvoiceList()', err);
        }
    }

    showTimesheetDetails() {
        try {
            let sortedList: any[] = _.sortBy(this.timesheetList, 'timesheet_summary_id').reverse();
            for (var i = 0; i < sortedList.length; ++i) {
                if (this.route.snapshot.paramMap.get('id') == sortedList[i].timesheet_summary_id) {
                    this.getSelectedTimeSheet(sortedList[i], i);
                    this.selectedIndex = i;
                    break;
                }
            }
        } catch (err) {
            this.global.addException('Timesheet', 'showTimesheetDetails()', err);
        }
    }
    
    startDateChange(event) {
        this.getDetailList(this.selectedTimeSheet.staff_id, this.util.getYYYYMMDDDate(this.strtDate), this.endDate);
    }
    endDateChange(event) {
        this.getDetailList(this.selectedTimeSheet.staff_id, this.strtDate, this.util.getYYYYMMDDDate(this.endDate));
    }

    getSelectedTimeSheet(timesheet, indx) {
        try{
        let self = this;
        this.isEdit = false;
        self.selectedTimeSheet = timesheet;
        self.selectedIndex = indx;
        self.getDetailList(timesheet.staff_id, this.strtDate, this.endDate);
        }
        catch (err) {
            this.global.addException('Timesheet', 'getSelectedTimeSheet()', err);
        }
    }
   
    public editTimesheetForm(timesheetObj:any = {}){
        this.editEmpFrm = this.ts.group({
            staff_id           : new FormControl(timesheetObj.staff_id),
            timesheet_summary_id:new FormControl(timesheetObj.timesheet_summary_id),
            starting_hours:new FormControl(timesheetObj.starting_hours ? timesheetObj.starting_hours.substring(0,5) : '', [ Validators.required ]),
            ending_hours:new FormControl(timesheetObj.ending_hours ? timesheetObj.ending_hours.substring(0,5) : '', [ Validators.required ]),
           // actual_working_hours:new FormControl(timesheetObj.actual_working_hours ? timesheetObj.actual_working_hours.substring(0,5) : '', [ Validators.required ]),
            remarks:new FormControl(timesheetObj.remarks, [ Validators.required ]),
        });
    }
    get starting_hours() { return this.editEmpFrm.get('starting_hours'); } 
    get ending_hours() { return this.editEmpFrm.get('ending_hours'); }
   // get actual_working_hours() { return this.editEmpFrm.get('actual_working_hours'); }
    get remarks() { return this.editEmpFrm.get('remarks'); }
    
    getDetailList(staff_id, from_date, to_date) {
        
        this.isEdit = false;
        // staff_id = 62;
        // from_date = '2019-07-19';
        // to_date = '2019-07-19';

        var reqObj = {
            "staff_id": staff_id,
            "from_date": from_date,
            "to_date": to_date
        }
        this.util.showProcessing('processing-spinner');

        try {
            this.http.doPost('hr/timesheet/summary-details', reqObj, 
            (error: boolean, response: any) => 
            {
                this.util.hideProcessing('processing-spinner');
                if (error) {
                    this.util.showAlert(response.message);
                } else {
                     
                    Object.assign(this.selectedTimeSheet, response.data);
                    
                    this.selectedTimeSheet.timesheetDetails = response.data.timesheet;

                    if (_.isUndefined(this.selectedTimeSheet.timesheetDetails)) {
                        this.selectedTimeSheet.timesheetDetails = [];
                    }
                  
                    this.selectedTimeSheet.timesheetDetails.filter(item => item.isEdit = false);
                  
                    this.location.go(this.location.path().split('/').splice(0, this.location.path().split('/').length - 1).join('/')+'/'+this.selectedTimeSheet.staff_id);
                    setTimeout(() => {
                        this.util.scrollDown('timesheetMark');
                    }, 1000);
                }
            });
        }
        catch (err) {
            this.global.addException('timesheet detail list', 'getDetailList()', err);
        }
    }
    editTimesheet(timesheetObj) {
        this.selectedTimeSheet.timesheetDetails.filter(item=> item.isEdit = false);
        timesheetObj.isEdit = true;
        this.isEdit=true;
        this.editTimesheetForm(timesheetObj);
    }

    findControl(id) {

       let control = (this.inlineEditFormControls.controls).filter( (data, index) => {
            return data.value.id == id;
        })[0]; 

        return control;
    }

    updateTimesheet(form: FormGroup, requestFrom = '') {
        let self = this;
        self.isError = false;
        self.errMsg = '';
        self.submitted = true;
        try {
            if (form.valid) {
                self.util.addSpinner('updateTimesheet', "Update");
                this.http.doPost('hr/timesheet/update-summary', form.value, function (error: boolean, response: any) {
                    self.util.removeSpinner('updateTimesheet', "Update");
                    if (error) {

                        self.isError = true;
                        self.errMsg = response.message;
                        self.isUpdatig = false;
                        self.isProcessingField = '';
                        self.isProcessingId = 0;
                        self.util.showAlert(response.message);

                    } else {
                        self.util.showDialog(DialogComponent, response.message, []);

                        self.isUpdatig = false;
                        self.isProcessingField = '';
                        self.isProcessingId = 0;

                        let fValue = form.value;

                        if (requestFrom == 'update_row') {

                            let requestData = response.data;

                            (self.timesheetList).map( (item) => {

                                if (item.id == fValue.id) {

                                    item.starting_hours = fValue.starting_hours;
                                    item.timesheet_summary_id = requestData.timesheet_summary_id;

                                    if (_.has(requestData, 'actual_working_hours') && !_.isNull(requestData.actual_working_hours)) {
                                        item.actual_working_hours = requestData.actual_working_hours;
                                    }

                                    if (_.has(requestData, 'ending_hours') && !_.isNull(requestData.ending_hours)) {
                                        item.ending_hours = requestData.ending_hours;
                                    }

                                    if (_.has(requestData, 'discrepancies') && !_.isNull(requestData.discrepancies)) {
                                        item.discrepancies = requestData.discrepancies;
                                    }

                                   let control = self.findControl(fValue.id);
                                   control.get('timesheet_summary_id').setValue(requestData.timesheet_summary_id);
                                   control.get('ending_hours').enable();
                                    
                                }

                                return item;
                            });

                        } else {

                            self.isEdit = false;
                            let dataObj: any = {};
                            dataObj.source = 'TIMESHEET_EDIT';
                            dataObj.data = response.data;
                            self.util.changeEvent(dataObj);
                            
                            self.getDetailList(self.selectedTimeSheet.staff_id, self.util.getYYYYMMDDDate(self.strtDate), self.endDate);
                        }
                    }
                });
            }
        } catch (err) {
            this.global.addException('Timesheet', 'updateTimesheet()', err);
        }
    }

    getTimeInHHMM(time){ return time ? time.substring(0, 5) : ''; }

    cancelEditInfo() {
        this.selectedTimeSheet.timesheetDetails.filter(item => item.isEdit = false);
        this.isEdit = false;
    }

    updateField(id, field) {

        let control = this.findControl(id);
        
        if (control.valid && control.dirty) {

            this.isUpdatig = true;
            this.isProcessingField = field;
            this.isProcessingId = id;
            this.updateTimesheet(control, 'update_row');
        }

    }

}