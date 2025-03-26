import { ChangeHandler } from "./change-handler.type";

export class WanimVariable<T> {

    _onValueSetFromSelf: ChangeHandler<T>[] = [];
    _onValueSetFromParent: ChangeHandler<T>[] = [];

    [key: string]: any;

    _value: T | undefined = undefined;
    _allowChangeValue: boolean = true;

    constructor(value: T) {
        if (value instanceof WanimVariable) {
            return value;
        }
        this._onValueSetFromSelf = [];
        this._onValueSetFromParent = [];
        if (value instanceof Function) {
            this._allowChangeValue = false;
            WanimVariable.startLogging();
            const handler = () => {
                this._valueFromParent = value();
            }
            handler();
            WanimVariable.readLogs.forEach(x => {
                x.onValueSetFromParent(handler);
            });
            WanimVariable.readLogs.forEach(x => {
                x.onValueSetFromSelf(handler)
            });
            WanimVariable.stopLogging();
        } else {
            this.value = value;
        }
    }

    static readLogs: WanimVariable<any>[] = [];
    static logReads: boolean = false;

    static startLogging() {
        WanimVariable.logReads = true;
    }

    static stopLogging() {
        WanimVariable.logReads = false;
        WanimVariable.readLogs = [];
    }

    static valueRequested(variable: WanimVariable<any> | undefined) {
        if (variable && WanimVariable.logReads) {
            WanimVariable.readLogs.push(variable);
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
            for (let key in val) {
                if (key in this) {
                    this[key]._valueFromParent = val[key];
                } else {
                    this[key as string] = new WanimVariable(val[key]);
                }
            }
        }
    }

    set value(val: T) {
        if (!this._allowChangeValue) return;
        this._valueFromSelf = val;
    }

    get value(): T | undefined {
        WanimVariable.valueRequested(this);
        return this._value;
    }
}