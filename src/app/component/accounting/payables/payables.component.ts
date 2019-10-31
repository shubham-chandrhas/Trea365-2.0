import { Component, OnInit, ApplicationRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, FormGroup, FormBuilder, FormArray, Validators, NgForm, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import * as _ from 'underscore';

import { UtilService } from '../../../shared/service/util.service';
import { HttpService } from '../../../shared/service/http.service';
import { ConstantsService } from '../../../shared/service/constants.service';
import { GlobalService } from '../../../shared/service/global.service';
import { DialogComponent } from '../../../shared/model/dialog/dialog.component';
import { ExportService } from '../../../shared/service/export.service';
import { FileService } from '../../../shared/service/file.service';

@Component({
    selector: 'app-payables',
    templateUrl: './payables.component.html',
    styleUrls: ['./payables.component.css']
})
export class PayablesComponent implements OnInit {
    public payablesList: any[] = [];
    public paymentSchedules: any[] = [];
    public paidPaymentList: any[] = [];
    public selectedPayable: any;
    public selectedIndex;
    public sortColumn: string = 'pay_id';
    public sortOrder: string = 'DSC';
    public columnType: string = 'N';
    public searchData: any = {};
    public searchList;
    public searchTxt: string;
        public OrderStatus;
        public DueDate;
        public Status;
        public SuplierName;
        public PONumber;
        public DueAmt;
        public RemainingAmt;
    public listCount: number = 0;
    public paginationKey: any;
    public errMsg: string = '';
    public isError: boolean = false;
    public editTab: string = '';
    public isEdit: boolean = false;
    public submitted: boolean = false;
    public fileUploaded: any[] = [];
    today: any = new Date();
    pageData: any = { 'attributeList': [{ 'label': '', 'format': '' }], 'errMsg': '', 'isError': false, 'isAttributeError': false, 'newFileUpload': false, 'isThumbnailSet': false, 'dragOver': false, 'imgDocPriArr': [] }
    public onBoarding: boolean = false;
    public addPayment: FormGroup;
    timeLineData: any = { 'thirty': false, 'sixty': false, 'ninty': false, 'oneEighty': false };

    constructor(
        private fb: FormBuilder,
        public dialog: MatDialog,
        public util: UtilService,
        public router: Router,
        private http: HttpService,
        public constant: ConstantsService,
        private global: GlobalService,
        private file: ExportService,
        private fileService: FileService,
        private ref: ApplicationRef,
        public route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit() {
        let self = this;
        this.today.setHours(0, 0, 0, 0);
        self.util.menuChange({ 'menu': 7, 'subMenu': 37 });
        this.util.setPageTitle(this.route);
        self.paginationKey = { itemsPerPage: self.constant.ITEMS_PER_PAGE, currentPage: self.constant.CURRENT_PAGE };
        self.util.setWindowHeight();
        this.getPayableList('');

        this.util.changeDetection.subscribe(dataObj => {
            if (dataObj && dataObj.source == 'UPDATE_PAYMENT') {
                this.getPayableList('', 'REFRESH');
                this.isEdit = false;
                this.editTab = '';
            }
        });
    }

    getSearchTxt(filterValue: string) { if (filterValue == '') { this.searchTxt = '' } }
    updateCount(count) { this.constant.ITEM_COUNT = this.listCount = count; }
    generatepdf() { this.file.generatePortraitpdf('payable-tbl', 'Payable List', 'payable_list'); }
    generatecsv() { this.file.generatecsv('payable-csv-tbl', 'payable_list'); }

    showImage(url, invoices) {
        if (url) {
            this.dialog.open(DialogComponent, { data: { 'action': 'invoice', 'url': url, 'invoices': invoices } });
            this.ref.tick();
        }
    }

    getPayableList(days:any = '', origin: string = 'INIT'): void {

        let self = this;

        if (origin == 'INIT') { this.selectedIndex = null;}

        let url = days ? `financials/payables/${days}` : `financials/payables`;

        try {

            this.util.showProcessing('processing-spinner');

            this.http.doGet(url, function (error: boolean, response: any) {
                self.util.hideProcessing('processing-spinner');
                if (error) { 

                    self.onBoarding = false;
                    self.payablesList = [];
                    self.util.showAlert(response.message);
                    self.global.addException("Payables List", "getPayableList()", response);  

                 } else {

                    let requestData = response.data;
                    self.payablesList = response.data.payables;
                    self.pageData.totalAmountDue = requestData.total_amount_due;
                    self.pageData.amountRemaining = requestData.total_amount_remaining;

                    if (origin == 'REFRESH') {

                        setTimeout(() => {
                            if (self.payablesList.filter(item => item.id == self.selectedPayable.id).length > 0) {
                                self.getSelectedPayable(self.payablesList.filter(item => item.id == self.selectedPayable.id)[0], self.selectedIndex);
                            } else {
                                self.selectedIndex = null;
                                self.selectedPayable = null;
                            }

                        }, 50);
                    }
                    self.route.snapshot.paramMap.get('id') != '0' ? self.showPayDetails() : '';

                    if (self.payablesList.length == 0) {
                        self.onBoarding = true;
                    }
                }
                
            });
        } catch (err) {
            this.global.addException('Payable', 'getPayableList()', err);
        }

    }

    showPayDetails() {
        let sortedList: any[] = _.sortBy(this.payablesList, 'pay_id');
        for (var i = 0; i < sortedList.length; ++i) {
            if (this.route.snapshot.paramMap.get('id') == sortedList[i].id) {
                this.getSelectedPayable(sortedList[i], i);
                this.selectedIndex = i;
                break;
            }
        }
    }

    getSelectedPayable(item, index) {

        if (!this.util.canAccess('payables_details')) {
            return false;
        }

        let self = this;
        this.isEdit = false;

        try {

            this.util.showProcessing('processing-spinner');

            this.http.doGet(`financials/payables/details/${item.type}/${item.payment_schedule_id}`,
            (error: boolean, response: any) =>  {

                self.util.hideProcessing('processing-spinner');

                if (error) { 

                    self.util.showAlert(response.message);
                    self.global.addException("Payable Details", "getSelectedPayable()", error);

                } else {

                    let requestData = response.data;

                    self.selectedPayable = response.data;

                    self.location.go(self.location.path().split('/').splice(0, self.location.path().split('/').length - 1).join('/') + '/' + item.id);

                    setTimeout(function() {
                        self.util.scrollDown('payMark');
                    }, 1000);

                    this.createForm();

                    this.addPayment.patchValue(
                        {
                            "id": requestData.id,
                            "payment_schedule_id": requestData.payment_schedule_id,
                            "type": requestData.type,
                            "payments": requestData.paid_payments.payments
                        }
                    );

                }

            });

        } catch (err) {

            this.global.addException('Payable Details', 'getSelectedPayable()', err);
        }
    }

    public uploadFile() {

    }

    public onFileChange(event) {
        let self = this;
        let extension: string = '';
        let fileDetailsObj: any = {};
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let imgCount = 0;
            self.addImg(imgCount, fileList, fileDetailsObj, extension);
        }
    }
    addImg(imgCount: number, fileList, fileDetailsObj, extension) {
        let self = this;
        let file: File = fileList[imgCount];
        try {
            fileDetailsObj = {};
            fileDetailsObj.thumbnail = 0;
            fileDetailsObj.fileName = fileList[imgCount] && fileList[imgCount].name ? fileList[imgCount].name : '';
            extension = fileList[imgCount].name.split('.').pop();

            if (extension == 'pdf') {

                if ((fileList[imgCount].size / 1048576) < 10) {

                    self.convertToBase64(file, function (base64) {
                        fileDetailsObj.imgPath = JSON.parse(JSON.stringify(base64));;
                        fileDetailsObj.description = '';
                        fileDetailsObj.extension = extension;
                        fileDetailsObj.file = file
                        self.fileUploaded.push(fileDetailsObj);
                        self.ref.tick();

                        if (imgCount < fileList.length - 1)
                            return self.addImg(++imgCount, fileList, fileDetailsObj, extension);
                    });

                    self.util.addSpinner('upload-btn', "Upload");
                    let formData: FormData = new FormData();
                    formData.append('po_payment_schedule_id', self.selectedPayable.po_payment_schedule_id ? self.selectedPayable.po_payment_schedule_id : '');
                    formData.append('wo_payment_schedule_id', self.selectedPayable.wo_payment_schedule_id ? self.selectedPayable.wo_payment_schedule_id : '');
                    formData.append('fileUploaded1', file);
                    formData.append('fileCount', '1');

                    formData.append("file", file);

                    self.fileService.formDataAPICall(formData, 'attachments/upload',  (error: boolean, response: any) => {

                        

                        if (error) {

                            self.isError = true;
                            self.errMsg = response.message;

                        } else {
                            
                            let requestData = response.data;

                            this.http.doPost('financials/payables/invoice-upload', {
                                    "payment_schedule_id": this.selectedPayable.payment_schedule_id,
                                    "type"            : this.selectedPayable.type,
                                    "attachment_type" : 2,
                                    "attachment_name" : requestData.file_name,
                                    "attachment_path" : requestData.file_path

                                },  (error: boolean, response: any) => {

                                self.util.removeSpinner('upload-btn', "Upload");
                                
                                if (error) {

                                    self.isError = true;
                                    self.errMsg = response.message;

                                } else {

                                    self.util.showDialog(DialogComponent, response.message, ['/account/csa/acc-payables/0']);

                                    self.util.changeEvent({
                                        'source': 'UPDATE_PAYMENT',
                                        'action': 'EDIT',
                                        'data': ''
                                    });
                                }
                                
                            });
                        }
                    })

                    self.pageData.isError = false;

                } else {
                    self.pageData.errMsg = "File must be less than 10 MB.";
                    self.pageData.isError = true;
                    self.ref.tick();
                }
            } else {
                self.pageData.isError = true;
                self.pageData.errMsg = 'Only pdf file allowed.';
                self.ref.tick();
            }
        } catch (err) {
            this.global.addException('Payable', 'getSelectedPayable()', err);
        }
    }
    convertToBase64(file, callback) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (fileLoadedEvent: any) => {
            return callback(fileLoadedEvent.target.result);
        };
    };

    createForm() {

        this.addPayment = this.fb.group({
            id       : new FormControl('', [Validators.required]),
            type     : new FormControl('', [Validators.required]),
            payments : this.fb.array([]),
            payment_schedule_id : new FormControl('', [Validators.required]),
        });

    }

    paidPayments(key): FormArray { return <FormArray>this.addPayment.get(key) as FormArray; }

    /**
     * Add new row of payment
     */
    addPaymentTerms() {

        let self = this;

        try {

            this.paidPayments('payments').push(this.fb.group({
                payment_date        : new FormControl('', [Validators.required]),
                payment_amount      : new FormControl('', [Validators.required, Validators.pattern(this.constant.AMOUNT_PATTERN)]),
                payment_method      : new FormControl('', [Validators.required]),
                reference           : new FormControl('', [Validators.required])
            }));

        } catch (err) {

            this.global.addException('Payable', 'addPaymentTerms()', err);
        }
    }

    removePaidPayment(index) {
        this.paidPayments('payments').removeAt(index);
    }

    public edit() {
        this.editTab = 'edit';
        this.isEdit = true;
        this.submitted = false;
    }
    public cancelEdit() {
        this.editTab = '';
        this.isEdit = false;
        this.isError = false;
        this.submitted = false;
    }
    public update() {

        this.submitted = true;

        try {

            if (this.addPayment.valid) {

                let self = this;

                self.util.addSpinner('update-btn', 'Update');

                let totalPay = 0.00;

                this.addPayment.value.payments.forEach(function(element) { totalPay += parseFloat(element.payment_amount); });

                let amount_remaining = parseFloat(self.selectedPayable.amount_remaining);

                let result = self.util.idOverriedAmount(totalPay, amount_remaining);

                if (result) {

                    self.isError = true;

                    self.errMsg  = result;

                    self.util.removeSpinner('update-btn', 'Update');

                } else {

                    this.http.doPost('financials/payables/save-payments', this.addPayment.value,  (error: boolean, response: any) => {

                        self.util.removeSpinner('update-btn', 'Update');

                        if (error) {

                            self.isError = true;
                            self.errMsg = response.message;
                        } else {

                            self.isError = false;
                            self.errMsg = "";
                            self.util.showDialog(DialogComponent, response.message, ['/account/csa/acc-payables/0']);

                            self.util.changeEvent({
                                'source': 'UPDATE_PAYMENT',
                                'action': 'EDIT',
                                'data': ''
                            });
                        }
                    });
                }
            }

        } catch (err) {

            this.global.addException('Add Paid Payment', 'update()', err);
        }
    }

    timeLineChange(event, id) {
        this.timeLineData.thirty = id == 'thirty' ? true : false;
        this.timeLineData.sixty = id == 'sixty' ? true : false;
        this.timeLineData.ninty = id == 'ninty' ? true : false;
        this.timeLineData.oneEighty = id == 'oneEighty' ? true : false;
        this.getPayableList(event.target.value);
    }

}
