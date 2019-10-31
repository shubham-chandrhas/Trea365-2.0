import {
  Component,
  OnInit,
  ElementRef,
  NgZone,
  ViewChild,
  Input
} from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  Validators
} from "@angular/forms";
import {
    isEmpty as _isEmpty
} from 'underscore';
import { Location } from "@angular/common";
import { Observable } from "rxjs";
import { startWith, map } from "rxjs/operators";
import { MapsAPILoader } from "@agm/core";
import { GlobalService } from "../../../../shared/service/global.service";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { ProjectEstimatorDialog } from "../project-estimator-dialog.component";
import { DialogComponent } from "../../../../shared/model/dialog/dialog.component";
import { ProjectEstimatorService } from "../project-estimator.service";
import * as htmlToImage from "html-to-image";

var gMap;

@Component({
  selector: "app-quotation-generation",
  templateUrl: "./quotation-generation.component.html",
  styleUrls: ["./quotation-generation.component.css"]
})
export class QuotationGenerationComponent implements OnInit {
  generateQuoteFm: FormGroup;
  submitted: boolean = false;
  sameAsWorkLocation: boolean = true;
  clientName: FormControl;
  locationName: FormControl;
  filteredClients: Observable<any[]>;
  filteredLocations: Observable<any[]>;
  filteredLocationsB: Observable<any[]>;
  filteredContact: Observable<any[]>;
  quatationTab: string = "services";
  contactList: any = [];
  clientList: any[] = [];
  selectedClient: any = {};
  ClientData: any = {};
  locationList: any[] = [];
  workLocation: any[] = [];
  bilingLocation: any[] = [];
  errMsg: string = "";
  isError: boolean = false;

  @ViewChild("screen") screen: ElementRef;
  @ViewChild("canvas") canvas: ElementRef;
  @ViewChild("downloadLink") downloadLink: ElementRef;

  latitude: number;
  longitude: number;
  zoom: number;
  mapTypeId: string;
  showMap: boolean = false;
  currentPath: string;
  name: number;
  randomKey: string;
  isClientLoad: boolean = false;
  isStreeView: boolean = false;
  isEdit: string = "noEdit";
  @Input() heading: number = 34;
  @Input() pitch: number = 10;

  public pageVariables: any = {
    next_page_url: null,
    path: "",
    per_page: 0,
    prev_page_url: null,
    total: 0,
    clientListBackUp: [],
    client_id: "",
    client_name: "",
    clientOTF: {}
  };

  constructor(
    public dialog: MatDialog,
    public util: UtilService,
    public http: HttpService,
    public global: GlobalService,
    private fb: FormBuilder,
    public router: Router,
    public constant: ConstantsService,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    public PEService: ProjectEstimatorService,
    private route: ActivatedRoute,
    private _location: Location
  ) {
    this.clientName = new FormControl();
    this.locationName = new FormControl();
  }

  ngOnInit() {
    this.currentPath = this.router.url.split("/")[
      this.router.url.split("/").length - 2
    ];
    this.isClientLoad = false;
    this.util.menuChange({ menu: 4, subMenu: 25 });
    this.util.setWindowHeight();
    this.util.setPageTitle(this.route);
    this.name = this.util.getUniqueString();
    this.randomKey = this.util.getRandomNumber();
    if (sessionStorage.getItem("quotationDetails")) {
      let quotationDetails = JSON.parse(
        sessionStorage.getItem("quotationDetails")
      );
      console.log(quotationDetails);
      if (quotationDetails.project_estimate_no) {
        this.isEdit = "edit";
      } else {
        this.isEdit = "noEdit";
      }
      sessionStorage.getItem("quotationFormFlag")
        ? this.PEService.setFormValidationStatus(
            JSON.parse(sessionStorage.getItem("quotationFormFlag"))
          )
        : "";
      this.PEService.projectEstimatorData = JSON.parse(
        sessionStorage.getItem("quotationDetails")
      );
      if (quotationDetails.client_work_location) {
        this.getSelectedLocationEdit(quotationDetails.work_location);
      }
      if (
        this.PEService.projectEstimatorData.servicesDetails.services.length > 0
      ) {
        this.PEService.projectEstimatorData.servicesDetails.services.forEach(
          (element, key) => {
            this.PEService.projectEstimatorData.servicesDetails.services[
              key
            ].cost = parseFloat(element.cost);
            this.PEService.projectEstimatorData.servicesDetails.services[
              key
            ].quantity = parseFloat(element.quantity);
            this.PEService.projectEstimatorData.servicesDetails.services[
              key
            ].total_amount = parseFloat(element.total_amount);
          }
        );
      }

      if (
        this.PEService.projectEstimatorData.materialsDetails.materials.length >
        0
      ) {
        this.PEService.projectEstimatorData.materialsDetails.materials.forEach(
          (element, key) => {
            this.PEService.projectEstimatorData.materialsDetails.materials[
              key
            ].cost = parseFloat(element.cost);
            this.PEService.projectEstimatorData.materialsDetails.materials[
              key
            ].quantity = parseFloat(element.quantity);
            this.PEService.projectEstimatorData.materialsDetails.materials[
              key
            ].total_amount = parseFloat(element.total_amount);
          }
        );
      }

      if (this.PEService.projectEstimatorData.scheduleDetails) {
        this.PEService.projectEstimatorData.scheduleDetails.start_date =
          this.PEService.projectEstimatorData.scheduleDetails.start_date &&
          this.PEService.projectEstimatorData.scheduleDetails.start_date.indexOf(
            "-"
          ) > -1
            ? this.util.stringToDate(
                this.util.getDDMMYYYYDate(
                  this.PEService.projectEstimatorData.scheduleDetails.start_date
                )
              )
            : this.util.stringToDate(
                this.PEService.projectEstimatorData.scheduleDetails.start_date
              );

        this.PEService.projectEstimatorData.scheduleDetails.end_date =
          this.PEService.projectEstimatorData.scheduleDetails.end_date &&
          this.PEService.projectEstimatorData.scheduleDetails.end_date.indexOf(
            "-"
          ) > -1
            ? this.util.stringToDate(
                this.util.getDDMMYYYYDate(
                  this.PEService.projectEstimatorData.scheduleDetails.end_date
                )
              )
            : this.util.stringToDate(
                this.PEService.projectEstimatorData.scheduleDetails.end_date
              );
      }

      if(quotationDetails.payment_term)
      {
          this.PEService.projectEstimatorData.clientDetails.payment_term = quotationDetails.payment_term;
      }
      this.createForm("1", this.PEService.projectEstimatorData.clientDetails);
    } else {
      this.createForm("0");
    }

    this.getClientList("init");

    //  set google maps defaults
    this.zoom = 18;
    this.latitude = -79.40638519999999;
    this.longitude = 43.66798389999999;
    this.mapTypeId = "roadmap";

    this.util.changeDetection.subscribe(dataObj => {
      if (dataObj && dataObj.source == "QUOTATION_GENERATION") {
        if (dataObj.action == "ADD_CLIENT") {
          this.pageVariables.client_id = dataObj.data.client_id;
          this.pageVariables.clientOTF = dataObj.data;
          this.pageVariables.client_name = dataObj.data.client_name;
          this.getClientList("addClient");
        } else if (dataObj.action == "ADD_LOCATION") {
          this.getWorkLocationOnTheFly(
            "addLocation",
            dataObj.data.client_id,
            dataObj.data.client_address_id,
            dataObj.type
          );
        }
        this.util.changeEvent(null);
      }
    });


    // this.filteredClients = this.generateQuoteFm.get('client_name').valueChanges.pipe(
    //         startWith(""),
    //         map(data =>
    //           data
    //             ? this.filterClients(data, this.clientList)
    //             : this.clientList.slice()
    //         )
    //       );
    // this.filteredLocationsB = this.generateQuoteFm.get('client_billing_location').valueChanges.pipe(
    //             startWith(""),
    //             map(data =>
    //               data
    //                 ? this.filterLocation(data, this.bilingLocation)
    //                 : this.bilingLocation.slice()
    //             )
    //           );
    // this.filteredLocations = this.generateQuoteFm.get('location').valueChanges.pipe(
    //             startWith(""),
    //             map(data =>
    //               data
    //                 ? this.filterLocation(data, this.workLocation)
    //                 : this.workLocation.slice()
    //             )
    //           );


    this.quatationTab = this.router.url.split("/")[
      this.router.url.split("/").length - 1
    ];
  }

  initMap() {
    const self = this;
    this.mapsAPILoader.load().then(() => {
      var latlng = new google.maps.LatLng(
        self.PEService.locationDetails.latitude,
        self.PEService.locationDetails.longitude
      );
      gMap = new google.maps.Map(document.getElementById("map-wrapper2"), {
        center: latlng,
        zoom: self.PEService.locationDetails.zoom,
        streetViewControl: true,
        mapTypeControl: false
      });

      const marker = new google.maps.Marker({
        position: latlng,
        map: gMap
      });

      var thePanorama = gMap.getStreetView();

      google.maps.event.addListener(thePanorama, "visible_changed", function() {
        if (thePanorama.getVisible()) {
          self.isStreeView = true;
        } else {
          self.isStreeView = false;
        }
      });
    });
  }



  getClientList(option, clientId: number = 0, type: string = "") {
    var self = this;
    self.util.showProcessing("processing-spinner");
    try {
      this.isClientLoad = true;
      return new Promise((resolve, reject) => {
        this.http.doGet("client/pe", function(error: boolean, response: any) {
            self.util.hideProcessing("processing-spinner");
            if (error) {
                reject(false);
            } else {
            self.clientList = [];
            self.clientList = response.data.data;
            self.pageVariables.clientListBackUp = response.data.data;
            self.pageVariables.next_page_url = response.data.next_page_url;
            self.filteredClients = self.client_name.valueChanges.pipe(
                startWith(""),
                map(data =>
                data
                    ? self.filterClients(data, self.clientList)
                    : self.clientList.slice()
                )
            );
            if (option === "addClient") {
                self.selectedClient = self.pageVariables.clientOTF;
                self.client_id.setValue(self.pageVariables.client_id);
                self.client_name.setValue(self.pageVariables.client_name);
                //self.util.closePanel();
                //self.util.focusHiddenInput("hiddenInput");

                // self.getSelectedClient(
                // self.selectedClient,
                // { isUserInput: true },
                // option,
                // type
                // );

            }
            self.isClientLoad = false;
            resolve(response.data);
            }
        });
      });
    } catch (err) {
      this.global.addException(
        "Workflow Quotation Generation",
        "getClientList()",
        err
      );
    }
  }
  // ON THE FLY new function by Shubham :: Date : 23/05/2019
  getWorkLocationOnTheFly(
    option,
    clientId: number = 0,
    clientAddressId: number = 0,
    type: string = ""
  ) {
    if (option == "addLocation") {
      let selectedClient = this.selectedClient;
      this.getSelectedClient(
        selectedClient,
        { isUserInput: true },
        clientAddressId,
        option,
        type
      );
    }
  }

  filterClients(full_name: string, list: any[]) {
    return list.filter(option =>
      option.full_name
        .toLowerCase()
        .includes(full_name ? full_name.toLowerCase() : "")
    );
  }

  getSelectedClient(selClient: any, event, clientAddressId?, option?, type?) {
    if (event.isUserInput) {
      this.selectedClient = selClient;
      this.client_id.setValue(selClient.client_id);
      this.PEService.projectEstimatorData.payment_term = selClient.payment_term;
      this.workLocation = [];
      this.bilingLocation = [];
      const self = this;

      try {
        let clientObj: any = {};
        this.util.showProcessing("processing-spinner");
        return new Promise((resolve, reject) => {
        this.http.doGet(
          "client/address/" + selClient.client_id + "/work",
          function(error: boolean, response: any) {
            if (error) {
              console.log("error", response);
              reject(false);
            } else {
              self.workLocation = [];
              self.selectedClient.work_address = response.data;
              self.workLocation = response.data;
              if (response.data.length == 1 && self.isEdit != "edit") {
                self.location_id.setValue(
                  self.workLocation[0].client_address_id
                );
                self.location.setValue(self.workLocation[0].full_address);

                if (
                  self.workLocation[0].latitude &&
                  self.workLocation[0].longitude &&
                  self.workLocation[0].latitude != 0 &&
                  self.workLocation[0].longitude != 0 &&
                  self.workLocation[0].latitude != "" &&
                  self.workLocation[0].longitude != ""
                ) {
                  self.PEService.locationDetails.latitude = parseFloat(
                    self.workLocation[0].latitude
                  );
                  self.PEService.locationDetails.longitude = parseFloat(
                    self.workLocation[0].longitude
                  );
                }

                self.contact_name.setValue(self.workLocation[0].name);
                self.email_id.setValue(self.workLocation[0].email_id);
                self.phone_no.setValue(self.workLocation[0].phone_no);
                self.getSelectedLocation(self.workLocation[0], {
                  isUserInput: true
                });
              }
              self.filteredLocations = self.location.valueChanges.pipe(
                startWith(""),
                map(data =>
                  data
                    ? self.filterLocation(data, self.workLocation)
                    : self.workLocation.slice()
                )
              );
              if (option == "addLocation") {
                if (type == "workLocation") {
                  let selectedWorkLocation = self.workLocation.filter(
                    item => item.client_address_id == clientAddressId
                  )[0];

                  if (selectedWorkLocation) {
                    self.location_id.setValue(
                      selectedWorkLocation.client_address_id
                    );
                    self.location.setValue(selectedWorkLocation.full_address);
                    self.contact_name.setValue(selectedWorkLocation.name);
                    self.email_id.setValue(selectedWorkLocation.email_id);
                    self.phone_no.setValue(selectedWorkLocation.phone_no);
                    // self.util.closePanel();
                    self.util.focusHiddenInput("hiddenInput");
                  } else {
                    self.location_id.setValue(
                      self.PEService.projectEstimatorData.clientDetails
                        ? self.PEService.projectEstimatorData.clientDetails
                            .location_id
                        : ""
                    );
                    self.location.setValue(
                      self.PEService.projectEstimatorData.clientDetails
                        ? self.PEService.projectEstimatorData.clientDetails
                            .location
                        : ""
                    );
                    //self.util.closePanel();
                    self.util.focusHiddenInput("hiddenInput");
                  }

                  if (
                    selectedWorkLocation &&
                    selectedWorkLocation.latitude &&
                    selectedWorkLocation.longitude &&
                    selectedWorkLocation.latitude != 0 &&
                    selectedWorkLocation.longitude != 0 &&
                    selectedWorkLocation.latitude != "" &&
                    selectedWorkLocation.longitude != ""
                  ) {
                    // self.PEService.locationDetails.latitude = parseFloat(
                    //   selectedWorkLocation.latitude
                    // );
                    // self.PEService.locationDetails.longitude = parseFloat(
                    //   selectedWorkLocation.longitude
                    // );

                    self.getSelectedLocation(selectedWorkLocation, {
                        isUserInput: true
                    });
                  }
                }
              }
              resolve(response.data);  
            }
          }
        );
        this.http.doGet(
          "client/address/" + selClient.client_id + "/billing",
          function(error: boolean, response: any) {
            self.util.hideProcessing("processing-spinner");
            if (error) {
              console.log("error", response);
              reject(false);
            } else {
              self.bilingLocation = [];
              self.selectedClient.billing_address = response.data;
              self.bilingLocation = response.data;
              if (response.data.length == 1) {
                self.client_billing_location_id.setValue(
                  self.bilingLocation[0].client_address_id
                );
                self.client_billing_location.setValue(
                  self.bilingLocation[0].full_address
                );
              }
              self.filteredLocationsB = self.client_billing_location.valueChanges.pipe(
                startWith(""),
                map(data =>
                  data
                    ? self.filterLocation(data, self.bilingLocation)
                    : self.bilingLocation.slice()
                )
              );

              if (option == "addLocation") {
                if (type == "billLocation") {
                  let selectedBillingLocation = self.selectedClient.billing_address.filter(
                    item => item.client_address_id == clientAddressId
                  )[0];

                  if (selectedBillingLocation) {
                    self.client_billing_location_id.setValue(
                      selectedBillingLocation.client_address_id
                    );
                    self.client_billing_location.setValue(
                      selectedBillingLocation.full_address
                    );
                    //self.util.closePanel();
                    self.util.focusHiddenInput("hiddenInput");
                  } else {
                    self.client_billing_location_id.setValue(
                      self.PEService.projectEstimatorData.clientDetails
                        ? self.PEService.projectEstimatorData.clientDetails
                            .client_billing_location_id
                        : ""
                    );
                    self.client_billing_location.setValue(
                      self.PEService.projectEstimatorData.clientDetails
                        ? self.PEService.projectEstimatorData.clientDetails
                            .client_billing_location
                        : ""
                    );
                    //self.util.closePanel();
                    self.util.focusHiddenInput("hiddenInput");
                  }
                }
              }
              resolve(response.data);
            }
          }
        );
         });
      } catch (err) {
        this.global.addException(
          "Client details List",
          "getClientDetailsList()",
          err
        );
      }
    }
  }

  public validateClient(event: any) {
    try {
      let client = event.target.value;
      if (client == "") {
        this.client_id.setValue("");
        this.client_name.setValue("");
        return;
      }

      if (this.pageVariables.next_page_url === null) {
        let match = this.clientList.filter(
          item => item.client_name.toLowerCase() == client.toLowerCase()
        );
        if (match.length > 0) {
          this.client_id.setValue(match[0].client.client_id);
          this.client_name.setValue(match[0].client.full_name);
          this.getSelectedClient(match[0], { isUserInput: true });
        } else {
          this.client_id.setValue("");
        }
      } else if (client.length > 3) {
        let self = this;
        self.util.showProcessing("processing-spinner");
        this.http.doGet("client/pe?key=" + client, function(
          error: boolean,
          response: any
        ) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
          } else {
            self.clientList = [];
            self.clientList = response.data.data;
            self.filteredClients = self.client_name.valueChanges.pipe(
              startWith(""),
              map(data =>
                data
                  ? self.filterClients(data, self.clientList)
                  : self.clientList.slice()
              )
            );
          }
        });
      }
    } catch (err) {
      this.global.addException("Quotation Generation", "validateClient()", err);
    }
  }

  showAddClientPopup(): void {
    this.util.changeEvent(null);

    this.dialog.open(ProjectEstimatorDialog, { data: { action: "addClient" } });
  }

  showAddWorkLocationPopup(clientId, type): void {
    this.util.changeEvent(null);
    this.dialog.open(ProjectEstimatorDialog, {
      data: { action: "addWorkLocation", clientId: clientId, type: type }
    });
  }

  removeLocations() {
    this.workLocation = [];
    this.bilingLocation = [];
    this.clientList = this.pageVariables.clientListBackUp;
    this.location_id.setValue("");
    this.location.setValue("");
    this.client_billing_location_id.setValue("");
    this.client_billing_location.setValue("");
    this.contact_name.setValue("");
    this.email_id.setValue("");
    this.phone_no.setValue("");
    this.generateQuoteFm.get("billingLocationSameAsWork").setValue(false);
    this.filteredLocations.subscribe(() => []);
    this.filteredLocationsB.subscribe(() => []);
  }

  getSelectedLocation(selLocation: any, event) {
    if (event && event.isUserInput) {
      if (
        selLocation.latitude &&
        selLocation.longitude &&
        selLocation.latitude != 0 &&
        selLocation.longitude != 0 &&
        selLocation.latitude != "" &&
        selLocation.longitude != ""
      ) {
        this.PEService.locationDetails.latitude = parseFloat(
          selLocation.latitude
        );
        this.PEService.locationDetails.longitude = parseFloat(
          selLocation.longitude
        );
        this.showMap = true;
      }
      this.location_id.setValue(selLocation.client_address_id);
      this.location.setValue(selLocation.full_address);
      this.contact_name.setValue(selLocation.name);
      this.email_id.setValue(selLocation.email_id);
      this.phone_no.setValue(selLocation.phone_no);
    }
    if (this.showMap) {
      this.initMap();
    }
  }
  getSelectedLocationEdit(selLocation: any) {
    if (
      selLocation.latitude &&
      selLocation.longitude &&
      selLocation.latitude != 0 &&
      selLocation.longitude != 0 &&
      selLocation.latitude != "" &&
      selLocation.longitude != ""
    ) {
      this.PEService.locationDetails.latitude = parseFloat(
        selLocation.latitude
      );
      this.PEService.locationDetails.longitude = parseFloat(
        selLocation.longitude
      );
      this.showMap = true;
    }
    if (this.showMap) {
      this.initMap();
    }
  }
  public validateLocation(event: any) {
    try {
      let location = event.target.value;
      if (location == "") {
        this.location_id.setValue("");
        this.location.setValue("");
        return;
      }
      let match = this.selectedClient.address.filter(
        address => address.full_address.toLowerCase() == location.toLowerCase()
      );
      if (match.length > 0) {
        this.location_id.setValue(match[0].client_address_id);
        this.location.setValue(match[0].full_address);
      } else {
        this.location_id.setValue("");
      }
    } catch (err) {
      this.global.addException(
        "Quotation Generation",
        "validateLocation()",
        err
      );
    }
  }
  getSelectedLocationB(selLocation: any, event) {
    if (event && event.isUserInput) {
      this.client_billing_location_id.setValue(selLocation.client_address_id);
      this.client_billing_location.setValue(selLocation.full_address);
    }
  }
  public validateLocationB(event: any) {
    try {
      let location = event.target.value;
      if (location == "") {
        this.client_billing_location_id.setValue("");
        this.client_billing_location.setValue("");
        return;
      }
      let match = this.selectedClient.address.filter(
        address => address.full_address.toLowerCase() == location.toLowerCase()
      );
      if (match.length > 0) {
        this.client_billing_location_id.setValue(match[0].client_address_id);
        this.client_billing_location.setValue(match[0].full_address);
      } else {
        this.client_billing_location_id.setValue("");
      }
    } catch (err) {
      this.global.addException(
        "Quotation Generation",
        "validateLocation()",
        err
      );
    }
  }
  setMapType(mapTypeId: string) {
    gMap.setMapTypeId(google.maps.MapTypeId[mapTypeId.toUpperCase()]);
    this.mapTypeId = mapTypeId;
  }

  public createForm(option, val: any = {}) {
    this.generateQuoteFm = this.fb.group({
      client_name: new FormControl(option == "1" ? val.client_name : ""),
      client_id: new FormControl(option == "1" ? val.client_id : "", [
        Validators.required
      ]),
      location: new FormControl(option == "1" ? val.location : ""),
      location_id: new FormControl(option == "1" ? val.location_id : "", [
        Validators.required
      ]),
      client_billing_location: new FormControl(
        option == "1" ? val.client_billing_location : ""
      ),
      client_billing_location_id: new FormControl(
        option == "1" ? val.client_billing_location_id : "",
        [Validators.required]
      ),
      contact_name: new FormControl(option == "1" ? val.contact_name : ""),
      billingLocationSameAsWork: new FormControl(
        option == "1" ? val.billingLocationSameAsWork : false
      ),
      email_id: new FormControl(option == "1" ? val.email_id : ""),
      phone_no: new FormControl(option == "1" ? val.phone_no : ""),
      requirements: new FormControl(option == "1" ? val.requirements : "", [])
    });
    if (option == "1" && this.isEdit == "edit") {
      this.getSelectedClient(val, { isUserInput: true });
    }
    //this.clientBillingLocationChanged();
  }

  get client_name() {
    return this.generateQuoteFm.get("client_name");
  }
  get client_id() {
    return this.generateQuoteFm.get("client_id");
  }
  get location() {
    return this.generateQuoteFm.get("location");
  }
  get location_id() {
    return this.generateQuoteFm.get("location_id");
  }
  get client_billing_location() {
    return this.generateQuoteFm.get("client_billing_location");
  }
  get client_billing_location_id() {
    return this.generateQuoteFm.get("client_billing_location_id");
  }
  get contact_name() {
    return this.generateQuoteFm.get("contact_name");
  }
  get billingLocationSameAsWork() {
    return this.generateQuoteFm.get("billingLocationSameAsWork");
  }
  get email_id() {
    return this.generateQuoteFm.get("email_id");
  }
  get phone_no() {
    return this.generateQuoteFm.get("phone_no");
  }
  get requirements() {
    return this.generateQuoteFm.get("requirements");
  }

//   public clientBillingLocationChanged() {
//     this.generateQuoteFm
//       .get("billingLocationSameAsWork")
//       .valueChanges.subscribe(type => {
//         if (type) {
//           this.generateQuoteFm
//             .get("client_billing_location_id")
//             .setValidators([]);
//           this.generateQuoteFm
//             .get("client_billing_location_id")
//             .updateValueAndValidity();
//         } else {
//           this.generateQuoteFm
//             .get("client_billing_location_id")
//             .setValidators([Validators.required]);
//           this.generateQuoteFm
//             .get("client_billing_location_id")
//             .updateValueAndValidity();
//         }
//       });
//   }

  checkBoxCheck()
  {
      if (this.generateQuoteFm
      .get("billingLocationSameAsWork").value) {
          this.generateQuoteFm
            .get("client_billing_location_id")
            .setValidators([]);
          this.generateQuoteFm
            .get("client_billing_location_id")
            .updateValueAndValidity();
        } else {
          this.generateQuoteFm
            .get("client_billing_location_id")
            .setValidators([Validators.required]);
          this.generateQuoteFm
            .get("client_billing_location_id")
            .updateValueAndValidity();
        }
  }
  //Search filter function
  filterNames(name: string, list: any[]) {
    return list.filter(
      data => data.name.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  filterLocation(name: string, list: any[]) {
    return list.filter(
      data => data.full_address.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  next(form: FormGroup) {
    this.submitted = true;

    if (form.valid) {
      this.PEService.projectEstimatorData.clientDetails = form.value;
      this.PEService.projectEstimatorData.randomKey = this.randomKey;
      if (this.quatationTab == "services") {
        this.checkFormStatusEvent("ADD_SERVICES", {});
        if (this.PEService.getFormValidationStatus().servicesFm) {
          this.changeQuotTab("materials");
        }
        return;
      }

      if (this.quatationTab == "materials") {
        this.checkFormStatusEvent("ADD_MATERIALS", {});
        if (this.PEService.getFormValidationStatus().materialsFm) {
          this.changeQuotTab("schedule");
        }
        return;
      }
      if (this.quatationTab == "schedule") {
        this.checkFormStatusEvent("ADD_SCHEDULE", {});
        if (this.PEService.getFormValidationStatus().scheduleFm) {
          this.changeQuotTab("payment-schedule");
        }
        return;
      }
      if (this.quatationTab == "payment-schedule") {
        this.checkFormStatusEvent("ADD_PAYMENT_SCHEDULE", {});
        if (this.PEService.getFormValidationStatus().paymentScheduleFm) {
          this.changeQuotTab("images");
        }
        return;
      }

      if (this.quatationTab == "images") {
        this.checkValidation();
      }
    }
  }

  checkValidation(): void {
    this.checkFormStatusEvent("ADD_SERVICES", {});
    this.checkFormStatusEvent("ADD_MATERIALS", {});
    this.checkFormStatusEvent("ADD_SCHEDULE", {});
    this.checkFormStatusEvent("ADD_PAYMENT_SCHEDULE", {});
    if (!this.PEService.getFormValidationStatus().servicesFm) {
      this.quatationTab = "services";
      this.router.navigate(["/workflow/quote/csa/quotation/services"]);
      return;
    } else if (!this.PEService.getFormValidationStatus().materialsFm) {
      this.quatationTab = "materials";
      this.router.navigate(["/workflow/quote/csa/quotation/materials"]);
      return;
    } else if (!this.PEService.getFormValidationStatus().scheduleFm) {
      this.quatationTab = "schedule";
      this.router.navigate(["/workflow/quote/csa/quotation/schedule"]);
      return;
    } else if (!this.PEService.getFormValidationStatus().paymentScheduleFm) {
      this.quatationTab = "payment-schedule";
      this.router.navigate(["/workflow/quote/csa/quotation/payment-schedule"]);
      return;
    }

    if (this.checkValidData()) {
      return;
    }

    sessionStorage.setItem(
      "quotationDetails",
      JSON.stringify(this.PEService.projectEstimatorData)
    );
    sessionStorage.setItem(
      "quotationFormFlag",
      JSON.stringify(this.PEService.getFormValidationStatus())
    );
    if (
      this.PEService.getFormValidationStatus().paymentScheduleFm &&
      this.PEService.getFormValidationStatus().scheduleFm &&
      this.PEService.getFormValidationStatus().materialsFm &&
      this.PEService.getFormValidationStatus().servicesFm
    ) {
      this.router.navigate(["/workflow/quote/csa/quotation-review"]);
    } else {
      this.quatationTab = "schedule";
      this.router.navigate(["/workflow/quote/csa/quotation/schedule"]);
      return;
    }
  }

  checkValidData() {
    let quotationDetails = JSON.parse(
      JSON.stringify(this.PEService.projectEstimatorData)
    );
    if (quotationDetails.servicesDetails) {
      for (
        var i = 0;
        i < quotationDetails.servicesDetails.services.length;
        i++
      ) {
        if (
          quotationDetails.servicesDetails.services[i].service_definition ==
            "" ||
          (quotationDetails.servicesDetails.services[i].cost == "" &&
            quotationDetails.servicesDetails.services[i].cost != 0) ||
          quotationDetails.servicesDetails.services[i].quantity == "" ||
          quotationDetails.servicesDetails.services[i].quantity == 0
        ) {
          this.changeQuotTab("services");
          this.isError = true;
          this.errMsg =
            "Please enter valid data for all services OR remove service from list.";
          return true;
        }
      }
    }

    if (quotationDetails.materialsDetails) {
      for (
        var i = 0;
        i < quotationDetails.materialsDetails.materials.length;
        i++
      ) {
        if (
          quotationDetails.materialsDetails.materials[i].item_definition_name ==
            "" ||
          quotationDetails.materialsDetails.materials[i].item_def_id == "" ||
          (quotationDetails.materialsDetails.materials[i].cost == "" &&
            quotationDetails.materialsDetails.materials[i].cost != 0) ||
          quotationDetails.materialsDetails.materials[i].quantity == "" ||
          quotationDetails.materialsDetails.materials[i].quantity == 0
        ) {
          this.changeQuotTab("materials");
          this.isError = true;
          this.errMsg =
            "Please enter valid data for all materials OR remove material from list.";
          return true;
        }
      }
    }

    let sub_total: any = 0;
    let adjustment: any = 0;
    let shipping_handling: any = 0;
    if (quotationDetails.paymentScheduleDetails) {
      sub_total =
        quotationDetails.paymentScheduleDetails.sub_total &&
        quotationDetails.paymentScheduleDetails.sub_total != ""
          ? parseFloat(quotationDetails.paymentScheduleDetails.sub_total)
          : 0;
      adjustment =
        quotationDetails.paymentScheduleDetails.adjustment &&
        quotationDetails.paymentScheduleDetails.adjustment != ""
          ? parseFloat(quotationDetails.paymentScheduleDetails.adjustment)
          : 0;
      shipping_handling =
        quotationDetails.paymentScheduleDetails.shipping_handling &&
        quotationDetails.paymentScheduleDetails.shipping_handling != ""
          ? parseFloat(
              quotationDetails.paymentScheduleDetails.shipping_handling
            )
          : 0;
      if (
        adjustment < 0 &&
        sub_total + parseFloat(shipping_handling) < adjustment * -1
      ) {
        this.changeQuotTab("payment-schedule");
        return true;
      }
    }

    if (
      quotationDetails.paymentScheduleDetails &&
      quotationDetails.paymentScheduleDetails.date_items &&
      quotationDetails.paymentScheduleDetails.date_items.length > 0
    ) {
      for (
        let i = 0;
        i < quotationDetails.paymentScheduleDetails.date_items.length;
        i++
      ) {
        if (
          quotationDetails.paymentScheduleDetails.date_items[i].payment_date ==
            "" ||
          quotationDetails.paymentScheduleDetails.date_items[i].amount == ""
        ) {
          this.changeQuotTab("payment-schedule");
          this.isError = true;
          this.errMsg =
            "Please enter valid data for all payment schedule OR remove payment schedule from list.";
          return true;
        }
      }
    }
  }

  checkFormStatusEvent(action, data): void {
    this.util.changeEvent({
      source: "QUOTATION_GENERATION",
      action: action,
      data: {}
    });
  }

  changeQuotTab(tabName, checkValidation: boolean = true) {
    this.errMsg = "";
    this.isError = false;
    if (this.quatationTab == "services") {
      this.checkFormStatusEvent("ADD_SERVICES", {});
      if (
        checkValidation &&
        !this.PEService.getFormValidationStatus().servicesFm
      )
        return;
    }
    if (this.quatationTab == "materials") {
      this.checkFormStatusEvent("ADD_MATERIALS", {});
      if (
        checkValidation &&
        !this.PEService.getFormValidationStatus().materialsFm
      )
        return;
    }
    if (this.quatationTab == "schedule") {
      this.checkFormStatusEvent("ADD_SCHEDULE", {});
      if (
        checkValidation &&
        !this.PEService.getFormValidationStatus().scheduleFm
      )
        return;
    }
    if (this.quatationTab == "payment-schedule") {
      this.checkFormStatusEvent("ADD_PAYMENT_SCHEDULE", {});
      if (
        checkValidation &&
        !this.PEService.getFormValidationStatus().paymentScheduleFm
      )
        return;
    }
    this.quatationTab = tabName;
    this.router.navigate(["/workflow/quote/csa/quotation/" + tabName]);
  }

  saveAsDraft() {
    try {
      let self = this;
      let action;
      let responseData;
      self.errMsg = "";
      self.isError = false;
      self.submitted = true;
      if (self.generateQuoteFm.valid) {
        self.PEService.projectEstimatorData.clientDetails =
          self.generateQuoteFm.value;
        self.PEService.projectEstimatorData.randomKey = self.randomKey;
        action = self.PEService.projectEstimatorData.project_estimate_id
          ? "edit"
          : "add";
        if (this.quatationTab == "services") {
          this.checkFormStatusEvent("ADD_SERVICES", {});
          if (!this.PEService.getFormValidationStatus().servicesFm) return;
        }

        if (this.quatationTab == "materials") {
          this.checkFormStatusEvent("ADD_MATERIALS", {});
          if (!this.PEService.getFormValidationStatus().materialsFm) return;
        }
        if (this.quatationTab == "schedule") {
          this.checkFormStatusEvent("ADD_SCHEDULE", {});
          if (!this.PEService.getFormValidationStatus().scheduleFm) return;
        }
        if (this.quatationTab == "payment-schedule") {
          this.checkFormStatusEvent("ADD_PAYMENT_SCHEDULE", {});
          if (!this.PEService.getFormValidationStatus().paymentScheduleFm)
            return;
        }

        if (this.checkValidData()) {
          return;
        }

        sessionStorage.setItem(
          "quotationDetails",
          JSON.stringify(this.PEService.projectEstimatorData)
        );
        self.util.addSpinner("saveAsDraft", "Save");
        this.PEService.saveProjectEstimator(action, "", function(
          error: boolean,
          response: any
        ) {
          self.util.removeSpinner("saveAsDraft", "Save");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
          } else {
            sessionStorage.removeItem("quotationDetails");
            responseData = self.PEService.setResponseForPE(response.data);

            self.util.changeEvent({
              source: "PE_SCHEDULE_PAYMENT",
              action: "EDIT_PE_SCHEDULE_PAYMENT"
            });
            sessionStorage.setItem("quotationDetails", responseData);
            self.util.showDialog(DialogComponent, response.message);
            self.ngOnInit();
          }
        });
      }
    } catch (err) {
      this.global.addException("quotationGeneration", "saveAsDraft()", err);
    }
  }
  showSiteInspectionPopup() {
    let self = this;
    let action;
    let responseData;
    self.errMsg = "";
    self.isError = false;
    self.submitted = true;

    try {
      if (self.generateQuoteFm.valid) {
        self.PEService.projectEstimatorData.clientDetails =
          self.generateQuoteFm.value;
        self.PEService.projectEstimatorData.randomKey = self.randomKey;
        action = self.PEService.projectEstimatorData.project_estimate_id
          ? "edit"
          : "add";
        if (this.quatationTab == "services") {
          this.checkFormStatusEvent("ADD_SERVICES", {});
          if (!this.PEService.getFormValidationStatus().servicesFm) return;
        }

        if (this.quatationTab == "materials") {
          this.checkFormStatusEvent("ADD_MATERIALS", {});
          if (!this.PEService.getFormValidationStatus().materialsFm) return;
        }
        if (this.quatationTab == "schedule") {
          this.checkFormStatusEvent("ADD_SCHEDULE", {});
          if (!this.PEService.getFormValidationStatus().scheduleFm) return;
        }
        if (this.quatationTab == "payment-schedule") {
          this.checkFormStatusEvent("ADD_PAYMENT_SCHEDULE", {});
          if (!this.PEService.getFormValidationStatus().paymentScheduleFm)
            return;
        }

        sessionStorage.setItem(
          "quotationDetails",
          JSON.stringify(this.PEService.projectEstimatorData)
        );
        self.util.showProcessing("processing-spinner");
        this.PEService.saveProjectEstimator(action, "", function(
          error: boolean,
          response: any
        ) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
          } else {
            sessionStorage.removeItem("quotationDetails");
            responseData = self.PEService.setResponseForPE(response.data);

            self.util.changeEvent({
              source: "PE_SCHEDULE_PAYMENT",
              action: "EDIT_PE_SCHEDULE_PAYMENT"
            });
            sessionStorage.setItem("quotationDetails", responseData);
            self.dialog.open(ProjectEstimatorDialog, {
              data: { action: "siteInspection" }
            });
          }
        });
      }
    } catch (err) {
      this.global.addException("quotationGeneration", "saveAsDraft()", err);
    }
  }

  showSaveForFollowUpPopup() {
    let self = this;
    let action;
    let responseData;
    self.errMsg = "";
    self.isError = false;
    self.submitted = true;

    try {
      if (self.generateQuoteFm.valid) {
        self.PEService.projectEstimatorData.clientDetails =
          self.generateQuoteFm.value;
        self.PEService.projectEstimatorData.randomKey = self.randomKey;

        action = self.PEService.projectEstimatorData.project_estimate_id
          ? "edit"
          : "add";
        if (this.quatationTab == "services") {
          this.checkFormStatusEvent("ADD_SERVICES", {});
          if (!this.PEService.getFormValidationStatus().servicesFm) return;
        }

        if (this.quatationTab == "materials") {
          this.checkFormStatusEvent("ADD_MATERIALS", {});
          if (!this.PEService.getFormValidationStatus().materialsFm) return;
        }
        if (this.quatationTab == "schedule") {
          this.checkFormStatusEvent("ADD_SCHEDULE", {});
          if (!this.PEService.getFormValidationStatus().scheduleFm) return;
        }
        if (this.quatationTab == "payment-schedule") {
          this.checkFormStatusEvent("ADD_PAYMENT_SCHEDULE", {});
          if (!this.PEService.getFormValidationStatus().paymentScheduleFm)
            return;
        }

        sessionStorage.setItem(
          "quotationDetails",
          JSON.stringify(this.PEService.projectEstimatorData)
        );
        self.util.showProcessing("processing-spinner");
        this.PEService.saveProjectEstimator(action, "", function(
          error: boolean,
          response: any
        ) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
          } else {
            sessionStorage.removeItem("quotationDetails");
            responseData = self.PEService.setResponseForPE(response.data);
            self.util.changeEvent({
              source: "PE_SCHEDULE_PAYMENT",
              action: "EDIT_PE_SCHEDULE_PAYMENT"
            });
            sessionStorage.setItem("quotationDetails", responseData);
            self.dialog.open(ProjectEstimatorDialog, {
              data: { action: "saveForFollowUp" }
            });
          }
        });
      }
    } catch (err) {
      this.global.addException("quotationGeneration", "saveAsDraft()", err);
    }
  }
  captureMap() {
    let self = this;
    this.util.addSpinner("capture_btn", "Capture");

    let client_name = this.generateQuoteFm.get("client_name").value;
    htmlToImage
      .toJpeg(document.getElementById("map-wrapper2"), {
        quality: 0.95,
        height: 400,
        width: 700
      })
      .then(function(dataUrl) {
        self.util.removeSpinner("capture_btn", "Capture");

        var link = document.createElement("a");
        link.download = client_name + ".jpg";
        link.href = dataUrl;
        link.click();
      });
  }
}
