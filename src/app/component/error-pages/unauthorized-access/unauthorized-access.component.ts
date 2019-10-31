import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'app-unauthorized-access',
  templateUrl: './unauthorized-access.component.html',
  styleUrls: ['./unauthorized-access.component.scss']
})
export class UnauthorizedAccessComponent implements OnInit {

  constructor(private _location: Location) { }

  ngOnInit() {
  }

  goToBack(){
    	this._location.back();
    }

}
