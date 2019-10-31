import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { HrService } from '../../hr.service';
import { FileService } from '../../../../shared/service/file.service';
import { UtilService } from '../../../../shared/service/util.service';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';
import { GlobalService } from '../../../../shared/service/global.service';

@Component({
    selector: 'app-sub-contractor-review',
    templateUrl: './sub-contractor-review.component.html',
    styleUrls: ['./sub-contractor-review.component.css']
})
export class SubContractorReviewComponent implements OnInit {
    empObj: any;
    errMsg = '';
    isError = false;
    submitted = false;
    action: string = 'add';
    private routeObj: any;
    isTSA:boolean = false; //if Trea Super Admin is logged in
    routStrArr;
    loggedInUser;
    //defaultLocation : string = "";
    constructor(
        public util: UtilService, 
        private file: FileService, 
        public router: Router, 
        private route: ActivatedRoute,
        private hr: HrService,
        public dialog: MatDialog,
        private global: GlobalService
    ){
        this.empObj=JSON.parse(sessionStorage.getItem('SUBCONTRACTOR_ADD'));
        this.action = this.empObj.id != 0 ? 'edit' : 'add';
    }

    wage_frequencies_array = [
        { 1: 'Hourly' },
        { 2: 'Weekly' },
        { 3: 'Bi-Weekly' },
        { 4: 'Monthly' }
    ]

    ngOnInit() {
        try{
            this.router.url.split('/')[2] == 'csa-onboarding' ? (this.util.menuChange({'menu':'guide','subMenu':''}),
            this.routeObj = { 
                'list': '/csa-onboarding/guide', 
                'add': '/hr/csa-onboarding/add-subcontractor' 
            }) : (this.util.menuChange({'menu':6,'subMenu':29}),
            this.routeObj = { 'list': '/hr/csa/sub-contractor-list/0', 'add': '/hr/csa/add-subcontractor' });  

            this.routStrArr = this.router.url.split('/');
            this.loggedInUser = JSON.parse(atob(localStorage.getItem('USER')));
            if(this.loggedInUser.role_id == '1'){
                this.routeObj = { 'list': '/su/tsa/users-list/'+this.routStrArr[this.routStrArr.length - 1]+'/0', 'add': '/su/tsa/add-user/'+this.routStrArr[this.routStrArr.length - 1] }
            }
        }catch(err){
            this.global.addException('employee review','ngOnInit()',err);
        }
        this.util.setPageTitle(this.route);
        
    }

    addEmp(){
        let self = this;
        this.errMsg = '';
        this.isError = false;
        this.submitted = true;
        let imgDocPriArr = this.util.getDocumentObj();
        try {

            let reqObject:any = JSON.parse(JSON.stringify(this.empObj));

            let thumbnail: number = -1;

            let url;

            if (this.loggedInUser.role_id == '1'){

                url = reqObject.id != 0 ? 'hr/sub-contractors/edit/'+this.routStrArr[this.routStrArr.length - 1] : 'hr/sub-contractors/add/'+this.routStrArr[this.routStrArr.length - 1] ;
            } else{

                url = reqObject.id != 0 ? 'hr/sub-contractors/edit' : 'hr/sub-contractors/add' ;
            }

            let empFormData = {
                "id"            : reqObject.id ? reqObject.id : '',
                "first_name"    : reqObject.first_name,
                "last_name"     :  reqObject.last_name,
                "employee_id"   : reqObject.employee_id,
                "username"      : reqObject.username,
                "designation"   : reqObject.designation,
                "country_code"  : self.util.getCountryCode(),
                "mobile_no"     : self.util.unMaskPhoneNumber(reqObject.mobile_no),
                "email_id"      : reqObject.email_id,
                "work_phone"    : reqObject.work_phone ? self.util.unMaskPhoneNumber(reqObject.work_phone) : '' ,
                "title"             : reqObject.title,
                "wage_frequency"    : reqObject.wage_frequency ? parseInt(reqObject.wage_frequency) : '',
                "hourly_cost"       : parseFloat(reqObject.hourly_cost),
                "emergency_contact" : reqObject.emergency_contact,
                "emergency_number"  : self.util.unMaskPhoneNumber(reqObject.emergency_number),
                "relationship"      : reqObject.relationship,
                "address_line_1"    : reqObject.address_line_1,
                "address_line_2"    : reqObject.address_line_2,
                "country_id"        : reqObject.countryId,
                "postal_code"       : reqObject.postalCode,
                "latitude"          : reqObject.latitude,
                "longitude"         : reqObject.longitude,
                "user_services"     : reqObject.user_services ? (reqObject.user_services).filter( (el) => el) : [],
                "days_off"          : reqObject.selectedDaysOff,
                "extra_fields"      : reqObject.extra_fields,
                "attachments"       : reqObject.attachments
            };

            if (reqObject.id ) {
                Object.assign(empFormData, {'user_id' : reqObject.id });
            }
            
            self.util.addSpinner('add-emp-btn', "Submit");

            this.file.formDataAPICall(empFormData, url, function(error: boolean, response: any){
                self.util.removeSpinner('add-emp-btn', "Submit");
                if( error ){
                    self.errMsg = response.message;
                    self.isError = true;
                }else{    
                    sessionStorage.removeItem('SUBCONTRACTOR_ADD');
                    self.util.showDialog(DialogComponent, response.message,  reqObject.id != 0 ? [self.routeObj.list] : [self.routeObj.list, self.routeObj.add]);
                }        
            });
        }
        catch(err){
            this.global.addException('employer review','addEmp()',err);
        }
    }

    cancel(): void {
        sessionStorage.removeItem('SUBCONTRACTOR_ADD');
        if(this.loggedInUser.role_id == '1'){
            this.router.navigate(['/su/tsa/users-list/'+this.routStrArr[this.routStrArr.length - 1]+'/0' ]);
        }else{
            this.router.navigate([this.routeObj.list]);
        }
    }

    editEmp(): void {
        sessionStorage.setItem('previousPage', 'review');
        
        if(this.loggedInUser.role_id == '1'){
            this.router.navigate(['/su/tsa/add-user/'+this.routStrArr[this.routStrArr.length - 1] ]);
        }else{
            this.router.navigate([this.routeObj.add]);
        }
    }
}
