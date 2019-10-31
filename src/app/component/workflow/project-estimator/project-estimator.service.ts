import { Injectable} from '@angular/core';
//import { BehaviorSubject } from 'rxjs/BehaviorSubject';
//import { Validators } from '@angular/forms';

// import { ConstantsService } from '../../../shared/service/constants.service';
// import { ExportService } from '../../../shared/service/export.service';
// import { HttpService } from '../../../shared/service/http.service';
import { UtilService } from '../../../shared/service/util.service';
import { FileService } from '../../../shared/service/file.service';
import { GlobalService } from '../../../shared/service/global.service';
import { DialogComponent } from '../../../shared/model/dialog/dialog.component';

@Injectable()
export class ProjectEstimatorService {
	private formValidationStatus: any = {
		'servicesFm': false,
        'materialsFm': false,
		'scheduleFm': false,
		'paymentScheduleFm': false
	}

	projectEstimatorData: any = {};
	siteInspection: any = {};
	locationDetails: any = {
		'latitude': '',
    	'longitude': '',
    	'zoom': 18
	};
	constructor(private file: FileService, private util: UtilService, public global: GlobalService,){}

	updateFormStatus(form, status): void { this.formValidationStatus[form] = status; }
	getFormValidationStatus() { return this.formValidationStatus; }
	setFormValidationStatus(statusObj) { this.formValidationStatus = statusObj; }

	setResponseForPE(data){
			var self = this;
			try{
					self.projectEstimatorData = data;
					self.projectEstimatorData.reference_pe_id = data.project_estimate_id;
					self.projectEstimatorData.clientDetails= {
					"client_name": data.client_name,
					"client_id":data.client_id,"location":data.client_work_location,"location_id":data.client_work_location_id,
					"billingLocationSameAsWork":(data.client_work_location_id==data.client_billing_location_id)?true:false,
					"client_billing_location":data.client_billing_location,"client_billing_location_id":data.client_billing_location_id,
					"contact_name":data.contact_name,
					"email_id":data.email_id,
					"phone_no":data.phone_no,
                    "payment_term":data.payment_term,
					"requirements":data.requirements};

					self.projectEstimatorData.servicesDetails={"services_amount":data.costs ? self.projectEstimatorData.costs.cost_of_services:"","services":data.services};
                    console.log("data.services ::",data.services);
					// data.services.forEach(function (value,key) {
					// 	if(value.service_definition_id!=0)
					// 		self.projectEstimatorData.servicesDetails.services[key].service_definition = value.service_definition
					// 	else
					// 		self.projectEstimatorData.servicesDetails.services[key].service_definition =value.ad_hoc_service
					// });

					self.projectEstimatorData.materialsDetails={"materials_amount":data.costs ? data.costs.cost_of_materials:'',"materials":data.product_materials}

					
					self.projectEstimatorData.scheduleDetails =  data.schedule;

                    self.projectEstimatorData.imageDetails =  data.images;
					
					
				self.projectEstimatorData.paymentScheduleDetails={
					"cost_of_service":self.projectEstimatorData.costs.cost_of_services,
					"cost_of_material":data.costs.cost_of_materials,
					"sub_total":data.costs.subtotal,
					"total_cost":data.costs.total_cost,
					"tax_amount":data.costs.tax_amount,
					"shipping_handling":data.costs.shipping_handling,
					"adjustment":data.costs.adjustment,
					"taxes":data.costs.taxes,
                    "scheduleType":data.costs.scheduleType,
					"date_items":data.payment_schedules ? data.payment_schedules :[]
				};
				this.siteInspection = self.projectEstimatorData.site_inspections;
				let totalPaymentAmount = 0;
				data.payment_schedules.forEach(function (value,key) {
					self.projectEstimatorData.paymentScheduleDetails.date_items[key].payment_date = value.payment_date;
					self.projectEstimatorData.paymentScheduleDetails.date_items[key].amount = parseFloat(value.amount);
					totalPaymentAmount += parseFloat(value.amount);
				});
				self.projectEstimatorData.paymentScheduleDetails.totalPaymentAmount = totalPaymentAmount;
				
				return JSON.stringify(self.projectEstimatorData);
			}catch(err){
					this.global.addException('PE service','setResponseForPE()',err);
			}

	}


	saveProjectEstimator(action,option, callback){
		let self = this;
		let formData:FormData = new FormData();
		let quotationDetails = JSON.parse(sessionStorage.getItem('quotationDetails'));
		
		let paymentDetails: any = quotationDetails.paymentScheduleDetails;
		console.log("Details:"+ JSON.stringify(quotationDetails));
		let paymentSchedule: any[] = [];
		if(paymentDetails){
			JSON.parse(JSON.stringify(paymentDetails.date_items)).map(item => {
				if(item.payment_date != '' || item.amount_due != ''){
					if(item.payment_date != '')
						item.payment_date = this.util.getYYYYMMDDDate(new Date(item.payment_date));
					paymentSchedule.push(item);
				}
			});
		}
		
		if(action=='add'){
            formData.append('reference_pe_id', '0');
            formData.append('reference_version_string', quotationDetails.randomKey);
		}else if(action =='edit'){
			console.log("schedules:",quotationDetails.scheduleDetails);
			quotationDetails.servicesDetails.services.forEach(function(v){
				quotationDetails.services.forEach(function(va){
					if(va.service_definition_id == v.service_definition_id){
						v.pe_service_id = va.pe_service_id;
					}

                    if(v.service_definition_id == '' && va.service_definition_id!='' && va.service_definition.toLowerCase() == v.ad_hoc_service.toLowerCase()){
						v.pe_service_id = va.pe_service_id;
                        v.service_definition_id = va.service_definition_id;
					}
				});
			});

            quotationDetails.materialsDetails.materials.forEach(function(v){
				quotationDetails.product_materials.forEach(function(va){
					if(va.item_def_id == v.item_def_id){
						v.pe_product_material_id = va.pe_product_material_id;
					}
				});
			});

			if(quotationDetails.scheduleDetails && quotationDetails.scheduleDetails.start_date && quotationDetails.scheduleDetails.start_date.indexOf('-') > -1){
				quotationDetails.scheduleDetails.start_date = this.convertDate(quotationDetails.scheduleDetails.start_date);
				quotationDetails.scheduleDetails.end_date = this.convertDate(quotationDetails.scheduleDetails.end_date);
			}
            if(quotationDetails.schedule && quotationDetails.schedule.pe_schedule_id && quotationDetails.schedule.pe_schedule_id !=''){
                quotationDetails.scheduleDetails.pe_schedule_id = quotationDetails.schedule.pe_schedule_id;
            }
            formData.append('reference_pe_id', quotationDetails.project_estimate_id);
			formData.append('reference_version_string', quotationDetails.randomKey);
			if(paymentDetails)
				quotationDetails.subtotal = parseInt(paymentDetails.cost_of_service) + parseInt(paymentDetails.cost_of_material);
		}


        formData.append('client_id', quotationDetails.clientDetails.client_id );
        
        formData.append('contact_name', quotationDetails.clientDetails.contact_name );
        formData.append('email_id', quotationDetails.clientDetails.email_id );
        formData.append('phone_no', quotationDetails.clientDetails.phone_no );

        formData.append('client_work_location_id', quotationDetails.clientDetails.location_id );
		formData.append('client_billing_location_id', quotationDetails.clientDetails.billingLocationSameAsWork ? quotationDetails.clientDetails.location_id : quotationDetails.clientDetails.client_billing_location_id );
		
		formData.append('requirements', quotationDetails.clientDetails.requirements);
		quotationDetails.servicesDetails ? formData.append('services', JSON.stringify(quotationDetails.servicesDetails.services)) : '';
		quotationDetails.materialsDetails ? formData.append('item', JSON.stringify(quotationDetails.materialsDetails.materials)) : '';

		if(option == 'SEND_QUOTE'){
			formData.append('saveAndSend', '1');
		}
		if(quotationDetails.followUpDetails){
			formData.append('follow_up_by', JSON.stringify(quotationDetails.followUpDetails.inspector_follow));
			formData.append('follow_up_comment', JSON.stringify(quotationDetails.followUpDetails.comment));
		}
		let shipping = paymentDetails && paymentDetails.shipping_handling && paymentDetails.shipping_handling != '' && paymentDetails.shipping_handling != 0 ? parseFloat(paymentDetails.shipping_handling) : 0;
		let adjustment = paymentDetails && paymentDetails.adjustment && paymentDetails.adjustment != '' && paymentDetails.adjustment != 0 ? parseFloat(paymentDetails.adjustment) : 0;
		let tax = paymentDetails && paymentDetails.taxes && paymentDetails.taxes != '' && paymentDetails.taxes != 0 ? parseFloat(paymentDetails.taxes) : 0;
		formData.append('cost', JSON.stringify([{
			"shipping_and_handling": shipping,
			"adjustment": adjustment,
			"taxes": tax
		}]));
			quotationDetails.scheduleDetails ? formData.append('schedules', JSON.stringify([{
				"schedule_type": quotationDetails.scheduleDetails.schedule_type,
				"start_date": quotationDetails.scheduleDetails.start_date ? this.convertDate(quotationDetails.scheduleDetails.start_date) : '',
				"end_date": quotationDetails.scheduleDetails.end_date ?  this.convertDate(quotationDetails.scheduleDetails.end_date) : '',
				"start_time": quotationDetails.scheduleDetails.start_time ?  quotationDetails.scheduleDetails.start_time : '',
				"start_time_format": quotationDetails.scheduleDetails.start_time_format,
				"end_time": quotationDetails.scheduleDetails.end_time ?  quotationDetails.scheduleDetails.end_time : '',
				"end_time_format": quotationDetails.scheduleDetails.end_time_format,
                "pe_schedule_id": quotationDetails.scheduleDetails.pe_schedule_id
			}])) : '';
        if(option == 'APPROVE'){
			formData.append('status', '5');
			formData.append('approve_note', quotationDetails.approveNote ? quotationDetails.approveNote : '');
		}else if(option == 'SEND_QUOTE'){
			formData.append('status', '4');
		}else{
			formData.append('status', '1');
		}
			// * PE_STATUS 1 Saved
			// * PE_STATUS 2 Scheduled
			// * PE_STATUS 3 Changed
			// * PE_STATUS 4 Sent
			// * PE_STATUS 5 Approved
			// * PE_STATUS 6 Rejected
            // * PE_STATUS 7 Expired
            // * PE_STATUS 8 Expired
        let reqObj =  { "images": [] };
            if(this.projectEstimatorData.images){
                for ( let i = 0; i < this.projectEstimatorData.images.length; i++) {
                const documents = {
                        "attachment_type": this.projectEstimatorData.images[i].attachment_type,
                        "attachment_name": this.projectEstimatorData.images[i].attachment_name,
                        "attachment_path": this.projectEstimatorData.images[i].attachment_path,
                        "attachment_id": this.projectEstimatorData.images[i].attachment_id,
                        "is_delete": 0,
                    };
                reqObj.images.push(documents);
                }
                if(this.projectEstimatorData.imagesDeleted){
                    for ( let i = 0; i < this.projectEstimatorData.imagesDeleted.length; i++) {
                    const documentsDeleted = {
                            "attachment_type": this.projectEstimatorData.imagesDeleted[i].attachment_type,
                            "attachment_name": this.projectEstimatorData.imagesDeleted[i].attachment_name,
                            "attachment_path": this.projectEstimatorData.imagesDeleted[i].attachment_path,
                            "attachment_id": this.projectEstimatorData.imagesDeleted[i].attachment_id,
                            "is_delete": 1,
                        };
                    reqObj.images.push(documentsDeleted);
                    }
                }


                formData.append('images', JSON.stringify(reqObj.images));
            }
            

		formData.append('payment_schedule', JSON.stringify(paymentSchedule));
		this.file.formDataAPICall(formData, 'quotation/save', function(error: boolean, response: any){

			return callback(error, response);
            
        });
	}

	convertDate(dateStr){
		if(dateStr == ""){ return "" };
		if(dateStr.indexOf('/') > -1){
			return this.util.getYYYYMMDDDate(this.util.stringToDate(dateStr));
		}else{
			return this.util.getYYYYMMDDDate(new Date(dateStr));
		}
	}
}
