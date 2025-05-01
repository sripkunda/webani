import { Value } from "../types/value.type";
import { WebaniVariable } from "./webani-variable.class";

/**
 * Resolves the value of Webani variables by checking if an argument is an instance of `WebaniVariable`.
 * If it is, it extracts the value of the variable; otherwise, it returns the argument itself.
 * 
 * @param vars - A list of `Value<unknown>` (variables or values) to resolve.
 * @returns An array of resolved values, where variables are replaced by their values.
 */
export const ResolveWebaniVariables = (...vars: Value<unknown>[]): unknown[] => {
    const resolvedVars: unknown[] = [];
    for (const arg of vars) {
        resolvedVars.push(arg instanceof WebaniVariable ? arg.value : arg);
    }
    return resolvedVars;
}

/**
 * Executes a function when the values of specified Webani variables are set from within the variable itself.
 * 
 * The function will be triggered when the value of a `WebaniVariable` changes from the variable's own setting mechanism.
 * 
 * @param funct - The function to be executed when a variable's value is set.
 * @param vars - A list of `Value<unknown>` (variables or values) to monitor.
 */
export const ExecuteWhenSetFromSelf = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]): void => { 
  for (const arg of vars) { 
    if (arg instanceof WebaniVariable) {
      arg.onValueSetFromSelf(() => {
        funct(...ResolveWebaniVariables(...vars));
      });
    }
  }
}

/**
 * Executes a function when the values of specified Webani variables are set from a parent.
 * 
 * The function will be triggered when the value of a `WebaniVariable` changes due to a parent setting its value.
 * 
 * @param funct - The function to be executed when a variable's value is set.
 * @param vars - A list of `Value<unknown>` (variables or values) to monitor.
 */
export const ExecuteWhenSetFromParent = (funct: (...args: unknown[]) => unknown, ...vars: Value<unknown>[]): void => { 
    for (const arg of vars) { 
      if (arg instanceof WebaniVariable) {
        arg.onValueSetFromParent(() => {
          funct(...ResolveWebaniVariables(...vars));
        });
      }
    }
}
