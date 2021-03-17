import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {ConfigStoreService} from '../services/config-store.service';
import {CalendarComponent} from '../../datepicker/calendar/calendar.component';
import {DatepickerInputDirective, HcDatepickerInputEvent} from '../../datepicker/datepicker-input/datepicker-input.directive';
import {D} from '../../datepicker/datetime/date-formats';
import {FormControl, FormGroup, Validators} from '@angular/forms';

/** Component combining a calendar and input as a representation of a date  */
@Component({
    selector: 'hc-calendar-wrapper',
    templateUrl: './calendar-wrapper.component.html',
    styleUrls: ['./calendar-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class CalendarWrapperComponent implements OnChanges, OnInit {
    @HostBinding('class.hc-calendar-wrapper')
    _hostClass = true;

    @ViewChild(CalendarComponent, {static: true})
    hcCalendar: CalendarComponent;

    @ViewChild(DatepickerInputDirective, {static: true})
    datePickerInput: DatepickerInputDirective;

    /** Emits when selected date has changed. */
    @Output()
    readonly selectedDateChange: EventEmitter<D> = new EventEmitter<D>();

    /** Current selected date. */
    @Input()
    selectedDate: D | undefined;

    @Input()
    dateFormat: string;

    /** Whether the pickers include the calendar, time selector, or both. Defaults to `date`. */
    @Input()
    mode: 'date' | 'time' | 'date-time' = 'date';

    /** Whether the time picker should use a 12 or 24 hour clock. Defaults to 12. */
    @Input()
    hourCycle: number = 12;

    /** Prefix label on top of component. */
    @Input()
    prefixLabel: string;

    @Input()
    excludeWeekends: boolean;

    /** The minimum selectable date. */
    @Input()
    minDate: D | undefined;

    @Input()
    invalidDateLabel: string;

    /** Flag to filter out weekends. */
    @Input()
    maxDate: D | undefined;

    /** Flag to disable the input field for duration based ranges */
    @Input()
    disableDateInput: boolean = false;

    _form: FormGroup;

    weekendFilter = () => true;

    constructor(public configStore: ConfigStoreService) {}

    ngOnInit() {
        console.log('onInit');
        const selectedDateControl = new FormControl(this.selectedDate, Validators.required);
        if (this.disableDateInput) {
            selectedDateControl.disable();
        }
        this._form = new FormGroup({selectedDate: selectedDateControl});
    }

    ngOnChanges(changes: SimpleChanges) {
        // Necessary to force view refresh
        if (changes.selectedDate) {
            const date: D = changes.selectedDate.currentValue;
            if (date) {
                this.hcCalendar.activeDate = date;
                this.datePickerInput.setDate(date);
                this.selectedDateChange.emit(date);
            }
        }
    }

    _onCalendarChange(date: D) {
        this.selectedDateChange.emit(date);
    }

    _onInputChange(event: HcDatepickerInputEvent) {
        if (this.mode === 'time') {
            let tempVal = (event.value) ? new Date(1900, 1, 1, event.value.getHours(), event.value.getMinutes()) : new Date(1900, 1, 1);
            let minVal = (this.minDate) ? new Date(1900, 1, 1, this.minDate.getHours(), this.minDate.getMinutes()) : new Date(1900, 1, 1);
            let maxVal = (this.maxDate) ? new Date(1900, 1, 1, this.maxDate.getHours(), this.maxDate.getMinutes()) : new Date(1900, 1, 2);

            if (tempVal < minVal || tempVal > maxVal) {
                this.selectedDate = undefined;
                this.selectedDateChange.emit(undefined);
            } else {
                this.selectedDateChange.emit(event.value || undefined);
            }
        } else {
            if (event.value && ((this.minDate && event.value < this.minDate) || (this.maxDate && event.value > this.maxDate))) {
                this.selectedDate = undefined;
                this.selectedDateChange.emit(undefined);
            } else {
                this.selectedDateChange.emit(event.value || undefined);
            }
        }
    }

    /** Focus inner input */
    focusInput() {
        this.datePickerInput.focus();
    }
}
