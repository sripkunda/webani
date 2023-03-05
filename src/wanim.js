// Define Wanim namespace
var Wanim = {};

Wanim.Shaders = {
  vertex: {}, 
  fragment: {} 
};

Wanim.loadShaders = async (...shaders) => {
  for (shader of shaders) {
    await fetch(shader.path).then(async req => {
      const text = await req.text();
      if (shader.type in Wanim.Shaders)
        if (shader.name)
          Wanim.Shaders[shader.type][shader.name] = text;
        else 
          throw Error(`Cannot load unnamed shader at path: '${shader.path}'`)
      else
        throw Error(`Unknown shader type '${shader.type}' for shader at path: '${shader.path}'`);
    });
  }
}

Wanim.loadCanvas = (...canvases) => {
  const c = canvases.map(canvas => new Wanim.Canvas(canvas));
  return c.length > 1 ? c : c[0];
}

Wanim.Canvas = class {
  constructor(canvas, interactive = true, backgroundColor = Wanim.Colors.BLACK) {
    if (!canvas)
      throw Error(
        "A canvas object must be provided to create a Wanim canvas element."
      );
    this.canvas = canvas;
    this.scenes = [];
    this.interactive = interactive;
    this.gl = canvas.getContext("webgl2", {
      antialias: true
    });
    this.backgroundColor = backgroundColor

    // If there is no WebGL, say that there is no WebGL
    if (!this.gl)
      throw Error("WebGL could not be initialized for Wanim canvas.");
      
    this._clear();
  }

  _clear() {
    this.gl.clearColor(...this.backgroundColor, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  _draw(object) {
    const vertices = object.toPixelSpace(this.canvas.width, this.canvas.height);; 

    this._initShaders(object.vertexShader, object.fragmentShader);

    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    const colorLoc = this.gl.getUniformLocation(this.gl.program, "color");
    this.gl.uniform4fv(colorLoc, [...object.color, object.opacity]);  

    // Assign the vertices in buffer object to a_Position variable
    const position = this.gl.getAttribLocation(this.gl.program, 'position');

    this.gl.vertexAttribPointer(position, object.dim, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(position);

    const n = vertices.length / object.dim;

    this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
  }

  _initShaders(vertexShader = 'default2d', fragmentShader = 'default2d') {
    const makeShader = (glsl, type) => {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, glsl);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        throw Error(`Error compiling shader: ${this.gl.getShaderInfoLog(shader)}`);
    }
      return shader; 
    }

    const vertex = makeShader(Wanim.Shaders.vertex[vertexShader], this.gl.VERTEX_SHADER);
    const fragment = makeShader(Wanim.Shaders.fragment[fragmentShader], this.gl.FRAGMENT_SHADER);
    const program = this.gl.createProgram();
    
    this.gl.attachShader(program, vertex);
    this.gl.attachShader(program, fragment);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw Error("Unable to initialize the shader program");
    }

    this.gl.useProgram(program);  
    this.gl.program = program;
  }

  play(animation) {
    if (animation instanceof Wanim.PrimitiveObject) {
      return this._draw(animation);
    }
  }
};

Wanim.Colors = {
  BLACK: [0, 0, 0],
  RED: [255, 0, 0],
  GREEN: [0, 255, 0],
  BLUE: [0, 0, 255],
  WHITE: [255, 255, 255],
}

Wanim.PrimitiveObject = class {
  constructor(points, color = Wanim.Colors.WHITE, opacity = 1, vertexShader, fragmentShader, dim = 3) {
    this.points = points;
    this.color = color;
    this.opacity = opacity;
    this.vertexShader = vertexShader; 
    this.fragmentShader = fragmentShader;
    this.dim = dim;
  }

  toPixelSpace(width, height) {
    const canvasDimensions = [width, height];
    this.vertices = new Float32Array(this.points.map(x => x.map((x_i, i) => x_i * 2 / canvasDimensions[i] - 1)).map(x => (x.push(0), x)).flat());
    return this.vertices;
  }
}

Wanim.Shapes = {
  TRIANGLE(...points) {
    return new Wanim.PrimitiveObject(points);
  },
  POLYGON(...points) {
    // Algorithm for generating polygon from points given by 
    // https://stackoverflow.com/questions/59287928/algorithm-to-create-a-polygon-from-points

    // Compute "center of mass"
    const center = points.reduce((prev, curr) => prev.map((x, i) => x + curr[i]/points.length), [0, 0]);
    let triangles = [];
    
    const sqrdRadius = (p) => {
      return (p[0] - center[0])**2 + (p[1] - center[1])**2;
    }
    const angle = (p) => {
      return Math.atan2((p[1] - center[1]), (p[0] - center[0]));
    }

    // Reorder points according to polar coordinates (with the radius squared)
    points.sort((x, y) => ((angle(x) - angle(y)) || sqrdRadius(x) - sqrdRadius(y)));
    
    // Draw triangles in order
    for (let i in points) {
      triangles.push([points[i], points[(i + 1) % points.length], center])
    }
    console.log(triangles);
    return new Wanim.PrimitiveObject(triangles.flat(  ));
  },
  RECTANGLE(length_x, length_y, position) {
    return this.POLYGON(position, 
                        [position[0] + length_x, position[1]], 
                        [position[0], position[0] + length_y], 
                        [position[0] + length_x, position[1] + length_y]);
  }
}

Wanim.Animation = class {

}

Wanim.Animations = {
  FadeIn(object) {
    
  },
  FadeOut(object) {

  },
  Transform(before, after) {

  }
}

Wanim.Interactive = {
  CLICK: (wc, callback) => {},
  KEYDOWN: (wc, callback) => {}
}