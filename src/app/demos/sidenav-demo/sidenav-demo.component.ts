import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CheckboxChangeEvent, IUser} from '@wcf-insurance/cashmere';
import {BreakpointObserver, BreakpointState} from '@angular/cdk/layout';
import {FormControl, Validators} from '@angular/forms';

@Component({
    selector: 'hc-sidenav-demo',
    templateUrl: 'sidenav-demo.component.html',
    styleUrls: ['sidenav-demo.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SidenavDemoComponent implements OnInit {
    mobileView = false;
    user: IUser = {
        name: 'John Doe',
        avatar: '/src/assets/avatar.jpg'
    };

    jobName = new FormControl('', [Validators.required]);
    runFrequency = new FormControl('', [Validators.required]);

    dummyContent: string[] = [];

    constructor(public breakpointObserver: BreakpointObserver) {
    }

    ngOnInit() {
        this.jobName = new FormControl('', [Validators.required]);
        this.runFrequency = new FormControl('', [Validators.required]);

        this.breakpointObserver
            .observe(['(max-width: 768px)'])
            .subscribe((state: BreakpointState) => {
                if (state.matches) {
                    this.mobileView = true;
                    console.log('Viewport is 768px or under!');
                } else {
                    this.mobileView = false;
                    console.log('Viewport is getting bigger!');
                }
            });

        for (let i = 0; i < 30; i++) {
            this.dummyContent.push(`Content ${i + 1}`);
        }
    }

    mobileViewChanged(event: CheckboxChangeEvent) {
        this.mobileView = event.checked;
    }
}
