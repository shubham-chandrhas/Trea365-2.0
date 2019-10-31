import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';
import { GlobalService } from '../../../../shared/service/global.service';

@Component({
    selector: 'app-review-service',
    templateUrl: './review-service.component.html',
    styleUrls: ['./review-service.component.css']
})
export class ReviewServiceComponent implements OnInit {

    public errMsg: string = '';
    public isError: boolean = false;
    public businessNatureObj: any;
    public action: any;
    private routeObj: any;

    constructor(
        private util: UtilService,
        private router: Router,
        private route: ActivatedRoute, 
        private http: HttpService,
        private global: GlobalService
    ) { 
        if(sessionStorage.getItem('businessNature')){
            this.businessNatureObj = JSON.parse(sessionStorage.getItem('businessNature'));
            this.action = atob(this.route.snapshot.paramMap.get('action'));
        }else{
            this.router.navigate(['/admin/csa/service/0']);
        }
    }

    ngOnInit() {
        this.util.setWindowHeight();
        this.util.setPageTitle(this.route);
        try{
            if(this.router.url.split('/')[2]=='csa-onboarding'){
                this.util.menuChange({'menu':'guide','subMenu':''}); //for onboarding dashboard
                this.routeObj = { 'list': '/csa-onboarding/guide', 'add': '/admin/csa-onboarding/add-service/'+btoa('0'), 'edit': '/admin/csa-onboarding/add-service/'+btoa('1') }
            }else{
                this.util.menuChange({'menu':2,'subMenu':11});
                this.routeObj = { 'list': '/admin/csa/service/0', 'add': '/admin/csa/add-service/'+btoa('0'), 'edit': '/admin/csa/add-service/'+btoa('1') }
            }
        }catch(err){
            this.global.addException('Review Business Nature','ngOnInit()',err);
        }
    }

    submitDetails(): void {
        this.action == 'add' ? this.submitAPICall('Submit', 'service-type/create', this.businessNatureObj, [this.routeObj.list, this.routeObj.add]) :this.submitAPICall('Update', 'service-type/update', this.businessNatureObj, [this.routeObj.list]);
    }

    submitAPICall(btnTxt, API_URL, reqObj, routeArr): void {
        var self = this;
        self.isError = false;
        self.errMsg = "";
        try{
            self.util.addSpinner('addBusiNature', btnTxt);
            this.http.doPost(API_URL, reqObj, function(error: boolean, response: any){
                self.util.removeSpinner('addBusiNature', btnTxt);
                if(error){
                    self.isError = true;
                    self.errMsg = response.message;
                }else{
                    sessionStorage.removeItem('businessNature');
                    self.util.showDialog(DialogComponent, response.message, routeArr);
                }
            });
        }catch(err){
            this.global.addException('Review Business Nature','submitAPICall()',err);
        }
    }

    goToEditDetails(): void{ this.action == 'add' ? this.router.navigate([this.routeObj.add]) : this.router.navigate([this.routeObj.edit]); }

    cancelSubmitAction(): void{ this.router.navigate([this.routeObj.list]); }

}
