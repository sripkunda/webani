import { WanimVariable } from "./wanim-variable.class";

export const ResolveWanimVariables = (...vars: any[]) => {
    const resolvedVars: any[] = [];
    for (let arg of vars) {
        resolvedVars.push(arg instanceof WanimVariable ? arg.value : arg);
    }
    return resolvedVars;
}

export const ExecuteWhenSetFromSelf = (funct: Function, ...vars: any[]) => { 
  for (let arg of vars) { 
    if (arg instanceof WanimVariable) {
      arg.onValueSetFromSelf(() => {
        funct(...ResolveWanimVariables(...vars));
      });
    }
  }
}

export const ExecuteWhenSetFromParent = (funct: Function, ...vars: any[]) => { 
    for (let arg of vars) { 
      if (arg instanceof WanimVariable) {
        arg.onValueSetFromParent(() => {
          funct(...ResolveWanimVariables(...vars));
        });
      }
    }
}