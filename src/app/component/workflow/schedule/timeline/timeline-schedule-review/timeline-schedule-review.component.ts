import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { UtilService } from '../../../../../shared/service/util.service';
import { HttpService } from '../../../../../shared/service/http.service';
import { GlobalService } from '../../../../../shared/service/global.service';

import { DialogComponent } from '../../../../../shared/model/dialog/dialog.component';

@Component({
  selector: 'app-schedule-review',
  templateUrl: './timeline-schedule-review.component.html',
  styleUrls: ['./timeline-schedule-review.component.css']
})
export class TimelineScheduleReviewComponent implements OnInit {
  scheduleFor: string;
  public scheduleData:any;
  public errMsg: string = '';
  public isError: boolean = false;

  constructor(
    public dialog: MatDialog,
    public util:UtilService,
    public http:HttpService,
    public global:GlobalService,
    public router: Router, 
    private route: ActivatedRoute,
  ) {
      this.scheduleData = JSON.parse(sessionStorage.getItem('schedulingInfo'));
   }

  ngOnInit() {
    this.util.menuChange({'menu':4,'subMenu':27});
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    window.scrollTo(0, 0);
    this.scheduleFor = atob(this.route.snapshot.paramMap.get('type'));
  }

    public editInfo(action) {
   
        try {
            this.router.navigate(['/workflow/schedule/csa/add-timeline-schedule/' + btoa(action) + '/' + this.scheduleData.id ]);
        } catch (err) {
            this.global.addException('Schedule-review', 'editInfo()', err, { 'routeURL': '/workflow/schedule/csa/add-timeline-schedule/' + btoa(action) });
        }
    }
    
  save(){
    let self = this;
    try{
      let reqObj:any = {};
      reqObj = this.scheduleData.reqData
      delete reqObj.days_off;
        self.util.addSpinner('saveSchedule', "Submit");
        if(!reqObj.scheduling_id){

            let newFormObject = {
                "type": reqObj.type,
                "start_date": reqObj.start_date,
                "start_time": reqObj.start_time,
                "start_time_format": reqObj.start_time_format,
                "end_date": reqObj.end_date,
                "end_time": reqObj.end_time,
                "end_time_format": reqObj.end_time_format,
                "details": reqObj.details,
                "schedule_both": reqObj.schedule_both
            };

            if (reqObj.type == 'asset') {
                Object.assign(newFormObject, {'asset_id' : Number(reqObj.asset_id) });
            } else if(reqObj.type == 'person') {
                Object.assign(newFormObject, {'staff_id' : Number(reqObj.staff_id) });
            }

          this.http.doPost('workflow/schedulings/create', newFormObject ,function(error: boolean, response: any){
            self.util.removeSpinner('saveSchedule', "Submit");
            if(error){
              self.isError = true;
              self.errMsg = response.message;
            }else{
              self.util.showDialog(DialogComponent, response.message, ['/workflow/schedule/csa/schedule-timeline']);
              
            }
          });
        }else{

            let updateFormObject = {
                "type": reqObj.type,
                "start_date": reqObj.start_date,
                "start_time": reqObj.start_time,
                "start_time_format": reqObj.start_time_format,
                "end_date": reqObj.end_date,
                "end_time": reqObj.end_time,
                "end_time_format": reqObj.end_time_format,
                "details": reqObj.details,
                "schedule_both": reqObj.schedule_both,
                "scheduling_id" : reqObj.scheduling_id
            };

            if (reqObj.type == 'asset') {
                Object.assign(updateFormObject, {'asset_id' : Number(reqObj.asset_id) });
            } else if(reqObj.type == 'person') {
                Object.assign(updateFormObject, {'staff_id' : Number(reqObj.staff_id) });
            }
          this.http.doPost('workflow/schedulings/update',updateFormObject,function(error: boolean, response: any){
            self.util.removeSpinner('saveSchedule', "Submit");
            if(error){
              self.isError = true;
              self.errMsg = response.message;
            }else{
              self.util.showDialog(DialogComponent, response.message, ['/workflow/schedule/csa/schedule-timeline']);
              
            }
          });
        }

    }catch(err){
      this.global.addException('Scheduling','save()',err);
    }

  }
}
