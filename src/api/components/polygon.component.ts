import { Colors } from "../colors";
import { Vector3 } from "../../util/vectors/vector3.type";
import { Component } from "./component.class";
import { LorentzPolygon } from "../../polygon/lorentz-polygon.class";
import { LorentzMaterial } from "../../lighting/lorentz-material.class";

export class PolygonComponent extends Component {
    objectConstructor(points: Vector3[], color = Colors.WHITE, opacity = 1): LorentzPolygon {
        const object = new LorentzPolygon([0, 0, 0], points, []);
        object.material = LorentzMaterial.fromColorAndOpacity(color, opacity);
        return object;
    }
}

export const Polygon = PolygonComponent.GetGenerator();