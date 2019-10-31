import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import { GlobalService } from '../../../../../shared/service/global.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UtilService } from '../../../../../shared/service/util.service';
import { HttpService } from '../../../../../shared/service/http.service';
import { ConstantsService } from '../../../../../shared/service/constants.service';
import { ProjectEstimatorService } from '../../project-estimator.service';

@Component({
	selector: 'app-materials',
	templateUrl: './materials.component.html',
	styleUrls: ['../quotation-generation.component.css', './materials.component.scss']
})
export class MaterialsComponent implements OnInit {

	materialsForm: FormGroup;
	materialsList: any[] = [];
    backupMaterialsList: any[] = [];
	submitted: boolean = false;
    isEdit: boolean = false;

	constructor(
		public util: UtilService,
		private constant: ConstantsService,
		private fb: FormBuilder,
		private http:HttpService,
        private PEService: ProjectEstimatorService,
        private global: GlobalService
	) { }

	ngOnInit() {
		this.util.showProcessing('processing-spinner');

		this.getMaterialList();
		this.addMaterialsForm('0');
    }

    getEditMaterial()
    {
        if(this.PEService.projectEstimatorData.materialsDetails && this.PEService.projectEstimatorData.materialsDetails.materials.length>0 ){
			console.log(this.PEService.projectEstimatorData.materialsDetails);
            this.isEdit = true;
			this.addMaterialsForm('1', this.PEService.projectEstimatorData.materialsDetails);
		}else{
			console.log("else");
			this.addMaterialsForm('0');
		}

		this.util.changeDetection.subscribe(dataObj => {
      		if(dataObj && dataObj.source == 'QUOTATION_GENERATION' && dataObj.action == 'ADD_MATERIALS'){
        		this.reviewMaterial();
      		}
    	});
    }

	//Get Material/Product List
	getMaterialList(){
		var self = this;
		this.http.doGet('quotation/product-material', function(error: boolean, response: any){
            self.util.hideProcessing('processing-spinner');
            if(error){ console.log(response) }else{
				self.materialsList = [];
				if(response.data){
					self.materialsList = response.data;
                    self.backupMaterialsList = JSON.parse(JSON.stringify(response.data));
                    console.log("self.materialsList",self.materialsList);
                    self.getEditMaterial();
					console.log(self.materials.length);
					if(self.materials.length>0)
						self.materials.at(0).get('filteredMaterial').setValue(self.materials.at(0).get('item_definition_name').valueChanges.pipe(startWith(''),map(value => self.materialFilter(value))));
				}
            }
        });
	}

	private materialFilter(value: string): string[] {
        return this.materialsList.filter(option => option.item_definition_name.toLowerCase().includes(value ? value.toLowerCase() : ''));
	}

	getSelectedMaterial(material, event: any = false, index): void {
		if(event.isUserInput){
            console.log(material);
			this.materials.at(index).get('item_def_id').setValue(material.item_def_id);
			this.materials.at(index).get('cost').setValue(material.sales_price);
			let totalAmt = this.materials.at(index).get('cost').value*this.materials.at(index).get('quantity').value;
			this.materials.at(index).get('total_amount').setValue(totalAmt);
			this.materials.at(index).get('type').setValue(material.item_type);
            this.materials.at(index).get('uom').setValue(material.uom);
			this.calculateTotalMaterialsAmount();
            this.addValidation(this.materials, index);
            this.removeMaterialFormList(material.item_def_id, 'item_def_id', this.materialsList);
        }
    }
	public validateMaterial(event:any, item:any, index){
        try {
            let material = event.target.value;

            if (material == '') {
                let checkOccurance = this.materialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value);
                item.get('item_def_id').value != '' && checkOccurance.length == 0 ? this.materialsList.push(this.backupMaterialsList.filter(listItem => listItem.item_def_id == item.get('item_def_id').value)[0]) : '';
                item.get('item_def_id').setValue('');
                for (let i = 0; i < this.materials.length; i++) {
                    this.materials.at(i).get('item_def_id').value == '' ? this.setObservable(i) : '';
                }
                return;
            }
            this.addValidation(this.materials, index);
            let match = [];
            match = this.materialsList.filter(item => item.item_definition_name.toLowerCase() == material.toLowerCase());
            if (match.length > 0) {
                item.get('item_def_id').setValue(match[0].item_def_id);
                item.get('item_definition_name').setValue(match[0].item_definition_name);
                item.get('cost').setValue(match[0].sales_price);
                item.get('uom').setValue(match[0].uom);
                item.get('type').setValue(match[0].item_type);
                let totalAmt = item.get('cost').value*item.get('quantity').value;
                item.get('total_amount').setValue(totalAmt);
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

    removeMaterialFormList = (id, key, list) => {
        this.materialsList = list.filter(item => item[key] != id);
        for (let i = 0; i < this.materials.length; i++) {
            this.materials.at(i).get('item_def_id').value == '' ? this.setObservable(i) : '';
        }
    };

    addMaterialToList = (id, key, list, backupList) => {
        let checkOccurance = this.materialsList.filter(listItem => listItem.item_def_id == id);
        checkOccurance.length == 0 ? list.push(backupList.filter(item => item[key] == id)[0]) : '';
        for (let i = 0; i < this.materials.length; i++) {
            this.materials.at(i).get('item_def_id').value == '' ? this.setObservable(i) : '';
        }
    }

    addValidation(control, index){
        control.at(index).get('item_def_id').setValidators([Validators.required]);
        control.at(index).get('cost').setValidators([Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]);
        control.at(index).get('quantity').setValidators([Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]);
        control.at(index).get('cost').updateValueAndValidity();
        control.at(index).get('item_def_id').updateValueAndValidity();
        control.at(index).get('quantity').updateValueAndValidity();
    }

    calculateTotal(event: any, item: any, index) {
        try {
            let material = event.target.value;
            //console.log(material);
            if (material == '') {
                item.get('total_amount').setValue(0);
                this.calculateTotalMaterialsAmount();
                return;
            } else {
                let totalAmt = item.get('cost').value * item.get('quantity').value;
                item.get('total_amount').setValue(totalAmt);
                this.calculateTotalMaterialsAmount();
            }
        } catch (err) {
            this.global.addException('materialCalculate', 'calculateTotal()', err);
        }
    }

	clearMaterial(material, amount){
		this.materialsForm.get('materials_amount').setValue(this.materialsForm.get('materials_amount').value > amount ? this.materialsForm.get('materials_amount').value - amount : 0 );
        material.get('item_def_id').value != '' ? this.addMaterialToList(material.get('item_def_id').value, 'item_def_id', this.materialsList, this.backupMaterialsList) : '' ;
	}
    calculateTotalMaterialsAmount() {
        try {
            let totalMaterialAmt: number = 0;
            for (let i = 0; i < this.materials.length; i++) {
                if(this.materials.at(i).get('is_delete').value == 0)
                {
                totalMaterialAmt = totalMaterialAmt + parseFloat(this.materials.at(i).get('total_amount').value);
                }
            }
            this.materialsForm.get('materials_amount').setValue(totalMaterialAmt);
        } catch (err) {
            this.global.addException('materialAmount', 'calculateTotalMaterialsAmount()', err);
        }
    }
	addMaterialsForm(option, data: any = {}){
		this.materialsForm = this.fb.group({
			materials_amount: new FormControl(option == '1' ? data.materials_amount : 0),
			materials: this.fb.array([])
        });
        console.log(data.materials);
		if(option == '1'){
			for (var i = 0; i < data.materials.length; i++) {
                this.addMaterials(option, data.materials[i]);
                this.addValidation(this.materials, i);
                if(data.materials[i].is_delete == 0)
                {   
                    this.removeMaterialFormList(data.materials[i].item_def_id, 'item_def_id', this.materialsList);
                }   
			}
		}
        //else{
			//this.addMaterials(option);
		//}

	}
	get materials(): FormArray{ return <FormArray>this.materialsForm.get('materials') as FormArray;};

	addMaterials(option, val: any = {}){
		this.materials.push(this.fb.group({
			item_definition_name: new FormControl(option == '1' ? val.item_definition_name : ''),
            item_def_id: new FormControl(option == '1' ? val.item_def_id : '', [ ]),
            //ad_hoc_service: new FormControl(''),
            type: new FormControl(option == '1' ? val.type : ''),
            pe_product_material_id: new FormControl(option == '1' ? val.pe_product_material_id : ''),
            cost: new FormControl(option == '1' ? val.cost : '', []),
			quantity: new FormControl(option == '1' ? val.quantity : '1', []),
			total_amount: new FormControl(option == '1' ? val.total_amount : 0),
			details: new FormControl(option == '1' ? val.details : ''),
            is_delete: new FormControl(option == '1' ? val.is_delete ? val.is_delete : 0 : 0),
            is_approved: new FormControl(option == '1' ? val.is_approved : 0),
            reject_remark: new FormControl(option == '1' ? val.reject_remark ? val.reject_remark : '' : ''),
			filteredMaterial: new FormControl( new Observable<string[]>() ),
            uom: new FormControl(option == '1' ? val.uom : '')
		}));

		this.setObservable(this.materials.length - 1);
        this.calculateTotalMaterialsAmount();
	}
	setObservable(index): void {
		if(this.materials)
        	this.materials.at(index).get('filteredMaterial').setValue(this.materials.at(index).get('item_definition_name').valueChanges.pipe(startWith(''),map(value => this.materialFilter(value))));
	}

    removeMaterial(position, material): void {
        try {
            material.get('item_def_id').value != '' ? this.addMaterialToList(material.get('item_def_id').value, 'item_def_id', this.materialsList, this.backupMaterialsList) : '' ;
            if(material.get('item_def_id').value == '')
            {
                this.materials.removeAt(position);
            }
            else{
                material.get('is_delete').setValue(1);
            }
            

            this.calculateTotalMaterialsAmount();
        } catch (err) {
            this.global.addException('materialRemove', 'removeMaterial()', err);
        }
    }
    reviewMaterial() {
        try {
            this.submitted = true;
            // if(form.valid){
            // 	console.log("Valid materials",form.value.materials);
            // }

            if (this.materialsForm.valid) {
                
                this.PEService.projectEstimatorData.materialsDetails = this.materialsForm.value;
                for (var i = 0; i < this.PEService.projectEstimatorData.materialsDetails.materials.length; i++) {
                    
                    delete this.PEService.projectEstimatorData.materialsDetails.materials[i].filteredMaterial;
                    
                }
                console.log(this.PEService.projectEstimatorData.materialsDetails.materials);
                this.PEService.updateFormStatus('materialsFm', true);
            } else {
                this.PEService.updateFormStatus('materialsFm', false);
            }
        } catch (err) {
            this.global.addException('materialReview', 'reviewMaterial()', err);
        }
    }
}
