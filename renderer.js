function renderSphere() {
  var canvas = document.getElementById('myCanvas');
  var gl = canvas.getContext('webgl');
  // gl.enable(gl.DEPTH_TEST);

  var program = createProgram(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  // Set up attributes
  var positionLoc = gl.getAttribLocation(program, 'aPosition');
  var colorLoc = gl.getAttribLocation(program, 'aColor');
  var matrixLoc = gl.getAttribLocation(program, 'aMatrix');

  // Set up uniforms
  var resolutionLoc = gl.getUniformLocation(program, 'uResolution');
  gl.uniform2f(resolutionLoc, canvas.width , canvas.height);

  // Initialize the webgl geometry buffer
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  // Set the geometry to use
  gl.bufferData(gl.ARRAY_BUFFER, initGeometry(), gl.STATIC_DRAW);


  // Initialize the webgl color buffer
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  // Set the colors to use
  gl.bufferData(gl.ARRAY_BUFFER, initColors(), gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function initGeometry() {
  vertices = [];
  colors = [];

  var width = 1;
  var length = Math.sqrt(2);

  // Generate the initial rectangles used to
  // create the icosphere
  var p11 = [-length/2, width/2, 0.0];
  var p12 = [length/2, width/2, 0.0];
  var p13 = [-length/2, -width/2, 0.0];
  var p14 = [length/2, -width/2, 0.0];

  var p21 = [-width/2, 0.0, length/2];
  var p22 = [width/2, 0.0, length/2];
  var p23 = [-width/2, 0.0, -length/2];
  var p24 = [width/2, 0.0, -length/2];

  var p31 = [0.0, -length/2, width/2];
  var p32 = [0.0, length/2, width/2];
  var p33 = [0.0, -length/2, -width/2];
  var p34 = [0.0, length/2, -width/2];

  console.log(p11.concat(p12, p13, p14));

  return new Float32Array(p11.concat(p12, p13, p14));
}

function initColors() {
  return new Uint8Array(
         [100, 70, 120,
          200, 70, 220,
          200, 70, 20,
          200, 170, 120]);
}


// WebGL setup helper functions

function createProgram(gl, vertexId, fragmentId) {
  var vertexShader = createShader(gl, vertexId);
  var fragmentShader = createShader(gl, fragmentId);

  return createAndLinkProgram(gl, vertexShader, fragmentShader);
}

function createAndLinkProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
     throw("program failed to link: " + gl.getProgramInfoLog(program));
  }

  return program;
}

function createShader(gl, shaderId) {
  var shaderScript = document.getElementById(shaderId);

  if (!shaderScript) { throw("Script with id " + shaderId + " could not be found.") }

  var shader = gl.createShader(getShaderType(gl, shaderScript.type));
  gl.shaderSource(shader, shaderScript.text);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw("could not compile shader: " + gl.getShaderInfoLog(shader));
  }

  return shader;
}

function getShaderType(gl, type) {
  if (type == 'x-shader/x-vertex') {
    return gl.VERTEX_SHADER;
  } else if (type == 'x-shader/x-fragment') {
    return gl.FRAGMENT_SHADER;
  }

  throw("Shader type not set for " + shaderId);
}
