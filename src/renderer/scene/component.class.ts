import { RenderedGroupNode } from "../animation/rendered-group-node.class";
import { WebaniCollection } from "./collections/webani-collection.class";
import { RenderableObject } from "../types/renderable-object.type";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveWebaniVariables } from "../variables/resolvers";

/**
 * An abstract class that represents a component that can be rendered and animated.
 * The `Component` class can be extended to create custom objects with custom functions and properties.
 */
export abstract class Component extends RenderedGroupNode {
    
    /**
     * Creates an instance of the `Component` class and initializes it with a `RenderedGroupNode`.
     * The component's state is constructed dynamically using a constructor function and additional variables.
     * 
     * @param vars The variable arguments used in the component's objectConstructor.
     */
    constructor(...vars: unknown[]) {
        super(new WebaniCollection([]));
        // Generates the rendered collection using the provided variables
        Object.assign(this, this.generate(...vars));
    }

    /**
     * Generates the rendered collection for the component, applying transformations when variables are set.
     * 
     * @param vars The variables to generate the object state and trigger transformations.
     * @returns A `RenderedGroupNode` instance representing the generated object state.
     */
    private generate(...vars: unknown[]) { 
        // Initialize the rendered collection
        const renderedCollection = new RenderedGroupNode(this.objectConstructor(...ResolveWebaniVariables(...vars)));
        
        // Handle transformations when variables are set from the component itself
        ExecuteWhenSetFromSelf((...vars: unknown[]) => {
            renderedCollection.TransformInto(this.objectConstructor(...vars));
        }, ...vars);

        // Handle transformations when variables are set from the parent
        ExecuteWhenSetFromParent((...vars: unknown[]) => {
            renderedCollection.TransformInto(this.objectConstructor(...vars), 500, true);
        }, ...vars);

        return renderedCollection;
    }

    /**
     * A static method that returns a generator function for creating new instances of the `Component` class. 
     * Types are automatically inferred from the `objectConstructor`
     * 
     * @returns A function that can be used to create instances of the `Component` class with specific parameters.
     */
    static GetGenerator<T extends Component>(this: new (...args: unknown[]) => T) { 
        return (...vars: Parameters<T["objectConstructor"]>) => {
            return new this(...vars);
        }
    }

    /**
     * An abstract method that should be implemented by subclasses to define the object constructor 
     * that generates the `RenderableObject` for this component.
     * 
     * @param vars The variables used by the object constructor to generate the renderable object.
     * @returns A `RenderableObject` that represents the constructed object.
     */
    abstract objectConstructor(...vars: unknown[]): RenderableObject;
}
