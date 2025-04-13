import { Value } from "./value.type";
import { LorentzVariable } from "./lorentz-variable.class";

export const ResolveLorentzVariables = (...vars: Value<unknown>[]) => {
    const resolvedVars: unknown[] = [];
    for (const arg of vars) {
        resolvedVars.push(arg instanceof LorentzVariable ? arg.value : arg);
    }
    return resolvedVars;
}

export const ExecuteWhenSetFromSelf = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]) => { 
  for (const arg of vars) { 
    if (arg instanceof LorentzVariable) {
      arg.onValueSetFromSelf(() => {
        funct(...ResolveLorentzVariables(...vars));
      });
    }
  }
}

export const ExecuteWhenSetFromParent = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]) => { 
    for (const arg of vars) { 
      if (arg instanceof LorentzVariable) {
        arg.onValueSetFromParent(() => {
          funct(...ResolveLorentzVariables(...vars));
        });
      }
    }
}