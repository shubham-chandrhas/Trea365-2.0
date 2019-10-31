import { Component, OnInit, ApplicationRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { ConstantsService } from '../../../../shared/service/constants.service';
import { GlobalService } from '../../../../shared/service/global.service';
import { WorkOrderService } from '../work-order.service';

import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';


@Component({
    selector: 'app-wo-setup',
    templateUrl: './wo-setup.component.html',
    styleUrls: ['./wo-setup.component.scss']
})
export class WoSetupComponent implements OnInit {
    subAssigneeList: any = [];
    WOSetupForm: FormGroup;
    selectedQuotation: any = '';
    submitted: boolean = false;
    isRecurringWO: boolean = false;

    filteredAssignee: Observable<string[]>;

    constructor(
        public dialog: MatDialog,
        private fb: FormBuilder,
        public util: UtilService,
        public constant: ConstantsService,
        private global: GlobalService,
        private http: HttpService,
        private router: Router,
        private ref: ApplicationRef,
        private WOService: WorkOrderService,
        public route:ActivatedRoute
    ) {
        let workOrderObj: any = {};
        workOrderObj =  JSON.parse(localStorage.getItem('CREATE_WO'));
        localStorage.getItem('CREATE_WO') ? this.getQuotation(workOrderObj.project_estimate_id) :'';
    }

    ngOnInit() {
        this.util.menuChange({'menu':4,'subMenu':26});
        this.util.setWindowHeight();
        this.util.setPageTitle(this.route);
        this.createForm();
        this.getAssigneeList();
        this.WOService.associatedAsset = [];
        sessionStorage.removeItem('woSetupData');
    }

    getQuotation(id){
        var self = this;
        this.util.showProcessing('processing-spinner');
        try{
            this.http.doGet('quotation/'+id+'/details/wo', function(error: boolean, response: any){
                if( error ){
                    console.log(response)
                }else{
                    self.selectedQuotation = response.data;
                    console.log(self.selectedQuotation);
                    self.util.hideProcessing('processing-spinner');

                    self.isRecurringWO = false;

                    for(let i = 0; i<self.selectedQuotation.services.length; i++){
                        self.addService(i,self.selectedQuotation.services[i]);
                    }
                    for(let i = 0; i<self.selectedQuotation.product_materials.length; i++){
                        
                        self.addMaterial(i,self.selectedQuotation.product_materials[i]);
                    }
                }
            });
        }catch(err){
        this.global.addException('Error Log','constructor()',err);
        }
    }

    getAssigneeList(){
        let self = this;
        try{
            // getSubContractor getCommonStatus
            this.http.doGet('getCommonStatus/WO_ASSIGN_TO', function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){ console.log(response) }else{
                    console.log("cotractor List =",response.data.statusList);
                    self.subAssigneeList = response.data.statusList;
                    console.log("cotractor List =",self.subAssigneeList);
                    self.filteredAssignee = self.assignee.valueChanges.pipe(startWith(''),map(value => self.assigneeFilter(value)));
                }
            });
        }
        catch(err){
        this.global.addException('sub assignee list','getAssigneeList()',err);
        }
    }

    getSelectedAssignee(assignee,event:any): void {
        if(event.isUserInput){
            console.log(assignee);
            this.assignee_id.setValue(assignee.type_id);
        }
    }

    private assigneeFilter(value: string): string[] {
        return this.subAssigneeList.filter(option => option.status.toLowerCase().includes(value ? value.toLowerCase() : ''));
    }

    public validateAssignee(event:any){
        let assignee = event.target.value;
        let match = this.subAssigneeList.filter(item=>item.status.toLowerCase() == assignee.toLowerCase());
        if(assignee == ''){
            this.assignee_id.setValue('');
            return;
        }
        if(match.length > 0){
            this.assignee_id.setValue(match[0].type_id);
            this.assignee.setValue(match[0].status);
        }
    }

    public createForm(){
        this.WOSetupForm = this.fb.group({
            assignee: new FormControl('', [Validators.required]),
            assignee_id: new FormControl('', [Validators.required]),
            add_all_WO: new FormControl(1),
            services: this.fb.array([]),
            materials: this.fb.array([])
        });
    }
    get assignee(){return this.WOSetupForm.get('assignee');}
    get assignee_id(){return this.WOSetupForm.get('assignee_id');}
    get add_all_WO(){return this.WOSetupForm.get('add_all_WO');}
    get services(): FormArray{ return <FormArray>this.WOSetupForm.get('services') as FormArray; };
    get materials(): FormArray{ return <FormArray>this.WOSetupForm.get('materials') as FormArray; };

    getServiceAt(index){ return this.services.at(index) };
    getMaterialAt(index){ return this.materials.at(index) };

    addService(serviceIndx, serviceObj: any = {}){

        this.services.push(this.fb.group({
            service_definition: new FormControl(serviceObj.service_definition),
            details: new FormControl(serviceObj.details),
            pe_quantity: new FormControl(serviceObj.quantity),
            invoice_remaining_quantity: new FormControl(serviceObj.invoice_remaining_quantity),
            pe_service_id: new FormControl(serviceObj.pe_service_id),
            wo_remaining_quantity: new FormControl(serviceObj.wo_remaining_quantity),
            // WO_quantity: new FormControl(serviceObj.wo_remaining_quantity, [Validators.required, Validators.max(serviceObj.wo_remaining_quantity), Validators.pattern(this.constant.AMOUNT_PATTERN_3DECIMAL)]),
            quantity: new FormControl(serviceObj.wo_remaining_quantity, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
            cost: new FormControl(serviceObj.cost),
            service_definition_id: new FormControl(serviceObj.service_definition_id ? serviceObj.service_definition_id : ''),
            
        }));
    }

    addMaterial(materialIndx, materialObj: any = {}){
        console.log("materialObj :: ",materialObj);
        this.materials.push(this.fb.group({
            item_definition_name: new FormControl(materialObj.item_definition_name ? materialObj.item_definition_name : ''),
            details: new FormControl(materialObj.details),
            pe_quantity: new FormControl(materialObj.quantity),
            cost: new FormControl(materialObj.cost),
            invoice_remaining_quantity: new FormControl(materialObj.invoice_remaining_quantity),
            pe_product_material_id: new FormControl(materialObj.pe_product_material_id),
            wo_remaining_quantity: new FormControl(materialObj.wo_remaining_quantity),
            quantity: new FormControl(materialObj.wo_remaining_quantity, [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
            item_def_id: new FormControl(materialObj.item_def_id ? materialObj.item_def_id : ''),
            item_type: new FormControl(materialObj.type),
            uom: new FormControl(materialObj.uom ? materialObj.uom : ''),
        }));
    }

    changeAddAllToWO(){
        if(this.add_all_WO.value){
            console.log('True');

            for (let i = 0; i < this.selectedQuotation.services.length; i++) {
                this.services.at(i).get('quantity').setValue(this.selectedQuotation.services[i].wo_remaining_quantity);
            }

            for (let i = 0; i < this.selectedQuotation.product_materials.length; i++) {
                this.materials.at(i).get('quantity').setValue(this.selectedQuotation.product_materials[i].wo_remaining_quantity);
            }
        }else{
            console.log('False');

            for (let i = 0; i < this.selectedQuotation.services.length; i++) {
                this.services.at(i).get('quantity').setValue(0);
            }

            for (let i = 0; i < this.selectedQuotation.product_materials.length; i++) {
                this.materials.at(i).get('quantity').setValue(0);
            }
        }
    }

    showImage(url,images){
        if(url){
            this.dialog.open(DialogComponent, { data: { 'action': 'image', 'url': url, 'images': images } });
            this.ref.tick();
        }
    }

    createWorkOrder(form: FormGroup){
        let self = this;
        this.submitted = true;
        if(form.valid){
            console.log("this.selectedQuotation before : ",this.selectedQuotation);
            this.selectedQuotation.services = JSON.parse(JSON.stringify(form.value.services));
            this.selectedQuotation.product_materials = JSON.parse(JSON.stringify(form.value.materials));
            console.log("this.selectedQuotation after : ",this.selectedQuotation);
            sessionStorage.removeItem('WO_DETAILS');
            sessionStorage.removeItem('WO_EDIT');
            this.WOService.WO_DATA = {};
            //this.WOService.WO_SETUP_DATA = this.selectedQuotation;
            sessionStorage.setItem('woSetupData', JSON.stringify(this.selectedQuotation));
            if(this.assignee.value == 'Staff'){
                this.router.navigate(['/workflow/wo/csa/wo-external/services']);
            }else{
                this.router.navigate(['/workflow/wo/csa/wo-sub-contractor']);
            }
        }
    }
}
