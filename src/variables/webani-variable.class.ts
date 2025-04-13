import { ChangeHandler } from "./change-handler.type";

export class WebaniVariable<T> {

    [key: string]: unknown;
    _onValueSetFromSelf: ChangeHandler<T>[] = [];
    _onValueSetFromParent: ChangeHandler<T>[] = [];
    _value: T | undefined = undefined;
    _allowChangeValue: boolean = true;
    

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

    static readLogs: WebaniVariable<unknown>[] = [];
    static logReads: boolean = false;

    static startLogging() {
        WebaniVariable.logReads = true;
    }

    static stopLogging() {
        WebaniVariable.logReads = false;
        WebaniVariable.readLogs = [];
    }

    static valueRequested(variable: WebaniVariable<unknown> | undefined) {
        if (variable && WebaniVariable.logReads) {
            WebaniVariable.readLogs.push(variable);
        }
    }

    onValueSetFromParent(...handlers: ChangeHandler<T>[]) {
        this._onValueSetFromParent.push(...handlers);
    }

    onValueSetFromSelf(...handlers: ChangeHandler<T>[]) {
        this._onValueSetFromSelf.push(...handlers);
    }

    set _valueFromParent(val: T) {
        this._rawValue = val;
        this._onValueSetFromParent.map(x => x(val));
    }

    set _valueFromSelf(val: T) {
        this._rawValue = val;
        this._onValueSetFromSelf.map(x => x(val));
    }

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

    set value(val: T) {
        if (!this._allowChangeValue) return;
        this._valueFromSelf = val;
    }

    get value(): T | undefined {
        WebaniVariable.valueRequested(this);
        return this._value;
    }
}