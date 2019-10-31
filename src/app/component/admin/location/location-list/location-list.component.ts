import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import * as _ from "underscore";

import { LocationService } from "./../location.service";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { LocationDialog } from "../location.component";
import { AdminService } from "../../admin.service";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { GlobalService } from "../../../../shared/service/global.service";
import { ExportService } from "../../../../shared/service/export.service";

@Component({
  selector: "app-location-list",
  templateUrl: "./location-list.component.html",
  styleUrls: ["./location-list.component.css"]
})
export class LocationListComponent implements OnInit {
  public sortColumn = "location_id";
  public sortColumnType = "N";
  public sortOrder = "DSC";
  public selectedLoc: any = null;
  public locationList: any[] = [];
  public printAllList: any[];
  public searchList: string;
  public searchTxt: string;
  public typeSearch;
  public nameSearch;
  public shortFormSearch;
  public addressSearch;
  public assetSearch;
  public paginationKey: any;
  public listCount = 0;
  public selectedIndex: number;

  public onBoarding = false;

  constructor(
    private router: Router,
    public util: UtilService,
    public dialog: MatDialog,
    private location: LocationService,
    private admin: AdminService,
    private http: HttpService,
    public constant: ConstantsService,
    private global: GlobalService,
    private exportDoc: ExportService,
    private route: ActivatedRoute,
    private loc: Location
  ) {}

  ngOnInit() {
    const self = this;
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    try {
      this.paginationKey = {
        itemsPerPage: this.constant.ITEMS_PER_PAGE,
        currentPage: this.constant.CURRENT_PAGE
      };
      this.router.url.split("/")[2] === "csa-onboarding" ?
        this.util.menuChange({
          menu: "guide",
          subMenu: ""
        }) :
        this.util.menuChange({
          menu: 2,
          subMenu: 12
        });
      this.getLocationList();

      this.util.changeDetection.subscribe(dataObj => {
        if (dataObj && dataObj.source === "LOCATION") {
          self.getLocationList();
          self.selectedLoc = self.selectedIndex = null;
        }
      });

      this.admin.newRecord.subscribe(status => {
        if (status) {
          self.getLocationList();
          self.selectedLoc = self.selectedIndex = null;
        }
      });
    } catch (err) {
      this.global.addException("location list", "ngOnInit()", err);
    }
  }

  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }
  getSearchTxt(filterValue: string) {
    if (filterValue === "") {
      this.searchTxt = "";
    }
  }

  getLocationList() {
    const self = this;
    this.util.showProcessing("processing-spinner");
    try {
      this.location.getLocation((error: boolean, response: any) => {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          self.util.showAlert(response.message);
          this.global.addException("location list", "getLocationList()", response);
        } else {
          self.locationList = response.data;
          if (self.locationList.length === 0) {
            self.onBoarding = true;
          }
          self.route.snapshot.paramMap.get("id") != "0" ?
            self.showLocationDetails() :
            "";
        }
      });
    } catch (err) {
      this.global.addException("location list", "getLocationList()", err);
    }
  }

  showLocationDetails() {
    const sortedList: any[] = _.sortBy(
      this.locationList,
      "location_id"
    ).reverse();
    for (let i = 0; i < sortedList.length; ++i) {
      if (parseInt(this.route.snapshot.paramMap.get("id"), 10) === sortedList[i].location_id) {
        this.getSelectedLoc(sortedList[i].location_id, i);
        this.selectedIndex = i;
        break;
      }
    }
  }

  newLocation() {
    try {
      sessionStorage.removeItem("locationDetails");
      this.router.url.split("/")[2] === "csa-onboarding" ?
        this.router.navigate(["/admin/csa-onboarding/add-location"]) :
        this.router.navigate(["/admin/csa/add-location"]);
    } catch (err) {
      this.global.addException("location list", "newLocation()", err);
    }
  }

  printAll() {
    this.admin.printPreview("print-all-section");
  }

  getSelectedLoc(locId, index) {
    const self = this;
    this.selectedIndex = index;
    const reviewDiv: any = [];
    this.util.showProcessing("processing-spinner");
    this.http.doGet(`admin/location/${locId}/details`, (
      error: boolean,
      response: any
    ) => {
      self.util.hideProcessing("processing-spinner");
      if (error) {
        self.global.addException("location list", "getSelectedLoc()", response);
      } else {
        const location = response.data;
        self.selectedLoc = location;
        try {
          for (let i = 0; i < location.divisions.length; i++) {
            const divRow = [];
            for (let j = 0; j < 2; j++) {
              if (i < location.divisions.length) {
                location.divisions[i].id = i + 1;
                location.divisions[i].valArr =
                  location.divisions[i].division_type === "Named" ?
                  location.divisions[i].division_value.split(",") :
                  [];
                divRow.push(location.divisions[i]);
              } else {
                break;
              }
              if (j === 0) {
                i++;
              }
            }
            reviewDiv.push({
              row: divRow
            });
          }
          location.divListReview = reviewDiv;
          location.tagSample = self.createTagSample(location);
          self.getLocationTags(location.location_id);
           self.loc.go(
            self.loc
            .path()
            .split("/")
            .splice(0, self.loc.path().split("/").length - 1)
            .join("/") +
            "/" +
            location.location_id
          );
           setTimeout(() => { self.util.scrollDown("locationMark"); }, 1000);
        } catch (err) {
          self.global.addException("location list", "getSelectedLoc()", err);
        }
      }
    });

  }

  getLocationTags(locId) {
    const self = this;
    self.util.addSpinner("showTagsBtn", "View");
    try {
      this.http.doGet(`admin/location/${locId}/tags`, (
        error: boolean,
        response: any
      ) => {
        if (error) {
          this.global.addException("location list", "getLocationTags()", response);
        } else {
          // self.updatePrintTable(response.tags);
          self.selectedLoc.tagsList = response.data;
        }
        self.util.removeSpinner("showTagsBtn", "View");
      });
    } catch (err) {
      this.global.addException("location list", "getLocationTags()", err);
    }
  }

  createTagSample(location) {
    try {
      let tag: string = location.short_form;
      for (let i = 0; i < location.divisions.length; i++) {
        if (location.divisions[i].division_type === "Named") {
          tag =
            tag +
            "-" +
            location.divisions[i].division_value.split(",")[0].toUpperCase();
        } else {
          tag = tag + "-" + ("00" + location.divisions[i].min).substr(-2, 2);
        }
      }
      return tag.toUpperCase();
    } catch (err) {
      this.global.addException("location list", "createTagSample()", err);
    }
  }
  showTagsDialog() {
    this.dialog.open(LocationDialog, {
      data: {
        action: "updateTag",
        tagsList: this.selectedLoc.tagsList,
        locName: this.selectedLoc.location_name
      }
    });
  }

  showPrintDialog() {
    this.dialog.open(LocationDialog, {
      data: {
        action: "printLocation",
        tagsList: this.selectedLoc.tagsList,
        locName: this.selectedLoc.location_name
      }
    });
  }

  showDeleteDialog(locId) {
    const data: any = {
      API_URL: "admin/location/delete",
      reqObj: {
        id: this.selectedLoc.location_id
      },
      event: {
        source: "LOCATION",
        action: "DELETE"
      }
    };
    this.util.showDialog(
      DialogComponent,
      "Are you sure you want to delete " + // @ Shahebaz - Start
      this.selectedLoc.location_name + // @ Shahebaz - End
      " ?",
      [],
      "Delete Confirmation ?",
      "CONFIRMATION",
      data
    );
  }

  exportLocAsPdf() {
    this.exportDoc.generateLandscapepdf("locTbl", "Location List", "locations");
  }
  exportLocAsCSV() {
    this.exportDoc.generatecsv("locTbl", "locations");
  }
}
