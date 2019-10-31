import { UtilService } from './shared/service/util.service';
import { Router } from '@angular/router';
import { GlobalService } from './shared/service/global.service';
import { HttpService } from './shared/service/http.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class GetEmpDataResolver implements Resolve<any> {
    constructor(
        private http: HttpService,
        private global: GlobalService,
    ) { }

    resolve() {

        let promise = new Promise( (resolve) => {

            this.http.doGet("extra-fields/3", (error: boolean, response : any) => { 
                resolve(response.data);
            });

        });

        return promise.then( (response) => response);
    }
}


@Injectable()
export class GetServiceTypeResolver implements Resolve<any> {

    constructor(
        private http: HttpService,
        private util: UtilService,
        private route: ActivatedRoute,
    ) { 

    }

    resolve() {

        let loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));

        this.route.snapshot.paramMap.get("id");

        let id = (loggedInUser.role_id == '1') ? this.route.snapshot.paramMap.get("id"): '';

        let promise = new Promise( (resolve) => {

            this.http.doGet(id ? "hr/employees/service-type/" + id : "hr/employees/service-type", (error: boolean, response : any) => { 
                resolve(response.data);
            });

        });

        return promise.then( (response) => response);
    }
}


@Injectable()
export class GetSubContractorDataResolver implements Resolve<any> {
    constructor(
        private http: HttpService,
        private global: GlobalService,
    ) { }

    resolve() {

        let promise = new Promise( (resolve) => {

            this.http.doGet("extra-fields/4", (error: boolean, response : any) => { 
                resolve(response.data);
            });

        });

        return promise.then( (response) => response);
    }
}