// Define Wanim namespace
var Wanim = {};

Wanim.Shaders = {
  vertex: {}, 
  fragment: {} 
};

Wanim.Colors = {
  RED: [255, 0, 0],
  GREEN: [0, 255, 0],
  BLUE: [0, 0, 255],
  WHITE: [255, 255, 255],
}

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
  constructor(canvas, interactive = true) {
    if (!canvas)
      throw Error(
        "A canvas object must be provided to create a Wanim canvas element."
      );
    this.canvas = canvas;
    this.scenes = [];
    this.interactive = interactive;
    this.gl = canvas.getContext("webgl2"); 

    // If there is no WebGL, say that there is no WebGL
    if (!this.gl)
      throw Error("WebGL could not be initialized for Wanim canvas.");
      
    this._clear();
  }

  _clear() {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  _draw(object) {
    const vertexShader = object.vertexShader;
    const fragmentShader = object.fragemntShader; 
    const vertices = object.vertices; 
    this._initShaders();

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

  play() {
    
  }
};

Wanim.PrimitiveObject = class {
  constructor(vertices, color = Wanim.Colors.WHITE, opacity = 1, vertexShader, fragmentShader, dim = 3) {
    this.vertices = vertices;
    this.vertexShader = vertexShader; 
    this.fragmentShader = fragmentShader;
    this.dim = dim;
  }
}

Wanim.Shapes = {
  _TRIANGLE(...points) {
    return points.splice(2, Infinity).map(x => x.push(0)).flatten();
  },
  TRIANGLE(...points) {
    return new Wanim.PrimitiveObject(this._TRIANGLE(...points));
  },
  SQUARE(len) {
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