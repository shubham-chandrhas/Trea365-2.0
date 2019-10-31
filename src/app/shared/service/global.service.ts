import { Injectable, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { APP_CONFIG, AppConfig } from "../../app-config.module";
import { HttpService } from "./http.service";

@Injectable()
export class GlobalService {
  route: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpService,
    private router: Router,
    private location: Location
  ) {
    router.events.subscribe((val) => {
      if (location.path() !== "") {
        this.route = location.path();
      } else {
        this.route = "Dashboard";
      }
    });
  }

  getCountries(callback) {
    this.http.doGet("company/country-list", function (error: boolean, response: any) {
      if (error) {
        return callback([]);
      } else {
        return callback(response.data);
      }
    });
  }

  getProviences(countryId, callback) {
    this.http.doGet("provinces/" + countryId, function (error: boolean, response: any) {
      if (error) {
        return callback([]);
      } else {
        return callback(response.data);
      }
    });
  }

  getCities(provienceId, callback) {
    this.http.doGet("city/" + provienceId, function (error: boolean, response: any) {
      if (error) {
        return callback([]);
      } else {
        return callback(response.data);
      }
    });
  }

  addException(moduleName, functionName, exceptionObj, data: any = {}) {
// tslint:disable-next-line: no-console
    console.info("--:::::::::: Exception Occurred ::::::::::--");
    console.warn("Module :: " + moduleName + "   Function :: " + functionName);
    console.warn(exceptionObj.message);
    console.log(exceptionObj);

    if(exceptionObj.statusCode)
    {
        if(exceptionObj.statusCode != "403")
        {
            const reqObj: any = {
                "error_type": "Front End Exception",
                "requested_data": {
                    "exception_error_message": exceptionObj.message,
                    "exception_error_name": exceptionObj.name,
                    "data": data
                },
                "response_sent": exceptionObj.message,
                "url": window.location.href,
                "request_method": "N/A",
                "priority": "Medium",
                "remarks": "Module Name - " + moduleName + " | " + "Function Name - " + functionName
            };
            this.http.doPost("company/error-log", reqObj, function (error: boolean, response: any) {
                if (!error) {
                    console.log(response.message);
                }
            });
        }
        
    }
    else{
        const reqObj: any = {
            "error_type": "Front End Exception",
            "requested_data": {
                "exception_error_message": exceptionObj.message,
                "exception_error_name": exceptionObj.name,
                "data": data
            },
            "response_sent": exceptionObj.message,
            "url": window.location.href,
            "request_method": "N/A",
            "priority": "Medium",
            "remarks": "Module Name - " + moduleName + " | " + "Function Name - " + functionName
        };
        this.http.doPost("company/error-log", reqObj, function (error: boolean, response: any) {
            if (!error) {
                console.log(response.message);
            }
        });
    }

    
  }

  checkUniqueNess(event: any, path: any, callback) {
    const self = this;
    if (!event.valid && !event.dirty) {
      return callback(false);
    }
    try {
      if (event.value !== "") {
        this.http.doGet(path + event.value, function (error: boolean, response: any) {
          if (error) {
            return callback(false);
          } else {
            // return  callback(false);
            return callback(parseInt(response.data.is_available, 10) === 1 ? true : false);
          }
        });
      }
    } catch (err) {
      this.addException("check unique", "checkUniqueNess()", err);
    }
  }

  checkUnique(event: any, path, reqObj, callback) {
    if (!event.valid && !event.dirty) {
      return callback(false);
    }
    try {
      this.http.doPost(path, reqObj, function (error: boolean, response: any) {
        if (error) {
          return callback(false);
        } else {
          return callback(response.data.is_available === 1 ? true : false);
        }
      });
    } catch (err) {
      this.addException("check unique", "checkUnique()", err);
    }
  }
}
