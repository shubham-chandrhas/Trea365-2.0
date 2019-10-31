import { Component, OnInit, ApplicationRef } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { UploadEvent, UploadFile, FileSystemFileEntry, FileSystemDirectoryEntry  } from "ngx-file-drop";
import { UtilService } from "../../../../../shared/service/util.service";
import { GlobalService } from "../../../../../shared/service/global.service";
import { ManufacturerPartDialog } from "./../manufacturer-part.component";
import { HttpService } from "../../../../../shared/service/http.service";
import { FileService } from "../../../../../shared/service/file.service";
declare var $: any;

@Component({
    selector: "app-mfg-attributes",
    templateUrl: "./mfg-attributes.component.html",
    styleUrls: ["./mfg-attributes.component.scss"]
})
export class MfgAttributesComponent implements OnInit {
    pageData: any = {"attributeList" : [{"label": "", "format": ""}], "errMsg": "",
    "isError": false, "isAttributeError": false, "newFileUpload": false, "isThumbnailSet": false, "dragOver": false, "imgDocPriArr": []};
    currentPath: string;
    private loggedInUser: any;

    constructor(
    private router: Router,
    public util: UtilService,
    public global: GlobalService,
    private dialog: MatDialog,
    private ref: ApplicationRef,
    private http: HttpService,
    private file: FileService
    ) { }

    ngOnInit() {
      this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
        this.currentPath = this.router.url.split("/")[3];
        this.currentPath === "mfg-attributes" ? this.router.url.split("/")[2]
        === "csa-onboarding" ? this.util.menuChange({"menu": "guide", "subMenu": ""})
         : this.util.menuChange({"menu": 2, "subMenu": 14}) : "";
        this.util.setWindowHeight();
        if (sessionStorage.getItem("newPart")) {

          const newPart = JSON.parse(sessionStorage.getItem("newPart"));
          //  console.log( JSON.parse(sessionStorage.getItem("newPart")), newPart);
            this.pageData.attributeList = newPart.attribute.length > 0 ?
           newPart.attribute : [{"label": "", "format": ""}];
            this.pageData.imgDocPriArr = this.util.getMfgPartData();
        }
    }

    addAttribute(): void {
        try {
            this.pageData.errMsg = "";
            this.pageData.isAttributeError = false;
            if (this.pageData.attributeList.length !== 0 &&
            (this.pageData.attributeList[this.pageData.attributeList.length - 1].label === "" ||
             this.pageData.attributeList[this.pageData.attributeList.length - 1].format === "")) {
                this.pageData.isAttributeError = true;
                this.pageData.errMsg = "Enter Attribute Label and Attribute Data.";
            } else {
                this.pageData.attributeList.push({ "label": "", "format": "" });
            }
        } catch (err) {
            this.global.addException("Mfg attribute", "addAttribute()", err);
        }
    }

    removeAttribute(index) {
            this.pageData.attributeList.splice(index, 1);
    }

    mfgReview() {
        try {
            this.pageData.errMsg = "";
            this.pageData.isError = this.pageData.isAttributeError = false;
            const manufacturerPartData: any = JSON.parse(sessionStorage.getItem("newPart"));
            const attArr: any = [];
            for (let i = 0; i < this.pageData.attributeList.length; i++) {
                if ((this.pageData.attributeList[i].label).trim() == "" || (this.pageData.attributeList[i].format).trim() == "") {
                    if (this.pageData.attributeList.length != 1) {
                        this.pageData.isError = true;
                        this.pageData.errMsg = "Enter Attribute Label and Attribute Data.";
                        return;
                    }
                } else {
                    attArr.push(this.pageData.attributeList[i]);
                }
            }
            manufacturerPartData.attribute = attArr;
            for (let i = 0; i < this.pageData.length; i++) {
                if (this.pageData.imgDocPriArr[i].fileName ==
                  "" && this.pageData.imgDocPriArr[i].isDelete != 1) {
                    this.pageData.errMsg = "File name is required.";
                    this.pageData.isError = true;
                    return;
                }
            }
            this.util.setMfgPartData(this.pageData.imgDocPriArr);
            sessionStorage.setItem("newPart", JSON.stringify(manufacturerPartData));

            this.currentPath == "mfg-attributes" ? this.router.url.split("/")[2] == "csa-onboarding" ?
             this.router.navigate(["/admin/csa-onboarding/manufacturer-part-review"]) :
              this.router.navigate(["/admin/csa/manufacturer-part-review"]) : this.onTheFlyEvent({ "step": "S3" });
        } catch (err) {
            this.global.addException("Mfg attribute", "mfgReview()", err);
        }
    }

    previousPage(){
        this.currentPath == "mfg-attributes" ? this.router.url.split("/")[2]
        =="csa-onboarding" ? this.router.navigate(["/admin/csa-onboarding/add-manufacturer-part/"+btoa("1")])
        : this.router.navigate(["/admin/csa/add-manufacturer-part/"+btoa("1")]) : this.onTheFlyEvent({"step": "S1"});
    }

    cancelAddManufacturer(){
        this.currentPath == "mfg-attributes" ? this.dialog.open(ManufacturerPartDialog,
          { data: { "action": "cancelAddManufacturerPart" }, autoFocus: false }) : this.onTheFlyEvent({"step": "S0"});
    }

    onFileChange(event){
        const self = this;
        const extension = "";
        const fileDetailsObj: any = {};
        self.pageData.errMsg = "";
        self.pageData.isError = false;
        const fileList: FileList = event.target.files;
        if(fileList.length > 0) {
            const imgCount = 0;
            self.addImg(imgCount, fileList, fileDetailsObj, extension);
        }
    }

    addImg(imgCount: number, fileList, fileDetailsObj, extension) {
      this.util.addSpinner("next-btn", "Next");
        const self = this;
        const file: File         = fileList[imgCount];
        let fileName: string[]   = [];
        fileDetailsObj           = {};
        fileDetailsObj.thumbnail = 0;
        fileDetailsObj.fileName  = fileList[imgCount] && fileList[imgCount].name ? fileList[imgCount].name : "";
        extension                = fileList[imgCount].name ? fileList[imgCount].name.split(".").pop() : "";
        fileName                 = fileList[imgCount].name ? fileList[imgCount].name.split(".") : "";
         if (fileName) {
            fileName.pop();
          } else {
            self.pageData.isError = true;
            self.pageData.errMsg  = "Invalid File Path - No file found at the path";
            this.util.removeSpinner("next-btn", "Next");
            return;
          }
        if (extension === "jpg" || extension === "png" || extension === "pdf" || extension === "jpeg") {
            if ((fileList[imgCount].size / 1048576) < 10 ) {
                self.convertToBase64(file, function(base64){
                    fileDetailsObj.imgPath = JSON.parse(JSON.stringify(base64));
                    fileDetailsObj.description = "";
                    fileDetailsObj.fileName = fileName.join(".");
                    fileDetailsObj.extension = extension;
                    fileDetailsObj.file = file;
                    const formData: FormData = new FormData();
                    formData.append("file", file);
                    formData.append("company_d", self.loggedInUser.company_id);
                    self.file.formDataAPICall(formData, "attachments/upload", (
                      error: boolean,
                      response: any
                    ) => {
                      self.util.removeSpinner("next-btn", "Next");
                        if (error) {
                           this.global.addException("new item definition", "addImg()", response);
                        } else {
                        fileDetailsObj.fileDetails = response.data,
                        fileDetailsObj.type = extension === "pdf" ? 2 : 1;
                        self.pageData.imgDocPriArr.push(fileDetailsObj);
                        self.ref.tick();

                        if (!self.pageData.isThumbnailSet) {
                            if (extension === "jpg" || extension === "png" || extension === "jpeg") {
                                fileDetailsObj.thumbnail = 1;
                                self.pageData.isThumbnailSet = true;
                                self.ref.tick();
                            }
                        }

                        if (self.pageData.imgDocPriArr.length > 0) {
                            self.pageData.newFileUpload = false;
                            self.ref.tick();
                        }

                        if (imgCount < fileList.length - 1) {
                            return self.addImg(++imgCount, fileList, fileDetailsObj, extension);
                        }
                      }
                    });

                });

            }else {
                self.pageData.errMsg = "File must be less than 10 MB.";
                self.pageData.isError = true;
                self.ref.tick();
                self.util.removeSpinner("next-btn", "Next");
            }
        }else {
            self.pageData.isError = true;
            self.pageData.errMsg = "Only jpg, jpeg, png or pdf file allowed.";
            self.ref.tick();
            self.util.removeSpinner("next-btn", "Next");
        }
    }

    convertToBase64(file, callback){
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (fileLoadedEvent: any) => {
            return callback(fileLoadedEvent.target.result);
        };
    };

    onSelectionChange(index) {
        for (let i = 0; i < this.pageData.imgDocPriArr.length; i++) {
            this.pageData.imgDocPriArr[i].thumbnail = 0;
        }
        this.pageData.imgDocPriArr[index].thumbnail = 1;
    }

    changeUploadFileFlage(){
        this.pageData.newFileUpload = true;
        this.ref.tick();
    }

    removeImgDoc(index,option){
        console.log(index);
        try{
            const isThumbnail = this.pageData.imgDocPriArr[index].thumbnail == 1 ? true : false;
            const newList = this.pageData.imgDocPriArr.filter(item=>item.extension != "pdf");
            const self = this;
            self.pageData.isError = false;
            self.pageData.errMsg = "";

            self.ref.tick();
            if (option === "img") {
                if (isThumbnail && (newList.length > 1)){
                    self.pageData.isError = true;
                    self.pageData.errMsg = `You can not remove thumbnail image. If
                     you want to remove thumbnail image please set other image as thumbnail.`;
                    self.ref.tick();
                }else {
                    this.pageData.imgDocPriArr[index].thumbnail == 1 ? this.pageData.isThumbnailSet = false : "";
                    this.pageData.imgDocPriArr.splice(index, 1);
                    newList.length == 0 ? this.pageData.newFileUpload = true : "";
                    self.ref.tick();
                }
            }else {
                self.ref.tick();
            }
        }catch (err) {
            this.global.addException("new item definition", "removeImgDoc()",err);
        }
    }

    dropped(event: UploadEvent, option) {
        try {
            const self = this;
            const extension = "";
            const fileDetailsObj: any = {};
            self.pageData.errMsg = "";
            self.pageData.isError = false;
            for (const file of event.files) {
              const fileEntry = file.fileEntry as FileSystemFileEntry;
                  fileEntry.file(info => {
                    if (info) { self.addImg(0, [info], fileDetailsObj, extension); self.pageData.dragOver = false; this.ref.tick(); }
                });
            }

        } catch (err) {
            this.global.addException("Mfg attribute", "dropped()", err);
        }
    }

    fileOver(event){ this.pageData.dragOver = true;this.ref.tick(); }
    fileLeave(event){ this.pageData.dragOver = false;this.ref.tick(); }

    onTheFlyEvent(data): void {
        this.util.changeEvent({
            "source": "ON_THE_FLY_MANUFACTURER_PART",
            "action": "ADD",
            "data": data
        });
    }
}
