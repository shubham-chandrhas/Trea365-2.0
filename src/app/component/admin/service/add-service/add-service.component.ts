import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';

import { UtilService } from '../../../../shared/service/util.service';
import { ConstantsService } from '../../../../shared/service/constants.service';
import { GlobalService } from '../../../../shared/service/global.service';

declare var $:any;

@Component({
	selector: 'app-add-service',
  	templateUrl: './add-service.component.html',
  	styleUrls: ['./add-service.component.css']
})
export class AddServiceComponent implements OnInit {
	public errMsg:string = '';
	public isError:boolean = false;
	public submitted:boolean = false;
	public formAction: string = 'add';
	private routeParam;
	addBusinessNatureFrm:FormGroup;

  	constructor(
		  public util: UtilService,
		  public constant: ConstantsService,
		  private fb: FormBuilder,
		  private router: Router,
		  private route: ActivatedRoute,
		  private global: GlobalService
		) { }

  	ngOnInit() {
		this.util.setWindowHeight();
		this.util.setPageTitle(this.route);
		try{
			if(this.router.url.split('/')[2]=='csa-onboarding'){
				this.util.menuChange({'menu':'guide','subMenu':''}); //for onboarding dashboard
			}else{
				this.util.menuChange({'menu':2,'subMenu':11});
			}
			//alert(atob(this.route.snapshot.paramMap.get('id')));
			this.routeParam = atob(this.route.snapshot.paramMap.get('id'));

			if( atob(this.route.snapshot.paramMap.get('id')) == '0' ){
				if( sessionStorage.getItem('businessNature') ){
					this.createBusinessNatureFrm('edit', JSON.parse(sessionStorage.getItem('businessNature')));
				}else{
					this.formAction = 'add';
					this.createBusinessNatureFrm(this.formAction);
				}
			}else{
				this.formAction = 'edit';
				this.createBusinessNatureFrm('edit', JSON.parse(sessionStorage.getItem('businessNature')));
			}
		}catch(err){
            this.global.addException('Add Business Nature','ngOnInit()',err);
        }
  	}

	public createBusinessNatureFrm(action ,busiNatureObj:any = {}){
		this.addBusinessNatureFrm = this.fb.group({
			service_type_id: new FormControl(action == 'edit' ? busiNatureObj.service_type_id : ''),
			is_deleted: new FormControl('0'),
			service_type: new FormControl(action == 'edit' ? busiNatureObj.service_type : '', [
			Validators.required,
			Validators.maxLength(200)
            ]),
            service_definitions: this.fb.array([])
		});
		if(action == 'add'){
			this.addServiceDefinition(0);
		}else{
			for(let i=0;i<busiNatureObj.service_definitions.length;i++){
				this.addServiceDefinition(1, busiNatureObj.service_definitions[i]);
			}
		}

	}

    get service_definitions(): FormArray {return <FormArray>this.addBusinessNatureFrm.get('service_definitions') as FormArray; }

	getServiceTypeAt(index){ return this.service_definitions.at(index) };

	cancelBusiNature(){
		try{
			if(this.router.url.split('/')[2]=='csa-onboarding'){
				this.router.navigate(['/csa-onboarding/guide']);
			}else{
				this.router.navigate(['/admin/csa/service/0']);
			}
		}catch(err){
            this.global.addException('Add Business Nature','cancleBusiNature()',err);
        }
	}
	reviewBusiNature(form:FormGroup):void{
		this.errMsg = '';
        this.isError = false;
		this.submitted = true;
		// console.log("form.value",form.value);
		try{
			if(form.valid){
				let reqData = form.value;
				let self = this;
				this.isError = false;

				if(this.routeParam == 0){
					sessionStorage.setItem('businessNature',JSON.stringify(reqData));
					if(self.router.url.split('/')[2]=='csa-onboarding'){
						self.router.navigate(['/admin/csa-onboarding/review-service/'+btoa('add')]);
					}else{
						self.router.navigate(['/admin/csa/review-service/'+btoa('add')]);
					}
				}else{
					sessionStorage.setItem('businessNature',JSON.stringify(reqData));

					if(self.router.url.split('/')[2]=='csa-onboarding'){
						self.router.navigate(['/admin/csa-onboarding/review-service/'+btoa('edit')]);
					}else{
						self.router.navigate(['/admin/csa/review-service/'+btoa('edit')]);
					}
				}

			}else{
				this.isError = true;
			}
		}catch(err){
            this.global.addException('Add Business Nature','reviewBusiNature()',err);
        }
	}


  	addServiceDefinition(option, serDefData: any = {}){
		  this.submitted = false;
		  this.service_definitions.push(new FormGroup({
			service_definition_id: new FormControl(option == 1 ? serDefData.service_definition_id : ''),
			is_deleted: new FormControl(option == 1 ? (serDefData.is_deleted ? serDefData.is_deleted : '0') : '0'),
            service_definition: new FormControl(option == 1 ? serDefData.service_definition : '', [Validators.required,Validators.maxLength(200)]),
            description: new FormControl(option == 1 ? serDefData.description : ''),
			price: new FormControl(option == 1 ? serDefData.price : '', [
				Validators.required,
				Validators.maxLength(30),
				Validators.pattern(this.constant.AMOUNT_PATTERN)
				])
		  }));
  	}

	removeServiceDefinition(serTypeIndx){
		if(!this.getServiceTypeAt(serTypeIndx).get('service_definition_id').value){
			this.service_definitions.removeAt(serTypeIndx);
		}else{
			this.getServiceTypeAt(serTypeIndx).get('is_deleted').setValue('1');
		}
	}
}
