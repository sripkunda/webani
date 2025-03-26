import earcut from "earcut";
import { WanimInterpolatedAnimationBase } from "../animations/wanim-interpolated-animation-base.class";
import { Vector } from "./vector.type";
import { TransformedSVGCommandList } from "./transformed-svg-command-list.type";
import { SVGPath } from "./svg-path.type";
import { SVGCommandList } from "./svg-command-list.type";
import { SVGOutput } from "./svg-output.type";
import 'mathjax/es5/tex-svg';
import { RenderedCollection } from "../animations/rendered-collection.class";

export const triangulate = (points: Vector, holes: number[]) => {
    return earcut(points, holes);
};

export const windingOrderClockwise = (points: Vector[]) => {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        sum += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1]);
    }
    return sum < 0 ? true : false;
};

export const lineFrom = (startingX: number, startingY: number, endX: number, endY: number, t: number) => {
    const x = WanimInterpolatedAnimationBase.lerp(startingX, endX, t);
    const y = WanimInterpolatedAnimationBase.lerp(startingY, endY, t);
    return [x, y];
};

export const quadraticBezier = (startingX: number, startingY: number, controlX: number, controlY: number, endX: number, endY: number, t: number) => {
    const startPointX = WanimInterpolatedAnimationBase.lerp(startingX, controlX, t);
    const endPointX = WanimInterpolatedAnimationBase.lerp(controlX, endX, t);
    const startPointY = WanimInterpolatedAnimationBase.lerp(startingY, controlY, t);
    const endPointY = WanimInterpolatedAnimationBase.lerp(controlY, endY, t);
    return lineFrom(startPointX, startPointY, endPointX, endPointY, t);
};

export const cubicBezier = (startingX: number, startingY: number, startControlX: number, startControlY: number, endControlX: number, endControlY: number, endX: number, endY: number, t: number) => {
    const first = quadraticBezier(startingX, startingY, startControlX, startControlY, endControlX, endControlY, t);
    const second = quadraticBezier(startControlX, startControlY, endControlX, endControlY, endX, endY, t);
    return lineFrom(first[0], first[1], second[0], second[1], t);
};

export function svgPathToPoints (position: Vector, pathCommands: TransformedSVGCommandList[], reflect = false, holesCW = false): SVGOutput {
    let paths: SVGPath[] = [];
    let currentPoints: Vector[] = [];
    let startingX: number = 0;
    let startingY: number = 0;
    let prevControlPointX: number;
    let prevControlPointY: number;
    let minX: number = Infinity;
    let minY: number = Infinity;
    let maxX: number = -Infinity;
    let maxY: number = -Infinity;

    const performInterpolation = (interpolationFunction: Function, ...args: any) => {
        let t = 0;
        while (t < 1) {
            const p = interpolationFunction(...args, t);
            currentPoints.push(p);
            startingX = p[0];
            startingY = p[1];
            t += 0.1;
        }
    };

    for (let commandList of pathCommands) {
        for (let i in commandList.commands) {
            let command = commandList.commands[i];

            const handleEndPath = () => {
                const hasClockwiseWindingOrder = windingOrderClockwise(currentPoints);
                const scaleX = commandList.transformation.scale[0];
                const scaleY = commandList.transformation.scale[0];
                const translationX = commandList.transformation.translation[0];
                const translationY = commandList.transformation.translation[1];
                paths.push({
                    points: currentPoints.map(x => [scaleX * (x[0]) + position[0] + translationX, scaleY * ((reflect ? -1 : 1) * x[1]) + position[1] + translationY]),
                    hole: !hasClockwiseWindingOrder !== holesCW
                });
                currentPoints = [];
            };

            const getReflectedControl = () => {
                let controlX = startingX;
                let controlY = startingY;
                const prevCommand = commandList.commands[Number(i) - 1];
                if (prevCommand) {
                    if ((prevCommand.type === 'Q' || prevCommand.type === 'q' || prevCommand.type === 'T' || prevCommand.type === 't')) {
                        controlX = 2 * startingX - prevControlPointX;
                        controlY = 2 * startingY - prevControlPointY;
                    }
                }
                return [controlX, controlY];
            };

            let controlPoint: Vector;

            switch (command.type) {
                case 'M':
                case 'L':
                    currentPoints.push([command.x, command.y]);
                    startingX = command.x;
                    startingY = command.y;
                    break;
                case 'm':
                case 'l':
                    currentPoints.push([startingX + command.dx, startingY + command.dy]);
                    startingX += command.dx;
                    startingY += command.dy;
                    break;
                case 'H':
                    performInterpolation(lineFrom, startingX, startingY, command.x, startingY);
                    break;
                case 'h':
                    performInterpolation(lineFrom, startingX, startingY, startingX + command.dx, startingY);
                    break;
                case 'V':
                    performInterpolation(lineFrom, startingX, startingY, startingX, command.y);
                    break;
                case 'v':
                    performInterpolation(lineFrom, startingX, startingY, startingX, startingY + command.dy);
                    break;
                case 'C':
                    performInterpolation(cubicBezier, startingX, startingY, command.x1, command.y1, command.x2, command.y2, command.x, command.y);
                    break;
                case 'c':
                    performInterpolation(cubicBezier,
                        startingX,
                        startingY,
                        startingX + command.dx1,
                        startingY + command.dy1,
                        startingX + command.dx2,
                        startingY + command.dy2,
                        startingX + command.dx,
                        startingY + command.dy);
                    break;
                case 'Q':
                    performInterpolation(quadraticBezier, startingX, startingY, command.x1, command.y1, command.x, command.y);
                    [prevControlPointX, prevControlPointY] = [command.x1, command.y1];
                    break;
                case 'q':
                    performInterpolation(quadraticBezier, startingX, startingY, startingX + command.dx1, startingY + command.dy1, startingX + command.dx, startingY + command.dy);
                    [prevControlPointX, prevControlPointY] = [startingX + command.dx1, startingY + command.dy1];
                    break;
                case 'T':
                    controlPoint = getReflectedControl();
                    performInterpolation(quadraticBezier, startingX, startingY, ...controlPoint, command.x, command.y);
                    [prevControlPointX, prevControlPointY] = controlPoint;
                    break;
                case 't':
                    controlPoint = getReflectedControl();
                    performInterpolation(quadraticBezier, startingX, startingY, ...controlPoint, startingX + command.x, startingY + command.y);
                    [prevControlPointX, prevControlPointY] = controlPoint;
                case 'Z':
                case 'z':
                    handleEndPath();
                    break;
                default:
                    break;
            }

            if (minX > startingX) minX = startingX;
            if (minY > startingY) minY = startingY;
            if (maxX < startingX) maxX = startingX;
            if (maxY < startingY) maxY = startingY;
        }
    }

    return {
        paths: paths,
        height: maxY - minY,
        width: maxX - minX
    };
};

export const parsePathData = (pathData: string): SVGCommandList => {
    const commands: SVGCommandList = [];
    const regex = /([a-zA-Z])([^a-zA-Z]*)/g;  // Match command (M, L, C, etc.) followed by numbers
    let match: RegExpExecArray | null;
    let currentX = 0;
    let currentY = 0;

    // Iterate over all matches (commands with their respective values)
    while ((match = regex.exec(pathData)) !== null) {
        const command = match[1];  // The command character (M, L, C, etc.)
        const params = match[2].trim().split(/[\s,]+/).map(Number);  // Get the parameters and convert them to numbers

        switch (command) {
            case 'M':
            case 'm':
                // Move To (M) or relative Move To (m)
                if (command === 'M') {
                    currentX = params[0];
                    currentY = params[1];
                } else {
                    currentX += params[0];
                    currentY += params[1];
                }
                commands.push({
                    type: command,
                    x: currentX,
                    y: currentY
                });
                break;

            case 'L':
            case 'l':
                // Line To (L) or relative Line To (l)
                if (command === 'L') {
                    currentX = params[0];
                    currentY = params[1];
                } else {
                    currentX += params[0];
                    currentY += params[1];
                }
                commands.push({
                    type: command,
                    x: currentX,
                    y: currentY
                });
                break;

            case 'H':
            case 'h':
                // Horizontal Line To (H) or relative Horizontal Line To (h)
                if (command === 'H') {
                    currentX = params[0];
                } else {
                    currentX += params[0];
                }
                commands.push({
                    type: command,
                    x: currentX
                });
                break;

            case 'V':
            case 'v':
                // Vertical Line To (V) or relative Vertical Line To (v)
                if (command === 'V') {
                    currentY = params[0];
                } else {
                    currentY += params[0];
                }
                commands.push({
                    type: command,
                    y: currentY
                });
                break;

            case 'C':
            case 'c':
                // Cubic Bezier Curve To (C) or relative Cubic Bezier Curve To (c)
                if (command === 'C') {
                    currentX = params[4];
                    currentY = params[5];
                } else {
                    currentX += params[4];
                    currentY += params[5];
                }
                commands.push({
                    type: command,
                    x1: params[0],
                    y1: params[1],
                    x2: params[2],
                    y2: params[3],
                    x: currentX,
                    y: currentY
                });
                break;

            case 'Q':
            case 'q':
                // Quadratic Bezier Curve To (Q) or relative Quadratic Bezier Curve To (q)
                if (command === 'Q') {
                    currentX = params[2];
                    currentY = params[3];
                } else {
                    currentX += params[2];
                    currentY += params[3];
                }
                commands.push({
                    type: command,
                    x1: params[0],
                    y1: params[1],
                    x: currentX,
                    y: currentY
                });
                break;
            case 'T':
                commands.push({
                    type: command,
                    x: params[0],
                    y: params[1],
                });
                break;
            case "t":
                commands.push({
                    type: command,
                    dx: params[0],
                    dy: params[1],
                });
            case 'Z':
            case 'z':
                // Close Path (Z or z)
                commands.push({
                    type: command
                });
                break;

            default:
                console.error(`Unsupported command: ${command}`);
        }
    }
    return commands;
};

export const parseLatexString = (string: string) => {
    // Split input into text and math parts using $...$
    const parts = string.split(/(\$.*?\$)/g);

    return parts.map(part => {
        if (part.startsWith("$") && part.endsWith("$")) {
            return part.slice(1, -1); // Remove $ but keep math as is
        } else {
            return `\\text{${part}}`; // Wrap text in \text{}
        }
    }).join("");
};

export const textToPoints = (string: string, position: Vector, fontSize: number) => {
    string = String(string);
    let pathCommands: TransformedSVGCommandList[] = [];
    string = parseLatexString(string);
    const parser = new DOMParser();
    const svg = parser.parseFromString((<any>MathJax).startup.adaptor.innerHTML((<any>MathJax).tex2svg(string, {
        display: true,
    })), "image/svg+xml");
    const pathDefinitions = Array.from(svg.querySelectorAll("path"));
    const useElements = Array.from(svg.querySelectorAll(`use`));
    for (let definition of pathDefinitions) {
        let commands = parsePathData(definition.getAttribute("d") || "");
        let id = definition.getAttribute("id");
        const pathInstances = useElements.filter(el => el.getAttribute("xlink:href") === `#${id}`);
        pathCommands.push(...pathInstances.map((instance: any) => {
            let transformation = {
                scale: [1, 1],
                translation: [0, 0]
            };
            while (instance.parentElement) {
                const transformList = instance.transform?.baseVal;
                if (transformList) {
                    for (let transform of transformList) {
                        if (transform.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                            transformation.translation[0] += transform.matrix.e;
                            transformation.translation[1] += transform.matrix.f;
                        } else if (transform.type == SVGTransform.SVG_TRANSFORM_SCALE) {
                            transformation.scale[0] *= transform.matrix.a;
                            transformation.scale[1] *= transform.matrix.d;
                        }
                    }
                }
                instance = instance.parentElement;
            }
            return {
                commands,
                transformation
            }
        }));
    }

    const output = svgPathToPoints(position, pathCommands, false, true);
    const paths = output.paths;

    let points: Vector[][] = [];
    let holes: Vector[][][] = [];
    for (let p of paths) {
        let scaledPoints = p.points.map(point => point.map((coord, i) => position[i] + (coord - position[i]) * fontSize / output.height));
        if (!p.hole) {
            holes.push([]);
            points.push(scaledPoints);
        } else {
            holes[holes.length - 1].push(scaledPoints);
        }
    }
    return {
        points,
        holes
    };
}

export async function executeInParallel(funct: Function, args: any[], threadCount = Math.min(navigator.hardwareConcurrency, 2)) {
    const result: any[] = [];
    while (args.length) {
      const res = await Promise.all(args.splice(0, threadCount).map(x => funct(x)));
      result.push(res);
    }
    return result.flat();
}

export function isLeft(p1: Vector, p2: Vector, p3: Vector) {
    // Cross product to determine if p3 is left of the directed line (p1 -> p2)
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p3[0] - p1[0]) * (p2[1] - p1[1]);
}

export function pointInPolygon(polygonPoints: Vector[], point: Vector) {
    let [px, py] = point;
    let windingNumber = 0;
    let n = polygonPoints.length;
    for (let i = 0; i < n; i++) {
        let [x1, y1] = polygonPoints[i];
        let [x2, y2] = polygonPoints[(i + 1) % n]; // Wrap around to the first point

        if (y1 <= py) {
            if (y2 > py && isLeft([x1, y1], [x2, y2], [px, py]) > 0) {
                windingNumber++;
            }
        } else {
            if (y2 <= py && isLeft([x1, y1], [x2, y2], [px, py]) < 0) {
                windingNumber--;
            }
        }
    }
    return windingNumber !== 0; // Nonzero means inside
}

export function pointsInPolygon(polygonPoints: Vector[], points: Vector[]) {
    for (let point of points) { 
        if (!pointInPolygon(polygonPoints, point))
            return;
    }
    return true;
}