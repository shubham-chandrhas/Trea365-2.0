import {Component, OnInit, ElementRef, NgZone, ViewChild, AfterViewInit, Input, OnChanges } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { DispatchDashboardComponent } from "../dispatch-dashboard.component";
import { GoogleMapsAPIWrapper, AgmMap, LatLngBounds, LatLngBoundsLiteral } from "@agm/core";
import { SocketService } from "../../../../shared/service/socket.service";
import { sortBy as _sortBy } from "underscore";
declare var google: any;

@Component({
  selector: "app-dispatch-all",
  templateUrl: "./dispatch-all.component.html",
  styleUrls: [
    "../../../workflow/project-estimator/quotation-generation/quotation-generation.component.css",
    "./dispatch-all.component.css",
    "../../../workflow/project-estimator/quotation-list/quotation-list.component.css"
  ]
})
export class DispatchAllComponent implements OnInit, AfterViewInit, OnChanges {
  dispatchTab: string;
  pageData: any = {
    columnType: "A",
    sortColumn: "id",
    sortOrder: "DSC"
  };
  @ViewChild("AgmMap") agmMap: AgmMap;
  @Input() woList: any;
  @Input() staffList: any;
  @Input() companyData: any;
  latitude: number;
  longitude: number;
  company_id: string;
  company_name: string;
  mapTypeId: string;
  location: any;
  iconUrl = "https://devtrea.s3.us-east-2.amazonaws.com/public/company_0/attachments/images/1564577954.png";
  // woList: any[] = [];
  // staffList: any[] = [];
  showMap = false;
  selectedStaff: string;
  selectedWo: string;
  ioConnection: any;
  request_id = "00000";
  constructor(
    public router: Router,
    public util: UtilService,
    private route: ActivatedRoute,
    private http: HttpService,
    public dispatch: DispatchDashboardComponent,
    public global: GlobalService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.util.menuChange({
      menu: 9,
      subMenu: 0
    });
    this.dispatch.selectedStaff = "0";
    this.dispatch.selectedWo    = "0";

    // set google maps defaults
    this.mapTypeId              = "roadmap";
    this.showMap                = true;
  }

  ngOnChanges() {
    if (this.companyData) {
      this.latitude               = parseFloat(this.companyData.company_latitude) ;
      this.longitude              = parseFloat(this.companyData.company_longitude) ;
      this.company_id             = this.companyData.company_id ;
      this.company_name           = this.companyData.company_name ;
    }

  }
  ngAfterViewInit() {
    this.agmMap.mapReady.subscribe(map => {
      const bounds: LatLngBounds = new google.maps.LatLngBounds();
      for (const wo of this.woList) {
        bounds.extend(new google.maps.LatLng(wo.latitude, wo.longitude));
      }
      for (const staff of this.staffList) {
        bounds.extend(new google.maps.LatLng(staff.latitude, staff.longitude));
      }
      map.fitBounds(bounds);
      if (map.getZoom() > 15) {
        map.setZoom(15);
      }
    });
  }

  setMapType(mapTypeId: string) {
    this.mapTypeId = mapTypeId;
  }

  changeDispatchTab(tab, obj) {
    this.dispatch.changeDispatchTab(tab);
    this.dispatch.selectedWo = obj.work_order_id;
    this.dispatch.selectedStaff = obj.id;
  }
}
