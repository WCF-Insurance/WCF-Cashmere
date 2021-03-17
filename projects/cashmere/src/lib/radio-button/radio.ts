import {
    AfterContentInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    Directive,
    DoCheck,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostBinding,
    Input,
    OnInit,
    Optional,
    Output,
    QueryList,
    Self
} from '@angular/core';
import {parseBooleanAttribute} from '../util';
import {HcFormControlComponent} from '../form-field/hc-form-control.component';
import {ControlValueAccessor, FormGroupDirective, NgControl, NgForm} from '@angular/forms';

let nextUniqueId = 0;

/** Groups single radio buttons together into a set for which only one can be selected */
@Directive({
    // tslint:disable:directive-selector
    selector: 'hc-radio-group',
    providers: [{provide: HcFormControlComponent, useExisting: forwardRef(() => RadioGroupDirective), multi: true}],
    exportAs: 'hcRadioGroup'
})
export class RadioGroupDirective extends HcFormControlComponent implements ControlValueAccessor, AfterContentInit, DoCheck {
    @HostBinding('class.hc-radio-group-vertical')
    _verticalClass: boolean = true;
    @HostBinding('class.hc-radio-group-horizontal')
    _horizontalClass: boolean = false;

    /** Event emitted when the value of a radio button changes inside the group. */
    @Output()
    change: EventEmitter<RadioButtonChangeEvent> = new EventEmitter<RadioButtonChangeEvent>();
    /** A list of all the radio buttons included in the group */
    @ContentChildren(
        forwardRef(() => RadioButtonComponent),
        {descendants: true}
    )
    radios: QueryList<RadioButtonComponent>;
    private _value: any = null;
    private _uniqueName = `hc-radio-group-${nextUniqueId++}`;
    private _name = this._uniqueName;
    private _inline = false;
    private _initialized = false; // if value of radio group has been set to initial value
    private _selected: RadioButtonComponent | null = null; // the currently selected radio
    private _form: NgForm | FormGroupDirective | null;

    _componentId = this._name;

    _onChangeFn: (value: any) => void = () => {};
    _onTouchFn: () => any = () => {};

    /** Name of radio group. Auto-generated name will be used if no name is set */
    @Input()
    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value ? value : this._uniqueName;
        this._updateRadioButtonNames();
    }

    /** Unique id for the radio group. If none is supplied, defaults to name. */
    @Input()
    get id(): string {
        return this._componentId || this._name;
    }

    set id(idVal: string) {
        this._componentId = idVal ? idVal : this._name;
    }

    /** Value of radio buttons */
    @Input()
    get value(): any {
        return this._value;
    }

    set value(newValue: any) {
        if (this._value !== newValue) {
            this._value = newValue;
            this._updateSelectedRadio();
            this._checkSelectedRadio();
        }
    }

    /** Boolean value that enables/disables the radio group */
    @Input()
    get disabled(): boolean {
        if (this._ngControl && this._ngControl.disabled) {
            return this._ngControl.disabled;
        }
        return this._isDisabled;
    }

    set disabled(value) {
        this._isDisabled = parseBooleanAttribute(value);
        this._markRadiosForCheck();
    }

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    /** Boolean value of whether the radio group is required on a form */
    @Input()
    get required(): boolean {
        return this._isRequired;
    }

    set required(value) {
        this._isRequired = parseBooleanAttribute(value);
        this._markRadiosForCheck();
    }

    /** Gets and sets the currently selected value of the radio button group */
    get selected(): RadioButtonComponent | null {
        return this._selected;
    }

    set selected(button: RadioButtonComponent | null) {
        this._selected = button;
        this.value = button ? button.value : null;
        this._checkSelectedRadio();
    }

    /** Sets the layout orientation of the radio button group; defaults to false */
    @Input()
    get inline(): boolean {
        return this._inline;
    }

    set inline(value) {
        this._inline = parseBooleanAttribute(value);
        this._verticalClass = !this._inline;
        this._horizontalClass = this._inline;
    }

    constructor(
        private _cdRef: ChangeDetectorRef,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        @Optional()
        @Self()
        public _ngControl: NgControl
    ) {
        super();

        this._form = _parentForm || _parentFormGroup;
        if (this._ngControl != null) {
            this._ngControl.valueAccessor = this;
        }
    }

    ngAfterContentInit() {
        this._initialized = true;
    }

    writeValue(value: any) {
        this.value = value;
        this._cdRef.markForCheck();
    }

    registerOnChange(fn: any) {
        this._onChangeFn = fn;
    }

    registerOnTouched(fn: any) {
        this._onTouchFn = fn;
    }

    _touch() {
        if (this._onTouchFn) {
            this._onTouchFn();
        }
    }

    _emitChangeEvent(): void {
        if (this._initialized) {
            this.change.emit(new RadioButtonChangeEvent(this._selected, this.value));
        }
    }

    markAsTouched() {
        if (this._ngControl) {
            const control = this._ngControl.control;
            if (control) {
                control.markAsTouched();
            }
        }
    }

    private _markRadiosForCheck() {
        if (this.radios) {
            this.radios.forEach(radio => radio._markForCheck());
        }
    }

    private _updateSelectedRadio() {
        let isAlreadySelected = this._selected !== null && this._selected.value === this._value;
        if (this.radios && !isAlreadySelected) {
            this._selected = null;
            this.radios.forEach(radio => {
                radio.checked = this.value === radio.value;
                if (radio.checked) {
                    this._selected = radio;
                }
            });
        }
    }

    private _checkSelectedRadio() {
        if (this._selected && !this._selected.checked) {
            this._selected.checked = true;
        }
    }

    private _updateRadioButtonNames(): void {
        if (this.radios) {
            this.radios.forEach(radio => {
                radio.name = this.name;
            });
        }
    }

    ngDoCheck(): void {
        // This needs to be checked every cycle because we can't subscribe to form submissions
        if (this._ngControl) {
            this._updateErrorState();
        }
    }

    private _updateErrorState() {
        const oldState = this._errorState;

        // TODO: this could be abstracted out as an @Input() if we need this to be configurable
        const newState = !!(
            this._ngControl &&
            this._ngControl.invalid &&
            (this._ngControl.touched || (this._form && this._form.submitted))
        );

        if (oldState !== newState) {
            this._errorState = newState;
        }
    }
}

/** Event type that is emitted when a radio button or radio button group changes */
export class RadioButtonChangeEvent {
    /**
     * @param source the radio button that fired the event
     * @param value the value of that radio button
     */
    constructor(public source: RadioButtonComponent | null, public value: any) {}
}

/** Radio buttons allow the user to choose only one of a predefined set of mutually exclusive options. */
@Component({
    selector: 'hc-radio-button',
    templateUrl: './radio-button.component.html',
    styleUrls: ['./radio-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonComponent implements OnInit {
    private _uniqueId = `hc-radio-button-${nextUniqueId++}`;
    /** Element id for the radio button. Auto-generated id will be used if none is set */
    @Input()
    id: string = this._uniqueId;
    /** Name of radio button */
    @Input()
    name: string;
    /** Event emitted when the value of the radio button changes */
    @Output()
    change = new EventEmitter<RadioButtonChangeEvent>();
    private _checked: boolean = false;
    private _value: any = null;
    private _required: boolean = false;
    private _disabled: boolean = false;
    private readonly radioGroup: RadioGroupDirective | null;

    focused = false;

    /** Value of radio buttons */
    @Input()
    get value() {
        return this._value;
    }

    set value(value: any) {
        if (this._value !== value) {
            this._value = value;
            if (this.radioGroup !== null && !this.checked) {
                this.checked = this.radioGroup.value === value;
            } else if (this.radioGroup !== null && this.checked) {
                this.radioGroup.selected = this;
            }
        }
    }

    @HostBinding('attr.id')
    get _getHostId(): string {
        return this.id;
    }

    @HostBinding('class.hc-radio-focused')
    get _getRadioFocusedClass(): boolean {
        return this.focused;
    }

    /** Boolean value of whether the radio button is required */
    @Input()
    get required(): boolean {
        return this._required || (this.radioGroup != null && this.radioGroup.required);
    }

    set required(required) {
        this._required = parseBooleanAttribute(required);
    }

    /** Boolean value that enables/disables the radio button */
    @Input()
    get disabled(): boolean {
        return this._disabled || (this.radioGroup != null && this.radioGroup.disabled);
    }

    set disabled(isDisabled) {
        this._disabled = parseBooleanAttribute(isDisabled);
    }

    /** Boolean that returns whether the radio button is selected */
    @Input()
    get checked(): boolean {
        return this._checked;
    }

    set checked(value: boolean) {
        let newCheckedState = parseBooleanAttribute(value);
        if (this._checked !== newCheckedState) {
            this._checked = newCheckedState;
            if (newCheckedState && this.radioGroup && this.radioGroup.value !== this.value) {
                this.radioGroup.selected = this;
            } else if (!newCheckedState && this.radioGroup && this.radioGroup.value === this.value) {
                this.radioGroup.selected = null;
            }
            this.cdRef.markForCheck();
        }
    }

    get _inputId() {
        return `${this.id || this._uniqueId}-input`;
    }

    constructor(@Optional() radioGroup: RadioGroupDirective, private cdRef: ChangeDetectorRef, public _elementRef: ElementRef) {
        this.radioGroup = radioGroup;
    }

    ngOnInit() {
        if (this.radioGroup !== null) {
            this.checked = this.radioGroup.value === this._value;
            this.name = this.radioGroup.name;
        }
    }

    _onInputClick(event: Event) {
        event.stopPropagation();
    }

    _onInputChange(event: Event) {
        event.stopPropagation();
        const valueChanged = this.radioGroup && this.value !== this.radioGroup.value;
        this._emitChangeEvent();
        if (this.radioGroup !== null) {
            this.radioGroup._onChangeFn(this.value);
            this.radioGroup._touch();
            if (valueChanged) {
                this.radioGroup.value = this.value;
                this.radioGroup._emitChangeEvent();
            }
        } else {
            this.checked = true;
        }
    }

    _onFocus() {
        this.focused = true;
    }

    _markAsTouched() {
        if (this.radioGroup) {
            this.radioGroup._touch();
        }
    }

    _onBlur() {
        this.focused = false;
        this._markAsTouched();
    }

    private _emitChangeEvent(): void {
        this.change.emit(new RadioButtonChangeEvent(this, this.value));
    }

    _markForCheck() {
        this.cdRef.markForCheck();
    }
}
