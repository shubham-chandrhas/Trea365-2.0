import { Component, OnInit, Input } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
  NgForm,
  AbstractControl,
  FormGroupDirective
} from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";

import { Observable, Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";

import { UtilService } from "../../../../../shared/service/util.service";
import { HttpService } from "../../../../../shared/service/http.service";
import { ConstantsService } from "../../../../../shared/service/constants.service";
import { GlobalService } from "../../../../../shared/service/global.service";
import { WorkOrderService } from "../../work-order.service";

import { WorkOrderDialog } from "./../../work-order-dialog.component";

declare var $: any;
declare var jQuery: any;

@Component({
  selector: "app-team",
  templateUrl: "./team.component.html",
  styleUrls: ["./team.component.scss"]
})
export class TeamComponent implements OnInit {
  minDate = new Date();
  maxDate: any;
  public teamForm: FormGroup;
  public teamList: any[] = [];
  public backupTeamList : any[] = [];
  public submitted: boolean = false;
  public filteredEmployee: Observable<any[]>;
  public pageData: any = {};
  private subscription: Subscription;
  autoNumber: number;

  @Input() team: any;
  dStart: Date;
  dEnd: Date;

  constructor(
    public router: Router,
    public util: UtilService,
    public global: GlobalService,
    public constant: ConstantsService,
    private fb: FormBuilder,
    private http: HttpService,
    public woService: WorkOrderService,
    public route: ActivatedRoute
  ) {}

  ngOnInit() {
    let self = this;
    this.util.showProcessing("processing-spinner");
    this.util.setPageTitle(this.route);
    this.pageData.currentUrl = this.router.url.split("/")[5];
    this.woService.quatationTab = "team";
    this.autoNumber = this.util.getUniqueString();
    this.getTeamList();
    this.addTeamForm("0");
    //this.woService.WO_DATA.work_order_id ? "" : this.getTeamList(0);
    

    this.subscription = this.util.changeDetection.subscribe(dataObj => {
      if (
        dataObj &&
        (dataObj.source == "INTERNAL_WO" || dataObj.source == "EXTERNAL_WO") &&
        dataObj.action == "ADD_TEAM"
      ) {
        this.review();
      }
      if (
        dataObj &&
        dataObj.source == "WO_INTERNAL" &&
        dataObj.action == "SCHEDULE_CHANGE"
      ) {
        
        delete this.woService.WO_DATA.teamDetails;
        for (let i = self.teamMembers.length - 1; i >= 0; i--) {
          if (i == 0) {
            self.addTeamForm("0");
          } else {
            self.teamMembers.removeAt(i);
          }
          
        }
        if (this.pageData.currentUrl == "team") {
        }
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  editTem()
  {
      if (this.woService.WO_DATA.teamDetails) {
      if (this.woService.WO_DATA.scheduleInfo) {
        this.minDate = new Date(
          this.woService.WO_DATA.scheduleInfo.schedule_items[0].start_date
        );
      }
      console.log(
        "this.woService.WO_DATA.teamDetails",
        this.woService.WO_DATA.teamDetails
      );
          this.addTeamForm("1", this.woService.WO_DATA.teamDetails);
      
    } else {
      this.addTeamForm("0");
    }
  }

  clearAutoComplete(inputId, controls, indx: any = "",team) {
    team.get('id').value != '' ? this.addServiceToList(team.get('id').value, 'id', this.teamList, this.backupTeamList) : '' ;  
    let self = this;
    let backspaceEvent = jQuery.Event("keyup", { keyCode: 20 });
    $("#" + inputId + indx).trigger(backspaceEvent);
    
        setTimeout(function() {
            for (let i = 0; i < controls.length; i++) {
                controls[i].setValue("");
            }
            self.teamMembers
                .at(indx)
                .get("associatedAssetList")
                .setValue([]);
            }, 2);    
  }

  clearTeam(team){
    console.log("team :: ",team);
    team.get('id').value != '' ? this.addServiceToList(team.get('id').value, 'id', this.teamList, this.backupTeamList) : '' ;
  }

  //Get Material/Product List
  getTeamList(
    index: number = 0,
    scheduleObj: any = JSON.parse(sessionStorage.getItem("schedules"))
  ) {
    try {
      console.log("scheduleObj", scheduleObj);
      var self = this;
      let reqObj: any = {
        start_date: this.util.getYYYYMMDDDate(scheduleObj.start_date),
        end_date: this.util.getYYYYMMDDDate(scheduleObj.end_date),
        start_time: scheduleObj.start_time.substring(0, 5),
        end_time: scheduleObj.end_time.substring(0, 5),
        start_time_format: scheduleObj.start_time_format,
        end_time_format: scheduleObj.end_time_format,
        work_order_id: this.woService.WO_DATA.work_order_id
          ? this.woService.WO_DATA.work_order_id
          : 0
      };
      this.util.showProcessing("processing-spinner");
      this.http.doPost("work-order/team", reqObj, function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response);
        } else {

          self.teamList = response.data;
          self.backupTeamList = JSON.parse(JSON.stringify(self.teamList));
          self.editTem();
          //self.teamMembers.at(index).get("teamMemberList").setValue(self.teamList);
          if(self.teamMembers.length>0)
				self.teamMembers.at(0).get('filteredTeam').setValue(self.teamMembers.at(0).get('full_name').valueChanges.pipe(startWith(''),map(value => self.teamFilter(value))));  
          //self.setObservable(index);
        }
      });
    } catch (err) {
      this.global.addException("Work order - Team", "getTeamList()", err, {
        API: "getTeamList|POST",
        APIRequest: this.woService
      });
    }
  }
  private teamFilter(value: string = "", index: number = 0): string[] {
    return this.teamList.filter(option => option.full_name.toLowerCase().includes(value ? value.toLowerCase() : ''));
  }

  getSelectedTeam(team, event: any = false, index): void {
    try {
      let self = this;
      if (event.isUserInput) {
        if (index == "leader") {
        } else {
          this.teamMembers.at(index).get("id").setValue(team.id);
          this.teamMembers.at(index).get("full_name").setValue(team.full_name);
        }
        self.teamMembers
          .at(index)
          .get("associatedAssetList")
          .setValue(team.associated_assets);
        self.removeServiceFormList(team.id, 'id', this.teamList);
      }
    } catch (err) {
      this.global.addException("SelectedTeam", "getSelectedTeam()", err);
    }
  }

    removeServiceFormList = (id, key, list) => {
        this.teamList = list.filter(item => item[key] != id);
        for (let i = 0; i < this.teamMembers.length; i++) {
            this.teamMembers.at(i).get('id').value == '' ? this.setObservable(i) : '';
        }
    };

    addServiceToList = (id, key, list, backupList) => {
        if(backupList.filter(item => item[key] == id).length > 0){
            list.push(backupList.filter(item => item[key] == id)[0]);
        }
        for (let i = 0; i < this.teamMembers.length; i++) {
            this.teamMembers.at(i).get('id').value == '' ? this.setObservable(i) : '';
        }
    }

  public validateTeam(event: any, item: any, index) {
    let team = event.target.value;
    try {
      if (team == "") {
        if (index == "leader") {
        } else {
          item.get("id").setValue("");
          this.teamMembers
            .at(index)
            .get("associatedAssetList")
            .setValue([]);
        }
        return;
      }
      let match = this.teamList.filter(
        item => item.full_name.toLowerCase() == team.toLowerCase()
      );
      if (match.length > 0) {
        if (index == "leader") {
        } else {
          item.get("id").setValue(match[0].id);
          item.get("full_name").setValue(match[0].full_name);
          item.get("associatedAssetList").setValue(match[0].associated_assets);
          this.removeServiceFormList(match[0].id, 'id', this.teamList);
        }
      } else {
        if (index == "leader") {
        } else {
          item.get("id").setValue("");
        }
      }
    } catch (err) {
      this.global.addException("validateTeam", "validateTeam()", err);
    }
  }

  addTeamForm(option, data: any = {}) {
    try {
      //if(option == '0'){
      this.minDate = new Date(
        this.woService.scheduleDetails
          ? this.woService.scheduleDetails.start_date
          : ""
      );
      this.maxDate = new Date(
        this.woService.scheduleDetails
          ? this.woService.scheduleDetails.end_date
          : ""
      );
      //}
      this.teamForm = this.fb.group({
        teamMembers: this.fb.array([])
      });
      if (option == "1") {
        for (var i = 0; i < data.length; i++) {
          this.addTeams(option, data[i]);
          this.removeServiceFormList(data[i].staff_id, 'id', this.teamList);
        }
      } else {
        this.addTeams("0");
      }
    } catch (err) {
      this.global.addException("Team", "addTeamForm()", err, {
        selectedSchedule: this.woService.scheduleDetails,
        functionParameter: data
      });
    }
  }
  get teamMembers(): FormArray {
    return (<FormArray>this.teamForm.get("teamMembers")) as FormArray;
  }

  addTeams(option, val: any = {}) {
      console.log("Added Tem :: ",val);
    try {
if(val) {
  this.dStart = new Date(val.start_date);
  this.dStart.setMinutes( this.dStart.getMinutes() + this.dStart.getTimezoneOffset() );

  this.dEnd = new Date(val.end_date);
  this.dEnd.setMinutes( this.dEnd.getMinutes() + this.dEnd.getTimezoneOffset() );
}
      this.teamMembers.push(
        this.fb.group({
            full_name: new FormControl(option == "1" ? val.name : ""),
          id: new FormControl(option == "1" ? val.staff_id : "", [
            Validators.required
          ]),
          scheduling_id: new FormControl(
            option == "1" ? val.scheduling_id : ""
          ),
          is_team_leader: new FormControl(
            option == "1" ? val.is_team_leader : ""
          ),
          //ad_hoc_service: new FormControl(''),
          start_date: new FormControl(
            option == "1"
              ?  this.dStart
              : this.util.getDateObjet(
                  this.woService.scheduleDetails.start_date
                ),
            [Validators.required]
          ),
          start_time: new FormControl(
            option == "1"
              ? val.start_time.substring(0, 5)
              : this.woService.scheduleDetails.start_time.substring(0, 5),
            [
              Validators.required,
              Validators.pattern(this.constant.TIME_PATTERN)
            ]
          ),
          start_time_format: new FormControl(
            option == "1"
              ? val.start_time_format
              : this.woService.scheduleDetails.start_time_format
          ),
          end_date: new FormControl(
            option == "1"
              ? this.dEnd
              : this.util.getDateObjet(this.woService.scheduleDetails.end_date),
            [Validators.required]
          ),
          end_time: new FormControl(
            option == "1"
              ? val.end_time.substring(0, 5)
              : this.woService.scheduleDetails.end_time.substring(0, 5),
            [
              Validators.required,
              Validators.pattern(this.constant.TIME_PATTERN)
            ]
          ),
          end_time_format: new FormControl(
            option == "1"
              ? val.end_time_format
              : this.woService.scheduleDetails.end_time_format
          ),
          is_delete : new FormControl(0),
          teamMemberList: new FormControl([]),
          filteredTeam: new FormControl(new Observable<string[]>()),
          associatedAssetList: new FormControl(
            option == "1"
              ? val.associatedAssetList
                ? val.associatedAssetList
                : []
              : []
          )
        })
      );
    console.log("this.teamMembers :: ",this.teamMembers);
      this.setObservable(this.teamMembers.length - 1);
   
    } catch (err) {
      this.global.addException("Team - Add team", "addTeams()", err, {
        AddTeam: this.teamMembers,
        functionParameter: val
      });
    }
  }
  setObservable(index): void {
      this.teamMembers.at(index).get('filteredTeam').setValue(this.teamMembers.at(index).get('full_name').valueChanges.pipe(startWith(''),map(value => this.teamFilter(value))));
  }

  removeTeam(position, team): void {
    try {
      let self = this;
      if (this.teamMembers.at(position).get("scheduling_id").value != "") {
        this.woService.deletedTeamMember.push(
          this.teamMembers.at(position).get("scheduling_id").value
        );
      }
      team.get('id').value != '' ? this.addServiceToList(team.get('id').value, 'id', this.teamList, this.backupTeamList) : '' ;
      self.teamMembers.removeAt(position);
    } catch (err) {
      this.global.addException("Remove team", "removeTeam()", err);
    }
  }

  review() {
    try {
      this.submitted = true;

      if (this.teamForm.valid) {
        let team: any[] = [];
        for (var i = 0; i < this.teamForm.value.teamMembers.length; i++) {
          team.push({
            staff_id: this.teamForm.value.teamMembers[i].id,
            scheduling_id: this.teamForm.value.teamMembers[i].scheduling_id,
            staff: this.teamForm.value.teamMembers[i].full_name,
            name: this.teamForm.value.teamMembers[i].full_name,
            is_team_leader: i == 0 ? 1 : 0,
            is_approved: 1,
            start_date: this.util.getYYYYMMDDDate(
              this.teamForm.value.teamMembers[i].start_date
            ),
            end_date: this.util.getYYYYMMDDDate(
              this.teamForm.value.teamMembers[i].end_date
            ),
            start_time: this.teamForm.value.teamMembers[i].start_time,
            start_time_format: this.teamForm.value.teamMembers[i]
              .start_time_format,
            end_time: this.teamForm.value.teamMembers[i].end_time,
            end_time_format: this.teamForm.value.teamMembers[i].end_time_format,
            associatedAssetList: this.teamForm.value.teamMembers[i]
              .associatedAssetList,
            is_delete: 0
          });
          this.teamForm.value.teamMembers[i].associatedAssetList.map(asset => {
            if (asset.status.trim() == "Available") {
              let search: boolean = true;
              for (let i = 0; i < this.woService.associatedAsset.length; i++) {
                search = true;
                if (
                  this.woService.associatedAsset[i].asset_id == asset.asset_id
                ) {
                  search = false;
                  break;
                }
              }
              if (search) {
                this.woService.associatedAsset.push({
                  asset_id: asset.asset_id,
                  status: "Not Added"
                });
              }
            }
          });
        }
        //console.log(team);

        this.woService.WO_DATA.teamDetails = team;
        this.woService.updateFormStatus("teamFm", true);
      } else {
        this.woService.updateFormStatus("teamFm", false);
      }
    } catch (err) {
      this.global.addException("Team", "review()", err);
    }
  }
}
