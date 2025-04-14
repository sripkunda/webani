import { WebaniInterpolatedAnimation } from "../animations/webani-interpolated-animation.class";
import { Colors } from "../lighting/colors";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { Matrix4 } from "../types/matrix4.type";
import { MatrixUtils } from "../util/matrix.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { WebaniTransformable } from "./webani-transformable.class";

export abstract class WebaniPrimitiveObject extends WebaniTransformable { 
    
    material: WebaniMaterial;

    constructor(position: Vector3 = [0, 0, 0], rotation: Vector3 = [0, 0, 0], scale: Vector3 = [1, 1, 1], rotationalCenter?: Vector3, material?: WebaniMaterial, extraTransforms: WorldTransform[] = []) { 
        super(position, rotation, scale, rotationalCenter, extraTransforms);
        this.material = material || new WebaniMaterial(Colors.WHITE);
    }

    abstract animationClass?: new (...args: unknown[]) => WebaniInterpolatedAnimation<WebaniPrimitiveObject>;
    abstract get _triangulation(): Vector3[];
    abstract get _normals(): Vector3[];
    abstract get copy(): WebaniPrimitiveObject;
    abstract get localCenter(): Vector3;

    get center(): Vector3 { 
        return MatrixUtils.multiplyVector3(MatrixUtils.fromTRS(this.transform.position, [0, 0, 0], this.transform.scale), this.localCenter);
    }
    
    get modelMatrix(): Matrix4 {
        const transform = this.completeTransform;
        let matrix = MatrixUtils.fromTRS(transform.position, transform.rotation, transform.scale, transform.rotationCenter);
        for (let transform of this.completeExtraTransforms) { 
            matrix = MatrixUtils.multiply(MatrixUtils.fromTRS(transform.position, transform.rotation, transform.scale, transform.rotationCenter), matrix);
        }
        return matrix;
    }

    get triangles(): Vector3[] { 
        return this._triangulation;
    }

    get normals(): Vector3[] {
        return this._normals;
    }

    copyCenteredAt(newCenter: Vector3) {
        newCenter = VectorUtils.convertPointTo3D(newCenter) || newCenter;
        const copy = this.copy;
        const center = this.center;
        copy.transform.position = VectorUtils.add(copy.transform.position, VectorUtils.subtract(newCenter, center));
        return copy;
    }
}