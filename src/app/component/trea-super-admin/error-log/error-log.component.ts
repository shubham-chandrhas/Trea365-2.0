
import { Component, OnInit } from '@angular/core';

import { HttpService } from '../../../shared/service/http.service';
import { UtilService } from '../../../shared/service/util.service';
import { ConstantsService } from '../../../shared/service/constants.service';
import { GlobalService } from '../../../shared/service/global.service';
import { ActivatedRoute } from '@angular/router';
import { FileService } from '../../../shared/service/file.service';
import {FormControl, NgForm, Validators, FormGroup, FormBuilder} from '@angular/forms';
import * as moment from "moment";

@Component({
  selector: '',
  templateUrl: './error-log.html',
  styleUrls: ['./error-log.css']
})

export class ErrorLogComponent implements OnInit {
  public errMsg: string = '';
  public isError: boolean = false;
  public submitted: boolean = false;
  public sortColumn: string = 'error_id';
  public sortOrder: string = 'DSC';
  public sortColumnType:string = "N";
  public ErrorList: any = '';
  public searchTxt: string;
  public paginationKey: any;
  public listCount: number = 0;
  public selectedLog: any = null;
  updLogFm: FormGroup;

  public nameSearch;
  public typeSearch;
  public urlSearch;
  public responseSearch;
  public prioritySearch;
  public assignToSearch;
  public statusSearch;
  public statusList ="New";
  public errorSearch;
  public createdSearch;
  public timezone: number;

  searchList;
  paginationItems: any[] = [100, 200, 300, 400, 500, 1000];
  selectedIndex;
  constructor(
    private http: HttpService,
    public util: UtilService,
    public constant: ConstantsService,
    private global: GlobalService,
    public route: ActivatedRoute,
    private fb: FormBuilder,
    private file: FileService,
  ) {
    const timeZoneOffset = new Date().getTimezoneOffset();

    const self = this;
    self.ErrorList = [];
    // this.paginationKey = { itemsPerPage: this.constant.ITEMS_PER_PAGE, currentPage: this.constant.CURRENT_PAGE };
  }
  ngOnInit() {
    this.paginationKey = {
      itemsPerPage: 100,
      currentPage: this.constant.CURRENT_PAGE
    };
    this.errorLogList();
    this.util.setWindowHeight();
    this.createForm();
    this.util.setPageTitle(this.route);

  }
  errorLogList() {
    this.util.showProcessing("processing-spinner");
    try {
      this.http.doGet("company/error-log", (error: boolean, response: any) => {
        if (error) {
          this.util.showAlert(response.message);
          // this.util.showAlertToast("Suspended", response.message);
          this.util.hideProcessing("processing-spinner");
           this.global.addException('Error Log', 'errorLogList()', response);
        } else {
          this.ErrorList = response.data;
          this.ErrorList.map((item) => {
              item.created_at_unix = moment.unix(item.created_at_unix).format("DD/MM/YYYY hh:mm:ss a");
          });
          this.constant.ITEM_COUNT = response.data.length;
          this.util.hideProcessing("processing-spinner");
        }
      });
    } catch (err) {
      this.global.addException('Error Log', 'errorLogList()', err);
    }
  }
  changePage(event) {
    this.paginationKey.currentPage = event;
    window.scrollTo(0, 0);
  }
  changeItemPerPage() {
    window.scrollTo(0, 0);
  }
  getSearchTxt(filterValue: string) {
    if (filterValue == '') {
      this.searchTxt = ''
    }
  }
  updateCount(count) {
    this.constant.ITEM_COUNT = count;
    this.listCount = count;
  }
  apiPos(string) {

    return string.indexOf('api');
  }

  public createForm() {
    this.updLogFm = this.fb.group({
      assign_to: new FormControl('', [
        Validators.required
      ]),
      status: new FormControl('', [
        Validators.required,
      ]),
      comment: new FormControl(''),
    });
  }

  get assign_to() {
    return this.updLogFm.get('assign_to');
  }
  get status() {
    return this.updLogFm.get('status');
  }
   get comment() {
    return this.updLogFm.get('comment');
  }

  updateLog(form: NgForm, error_id): void {
    this.errMsg = '';
    this.isError = false;
    this.submitted = true;
    console.log(form);
    try {
      if (form.valid) {
        this.ErrorList = [];
        this.util.showProcessing('processing-spinner');
        this.util.addSpinner('assign-btn', "Submit");
        let formData: FormData = new FormData();
        formData.append('error_id', error_id);
        formData.append('assign_to', form.value.assign_to);
        formData.append('status', form.value.status);
        formData.append('comment', form.value.comment);

        this.file.formDataAPICall(formData, 'company/error-log/update', (error: boolean, response: any) => {
          this.util.removeSpinner('assign-btn', "Submit");
           this.util.hideProcessing('processing-spinner');
          if (error) {
            this.errMsg = response.message;
            this.isError = true;
             this.global.addException('Error Logs', 'updateLog()', response);
          } else {
            this.errorLogList();
            this.getSelectedLog(response.data, 1);
          }
        });
      } else {}
    } catch (err) {
      this.global.addException('Error Logs', 'updateLog()', err);
    }
  }


  applyFilter(filterValue: string) {

  }
  getSelectedLog(error, index) {
    this.selectedIndex = index;
    this.selectedLog = error;
    console.log(typeof error.created_at_unix );
    if (typeof error.created_at_unix == "number") {
          this.selectedLog.created_at_unix = moment.unix(this.selectedLog.created_at_unix).format("DD/MM/YYYY hh:mm:ss a");
    }
    setTimeout(() => {
      this.util.scrollDown('maintenanceMark');
    }, 1000);
  }

}
