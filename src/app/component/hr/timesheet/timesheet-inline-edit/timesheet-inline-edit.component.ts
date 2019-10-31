import { Component, OnInit, EventEmitter, ContentChild, Output, ElementRef } from '@angular/core';
import { EditModeDirective } from '../../../../shared/directives/edit-mode.directive';
import { ViewModeDirective } from '../../../../shared/directives/view-mode.directive';
import { Subject, fromEvent } from 'rxjs';
import { filter, take, switchMapTo } from 'rxjs/operators';

@Component({
    selector: 'editable',
    templateUrl: './timesheet-inline-edit.component.html',
    styleUrls: ['./timesheet-inline-edit.component.scss']
})
export class TimesheetInlineEditComponent {

    @Output() update = new EventEmitter();
    @ContentChild(ViewModeDirective) viewModeTpl: ViewModeDirective;
    @ContentChild(EditModeDirective) editModeTpl: EditModeDirective;

    mode: 'view' | 'edit' = 'view';

    editMode = new Subject();
    editMode$ = this.editMode.asObservable();

    constructor(private host: ElementRef) { }

    get currentView() {
        return this.mode === 'view' ? this.viewModeTpl.tpl : this.editModeTpl.tpl;
    }

    ngOnInit() {
        this.viewModeHandler();
        this.editModeHandler();
    }

    private get element() {
        return this.host.nativeElement;
    }

    private viewModeHandler() { 

        fromEvent(this.element, 'dblclick').pipe(
            //untilDestroyed(this)
        ).subscribe(() => {
            this.mode = 'edit';
            this.editMode.next(true);
        });
    }

    private editModeHandler() {
        const clickOutside$ = fromEvent(document, 'click').pipe(filter(({ target }) => this.element.contains(target) === false),take(1));
    
        this.editMode$.pipe(
            switchMapTo(clickOutside$), // untilDestroyed(this)
        ).subscribe(event => {
            this.update.next();
            this.mode = 'view';
        });
    }

}