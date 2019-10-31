import { Directive, HostBinding } from '@angular/core';

@Directive({
    selector: '[target=_blank]',
})
export class TargetBlankDirective {
    @HostBinding('attr.rel') rel = 'noopener noreferrer';
}
