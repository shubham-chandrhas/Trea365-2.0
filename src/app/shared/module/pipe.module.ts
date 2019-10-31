import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule, Injectable } from '@angular/core';
import { ListLengthfilterPipe, SortPipe, SearchfilterPipe, TruncatePipe, DifferantiatePipe, CalculateDistancePipe } from '../../shared/pipes/trea-filter.pipe';

@NgModule({
    imports: [ CommonModule ],
    declarations: [ ListLengthfilterPipe, SortPipe, SearchfilterPipe, TruncatePipe, DifferantiatePipe, CalculateDistancePipe ],
    exports: [ ListLengthfilterPipe, SortPipe, SearchfilterPipe, TruncatePipe, DifferantiatePipe, CalculateDistancePipe ]
})
export class PipeModule { }
