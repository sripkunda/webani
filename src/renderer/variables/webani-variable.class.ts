import { ChangeHandler } from "../types/change-handler.type";

/**
 * `WebaniVariable` is a class that represents a variable that can be set and reacted to by different change handlers.
 * It can handle changes both from its own internal mechanism (`onValueSetFromSelf`) and from external sources (parent variables).
 * 
 * The value of the `WebaniVariable` can be either set directly or derived from a function.
 * This class supports the monitoring of changes in the variable's value and allows for callbacks to be executed when the value changes.
 * 
 * @template T - The type of the value stored within the variable.
 */
export class WebaniVariable<T> {

    [key: string]: unknown;

    private _onValueSetFromSelf: ChangeHandler<T>[] = [];
    private _onValueSetFromParent: ChangeHandler<T>[] = [];
    private _value: T | undefined = undefined;
    private _allowChangeValue: boolean = true;

    /**
     * Creates an instance of a WebaniVariable with an optional value. If the value is a function,
     * it sets the value based on the result of that function, and prevents further value changes directly.
     * 
     * @param value - The initial value for the variable. This can either be a value of type T, or a function returning a value of type T.
     */
    constructor(value: T) {
        if (value instanceof WebaniVariable) {
            return value;
        }
        this._onValueSetFromSelf = [];
        this._onValueSetFromParent = [];
        if (value instanceof Function) {
            this._allowChangeValue = false;
            WebaniVariable.startLogging();
            const handler = () => {
                this._valueFromParent = value();
            }
            handler();
            WebaniVariable.readLogs.forEach(x => {
                x.onValueSetFromParent(handler);
            });
            WebaniVariable.readLogs.forEach(x => {
                x.onValueSetFromSelf(handler)
            });
            WebaniVariable.stopLogging();
        } else {
            this.value = value;
        }
    }

    /**
     * Logs for tracking variable reads (static).
     */
    static readLogs: WebaniVariable<unknown>[] = [];

    /**
     * Flag indicating whether variable reads should be logged (static).
     */
    static logReads: boolean = false;

    /**
     * Starts logging variable reads. This function allows tracking of which variables are being read.
     */
    static startLogging() {
        WebaniVariable.logReads = true;
    }

    /**
     * Stops logging variable reads. This disables tracking of read operations.
     */
    static stopLogging() {
        WebaniVariable.logReads = false;
        WebaniVariable.readLogs = [];
    }

    /**
     * Registers a variable for logging if variable reads are enabled (static).
     * 
     * @param variable - The `WebaniVariable` instance to track.
     */
    static valueRequested(variable: WebaniVariable<unknown> | undefined) {
        if (variable && WebaniVariable.logReads) {
            WebaniVariable.readLogs.push(variable);
        }
    }

    /**
     * Registers change handlers to be called when the value of the variable is set from the parent.
     * 
     * @param handlers - The change handlers to be called when the value is set from the parent.
     */
    onValueSetFromParent(...handlers: ChangeHandler<T>[]) {
        this._onValueSetFromParent.push(...handlers);
    }

    /**
     * Registers change handlers to be called when the value of the variable is set internally (from the variable itself).
     * 
     * @param handlers - The change handlers to be called when the value is set from within the variable.
     */
    onValueSetFromSelf(...handlers: ChangeHandler<T>[]) {
        this._onValueSetFromSelf.push(...handlers);
    }

    /**
     * Sets the value of the variable from the parent and triggers the associated change handlers.
     * 
     * @param val - The value to set from the parent.
     */
    set _valueFromParent(val: T) {
        this._rawValue = val;
        this._onValueSetFromParent.map(x => x(val));
    }

    /**
     * Sets the value of the variable from within itself and triggers the associated change handlers.
     * 
     * @param val - The value to set from within the variable.
     */
    set _valueFromSelf(val: T) {
        this._rawValue = val;
        this._onValueSetFromSelf.map(x => x(val));
    }

    /**
     * Sets the raw value of the variable and updates any nested objects if the value is an object.
     * 
     * @param val - The raw value to set for the variable.
     */
    set _rawValue(val: T) {
        this._value = val;
        if (val instanceof Object) {
            for (const key in val) {
                if (key in this) {
                    (this[key] as WebaniVariable<unknown>)._valueFromParent = val[key];
                } else {
                    this[key as string] = new WebaniVariable(val[key]);
                }
            }
        }
    }

    /**
     * Sets the value of the variable from within itself, if allowed.
     * 
     * @param val - The value to set for the variable.
     */
    set value(val: T) {
        if (!this._allowChangeValue) return;
        this._valueFromSelf = val;
    }

    /**
     * Retrieves the current value of the variable, and logs the read if logging is enabled.
     * 
     * @returns The current value of the variable, or undefined if not set.
     */
    get value(): T | undefined {
        WebaniVariable.valueRequested(this);
        return this._value;
    }
}
