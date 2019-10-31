import { HttpService } from './../../../../../shared/service/http.service';
import { Router } from '@angular/router';
import { GlobalService } from './../../../../../shared/service/global.service';
import { ActivatedRoute } from '@angular/router';
import { UtilService } from './../../../../../shared/service/util.service';
import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { addDays, differenceInMinutes, eachDay, endOfDay, format, startOfDay, startOfToday } from "date-fns";
import { FormGroup, FormControl } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material';
import { sortBy as _sortBy, map as _map } from 'underscore';


@Component({
    selector: 'app-schedule-calendar-display',
    templateUrl: './schedule-calendar-display.component.html',
    styleUrls: ['./schedule-calendar-display.component.scss']
})
export class ScheduleCalendarDisplayComponent implements OnInit, AfterViewInit {

    @Input() requestFrom;
    @Input() schedules;
    @Input() displayDays: number = 1;
    @Input() primaryId;
    scheduleFilterForm;
    defaultStart: Date = startOfToday();
    defaultEnd: Date = startOfToday();
    timeZone: string = 'America/New_York';

    createForm() {
        this.scheduleFilterForm = new FormGroup({
            startDate: new FormControl(this.defaultStart),
            endDate: new FormControl(this.defaultEnd)
        });
    }

    constructor(
        public util: UtilService,
        private route: ActivatedRoute,
        private global: GlobalService,
        public router: Router,
        private http: HttpService
    ) { this.createForm() }

    ngOnInit() {

        this.filterScheduleData(this.schedules);

    }
    
    ngAfterViewInit() {
        this.fixFirstColumn();
    }

    /**
    * Event Start Getter
    * @return number
    */
    get event_start_date() {
        return (this.scheduleFilterForm.get('startDate').value);
    }

    /**
     * Event End Getter
     * @return number
     */
    get event_end_date() {
        return (this.scheduleFilterForm.get('endDate').value);
    }
    
    startDateChange(event: MatDatepickerInputEvent<Date>){

        let selectedDate = event.value;

        this.defaultStart = selectedDate;

        if (this.event_start_date > this.event_end_date) {
            this.scheduleFilterForm.get('endDate').setValue(selectedDate);
            this.onEndDateChange(selectedDate);
        }

         this.getSchedulingTimeline();
    }

    endDateChange(event: MatDatepickerInputEvent<Date>) { 

        this.defaultEnd = event.value;

        this.getSchedulingTimeline();
    }

    onEndDateChange(date) { 

        this.defaultEnd = date;
        this.getSchedulingTimeline();
    }


    getDates() {
        return eachDay(this.event_start_date, this.event_end_date);
    }

    getHeaderDates() {
        let dates = this.getDates();
        return dates.map(date => format(date, 'MMM D YYYY'));
    }

    getHourVisibility() {
        return this.displayDays == 3 ? 'hidden' : 'visible';
    }

    getScheduleDuration() {
        let actualEnd = endOfDay(this.event_end_date)
        return differenceInMinutes(actualEnd, this.event_start_date);
    }

    getEventDuration(event) {
        return differenceInMinutes(event.end, event.start);
    }

    getEventStartOffset(event) {
        return differenceInMinutes(event.start, this.event_start_date);
    }

    getEventCurrentOffset(event) {
        return differenceInMinutes(this.event_start_date, this.event_start_date);
    }

    setEventPos(event) {
        let minWidth = this.getMinWidth();

        let hrs;
        if (this.event_start_date > event.start) {
            hrs = this.getEventCurrentOffset(event) / 60;
        } else {
            hrs = this.getEventStartOffset(event) / 60;
        }

        let dayWidth = this.getDayWidth();
        let hrWidth = dayWidth / 24;
        let eventoffset = hrs * hrWidth;
        return `${eventoffset}px`;
    }

    setEventWidth(event) {
  
        let eventWidthInMin = differenceInMinutes(event.end, event.start) / 60;
        let dayWidth = this.getDayWidth();
        let hrWidth = dayWidth / 24;
        let eventWidthPx = eventWidthInMin * hrWidth;
        return `${eventWidthPx}px`;
    }

    alignEventText(event) {
        let offset = this.getEventStartOffset(event);
        if (offset < 0) {

            if (this.event_start_date > event.start) {} else {
                return offset / this.getScheduleDuration() * 100 * -1;
            }
           
        }
    }

    getDayWidth() {
        let days = this.displayDays;
        let boxWidth = document.querySelector('.ngsc-table-scroll').clientWidth;
        let colWidth = 210;
        let dayWidth = ((boxWidth - colWidth) / days);
        return dayWidth;
    }
    getMinWidth() {
        let days = this.displayDays;
        let boxWidth = document.querySelector('.ngsc-table-scroll').clientWidth;
        let colWidth = 0;
        let minWidth = ((boxWidth - colWidth) / days) / 1440;
        return minWidth;
    }
    setDayWidth(days) {
        let boxWidth = document.querySelector('.ngsc-table-scroll').clientWidth;
        let colWidth = 210;
        return `${((boxWidth - colWidth) / days)}px`;
    }

    fixFirstColumn() {
        let layer: any = document.querySelector('.ngsc-table').cloneNode(true);
        <any>document.querySelector('.ngsc-table-scroll').appendChild(layer).classList.add('cloned-col');
    }

    filterScheduleData(schedules) {

        if (schedules.length) {
            
            (schedules).map(schedule => {

                let startDate = schedule.start_date.split('-');
                let startTime = schedule.start_time.split(':');
                let endDate = schedule.end_date.split('-');
                let endTime = schedule.end_time.split(':');

                schedule['start'] = new Date(parseInt(startDate[0]), parseInt(startDate[1])-1, parseInt(startDate[2]), parseInt(startTime[0]), parseInt(startTime[1]));

                schedule['end']   = new Date(parseInt(endDate[0]), parseInt(endDate[1])-1, parseInt(endDate[2]), parseInt(endTime[0]), parseInt(endTime[1]));

            });

        }
        
        this.schedules = schedules;
    }

    /***
     *  1. This function used to fetch all schedules between the selected date range.
     *  2. API Endpoint:- getSchedulingTimeline/2019-04-01/2019-04-14
     *  3. @ Param start date in format of YYYY-MM-DD
     *  4. @ Param end date in format of YYYY-MM-DD 
     ***/ 
    getSchedulingTimeline(){

        this.util.showProcessing('processing-spinner');
        
        let reqObj = {
            "from_date" : this.util.getYYYYMMDDDate(this.event_start_date),
            "to_date"   : this.util.getYYYYMMDDDate(this.event_end_date)
        };

        let url;

        if (this.requestFrom == 'assets') {
            Object.assign(reqObj, {"asset_id"  : this.primaryId});
            url = 'inventory/assets/schedules';
        } else {
            Object.assign(reqObj, {"staff_id" : this.primaryId});
            url = 'hr/employees/schedules';
        }

        this.http.doPost(url, reqObj, (error: boolean, response: any) => {

            this.util.hideProcessing('processing-spinner');

            if( error ) {
                this.util.showAlert(response.message);
            } else {

                this.filterScheduleData(_sortBy(response.data, 'name'));
            }

        });
    }
}
