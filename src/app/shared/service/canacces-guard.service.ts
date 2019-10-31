import { Injectable } from '@angular/core';
import { UtilService } from './util.service';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { has as _has}  from 'underscore';

@Injectable({
    providedIn: 'root'
})
export class CanaccesGuardService implements CanActivate {

    constructor(
        private util : UtilService,
        private router : Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {

        let stateData = _has(route.data, 'permission_slug');

        // if the permission_slug attached to state the check the permission of passes slug
        if (stateData) {
            
            // check permission of slug which is take from current state
            let canAccess = this.util.canAccess(route.data['permission_slug']);
            
            // if denied access the redirect on perticular page
            if (!canAccess) {
                
               this.router.navigateByUrl('/unauthorized-access');

               return false;

            }

            return true;
        }

        return true;
    }

}
