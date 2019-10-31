import {Component, OnInit, ElementRef, NgZone, ViewChild, AfterViewInit, Input, OnChanges} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { DispatchDashboardComponent } from "../dispatch-dashboard.component";
declare var google: any;
import {GoogleMapsAPIWrapper, AgmMap, LatLngBounds, LatLngBoundsLiteral, AgmCoreModule } from "@agm/core";
import { SocketService } from "../../../../shared/service/socket.service";
import { sortBy as _sortBy } from "underscore";
@Component({
  selector: "app-dispatch-staff",
  templateUrl: "./dispatch-staff.component.html",
  styleUrls: [
    "./dispatch-staff.component.css",
    "../../../workflow/project-estimator/quotation-generation/quotation-generation.component.css",
    "../dispatch-all/dispatch-all.component.css",
    "../../../workflow/project-estimator/quotation-list/quotation-list.component.css"
  ]
})
export class DispatchStaffComponent implements OnInit, AfterViewInit, OnChanges {
  dispatchTab: string;
  // pageData: any = {
  //     'columnType': 'A',
  //     'sortColumn': 'id',
  //     'sortOrder': 'DSC',
  // }
  pageData: any = {
    staffList: [],
    listCount: 0,
    sortColumn: "id",
    sortColumnType: "N",
    sortOrder: "DSC",
    isError: false
  };
  @ViewChild("AgmMap") agmMap: AgmMap;
  @Input() staffList: any;
  @Input() is_staff_location: boolean;
  @Input() companyData: any;
  latitude: number;
  longitude: number;
  company_id: string;
  company_name: string;
  zoom: number;
  maxZoom: number;
  mapTypeId: string;
  showMap = false;
  location: any;
  staffLocation: any;
  selectedStaffList: any;
  request_id: string;
  ioConnection: any;
  iconUrl = "https://devtrea.s3.us-east-2.amazonaws.com/public/company_0/attachments/images/1564577954.png";
  constructor(
    public router: Router,
    public util: UtilService,
    private route: ActivatedRoute,
    private http: HttpService,
    public global: GlobalService,
    public constant: ConstantsService,
    public dispatch: DispatchDashboardComponent,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.util.menuChange({
      menu: 9,
      subMenu: 0
    });
    this.latitude = parseFloat(this.companyData.company_latitude);
    this.longitude = parseFloat(this.companyData.company_longitude);
    this.company_id = this.companyData.company_id;
    this.company_name = this.companyData.company_name;

    if (this.dispatch.selectedWo != "0") {
      this.showStaffDetails(
        this.util.getEntity(this.dispatch.selectedWo, this.staffList, "user_id")
      );
    }
    // this.pageData.paginationKey = { itemsPerPage: 5, currentPage: 1,PAGINATION_ITEMS: [5,10,15,20,25,50] };
    this.pageData.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    // set google maps defaults
    this.mapTypeId = "roadmap";
    this.showMap = true;
  }
  ngOnChanges() {
    if (this.staffList) {
      this.pageData.staffList = this.staffList;
    }
  }
  ngAfterViewInit() {
    this.agmMap.mapReady.subscribe(map => {
      const bounds: LatLngBounds = new google.maps.LatLngBounds();
      for (const staff of this.staffList) {
        bounds.extend(new google.maps.LatLng(staff.latitude, staff.longitude));
      }
      this.maxZoom = 19;
      map.fitBounds(bounds);
      setTimeout(() => {
        this.maxZoom = 30;
        // console.log("gi");
      }, 1000);
    });
  }

  setMapType(mapTypeId: string) {
    this.mapTypeId = mapTypeId;
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = this.pageData.listCount = count;
  }
  showStaffDetails(staff) {
        const sortedList: any[] = _sortBy(this.pageData.staffList, "id").reverse();
        for (let i = 0; i < sortedList.length; i++) {
            if (staff.id == sortedList[i].id) {
                this.getSelectedStaff(sortedList[i], i);
                this.pageData.selectedIndex = i;
                break;
            }
        }
  }
  getSelectedStaff(staff, index?) {
    try {
      this.pageData.selectedIndex = index;
      const zoom = this.zoom;
      this.util.showProcessing("processing-spinner");
      this.http.doGet(
        `dispatch/staff/${staff.id}/details`, (error: boolean, response: any) => {
          this.util.hideProcessing("processing-spinner");
          if (error) {
            console.log("error", response);
          } else {
            this.selectedStaffList = response.data.staff;
            this.selectedStaffList.latitude = parseFloat(staff.latitude);
            this.selectedStaffList.longitude = parseFloat(staff.longitude);
            //  this.calculateDistance();
            setTimeout(() => {
              this.util.scrollDown("DispatchD");
              this.zoom = zoom;
            }, 1000);
          }
        }
      );


    } catch (err) {
      this.global.addException("Selectedstaff", "getSelectedStaff()", err);
    }
  }
  getWoData(workOrderId: BigInteger, workOrders: Array < any > ): any {
    let workOrder = {};
    for (let index = 0; index < workOrders.length; index++) {
      if (workOrders[index].work_order_id === workOrderId) {
        workOrder = workOrders[index];
        break;
      }
    }
    return workOrder;
  }
}
