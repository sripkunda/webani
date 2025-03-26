import { RenderedCollection } from "../animations/rendered-collection.class";
import { Colors } from "../lib/colors";
import { textToPoints } from "../util/utils";
import { Vector } from "../util/vector.type";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveWanimVariables } from "../variables/resolvers";
import { WanimCollection } from "./wanim-collection.class";
import { WanimObject } from "./wanim-object.class";

export const CreateRenderedCollection = (constructor: Function, ...vars: any[]) => {
  const renderedCollection = new RenderedCollection(constructor(...ResolveWanimVariables(...vars)));
  ExecuteWhenSetFromSelf((...vars: any[]) => {
    renderedCollection.TransformInto(constructor(...vars));
  }, ...vars);
  ExecuteWhenSetFromParent((...vars: any[]) => {
    renderedCollection.TransformInto(constructor(...vars), 500, true);
  }, ...vars);
  return renderedCollection;
}

export const ObjectConstructors = {
  Triangle(points: Vector[], color = Colors.WHITE, opacity = 1) {
    return new WanimObject(points, [], color, opacity);
  },
  Rectangle(position: Vector, length_x: number, length_y: number, color = Colors.WHITE, opacity = 1) {
    return new WanimObject([
      [position[0], position[1]],
      [position[0] + length_x, position[1]],
      [position[0] + length_x, position[1] + length_y],
      [position[0], position[1] + length_y]], [], color, opacity).copyCenteredAt(position);
  },
  Line(position: Vector, length: number, angle = 0, thickness = 2, color = Colors.WHITE, opacity = 1) {
    return ObjectConstructors.Rectangle(position, length, Math.max(2, thickness), color, opacity).rotatedCopy(angle, position);
  },
  Circle(center: Vector, radius: number, color = Colors.WHITE, opacity = 1) {
    const points: Vector[] = [];
    const circle = (theta: number): Vector => {
      return [center[0] + radius * Math.cos(theta), center[1] + radius * Math.sin(theta)];
    };
    let angle = 0;
    const stepSize = 2 * Math.PI / 1000;
    while (angle < 2 * Math.PI) {
      angle += stepSize;
      points.push(circle(angle));
    }
    return new WanimObject(points, [], color, opacity).copyCenteredAt(center);
  },
  Text(string: string, position: Vector, fontSize = 72, color = Colors.WHITE, opacity = 1) {
    const pointsObject = textToPoints(string, position, fontSize);
    return new WanimCollection(pointsObject.points.map((x, i) => new WanimObject(x, pointsObject.holes[i], color, opacity, [0, 0, 0]))).copyCenteredAt(position);
  }
}