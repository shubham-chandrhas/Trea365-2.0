import { Component, OnInit, ApplicationRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import * as _ from 'underscore';

import { ConstantsService } from '../../../../shared/service/constants.service';
import { UtilService } from '../../../../shared/service/util.service';
import { HttpService } from '../../../../shared/service/http.service';
import { GlobalService } from '../../../../shared/service/global.service';
import { AdminService } from '../../../admin/admin.service';
import { DialogComponent } from '../../../../shared/model/dialog/dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AccountingDialog } from '../../accounting-dialog.component';

@Component({
	selector: 'app-ledger-list',
	templateUrl: './ledger-list.component.html',
	styleUrls: ['./ledger-list.component.scss']
})
export class LedgerListComponent implements OnInit {

    public selectedLedger: any = null;
    public ledgerList: any[] = [];
  	public sortColumn: string = 'invoice_id';
    public sortColumnType: string = 'N';
    public sortOrder: string = 'DSC';
    public searchList: string;
    public searchTxt: string;
    public statusSearch;
    public dateSearch;
    public clientSearch;
    public invoiceNoSearch;
    public amountSearch;
    public paginationKey:any;
    public listCount:number = 0;
    public selectedIndex: number;
    public minDate = new Date();
    public errMsg:string = '';
    public isError:boolean = false;
    public routeObj:any;
    creditAmountSearch;
    descriptionSearch;
    timeLineData: any = { 'thirty': false, 'sixty': false, 'ninty': false, 'oneEighty': false };
    pageData:any = {};

    public showInvoice:boolean = false;
    public showPo:boolean = false;

    public onBoarding:boolean = false; 

    constructor(
        public dialog: MatDialog,
        public util:UtilService,
        public constant:ConstantsService,
        private ref: ApplicationRef,
        public http:HttpService,
        public global:GlobalService,
        private admin: AdminService,
        public router: Router,
        public route: ActivatedRoute,
        private fb: FormBuilder,
        private location: Location
    ) { }

  	ngOnInit() {
  		let self = this;
        this.util.setWindowHeight();
        this.util.setPageTitle(this.route);
        this.routeObj = { 'list': 'financials/ledger', 'add': '/account/csa/create-ledger' }
        try{
            this.paginationKey = { itemsPerPage: this.constant.ITEMS_PER_PAGE, currentPage: this.constant.CURRENT_PAGE };
            this.util.menuChange({'menu':7,'subMenu':34});
            this.util.setWindowHeight();
            this.getLedger();
        }catch(err){
            this.global.addException('Ledger List', 'ngOnInit()', err);
        }
  	}
  	changePage(event){
        this.paginationKey.currentPage = event;
        window.scrollTo(0, 0);
    }
    changeItemPerPage(){
        window.scrollTo(0, 0);
    }
    updateCount(count){ this.constant.ITEM_COUNT = count ;this.listCount = count; }
    getSearchTxt(filterValue: string) { if(filterValue == ''){ this.searchTxt = '' } }
    sortList(columnName: string, sortType){
        this.sortColumn = columnName;
        this.sortColumnType = sortType;
        if(this.sortColumn === columnName){
            if(this.sortOrder === 'ASC')
                this.sortOrder = 'DSC';
            else
                this.sortOrder = 'ASC';
        }else{
            this.sortOrder = 'ASC';
        }
    }

    getLedger(days:any = ''){

      let self = this;

        this.selectedIndex = null;

        try {

            this.util.showProcessing('processing-spinner');

            let url = days ? `financials/ledger/${days}` : `financials/ledger`;

            this.http.doGet(url, function(error: boolean, response: any){
                self.util.hideProcessing('processing-spinner');
                if(error){ 
                    self.onBoarding = false;
                    self.ledgerList = [];
                    self.util.showAlert(response.message);
                    self.global.addException("Ledger List", "getLedger()", response);
                 } else{

                    let requestData = response.data;

                    self.pageData.totalDebit = requestData.total_debit;
                    self.pageData.totalCredit = requestData.total_credit;
                    self.ledgerList = response.data.ledgers;
                    
                    self.route.snapshot.paramMap.get('id') != '0' ? self.showLedgerDetails() : '';

                    if(self.ledgerList.length == 0) {
                        self.onBoarding = true;
                    }
                }

                

            });

        } catch(err) {

            this.global.addException('Ledger List','getLedger()',err);
        }
    }

    showLedgerDetails(){
        let sortedList: any[] = _.sortBy(this.ledgerList, 'invoice_id').reverse();
        for (var i = 0; i < sortedList.length; ++i) {
            if(this.route.snapshot.paramMap.get('id') == sortedList[i].invoice_id){
                this.getSelectedLedger(sortedList[i], i);
                this.selectedIndex = i;
                break;
            }
        }
    }

    /**
     * Get the ledger details
     * @param ledger row
     * @param indx 
     * @return void
     */

    getSelectedLedger(ledger, indx) 
    {

        let self = this;

        this.selectedIndex = null;

        try {

            this.util.showProcessing('processing-spinner');

            this.http.doGet(`financials/ledger/details/${ledger.ledger_id}`, (error: boolean, response: any) => {

                self.util.hideProcessing('processing-spinner');

                if (error){ 
                    self.util.showAlert(response.message);
                    self.global.addException("Get Selected Ledger", "getSelectedLedger()", error);
                } else{

                    self.selectedLedger = response.data;

                    self.location.go(self.location.path().split('/').splice(0, self.location.path().split('/').length - 1).join('/')+'/'+ledger.ledger_id);
                    
                    setTimeout(function() {
                        self.util.scrollDown('ledgerMark');
                    }, 1000);
                }

                if (self.ledgerList.length == 0) {

                    self.onBoarding = true;
                }

            });

        } catch(err) {

            this.global.addException('Ledger List','getSelectedLedger()',err);
        }
        
    }

    timeLineChange(event,id){
        this.timeLineData.thirty = id == 'thirty' ? true : false;
        this.timeLineData.sixty = id == 'sixty' ? true : false;
        this.timeLineData.ninty = id == 'ninty' ? true : false;
        this.timeLineData.oneEighty = id == 'oneEighty' ? true : false;
        this.getLedger(event.target.value);
    }

}
