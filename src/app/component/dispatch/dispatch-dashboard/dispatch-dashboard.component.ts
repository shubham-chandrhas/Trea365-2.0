import { Component, OnInit, ElementRef, NgZone, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { UtilService } from "../../../shared/service/util.service";
import { SocketService } from "../../../shared/service/socket.service";
import { HttpService } from "../../../shared/service/http.service";
import { GlobalService } from "../../../shared/service/global.service";
import { ConstantsService } from "../../../shared/service/constants.service";

@Component({
  selector: "app-dispatch-dashboard",
  templateUrl: "./dispatch-dashboard.component.html",
  styleUrls: ["./dispatch-dashboard.component.css"]
})
export class DispatchDashboardComponent implements OnInit {
  dispatchTab = "all";
  isWoDisableTab = "1";
  isStaffDisableTab = "1";
  selectedStaff = "0";
  selectedWo = "0";
  ioConnection: any;
  request_id = "0000";
  company_id: string;
  company_name: string;
  woList: any[] = [];
  staffList: any[] = [];
  latitude: number;
  longitude: number;
  is_staff_location: boolean;
  companyData: any;
  connected_members = 0;
  remaining_members:number;

  constructor(
    public router: Router,
    public util: UtilService,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private http: HttpService,
    private global: GlobalService,
    public constant: ConstantsService
  ) {}
  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.util.menuChange({
      "menu": 9,
      "subMenu": 0
    });
    this.is_staff_location = false;
    this.getAllList();
    this.selectedStaff = "0";
    this.selectedWo = "0";
    this.socketService.initSocket();
  }

  changeDispatchTab(tabName) {
    this.dispatchTab = tabName;
  }
  getAllList() {
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("dispatch/list", (error: boolean, response: any) => {
        this.util.hideProcessing("processing-spinner");
        let latitude = null;
        let longitude = null;

        if (error) {
          console.log("error", response);
        } else {
          this.request_id = response.data.request_id;
          this.initIoConnection();
          for (let i = 0; i < response.data.work_orders.length; i++) {
            if (response.data.work_orders[i].latitude) {
              latitude = response.data.work_orders[i].latitude;
            }
            if (response.data.work_orders[i].longitude) {
              longitude = response.data.work_orders[i].longitude;
              if (latitude) {
                break;
              }
            }
          }

          if (
            response.data.work_orders.length === 0 ||
            (!latitude || !longitude)
          ) {
            this.company_id = response.data.company_id;
            this.company_name = response.data.company_name;
            latitude = response.data.company_latitude;
            longitude = response.data.company_longitude;
          }

          this.woList = response.data.work_orders ?
            response.data.work_orders : [];
          this.staffList = response.data.staff ? response.data.staff : [];
          this.remaining_members = this.staffList.length;
          this.latitude = latitude;
          this.longitude = longitude;
           this.companyData = {
                              company_id:        response.data.company_id,
                              company_latitude:  response.data.company_latitude,
                              company_longitude: response.data.company_longitude,
                              company_name:      response.data.company_name
                            };
          this.isWoDisableTab = this.woList.length > 0 ? "0" : "0";
          this.isStaffDisableTab =
            this.staffList.length > 0 ? "0" : "0";
        }
      });
    } catch (err) {
      this.global.addException("work order list", "getAllList()", err);
    }
  }
    private initIoConnection(): void {
    this.ioConnection = this.socketService
      .onMarkerData(this.request_id)
      .subscribe((data: any) => {
       console.log(data);
       if (data.dispatch && data.dispatch.staff_id) {
         let staffData = data.dispatch;
         this.staffList.map((item) => {
           if (item.id == staffData.staff_id) {
                this.connected_members++;
                this.remaining_members = this.staffList.length - this.connected_members;
                this.is_staff_location = true;
                item.latitude = staffData.latitude;
                item.longitude = staffData.longitude;
           }
         });
       }
      });
    // setTimeout(() => {this.initIoConnection(); }, 2000);
  }
  // setMapType(mapTypeId: string) { this.mapTypeId = mapTypeId; }

}
