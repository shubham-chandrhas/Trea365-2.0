import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";

import { MatFormFieldModule } from "@angular/material/form-field";
import { AdminService } from "../../admin/admin.service";
import { UtilService } from "../../../shared/service/util.service";
import { HttpService } from "../../../shared/service/http.service";
import { GlobalService } from "../../../shared/service/global.service";

@Component({
  selector: "app-employee-dialog",
  templateUrl: "./employee-dialog.component.html",
  styleUrls: ["./employee-dialog.component.css"]
})

export class EmployeeDialog {
  public errMsg = "";
  public successMsg = "";
  public isError = false;
  public isSuccess = false;
  public action: string;
  public errorMsg: string;
  public message: string;
  public submitted = false;

  public uploadResult = false;
  public isUploadBtn = true;

  constructor(
    private router: Router,
    private util: UtilService,
    private http: HttpService,
    private admin: AdminService,
    public dialogRef: MatDialogRef < EmployeeDialog > ,
    private global: GlobalService,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
  ) {
    this.action = dataObj.action;
    this.message = dataObj.reset_message ? dataObj.reset_message : "";
  }

  resetPassword() {
    const self = this;
    self.util.addSpinner("reset-pass-btn", "Yes");
    try {
      this.http.doPost("forgot-password", {
        "username": self.dataObj.empUsername
      }, function (error: boolean, response: any) {
        self.util.addSpinner("reset-pass-btn", "Yes");
        if (error) {
          self.action = "resetPassError";
          self.errorMsg = response.message;
        } else {
          self.action = "resetPassSuccess";
        }
      });
    } catch (err) {
      this.global.addException("employee", "resetPassword()", err);
    }
  }

  addFromCSV() {}
  fileChange(event) {}
  closeDialog(): void {
    this.dialogRef.close();
  }
}
