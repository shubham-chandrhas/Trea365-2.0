import {
  Component,
  Inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ApplicationRef
} from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Router, ActivatedRoute } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { UploadEvent, UploadFile, FileSystemFileEntry } from "ngx-file-drop";

import { UtilService } from "../../shared/service/util.service";
import { HttpService } from "../../shared/service/http.service";
import { ConstantsService } from "../../shared/service/constants.service";
import { FileService } from "../../shared/service/file.service";
import { GlobalService } from "../../shared/service/global.service";

declare var $: any;

@Component({
  selector: "",
  templateUrl: "./inventory-dialog.component.html",
  styleUrls: [
    "./inventory-dialog.component.css",
    "./../../component/admin/manufacturer-part/manufacturer-part/mfg-attributes/mfg-attributes.component.scss"
  ]
})
export class InventoryDialog implements OnInit, OnDestroy, AfterViewInit {
  pageData: any = {
    purchaseOrderList: [],
    listCount: 0,
    isEdit: false,
    isError: false,
    errMsg: "",
    sortColumn: "purchase_order_id",
    sortColumnType: "N",
    sortOrder: "DSC",
    addSupStep: "S1",
    addMfgPartStep: "S1",
    addProductStep: "S1",
    addAsset: "S1",
    addMaterialStep: "S1",
    manfObj: {}
  };
  uploadDocData: any = {
    errMsg: "",
    isError: false,
    isAttributeError: false,
    newFileUpload: false,
    isThumbnailSet: false,
    dragOver: false,
    imgDocPriArr: []
  };
  manfObjOTF = this.dataObj.params;
  public isDeleteCount = 0;
  public action: string;
  public errorMsg: string;
  private loggedInUser;
  public document: any;
  interval: any;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    public util: UtilService,
    public constant: ConstantsService,
    private file: FileService,
    private ref: ApplicationRef,
    private http: HttpService,
    public dialogRef: MatDialogRef<InventoryDialog>,
    @Inject(MAT_DIALOG_DATA) public dataObj: any,
    private global: GlobalService
  ) {}

  ngOnInit() {
    const self = this;
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
    this.util.setWindowHeight();
    this.dataObj.action === "purchaseOrderList" ? this.purchaseOrderList() : "";
    this.pageData.paginationKey = {
      itemsPerPage: 5,
      currentPage: this.constant.CURRENT_PAGE
    };
    // addSupOF
    if (self.dataObj.assetInfo) {
      for (let i = 0; i < self.dataObj.assetInfo.documents.length; i++) {
        const attachmentObj: any = { fileDetails: {} };
        const file: any = {};
        file.name = self.dataObj.assetInfo.documents[i].attachment_name;
        file.type =
          self.dataObj.assetInfo.documents[i].attachment_type == 1
            ? "image/png"
            : "application/pdf";
        // attachmentObj.file = file;
        if (self.dataObj.action === "UPLOAD_ASSET_DOC") {
          attachmentObj.fileId =
            self.dataObj.assetInfo.documents[i].asset_attachment_id;
        } else if (self.dataObj.action === "UPLOAD_PRODUCT_DOC") {
          attachmentObj.fileId =
            self.dataObj.assetInfo.documents[i].product_attachment_id;
        } else {
          attachmentObj.fileId =
            self.dataObj.assetInfo.documents[i].material_attachment_id;
        }
        const fileName: string[] = self.dataObj.assetInfo.documents[
          i
        ].attachment_name.split(".");
        fileName.pop();

        attachmentObj.is_delete = 0;
        attachmentObj["fileDetails"]["file_name"] =
          self.dataObj.assetInfo.documents[i].attachment_name;
        attachmentObj.attachment_id =
          self.dataObj.assetInfo.documents[i].attachment_id;
        attachmentObj.is_thumbnail =
          self.dataObj.assetInfo.documents[i].is_thumbnail;
        attachmentObj.extension = self.dataObj.assetInfo.documents[
          i
        ].attachment_name
          .split(".")
          .pop();
        attachmentObj["fileDetails"]["file_path"] =
          self.dataObj.assetInfo.documents[i].attachment_path;
        attachmentObj.comment = self.dataObj.assetInfo.documents[i].comment;
        attachmentObj.type =
          self.dataObj.assetInfo.documents[i].attachment_type;
        this.uploadDocData.imgDocPriArr.push(attachmentObj);
      }
      console.log("IMGDOC ARRAY", this.uploadDocData.imgDocPriArr);
    }
    this.util.changeDetection.subscribe(ofDataObj => {
      if (ofDataObj && ofDataObj.data) {
        if (ofDataObj.data.step == "S0" || ofDataObj.data.step == "DONE") {
          this.dialogRef.close(); // self.closeDialog();
        } else if (ofDataObj.source === "ON_THE_FLY_SUPPLIER") {
          this.pageData.addSupStep = ofDataObj.data.step;
        } else if (ofDataObj.source === "ON_THE_FLY_MANUFACTURER_PART") {
          this.pageData.addMfgPartStep = ofDataObj.data.step;
        } else if (ofDataObj.source === "ON_THE_FLY_PRODUCT") {
          this.pageData.addProductStep = ofDataObj.data.step;
        } else if (ofDataObj.source === "ON_THE_FLY_MATERIAL") {
          this.pageData.addMaterialStep = ofDataObj.data.step;
        } else if (ofDataObj.source === "ON_THE_FLY_ASSET") {
          this.pageData.addAsset = ofDataObj.data.step;
        } else if (ofDataObj.source === "OTF_ADD_SUCCESS") {
          this.dataObj.action = "SUCCESS";
          this.dataObj.message = ofDataObj.data.msg;
          this.dataObj.alertBtn =
            this.util.getReceivingItemCount() == 1 ? "DONE" : "CONTINUE_ADDING";
        }
      }
    });
    console.log("POPUP");
  }

  ngAfterViewInit() {
    this.interval = setInterval(this.monitorDiv, 1000);
  }

  monitorDiv() {
    if ($("div.pac-container").length) {
      $("div.pac-container").addClass("pac-container-overrides");
      clearInterval(this.interval);
    }
  }

  ngOnDestroy() {
    if (this.dataObj.action == "SUCCESS") {
      this.onTheFlyEvent("INVENTORY_DIALOG", "ADD", {
        step: "CONTINUE_ADDING"
      });
    }
    if (
      this.dataObj.action == "addProduct" ||
      this.dataObj.action == "addAsset"
    ) {
      this.onTheFlyEvent("ON_THE_FLY_DIALOG", "CANCEL", { step: "CLOSE" });
    }
  }
  itemDefData() {
    this.pageData.manfObj = this.dataObj.params;
  }
  purchaseOrderList() {
    const self = this;
    try {
      this.util.showProcessing("processing-spinner");
      this.http.doGet("purchase-order/list/rs", function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          this.global.addException(
            "Inventory Dailog",
            "purchaseOrderList()",
            response
          );
        } else {
          self.pageData.purchaseOrderList = response.data;
        }
      });
    } catch (err) {
      this.global.addException("Inventory Dailog", "purchaseOrderList()", err);
    }
  }

  updateCount(count): void {
    this.constant.ITEM_COUNT = this.pageData.listCount = count;
  }

  getSelectedPO(po): void {
    this.pageData.isError = false;
    this.pageData.selPO = po;
  }

  proceedWithPO(): void {
    if (this.pageData.selPO) {
      sessionStorage.setItem("po", JSON.stringify(this.pageData.selPO));
      this.dialogRef.close();
      this.dataObj.redirectPath.length > 0
        ? this.router.navigate([this.dataObj.redirectPath[0]])
        : "";
    } else {
      this.pageData.isError = true;
      this.pageData.errMsg = "Please select purchase order to proceed.";
    }
  }

  continueAdding(): void {
    this.dialogRef.close();
  }

  doneWithAdding(): void {
    this.dialogRef.close();
    this.router.navigate(["/inventory/rs/csa/receiving-slips-list/0"]);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onTheFlyEvent(source, action, data): void {
    this.util.changeEvent({
      source: source,
      action: action,
      data: data
    });
  }

  dropped(event: UploadEvent, option) {
    try {
      const self = this;
      const extension = "";
      const fileDetailsObj: any = {};
      self.uploadDocData.errMsg = "";
      self.uploadDocData.isError = false;
      for (const file of event.files) {
        const fileEntry = file.fileEntry as FileSystemFileEntry;
        fileEntry.file(info => {
          if (info) {
            self.addImg(0, [info], fileDetailsObj, extension);
            self.uploadDocData.dragOver = false;
            this.ref.tick();
          }
        });
      }
    } catch (err) {
      this.global.addException("Inventory Dailog", "dropped()", err);
    }
  }

  fileOver(event) {
    this.uploadDocData.dragOver = true;
    this.ref.tick();
  }
  fileLeave(event) {
    this.uploadDocData.dragOver = false;
    this.ref.tick();
  }

  changeUploadFileFlage() {
    this.uploadDocData.newFileUpload = true;
    this.ref.tick();
  }
  onFileChange(event) {
    try {
      const self = this;
      const extension = "";
      const fileDetailsObj: any = {};
      self.uploadDocData.errMsg = "";
      self.uploadDocData.isError = false;
      const fileList: FileList = event.target.files;
      if (fileList.length > 0) {
        const imgCount = 0;
        self.addImg(imgCount, fileList, fileDetailsObj, extension);
      }
    } catch (err) {
      this.global.addException("Inventory Dailog", "onFileChange()", err);
    }
  }
  addImg(imgCount: number, fileList, fileDetailsObj, extension) {
    try {
      const self = this;
      this.util.addSpinner("update-doc-btn", "Submit");
      const file: File = fileList[imgCount];
      fileDetailsObj = {};
      fileDetailsObj.thumbnail = 0;
      fileDetailsObj.fileId = "";
      fileDetailsObj.isFileDelete = 0;
      const fileName: string[] =
        fileList[imgCount] && fileList[imgCount].name
          ? fileList[imgCount].name.split(".")
          : "";
      fileName.pop();
      fileDetailsObj.attachment_name = fileName;
      extension = fileList[imgCount].name.split(".").pop();
      if (
        extension == "jpg" ||
        extension == "png" ||
        extension == "pdf" ||
        extension == "jpeg"
      ) {
        if (fileList[imgCount].size / 1048576 < 10) {
          self.convertToBase64(file, function(base64) {
            fileDetailsObj.attachment_path = JSON.parse(JSON.stringify(base64));
            fileDetailsObj.comment = "";
            fileDetailsObj.extension = extension;
            fileDetailsObj.file = file;
            fileDetailsObj.fileName = fileName.join(".");
            const formData: FormData = new FormData();
            formData.append("file", file);
            formData.append("company_id", self.loggedInUser.company_id);
            self.file.formDataAPICall(formData, "attachments/upload", function(
              error: boolean,
              response: any
            ) {
              self.util.removeSpinner("update-doc-btn", "Submit");
              if (error) {
                this.global.addException(
                  "Inventory Dailog",
                  "addImg()",
                  response
                );
              } else {
                (fileDetailsObj.fileDetails = response.data),
                  (fileDetailsObj.type = extension === "pdf" ? 2 : 1);
                fileDetailsObj.is_delete = 0;
                self.uploadDocData.imgDocPriArr.push(fileDetailsObj);
                self.ref.tick();
                if (!self.uploadDocData.isThumbnailSet) {
                  if (
                    extension == "jpg" ||
                    extension == "png" ||
                    extension == "jpeg"
                  ) {
                    fileDetailsObj.thumbnail = 1;
                    self.uploadDocData.isThumbnailSet = true;
                    self.ref.tick();
                  }
                }

                if (self.uploadDocData.imgDocPriArr.length > 0) {
                  self.uploadDocData.newFileUpload = false;
                  self.ref.tick();
                }

                if (imgCount < fileList.length - 1) {
                  return self.addImg(
                    ++imgCount,
                    fileList,
                    fileDetailsObj,
                    extension
                  );
                }
              }
            });
          });
        } else {
          self.uploadDocData.errMsg = "File must be less than 10 MB.";
          self.uploadDocData.isError = true;
          self.ref.tick();
        }
      } else {
        self.uploadDocData.isError = true;
        self.uploadDocData.errMsg = "Only jpg, jpeg, png or pdf file allowed.";
        self.ref.tick();
      }
    } catch (err) {
      this.global.addException("Inventory Dailog", "addImg()", err);
    }
  }

  convertToBase64(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (fileLoadedEvent: any) => {
      return callback(fileLoadedEvent.target.result);
    };
  }

  onSelectionChange(index) {
    try {
      for (let i = 0; i < this.uploadDocData.imgDocPriArr.length; i++) {
        this.uploadDocData.imgDocPriArr[i].thumbnail = 0;
      }
      this.uploadDocData.imgDocPriArr[index].thumbnail = 1;
    } catch (err) {
      this.global.addException("Inventory Dailog", "onSelectionChange()", err);
    }
  }

  removeImgDoc(index) {
    try {
      const isThumbnail =
        this.uploadDocData.imgDocPriArr[index].thumbnail == 1 ? true : false;
      const deletedObj = this.uploadDocData.imgDocPriArr[index];
      deletedObj["is_delete"] = 1;
      this.uploadDocData.imgDocPriArr.splice(index, 1, deletedObj);

      this.ref.tick();
      if (this.uploadDocData.imgDocPriArr.length === 0) {
        this.uploadDocData.isThumbnailSet = false;
        this.uploadDocData.newFileUpload = true;
        this.ref.tick();
      } else {
        if (isThumbnail) {
          const checkImg = this.uploadDocData.imgDocPriArr.filter(
            item => item.extension !== "pdf"
          );
          if (checkImg.length > 0) {
            checkImg[0].thumbnail = 1;
            this.ref.tick();
          } else {
            this.uploadDocData.isThumbnailSet = false;
            this.ref.tick();
          }
        }
      }
    } catch (err) {
      this.global.addException("Inventory Dailog", "removeImgDoc()", err);
    }
  }

  uploadNewDoc() {
    const self = this;
    self.util.addSpinner("update-doc-btn", "Submit");
    try {
      const reqObj = {
        asset_id: self.dataObj.assetInfo.asset_id,
        documents: []
      };
      for (let i = 0; i < self.uploadDocData.imgDocPriArr.length; i++) {
        if (
          self.uploadDocData.imgDocPriArr[i].fileDetails.file_name === "" &&
          self.uploadDocData.imgDocPriArr[i].is_delete != 1
        ) {
          self.uploadDocData.errMsg = "File name is required.";
          self.util.removeSpinner("update-doc-btn", "Submit");
          self.uploadDocData.isError = true;
          return;
        } else {
          const thumbnail = self.uploadDocData.isThumbnailSet ? 1 : 0;
          const id = self.uploadDocData.imgDocPriArr[i].attachment_id
            ? self.uploadDocData.imgDocPriArr[i].attachment_id
            : "";
          const is_delete = self.uploadDocData.imgDocPriArr[i].is_delete;
          const document = {
            attachment_id: id,
            is_delete: is_delete,
            attachment_type: self.uploadDocData.imgDocPriArr[i].type,
            attachment_name:
              self.uploadDocData.imgDocPriArr[i].fileDetails.file_name,
            attachment_path:
              self.uploadDocData.imgDocPriArr[i].fileDetails.file_path,
            comment: self.uploadDocData.imgDocPriArr[i].comment,
            is_thumbnail: thumbnail
          };
          reqObj.documents.push(document);
        }
      }
      this.http.doPost("inventory/assets/attachment/update", reqObj, function(
        error: boolean,
        response: any
      ) {
        self.util.removeSpinner("update-doc-btn", "Submit");
        if (error) {
          self.uploadDocData.isError = true;
          self.uploadDocData.errMsg = response.message;
          this.global.addException(
            "Inventory Dailog",
            "uploadNewDoc()",
            response
          );
        } else {
          self.uploadDocData.isEdit = self.uploadDocData.newFileUpload = false;
          self.closeDialog();
          self.util.changeEvent({
            source: self.dataObj.action,
            action: "UPLOAD",
            data: self.dataObj.assetInfo
          });
        }
      });
    } catch (err) {
      self.global.addException("Inventory Dailog", "uploadNewDoc()", err);
    }
  }

  moveInventory() {
    const self = this;
    self.util.addSpinner("reset-pass-btn", "Yes");
    try {
      this.http.doPost(self.dataObj.apiEndPoint, self.dataObj.reqData, function(
        error: boolean,
        response: any
      ) {
        self.util.removeSpinner("reset-pass-btn", "Yes");
        if (error) {
          self.dataObj.action = "moveInventoryError";
          self.errorMsg = response.message;
        } else {
          if (self.dataObj.type === "Product") {
            self.util.changeEvent({
              source: "MOVE_INVENTORY",
              action: "MOVE_INVENTORY",
              data: response.data
            });
          } else {
            self.util.changeEvent({
              source: "MOVE_INVENTORY_MATERIAL",
              action: "MOVE_INVENTORY_MATERIAL",
              data: response.data
            });
          }
          self.dataObj.action = "moveInventorySuccess";
        }
      });
    } catch (err) {
      this.global.addException("employee", "moveInventory()", err);
    }
  }

  onChangeDom($event) {
    console.log($event);
  }
}
