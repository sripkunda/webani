import { Colors } from "../renderer/scene/lighting/colors";
import { textToPoints } from "../renderer/util/svg.utils";
import { Component } from "../renderer/scene/component.class";
import { WebaniCollection } from "../renderer/scene/collections/webani-collection.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { VectorUtils } from "../renderer/util/vector.utils";

/**
 * Options for creating a text component.
 */
export type TextComponentOptions = { 
    /** The string of text to be rendered. */
    string: string, 

    /** The position of the text in 3D space. */
    position: Vector3, 

    /** The font size for the text. Defaults to 72. */
    fontSize?: number, 

    /** Optional material to style the text. */
    material?: WebaniMaterialOptions 
};

/**
 * A component that renders a 3D text object by converting the provided string into a set of polygons.
 * 
 * The text is represented by a collection of polygons where each letter is represented by a set of points,
 * and the polygons are positioned based on the provided position and font size. The material can be customized.
 */
export class TextComponent extends Component {
    /**
     * Constructs a `WebaniCollection` of `WebaniPolygon` instances representing the 3D text.
     * 
     * The string is converted into polygons using `textToPoints`, and each polygon is assigned the provided
     * material. The position of the text is adjusted based on the local center of the collection.
     * 
     * @param options - Configuration object containing the string, position, font size, and optional material.
     * @returns A `WebaniCollection` instance containing the polygons that represent the text.
     */
    objectConstructor({ 
        string, 
        position, 
        fontSize = 72, 
        material = { color: Colors.WHITE, opacity: 1 } 
    }: TextComponentOptions): WebaniCollection<WebaniPolygon> {
        // Convert the string into points
        const pointsObject = textToPoints(string, fontSize);

        // Create a collection of polygons for each letter
        const collection = new WebaniCollection(
            pointsObject.points.map((x, i) => {
                const polygon = new WebaniPolygon({
                    position: [0, 0, 0], 
                    filledPoints: x,
                    holes: pointsObject.holes[i],
                    material: new WebaniMaterial(material)
                });
                return polygon;
            })
        );
        collection.setPosition(VectorUtils.subtract(position, collection.localCenter));
        return collection;
    }
}

/**
 * A reusable generator instance for creating text components.
 */
export const Text = TextComponent.GetGenerator();
