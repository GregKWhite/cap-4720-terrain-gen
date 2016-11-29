renderState = {}
var gl, canvas, program;
var then = 0;
var rotation = [degToRad(90), 0, 0];
var animate = true;
var tao = (1 + Math.sqrt(5)) / 2;


function renderSphere() {
  canvas = document.getElementById('myCanvas');
  gl = canvas.getContext('webgl');
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Set up the initial state for the renderer
  renderState.angle = 0;
  renderState.rotateAngle = 0.01;
  renderState.gl = gl;
  renderState.canvas = canvas;

  program = createProgram(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  // Set up attributes
  var positionLoc = gl.getAttribLocation(program, 'aPosition');
  var colorLoc = gl.getAttribLocation(program, 'aColor');
  var matrixLoc = gl.getAttribLocation(program, 'uMatrix');

  // Set up uniforms
  var resolutionLoc = gl.getUniformLocation(program, 'uResolution');
  gl.uniform2f(resolutionLoc, canvas.width , canvas.height);

  // Initialize the webgl geometry buffer
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  // Set the geometry to use
  renderState.geometry = initGeometry();
  renderState.colors = initColors();

  gl.bufferData(gl.ARRAY_BUFFER, renderState.geometry, gl.STATIC_DRAW);

  // Initialize the webgl color buffer
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  // Set the colors to use
  gl.bufferData(gl.ARRAY_BUFFER, renderState.colors, gl.STATIC_DRAW);

  // Draw the initial rectangles
  document.getElementById('animationToggle').addEventListener('click', toggleAnimation);

  requestAnimationFrame(drawScene);
}

function drawScene(time) {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Used for rotating the elements
  time /= 1000.0;
  var timeDelta = time - then;
  then = time;

  // Calculate matrices
  var aspect = canvas.width / canvas.height;
  var projectionMat = mat4.create();
  var viewMat = mat4.create();
  var rotationSpeed = 30;
  rotation[2] += degToRad(timeDelta * rotationSpeed) % degToRad(360);
  rotation[1] += degToRad(timeDelta * rotationSpeed) % degToRad(360);

  mat4.lookAt(viewMat, [0, 0, 2], [0,0,0], [0, 1.0, 0]);
  mat4.rotate(viewMat, viewMat, degToRad(time * rotationSpeed), [1.0, 1, 0])
	mat4.perspective(projectionMat, degToRad(60), aspect, 0.1, Math.sqrt(3) * 2000);

  var matrixLoc = gl.getUniformLocation(program, 'uMatrix');

  gl.uniformMatrix4fv(matrixLoc, false, mat4.multiply(mat4.create(),projectionMat, viewMat));

  offset = 0;
  gl.drawArrays(gl.TRIANGLES, offset, renderState.geometry.length / 3 - offset);

  requestAnimationFrame(drawScene);
}

function toggleAnimation() {
  console.log(animate);
  animate = !animate;
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function initGeometry() {
  var vertices = [];
  colors = [];

  var width = 1;
  var length = tao;

  // Generate the initial rectangles used to
  // create the icosphere
  var a1 = [-length/2, width/2, 0.0];
  var b1 = [length/2, width/2, 0.0];
  var c1 = [-length/2, -width/2, 0.0];
  var d1 = [length/2, -width/2, 0.0];

  // var vertices = vertices.concat(a1, b1, c1, c1, b1, d1);

  var a2 = [-width/2, 0.0, length/2];
  var b2 = [width/2, 0.0, length/2];
  var c2 = [-width/2, 0.0, -length/2];
  var d2 = [width/2, 0.0, -length/2];

  // var vertices = vertices.concat(a2, b2, c2, c2, b2, d2);


  var a3 = [0.0, -length/2, width/2];
  var b3 = [0.0, length/2, width/2];
  var c3 = [0.0, -length/2, -width/2];
  var d3 = [0.0, length/2, -width/2];

  // var vertices = vertices.concat(a3, b3, c3, c3, b3, d3)


  // Make the initial 20 triangles.
  var triangles = [
    a2,a1,c1,
    a2,c1,a3,
    a2,a1,b3,
    a2,b2,b3,
    a2,b2,a3,
    c3,a3,c1,
    c3,a3,d1,
    c3,c2,c1,
    c3,d2,d1,
    c3,d2,c2,
    d3,b1,b3,
    d3,b3,a1,
    d3,d2,b1,
    d3,d2,c2,
    d3,a1,c2,
    a1,c2,c1,
    d2,b1,d1,
    b2,a3,d1,
    b2,d1,b1,
    b2,b3,b1
  ]

  for (var i = 0; i < triangles.length; i++) {
    vertices = vertices.concat(triangles[i])
  }

  // Interpolate over each triangle
  for (var i = 0; i < triangles.length / 3; i++) {
    vertices = vertices.concat(
      subdivide(
        triangles[i * 3],
        triangles[i * 3+ 1],
        triangles[i * 3 + 2]
      )
    );
  }

  // vertices = subdivideTriangles(vertices);

  return new Float32Array(vertices);
}

function subdivideTriangles(triangles) {
  var newTriangles = []

  // // Interpolate over each triangle
  for (var i = 0; i < triangles.length / 3; i++) {
    newTriangles = newTriangles.concat(
      subdivide(
        triangles[i * 3],
        triangles[i * 3+ 1],
        triangles[i * 3 + 2]
      )
    );
  }

  return newTriangles;
}

function subdivide(point1, point2, point3) {
  vertices = []

  m12 = normalizedMidpoint(point1, point2)
  m13 = normalizedMidpoint(point1, point3)
  m23 = normalizedMidpoint(point2, point3)

  vertices = vertices.concat(m12, m13, m23)
  vertices = vertices.concat(point1, m12, m13)
  vertices = vertices.concat(point2, m12, m23)
  vertices = vertices.concat(point3, m13, m23)

  return vertices;
}

function normalizedMidpoint(point1, point2) {
  midpoint = [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2,
    (point1[2] + point2[2]) / 2
  ]

  console.log("p1: " + point1 + ", p2: " + point2 + ", mid: " + midpoint)
  console.log(point1[1] + " + " + point2[1] + " / 2 = " + midpoint[1]);

  radius = Math.sqrt(
    midpoint[0] * midpoint[0] +
    midpoint[1] * midpoint[1] +
    midpoint[2] * midpoint[2]
  )

  // console.log(radius)

  return [
    midpoint[0] / radius,
    midpoint[1] / radius,
    midpoint[2] / radius
  ]
}

function initColors() {
  var colors = [];

  for (var i = 0; i < renderState.geometry.length / 9; i++) {
    var color1 = getRandomInt(0, 255);
    var color2 = getRandomInt(0, 255);
    var color3 = getRandomInt(0, 255);

    colors = colors.concat([color1, color2, color3, color1, color2, color3, color1, color2, color3])
  }
  return new Uint8Array(colors);
}

function createColors() {
  colors = [randColor(), randColor(), randColor(), randColor(), randColor(), randColor()]
  colors = colors.reduce(function(a, b) {
    return a.concat(b)
  });

  return colors;
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
