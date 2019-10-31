import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl, FormGroupDirective } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { UtilService } from '../../../../../shared/service/util.service';
import { HttpService } from '../../../../../shared/service/http.service';
import { ConstantsService } from '../../../../../shared/service/constants.service';
import { WorkOrderService } from '../../work-order.service';
import { GlobalService } from '../../../../../shared/service/global.service';
import { WorkOrderDialog } from './../../work-order-dialog.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

    matProdForm: FormGroup;
    materialsList: any[] = [];
    backupMaterialsList: any[] = [];
    submitted: boolean = false;
    selectedprodMat: number;
    oldWODetails: any = { 'materials' : [] };
    action: string = 'ADD';
    newTotalServiceAmt: number = 0;
    errMsg: string = '';
    isError: boolean = false;
    subscription: Subscription;

    isProgress: boolean = false;

    constructor(
        public util: UtilService,
        private constant: ConstantsService,
        private fb: FormBuilder,
        private http:HttpService,
        public WOService: WorkOrderService,
        public dialog: MatDialog,
        public route: ActivatedRoute,
        public global:GlobalService
    ) { }

    ngOnInit() {
        this.util.showProcessing('processing-spinner');
        this.util.setPageTitle(this.route);
        this.getMaterialList();
        this.createForm(0);
        this.WOService.quatationTab = 'products';
        this.isProgress = this.WOService.WO_DATA ? this.WOService.WO_DATA.status_id == 5 ? true : false : false;
        this.WOService.isCRwithProduct = false;
        this.subscription = this.util.changeDetection.subscribe(dataObj => {
            if(dataObj && dataObj.source == 'EXTERNAL_WO' && dataObj.action == 'ADD_LOCATION'){
                //this.updateLocation(dataObj.data);
            }else if((dataObj && dataObj.source == 'EXTERNAL_WO' && dataObj.action == 'ADD_PROD_MAT') || (dataObj && dataObj.source == 'INTERNAL_WO' && dataObj.action == 'ADD_PROD_MAT')){
                dataObj.data.validation ? this.addValidation(this.productMaterial) : this.removeValidation(this.productMaterial);
                this.updateValidation(this.productMaterial);
                this.reviewMaterial();
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    //Get Material/Product List
    getMaterialList() {
        try {
            var self = this;
            this.http.doGet('quotation/product-material/wo', function (error: boolean, response: any) {
                self.util.hideProcessing('processing-spinner');
                if (error) { console.log(response) } else {
                    console.log("manufPart", response.data);
                    
                            self.materialsList = [];
                            if (response.data) {
                                self.materialsList = response.data;
                                //console.log(self.materialsList);
                                console.log(self.materialsList);
                                self.backupMaterialsList = JSON.parse(JSON.stringify(self.materialsList));
                                if (self.WOService.WO_DATA.materialsDetails || self.WOService.WO_DATA.wo_material_products) {
                                    console.log('self.WOService.WO_DATA.wo_material_products', JSON.stringify(self.WOService.WO_DATA.wo_material_products));
                                    let totalAmt = 0;
                                    self.WOService.WO_DATA.materialsDetails.length > 0 ? self.createForm('1', self.WOService.WO_DATA) : self.createForm('0');
                                    if (self.WOService.WO_DATA.materialsDetails) {
                                        self.action = 'EDIT';
                                    }
                                    if (self.WOService.WO_DATA.wo_material_products) {
                                        self.oldWODetails.wo_material_products = self.WOService.WO_DATA.wo_material_products;
                                        self.WOService.WO_DATA.wo_material_products.forEach(function (obj) { totalAmt += parseFloat(obj.total_amount); });
                                        self.oldWODetails.totalAmt = totalAmt;
                                        self.action = 'EDIT';
                                    }
                                } else if (sessionStorage.getItem('woSetupData')) {
                                    let dataObj = JSON.parse(sessionStorage.getItem('woSetupData'));

                                    console.log("dataObj.product_materials :: ",dataObj.product_materials);
                                    //dataObj.materialsDetails = dataObj.product_materials;
                                    dataObj.materialsDetails = [];

                                    for (var i = 0; i < dataObj.product_materials.length ; i++)
                                    {
                                        if(parseInt(dataObj.product_materials[i].quantity) > 0)
                                        {
                                            dataObj.materialsDetails.push(dataObj.product_materials[i]);
                                        }
                                    }
                                    console.log("dataObj.materialsDetails ::", dataObj.materialsDetails);

                                    self.createForm('1', dataObj);
                                } else {
                                    //self.addProdMat('0');
                                }
                            }
                        
                }
            });
        } catch (err) {
            this.global.addException('Work order', 'getMaterialList()', err);
        }
    }

    setLocationDetails(id, index){
        this.productMaterial.at(index).get('prodMatLocation').setValue([]);
        this.productMaterial.at(index).get('prodMatLocationBackup').setValue([]);
        for (let i = 0; i < this.materialsList.length; i++) {
            if(id == this.materialsList[i].item_def_id){
                this.productMaterial.at(index).get('prodMatLocation').setValue(this.materialsList[i].locations ? this.materialsList[i].locations : []);
                this.productMaterial.at(index).get('prodMatLocationBackup').setValue(this.materialsList[i].locations ? this.materialsList[i].locations : []);
                
                break;
            }
        }
    }

    private materialFilter(value: string): string[] {
        try {
            return value && value != '' ? (this.materialsList.filter(option => option.item_definition_name.toLowerCase().includes(value ? value.toLowerCase() : ''))) : this.materialsList;
        } catch (err) {
            this.global.addException('Products', 'materialFilter()', err);
        }
    }

    private materialLocationFilter(value: any, index): string[] {
        try {
            return this.productMaterial.at(index).get('prodMatLocation').value.filter(option => option.sub_location.toLowerCase().includes(value ? value.toLowerCase() : ''));
        } catch (err) {
            this.global.addException('Products', 'materialLocationFilter()', err);
        }
    }

    getSelectedMaterial(material, event: any = false, index): void {
        try {
            if (event.isUserInput) {
                this.productMaterial.at(index).get('item_def_id').setValue(material.item_def_id);
                this.productMaterial.at(index).get('item_definition_name').setValue(material.item_definition_name);
                this.productMaterial.at(index).get('cost').setValue(material.sales_price);
                this.productMaterial.at(index).get('quantity').setValue('1');
                this.productMaterial.at(index).get('item_type').setValue(material.item_type);
                this.productMaterial.at(index).get('uom').setValue(material.uom ? material.uom : '');
                this.productMaterial.at(index).get('prodMatLocationBackup').setValue(material.locations);
                this.productMaterial.at(index).get('prodMatLocation').setValue(material.locations);
                for (let i = 0; i < this.getLocations(index).length; i++) {
                     this.getLocations(index).removeAt(i);
                }
                this.addPickupLocation('0', {}, index);
                this.removeMaterialFormList(material.item_def_id, 'item_def_id', this.materialsList);
            }
        } catch (err) {
            this.global.addException('Products', 'getSelectedMaterial()', err);
        }
    }

    public validateMaterial(event: any, item: any, index){
        try {
            let material = event.target.value;
            if (material == '') {
                let checkOccurance = this.materialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value);
                item.get('item_def_id').value != '' && checkOccurance.length == 0 ? this.materialsList.push(this.backupMaterialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value)[0]) : '';
                item.get('item_def_id').setValue('');
                for (let i = 0; i < this.productMaterial.length; i++) {
                    this.productMaterial.at(i).get('item_def_id').value == '' ? this.setObservable(i) : '';
                }
                return;
            }
            let match = this.materialsList.filter(item => item.item_definition_name.toLowerCase() == material.toLowerCase());
            if (match.length > 0) {
                item.get('item_def_id').setValue(match[0].item_def_id);
                item.get('quantity').setValue('1');
                item.get('item_type').setValue(match[0].item_type);
                item.get('cost').setValue(match[0].sales_price);
                item.get('uom').setValue(match[0].uom ? match[0].uom : '');
                item.get('item_definition_name').setValue(match[0].item_definition_name);
                item.get('prodMatLocationBackup').setValue(match[0].locations);
                item.get('prodMatLocation').setValue(match[0].locations);
                for (let i = 0; i < this.getLocations(index).length; i++) {
                     this.getLocations(index).removeAt(i);
                }
                this.removeMaterialFormList(material.item_def_id, 'item_def_id', this.materialsList);
            } else {
                if(item.get('item_def_id').value != ''){
                    let matName = this.backupMaterialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value)[0].item_definition_name;

                    if(matName.toLowerCase() != material.toLowerCase()){
                        let checkOccurance = this.materialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value);
                        checkOccurance.length == 0 ? this.materialsList.push(this.backupMaterialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value)[0]) : '';
                        item.get('item_def_id').setValue('');
                    }
                }
            }
        } catch (err) {
            this.global.addException('materialValidation', 'validateMaterial()', err);
        }
    }

    setPickupLocation(matIndex, locIndex, locationDetails){
        locationDetails.location_type = true;

        this.addPickupLocation('1', locationDetails, matIndex);
    }

    getSelectedMaterialLocation(event: any = false, selectedLocationObj, materialControl, matIndx, locationControl, locIndex): void {
        if (event.isUserInput) {
            let locList: any[] = JSON.parse(JSON.stringify(this.productMaterial.at(matIndx).get('prodMatLocation').value));
            for (let i = 0; i < locList.length; i++) {
                if(locList[i].location_tag_id == selectedLocationObj.location_tag_id){
                    locList.splice(i, 1)
                    this.productMaterial.at(matIndx).get('prodMatLocation').setValue(locList);
                    break;
                }
            }
            this.updateLocation(selectedLocationObj, materialControl, matIndx, locationControl, locIndex);
        }
        console.log(location);
    }

    removeMaterialFormList = (id, key, list) => {
        this.materialsList = list.filter(item => item[key] != id);
        for (let i = 0; i < this.productMaterial.length; i++) {
            this.productMaterial.at(i).get('item_def_id').value == '' ? this.setObservable(i) : '';
        }
    };

    addMaterialToList = (id, key, list, backupList) => {
        if(backupList.filter(item => item[key] == id).length > 0){
            list.push(backupList.filter(item => item[key] == id)[0]);
        }
        for (let i = 0; i < this.productMaterial.length; i++) {
            this.productMaterial.at(i).get('item_def_id').value == '' ? this.setObservable(i) : '';
        }
    }

    clearMaterial(material, amount, index){
        material.get('item_def_id').value != '' ? this.addMaterialToList(material.get('item_def_id').value, 'item_def_id', this.materialsList, this.backupMaterialsList) : '' ;
        while (this.getLocations(index).length !== 0) {
            this.getLocations(index).removeAt(0)
          }
    }
    createForm(option, data: any = {}): void {
        this.matProdForm = this.fb.group({
            peMaterialsCount: new FormControl( option == '1' ? data.peMaterialsCount : 0 ),
            woType: new FormControl( option == '1' ? data.woType : '' ),

            material_amount: new FormControl(0),
            productMaterial: this.fb.array([]),
            peProductMaterial: new FormControl(option == '1' ? data.materialsAdditionalInfo ? data.materialsAdditionalInfo.peProductMaterial : [] : []),
            woRemainingQuantity: new FormControl(option == '1' ? data.materialsAdditionalInfo ? data.materialsAdditionalInfo.woRemainingQuantity : [] : []),
        });

        if(option == '1'){
            if(data.materialsDetails.length){
                for (var i = 0; i < data.materialsDetails.length; i++) {
                    let materialsList: any[] = this.matProdForm.get('peProductMaterial').value;
                    materialsList.push(data.materialsDetails[i].item_def_id);
                    this.matProdForm.get('peProductMaterial').setValue(materialsList);
                    let woRemainingQuantity: any[] = this.matProdForm.get('woRemainingQuantity').value;
                    woRemainingQuantity.push(data.materialsDetails[i].wo_remaining_quantity);

                    console.log("data.materialsDetails[i] : ",data.materialsDetails[i]);
                    if(parseFloat(data.materialsDetails[i].quantity) > 0){
                        this.addProdMat(option, data.materialsDetails[i]);
                        this.setLocationDetails(data.materialsDetails[i].item_def_id, i);
                        if(sessionStorage.getItem('woSetupData')){
                            this.addPickupLocation('0', {}, i);
                        }else if (this.WOService.WO_DATA.materialsDetails || this.WOService.WO_DATA.wo_material_products) {
                            if(data.materialsDetails[i].locations)
                            {
                                for (var j = 0; j < data.materialsDetails[i].locations.length; j++) {
                                    this.setPickupLocation(i, j, data.materialsDetails[i].locations[j]);
                                }
                                if(data.materialsDetails[i].locations.length == 0){
                                    this.addPickupLocation('0', {}, i);
                                }
                            }
                            else {
                                this.addPickupLocation('0', {}, i);
                            }
                        }
                        this.removeMaterialFormList(data.materialsDetails[i].item_def_id, 'item_def_id', this.materialsList);
                    }
                }
            }else{
                //this.addProdMat('0');
            }
		}

        this.matProdForm.get('woType').setValue( this.action == 'ADD' && sessionStorage.getItem('woSetupData') ? 'EXTERNAL' : 'INTERNAL' );
        this.matProdForm.get('peMaterialsCount').setValue( this.action == 'ADD' && sessionStorage.getItem('woSetupData') && data.materialsDetails ? data.materialsDetails.length : 0 );

        if( this.WOService.WO_DATA.materialsAdditionalInfo ){
            this.matProdForm.get('woType').setValue( this.WOService.WO_DATA.servicesAdditionalInfo && this.WOService.WO_DATA.servicesAdditionalInfo.woType ? this.WOService.WO_DATA.servicesAdditionalInfo.woType : '' );
            this.matProdForm.get('peMaterialsCount').setValue( this.WOService.WO_DATA.servicesAdditionalInfo && this.WOService.WO_DATA.materialsAdditionalInfo.peMaterialsCount ? this.WOService.WO_DATA.materialsAdditionalInfo.peMaterialsCount : 0 );
        }
    }
    get productMaterial(): FormArray{ return <FormArray>this.matProdForm.get('productMaterial') as FormArray;};

    addNewProdMat(): void {
        this.addProdMat('0');
        this.productMaterial.at(this.productMaterial.length-1).get('newlyAdded').setValue(sessionStorage.getItem('woSetupData') ? '1' : 0);
    }

    addValidation(controls){
        for (let i = 0; i < controls.length; i++) {
            controls.at(i).get('item_definition_name').setValidators([Validators.required]);
            controls.at(i).get('cost').setValidators([ Validators.pattern(this.constant.AMOUNT_PATTERN)]);
            controls.at(i).get('quantity').setValidators([ Validators.pattern(this.constant.AMOUNT_PATTERN)]);
        }
    }

    removeValidation(controls){
        for (let i = 0; i < controls.length; i++) {
            controls.at(i).get('item_definition_name').setValidators([]);
            controls.at(i).get('cost').setValidators([Validators.pattern(this.constant.AMOUNT_PATTERN)]);
            controls.at(i).get('quantity').setValidators([Validators.pattern(this.constant.AMOUNT_PATTERN)]);
        }
    }

    updateValidation(controls){
        for (let i = 0; i < controls.length; i++) {
            controls.at(i).get('item_definition_name').updateValueAndValidity();
            controls.at(i).get('cost').updateValueAndValidity();
            controls.at(i).get('quantity').updateValueAndValidity();
        }
    }

    addProdMat(option, data: any = {}): void {
        let self = this;
        this.productMaterial.push(this.fb.group({
            item_type: new FormControl(option == '1' ? data.item_type : ''),
            item_def_id: new FormControl(option == '1' ? data.item_def_id : ''),
            wo_material_id: new FormControl(option == '1' ? data.wo_material_id : ''),
            item_definition_name: new FormControl(option == '1' ? data.item_definition_name : '', [Validators.required]),
            cost: new FormControl(option == '1' ? data.cost : '', [Validators.pattern(this.constant.AMOUNT_PATTERN)]),
			quantity: new FormControl(option == '1' ? data.quantity : '1', [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
            total_amount: new FormControl(option == '1' ? data.total_amount : ''),
            details: new FormControl(option == '1' ? data.details : ''),
            location_id: new FormControl(option == '1' ? data.location_id : ''),
            location_tag_id: new FormControl(option == '1' ? data.location_tag_id : ''),
            //isDelete: new FormControl(""),
            filteredMaterial: new FormControl( new Observable<string[]>() ),
            //New
            filteredMaterialLocation: new FormControl( new Observable<string[]>() ),
            prodMatLocation: new FormControl(option == '1' ? data.prodMatlocation : []),
            prodMatLocationBackup: new FormControl(option == '1' ? data.prodMatlocation : []),
            locations: this.fb.array([]),
            selectedProdMatLocation: new FormControl(''),
            remainingPickupQuantity: new FormControl(option == '1' ? data.quantity : 0),
            uom: new FormControl(option == '1' ? data.uom : ''),
            isEdit: new FormControl(option == '1' ? data.isEdit ? true : false : false),
            //isLocationSet: new FormControl(option == '1' ?  data.locations ? data.locations.length > 0 ? true : false : false : false),
            isLocationSet: new FormControl(option == '1' ?  true : false),
            newlyAdded: new FormControl( self.action == 'EDIT' ? data.newlyAdded : 0 ),
            oldCost: new FormControl( self.action == 'EDIT' ? data.oldCost : data.cost ),
            oldQuantity: new FormControl( self.action == 'EDIT' ? data.oldQuantity : data.wo_remaining_quantity ),
            is_delete: new FormControl(0),
            isProgress: new FormControl(option == '1' ? self.isProgress && data.wo_material_id != '' ? true : false : false)
        }));

        this.setObservable(this.productMaterial.length - 1);
    }

    getLocations(id): FormArray { return <FormArray>this.productMaterial.at(id).get('locations') as FormArray;}

    addPickupLocation(option, data, index){
        this.getLocations(index).push(this.fb.group({
            wo_pm_location_id : new FormControl(option == '1' ? data.wo_pm_location_id : ''),
            wo_material_id: new FormControl(option == '1' ? data.wo_material_id : ''),
            quantity: new FormControl(option == '1' ? data.quantity : 0),
            selectedProdMatLocation: new FormControl(''),
            isEdit: new FormControl(option == '1' ? data.location_type ? true : false : false),
            isLocationSet: new FormControl(option == '1' ? data.location_type ? true : false : false),
            filteredMaterialLocation: new FormControl( new Observable<string[]>() ),
            location_id: new FormControl(option == '1' ? data.location_id : ''),
            location_tag_id: new FormControl(option == '1' ? data.location_tag_id : ''),
            main_location: new FormControl(option == '1' ? data.location_name ? data.location_name : data.main_location ? data.main_location : '' : ''),
            sub_location: new FormControl(option == '1' ? data.location_tag_name ? data.location_tag_name : data.sub_location ? data.sub_location : '' : ''),
            is_delete: new FormControl(0)
        }));

        this.setObservableForMatProdLoction(index, this.getLocations(index).at(this.getLocations(index).length - 1));
    }

    setObservable(index): void {
        this.productMaterial.at(index).get('filteredMaterial').setValue(this.productMaterial.at(index).get('item_definition_name').valueChanges.pipe(startWith(''),map(value => this.materialFilter(value))));
    }
    setObservableForMatProdLoction(matIndex, location){
        console.log(location);
        location.get('filteredMaterialLocation').setValue(location.get('selectedProdMatLocation').valueChanges.pipe(startWith(''),map(value => this.materialLocationFilter(value, matIndex))));
        //this.productMaterial.at(index).get('filteredMaterialLocation').setValue(this.productMaterial.at(index).get('selectedProdMatLocation').valueChanges.pipe(startWith(''),map(value => this.materialLocationFilter(value, index))));
    }
    removeMaterial(position, material): void {
        if(material.get('item_def_id').value != ''){
            this.addMaterialToList(material.get('item_def_id').value, 'item_def_id', this.materialsList, this.backupMaterialsList);
        }
        if(material.get('wo_material_id').value != ''){
            this.WOService.deletedProductMaterial.push(material.get('wo_material_id').value);
        }
		this.productMaterial.removeAt(position);
    }
    

    updateLocation(selectedLocationObj, materialControl, matIndx, locationControl, locIndex): void {
        try {
            

            materialControl.get('location_id').setValue(selectedLocationObj.location_id);
            materialControl.get('location_tag_id').setValue(selectedLocationObj.location_tag_id);
            locationControl.get('location_id').setValue(selectedLocationObj.location_id);
            locationControl.get('location_tag_id').setValue(selectedLocationObj.location_tag_id);

            locationControl.get('main_location').setValue(selectedLocationObj.main_location);
            locationControl.get('sub_location').setValue(selectedLocationObj.sub_location);

            locationControl.get('isLocationSet').setValue(true);
            locationControl.get('isEdit').setValue(true);
            materialControl.get('isLocationSet').setValue(true);
            materialControl.get('isEdit').setValue(true);


            if(parseInt(materialControl.get('remainingPickupQuantity').value) > parseInt(selectedLocationObj.quantity)){
                locationControl.get('quantity').setValue(selectedLocationObj.quantity);
                materialControl.get('remainingPickupQuantity').setValue(materialControl.get('remainingPickupQuantity').value - selectedLocationObj.quantity);

                materialControl.get('prodMatLocation').value.length > 0 ? this.addPickupLocation('0', {}, matIndx) : '';
            }else{
                locationControl.get('quantity').setValue(materialControl.get('remainingPickupQuantity').value);
                materialControl.get('remainingPickupQuantity').setValue(0);
            }

            //this.productMaterial.at(matIndx).get('total_amount').setValue(parseFloat(this.productMaterial.at(matIndx).get('cost').value) * parseFloat(this.productMaterial.at(matIndx).get('quantity').value));

        } catch (err) {
            this.global.addException('Work order', 'updateLocation()', err);
        }
    }

    editLocation(index): void {
        try{
            this.productMaterial.at(index).get('isEdit').setValue(false);
            this.productMaterial.at(index).get('isLocationSet').setValue(false);
            while (this.getLocations(index).length !== 0) {
                this.getLocations(index).removeAt(0);
            }
            this.addPickupLocation('0', {}, index);
            this.productMaterial.at(index).get('prodMatLocation').setValue(this.productMaterial.at(index).get('prodMatLocationBackup').value);
            this.productMaterial.at(index).get('remainingPickupQuantity').setValue(this.productMaterial.at(index).get('quantity').value);
        }catch (err){
            this.global.addException('Products', 'editLocation()', err);
        }
    }

    reviewMaterial(){
        this.submitted = true;
        if(this.productMaterial.valid){
            let prodMatList: any = [];
            let createCR: boolean = false;
            for (var i = 0; i < this.productMaterial.value.length; i++) {
                //let locationList: any [] = [], reqLocationList: any[] = [];

                prodMatList.push({
                    "wo_material_id": this.productMaterial.value[i].wo_material_id,
                    "item_type": this.productMaterial.value[i].item_type,
                    "item_def_id": this.productMaterial.value[i].item_def_id,
                   
                    "location_id": this.productMaterial.value[i].location_id,
                    "item_definition_name": this.productMaterial.value[i].item_definition_name,
                    "location_tag_id": this.productMaterial.value[i].location_tag_id,
                    
                    "cost": this.productMaterial.value[i].cost,
                    "quantity": this.productMaterial.value[i].quantity,
                    "uom": this.productMaterial.value[i].uom,
                    "total_amount": this.productMaterial.value[i].total_amount,
                   
                    
                    "details": "",
                    "isEdit": this.productMaterial.value[i].isEdit,
                    "isLocationSet": this.productMaterial.value[i].isLocationSet,
                    "locations": this.productMaterial.value[i].locations.filter(item=> (parseInt(item.quantity) > 0)),
                    'is_delete': 0
                });
            }
            
            this.WOService.WO_DATA.materialsAdditionalInfo = {
                'woType': this.matProdForm.value.woType,
                'peMaterialsCount': this.matProdForm.value.peMaterialsCount,
                'peProductMaterial': this.matProdForm.value.peProductMaterial,
                'woRemainingQuantity': this.matProdForm.value.woRemainingQuantity
            }
            
            if(!this.isError)
            {
                this.WOService.WO_DATA.materialsDetails = [];
                this.WOService.WO_DATA.materialsDetails = prodMatList;
                this.WOService.updateFormStatus('materialsFm', true);
            }
        }else{
            this.WOService.updateFormStatus('materialsFm', false);
        }
    }


    calculateTotal(event: any, item: any, index) {
        try {
            let material = event.target.value;
            if (material == '') {
                item.get('locations').setValue([]);
                return;
            } else {
                let totalAmt = item.get('cost').value * item.get('quantity').value;
                item.get('total_amount').setValue(totalAmt);
                
                item.get('remainingPickupQuantity').setValue(item.get('quantity').value);
            }
        } catch (err) {
            this.global.addException('Work order - products', 'calculateTotal()', err);
        }
    }

    calculatePickupQuantity(event: any, material: any, index) {
        try {
            let qty = event.target.value;
            let matQuantity = parseInt(material.get('quantity').value);
            let locations = material.get('locations').value;
            console.log("locations : : ",material.get('locations').value);
            let totalQty = 0;
            for (var i=0; i < locations.length ; i++)
            {
                totalQty = totalQty + parseInt(locations[i].quantity);
            }
            
            if(totalQty > matQuantity)
            {
                this.isError = true;
                this.errMsg = "Pick up quantity cannot be more than "+matQuantity; 
            }
            else
            {
                material.get('remainingPickupQuantity').setValue(matQuantity - totalQty);
                this.isError = false;
                this.errMsg = "";
            }

        } catch (err) {
            this.global.addException('Work order - products', 'calculateTotal()', err);
        }
    }
}
