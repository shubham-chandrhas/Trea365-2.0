import { Injectable} from '@angular/core';

import { HttpService } from '../../shared/service/http.service';

@Injectable({
    providedIn : 'root'
})
export class HrService {

	constructor(
        private httpService: HttpService) { }


    /**
     * Check Avaibility of property
     * @param any controlValue 
     * @return object
     */
    checkAvaibility(reqObj) {

        return new Promise( (resolve, reject) => {

            this.httpService.doPost("hr/employees/check-availability", reqObj, (
                error: boolean,
                response: any
            ) => {
                
                if (error) {
                    resolve(null);
                } else {
                    resolve(response.data);
                }

            });
        });


    }
}