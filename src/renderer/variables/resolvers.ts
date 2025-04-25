import { Value } from "./value.type";
import { WebaniVariable } from "./webani-variable.class";

export const ResolveWebaniVariables = (...vars: Value<unknown>[]) => {
    const resolvedVars: unknown[] = [];
    for (const arg of vars) {
        resolvedVars.push(arg instanceof WebaniVariable ? arg.value : arg);
    }
    return resolvedVars;
}

export const ExecuteWhenSetFromSelf = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]) => { 
  for (const arg of vars) { 
    if (arg instanceof WebaniVariable) {
      arg.onValueSetFromSelf(() => {
        funct(...ResolveWebaniVariables(...vars));
      });
    }
  }
}

export const ExecuteWhenSetFromParent = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]) => { 
    for (const arg of vars) { 
      if (arg instanceof WebaniVariable) {
        arg.onValueSetFromParent(() => {
          funct(...ResolveWebaniVariables(...vars));
        });
      }
    }
}