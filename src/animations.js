import { _defaultCanvas } from './canvas';
import { WanimCollection, WanimObject } from './objects';
import { executeInParallel, windingOrderClockwise } from './util';

export const Wait = (duration) => {
    const animation = new WanimObjectAnimation(null, null, duration);
    _defaultCanvas?.play(animation);
    return animation;
}

export const Play = (...animations) => {
    _defaultCanvas?.play(...animations);
}

export const ScreenCenter = (wanimCanvas = _defaultCanvas) => {
    return [wanimCanvas.canvas.width / 2, wanimCanvas.canvas.height / 2];
}

class WanimAnimationBase {
    frame(t) {
        return;
    }

    done(t) { 
        return;
    }
}

class WanimInterpolatedAnimationBase extends WanimAnimationBase { 
    constructor(before, after, duration = 1000, backwards = false, interpolationFunction) {
        super();
        this._before = before;
        this._after = after;
        this.duration = duration;
        this.backwards = backwards;
        this.interpolationFunction = interpolationFunction || WanimInterpolatedAnimationBase.cubic;
        this._resolveAnimation();
    }

    progress(t) { 
        return t / this.duration;
    }

    done(t) {
        return this.progress(t) >= 1;
    }

    _resolveAnimation() { 
        return;
    }

    get before() { 
        return this._before;
    }

    get after() { 
        return this._after.copy;
    }

    set before(value) { 
        this._before = value;
        this._resolveAnimation();
    }

    set after(value) { 
        this._after = value;
        this._resolveAnimation();
    }

    static lerp(before, after, t) {
        return before + t * (after - before);
    }

    static cubic(before, after, t) {
        return WanimInterpolatedAnimationBase.lerp(before, after, Math.pow(t, 3));
    }
}

export const WanimObjectAnimation = class extends WanimInterpolatedAnimationBase {

    get before() {
        let trueBefore = this._before.copy;
        trueBefore.rotation = trueBefore.rotation.map(x => x %= 360); 
        return trueBefore;
    }

    get after() { 
        let trueAfter = this._after.copy;
        trueAfter.rotation = trueAfter.rotation.map(x => x % 360);
        return trueAfter;
    }

    frame(t, useCached = true) {
        if (useCached) { 
            const cachedFrame = this._cachedFrame(t);
            if (cachedFrame !== undefined) return cachedFrame;
        }
        
        // Scale by the duration
        t = t / this.duration;
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= 1) return this.backwards ? this.before : this.after;
        if (!(this._before instanceof WanimObject) || !(this._after instanceof WanimObject)) return this.before;
        return new WanimObject(this._getFilledPoints(t), this._getHolePoints(t), this._getColor(t), this._getOpacity(t), this._getRotation(t), this.resolvedBefore._cache, this._getRotationalCenter(t));
    }

    _tracePoints(points, numOfPoints) { 
        if (!points || points.length < 2) return [];
    
        let distance = 0;
        const mappedPoints = points.map((point, index, arr) => {
            if (index > 0) {
                const prev = arr[index - 1];
                distance += WanimObject._distance(prev, point);
            }
            return { point, distance };
        });
    
        const totalDistance = mappedPoints[mappedPoints.length - 1].distance;
        const step = totalDistance / (numOfPoints - 1); // Step size for interpolation
        let tracedPoints = [];
        let currentDistance = 0;
    
        for (let i = 0, j = 0; i < numOfPoints; i++) {
            while (j < mappedPoints.length - 1 && mappedPoints[j + 1].distance < currentDistance) {
                j++;
            }
            if (j === mappedPoints.length - 1) {
                tracedPoints.push(mappedPoints[j].point);
            } else {
                const p1 = mappedPoints[j].point;
                const p2 = mappedPoints[j + 1].point;
                const d1 = mappedPoints[j].distance;
                const d2 = mappedPoints[j + 1].distance;
                if ((d2 - d1) > 0) { 
                    const t = (currentDistance - d1) / (d2 - d1);
                    tracedPoints.push([
                        p1[0] + t * (p2[0] - p1[0]),
                        p1[1] + t * (p2[1] - p1[1]),
                        p1[2] + t * (p2[2] - p1[2])
                    ]);
                } else { 
                    tracedPoints.push(points[j]);
                }
            }
            currentDistance += step;
        }
        return tracedPoints;
    }

    _resolvePointArray(beforePointArray, afterPointArray) {
        const numOfPoints = Math.max(Math.max(beforePointArray.length, afterPointArray.length) / 4, 100);
        beforePointArray.splice(0, beforePointArray.length, ...this._tracePoints(beforePointArray, numOfPoints));
        afterPointArray.splice(0, afterPointArray.length, ...this._tracePoints(afterPointArray, numOfPoints));
        if (!(windingOrderClockwise(afterPointArray) == windingOrderClockwise(beforePointArray))) { 
            afterPointArray.reverse();
        }
    }

    _equateHoleCount(beforeHoles, afterHoles, beforeReference, afterReference) {
        const smallToBig = beforeHoles.length < afterHoles.length;
        let i = 0;
        while (beforeHoles.length != afterHoles.length) {
            const bigger = smallToBig ? afterHoles : beforeHoles;
            const smaller = smallToBig ? beforeHoles : afterHoles;
            const reference = smallToBig ? beforeReference : afterReference;
            smaller.push(new Array(bigger[i].length).fill(0).map((x, j) => reference));
            i++;
        }
    }

    _cachedFrame(t) {
        if (!this.cache) return;
        const items = this.cache.filter(x => Math.abs(x.frame - t) < 50);
        if (items.length > 0) { 
            return items[0].object;
        } 
    }

    get _cacheStep() { 
        return Math.ceil(this.duration / 120);
    }

    _cacheUntilFrame(t) {
        while (t > 0) {
            this._cache(t);
            t -= this._cacheStep;
        }
    }

    _cache(...times) { 
        if (!this.cache) this.cache = [];
        executeInParallel((t) => this.cache.push({
            time: t,
            object: this.frame(t, false)
        }), times);
    }

    _resolveAnimation() {
        if (!(this._before instanceof WanimObject) || !(this._after instanceof WanimObject)) return;
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
        this._resolvePointArray(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints);
        this._equateHoleCount(this.resolvedBefore.holes, this.resolvedAfter.holes, this.resolvedBefore.filledPoints[0], this.resolvedAfter.filledPoints[0]);
        for (let i in this.resolvedBefore.holes) {
            this._resolvePointArray(this.resolvedBefore.holes[i], this.resolvedAfter.holes[i]);
        }
    }

    _interpolatePoints(beforePoints, afterPoints, t) {
        return beforePoints.map((before, i) => {
            let after = afterPoints[i];
            return before.map((x, j) => this.interpolationFunction(x, after[j], this.backwards ? 1 - t : t));
        });
    }

    _getFilledPoints(t) {
        return this._interpolatePoints(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints, t);
    }

    _getHolePoints(t) {
        const switched = this.progress(t) >= 0.5;
        return this.resolvedBefore.holes.map((beforeHolePoints, i) => {
            return this._interpolatePoints(beforeHolePoints, this.resolvedAfter.holes[i], t);
        });
    }

    _getColor(t) {
        return this.resolvedBefore.color.map((before, i) => {
            let after = this.resolvedAfter.color[i];
            return this.interpolationFunction(before, after, this.backwards ? 1 - t : t);
        });
    }

    _getRotation(t) {
        return this.resolvedBefore.rotation.map((before, i) => {
            let after = this.resolvedAfter.rotation[i];
            return this.interpolationFunction(before, after, this.backwards ? 1 - t : t);
        });
    }

    _getRotationalCenter(t) {
        return this.resolvedBefore.rotationCenter.map((before, i) => {
            let after = this.resolvedAfter.rotationCenter[i];
            return this.interpolationFunction(before, after, this.backwards ? 1 - t : t);
        });
    }

    _getOpacity(t) {
        return this.interpolationFunction(this.resolvedBefore.opacity, this.resolvedAfter.opacity, this.backwards ? 1 - t : t);
    }
}

export const WanimCollectionAnimation = class extends WanimInterpolatedAnimationBase {
    constructor(before, after, duration = 1000, backwards = false, interpolationFunction) {
        const _before = before instanceof WanimObject ? new WanimCollection(before) : before;
        const _after = after instanceof WanimObject ? new WanimCollection(after) : after;
        super(_before, _after, duration, backwards, interpolationFunction);
    }

    get before() {
        return new WanimCollection(...this._animations.map(x => x.before));
    }

    get after() {
        return new WanimCollection(...this._animations.map(x => x.after));
    }

    _resolveAnimation() {
        this._animations = [];
        if (!(this._before instanceof WanimCollection) || !(this._after instanceof WanimCollection)) return;
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
        if (this.resolvedBefore.objects.length == 0 || this.resolvedAfter.objects.length == 0) return;
        while (this.resolvedBefore.objects.length != this.resolvedAfter.objects.length) {
            if (this.resolvedBefore.objects.length < this.resolvedAfter.objects.length) { 
                this.resolvedBefore.add(this.resolvedBefore.objects[this.resolvedBefore.objects.length - 1]);
            } else {
                this.resolvedAfter.add(this.resolvedAfter.objects[this.resolvedAfter.objects.length - 1]);
            }
        }
        this._animations = this.resolvedBefore.objects.map((before, i) => new WanimObjectAnimation(before, this.resolvedAfter.objects[i], this.duration, this.backwards, this.interpolationFunction));
    }

    frame(t) {
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= this.duration) this.backwards ? this.before : this.after;
        return new WanimCollection(...this._animations.map(animation => animation.frame(t)));
    }
}

export const AnimationSet = class extends WanimAnimationBase { 
    constructor(...animations) {
        super();
        this.animations = animations;
        this.nextIsAsynchronous = false;
    }

    get last() { 
        return this.animations[this.animations.length - 1];
    }

    get duration() { 
        let sum = 0;
        for (let frame of this.animations) {
            sum += frame.duration;
        }
        return sum;
    }

    addAnimation(animation, asynchronous = true) { 
        if (this.nextIsAsynchronous) {
            this.last.after = animation.frame(this.last.duration);
            if (this.last.duration < animation.duration) { 
                const remainingAnimation = new WanimCollectionAnimation(animation.frame(this.last.duration), animation.frame(animation.duration), animation.duration - this.last.duration, animation.backwards, animation.interpolationFunction);
                this.animations.push(remainingAnimation);
            }
        } else {
            this.animations.push(animation);
        }
        this.nextIsAsynchronous = asynchronous;
    }

    done(t) {
        return t / this.duration >= 1;
    }

    frame(t) { 
        let durations = 0;
        for (let animation of this.animations) { 
            if (t < animation.duration + durations) { 
                return animation.frame(t - durations);
            }
            durations += animation.duration;
        }
        return this.last.after;
    }

    get length() { 
        return this.animations.length;
    }
}

export const RenderedCollection = class {
    constructor(collection) {
        this.collection = collection instanceof WanimObject ? new WanimCollection(collection) : collection;
        this.animations = new AnimationSet();
    }

    get animated() { 
        return this.animations.length > 0;
    }

    _addAnimation(animation, asynchronous = false) {
        this.animations.addAnimation(animation, asynchronous);
        this.collection = animation.after;
        return this;
    }

    Hide() {
        this.FadeOut(0);
    }

    PositionCenterAt(position) { 
        return this.MoveCenterTo(position, 0);
    }

    FadeIn(duration = 1000, keepInitialOpacity = false, asynchronous = false) {
        const beforeObjects = this.collection.objects.map((object, i) => {
            let b = object.copy;
            if (!keepInitialOpacity) {
                b.opacity = 0;
            }
            return b;
        });
        const afterObjects = this.collection.objects.map((object, i) => {
            let b = object.copy;
            b.opacity = 1;
            return b;
        });
        const before = new WanimCollection(...beforeObjects);
        const after = new WanimCollection(...afterObjects);
        return this._addAnimation(new WanimCollectionAnimation(before, after, duration), asynchronous);
    }

    FadeOut(duration = 1000, asynchronous = false) {
        const afterObjects = this.collection.objects.map((object, i) => {
            let a = object.copy;
            a.opacity = 0;
            return a;
        });
        const after = new WanimCollection(...afterObjects);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    Scale(factor, duration = 1000, asynchronous = false, backwards = false) {
        factor = WanimObject._convertPointTo3D(factor);
        let center = this.collection.center;
        const afterObjects = this.collection.objects.map((object, i) => {
            let after = object.copy;
            after.filledPoints = after.filledPoints.map((x) => x.map((y, i) => (y - center[i]) * factor[i] + center[i]));
            after.holes = after.holes.map(points => points.map((x) => x.map((y, i) => (y - center[i]) * factor[i] + center[i])));
            return after;
        });
        const after = new WanimCollection(...afterObjects);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration, backwards));
    }

    ZoomIn(duration = 1000, asynchronous = false) {
        this.Scale([1 / 10, 1 / 10], duration, asynchronous, true);
        return this;
    }

    ZoomOut(duration = 1000, asynchronous = false) {
        this.Scale([1 / 10, 1 / 10], duration);
        this.FadeOut(duration, asynchronous);
    }

    TransformInto(after, duration = 800, asynchronous = false) {
        if (after instanceof RenderedCollection) { 
            after = after.collection;
        }
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    MoveCenterTo(position, duration = 1000, asynchronous = false) {
        position = WanimObject._convertPointTo3D(position);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, this.collection.copyCenteredAt(position), duration), asynchronous);
    }
    
    Rotate(angle, duration = 1000, asynchronous = false) {
        const afterObjects = this.collection.objects.map(obj => {
            const a = obj.copy;
            a.rotation = [0, 0, angle];
            return a;
        });
        const after = new WanimCollection(...afterObjects);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    FadeInDelayed(durationPerObject = 80, keepInitialOpacity = false) {
        const beforeObjects = this.collection.objects.map((object, i) => {
            let b = object.copy;
            if (!keepInitialOpacity) {
                b.opacity = 0;
            }
            return b;
        });
        let before = new WanimCollection(...beforeObjects);
        const after = before.copy;
        for (let i in after.objects) {
            after.objects[i].opacity = 1;
            const afterCollection = after.copy;
            this._addAnimation(new WanimCollectionAnimation(before, afterCollection, durationPerObject, false, WanimInterpolatedAnimationBase.lerp));
            before = afterCollection;
        }
        return this;
    }

    Wait(duration) { 
        return this._addAnimation(new WanimCollectionAnimation(this.collection, this.collection, duration));
    }

}