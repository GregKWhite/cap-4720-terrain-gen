function renderSphere() {
  var canvas = document.getElementById('myCanvas');
  var gl = canvas.getContext('webgl');
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


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

  gl.drawArrays(gl.TRIANGLES, 0, 6);
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

  var rectangle1 = p11.concat(p12, p13, p12, p13, p14);

  var p21 = [-width/2, 0.0, length/2];
  var p22 = [width/2, 0.0, length/2];
  var p23 = [-width/2, 0.0, -length/2];
  var p24 = [width/2, 0.0, -length/2];

  var rectangle2 = p21.concat(p22, p23, p22, p23, p24);


  var p31 = [0.0, -length/2, width/2];
  var p32 = [0.0, length/2, width/2];
  var p33 = [0.0, -length/2, -width/2];
  var p34 = [0.0, length/2, -width/2];

  var rectangle3 = p31.concat(p32, p33, p32, p33, p34);

  return new Float32Array(rectangle1);
}

function initColors() {
  colors = [randColor(), randColor(), randColor(), randColor(), randColor(), randColor()]
  colors = colors.reduce(function(a, b) {
    return a.concat(b)
  });

  return new Uint8Array(colors);
}

function randColor() {
  return [getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255)];
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
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
