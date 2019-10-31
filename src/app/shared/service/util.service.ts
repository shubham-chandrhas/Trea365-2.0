import { Injectable, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { BehaviorSubject } from "rxjs";
import { MatDialog } from "@angular/material";
import {
    CognitoUserPool,
    CognitoUserAttribute,
    AuthenticationDetails,
    CognitoUser,
    AWSCognito
} from "amazon-cognito-identity-js/lib";
import {
    FormControl,
    Validators,
    FormGroup,
    FormBuilder
} from "@angular/forms";
import { Title } from "@angular/platform-browser";

import { APP_CONFIG, AppConfig } from "../../app-config.module";
import { ConstantsService } from "./constants.service";
import * as moment from "moment";
import { DialogMessageComponent } from "../model/dialog/dialog-message.component";
import Swal from "sweetalert2";
declare var jQuery: any;
declare var $: any;

import { has as _has } from 'underscore';

@Injectable()
export class UtilService {
    imageBaseURL: string;
    domainIP: string;
    loader: boolean;
    currentCurrency: string;
    currentCurrencySign: string;
    currentCountryCode: string;
    companyName: string;
    companyLogo: string;
    companyAddress: string;
    loggedInUserName: string;
    screenWidth: any;
    screenHeight: any;
    contentWidth: any;
    contentMinHeight: any;
    contentHeight: any;
    arrow: string;
    previousRoute = "";
    userAlertData: any = {
        isShow: false
    };
    unreadConversation: any[] = [];
    activeChatUserId: any = 0;
    poAction: any = "";
    poID: any = "0";

    private currentPath: string;
    private companyId: any;
    private role: string;
    private roleName: string;
    private isOpenPopup: boolean;
    private mfgPartData: any[] = [];
    private docObj: any[] = [];
    private currentOTFSupType = "";
    private receivingItemCount = 0;
    private randomNumber: string = "";
    public authObj: any;
    private menuSource: any = new BehaviorSubject("");
    private changeSource: any = new BehaviorSubject("");

    newMenuSelection = this.menuSource.asObservable();
    changeDetection = this.changeSource.asObservable();

    constructor(
        public router: Router,
        private titleService: Title,
        @Inject(APP_CONFIG) private config: AppConfig,
        private dialog: MatDialog,
        private datePipe: DatePipe,
        private constant: ConstantsService
    ) {
        this.imageBaseURL = config.domainIP + "/api/public/";
        this.domainIP = config.domainIP;
    }

    public menuChange(newMenuObj: any) {
        this.menuSource.next(newMenuObj);
    }
    public changeEvent(dataObj: any) {
        this.changeSource.next(dataObj);
    }
    // unsubscribeChange(){ this.changeDetection.complete(); };

    public showLoading() {
        this.loader = true;
    }
    public hideLoading() {
        this.loader = false;
    }

    public showProcessing(id) {
        $("#" + id).removeClass("dn");
    }
    public hideProcessing(id) {
        $("#" + id).addClass("dn");
    }

    public setCompanyId(id) {
        this.companyId = id;
    }
    public getCompanyId() {
        return this.companyId;
    }

    public setCompanyName(name) {
        this.companyName = name;
    }
    public getCompanyName() {
        return this.companyName;
    }

    public setCompanyAddress(address) {
        this.companyAddress = address;
    }

    public getCompanyAddress() {
        return this.companyAddress;
    }

    public setCurrency(currency) {
        this.currentCurrency = currency;
    }
    public getCurrency() {
        return this.currentCurrency;
    }

    public setCurrencySign(currencySign) {
        this.currentCurrencySign = currencySign;
    }
    public getCurrencySign() {
        return this.currentCurrencySign;
    }

    public setCountryCode(countryCode) {
        this.currentCountryCode = countryCode;
    }
    public getCountryCode() {
        return this.currentCountryCode;
    }

    public unMaskPhoneNumber(phone: any) {
        return phone ? phone.replace(/-/g, "") : "";
    }
    public maskPhoneNumber(phone: any) {
        return phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3") : "";
    }

    public setPopupFlag(value) {
        this.isOpenPopup = value;
    }
    public getPopupFlag() {
        return this.isOpenPopup;
    }

    public setCurrentPath(path) {
        this.currentPath = path;
    }
    public getCurrentPath() {
        return this.currentPath;
    }
    getUniqueString() {
        return new Date().getTime();
    }

    setCompanyLogo(url) {
        this.companyLogo = url;
    }
    getCompanyLogo() {
        return this.companyLogo;
    }

    setRole(role) {
        this.role = role;
    }
    getRole() {
        return parseInt(this.role, 10);
    }

    setRoleName(roleName) {
        this.roleName = roleName;
    }
    getRoleName() {
        return this.roleName;
    }

    setMfgPartData(data) {
        this.mfgPartData = data;
    }
    getMfgPartData() {
        return this.mfgPartData;
    }

    setDocumentObj(doc: any[]) {
        this.docObj = doc;
    }
    getDocumentObj() {
        return this.docObj;
    }

    setActiveChatUserId(userId) {
        this.activeChatUserId = userId;
    }
    getActiveChatUserId() {
        return this.activeChatUserId;
    }

    setLoggedInUserName(name) {
        this.loggedInUserName = name;
    }
    getLoggedInUserName() {
        return this.loggedInUserName;
    }
    setOTFSupType(type) {
        this.currentOTFSupType = type;
    }
    getOTFSupType() {
        return this.currentOTFSupType;
    }
    setReceivingItemCount(count) {
        this.receivingItemCount = count;
    }
    getReceivingItemCount() {
        return this.receivingItemCount;
    }

    setUnreadConversation(unreadConversation) {
        this.unreadConversation = unreadConversation;
    }
    getUnreadConversation() {
        return this.unreadConversation;
    }
    addUnreadConversation(userId) {
        this.unreadConversation.push(userId);
    }
    setAuthData(obj) {
        this.authObj = obj;
    }
    getAuthData() {
        return this.authObj;
    }
    removeConversation(userId) {
        for (let i = 0; i < this.unreadConversation.length; i++) {
            if (this.unreadConversation[i] === userId) {
                this.unreadConversation.splice(i, 1);
                break;
            }
        }
    }
    // Random Number for PE
    setRandomNumber(number) {
        this.randomNumber = number;
        sessionStorage.setItem("randomNumber", JSON.stringify(this.randomNumber));
    }
    getRandomNumber() {
        this.randomNumber = JSON.parse(sessionStorage.getItem("randomNumber"));
        return this.randomNumber;
    }

    removeWarningFlage() {
        sessionStorage.removeItem("WORNING_FLAGE");
    }

    playMsgAlert() {
        const audioPlayer: HTMLMediaElement = <HTMLVideoElement>(
            document.getElementById("player")
        );
        audioPlayer.play();
    }

    updatePagination() {
        const userDetails = JSON.parse(atob(localStorage.getItem("USER")));
        this.constant.PAGINATION_ITEMS = JSON.parse(
            JSON.stringify(this.constant.DEFAULT_PAGINATION_ITEMS)
        );
        this.constant.ITEMS_PER_PAGE = JSON.parse(
            JSON.stringify(this.constant.DEFAULT_ITEMS_PER_PAGE)
        );
        if (userDetails.settings && userDetails.settings.length > 0) {
            JSON.parse(atob(localStorage.getItem("USER"))).settings.map(item => {
                if (item.setting_key === "pagination_count") {
                    this.constant.ITEMS_PER_PAGE = parseInt(item.setting_value, 10);
                    if (
                        this.constant.PAGINATION_ITEMS.indexOf(
                            parseInt(item.setting_value, 10)
                        ) === -1
                    ) {
                        this.constant.PAGINATION_ITEMS.push(
                            parseInt(item.setting_value, 10)
                        );
                        this.constant.PAGINATION_ITEMS.sort(function (a, b) {
                            return a - b;
                        });
                    }
                }
            });
        }
    }

    showAlertToast(status, msg) {
        this.userAlertData.class =
            status === "Warning"
                ? "alert-warning"
                : status === "Suspended"
                    ? "alert-danger"
                    : "alert-info";
        this.userAlertData.iconClass =
            status === "Warning"
                ? "fa-exclamation-circle"
                : status === "Suspended"
                    ? "fa-exclamation-triangle"
                    : "fa-exclamation";
        this.userAlertData.msg = msg;
        this.userAlertData.isShow = true;
    }
    hideAlertToast() {
        this.userAlertData.isShow = false;
    }

    addSpinner(id, caption) {
        $("#" + id).addClass("ptrN");
        $("#" + id).html(
            `<i class="fa fa-spinner fa-pulse fa-3x fa-fw sub-action"></i> ` + caption
        );
    }

    removeSpinner(id, caption) {
        $("#" + id).removeClass("ptrN");
        $("#" + id).html(caption);
    }

    setPageTitle(route): void {
        this.titleService.setTitle(
            route.data.value.title ? route.data.value.title : "Trea365"
        );
    }

    changePage(event, paginationKey) {
        paginationKey.currentPage = event;
        window.scrollTo(0, 0);
    }
    changeItemPerPage() {
        window.scrollTo(0, 0);
    }
    scrollDown(id): void {
        try {
      $("html,body").animate(
        {
          scrollTop: $("#" + id).offset().top
        },
        300
      );
    } catch (err) {
      console.log(err);
    }
  }

    keyPress(event: any) {
        const pattern = /[0-9\ ]/;
        const inputChar = String.fromCharCode(event.charCode);
        if (
            (event.keyCode !== 8 && !pattern.test(inputChar)) ||
            event.keyCode === 32
        ) {
            event.preventDefault();
        }
    }

    searchInList(event: any, searchList) {
        if (event.keyCode === 13) {
            return searchList;
        } else {
            return;
        }
    }

    numberCheck(event: any) {
        const pattern = /^\d+$/;
        const inputChar = String.fromCharCode(event.charCode);
        if (
            (event.keyCode !== 8 && !pattern.test(inputChar)) ||
            event.keyCode === 32
        ) {
            event.preventDefault();
        }
    }
    numberCheckWithDecimalPt(event: any) {
        const pattern = /^\d*\.?\d+$/;
        const inputChar = String.fromCharCode(event.charCode);
        if (
            (event.keyCode !== 8 && !pattern.test(inputChar)) ||
            event.keyCode === 32
        ) {
            event.preventDefault();
        }
    }
    noSpace(event: any) {
        if (event.keyCode === 32) {
            event.preventDefault();
        }
    }

    noFirstSpace(event: any, value: string) {
        if (
            (!value && event.keyCode === 32) ||
            (value && value === "" && event.keyCode === 32)
        ) {
            event.preventDefault();
        }
    }

    removeCommas(field): void {
        field.setValue(
            field.value
                ? field.value.toString().indexOf(",") > -1
                    ? field.value.replace(/,/g, "")
                    : field.value
                : ""
        );
    }

    moneyCheck(event: any) {
        const pattern = /[0-9\.\ ]/;
        const inputChar = String.fromCharCode(event.charCode);
        if (
            (event.keyCode !== 8 && !pattern.test(inputChar)) ||
            event.keyCode === 32
        ) {
            event.preventDefault();
        }
    }

    clearAutoComplete(inputId, controls, indx: any = "") {
        const backspaceEvent = jQuery.Event("keyup", {
            keyCode: 20
        });
        $("#" + inputId + indx).trigger(backspaceEvent);
        setTimeout(function () {
            for (let i = 0; i < controls.length; i++) {
                controls[i].setValue("");
            }
        }, 1);
    }

    triggerOutSide() {
        $("body").triggerHandler("click");
        console.log();
        // $("#" + inputId).focus();
    }

    blurOnInput(inputId) {
        $("#" + inputId).triggerHandler("click");
        // $("#" + inputId).focus();
    }

    focusHiddenInput(inputId) {
        $("#" + inputId).click();
        // $("#" + inputId).focus();
    }

    getValidator(type) {
        let list: any = [];
        switch (type) {
            case "Number":
                list = [Validators.pattern(this.constant.POS_AND_NEQ_NUMBERS_PATTERN)];
                break;
            case "Decimal":
                list = [Validators.pattern(this.constant.DECIMAL_NUMBERS_PATTERN)];
                break;
            // case "Date":
            //     list = [ Validators.pattern(this.constant.DATA_PATTERN) ];
            //     break;
            default:
                list = [];
                break;
        }
        return list;
    }

    unixTimestampToLocalDate = (epoc: any): any => ({
        localDate: new Date(epoc * 1000)
    });

    // unixTimestampToLocalTime(epoc): any{
    //     let date = new Date(epoc*1000);
    //     let hours = date.getHours();
    //     let minutes: any = date.getMinutes();
    //     let ampm = hours >= 12 ? 'PM' : 'AM';
    //     hours = hours % 12;
    //     hours = hours ? hours : 12; // the hour '0' should be '12'
    //     minutes = minutes < 10 ? '0'+minutes : minutes;
    //     let strTime = hours + ':' + minutes + ' ' + ampm;
    //     console.log("strTime :::"+ strTime);
    //     return strTime;
    // }

    matchWithIgnoringSpaces(str1, str2): boolean {
        if (str1.split(" ").join("") === str1.split(" ").join("")) {
            return true;
        } else {
            return false;
        }
    }

    concatenateStrings(str1, str2) {
        return (str1 ? str1 + " ," : "") + "" + str2;
    }

    getYYYYMMDDDate(date) {
        return this.datePipe.transform(date, "yyyy-MM-dd");
    }
    getDDMMYYYYDate(date) {
        return date && date !== ""
            ? this.datePipe.transform(date, "dd/MM/yyyy")
            : "";
    }
    getTimeZoneDate(date) {
        const zoneDate = new Date(date);
        zoneDate.setMinutes(zoneDate.getMinutes() + zoneDate.getTimezoneOffset());
        return zoneDate;
    }
    // getFormatedDate(date){ return date && date != '' ? this.datePipe.transform(date, 'yyyy/MM/dd') : ''; }
    getFormatedDate(date) {
        return date && date !== "" ? moment(date).format("YYYY/MM/DD") : "";
    }
    stringToDate(dateStr) {
        const dateObj = new Date();
        if (dateStr && dateStr !== "") {
            dateObj.setFullYear(dateStr.split("/")[2]);
            dateObj.setMonth(parseInt(dateStr.split("/")[1], 10) - 1);
            dateObj.setDate(dateStr.split("/")[0]);
            return dateObj;
        } else {
            return "";
        }
    }

    getDateObjet(dateStr) {
        if (typeof dateStr === "object") {
            return dateStr;
        }
        const dateObj = new Date();
        if (dateStr.indexOf("-") > -1) {
            dateObj.setFullYear(dateStr.split("-")[0]);
            dateObj.setMonth(parseInt(dateStr.split("-")[1], 10) - 1);
            dateObj.setDate(
                dateStr.split("-")[2].length > 2
                    ? dateStr.split("-")[2].substring(0, 2)
                    : dateStr.split("-")[2]
            );
        } else if (dateStr.indexOf("/") > -1) {
            return this.stringToDate(dateStr);
        }
        return dateObj;
    }

    getPasswordStrength(password) {
        let digitCount = 0,
            speCharCount = 0,
            alphaCount = 0;
        // Regular Expressions.
        const regex = new Array();
        regex.push("[A-Z]"); // Uppercase Alphabet.
        regex.push("[a-z]"); // Lowercase Alphabet.
        regex.push("[0-9]"); // Digit.
        regex.push("[$@$!%*#?&]"); // Special Character.
        if (password && password !== "") {
            for (let i = 0; i < password.length; i++) {
                if (/[A-Z]/.test(password[i]) || /[a-z]/.test(password[i])) {
                    alphaCount = 1;
                } else if (/[0-9]/.test(password[i])) {
                    digitCount = 1;
                } else if (/[$@$!%*#?&]/.test(password[i])) {
                    speCharCount = 1;
                }
            }
        }
        let strength = "";
        if (password && password !== "") {
            if (
                digitCount + alphaCount + speCharCount === 3 &&
                password.length >= 8
            ) {
                strength = "strong";
            } else if (
                digitCount + alphaCount + speCharCount === 2 &&
                password.length >= 8
            ) {
                strength = "good";
            } else if (
                digitCount + alphaCount + speCharCount === 1 &&
                password.length >= 8
            ) {
                strength = "avg";
            } else {
                strength = "weak";
            }
        }
        return strength;
    }

    disableAutocomplete() {
        const allInputs: any = document.getElementsByTagName("input");
        const allForms = document.getElementsByTagName("form");
        const allNumberInputs = document.getElementsByTagName("number");
        for (let i = 0; i < allInputs.length; i++) {
            // allInputs[i].style.backgroundColor = "red";
            allInputs[i].setAttribute("autocomplete", "nope");
        }
        for (let i = 0; i < allForms.length; i++) {
            allForms[i].setAttribute("autocomplete", "off");
        }
        for (let i = 0; i < allNumberInputs.length; i++) {
            allNumberInputs[i].setAttribute("autocomplete", "nope");
        }
    }

    public initiateAuth(callback) {
        const self = this;
        const userpool = new CognitoUserPool({
            UserPoolId: this.config.awsUserPoolId, // "us-east-2_scrGK0WJO",
            ClientId: this.config.awsClientId // "68g4ktfiugs5v3nribkskg920n"
        });
        userpool.client.makeUnauthenticatedRequest(
            "initiateAuth",
            {
                ClientId: self.config.awsClientId,
                AuthFlow: "REFRESH_TOKEN_AUTH",
                AuthParameters: {
                    REFRESH_TOKEN: atob(localStorage.getItem("REFRESH_TOKEN")),
                    DEVICE_KEY: atob(localStorage.getItem("DEVICE_KEY"))
                }
            },
            (err, authResult) => {
                if (err) {
                    return callback(true, err);
                }
                console.log("::::::::contains new session");
                console.log(authResult); // contains new session

                return callback(false, authResult.AuthenticationResult);
            }
        );
    }

    public showDialog(
        DialogComponent,
        message: string = "",
        redirectURL: string[] = [],
        header: string = "",
        action: string = "SUCCESS",
        data: any = {},
        button: string = ""
    ): void {
        this.dialog.open(DialogComponent, {
            data: {
                action: action,
                header: header,
                message: message,
                redirectURL: redirectURL,
                data: data,
                button: button
            },
            autoFocus: false
        });
    }

    public updateValidators(
        form,
        control,
        validators: any[] = [],
        isArray: string = ""
    ): void {
        if (isArray === "") {
            form.controls[control].setValidators(validators);
            form.controls[control].updateValueAndValidity();
        } else {
            control.setValidators(validators);
            control.updateValueAndValidity();
        }
    }

    public addBulkValidators(
        form,
        controlsList,
        validators: any[] = [],
        isArray: string = ""
    ): void {
        for (let i = 0; i < controlsList.length; ++i) {
            this.updateValidators(form, controlsList[i], validators, isArray);
        }
    }

    public show404Page() {
        this.router.navigate(["404"]);
    }

    public forceLogout() {
        const dialogBox = this.showDialog(
            DialogMessageComponent,
            "Your session has expired. Please log in again.",
            ["login"]
        );
        const ShowdialogBox = localStorage.getItem("KEY") ? dialogBox : "";

        // localStorage.getItem("KEY")
        //   ? alert("Your session has expired. Please log in again.")
        //   : "";
        localStorage.removeItem("IS_REMEMBERME");
        localStorage.removeItem("KEY");
        sessionStorage.removeItem("KEY");
        window.localStorage.removeItem("KEY");
        window.sessionStorage.removeItem("KEY");
        window.sessionStorage.removeItem("refreshStatus");
        localStorage.clear();
        sessionStorage.clear();
        this.hideLoading();
        this.router.navigate(["login"]);
    }

    public setBgYellow(className: any) {
        if (className === "assetProd") {
            $(".reportsNav .tabs button").removeClass("bgYellow");
            $(".assetProd button").addClass("bgYellow");
        } else if (className === "workflow") {
            $(".reportsNav .tabs button").removeClass("bgYellow");
            $(".workflow button").addClass("bgYellow");
        } else if (className === "salesCRM") {
            $(".reportsNav .tabs button").removeClass("bgYellow");
            $(".salesCRM button").addClass("bgYellow");
        } else if (className === "financial") {
            $(".reportsNav .tabs button").removeClass("bgYellow");
            $(".financial button").addClass("bgYellow");
        } else if (className === "repairs") {
            $(".reportsNav .tabs button").removeClass("bgYellow");
            $(".repairs button").addClass("bgYellow");
        } else if (className === "hr") {
            $(".reportsNav .tabs button").removeClass("bgYellow");
            $(".hr button").addClass("bgYellow");
        }
    }

    public setWindowWidth() {
        this.screenWidth = $("body").prop("clientWidth");
        this.contentWidth = this.screenWidth - 190;
        $("#main").css("width", this.contentWidth + "px");
        document.getElementById("Sidenav").style.width = "170px";
    }

    public setWindowHeight() {
        // let headerHeight = $(".main-header").height();
        // let footerHeight = $(".main-footer").height();
        // this.screenHeight = window.innerHeight - headerHeight - footerHeight -20;
        // $(".content-wrapper").css("min-height", this.screenHeight+"px");

        const sidebarHeight = $("#leftside-navigation").height() || 0;
        if (sidebarHeight > window.innerHeight) {
            $(".content-wrapper").css("min-height", sidebarHeight + 250);
        } else {
            $(".content-wrapper").css(
                "min-height",
                window.innerHeight -
                $(".main-header").height() -
                $(".main-footer").height() -
                20
            );
        }
        // console.log("sidebarHeight",sidebarHeight);
        window.scrollTo(0, 0);
        this.disableAutocomplete();
    }

    public toggleNavFromUtil() {
        const sideWidth = document.getElementById("Sidenav").style.width;
        if (sideWidth === "55px" || sideWidth === "") {
            this.screenWidth = $("body").prop("clientWidth");
            this.contentWidth = this.screenWidth - 190;
            document.getElementById("Sidenav").style.width = "170px";
            document.getElementById("toggleMenu").style.width = "170px";
            this.arrow = "left_arrow";

            document.getElementById("main").style.width = this.contentWidth + "px";
            $(".sidebar #leftside-navigation ul li.active ul").slideDown();
        } else {
            this.screenWidth = $("body").prop("clientWidth");
            this.contentWidth = this.screenWidth - 70;
            document.getElementById("Sidenav").style.width = "55px";
            document.getElementById("toggleMenu").style.width = "55px";
            this.arrow = "right_arrow";

            document.getElementById("main").style.width = this.contentWidth + "px";
            $(".sidebar #leftside-navigation ul li.active ul").slideUp();
        }
        return this.arrow;
    }

    mapInit(
        mapsAPILoader,
        searchElementRef,
        ngZone,
        addressField,
        addressComponents: any = false
    ) {
        const self = this;
        try {
            // load Places Autocomplete
            mapsAPILoader.load().then(() => {
                const autocomplete = new google.maps.places.Autocomplete(
                    searchElementRef.nativeElement,
                    {
                        // types: ["address"]
                    }
                );
                autocomplete.addListener("place_changed", () => {
                    ngZone.run(() => {
                        // get the place result
                        const place: google.maps.places.PlaceResult = autocomplete.getPlace();
                        // verify result
                        if (place.geometry === undefined || place.geometry === null) {
                            return;
                        }
                        // console.log(place);
                        // console.log(JSON.stringify(place));
                        if (addressField) {
                            addressField.setValue(place.formatted_address);
                        }
                        addressComponents[0] &&
                            addressComponents[1] &&
                            addressComponents[2] &&
                            addressComponents[3] &&
                            addressComponents[4]
                            ? this.getAddressComponents(place, addressComponents)
                            : "";

                        addressComponents[5]
                            ? addressComponents[5].setValue(place.geometry.location.lat())
                            : "";
                        addressComponents[6]
                            ? addressComponents[6].setValue(place.geometry.location.lng())
                            : "";
                        // console.log(
                        //   "Latitude : " +
                        //     place.geometry.location.lat() +
                        //     " Longitude : " +
                        //     place.geometry.location.lng()
                        // );
                        // addressComponents ? this.getAddressComponents(place, addressComponents) : '';
                        // console.log("addressComponents", addressComponents);
                        // console.log("addressComponents[5].value", addressComponents[5].value);
                        // console.log("addressComponents[6].value", addressComponents[6].value);
                    });
                });
            });
        } catch (err) {
            console.log(err);
            // this.global.addException('add location','mapInit()',err);
        }
    }

    getAddressComponents(place, addressComponents) {
        addressComponents[0].setValue("");
        addressComponents[1].setValue("");
        addressComponents[2].setValue("");
        addressComponents[3].setValue("");
        place.address_components.forEach(element => {
            // console.log(element);
            if (element.types.indexOf("country") > -1) {
                // console.log("Country ::", element.long_name);
                // addressComponents[0].setValue(element.long_name);
                this.setCountry(
                    element.long_name,
                    addressComponents[0],
                    addressComponents[4]
                );
            } else if (element.types.indexOf("administrative_area_level_1") > -1) {
                console.log("State ::", element.long_name);
                addressComponents[1].setValue(element.long_name);
            } else if (element.types.indexOf("administrative_area_level_2") > -1) {
                console.log("City :: ", element.long_name);
                addressComponents[2].setValue(element.long_name);
            } else if (element.types.indexOf("postal_code") > -1) {
                console.log("Postal Code :: ", element.long_name);
                addressComponents[3].setValue(element.long_name);
            }
        });
    }

    setCountry(country, countryField, countryList) {
        for (let i = 0; i < countryList.countries.length; i++) {
            if (
                countryList.countries[i].country_name.toLowerCase() ===
                country.toLowerCase()
            ) {
                countryField.setValue(countryList.countries[i].country_id);
                break;
            }
        }
    }

    setMask(format) {
        const maskFormatArray = format.slice(1, format.length - 1).split(",");
        let maskString = "";
        for (let i = 0; i < maskFormatArray.length - 1; i++) {
            maskString = maskString + maskFormatArray[i];
        }

        let maskLen = maskFormatArray[maskFormatArray.length - 1];
        maskLen = parseInt(maskLen.slice(1, maskLen.length - 1), 10);

        const setMaskFormat: any = [];

        for (let i = 0; i < maskLen; i++) {
            setMaskFormat.push("/" + maskString + "/");
        }

        const maskFormat = format.slice(1, format.length - 1);
        console.log("maskFormat", format[0]);
        return format;
    }
    closePanel() {
        const setVisiblity = <any>(
            document.querySelector(".mat-autocomplete-panel.mat-autocomplete-visible")
        );
        setVisiblity.style.visibility = "collapse";
    }

    public getMenulist(): any[] {
        return this.constant.MENU_LIST;
    }
    public showAlert(message) {
         Swal.fire({
            title: "Warning!",
            html: `${message}`,
            type: "warning",
            confirmButtonText: "OK",
            confirmButtonColor: "#00a499",
            // showCancelButton: true,
            // cancelButtonText: "No",
            allowOutsideClick: false
        });
    }
    public OpenWindow(elem) {
        elem.open();
    }

    public CloseWindow(elem) {
        elem.close();
    }

    /**
       * Decimal adjustment of a number.
       *
       * @param   {String}    type    The type of adjustment.
       * @param   {Number}    value   The number.
       * @param   {Integer}   exp     The exponent (the 10 logarithm of the adjustment base).
       * @returns {Number}            The adjusted value.
       */
    precise_round(num, dec) {

        if ((typeof num !== 'number') || (typeof dec !== 'number'))
            return 0.00;

        var num_sign = num >= 0 ? 1 : -1;

        return (Math.round((num * Math.pow(10, dec)) + (num_sign * 0.0001)) / Math.pow(10, dec)).toFixed(dec);
    }


    /**
     * Calculate Final Amount As per parameters
     * Tax applied on (subtotal + adjustmentAmount)
     * @param subtotal
     * @param adjustmentAmount
     * @param taxPercentage
     * @param taxAmount
     * @param shippingAndHandllingAmount
     * @param totalPaymentAmount
     * @return object
     */
    public calculatePrices(
        subtotal,
        adjustmentAmount,
        taxPercentage,
        taxAmount,
        shippingAndHandllingAmount,
        totalPaymentAmount
    ): Object {
        subtotal = parseFloat(subtotal);
        adjustmentAmount = parseFloat(adjustmentAmount);
        taxPercentage = parseFloat(taxPercentage);
        taxAmount = parseFloat(taxAmount);
        shippingAndHandllingAmount = parseFloat(shippingAndHandllingAmount);
        totalPaymentAmount = parseFloat(totalPaymentAmount);

        let total =
            (isNaN(adjustmentAmount) ? 0.0 : parseFloat(adjustmentAmount)) +
            (isNaN(subtotal) ? 0.0 : parseFloat(subtotal));

        taxAmount =
            taxPercentage > 0 ? ((taxPercentage / 100) * total).toFixed(2) : 0.0;

        total += isNaN(taxAmount) ? 0.0 : parseFloat(taxAmount);
        total += isNaN(shippingAndHandllingAmount)
            ? 0.0
            : shippingAndHandllingAmount;

        // if (subtotal == 0) {
        //     totalPaymentAmount = 0.0;
        // } else {
            totalPaymentAmount = total;
       // }

        return {
            subtotal: subtotal,
            adjustmentAmount: adjustmentAmount,
            taxPercentage: taxPercentage,
            taxAmount: taxAmount,
            shippingAndHandllingAmount: shippingAndHandllingAmount,
            totalPaymentAmount: this.precise_round(totalPaymentAmount, 2)
        };
    }

    /**
     * Helper function to return the appropriate object from id
     * @param needle
     * @param haystackArr
     * @param comparisonField
     * @param multipleResults
     * @return any
     */
    public getEntity(
        needle: any,
        haystackArr: Array<any>,
        comparisonField: any,
        multipleResults: boolean = false
    ): any {
        let result = [];

        for (let i = 0; i < haystackArr.length; i++) {
            if (haystackArr[i][comparisonField] == needle) {
                if (multipleResults) {
                    result.push(haystackArr[i]);
                } else {
                    result = haystackArr[i];
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Verify amount
     * @return boolean;
     */
    public idOverriedAmount(totalAmount, amount_remaining) {
        if (parseFloat(totalAmount) > parseFloat(amount_remaining)) {
            return `You can't add payment amount more than the remaining amount i.e ${this.getCurrencySign()}${amount_remaining}`;
        }

        return false;
    }

    get getPermisssions() {

        let userInfo = JSON.parse(atob(localStorage.getItem("USER")));
        // console.log(userInfo);

        return _has(userInfo, 'permissions') ? userInfo['permissions'] : [];
    }

    /**
     * Check the permission of slug which is pass
     * @param string slugString
     * @return boolean
     */
    public canAccess(slugString:string): boolean
    {
        if (this.getRole() == 2) { // Authorized User
            return true;
        }

        let permissions = this.getPermisssions;

        if (permissions.length > 0) {

            let foundedPermission = permissions.filter( (p) => p.permission_slug == slugString);

            if (foundedPermission.length == 0) {
                return false;
            }

            return Boolean(foundedPermission[0]['status']);
        }

        return false;
    }
    /**
     *
     */
    getDayType () {
      return moment().isBefore(moment({ hour: 13, minute: 0 })) ? "Morning" :
      moment().isBetween(moment({ hour: 13, minute: 0 }), moment({ hour: 17, minute: 0 })) ? "Afternoon" : "Evening"; // false
    }
}
