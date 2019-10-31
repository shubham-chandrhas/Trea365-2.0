import { Component, OnInit, ApplicationRef } from '@angular/core';
import { UploadEvent, UploadFile, FileSystemFileEntry } from 'ngx-file-drop';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { GlobalService } from '../../../../../shared/service/global.service';
import { UtilService } from '../../../../../shared/service/util.service';
import { ProjectEstimatorService } from '../../project-estimator.service';
import { FileService } from "../../../../../shared/service/file.service";

@Component({
	selector: 'app-images',
	templateUrl: './images.component.html',
	styleUrls: ['../quotation-generation.component.css', './images.component.scss']
})
export class ImagesComponent implements OnInit {
	public uploadDocData: any = {'errMsg': '', 'isError': false, 'isAttributeError': false, 'newFileUpload': false, 'isThumbnailSet': false, 'dragOver': false, 'imgArr': [],  'imgDeleted': []}
    private loggedInUser: any;
    constructor(
		public util: UtilService,
		private ref: ApplicationRef,
        private PEService: ProjectEstimatorService,
        private global: GlobalService,
        private file: FileService
	) { }

	ngOnInit() {
        this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
		if(this.PEService.projectEstimatorData.images && this.PEService.projectEstimatorData.images.length>0 ){
            console.log("this.PEService.projectEstimatorData.images ::", this.PEService.projectEstimatorData.images);
            this.uploadDocData.imgArr = this.PEService.projectEstimatorData.images;
           // console.log(this.uploadDocData.imgArr)
        }
	}

	dropped(event: UploadEvent, option) {
        try{
        let self = this;
        let extension: string = '';
        let fileDetailsObj: any = {};
        self.uploadDocData.errMsg = "";
        self.uploadDocData.isError = false;
        for (let file of event.files) {
          const fileEntry = file.fileEntry as FileSystemFileEntry;
          fileEntry.file(info => {
                if(info){ self.addImg(0, [info], fileDetailsObj, extension); self.uploadDocData.dragOver = false; this.ref.tick(); }
            });
        }
    }catch(err){
        this.global.addException('images', 'dropped()', err);
      }
    }

    fileOver(event){ this.uploadDocData.dragOver = true;this.ref.tick(); }
    fileLeave(event){ this.uploadDocData.dragOver = false;this.ref.tick(); }

    onFileChange(event): void {
        try {
            let self = this;
            let extension: string = '';
            let fileDetailsObj: any = {};
            self.uploadDocData.errMsg = "";
            self.uploadDocData.isError = false;
            let fileList: FileList = event.target.files;
            console.log("fileList", fileList, event.target.files);
            if (fileList.length > 0) {
                let imgCount = 0;
                self.addImg(imgCount, fileList, fileDetailsObj, extension);
            }
        }
        catch (err) {
            this.global.addException('images', 'onFileChange()', err);
        }
    }
    convertToBase64(file, callback){
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (fileLoadedEvent:any) => {
            return callback(fileLoadedEvent.target.result);
        };
	};

    addImg(imgCount: number, fileList, fileDetailsObj, extension) {
        try {
            let self = this;
            let file: File = fileList[imgCount];
            
            fileDetailsObj = {};
            //fileDetailsObj.thumbnail = 0;
            fileDetailsObj.fileId = '';
            fileDetailsObj.isFileDelete = 0;
            fileDetailsObj.attachment_name = fileList[imgCount] && fileList[imgCount].name ? fileList[imgCount].name : '';
            extension = fileList[imgCount].name.split('.').pop();

            if (extension == 'jpg' || extension == 'png' || extension == 'jpeg') {
                
                if ((fileList[imgCount].size / 1048576) < 10) {
                    self.util.showProcessing("processing-spinner");
                    self.convertToBase64(file, function (base64) {
                        fileDetailsObj.attachment_path = JSON.parse(JSON.stringify(base64));
                        fileDetailsObj.extension = extension;
                        fileDetailsObj.file = file;
                        // if (self.uploadDocData.imgArr.length <= 4) {
                        //     self.uploadDocData.imgArr.push(fileDetailsObj);
                        // } else {
                        //     self.uploadDocData.errMsg = "You can upload maximum five images.";
                        //     self.uploadDocData.isError = true;
                        //     self.ref.tick();
                        // }
                        const formData: FormData = new FormData();
                        formData.append("file", file);
                        formData.append("company_id", self.loggedInUser.company_id);
                        self.file.formDataAPICall(formData, "attachments/upload", function(
                            error: boolean,
                            response: any
                          ) {
                            self.util.hideProcessing("processing-spinner");
                              if (error) {
                              } else {
                              fileDetailsObj.fileDetails = response.data;
                              fileDetailsObj.type = extension === "pdf" ? 2 : 1;
                              fileDetailsObj.attachment_type = extension === "pdf" ? 2 : 1;
                              fileDetailsObj.attachment_name = fileDetailsObj.attachment_name;
                              fileDetailsObj.attachment_id = '';
                              fileDetailsObj.attachment_path = fileDetailsObj.fileDetails.file_path;
                              self.uploadDocData.imgArr.push(fileDetailsObj);
                                self.ref.tick();
                                
                                console.log("Img=", self.uploadDocData);
                                self.PEService.projectEstimatorData.images = self.uploadDocData.imgArr;
                                console.log("images ::",self.PEService.projectEstimatorData.images);
                                

                                if (self.uploadDocData.imgArr.length > 0) {
                                    self.uploadDocData.newFileUpload = false;
                                    self.ref.tick();
                                }

                                if (imgCount < fileList.length - 1)
                                    return self.addImg(++imgCount, fileList, fileDetailsObj, extension);
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
                self.uploadDocData.errMsg = 'Only jpg, jpeg or png file allowed.';
                self.ref.tick();
            }
        }
        catch (err) {
            this.global.addException('images', 'addImg()', err);
        }

    }

    removeImage(index): void {
        try {
            this.uploadDocData.imgDeleted.push(this.uploadDocData.imgArr[index]);
            this.PEService.projectEstimatorData.imagesDeleted = this.uploadDocData.imgDeleted;

            console.log("this.PEService.projectEstimatorData.imagesDeleted :: ",this.PEService.projectEstimatorData.imagesDeleted);
            this.uploadDocData.imgArr.splice(index, 1);
            if (this.uploadDocData.imgArr.length <= 5) {
                this.uploadDocData.errMsg = "";
                this.uploadDocData.isError = false;
            }
            this.PEService.projectEstimatorData.images = this.uploadDocData.imgArr;
        } catch (err) {
            this.global.addException('images', 'removeImage()', err);
        }
    }

	changeUploadFileFlage() : void {
        this.uploadDocData.newFileUpload = true;
        this.ref.tick();
    }
    // onSelectionChange(index){
    //     for (var i = 0; i < this.uploadDocData.imgArr.length; i++) {
    //         this.uploadDocData.imgArr[i].thumbnail = 0;
    //     }
    //     this.uploadDocData.imgArr[index].thumbnail = 1;
	// }

}
