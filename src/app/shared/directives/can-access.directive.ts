import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { UtilService } from './../service/util.service';

@Directive({
    selector: '[canAccess]'
})
export class CanAccessDirective implements OnInit {

    @Input('canAccess') canAccessSlug: string;

    constructor(
        private el: ElementRef,
        private util : UtilService) { }

    ngOnInit() {
        if (!this.util.canAccess(this.canAccessSlug)) {
            this.el.nativeElement.style.display = 'none';
        }
    }




}
