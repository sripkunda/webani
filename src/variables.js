export const WanimVariable = class { 
    constructor(value) {
        this._onValueSetFromSelf = [];
        this._onValueSetFromParent = [];
        this.value = value;
    }

    onValueSetFromParent(...handlers) { 
        this._onValueSetFromParent.push(...handlers);
    }

    onValueSetFromSelf(...handlers) { 
        this._onValueSetFromSelf.push(...handlers);
    }

    set _valueFromParent(val) {
        this._rawValue = val;
        this._onValueSetFromParent.map(x => x(val));
        return val;
    }

    set _rawValue(val) { 
        this._value = val;
        if (val instanceof Object) {
            for (let key in val) { 
                if (key in this) { 
                    this[key]._valueFromParent = val[key];
                } else {
                    this[key] = new WanimVariable(val[key]);
                }
            }
        }
    }

    set value(val) {
        this._rawValue = val;
        this._onValueSetFromSelf.map(x => x(val));
        return val;
    }

    get value() { 
        return this._value;
    }
}

export const ResolveWanimVariables = (...vars) => {
    const resolvedVars = [];
    for (let arg of vars) {
        resolvedVars.push(arg instanceof WanimVariable ? arg.value : arg);
    }
    return resolvedVars;
}

export const ExecuteWhenSetFromSelf = (funct, ...vars) => { 
  for (let arg of vars) { 
    if (arg instanceof WanimVariable) {
      arg.onValueSetFromSelf(() => {
        funct(...ResolveWanimVariables(...vars));
      });
    }
  }
}

export const ExecuteWhenSetFromParent = (funct, ...vars) => { 
    for (let arg of vars) { 
      if (arg instanceof WanimVariable) {
        arg.onValueSetFromParent(() => {
          funct(...ResolveWanimVariables(...vars));
        });
      }
    }
  }