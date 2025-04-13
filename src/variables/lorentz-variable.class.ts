import { ChangeHandler } from "./change-handler.type";

export class LorentzVariable<T> {

    [key: string]: unknown;
    _onValueSetFromSelf: ChangeHandler<T>[] = [];
    _onValueSetFromParent: ChangeHandler<T>[] = [];
    _value: T | undefined = undefined;
    _allowChangeValue: boolean = true;
    

    constructor(value: T) {
        if (value instanceof LorentzVariable) {
            return value;
        }
        this._onValueSetFromSelf = [];
        this._onValueSetFromParent = [];
        if (value instanceof Function) {
            this._allowChangeValue = false;
            LorentzVariable.startLogging();
            const handler = () => {
                this._valueFromParent = value();
            }
            handler();
            LorentzVariable.readLogs.forEach(x => {
                x.onValueSetFromParent(handler);
            });
            LorentzVariable.readLogs.forEach(x => {
                x.onValueSetFromSelf(handler)
            });
            LorentzVariable.stopLogging();
        } else {
            this.value = value;
        }
    }

    static readLogs: LorentzVariable<unknown>[] = [];
    static logReads: boolean = false;

    static startLogging() {
        LorentzVariable.logReads = true;
    }

    static stopLogging() {
        LorentzVariable.logReads = false;
        LorentzVariable.readLogs = [];
    }

    static valueRequested(variable: LorentzVariable<unknown> | undefined) {
        if (variable && LorentzVariable.logReads) {
            LorentzVariable.readLogs.push(variable);
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
                    (this[key] as LorentzVariable<unknown>)._valueFromParent = val[key];
                } else {
                    this[key as string] = new LorentzVariable(val[key]);
                }
            }
        }
    }

    set value(val: T) {
        if (!this._allowChangeValue) return;
        this._valueFromSelf = val;
    }

    get value(): T | undefined {
        LorentzVariable.valueRequested(this);
        return this._value;
    }
}