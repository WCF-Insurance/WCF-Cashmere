import {Component, Input, OnInit} from '@angular/core';

import {LocationInfo} from './location-info.model';

@Component({
    selector: 'hc-location-info',
    templateUrl: './location-info.component.html',
    styleUrls: ['./location-info.component.scss']
})
export class LocationInfoComponent implements OnInit {

    @Input()
    set locationInfo(value) {
        this._locationInfo = value;
    }
    get locationInfo(): LocationInfo {
        return this._locationInfo;
    }
    _locationInfo: LocationInfo;

    constructor() {
    }

    ngOnInit() {
    }

}
