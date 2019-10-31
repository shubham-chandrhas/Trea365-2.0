import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  FormControl,
  FormGroupDirective,
  Validators,
  FormGroup,
  FormBuilder,
  FormArray
} from "@angular/forms";

import { Router, ActivatedRoute } from "@angular/router";
// import { HrService } from '../../hr/hr.service';
import { AdminService } from "../../admin/admin.service";
import { UtilService } from "../../../shared/service/util.service";
import { HttpService } from "../../../shared/service/http.service";
import { FileService } from "../../../shared/service/file.service";
import { AppConfig, APP_CONFIG } from "../../../app-config.module";

@Component({
  selector: "app-onboard-dialog",
  templateUrl: "./onboarding-guide-dialog.component.html",
  styleUrls: ["./onboarding-guide.component.css"]
})
export class OnboardingGuideDialogComponent implements OnInit {
  public action: string;
  public errMsg = "";
  public successMsg = "";
  // public field: string = '';
  public isError = false;
  public submitted = false;
  public isSuccess = false;
  public removeFlage = false;
  public additionalFields: any[] = [];
  addFieldFm: FormGroup;

  public uploadResult = false;
  public isUploadBtn = true;
  pageData: any = {
    isEdit: false,
    isError: false,
    pageData: false,
    dragOver: false,
    newFileUpload: false,
    isThumbnailSet: false,
    businessCsvData: []
  };
  constructor(
    public dialogRef: MatDialogRef<OnboardingGuideDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
    public router: Router,
    private util: UtilService,
    private http: HttpService,
    private admin: AdminService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private file: FileService
  ) {
    this.action = dataObj.action;
  }

  ngOnInit() {
    const self = this;
    this.createForm();
    if (this.dataObj.fields) {
      if (this.dataObj.fields.length > 0) {
        for (let i = 0; i < this.dataObj.fields.length; i++) {
          this.addFields("1", this.dataObj.fields[i]);
        }
      } else {
        this.addFields("0", {});
      }
    }
  }

  addNewField(): void {
    this.addFields("0", {});
  }

  removeField(indx, lable) {
    if (this.dataObj.fields.length > indx) {
      // this.field = this.dataObj.fields[indx].label;
      this.dialog.open(OnboardingGuideDialogComponent, {
        data: {
          action: "remove",
          fields: this.dataObj.fields,
          field: lable,
          fieldType: this.dataObj.fieldType,
          msgHeader: this.dataObj.msgHeader,
          index: indx,
          formArr: this.fields,
          userType: this.dataObj.userType,
        }
      });
    } else {
      this.fields.removeAt(indx);
    }
  }

  createForm() {
    this.addFieldFm = this.fb.group({
      fields: this.fb.array([])
    });
  }

  addFields(option, valObj: any = {}) {
    this.fields.push(
      new FormGroup({
        label: new FormControl(option === "1" ? valObj.label : "", [
          Validators.required
        ]),
        dataType: new FormControl(option === "1" ? valObj.data_type : "", [
          Validators.required
        ]),
        optionalStatus: new FormControl(
          option === "1" ? valObj.optional : true,
          [Validators.required]
        ),
        extra_field_id: new FormControl(
          option === "1" ? valObj.extra_field_id : "",
          []
        ),
        isEditable: new FormControl(option === "1" ? false : true),
        data: new FormControl("")
      })
    );
  }

  get fields(): FormArray {
    return (<FormArray>this.addFieldFm.get("fields")) as FormArray;
  }

  updateAdditionalFields(form: FormGroup): void {
    const self = this;
    self.errMsg = "";
    self.isError = false;
    self.submitted = true;
    if (form.valid) {
        const finalArray = [];
        const reqFieldsObj: any = JSON.parse(JSON.stringify(form.value.fields));
      for (let i = 0; i < reqFieldsObj.length; i++) {
         if (reqFieldsObj[i].isEditable === false) {
            const sendArray = new Object();
            if (reqFieldsObj[i].extra_field_id) {
               sendArray["extra_field_id"] = reqFieldsObj[i].extra_field_id;
            }
            sendArray["label"] = reqFieldsObj[i].label;
            if (reqFieldsObj[i].dataType === "Text") {
                sendArray["data_type"] = 1;
            }else if (reqFieldsObj[i].dataType === "Number") {
                sendArray["data_type"] = 2;
            }else if (reqFieldsObj[i].dataType === "Date") {
                sendArray["data_type"] = 3;
            }else if (reqFieldsObj[i].dataType === "Decimal") {
                sendArray["data_type"] = 4;
            }
            if (JSON.parse(reqFieldsObj[i].optionalStatus) === false) {
                sendArray["optional"] = false;
            } else {
                sendArray["optional"] = true;
            }
            finalArray.push(sendArray);
        }else {
            const sendArray = new Object();
            sendArray["label"] = reqFieldsObj[i].label;
            if (reqFieldsObj[i].dataType === "Text") {
                sendArray["data_type"] = 1;
            }else if (reqFieldsObj[i].dataType === "Number") {
                sendArray["data_type"] = 2;
            }else if (reqFieldsObj[i].dataType === "Date") {
                sendArray["data_type"] = 3;
            }else if (reqFieldsObj[i].dataType === "Decimal") {
                sendArray["data_type"] = 4;
            }
            if (JSON.parse(reqFieldsObj[i].optionalStatus) === false) {
                sendArray["optional"] = false;
            } else {
                sendArray["optional"] = true;
            }
            finalArray.push(sendArray);
        }
        // delete reqFieldsObj[i].isEditable;
      }
      self.util.addSpinner("update-field-btn", "Update");
      this.http.doPost(
        "extra-fields/add",
        { user_type_id: this.dataObj.userType, fields: finalArray }, // NOTE:For Client Extra Field user_type_id = 5.
        function(error: boolean, response: any) {
          self.util.removeSpinner("update-field-btn", "Update");
          if (error) {
            self.errMsg = response.message;
            self.isError = true;
          } else {
            self.action = "createdSuccess";
            self.successMsg =
              self.dataObj.msgHeader +
              " Information Fields Successfully Updated.";
            // self.admin.updateList(true);
          }
        }
      );
    }
  }
    removeFieldAPICall(indx): void {
        const self = this;
        self.errMsg = "";
        self.isError = false;
        const reqFieldsObj: any[] = JSON.parse(JSON.stringify(self.dataObj.fields));
        const arrayObj = reqFieldsObj.splice(indx, 1);
        const sendArray = new Object();
        sendArray["extra_field_id"] = arrayObj[0].extra_field_id;
        sendArray["label"] = arrayObj[0].label;
        if (arrayObj[0].data_type === "Text") {
            sendArray["data_type"] = 1;
        }else if ((arrayObj[0].data_type === "Number")) {
            sendArray["data_type"] = 2;
        }else if ((arrayObj[0].data_type === "Date")) {
            sendArray["data_type"] = 3;
        }else {
            sendArray["data_type"] = 4;
        }
        sendArray["optional"] = arrayObj[0].optional;
        sendArray["is_deleted"] = 1;
        const finalArray = [];
        finalArray.push(sendArray);
        self.util.addSpinner("remove-field-btn", "Delete");
        this.http.doPost(
        "extra-fields/add",
        { user_type_id: this.dataObj.userType, fields: finalArray },
        function(error: boolean, response: any) {
            self.util.removeSpinner("remove-field-btn", "Delete");
            if (error) {
            self.errMsg = response.message;
            self.isError = true;
            } else {
            self.successMsg =
                self.dataObj.msgHeader + " Information Field Successfully Removed.";
            self.isSuccess = true;
            self.dataObj.formArr.removeAt(indx);
            // self.admin.updateList(true);
            }

        }
        );
    }

  addFromCSV() {
    console.log("Add From CSV");
  }
  fileChange(event) {
    // console.log(event);
    const self = this;

    self.util.addSpinner("csv-up-btn", "CSV Upload");
    const fileList: FileList = event.target.files;
    this.errMsg = "";
    this.isError = false;

    const file: File = fileList[0];
    const fileDetailsObj: any = {};
    const extension: string = fileList[0].name.split(".").pop();
    fileDetailsObj.fileName = fileList[0].name;

    if (extension === "csv") {
      if (fileList[0].size / 1048576 < 10) {
        const formData: FormData = new FormData();
        formData.append("file", fileList[0]);
        this.file.formDataAPICall(formData, self.dataObj.apiEndPoint, function(
          error: boolean,
          response: any
        ) {
          if (error) {
            self.util.removeSpinner("csv-up-btn", "CSV Upload");
            self.isError = true;
            self.errMsg = response.message;
          } else {
            const dataObj: any = { csvData: response.data };
            if (self.dataObj.redirectUrl) {
              dataObj.redirectUrl = self.dataObj.redirectUrl;
            }
            self.util.removeSpinner("csv-up-btn", "CSV Upload");
            sessionStorage.setItem("csvData", JSON.stringify(dataObj));
            self.dialogRef.close();
            self.router.navigate([self.dataObj.route]);
          }
        });
      } else {
        self.util.removeSpinner("csv-up-btn", "CSV Upload");
        self.pageData.dragOver = false;
        self.pageData.isError = true;
        self.pageData.errMsg = "File must be less than 10 MB.";
        // self.ref.tick();
      }
    } else {
      self.util.removeSpinner("csv-up-btn", "CSV Upload");
      self.pageData.dragOver = false;
      self.pageData.isError = true;
      self.pageData.errMsg = "Only csv file allowed.";
      // self.ref.tick();
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
