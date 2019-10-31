import { FileService } from './../../../../shared/service/file.service';
import {
    Component,
    OnInit,
    ApplicationRef,
    NgZone,
    ViewChild,
    ElementRef,
    OnChanges,
    SimpleChanges
} from "@angular/core";
import { Router, ActivatedRoute, RoutesRecognized } from "@angular/router";
import {
    FormControl,
    Validators,
    FormGroup,
    FormBuilder,
    FormArray,
    NgForm
} from "@angular/forms";
import {
    IMultiSelectOption,
    IMultiSelectSettings,
    IMultiSelectTexts
} from "angular-2-dropdown-multiselect";
import { UploadEvent, UploadFile, FileSystemFileEntry } from "ngx-file-drop";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { MapsAPILoader } from "@agm/core";

import { HrService } from "../../hr.service";
import { UtilService } from "../../../../shared/service/util.service";
import { HttpService } from "../../../../shared/service/http.service";
import { ConstantsService } from "../../../../shared/service/constants.service";
import { GlobalService } from "../../../../shared/service/global.service";
import { Ng2ImgMaxService } from "ng2-img-max/dist/src/ng2-img-max.service";
import { DomSanitizer } from "@angular/platform-browser";
import { CustomValidator } from '../../../../shared/validators/custom-validator';
import { 
    each as _each, 
    map as _map,
    keys as _keys,
    values as _values,
    has as _has,
    isNull as _isNull
} from 'underscore';


@Component({
    selector: "app-add-sub-contractor",
    templateUrl: "./add-sub-contractor.component.html",
    styleUrls: ["./add-sub-contractor.component.css"]
  })
  export class AddSubContractorComponent implements OnInit, OnChanges {

    pageData: any = {
        permissionList: [],
        errMsg: "",
        isError: false,
        submitted: false,
        newFileUpload: false,
        isThumbnailSet: false,
        dragOver: false,
        attachments: [],
        action: "add",
        extraFields: [],
        emailAvailability: "",
        usernameAvailability: "",
        employeeIdAvailability: ""
    };

    mulSelSettings: IMultiSelectSettings = { displayAllSelectedText: true };
    serviceTypeList: IMultiSelectOption[] = [];
    selectText: IMultiSelectTexts = { defaultTitle: "" };

    public isCountry: boolean = false;
    public isEdit: boolean = false;
    public countries: any = [];

    addEmpFm: FormGroup;
    //public isError:boolean = false;
    isTSA: boolean = false; //if Trea Super Admin is logged in
    routStrArr;
    loggedInUser;
    autoNumber: number;

    @ViewChild("search")
    public searchElementRef: ElementRef;
    uploadedImage: File;
    imagePreview: string | ArrayBuffer;

    days_off_array = [
        'sun', 
        'mon', 
        'tue', 
        'wed', 
        'thu', 
        'fri', 
        'sat'
    ];

    extraFields: [];

    constructor(
        public router: Router,
        private route: ActivatedRoute,
        private hr: HrService,
        private fb: FormBuilder,
        private http: HttpService,
        private ref: ApplicationRef,
        public util: UtilService,
        private mapsAPILoader: MapsAPILoader,
        public constant: ConstantsService,
        private ngZone: NgZone,
        private global: GlobalService,
        private ng2ImgMax: Ng2ImgMaxService,
        public sanitizer: DomSanitizer,
        private file: FileService
    ) { }

    ngOnInit() {

        this.util.setWindowHeight();

        this.util.setPageTitle(this.route);

        this.autoNumber = this.util.getUniqueString();


        try {

            this.pageData.companyId = this.route.snapshot.paramMap.get("id");

            this.extraFields = this.route.snapshot.data.empExtraFields;

           this.util.setPageTitle(this.route);
                this.router.url.split("/")[2] == "csa-onboarding"
                ? this.util.menuChange({ menu: "guide", subMenu: "" })
                : this.util.menuChange({ menu: 6, subMenu: 29 });

            this.pageData.currentUrl = this.router.url.split("/")[2];

            this.routStrArr = this.router.url.split("/");

            this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));

            if (this.route.snapshot.data.serviceTypes) {

                this.serviceTypeList = this.route.snapshot.data.serviceTypes.filter(
                    item => (
                        (item.id = item.service_type_id), (item.name = item.service_type)
                    )
                )
            }

            // this.getCountries();

            
            // Check here exsting storage data
            if (sessionStorage.getItem("SUBCONTRACTOR_ADD")) {

                let editData = JSON.parse(sessionStorage.getItem("SUBCONTRACTOR_ADD"));
                
                this.pageData.action =  editData.id ? "edit" : "add";

                // Generat Form Controls
                this.createForm();

                if (_has(editData,'attachments') && editData.attachments.length > 0) {

                    _map(editData.attachments, (item) => {
                        this.addAttachments(item);
                    });

                }

                this.addDaysOff();
                
                // After
                this.setDaysOff(editData.days_off);

                this.formControlUpdate(editData);

            } else {
                
                // Generat Form Controls
                this.createForm();
                
                this.addDaysOff();
            }
            
        } catch (err) {

            this.global.addException("new subcontractor", "ngOnInit()", err);

        }

    }

    /**
     * Generate Form Contols Field for form Group
     * @return void
     */
    createForm(): void {

        this.addEmpFm = this.fb.group({
            // "user_id"           : 537,
            id        : new FormControl(""),
            first_name: new FormControl("", [
                Validators.required,
                Validators.maxLength(
                    this.constant.DEFAULT_TEXT_MAXLENGTH
                )
            ]),
            last_name: new FormControl("", [
                Validators.maxLength(
                    this.constant.DEFAULT_TEXT_MAXLENGTH
                )
            ]),
            employee_id: new FormControl("", 
                [
                    Validators.maxLength(30)
                ],
                CustomValidator.checkAvaibility(this.hr, 'employee_id', {
                    user_id:
                    this.pageData.action == "add"
                        ? ""
                        : JSON.parse(sessionStorage.getItem("SUBCONTRACTOR_ADD")).id
                })
            ),
            username: new FormControl("", 
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(
                        this.constant.DEFAULT_TEXT_MAXLENGTH
                    ),
                    Validators.pattern(
                        this.constant.NO_SPACE_PATTERN
                    )
                ]
            ),
            designation: new FormControl(""),
            country_code: new FormControl(""),
            mobile_no: new FormControl("", [
                Validators.pattern(
                    this.constant.PHONE_PATTERN
                )
            ]),
            email_id: new FormControl("", 
                [
                    Validators.required,
                    Validators.pattern(this.constant.EMAIL_PATTERN)
                ]
            ),
            work_phone: new FormControl("", [
                Validators.pattern(this.constant.PHONE_PATTERN)
            ]),
            title: new FormControl("", [Validators.maxLength(30)]),
            hourly_cost: new FormControl("", [
                Validators.min(0),
                Validators.pattern(this.constant.AMOUNT_PATTERN)
            ]),
            emergency_contact: new FormControl("", [Validators.maxLength(30)]),
            emergency_number: new FormControl("", [
                Validators.pattern(this.constant.PHONE_PATTERN)
            ]),
            relationship: new FormControl("", [Validators.maxLength(30)]),
            address_line_1: new FormControl("", [
                Validators.maxLength(this.constant.DEFAULT_TEXT_MAXLENGTH)
            ]),
            address_line_2: new FormControl("", [
                Validators.maxLength(this.constant.DEFAULT_TEXT_MAXLENGTH)
            ]),
            country_id: new FormControl(""),
            postal_code: new FormControl(""),
            latitude: new FormControl(""),
            longitude: new FormControl(""),
            user_services: new FormControl([]),
            days_off: this.fb.array([]),
            extra_fields: this.fb.array( this.createExtraFields(this.extraFields) ),
            attachments: this.fb.array([])
        });

        this.initiliseMapData();

    }

    ngOnChanges(changes: SimpleChanges){  }

    /**
     * Convert form control to Array
     * @param controlKey 
     * @return void
     */
    hasDataOf(controlKey: any) 
    {   
        let data = (<FormArray>this.addEmpFm.get(controlKey)) as FormArray;

        return _isNull(data) ? false : (data.length > 0) ? true : false ;
    }

    /**
     * Get Employe Id field value
     * @return number
     */
    get employee_id() {
        return this.addEmpFm.get("employee_id");
    }

    /**
     * Get email field value
     * @return string
     */
    get email_id() {
        return this.addEmpFm.get("email_id");
    }

    /**
     * Get username field value
     * @return string
     */
    get username() {
        return this.addEmpFm.get("username");
    }

    get getAttachments(): FormArray {
        return (<FormArray>this.addEmpFm.get("attachments")) as FormArray;
    }

    get days_off(): FormArray {
        return (<FormArray>this.addEmpFm.get("days_off")) as FormArray;
    }

    /**
     * 
     * @param event Submit form on key down
     * @param form 
     */
    keyDownFunction(event: any) {

        if (event.keyCode == 13) {

            event.preventDefault();

            return false;

        } else {

            this.createForm();
        }
    }

    /**
     * Update Form Controls inputs 
     * @param controlObject Controls
     * return void
     */
    formControlUpdate(controlObject) {
        
        this.addEmpFm.patchValue(controlObject);
    }

    /**
     * 
     * @param extraFields Fields Array
     * @return formGroup
     */
    createExtraFields(extraFields = [])
    {   
        this.routStrArr = this.router.url.split("/");

        let formFiledsWitContols = [];

        if (extraFields.length > 0) {

            _each(extraFields, (item) => {

                let validatorsArr: any =
                item.optional ==  false ? [Validators.required] : [];
    
                formFiledsWitContols.push(
                    this.fb.group(
                        {
                            extra_field_id  : new FormControl(item.extra_field_id),
                            value           : new FormControl('', [
                                                ...validatorsArr,
                                                ...this.util.getValidator(item.data_type)
                                            ]),
                            label           : new FormControl(item.label),
                            data_type       : new FormControl(item.data_type),
                            optional        : new FormControl(item.optional)
                        }
                    )
                );
    
            });
        }

        return formFiledsWitContols;
    }

    /** Creat Attachment form fields */
    createAttachmentsFields(data): FormGroup {

        return this.fb.group({
            attachment_type     : new FormControl(data.attachment_type),
            attachment_name     : new FormControl(data.attachment_name),
            attachment_path     : new FormControl(data.attachment_path),
            comment             : new FormControl(data.comment),
            is_thumbnail        : new FormControl(data.is_thumbnail),
            extension           : new FormControl(data.extension)
        });
    }

    /**
     * Set attachment control
     */
    setAttachmentControls(array) 
    {
        let formFiledsWitContols = [];

        if (array.length > 0) {

            _each(array, (item) => {
    
                formFiledsWitContols.push(this.createAttachmentsFields(item));
    
            });
        }

        return formFiledsWitContols;
    }

    /**
     * 
     * @param extraFields Fields Array
     * @return formGroup
     */
    addAttachments(data): void {

        let attachments = this.addEmpFm.get('attachments') as FormArray;
      
        return attachments.push(this.createAttachmentsFields(data));

    }

    addDaysOff(value :any = {}) {
        
        try {

            this.days_off.push(
                new FormGroup({
                    monday: new FormControl(value.monday ? value.monday : false),
                    tuesday: new FormControl(value.tuesday ? value.tuesday : false),
                    wednesday: new FormControl(value.wednesday ? value.wednesday : false),
                    thursday: new FormControl(value.thursday ? value.thursday : false),
                    friday: new FormControl(value.friday ? value.friday : false),
                    saturday: new FormControl(value.saturday ? value.saturday : false),
                    sunday: new FormControl(value.sunday ? value.sunday : false)
                })
            );

            
        } catch (err) {

            this.global.addException("new employee", "addDaysOff()", err);
        }
    }

    setDaysOff(array = []) {
        
        if (array.length > 0) {

            _each(array, (day, key) => {

                let control = this.addEmpFm.get(`days_off.0.${day}`);

                if (control != null) {
                    control.setValue(true);
                }
                
            });
        }

    }

    getSelectedDays() 
    {   
        let dayValues = _values(this.days_off.value[0]),
            dayKeys =_keys(this.days_off.value[0]),
            getSelectedDays = [];

    
        for (let i = 0; i < dayValues.length; i++) 
        {
            if (dayValues[i] === true) {
                getSelectedDays.push(dayKeys[i]);
            }
        }

        return _values(getSelectedDays);
    }

    next(form: FormGroup): void {

        // debugger;

        this.pageData.submitted = true;

        try {

            if (form.valid) {

                form.value.selUserServices = [];

                for (let i = 0; i < form.value.user_services.length; i++) {

                    if (this.serviceTypeList.length > 0) {

                        if (form.value.user_services[i]) {

                            let filteredResult = (this.serviceTypeList.filter(
                                item => item.id == form.value.user_services[i]
                            ));
                            
                            if (filteredResult.length > 0) {

                                form.value.selUserServices.push((filteredResult[0]).name);
                            }
                        }
                    }
                }

                // Set the selected values of days of 
                form.value.selectedDaysOff = this.getSelectedDays();

                this.util.setDocumentObj(form.get('attachments').value);

                form.value.id =
                    this.pageData.action == "edit"
                        ? JSON.parse(sessionStorage.getItem("SUBCONTRACTOR_ADD")).id
                        : 0;

                sessionStorage.setItem("SUBCONTRACTOR_ADD", JSON.stringify(form.value));

                if (this.loggedInUser.role_id == "1") {

                    this.router.navigate([
                        "/su/tsa/user-review/" + this.pageData.companyId
                    ]);

                } else {

                    this.router.url.split("/")[2] == "csa-onboarding"
                        ? this.router.navigate(["/hr/csa-onboarding/subcontractor-review"])
                        : this.router.navigate(["/hr/csa/subcontractor-review"]);
                }

            }

        } catch (err) {

            this.global.addException("new Subcontractor", "next()", err);
        }
    }

    cancel(): void {

        sessionStorage.removeItem('SUBCONTRACTOR_ADD');
        
        this.router.url.split("/")[1] == "su"
            ? this.router.navigate([
                "/su/tsa/users-list/" + this.pageData.companyId + "/0"
            ])
            : this.router.url.split("/")[2] == "csa-onboarding"
                ? this.router.navigate(["/csa-onboarding/guide"])
                : this.router.navigate(["/hr/csa/sub-contractor-list/0"]);
    }

    onFileChange(event): void {

        let self = this;

        let extension: string = "";

        let fileDetailsObj: any = {};

        self.pageData.errMsg = "";

        self.pageData.isError = false;

        let fileList: FileList = event.target.files;

        if (fileList.length > 0) {

            let image = event.target.files[0];

            self.ng2ImgMax.resizeImage(image, 1500, 750).subscribe(
                result => {
                    self.uploadedImage = new File([result], result.name);

                    self.getImagePreview(self.uploadedImage);

                },
                error => {
                    self.util.hideProcessing("processing-spinner");
                }
            );

            let imgCount = 0;
            
            self.addImg(imgCount, fileList, fileDetailsObj, extension);
        }
    }

    getImagePreview(file: File) {

        let self = this;

        const reader: FileReader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => {
            self.imagePreview = reader.result;
        };
    }

    getUploadedImagesCount() {

        let attchment = this.getAttachments.value;

        if (attchment.length == 0) {
            return 0;
        }

        let existingImages = [];
        
        _each(attchment, (row) => {

            if (row['attchment_type'] == 1) {
                existingImages.push(row);
            }

        });

        return existingImages.length;
    }

    addImg(imgCount: number, fileList, fileDetailsObj, extension): void {

        this.util.showProcessing("processing-spinner");
        
        let self = this;

        try {
            
            let file: File = fileList[imgCount],
                fileName: string[] = [];

            fileDetailsObj = { fileId: 0, isDelete: 0 };

            fileDetailsObj.is_thumbnail = imgCount == 0 ? 1 : 0;
            
            fileDetailsObj.fileName =
                fileList && fileList[imgCount].name ? fileList[imgCount].name : "";

            extension = fileList[imgCount].name.split(".").pop();

            fileName = fileList[imgCount].name.split(".");

            fileName.pop();

            if (
                extension == "jpg" ||
                extension == "png" ||
                extension == "pdf" ||
                extension == "jpeg"
            ) {

                
                if (fileList[imgCount].size / 1048576 < 10) {

                    self.convertToBase64(file, (base64) => {

                        fileDetailsObj.imgPath = JSON.parse(JSON.stringify(base64));
                        fileDetailsObj.description = "";
                        fileDetailsObj.fileName = fileName.join(".");
                        fileDetailsObj.extension = extension;
                        fileDetailsObj.file = file;

                        const formData: FormData = new FormData();

                        formData.append("file", file);

                        self.file.formDataAPICall(formData, 'attachments/upload', function(
                            error: boolean,
                            response: any
                          ) {
                              
                            self.util.hideProcessing("processing-spinner");

                            if (error) {

                                self.util.removeSpinner("csv-up-btn", "Image/Document Upload");
                           
                            } else {
                             
                                self.util.removeSpinner("csv-up-btn", "Image/Document Upload");

                                let requestData = response.data;

                                self.addAttachments({
                                    attachment_type : extension !== 'pdf' ? 1 : 2,
                                    attachment_name : requestData.file_name.split('.')[0],
                                    attachment_path : requestData.file_path,
                                    comment         : '',
                                    is_thumbnail    : (self.getUploadedImagesCount() == 0) ? 1 : 0,
                                    extension       : extension
                                });
                            }

                          });

                        self.ref.tick();

                        if (!self.pageData.isThumbnailSet) {
                            if (
                                extension == "jpg" ||
                                extension == "png" ||
                                extension == "jpeg"
                            ) {
                                fileDetailsObj.is_thumbnail = 1;
                                self.pageData.isThumbnailSet = true;
                                self.ref.tick();
                            }
                        }

                        if (self.pageData.attachments.length > 0) {
                            self.pageData.newFileUpload = false;
                            self.ref.tick();
                        }

                        if (imgCount < fileList.length - 1)
                            return self.addImg(
                                ++imgCount,
                                fileList,
                                fileDetailsObj,
                                extension
                            );
                    });

                } else {
                    self.util.hideProcessing("processing-spinner");
                    self.pageData.errMsg = "File must be less than 10 MB.";
                    self.pageData.isError = true;
                    self.ref.tick();
                }

            } else {
                self.util.hideProcessing("processing-spinner");
                self.pageData.isError = true;
                self.pageData.errMsg = "Only jpg, jpeg, png or pdf file allowed.";
                self.ref.tick();
            }

        } catch (err) {
            self.util.hideProcessing("processing-spinner");
            this.global.addException("new employee", "addImg()", err);
        }
    }

    convertToBase64(file, callback): void {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (fileLoadedEvent: any) => {
            return callback(fileLoadedEvent.target.result);
        };
    }

    onSelectionChange(index): void {
        
        this.getAttachments.at(index).get('is_thumbnail');

        _map(this.getAttachments.value, (item, i) => {

            if (index == i) {

                this.getAttachments.at(index).get('is_thumbnail').setValue(1);

            } else {

                this.getAttachments.at(i).get('is_thumbnail').setValue(0);

            }

            return item;

        });

    }

    changeUploadFileFlage(): void {
        this.pageData.newFileUpload = true;
        this.ref.tick();
    }

    removeImgDoc(index, option): void {

        // Update the attachment control)
        this.getAttachments.removeAt(index);
    }

    dropped(event: UploadEvent, option): void {

        let self = this;

        let extension: string = "";

        let fileDetailsObj: any = {};

        self.pageData.errMsg = "";

        self.pageData.isError = false;

        for (let file of event.files) {

            const fileEntry = file.fileEntry as FileSystemFileEntry;

            fileEntry.file(info => {

                if (info) {
                    self.addImg(0, [info], fileDetailsObj, extension);
                    self.pageData.dragOver = false;
                    this.ref.tick();
                }

            });
        }
    }

    fileOver(event): void {
        this.pageData.dragOver = true;
        this.ref.tick();
    }
    fileLeave(event): void {
        this.pageData.dragOver = false;
        this.ref.tick();
    }

    event(event: any): any {
        throw new Error("Method not implemented.");
    }

    initiliseMapData() {
        
        try {

            this.util.mapInit(
                this.mapsAPILoader,
                this.searchElementRef,
                this.ngZone,
                this.addEmpFm.get("address_line_1"),
                [
                    this.addEmpFm.get("country_id"),
                    this.addEmpFm.get("postal_code"),
                    this.addEmpFm.get("latitude"),
                    this.addEmpFm.get("longitude")
                ]
            );

        } catch (err) {
            this.global.addException("Add Employee", "initiliseMapData()", err);
        }
    }
}
