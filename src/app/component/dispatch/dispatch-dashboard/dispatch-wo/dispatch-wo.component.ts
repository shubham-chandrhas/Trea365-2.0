import {Component, OnInit, ElementRef, NgZone, ViewChild, AfterViewInit, Input } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { HttpService } from "../../../../shared/service/http.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { UtilService } from "../../../../shared/service/util.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { DispatchDashboardComponent } from "../dispatch-dashboard.component";
import { GoogleMapsAPIWrapper, AgmMap, LatLngBounds, LatLngBoundsLiteral } from "@agm/core";
import { sortBy as _sortBy } from "underscore";
declare var google: any;
@Component({
  selector: "app-dispatch-wo",
  templateUrl: "./dispatch-wo.component.html",
  styleUrls: [
    "./dispatch-wo.component.css",
    "../../../workflow/project-estimator/quotation-generation/quotation-generation.component.css",
    "../dispatch-all/dispatch-all.component.css",
    "../../../workflow/project-estimator/quotation-list/quotation-list.component.css"
  ]
})
export class DispatchWoComponent implements OnInit, AfterViewInit {
  dispatchTab: string;
  pageData: any = {
    workOrders: [],
    listCount: 0,
    sortColumn: "id",
    sortColumnType: "N",
    sortOrder: "DSC",
    isError: false
  };

  @ViewChild("AgmMap") agmMap: AgmMap;
  @Input() woList: any;
  @Input() companyData: any;

  latitude: number;
  longitude: number;
  company_id: string;
  company_name: string;
  mapLatitude: any;
  mapLongitude: any;
  zoom: number;
  mapTypeId: string;
  showMap = false;
  woListteam: any = [];
  location: any;
  woLocation: any;
  selectedWoList: any;
  public searchList;
  public searchTxt;
  public selectedStaffList: any = null;
  iconUrl = "https://devtrea.s3.us-east-2.amazonaws.com/public/company_0/attachments/images/1564577954.png";
  // public selectedWo: any = null;

  constructor(
    public router: Router,
    public util: UtilService,
    private route: ActivatedRoute,
    private http: HttpService,
    public constant: ConstantsService,
    public dispatch: DispatchDashboardComponent,
    public global: GlobalService
  ) {}

  ngOnInit() {
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.util.menuChange({
      menu: 9,
      subMenu: 0
    });
    // this.getAllList();
    this.latitude = parseFloat(this.companyData.company_latitude);
    this.longitude = parseFloat(this.companyData.company_longitude);
    this.company_id = this.companyData.company_id;
    this.company_name = this.companyData.company_name;

    if (this.dispatch.selectedWo != "0") {
      this.showWoDetails(
        this.util.getEntity(
          this.dispatch.selectedWo,
          this.woList,
          "work_order_id"
        )
      );
    }
    // this.pageData.paginationKey = { itemsPerPage: 5, currentPage: 1,PAGINATION_ITEMS: [5,10,15,20,25,50] };
    this.pageData.paginationKey = {
      itemsPerPage: this.constant.ITEMS_PER_PAGE,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.mapTypeId = "roadmap";
    this.showMap = true;
  }

  ngAfterViewInit() {
    this.agmMap.mapReady.subscribe(map => {
      const bounds: LatLngBounds = new google.maps.LatLngBounds();
      for (const wo of this.woList) {
        bounds.extend(new google.maps.LatLng(wo.latitude, wo.longitude));
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

  updateCount(count) {
    this.constant.ITEM_COUNT = this.pageData.listCount = count;
  }
   showWoDetails(wo) {
        const sortedList: any[] = _sortBy(this.woList, "work_order_id").reverse();
        for (let i = 0; i < sortedList.length; i++) {
            if (wo.work_order_id == sortedList[i].work_order_id) {
                this.getSelectedWo(sortedList[i], i);
                this.pageData.selectedIndex = i;
                break;
            }
        }
  }
  getSelectedWo(workOrder, index?) {

    if (!this.util.canAccess('dispatch_wo_details')) {
        return false;
    }

    try {
      this.pageData.selectedIndex = index;
      const zoom = this.zoom;
      const self = this;
      this.util.showProcessing("processing-spinner");
      this.http.doGet(
        "dispatch/wo/" + workOrder.work_order_id + "/details",
        function (error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            console.log("error", response);
          } else {
            self.selectedWoList = response.data.work_order;
            setTimeout(function () {
              self.util.scrollDown("DispatchD");
              this.zoom = zoom;
            }, 1000);
          }
        }
      );

    } catch (err) {
      this.global.addException("SelectedWo", "getSelectedWo()", err);
    }
  }
}
