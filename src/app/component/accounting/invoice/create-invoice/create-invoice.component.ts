import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
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
    pluck as _pluck,
    indexOf as _indexOf,
    isEmpty as _isEmpty
} from 'underscore';
import { resolve } from 'q';

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
    selector: 'app-create-invoice',
    templateUrl: './create-invoice.component.html',
    styleUrls: ['./create-invoice.component.css']
})
export class CreateInvoiceComponent implements OnInit, AfterViewInit {
    
    invoiceForm:FormGroup;
    quotationDetails:any = [];
    originalDropdownListContainer  = [];
    dropdownListContainer  = [];
    filteredOptions: Observable<[]>;
    isLoaded:Boolean     = false;
    submitted:boolean    = false;
    pageData = {};

    constructor(
        private fb: FormBuilder,
        public dialog: MatDialog,
        public util:UtilService,
        private http:HttpService,
        private constant:ConstantsService,
		private global:GlobalService,
        public router: Router,
        private route: ActivatedRoute,
    ) {}

    /**
     * Create The Form Controls
     * @return void
     */
    setupFormControls() {

        this.invoiceForm = this.fb.group({
            "is_edit"                       : new FormControl(false),
            "invoice_id"                    : new FormControl(""),
            "project_estimate_id"           : new FormControl(""),
            "po_nos"                        : new FormControl(""),
            "invoice_midsection"            : new FormControl(""),
            "project_estimate_no"           : new FormControl(""),
            "project_estimate_date"         : new FormControl(""),
            "client_id"                     : new FormControl("", [ Validators.required ]),
            "client_email"                  : new FormControl("", [ Validators.required ]),
            "client_name"                   : new FormControl("", [ Validators.required ]),
            "client_billing_location_id"    : new FormControl(""),
            "client_billing_location"       : new FormControl("", [ Validators.required ]),
            "client_work_location"          : new FormControl(""),
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
            "work_orders"                   : new FormControl(""),
            "product_materials"             : this.fb.array([]),
            "payment_schedules"             : this.fb.array([]),
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
     * Request for Quotession details
     * @param quotessionId 
     * @return void
     */
    getQuotation(quotessionId = 0) {

        this.util.showProcessing('processing-spinner');

        try {

            return new Promise((resolve, reject) => {

                this.http.doGet(`financials/invoices/quotations/details/${quotessionId}`, (error: boolean, response: any) => {

                    this.util.hideProcessing('processing-spinner');

                    if (error) {

                        this.util.showAlert(response.message);

                        reject({});

                    } else {  

                        resolve(response.data);
                    }

                });

            });

        } catch(err){

            this.global.addException('Create New Invoice','getQuotation()', err);
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
     * Request for Quotession details
     * @param quotessionId 
     * @return void
     */
    fetchMaterials() {

        this.util.showProcessing('processing-spinner');

        try {

            this.http.doGet(`financials/invoices/services-products-materials`, (error: boolean, response: any) => {

                this.util.hideProcessing('processing-spinner');

                if (error) {} else {  

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
                    quantity                : new FormControl("", [
                                                    Validators.required,
                                                    // Validators.max(item.remaining_quantity),
                                                    Validators.pattern(this.constant.AMOUNT_PATTERN)
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
                    details                 : new FormControl(""),
                    quantity                : new FormControl("", [
                                                    Validators.required,
                                                    // Validators.max(item.remaining_quantity),
                                                    Validators.pattern(this.constant.AMOUNT_PATTERN)
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
                cost            : new FormControl(0.00, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
                quantity        : new FormControl(1.00, [
                                                Validators.required,
                                                // Validators.max(item.remaining_quantity),
                                                Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)
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
                                                Validators.pattern(this.constant.AMOUNT_NEG_PATTERN)
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
     * 
     * @param value - selected value from drodown
     * @return void
     */
    private _filterDropdownList(value: string): DropdownListInterface[] {
        
        const filterValue = value.toLowerCase();

        return this.dropdownListContainer.filter( item => (item.name).toLowerCase().indexOf(filterValue) === 0);
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
        return parseFloat(this.invoiceForm.get('taxes').value);
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
    removeSelectedItem(index) {
        
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

        this.util.focusHiddenInput('hiddenInput');

    }

    setObservableDropdown(index): void {
        
        try {

            this.getAdditionalItems.at(index).get('dropdownList').setValue(
                this.getAdditionalItems.at(index).get('name').valueChanges.pipe(startWith(''), 
                map(value => this.serviceFilter(value)))
            );

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

        // this.util.focusHiddenInput('hiddenInput');

        this.reduceDropdownContainerItems();
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
         
        let newInvoiceObject;
        let project_estimate_id;
        let editData;
        if (sessionStorage.getItem('CREATE_INVOICE')) {

            newInvoiceObject = JSON.parse(sessionStorage.getItem('CREATE_INVOICE'));
            project_estimate_id = newInvoiceObject.project_estimate_id;

            sessionStorage.removeItem('INV_DETAILS');

        } else if(sessionStorage.getItem('INV_DETAILS')) {

            editData = JSON.parse(sessionStorage.getItem('INV_DETAILS'));

            sessionStorage.removeItem('CREATE_INVOICE')

            project_estimate_id = editData.project_estimate_id;
        }
        
        // Fetch Materials
        this.fetchMaterials();

        // Get the quotesion details
        this.getQuotation(project_estimate_id).then( (requestData) => {

            Object.assign(this.quotationDetails, requestData);
            
            // Setup form controls
            this.setupFormControls();

            if (sessionStorage.getItem('INV_DETAILS')) {

                let editData = JSON.parse(sessionStorage.getItem('INV_DETAILS'));
                
                // Services Controls
                this.createServiceControls(editData['services']);

                this.createPaymentScedulesControls(editData['payment_schedules']);

                this.setProductAndMaterialControls(editData['product_materials']);

                this.setAdditionalControls(editData['additional_items']);
            
                this.updateFormModel(editData);

            } else {

                // Get the settings
                this.getSettings();

                this.createServiceControls(this.quotationDetails['services']);

                this.setProductAndMaterialControls(this.quotationDetails['product_materials']);

                this.createPaymentScedulesControls(this.quotationDetails['payment_schedules']);
                     
                this.updateFormModel(this.quotationDetails);
            }
            
            // Update the calculations
            this.calculateTotal();

            this.isLoaded = true;
            
        });
        

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

                sessionStorage.setItem('INV_DETAILS', JSON.stringify(form.value));

                sessionStorage.removeItem('CREATE_INVOICE');

                this.router.navigate(['/account/csa/review-invoice']);
            }

        } catch(err) {

            this.global.addException('Create New Invoice','next()', err);
        }
    }

    cancel() {

        sessionStorage.removeItem('CREATE_INVOICE');

        sessionStorage.removeItem('INV_DETAILS');

        this.router.navigate(['/account/csa/invoice-list/0']);

    }

}
