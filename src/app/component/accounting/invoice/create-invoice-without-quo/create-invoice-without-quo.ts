import { ProjectEstimatorDialog } from './../../../workflow/project-estimator/project-estimator-dialog.component';
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatAutocompleteTrigger } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { GlobalService } from '../../../../shared/service/global.service';
import { HttpService } from '../../../../shared/service/http.service';
import { UtilService } from '../../../../shared/service/util.service';
import { ConstantsService } from '../../../../shared/service/constants.service';
import { 
    map as _map,
    each as _each,
    isNull as _isNull,
    isUndefined as _isUndefined,
    every as _every,
    values as _values,
    has as _has,
    isEmpty as _isEmpty,
    first as _first,
    pluck as _pluck
} from 'underscore';
declare var jQuery: any;
declare var $: any;


export interface DropdownListInterface {
    service_definition_id?  : any,
    item_def_id?            : any,
    name                    : any,
    type?                   : any
}

export interface State {
  flag: string;
  name: string;
  population: string;
}

@Component({
    selector: 'app-create-invoice-without-quo',
    templateUrl: './create-invoice-without-quo.html',
    styleUrls: ['./create-invoice-without-quo.css']
})
export class CreateInvoiceWithoutQuoComponent implements OnInit, AfterViewInit {
    
    invoiceForm:FormGroup;
    quotationDetails:any = [];
    originalDropdownListContainer  = [];
    dropdownListContainer  = [];
    public pageVariables:any = {'next_page_url': null, 'path': '', 'per_page': 0, 'prev_page_url': null, 'total': 0, 'clientListBackUp' : [], 'client_id': '', 'client_name' : '', 'clientOTF' : {}};
    clients = [];
    workLocations: any[] = [];
    selectedClient = [];
    bilingLocations: any[] = [];
    filteredClients: Observable<any[]>;
    filteredWorkLocations: Observable<any[]>;
    filteredBillingLocations: Observable<any[]>;
    filteredOptions: Observable<[]>;
    isLoaded:boolean     = false;
    submitted:boolean    = false;
    pageData = {};
    isClientsRequestOnGoing:boolean = false;
    isWorkLocationRequestOnGoing:boolean = false;
    isBillAddressRequestOnGoing:boolean = false;

    @ViewChild('clientAutoCompleteInput', { read: MatAutocompleteTrigger }) clientAutoComplete: MatAutocompleteTrigger;

    @ViewChild('workAddressAutoCompleteInput', { read: MatAutocompleteTrigger }) workAddressAutoComplete: MatAutocompleteTrigger;

    @ViewChild('billingAddressAutoCompleteInput', { read: MatAutocompleteTrigger }) billingAddressAutoCompleteInput: MatAutocompleteTrigger;

    @ViewChild('itemAutoCompleteInput', { read: MatAutocompleteTrigger }) itemAutoCompleteInput: MatAutocompleteTrigger;
    
    
    constructor(
        private fb: FormBuilder,
        public dialog: MatDialog,
        public util:UtilService,
        private http:HttpService,
        private constant:ConstantsService,
		private global:GlobalService,
        public router: Router,
        private route: ActivatedRoute,
    ) {
    }

    /**
     * Create The Form Controls
     * @return void
     */
    setupFormControls() {

        this.invoiceForm = this.fb.group({
            "is_edit"                       : new FormControl(false),
            "invoice_id"                    : new FormControl(""),
            "po_nos"                        : new FormControl(""),
            "invoice_midsection"            : new FormControl(""),
            "client_id"                     : new FormControl("", [ Validators.required ]),
            "client_email"                  : new FormControl("", [ Validators.required, 
                                                        Validators.pattern(this.constant.EMAIL_PATTERN) 
                                            ]),
            "client_name"                   : new FormControl("", [ Validators.required ]),
            "client_phone_no"               : new FormControl("", [ Validators.required ]),
            "client_contact_name"           : new FormControl("", [ Validators.required ]),
            "client_billing_location_id"    : new FormControl("", [ Validators.required ]),
            "client_billing_location"       : new FormControl("", [ Validators.required ]),
            "billing_location_same_as_work" : new FormControl(false),
            "client_work_location"          : new FormControl("", [ Validators.required ]),
            "client_work_location_id"       : new FormControl("", [ Validators.required ]),
            "backup_billing_location_id"    : new FormControl(''),
            "backup_billing_location"       : new FormControl(''),
            "subtotal"                      : new FormControl(0.00,[
                                                Validators.required,
                                                Validators.min(0) 
                                            ]),
            "shipping_and_handling"         : new FormControl(0.00, [Validators.pattern(this.constant.AMOUNT_PATTERN)]),
            "adjustment"                    : new FormControl(0.00, [Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)]),
            "taxes"                         : new FormControl(0.00, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN), Validators.min(0), Validators.max(100)]),
            "tax_amount"                    : new FormControl(0.00),
            "total_payment_amount"          : new FormControl(0.00,[
                                                Validators.required,
                                                Validators.min(0) 
                                            ]),
            "due_date"                      : new FormControl("", [ Validators.required ]),
            "notes"                         : new FormControl(""),
            "services"                      : this.fb.array([]),
            "product_materials"             : this.fb.array([]),
            "additional_items"              : this.fb.array([])
        });
    }

    /**
     * Ge the defualt tax rate
     * @return void
     */
    getSettings() {

        let settings = JSON.parse(atob(localStorage.getItem("USER"))).settings;

        for (let index = 0; index < settings.length; index++) {

            let sKey = settings[index].setting_key;
          
            if (sKey === "tax_rate") {
                this.invoiceForm.get('taxes').setValue(
                    (settings[index]).setting_value
                );
            }

            if (sKey === "invoice_midsection") {
                this.invoiceForm.get('invoice_midsection').setValue(
                    (settings[index]).setting_value
                );
            }
        }
    }

    /**
     * Patch update the form controls with value
     * @param data 
     * @return void
     */
    updateFormModel(data) { 
        return this.invoiceForm.patchValue(data);
    }

    /**
     * Convert form control to Array
     * @param controlKey 
     * @return void
     */
    hasDataOf(controlKey: any) 
    {   
        let data = (<FormArray>this.invoiceForm.get(controlKey)) as FormArray;

        return _isNull(data) ? false : (data.length > 0) ? true : false ;
    }

    /**
     * Has Control Value
     * @param controlKey 
     * @return void
     */
    hasControlValue(controlKey: any) 
    {   
        let data = this.invoiceForm.get(controlKey).value;
    
        return _isEmpty(data) == true ? false : true ;
    }

    /**
     * Get the list
     * @param option 
     * @param clientId 
     * @param type 
     */
    getClients(option = 'INIT', clientId: number = 0, type: string = "") {
        
        this.isClientsRequestOnGoing = true;

        this.util.showProcessing("processing-spinner");
        
        try {
            
            return new Promise((resolve, reject) => {

                this.http.doGet("client/pe", (error: boolean, response: any) => {

                    this.util.hideProcessing("processing-spinner");

                    if (error) {

                        this.isClientsRequestOnGoing = false;

                        this.util.showAlert(response.message);

                        reject({});

                    } else {

                        let requestData = response.data.data; 
                        
                        this.clients = requestData;

                        this.pageVariables.clientListBackUp = requestData;

                        this.pageVariables.next_page_url = response.data.next_page_url;

                        if (option === "addClient") {

                            this.selectedClient = this.pageVariables.clientOTF;
                            
                            this.client_id.setValue(this.selectedClient['client_id']);
                            this.client_name.setValue(this.selectedClient['client_name']);
                            this.due_date.setValue(this.util.getTimeZoneDate(this.selectedClient['due_date']));

                            this.closeClientAutocomplete();
   
                        } else if (option == "addLocation") {

                            let selectedClient = response.data.filter(item => item.client_id == clientId)[0];

                            this.client_id.setValue(selectedClient.client_id);

                            this.getSelectedClient(selectedClient, { isUserInput : true }, selectedClient.client_address_id, option, type);

                        } else if(option == "INIT" && (this.client_id.value)) {
                 
                            if (_isUndefined(this.client_id.value)) {

                                setTimeout( () => {
                       
                                    this.getSelectedClient({
                                        'client_id'  : this.client_id.value
                                    }, { isUserInput : true, 
                                        editInit : true }, '', option, type);

                                }, 100);
                                
                            } else if(!_isUndefined(this.client_id.value)) {

                                this.getSelectedClient({
                                    'client_id' : this.client_id.value
                                }, { isUserInput : true, 
                                    editInit : true }, '', option, type);

                            }

                            
                        }
                        
                        this.isClientsRequestOnGoing = false;

                        resolve(response.data);
                    
                    }
                    
                });
            });

        } catch (err) {

            this.global.addException(
                "Creat Invoice Without Quotetion",
                "getClients()", 
                err
            );
        }
    }

    /**
     * Close Client Autocomplete
     * @return void
     */
    closeClientAutocomplete() {

        if (!_isUndefined(this.clientAutoComplete)) {
            this.clientAutoComplete.closePanel();
        }
    }

    /**
     * Close Work Autocomplete
     * @return void
     */
    closeWorkAddressAutoComplete() {

        if (!_isUndefined(this.workAddressAutoComplete)) {
            this.workAddressAutoComplete.closePanel();
        }
        
    }

    /**
     * Close Billing Autocomplete
     * @return void
     */
    closeBillingAddressAutoCompleteInput() {
        
        if (!_isUndefined(this.billingAddressAutoCompleteInput)) {
            this.billingAddressAutoCompleteInput.closePanel();
        }
    }

    /**
     * Open Item Dropdown
     * @return void
     */
    openItemAutoCompleteInput() {
        this.itemAutoCompleteInput.openPanel();
    }

    /**
     * Open Item Dropdown
     * @return void
     */
    closeItemAutoCompleteInput() {
        this.itemAutoCompleteInput.closePanel();
    }

    /**
     * Open Add New Client Popup
     * @return void
     */
    showAddClientPopup(): void {

        this.util.changeEvent(null);

        this.dialog.open(ProjectEstimatorDialog, { data: { 
            action      : "addClient",
            requestFrom : "CREATE_INVOICE_WITHOUT_QUO" 
        } });
    }

    /**
     * Show Popup dialog on 
     * @param clientId 
     * @param type 
     */
    showAddWorkLocationPopup(clientId, type): void {

        this.dialog.open(ProjectEstimatorDialog, {
            data: { 
                action: 'addWorkLocation', 
                requestFrom : "CREATE_INVOICE_WITHOUT_QUO", 
                clientId: clientId, 
                type: type 
            }
        });
    }

    /**
     * On the fly add Location
     * @param option 
     * @param clientId 
     * @param type 
     * @return void
     */
    getWorkLocationOnTheFly(option, clientId: number = 0, clientAddressId: number = 0, 
    type: string = "") {

        if (option == "addLocation") {

            if (type == "workLocation") {

                this.getSelectedClientWorkAddress(
                    this.client_id.value,
                    { isUserInput: true },
                    clientAddressId,
                    option,
                    type
                );
                
            } else if (type == "billLocation") {

                this.getSelectedClientBillingAddress(
                    this.client_id.value,
                    { isUserInput: true },
                    clientAddressId,
                    option,
                    type
                );
            }
        }
    }
    
    /**
     * Get the client locations
     * @param selLocation 
     * @param event 
     * @return void
     */

    getSelectedLocation(selLocation: any, event) {

        if (event && event.isUserInput) {
            
            this.client_work_location_id.setValue(selLocation.client_address_id);
            this.client_work_location.setValue(selLocation.full_address);
            this.client_contact_name.setValue(selLocation.name);
            this.client_email.setValue(selLocation.email_id);
            this.client_phone_no.setValue(selLocation.phone_no);
        }
    }

    dropdownFormat(data = []) {

        if (data.length > 0) {

            _map(data, (item) => {
                
                if (_has(item, 'service_definition') && item.service_definition) {
                    item['name'] = item.service_definition;
                } else if(_has(item, 'item_definition_name') && item.item_definition_name) {
                    item['name'] = item.item_definition_name;
                }

                return item;

            });
        }

        return data;
    }

    /**
     * On Select Client Name 
     * @param selClient 
     * @param event 
     * @param option 
     * @param type 
     * @return void
     */
    getSelectedClient(selClient: any, event, clientAddressId?, option?, type?) {
  
        if (event.isUserInput) {

            this.util.showProcessing("processing-spinner");

            try {

                this.selectedClient = selClient;
                
                this.client_id.setValue(selClient.client_id);
                
                // Set due date if present
                if (_has(selClient, 'due_date') && selClient.due_date) {
                    this.invoiceForm.get('due_date').setValue(this.util.getTimeZoneDate(selClient.due_date));
                }
                
                // Get the work Address Data
                this.getSelectedClientWorkAddress(selClient.client_id, event, clientAddressId, option, type);

                // Get the Billing Address Data
                this.getSelectedClientBillingAddress(selClient.client_id, event, clientAddressId, option, type);
                
            } catch (err) {

                this.util.hideProcessing("processing-spinner");

                this.global.addException("Client details List", "getSelectedClient()", err);
            }
        }
    }

   
    /**
     * Get Work Address Of client
     * @return void
     */
    getSelectedClientWorkAddress(client_id: number, event, clientAddressId?, option?, type?) 
    {   
        if (!client_id) {
            return;
        }
    
        if (event.isUserInput) {
            
            this.isWorkLocationRequestOnGoing = true;

            try {

                this.util.showProcessing("processing-spinner");

                this.http.doGet(`client/address/${client_id}/work`, (error: boolean, response: any) => {

                    if (error) {
                        this.util.hideProcessing("processing-spinner");
                        this.isWorkLocationRequestOnGoing = false;
                        this.util.showAlert(response.message);
                    } else {   

                        this.util.hideProcessing("processing-spinner");

                        let requestData = response.data;
                        
                        this.workLocations = requestData;

                        if (requestData.length == 1) {
                            
                            let wLocation = requestData[0];

                            if (!_has(event, 'editInit')) {
                                this.client_work_location_id.setValue(wLocation['client_address_id']);
                                this.client_work_location.setValue(wLocation['full_address']);
                                this.client_email.setValue(wLocation['email_id']);
                                this.client_phone_no.setValue(wLocation['phone_no']);
                                this.client_contact_name.setValue(wLocation['name']);
                            }

                        }  

                        this.filteredWorkLocations = this.client_work_location.valueChanges.pipe(
                            startWith(""),
                            map(data => {
                               
                                return data
                                ? this._filterLocation(data, this.workLocations)
                                : this.workLocations.slice()
                            }
                            
                            )
                        );

                        // When on the fly added
                        if (option == "addLocation") {

                            if (type == "workLocation") {

                                let selectedWorkLocation = this.workLocations.filter(
                                    item => item.client_address_id == clientAddressId
                                )[0];

                                if (selectedWorkLocation) {

                                    this.client_work_location_id.setValue(selectedWorkLocation['client_address_id']);
                                    this.client_work_location.setValue(selectedWorkLocation['full_address']);
                                    this.client_email.setValue(selectedWorkLocation['email_id']);
                                    this.client_phone_no.setValue(selectedWorkLocation['phone_no']);
                                    this.client_contact_name.setValue(selectedWorkLocation['name']);
                                    this.closeWorkAddressAutoComplete();
                                }
                            }
                        }

                        this.isWorkLocationRequestOnGoing = false;

                    }

                });

                
            } catch (err) {
                this.global.addException("Client Work Address details List","getSelectedClientWorkAddress()", err);
            }
        }
    }

    /**
     * Get Work Address Of client
     * @return void
     */
    getSelectedClientBillingAddress(client_id: number, event, clientAddressId?, option?, type?) 
    {   
        if (!client_id) {
            return;
        }

        if (event.isUserInput) {
            
            this.isBillAddressRequestOnGoing = true;

            this.util.showProcessing("processing-spinner");

            try {

                this.http.doGet(`client/address/${client_id}/billing`,
                    (error: boolean, response: any) => {

                    if (error) {
                        this.util.hideProcessing("processing-spinner");
                        this.isBillAddressRequestOnGoing = false;
                        this.util.showAlert(response.message);
                    } else {
                        this.util.hideProcessing("processing-spinner");
                        let requestDataForB = response.data;

                        this.bilingLocations = requestDataForB;
                        
                        if (requestDataForB.length == 1) {

                            let bLocation = requestDataForB[0];
                            this.client_billing_location_id.setValue(bLocation.client_address_id);
                            this.client_billing_location.setValue(bLocation.full_address);
                            this.backup_billing_location_id.setValue(bLocation.client_address_id);
                            this.backup_billing_location.setValue(bLocation.full_address);
                        }

                        this.filteredBillingLocations = this.client_billing_location.valueChanges.pipe(
                            startWith(""),
                            map(data => {
                                return data
                                ? this._filterLocation(data, this.bilingLocations)
                                : this.bilingLocations.slice()
                            })
                        );

                        // When on the fly added
                        if (option == "addLocation") {

                            if (type == "billLocation") {

                                let selectedBillingLocation = this.bilingLocations.filter(
                                    item => item.client_address_id == clientAddressId
                                )[0];

                                if (selectedBillingLocation) {

                                    this.client_billing_location_id.setValue(selectedBillingLocation.client_address_id);
                                    this.client_billing_location.setValue(selectedBillingLocation.full_address);

                                    this.backup_billing_location_id.setValue(selectedBillingLocation.client_address_id);
                                    this.backup_billing_location.setValue(selectedBillingLocation.full_address);

                                    this.closeBillingAddressAutoCompleteInput();
                                }
                            }
                        }

                        this.isBillAddressRequestOnGoing = false;
                    }
                    
                });

                
            } catch (err) {
                this.global.addException("Client details List", "getSelectedClientBillingAddress()", err);
            }
        }
    }

    /**
     * Same As Work Location
     */
    sameAsWork(value) {

        if (value) {
            this.client_billing_location_id.setValue(this.client_work_location_id.value);
            this.client_billing_location.setValue(this.client_work_location.value);
        } else {
            this.client_billing_location_id.setValue(this.backup_billing_location_id.value);
            this.client_billing_location.setValue(this.backup_billing_location.value);
        }
    }

    /**
     * Validate the client
     * @param event 
     * @return void
     */
    validateClient(event: any) {

        try {

            let client = event.target.value;

            if (client == "") {

                this.client_id.setValue("");
                this.client_name.setValue("");

                return;
            }

            if (this.pageVariables.next_page_url === null) {

                let match = this.clients.filter(
                    item => item.client_name.toLowerCase() == client.toLowerCase()
                );

                if (match.length > 0) {

                    this.client_id.setValue(match[0].client.client_id);

                    this.client_name.setValue(match[0].client.full_name);

                    this.getSelectedClient(match[0], { isUserInput: true });

                } else {
                    this.client_id.setValue("");
                }

            } else if(client.length > 3){

                this.util.showProcessing("processing-spinner");

                this.http.doGet(`client/pe?key=${client}`, (error: boolean, response: any) => {

                    this.util.hideProcessing("processing-spinner");

                    if (error) {
                        this.util.showAlert(response.message);
                    } else {

                        this.clients = [];
                        this.clients = response.data.data;

                    }
                });
            }

        } catch (err) {

            this.global.addException("Create New Invoice", "validateClient()", err);
        }
    }

    /**
     * Remove Locations
     * @return coid
     */
    removeLocations() {

        this.selectedClient = [];
        this.workLocations = [];
        this.bilingLocations = [];
        this.clients = this.pageVariables.clientListBackUp;
        this.client_work_location_id.setValue("");
        this.client_work_location.setValue("");
        this.backup_billing_location_id.setValue("");
        this.backup_billing_location.setValue("");

        this.client_billing_location_id.setValue("");
        this.client_billing_location.setValue("");
        this.client_contact_name.setValue("");
        this.client_name.setValue("");
        this.client_email.setValue("");
        this.client_phone_no.setValue("");
        this.billing_location_same_as_work.setValue(false);

        this.filteredWorkLocations.subscribe(() =>[]);
        this.filteredBillingLocations.subscribe(() =>[]);
    }

    /**
     * Remove Locations
     * @return coid
     */
    removeWorkLocations() {

        this.client_work_location_id.setValue("");
        this.client_work_location.setValue("");

        if (this.billing_location_same_as_work.value) {

            this.client_billing_location_id.setValue("");
            this.client_billing_location.setValue("");
            this.backup_billing_location_id.setValue("");
            this.backup_billing_location.setValue("");
        }
    }

    /**
     * Remove Locations
     * @return coid
     */
    removeBillingLocations() {
        this.client_billing_location_id.setValue("");
        this.client_billing_location.setValue("");
        this.backup_billing_location_id.setValue("");
        this.backup_billing_location.setValue("");
    }

    /**
     *  Validate work location
     * @param event
     * @return void
     */
    public validateWorkLocation(event: any) {

        try {

        let location = event.target.value;

            if (location == "") {
                this.client_work_location_id.setValue("");
                this.client_work_location.setValue("");
                return;
            }

            let match = this.workLocations.filter(
                address =>
                address.full_address.toLowerCase() == location.toLowerCase()
            );

            if (match.length > 0) {
                this.client_work_location_id.setValue(match[0].client_address_id);
                this.client_work_location.setValue(match[0].full_address);
            } else {
                this.client_work_location_id.setValue("");
            }

        } catch (err) {

            this.global.addException(
                "Quotation Generation",
                "validateLocation()",
                err
            );
        }
    }

    /**
     * On select drop down vlaue 
     * @param selLocation 
     * @param event 
     * @return void
     */
    getSelectedLocationB(selLocation: any, event) {
        
        if (event && event.isUserInput) {
            this.client_billing_location.setValue(selLocation.full_address);
            this.backup_billing_location.setValue(selLocation.full_address);
            this.client_billing_location_id.setValue(selLocation.client_address_id);
            this.backup_billing_location_id.setValue(selLocation.client_address_id);
        }
    }

    /**
     * Validate Billing Address
     * @param event 
     * @return void
     */
    public validateBillingLocation(event: any) {
        
        try {

            let location = event.target.value;

            if (location == "") {

                this.client_billing_location_id.setValue("");
                this.client_billing_location.setValue("");
                return;
            }

            let match = this.bilingLocations.filter(
                address => 
                {
                    return address.full_address.toLowerCase() == location.toLowerCase()
                }
                
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


    /**
     * Request for Quotession details
     * @param quotessionId 
     * @return void
     */
    fetchMaterials() {

        this.util.showProcessing('processing-spinner');

        try {

            this.http.doGet(`financials/invoices/services-products-materials`, (error: boolean, response: any) => {

                this.util.hideProcessing('processing-spinner');

                if (error) {
                    this.util.showAlert(response.message);
                } else {  
                    
                    this.originalDropdownListContainer = this.dropdownFormat(response.data);
                    this.dropdownListContainer = this.originalDropdownListContainer;

                }

            });

        } catch(err){

            this.global.addException('Create New Invoice','fetchMaterials()', err);
        }
    }

    /**
     * Set Control Values
     * @return void
     */
    workOrderControls(workOrders = []) {
          
        if (workOrders.length > 0) {
         
            _each(workOrders, (item) => {
                
                this.getWorkOrders.value.push(item);
    
            });
        }
        
        return true;
    }

    /**
     * Set Control Values
     * @return void
     */
    serviceFormControls(item:any = {}) {

        if (_has(item, 'ad_hoc_service') && !_isEmpty(item['ad_hoc_service'])) {
            
            return this.fb.group(
                {   
                    invoice_service_id      : new FormControl(""), 
                    service_definition      : new FormControl(""),
                    cost                    : new FormControl("", [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
                    quantity                : new FormControl(1.00, [
                                                    Validators.required,
                                                    // Validators.max(item.remaining_quantity),
                                                    Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)
                                                ]),
                    total_amount            : new FormControl("", [ Validators.required ]),
                    remaining_quantity      : new FormControl(""),
                    ad_hoc_service          : new FormControl(""),
                    is_hoc_service          : new FormControl(false),
                }
            );

        } else {

            return this.fb.group(
                {   
                    invoice_service_id      : new FormControl(""),
                    service_definition_id   : new FormControl(""),
                    service_definition      : new FormControl(""),
                    cost                    : new FormControl("", [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
                    details             : new FormControl(""),
                    quantity                : new FormControl(1.00, [
                                                    Validators.required,
                                                    Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)
                                                ]),
                    total_amount            : new FormControl("", [ Validators.required ]),
                    remaining_quantity      : new FormControl("")
                }
            );
        }
    }

    /**
     * Setup service array controls
     * @return  void
     */ 
    createServiceControls(services = []) {

        if (services.length > 0) {

            _each(services, (item) => {

                this.getServices.push(
                    this.serviceFormControls(item)
                );
    
            });
        }

        return true;
    }

    /**
     * Setup service array controls
     * @return  void
     */ 
    createPaymentScedulesControls(schedules = []) {
      
        if (schedules.length > 0) {

            _each(schedules, (item) => {

                this.getPaymentSchedules.push(
                    this.fb.group({
                        payment_date  : new FormControl(""),
                        amount : new FormControl(""),
                    })
                );
    
            });
        }
        
        return true;
    }

    /**
     * Setup service array controls
     * @return  void
     */ 
    setProductAndMaterialControls(materials = []) {

        if (materials.length > 0) {

            _each(materials, (item) => {

                this.getProductMaterials.push(
                    this.materialFormControls(item)
                );
    
            });
        }

        return true;
    }

    /**
     * Setup service array controls
     * @return  void
     */ 
    setAdditionalControls(items = []) {

        if (items.length > 0) {

            _each(items, (item) => {

                this.getAdditionalItems.push(
                    this.itemFormControls()
                );
    
            });
        }

        return true;
    }

    /**
     * Set Control Values
     * @return void
     */
    materialFormControls(item:any = {}) {

        return this.fb.group(
            {   
                invoice_product_material_id : new FormControl(""),
                type            : new FormControl(""),
                item_def_id     : new FormControl(""),
                item_definition_name : new FormControl(""),
                details          : new FormControl(""),
                uom             : new FormControl(""),
                cost            : new FormControl(0.00, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)] ),
                quantity        : new FormControl(1.00, [
                                                Validators.required,
                                                // Validators.max(item.remaining_quantity),
                                                Validators.pattern(this.constant.AMOUNT_PATTERN)
                                            ]),
                remaining_quantity  : new FormControl(0.00),
                total_amount        : new FormControl(0.00, [ Validators.required ])
            }
        );
    }


    /**
     * Set Control Values
     * @return void
     */
    itemFormControls() {
    
        return this.fb.group(
            {   
                item_def_id     : new FormControl(""),
                service_definition_id : new FormControl(""),
                type            : new FormControl(""),
                name            : new FormControl("", [ Validators.required ]),
                cost            : new FormControl(0.00, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)] ),
                quantity        : new FormControl(1.00, [
                                                Validators.required,
                                                Validators.pattern(this.constant.AMOUNT_PATTERN)
                                            ]),
                total_amount    : new FormControl(0.00, [ Validators.required ]),
                ad_hoc_service  : new FormControl(""),
                is_hoc_service  : new FormControl(false),
                dropdownList    : new FormControl( new Observable<string[]>() ),
                details     : new FormControl(""),
                uom             : new FormControl("")
            }
        );
    }


    /**
     * Services Getter
     */
    get getServices() : FormArray {
        return (<FormArray>this.invoiceForm.get('services')) as FormArray;
    }

    /**
     * Material Getter
     */
    get getProductMaterials() : FormArray {
        return (<FormArray>this.invoiceForm.get('product_materials')) as FormArray;
    }

    /**
     * Material Getter
     */
    get getAdditionalItems() : FormArray {
        return (<FormArray>this.invoiceForm.get('additional_items')) as FormArray;
    }

    /**
     * Material Getter
     */
    get getWorkOrders() : FormArray {
        return (<FormArray>this.invoiceForm.get('work_orders')) as FormArray;
    }

    /**
     * Payment Scedule Getter
     */
    get getPaymentSchedules() : FormArray {
        return (<FormArray>this.invoiceForm.get('payment_schedules')) as FormArray;
    }

    /**
     * Shipping And Handlling Getter
     * @return number
     */
    get shippingAndHandllingAmount() {
        return parseFloat(this.invoiceForm.get('shipping_and_handling').value);
    }

    /**
     * Adjustment Getter
     * @return number
     */
    get adjustmentAmount() {
        return parseFloat(this.invoiceForm.get('adjustment').value);
    }

    /**
     * Adjustment Getter
     * @return number
     */
    get taxPercentage() {

        let value = this.invoiceForm.get('taxes').value;

        return parseFloat(isNaN(value) ? 0.00 : value);
    }

    /**
     * Adjustment Getter
     * @return number
     */
    get taxAmount() {
        return parseFloat(this.invoiceForm.get('tax_amount').value);
    }

    /**
     * total_payment_amount Getter
     * @return number
     */
    get totalPaymentAmount() {
        return parseFloat(this.invoiceForm.get('total_payment_amount').value);
    }

    /**
     * Adjustment Getter
     * @return number
     */
    get client_name() {
        return this.invoiceForm.get('client_name');
    }

    /**
     * Adjustment Getter
     * @return number
     */
    get client_id() {
        return this.invoiceForm.get('client_id');
    }

    /**
     * client_email Getter
     * @return number
     */
    get client_email()  {
        return this.invoiceForm.get('client_email');
    }

    /**
     * client_email Getter
     * @return number
     */
    get client_contact_name()  {
        return this.invoiceForm.get('client_contact_name');
    }

     /**
     * client_phone_no Getter
     * @return number
     */
    get client_phone_no() {
        return this.invoiceForm.get('client_phone_no');
    }

    /**
     * due_date Getter
     * @return String
     */
    get due_date() {
        return this.invoiceForm.get('due_date');
    }

    /**
     * client_email Getter
     * @return number
     */
    get billing_location_same_as_work()  {
        return this.invoiceForm.get('billing_location_same_as_work');
    }

    /**
     * client_work_location_id Getter
     * @return number
     */
    get client_work_location_id() {
        return this.invoiceForm.get('client_work_location_id');
    }

    /**
     * client_work_location Getter
     * @return number
     */
    get client_work_location() {
        return this.invoiceForm.get('client_work_location');
    }

     /**
     * client_work_location Getter
     * @return number
     */
    get client_billing_location_id() {
        return this.invoiceForm.get('client_billing_location_id');
    }

    /**
    * backup_billing_location_id Getter
    * @return string
    */
    get client_billing_location() {
        return this.invoiceForm.get('client_billing_location');
    }

    /**
    * backup_billing_location_id Getter
    * @return string
    */
    get backup_billing_location_id() {
        return this.invoiceForm.get('backup_billing_location_id');
    }

    /**
    * backup_billing_location Getter
    * @return string
    */
    get backup_billing_location() {
        return this.invoiceForm.get('backup_billing_location');
    }


    /**
     * Geth the Subtotal
     * @return number
     */
    subtotalAmount() {

        let subTotal:any = 0;

        if (this.hasDataOf('services')) { // Check if the services exists

            for (let i = 0; i < this.getServices.value.length; i++) {

                if (this.getServices.at(i).get('quantity').value == 0) {

                    subTotal = parseFloat(subTotal) + parseFloat(this.getServices.at(i).get('total_amount').value);

                } else {

                    subTotal = parseFloat(subTotal) + parseFloat(this.getServices.at(i).get('total_amount').value);
                }
            }
        }

        if (this.hasDataOf('product_materials')) { // Check if the product_materials exists
        
            for (let i = 0; i < this.getProductMaterials.value.length; i++) {

                subTotal = parseFloat(subTotal) + parseFloat(this.getProductMaterials.at(i).get('total_amount').value);
            }

        }

        if (this.hasDataOf('additional_items')) { // Check if the additional_items exists
        
            for (let i = 0; i < this.getAdditionalItems.value.length; i++) {

                subTotal = parseFloat(subTotal) + parseFloat(this.getAdditionalItems.at(i).get('total_amount').value);
            }

        }
        
        return subTotal;
    }

    /**
     * Add New Row Services
     * @retun void
     */
    addNewMaterialRow() {
       
        // Filter dropdown items
        this.reduceDropdownContainerItems().then( () => {

            this.getAdditionalItems.push(this.itemFormControls());

            this.setObservableDropdown(this.getAdditionalItems.length - 1);
            
        });
        
    }

    /**
     * Reset drop row
     * @return void
     */
    resetDropdownList(index) {

        // Update dropdown list
        this.reduceDropdownContainerItems().then(() => {

            this.setObservableDropdown(index);

        });
        this.util.focusHiddenInput("hiddenInput");
    }

    /**
     * Removed selected item form row
     * @retun void
     */
    removeSelectedItem(index, id) {
        
        let item = this.getAdditionalItems.at(index);

        item.patchValue({
            item_def_id : '',
            name : '',
            service_definition_id : '',
            type : '',
            cost : 0.00,
            quantity : 1.00,
            total_amount : 0.00,
            ad_hoc_service : '',
            is_hoc_service : false,
            details : '',
            uom : ''
        });

        // Update dropdown list
        this.reduceDropdownContainerItems().then(() => {

            this.setObservableDropdown(index);

        });

        // this.util.blurOnInput(`${id}${index}`);

        // $(`additional_item_${index}`).attr({'expanded' : true});

        this.openItemAutoCompleteInput();

    }

    setObservableDropdown(index): void {
        
        try {

            this.getAdditionalItems.at(index).get('dropdownList').setValue(
                this.getAdditionalItems.at(index).get('name').valueChanges.pipe(startWith(''), 
                map(value => this.serviceFilter(value))));

        } catch(err) {

            this.global.addException('Create Account','setObservable()', err);
        }
    }

    /**
     * ServicesIds
     * @return array
     */
    getServicesIds() {
        
        return _pluck(this.getServices.value, 'service_definition_id');
    }

    /**
     * ServicesIds
     * @return array
     */
    getMaterialIds() {
        
        return _pluck(this.getProductMaterials.value, 'item_def_id');
    }

    /**
     * ServicesIds
     * @return array
     */
    getServiceIdsFromItems() {
        
        return _pluck(this.getAdditionalItems.value, 'service_definition_id');
    }

    /**
     * ServicesIds
     * @return array
     */
    getMaterialIdsFromItems() {
        
        return _pluck(this.getAdditionalItems.value, 'item_def_id');
    }


    /**
     * Reduce Dropdown Container items
     * Remove items which is already in list
     * @return array
     */
    reduceDropdownContainerItems() {

        let newContainer = [];

        return new Promise( (resolve, reject) => {

            _each(this.originalDropdownListContainer, (item) => {

                if (_has(item, 'service_definition_id') 
                    && this.getServicesIds().includes(item.service_definition_id) == false) {

                    newContainer.push(item);

                } else if(_has(item, 'item_def_id') 
                    && this.getMaterialIds().includes(item.item_def_id) == false) {
                    
                    newContainer.push(item);

                }

            });

            let filterItems = [];
            
            if (newContainer.length > 0) {

                _each(newContainer, (item) => {

                    if (_has(item, 'service_definition_id') 
                        && this.getServiceIdsFromItems().includes(item.service_definition_id) == false) {

                        filterItems.push(item);

                    } else if(_has(item, 'item_def_id') 
                        && this.getMaterialIdsFromItems().includes(item.item_def_id) == false) {
                        
                        filterItems.push(item);

                    }

                });
            }

            this.dropdownListContainer = filterItems;

            resolve(filterItems);

        });
        
    }

    private serviceFilter(value: string): string[] {

        try {
            return this.dropdownListContainer.filter(option => option.name.toLowerCase().includes(value ? value.toLowerCase() : ''));
        } catch(err){

            this.global.addException('Create Invoice','serviceFilter()',err);
        }
    }

    /**
     * Set the service 
     * @param service 
     * @param event 
     * @param index 
     * @return void
     */
    getSelectedService(service, event: any = false, index): void {
      
        if (event.isUserInput) {
          
            this.getAdditionalItems.at(index).patchValue(service);

            this.calculateInvAdditionalAmt(index);
        }

        this.calculateTotal();

        this.reduceDropdownContainerItems();
    }

    /**
     * Do lowercase & remove sapces from string
     * @param string value
     * @return string
     */
    fString(string:string) {
        return (string).toLowerCase().replace(/\s+/g,'');
    }

    /**
     * On typing on input of drop down
     * @param event 
     * @param index 
     * @param inputValue 
     * @return void
     */
    public validateService(event:any, item:any, index) {
        
        this.reduceDropdownContainerItems().then( (data) => {

            let service = event.target.value;
            
            let match = this.dropdownListContainer.filter(item=>item.name.toLowerCase() == service.toLowerCase());

            let inputValue = (service).toLowerCase().replace(/\s+/g,'');
            let isMatched  = false;

            _each(this.dropdownListContainer, (node) => {
    
                let nodeName = (node.name).toLowerCase().replace(/\s+/g,'');

                if (nodeName == inputValue) {
                    isMatched = true;
                }

            });

            if (inputValue && isMatched) {

                item.patchValue({
                    'is_hoc_service' : false,
                    'ad_hoc_service' : ''
                });

            } else if(inputValue && !isMatched) {

                item.patchValue({
                    'is_hoc_service' : true,
                    'ad_hoc_service' : service
                });
            }

        });
    }

    /**
     * Calculate 
     * @return void
     */
    calculateTotal() {
        
        let subtotal = this.subtotalAmount();

        let calculatedPrices = this.util.calculatePrices(
            subtotal,
            this.adjustmentAmount,
            this.taxPercentage,
            this.taxAmount,
            this.shippingAndHandllingAmount,
            this.totalPaymentAmount
        );
        
        this.invoiceForm.patchValue({
            'subtotal' : subtotal,
            'tax_amount' : calculatedPrices['taxAmount'],
            'total_payment_amount' : calculatedPrices['totalPaymentAmount']
        });
       
    }


    private validateInvQtyInput(callback){

        try {

            for(let i = 0; i < this.getServices.value.length; i++) {

                this.util.removeCommas(this.getServices.at(i).get('quantity'));

                if  ( 
                    (this.getServices.at(i).get('quantity').value != 0 
                && !_isUndefined(this.getServices.at(i).get('quantity').value) 
                && !this.constant.AMOUNT_NEG_PATTERN.test(this.getServices.at(i).get('quantity').value)) ){
                    return callback(false);
                }
            } 

        } catch(err) {
            this.global.addException('Create Account','validateInvQtyInput()', err);
        }

        return callback(true);
    }


    private validatePMQtyInput(callback){

        try {


            for(let i = 0; i < this.getProductMaterials.value.length; i++) {

                this.util.removeCommas(this.getProductMaterials.at(i).get('quantity'));

                if  ( 
                    (this.getProductMaterials.at(i).get('quantity').value != 0 
                && !_isUndefined(this.getProductMaterials.at(i).get('quantity').value) 
                && !this.constant.AMOUNT_NEG_PATTERN.test(this.getProductMaterials.at(i).get('quantity').value)) ){
                    return callback(false);
                }
            }

        } catch(err) {
            this.global.addException('Create Account','validatePMQtyInput()', err);
        }

        return callback(true);
    }


    private validateAdditionalQtyInput(callback){

        try {

            for(let i = 0; i < this.getAdditionalItems.value.length; i++) {

                this.util.removeCommas(this.getAdditionalItems.at(i).get('quantity'));

                if  ( 
                    (this.getAdditionalItems.at(i).get('quantity').value != 0 
                && !_isUndefined(this.getAdditionalItems.at(i).get('quantity').value) 
                && !this.constant.AMOUNT_NEG_PATTERN.test(this.getAdditionalItems.at(i).get('quantity').value)) ){
                    return callback(false);
                }
            }

        } catch(err) {
            this.global.addException('Create Account','validateAdditionalQtyInput()', err);
        }

        return callback(true);
    }


    calculateInvAmt(index) {

        try {

            // this.updateServiceRemainingQty(index);

            this.validateInvQtyInput( (response) => {

                let invAmt = 0;

                if (!response){

                    invAmt = ( 0 * this.getServices.at(index).get('cost').value);

                } else {

                    invAmt = (this.getServices.at(index).get('quantity').value * this.getServices.at(index).get('cost').value);
                }

                this.getServices.at(index).get('total_amount').setValue(isNaN(invAmt) ? 0.00 : invAmt);

                this.calculateTotal();

            });

        } catch(err) {
            
            this.global.addException('Create Account','calculateInvAmt()', err);
        }
    }

    calculateMaterialInvAmt(index) {

        try {

            this.validatePMQtyInput( (response) => {

                let invAmt = 0;

                if (!response) {

                    return;
                    
                } else {

                    invAmt = (this.getProductMaterials.at(index).get('quantity').value * this.getProductMaterials.at(index).get('cost').value);
                }

                this.getProductMaterials.at(index).get('total_amount').setValue(isNaN(invAmt) ? 0.00 : invAmt);

                this.calculateTotal();
            });

        } catch(err) {
            
            this.global.addException('Calculate Amount','calculateMaterialInvAmt()', err);
        }
    }

    /**
     * Update Quantity input of 
     * product & materials
     * @param index array row index
     * @return void
     */
    calculateInvAdditionalAmt(index){

        try {

            this.validateAdditionalQtyInput( (response) => {

                let invAmt = 0;

                if (!response) {

                    return;
                    
                } else {

                    invAmt = (this.getAdditionalItems.at(index).get('quantity').value * this.getAdditionalItems.at(index).get('cost').value);
                }

                this.getAdditionalItems.at(index).get('total_amount').setValue(isNaN(invAmt) ? 0.00 : invAmt);

                this.calculateTotal();
            });

        } catch(err) {
            
            this.global.addException('Calculate Amount','calculateInvAdditionalAmt()', err);
        }
    }

    /**
     * Remove row by index
     * @param controlKey 
     * @param index
     * @return void
     */
    removeRow(from, index) 
    {   
        if (from == 1) {
            this.getServices.removeAt(index);
        } else if(from == 2) {
            this.getProductMaterials.removeAt(index);
        } else if(from == 3) {
            this.getAdditionalItems.removeAt(index);
        }
        
        this.calculateTotal();

        // Reset on remove
        this.reduceDropdownContainerItems();
    }

     /**
     * Call When component initilize
     * @return void
     */
    ngOnInit() { 

        this.util.menuChange({'menu':7,'subMenu':33});

        this.util.setPageTitle(this.route);

        window.scrollTo(0, 0);

        if (sessionStorage.getItem('CREATE_INVOICE_WITHOUT_QUO')) {

            sessionStorage.removeItem('INV_DETAILS_WITHOUT_QUO');

        } else if(sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO')) {

            sessionStorage.removeItem('CREATE_INVOICE_WITHOUT_QUO');
        }

        // Fetch Materials
        this.fetchMaterials();
        
        // Setup form controls
        this.setupFormControls();

        this.util.changeDetection.subscribe(dataObj => {
   
            if (dataObj && dataObj.source == "CREATE_INVOICE_WITHOUT_QUO") {

                if (dataObj.action == "ADD_CLIENT") {

                    this.pageVariables.client_id   = dataObj.data.client_id;
                    this.pageVariables.clientOTF   = dataObj.data;
                    this.pageVariables.client_name = dataObj.data.client_name;

                    this.getClients("addClient");
                    
                } else if (dataObj.action == "ADD_LOCATION") {
                
                    this.getWorkLocationOnTheFly(
                        "addLocation",
                        dataObj.data.client_id,
                        dataObj.data.client_address_id,
                        dataObj.type
                    );
                }
            }

        });

        if (sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO')) {

            let editData = JSON.parse(sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO'));

            console.log(`After Update => `, editData);

            this.createServiceControls(editData['services']);

            this.createPaymentScedulesControls(editData['payment_schedules']);

            this.setProductAndMaterialControls(editData['product_materials']);

            this.setAdditionalControls(editData['additional_items']);
            
            this.updateFormModel(editData);
        }


        // Get the quotesion details
        this.getClients('INIT', this.client_id.value).then( (requestData) => {
  
            if (!sessionStorage.getItem('INV_DETAILS_WITHOUT_QUO')) {

                // get the tax rate from invoices
                this.getSettings();

            }

            this.calculateTotal();

            this.isLoaded = true;

        });

        this.filteredClients = this.invoiceForm.get('client_name').valueChanges.pipe(
            startWith(""),
            map(data => {
                return data ? this._filterClients(data, this.clients) : this.clients.slice();
            })
        );

        this.filteredWorkLocations = this.invoiceForm.get('client_work_location').valueChanges.pipe(
            startWith(""),
            map(data => {
                return data ? this._filterLocation(data, this.workLocations): this.workLocations.slice()
            })
        );
        
        this.filteredBillingLocations = this.invoiceForm.get('client_billing_location').valueChanges.pipe(
            startWith(""),
            map(data => {
               return data ? this._filterLocation(data, this.bilingLocations) : this.bilingLocations.slice()
            })
        );
    }

    /**
     *  Filter client list
     * @param full_name
     * @param list 
     * @return void
     */
    _filterClients(full_name, list: any[]) {

        return list.filter(option =>
            {
                return option.full_name.toLowerCase().includes(!_isEmpty(full_name) ? full_name.toLowerCase() : "");
            }
        );
    }

    _filterLocation(name: string, list: any[]) {
       
        return list.filter(data =>
            {
                return data.full_address.toLowerCase().indexOf(!_isEmpty(name) ? name.toLowerCase() : "") === 0
            }
        );
    }

    ngAfterViewInit() {}

    /**
     * Process For next the form
     * @return void
     */
    next(form:FormGroup){

        try {

            this.submitted = true;
            
            if (form.valid) {

                sessionStorage.setItem('INV_DETAILS_WITHOUT_QUO', JSON.stringify(form.value));

                sessionStorage.removeItem('CREATE_INVOICE_WITHOUT_QUO');

                this.router.navigate(['/account/csa/review-invoice-without-quotation']);
            }

        } catch(err) {

            this.global.addException('Create New Invoice','next()', err);
        }
    }

    cancel() {

        sessionStorage.removeItem('CREATE_INVOICE_WITHOUT_QUO');

        sessionStorage.removeItem('INV_DETAILS_WITHOUT_QUO');

        this.router.navigate(['/account/csa/invoice-list/0']);

    }

}
