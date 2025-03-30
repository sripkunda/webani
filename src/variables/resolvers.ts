import { Value } from "./value.type";
import { WanimVariable } from "./wanim-variable.class";

export const ResolveWanimVariables = (...vars: Value<unknown>[]) => {
    const resolvedVars: unknown[] = [];
    for (const arg of vars) {
        resolvedVars.push(arg instanceof WanimVariable ? arg.value : arg);
    }
    return resolvedVars;
}

export const ExecuteWhenSetFromSelf = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]) => { 
  for (const arg of vars) { 
    if (arg instanceof WanimVariable) {
      arg.onValueSetFromSelf(() => {
        funct(...ResolveWanimVariables(...vars));
      });
    }
  }
}

export const ExecuteWhenSetFromParent = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]) => { 
    for (const arg of vars) { 
      if (arg instanceof WanimVariable) {
        arg.onValueSetFromParent(() => {
          funct(...ResolveWanimVariables(...vars));
        });
      }
    }
}