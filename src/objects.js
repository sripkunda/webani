import { RenderedCollection, WanimVariable } from "./animations";
import { Colors } from "./constants";
import { triangulate, textToPoints, pointsInPolygon } from "./util";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveWanimVariables } from "./variables";

export const WanimCollection = class {
  constructor(...objects) {
    this.objects = [];
    this.add(...objects);
  }

  copyCenteredAt(newCenter) {
    newCenter = WanimObject._convertPointTo3D(newCenter);
    const copy = this.copy;
    let center = this.center;
    copy.objects = copy.objects.map(obj => {
      const a = obj.copy;
      a.filledPoints = a.filledPoints.map(point => {
          return WanimObject._add(point, WanimObject._subtract(newCenter, center));
      });
      a.holes = a.holes.map(hole => {
          return hole.map(point => {
              return WanimObject._add(point, WanimObject._subtract(newCenter, center));
          });
      });
      return a;
    });
    return copy;
  }

  get copy() { 
    return new WanimCollection(...this.objects.map(obj => obj.copy));
  }

  get center() { 
    return WanimObject._center(this.objects.map(obj => obj.center));
  }

  combine(...collections) {
    for (let collection of collections) {
      this.objects.push(...collection.objects);
    }
    return this;
  }

  add(...newObjects) {
    for (let object of newObjects) { 
      if (object instanceof WanimObject) {
        this.objects.push(object);
      }
    }
    this._updateObjectCenters();
    return this.objects.length - 1;
  }

  remove(object) {
    this.objects = this.objects.filter(x => x !== object);
    return this;
  }

  removeIndex(index) {
    this.objects.splice(index, 1);
    return this;
  }

  _updateObjectCenters() {
    const center = this.center; 
    for (let object of this.objects) { 
      object.rotationCenter = center;
    }
  }
}

export const WanimObject = class {
  constructor(filledPoints, holes, color = Colors.WHITE, opacity = 1, rotation = [0, 0, 0], cache = null, rotationCenter) {
    this.filledPoints = WanimObject._convertPointsTo3D(filledPoints);
    this.holes = holes.map(holePoints => WanimObject._convertPointsTo3D(holePoints));
    this.color = color;
    this.opacity = opacity;
    this.rotation = WanimObject._convertPointsTo3D(rotation);
    this._rotationCenter = WanimObject._convertPointsTo3D(rotationCenter);
    this._cache = {};
    this._cacheTriangulation(cache?.triangulation, cache?.points);
  }

  copyCenteredAt(newCenter) {
    const copy = this.copy; 
    const center = this.center;
    copy.filledPoints = copy.filledPoints.map(x => WanimObject._add(WanimObject._subtract(x, center), newCenter));
    copy.holes = copy.holes.map(holePoints => holePoints.map(x => WanimObject._add(WanimObject._subtract(x, center), newCenter)));
    return copy;
  }

  get holeIndices() {
    let sum = this.filledPoints.length;
    let indices = [];
    for (let hole of this.holes) { 
      if (!pointsInPolygon(this.filledPoints, hole)) continue;
      indices.push(sum);
      sum += hole.length;
    }
    return indices;
  }

  get points() {
    let p = [...this.filledPoints];
    for (let holePoints of this.holes) {
      p.push(...holePoints);
    }
    return p;
  }

  get rotatedPoints() {
    return this._rotatePointArray(this.points);
  }

  get rotatedFilledPoints() {
    return this._rotatePointArray(this.filledPoints);
  }

  get rotationCenter() { 
    return this._rotationCenter || this.center;
  }

  set rotationCenter(value) { 
    this._rotationCenter = WanimObject._convertPointTo3D(value);
  }

  get copy() {
    return new WanimObject(this.filledPoints, this.holes, this.color, this.opacity, this.rotation, this._cachedTriangulation, this._rotationCenter);
  }

  get center() {
    return WanimObject._center(this.filledPoints);
  }
  
  normalizedTriangulation(width, height) {
    return WanimObject._normalizePoints(this._rotatedTriangulation, width, height);
  }
  
  rotatedCopy(angle, center, axis = 2) {
    if (angle % 360 == 0) return this.copy;
    let copy = this.copy;
    if (!center) center = this.center;
    center = WanimObject._convertPointTo3D(center);
    center.splice(axis, 1);
    copy.points = WanimObject._computeRotation(copy.points, angle, center, axis);
    return copy;
  }
  
  get _cachedTriangulation() { 
    if (!this._cachedTriangulationValid()) {
      return null;
    }
    return this._cache.triangulation;
  }

  static _computeRotation(points, angle, center = [0, 0, 0], axis = 2) {
    if (angle % 360 == 0) return points;
    center = WanimObject._convertPointTo3D(center);
    center.splice(axis, 1);
    return points.map(point => {
      const fixed = point[axis];
      let projectedPoint = point.filter((el, i) => i != axis);
      const x = (projectedPoint[0] - center[0]) * Math.cos(angle * Math.PI / 180) - (projectedPoint[1] - center[1]) * Math.sin(angle * Math.PI / 180) + center[0];
      const y = (projectedPoint[0] - center[0]) * Math.sin(angle * Math.PI / 180) + (projectedPoint[1] - center[1]) * Math.cos(angle * Math.PI / 180) + center[1];
      projectedPoint = [x, y];
      projectedPoint.splice(axis, 0, fixed);
      return projectedPoint;
    });
  }

  _rotatePointArray(points) { 
    for (let i = 0; i < 3; i++) {
      points = WanimObject._computeRotation(points, this.rotation[i], this.rotationCenter, i);
    }
    return points;
  }

  get triangulationPoints() { 
    let triangulation = this._triangulation;
    let triangulationPoints = [];
    for (let i in triangulation) {
      if (i % 3 == 0) { 
        triangulationPoints.push([triangulation[i]]);
      } else {
        triangulationPoints[triangulationPoints.length - 1].push(triangulation[i]);
      }
    }
    return triangulationPoints;
  }

  get _rotatedTriangulation() { 
    return new Float32Array(this._rotatePointArray(this.triangulationPoints).flat());
  }

  get _triangulation() { 
    return this._cachedTriangulation || this._triangulate();
  }

  _triangulate() {
    let triangulation;
    let holeIndices = this.holeIndices;
    let points = holeIndices.length > 0 ? this.points : this.filledPoints;
    if (points.length > 3) {
      let triangulated = triangulate(WanimObject._convertPointsTo2D(points).flat(), holeIndices);
      let triangulatedPoints = [];
      for (let i = 0; i < triangulated.length; i++) {
        triangulatedPoints.push(points[triangulated[i]]);
      }
      triangulation = new Float32Array(triangulatedPoints.flat());
    } else {
      triangulation = new Float32Array(points.flat());
    }
    this._cacheTriangulation(triangulation);
    return triangulation;
  }

  _cacheTriangulation(triangulation, points = null) {
    this._cache.points = [...(points || this.points)];
    this._cache.triangulation = triangulation ? new Float32Array(triangulation) : null;
  }

  _cachedTriangulationValid(points = this.points) {
    const cache = this._cache;
    if (!cache.triangulation) {
      return false;
    }
    if (points.length != cache.points.length) {
      return false;
    }
    for (let i in points) {
      if (!cache.points[i].every((x, j) => x == points[i][j])) {
        return false;
      }
    }
    return true;
  }

  _dots(width, height) {
    return WanimObject._normalizePoints(new Float32Array(this.rotatedPoints.flat()), width, height);
  }

  static _normalizePoints(points, width, height) { 
    for (let i = 0; i < points.length; i += 3) {
      points[i] = points[i] / width - 1/2;
      points[i + 1] = points[i + 1] / height - 1/2;
    }
    return points;
  }

  static _center(points) {
    const denominator = (1 / points.length);
    return points.reduce((accumulator, currentValue) =>
      [(accumulator[0] + denominator * currentValue[0]), (accumulator[1] + denominator * currentValue[1]), (accumulator[2] + denominator * currentValue[2])], [0, 0, 0]);
  }

  static _multiply(point, scalar) {
    return point.map(x => x * scalar);
  }

  static _add(a, b) {
    return a.map((x, i) => x + b[i]);
  }

  static _norm(a) {
    return WanimObject._distance(a, a.map(x => 0));
  }

  static _subtract(a, b) {
    return WanimObject._add(a, WanimObject._multiply(b, -1));
  }

  static _distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
  }

  static _convertPointsTo2D(points) {
    return points?.map(x => x.slice(0, 2));
  }

  static _convertPointsTo3D(points) {
    return points?.map(x => {
      if (x.length < 3)
        x.push(0.0);
      return x;
    });
  }

  static _convertPointTo3D(point) {
    return this._convertPointsTo3D([point])[0];
  }
}

const CreateRenderedCollection = (constructor, ...vars) => {
  const renderedCollection = new RenderedCollection(constructor(...ResolveWanimVariables(...vars)));
  ExecuteWhenSetFromSelf((...vars) => {
    renderedCollection.TransformInto(constructor(...vars));
  }, ...vars);
  ExecuteWhenSetFromParent((...vars) => {
    renderedCollection.TransformInto(constructor(...vars), 500, true);
  }, ...vars);
  return renderedCollection;
}

export const Triangle = (points, color = Colors.WHITE, opacity = 1) => {
  return CreateRenderedCollection(ObjectConstructors.Triangle, points, color, opacity);
}

export const Rectangle = (position, length_x, length_y, color = Colors.WHITE, opacity = 1) => {
  return CreateRenderedCollection(ObjectConstructors.Rectangle, position, length_x, length_y, color, opacity);
}

export const Square = (position, length, color = Colors.WHITE, opacity = 1) => {
  return Rectangle(position, length, length, color, opacity);
}

export const Line = (position, length, angle = 0, thickness = 2, color = Colors.WHITE, opacity = 1) => {
  return CreateRenderedCollection(ObjectConstructors.Line, position, length, angle, thickness, color, opacity);
}

export const Circle = (center, radius, color = Colors.WHITE, opacity = 1) => {
  return CreateRenderedCollection(ObjectConstructors.Circle, center, radius, color, opacity);
}

export const ConnectingLine = (start, end, thickness = 5, color = Colors.WHITE, opacity = 1) => {
  const angle = Math.atan((start[1] - end[1]) / (start[0] - end[0])) * 180 / Math.PI;
  const length = Math.sqrt(Math.pow(start[1] - end[1], 2) + Math.pow(start[0] - end[0], 2));
  return Line(start, length, angle, thickness, color, opacity);
}

export const Text = (string, position, fontSize = 72, color = Colors.WHITE, opacity = 1) => {
  return CreateRenderedCollection(ObjectConstructors.Text, string, position, fontSize, color, opacity);
}

const ObjectConstructors = {
  Triangle(points, color = Colors.WHITE, opacity = 1) {
    return new WanimObject(points, [], color, opacity);
  },
  Rectangle(position, length_x, length_y, color = Colors.WHITE, opacity = 1) {
    return new WanimObject([
      [position[0], position[1]],
      [position[0] + length_x, position[1]],
      [position[0] + length_x, position[1] + length_y],
      [position[0], position[1] + length_y]], [], color, opacity).copyCenteredAt(position);
  },
  Line(position, length, angle = 0, thickness = 2, color = Colors.WHITE, opacity = 1) {
    return this.Rectangle(position, length, Math.max(2, thickness), color, opacity).rotatedCopy(angle, position).copyCenteredAt(position);
  },
  Circle(center, radius, color = Colors.WHITE, opacity = 1) {
    const points = [];
    const circle = (theta) => {
      return [center[0] + radius * Math.cos(theta), center[1] + radius * Math.sin(theta)];
    };
    let angle = 0;
    const stepSize = 2 * Math.PI / 1000;
    while (angle < 2 * Math.PI) {
      angle += stepSize;
      points.push(circle(angle));
    }
    return new WanimObject(points, [], color, opacity).copyCenteredAt(position);
  },
  Text(string, position, fontSize = 72, color = Colors.WHITE, opacity = 1) {
    const pointsObject = textToPoints(string, position, fontSize);
    return new WanimCollection(...pointsObject.points.map((x, i) => new WanimObject(x, pointsObject.holes[i], color, opacity, [0, 0, 0]))).copyCenteredAt(position);
  }
}