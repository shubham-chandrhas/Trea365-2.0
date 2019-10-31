import { Component, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { addDays, differenceInMinutes, eachDay, endOfDay, format, startOfDay, startOfToday } from "date-fns";
import { Schedule } from '../models/schedule.model';
import { UtilService } from '../../../../../shared/service/util.service';
import { GlobalService } from "../../../../../shared/service/global.service";
import { ScheduleDialogComponent } from "../../schedule-dialog.component";
import { DialogComponent } from "../../../../../shared/model/dialog/dialog.component";
import { HttpService } from "../../../../../shared/service/http.service";

@Component({
    selector: 'app-schedule-display',
    templateUrl: './schedule-display.component.html',
    styleUrls: ['./schedule-display.component.scss']
})

export class ScheduleDisplayComponent implements AfterViewInit {

    //public wid = '220px';
    public wid = '260px';
    sortOrder = 'asc';
    selectedResource: any;
    public selectedPersonSchedule: any = "";
    public selectedAssetSchedule: any = "";
    public scheduleFor: any = "";

    @Input() schedule: Schedule;
    @Input() displayDays: number;

    constructor(
        public util: UtilService,
        private route: ActivatedRoute,
        private global: GlobalService,
        public router: Router,
        private http: HttpService
    ) {

        sessionStorage.removeItem("schedulingInfo");
        sessionStorage.removeItem("editSchedulingInfo");

    }

    @Output() childEvent = new EventEmitter();
    test() {
        this.childEvent.emit('this is a test');
    }

    ngOnInit() {

        let self = this;
        this.util.menuChange({ 'menu': 4, 'subMenu': 27 });
        this.util.setWindowHeight();
        this.util.setPageTitle(this.route);

        this.util.changeDetection.subscribe(dataObj => {

            if (dataObj && dataObj.source == "DELETE_SCHEDULE") {
                self.selectedResource = null;
                dataObj.source == null;
            }

        });

    }

    ngAfterViewInit() {
        this.fixFirstColumn();
    }

    getDates() {
        return eachDay(this.schedule.start, this.schedule.end);
    }

    getHeaderDates() {
        let dates = this.getDates();
        return dates.map(date => format(date, 'MMM D YYYY'));
    }

    getHourVisibility() {
        return this.displayDays == 3 ? 'hidden' : 'visible';
    }

    getScheduleDuration() {
        let actualEnd = endOfDay(this.schedule.end)
        return differenceInMinutes(actualEnd, this.schedule.start);
    }

    getEventDuration(event) {
        return differenceInMinutes(event.end, event.start);
    }

    getEventStartOffset(event) {
        return differenceInMinutes(event.start, this.schedule.start);
    }

    getEventCurrentOffset(event) {
        return differenceInMinutes(this.schedule.start, this.schedule.start);
    }

    setEventPos(event) {
        let minWidth = this.getMinWidth();

        let hrs;
        if (this.schedule.start > event.start) {
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

            if (this.schedule.start > event.start) {} else {
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

    sortList() {
        this.sortOrder = this.sortOrder == 'asc' ? 'desc' : 'asc';
        this.childEvent.emit(this.sortOrder);
    }

    getSelectedResource(resource) {
        
        try {
            let self = this;
            self.selectedResource = null;
            self.selectedResource = resource;

            // self.getAllList();
            setTimeout(function () {
                self.util.scrollDown('moreInfo');
            }, 1000);
        }
        catch (err) {
            //this.global.addException('SelectedWo', 'getSelectedWo()', err);
        }
    }

    addSchedule(option, selectedResource): void {

        try {
            this.router.navigate([
                "/workflow/schedule/csa/add-timeline-schedule/" + btoa(option) + "/" + (option == 'person' ? selectedResource.user.id : selectedResource.asset.asset_id)
            ]);
        } catch (err) {
            this.global.addException("Timeline", "addSchedule()", err, {
                routeURL: "/workflow/schedule/csa/add-timeline-schedule/" + btoa(option) + "/" + (option == 'person' ? selectedResource.user.id : selectedResource.asset.asset_id)
            });
        }
    }

    Edit(schedule, type) {
        try {
            if (type == 'Asset') {

                sessionStorage.setItem(
                    "editSchedulingInfo",
                    JSON.stringify(schedule.schedule)
                );
                this.router.navigate([
                    "/workflow/schedule/csa/add-timeline-schedule/" + btoa("Asset") + '/' + this.selectedResource.asset.asset_id
                ]);
            } else {

                sessionStorage.setItem(
                    "editSchedulingInfo",
                    JSON.stringify(schedule.schedule)
                );
                this.router.navigate([
                    "/workflow/schedule/csa/add-timeline-schedule/" + btoa("person") + '/' + this.selectedResource.user.id
                ]);
            }
        } catch (err) {
            this.global.addException("Schedule list - edit", "Edit()", err, {
                routeURL: "/workflow/schedule/csa/add-timeline-schedule/" + btoa("Asset")
            });
        }
    }

    deleteSchedule(schedule, selectedResource, scheduleFor): void {
        try {
            let reqObj;
            let self = this;
            var personORasset;
            self.scheduleFor = scheduleFor;
            reqObj = { scheduling_id: schedule.schedule.scheduling_id };
            if (self.scheduleFor == "Asset") {
                personORasset = selectedResource.asset.short_tag ? selectedResource.asset.short_tag : '';
            } else {
                personORasset = schedule.schedule.first_name ? schedule.schedule.first_name : '';
            }

            sessionStorage.setItem(
                "deleteSchedulingInfo",
                JSON.stringify(schedule.schedule)
            );

            this.http.doPost("workflow/schedulings/delete-check", reqObj, function (
                error: boolean,
                response: any
            ) {
                if (error) {} else {

                    if (
                        (self.scheduleFor == "Asset" &&
                            response.data.persons.length == 0) ||
                        (self.scheduleFor == "Person" && response.data.assets.length == 0)
                    ) {
                        let data: any = {
                            API_URL: "workflow/schedulings/delete",
                            reqObj: {
                                scheduling_id: reqObj.scheduling_id,
                                delete_both: 0
                            },
                            event: {
                                source: "DELETE_SCHEDULE",
                                action: "DELETE"
                            }
                        };
                        self.util.showDialog(
                            DialogComponent,
                            "Are you sure you want to delete schedule for " + personORasset + " ?",
                            [
                                "/workflow/schedule/csa/schedule-timeline"
                            ],
                            "Delete Confirmation",
                            "CONFIRMATION",
                            data
                        );
                        //self.router.navigate(["/workflow/schedule/csa/schedule-timeline"]);
                    } else {
                        let resourceName =
                            self.scheduleFor == "Asset"
                                ? selectedResource.asset.short_tag
                                : schedule.schedule.first_name ? schedule.schedule.first_name : selectedResource.name;
                        // let msgStr = response.data.work_orders.length > 0 ? 'work orders' : '';
                        let msgStr = "";
                        msgStr =
                            self.scheduleFor == "Asset" && response.data.persons.length > 0
                                ? msgStr + "persons"
                                : msgStr;
                        msgStr =
                            self.scheduleFor == "Person" && response.data.assets.length > 0
                                ? msgStr + "assets"
                                : msgStr;
    
                        self.util.showDialog(
                            ScheduleDialogComponent,
                            resourceName + " is assigned to the following " + msgStr + ":",
                            [
                                "/workflow/schedule/csa/schedule-timeline"
                            ],
                            "Delete Confirmation",
                            "CONFIRMATION_WITH_WARNING_2",
                            { type: self.scheduleFor, details: response.data }
                        );
                    }
                }
            });
        } catch (err) {
            this.global.addException('Assign Work order', 'checkAssignedWO()', err, { 'API': 'check-work-orders|POST', 'APIRequest': { scheduling_id: schedule.schedule.scheduling_id } });
        }
    }

}
