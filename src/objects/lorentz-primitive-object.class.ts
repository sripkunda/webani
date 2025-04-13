import { LorentzInterpolatedAnimation } from "../animations/lorentz-interpolated-animation.class";
import { Colors } from "../api/colors";
import { LorentzMaterial } from "../lighting/lorentz-material.class";
import { Matrix4 } from "../util/matrices/matrix.type";
import { MatrixUtils } from "../util/matrices/matrix.utils";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";

export abstract class LorentzPrimitiveObject { 
    
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    _rotationCenterOverride?: Vector3;
    material: LorentzMaterial;

    constructor(position: Vector3 = [0, 0, 0], rotation: Vector3 = [0, 0, 0], scale: Vector3 = [1, 1, 1], rotationalCenter?: Vector3, material?: LorentzMaterial, cachedNormals?: Vector3[]) { 
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this._rotationCenterOverride = rotationalCenter;
        this.material = material || new LorentzMaterial(Colors.WHITE);
    }

    get rotationCenter() {
        return this._rotationCenterOverride || this.center;
    }

    set rotationCenter(value: Vector3) {
        this._rotationCenterOverride = value
    }

    abstract animationClass?: new (...args: unknown[]) => LorentzInterpolatedAnimation<LorentzPrimitiveObject>;
    abstract get _triangulation(): Vector3[];
    abstract get _normals(): Vector3[];
    abstract get copy(): LorentzPrimitiveObject;
    abstract get center(): Vector3;

    get modelMatrix(): Matrix4 {
        return MatrixUtils.fromTRS(this.position, this.rotation, this.scale, this.rotationCenter);
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
        copy.position = VectorUtils.add(copy.position, VectorUtils.subtract(newCenter, center));
        return copy;
    }

    translate(offset: Vector3): void {
        this.position = VectorUtils.add(this.position, offset);
    }
    
    rotate(offset: Vector3): void {
        this.rotation = VectorUtils.add(this.rotation, offset);
    }
    
    scaleBy(factor: Vector3): void {
        this.scale = [
            this.scale[0] * factor[0],
            this.scale[1] * factor[1],
            this.scale[2] * factor[2]
        ];
    }
}