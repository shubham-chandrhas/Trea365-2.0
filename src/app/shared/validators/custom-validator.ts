import { AsyncValidatorFn, ValidationErrors, AbstractControl, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import * as moment from 'moment';

export class CustomValidator {
    
    constructor() {}


    static checkAvaibility(hr, controlName, requestObject = {}): AsyncValidatorFn | AsyncValidatorFn[] | null  {

        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            
            let controlValue = control.value;

            if ((controlValue == null || controlValue == undefined || controlValue == "")) {
                return of(null);
            }
            
            // Check if value is change & touch
            if (control.dirty || control.touched) {

                Object.assign(requestObject, {
                    [controlName] : controlValue
                });
                
                return hr.checkAvaibility(requestObject)
                    .then(r => {
                        
                        if (r && r['is_available'] === 1) {
                            
                            return {'already_exists' : true };

                        } else  { 

                            control.setErrors(null);
                            
                            return;
                        }
                    }
                );

            } else {
                return of(null);
            }
            
        };
    }

    static dateMinimum(date: string): ValidatorFn {

        return (control: AbstractControl): ValidationErrors | null => {

            if (control.value == null) {
                return null;
            }

            const FORMAT_DATE = 'yyyy-mm-dd';

            const controlDate = moment(control.value, FORMAT_DATE);

            if (!controlDate.isValid()) {
                return null;
            }

            const validationDate = moment(date);

            return controlDate.isAfter(validationDate) ? null : {
                'date-minimum': {
                    'date-minimum': validationDate.format(FORMAT_DATE),
                    'actual': controlDate.format(FORMAT_DATE)
                }
            };
        };
    }
    
}