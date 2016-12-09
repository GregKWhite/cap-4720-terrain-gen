renderState = {}
var gl, canvas, program;
var then = 0;
var iterations = 4

var lastMousePos = [];
var mouseIsDown = false;
var rotationMat = mat4.create();
mat4.identity(rotationMat, rotationMat);

function renderSphere() {
  canvas = document.getElementById('myCanvas');
  gl = canvas.getContext('webgl');
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.7, 0.7, 0.7, 1.0);
  gl.clearColor(0, 0, 0, 1);

  // Set up the initial state for the renderer
  renderState.angle = 0;
  renderState.rotateAngle = 0.01;
  renderState.gl = gl;
  renderState.canvas = canvas;

  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp;
  document.onmousemove = handleMouseMove;

  program = createProgram(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  // Set up attributes
  var positionLoc = gl.getAttribLocation(program, 'aPosition');

  // Set up the uniforms
  program.pMatrixLoc = gl.getUniformLocation(program, "uPMatrix");
  program.mvMatrixLoc = gl.getUniformLocation(program, "uMVMatrix");
  program.vMatrixLoc = gl.getUniformLocation(program, "uVMatrix");
  program.uLightPos = gl.getUniformLocation(program, "uLightPos");
  program.uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
  program.uUseLighting = gl.getUniformLocation(program, "uUseLighting");
  program.uDiffuseCoefficient = gl.getUniformLocation(program, "uDiffuseCoefficient");
  program.uLightColor = gl.getUniformLocation(program, "uLightColor");
  program.uScale = gl.getUniformLocation(program, "uScale");
  program.uFrequency = gl.getUniformLocation(program, "uFrequency");

  // Set the random seeds to ensure a random globe each time this runs:
  program.uRandomSeedX = gl.getUniformLocation(program, "uRandomSeedX");
  program.uRandomSeedY = gl.getUniformLocation(program, "uRandomSeedY");
  program.uRandomSeedZ = gl.getUniformLocation(program, "uRandomSeedZ");
  gl.uniform1f(program.uRandomSeedX, Math.random() * 10);
  gl.uniform1f(program.uRandomSeedY, Math.random() * 10);
  gl.uniform1f(program.uRandomSeedZ, Math.random() * 10);

  // Initialize the webgl geometry buffer
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  // Set the geometry to use
  console.time('initGeometry')
  renderState.geometry = initGeometry();
  console.timeEnd('initGeometry')

  gl.bufferData(gl.ARRAY_BUFFER, renderState.geometry, gl.STATIC_DRAW);

  // Draw the initial rectangles
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
  var mvMat = mat4.create();
  var viewMat = mat4.create();
  var projectionMat = mat4.create();
  var rotationSpeed = 5;

  mat4.lookAt(viewMat, [0, 0, 4], [0,0,0], [0, 1, 0]);
  mat4.multiply(mvMat, rotationMat, mvMat);
  mat4.rotate(mvMat, mvMat, degToRad(time * rotationSpeed), [0, 1, 0]);
  mat4.multiply(mvMat, viewMat, mvMat);
	mat4.perspective(projectionMat, degToRad(60), aspect, 0.1, Math.sqrt(3) * 2000);

  gl.uniformMatrix4fv(program.pMatrixLoc, false, projectionMat);
  gl.uniformMatrix4fv(program.mvMatrixLoc, false, mvMat);
  gl.uniformMatrix4fv(program.vMatrixLoc, false, viewMat);

  // Only set up lighting if the user wants it
  if (document.getElementById('use-lighting').checked) {
    gl.uniform1f(program.uUseLighting, 1)
    gl.uniform1f(
      program.uDiffuseCoefficient,
      parseFloat(document.getElementById('diffuse-coefficient').value)
    )
    gl.uniform3f(
      program.uLightPos,
      getFloatFrom('light-pos-x'),
      getFloatFrom('light-pos-y'),
      getFloatFrom('light-pos-z')
    )

    gl.uniform3f(
      program.uLightColor,
      getFloatFrom('light-col-r'),
      getFloatFrom('light-col-g'),
      getFloatFrom('light-col-b')
    )
  } else {
    gl.uniform1f(program.uUseLighting, 0)
  }

  // Set up the noise params
  gl.uniform1f(program.uScale, getFloatFrom('scale', 0.25))
  gl.uniform1f(program.uFrequency, getFloatFrom('frequency', 2.0))

  // Set up the normal matrix
  normalMat = mat3.create();
  mat3.fromMat4(normalMat, mvMat);
  mat3.invert(normalMat, normalMat);
  mat3.transpose(normalMat, normalMat);
  gl.uniformMatrix3fv(program.uNormalMatrix, false, normalMat);

  offset = 0;
  gl.drawArrays(gl.TRIANGLES, offset, renderState.geometry.length / 3 - offset);

  requestAnimationFrame(drawScene);
}

function getFloatFrom(elementId, defaultValue) {
  parsedValue = parseFloat(document.getElementById(elementId).value);

  if (typeof defaultValue === "undefined") {
    defaultValue = 0
  }

  return parsedValue || defaultValue;
}

function handleMouseDown(event) {
  mouseIsDown = true;
  lastMousePos = [event.clientX, event.clientY];
}

function handleMouseUp(event) {
  mouseIsDown = false;
}

function handleMouseMove(event) {
  if (!mouseIsDown) return;

  deltaX = event.clientX - lastMousePos[0];
  deltaY = event.clientY - lastMousePos[1];

  var newRotMat = mat4.create()
  mat4.identity(newRotMat);

  mat4.rotate(newRotMat, newRotMat, degToRad(deltaX / 30), [0,1,0]);
  mat4.rotate(newRotMat, newRotMat, degToRad(deltaY / 30), [1,0,0]);
  mat4.multiply(rotationMat, newRotMat, rotationMat);
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function initGeometry() {
  var vertices = [];
  colors = [];

  var width = 1;
  var length = Math.sqrt(3);

  // Generate the initial rectangles used to
  // create the icosphere
  var a1 = [-length/2, width/2, 0.0];
  var b1 = [length/2, width/2, 0.0];
  var c1 = [-length/2, -width/2, 0.0];
  var d1 = [length/2, -width/2, 0.0];

  var a2 = [-width/2, 0.0, length/2];
  var b2 = [width/2, 0.0, length/2];
  var c2 = [-width/2, 0.0, -length/2];
  var d2 = [width/2, 0.0, -length/2];

  var a3 = [0.0, -length/2, width/2];
  var b3 = [0.0, length/2, width/2];
  var c3 = [0.0, -length/2, -width/2];
  var d3 = [0.0, length/2, -width/2];


  // Make the initial 20 triangles.
  var triangles = [
    new triangle(a2,a1,c1),
    new triangle(a2,c1,a3),
    new triangle(a2,a1,b3),
    new triangle(a2,b2,b3),
    new triangle(a2,b2,a3),
    new triangle(c3,a3,c1),
    new triangle(c3,a3,d1),
    new triangle(c3,c2,c1),
    new triangle(c3,d2,d1),
    new triangle(c3,d2,c2),
    new triangle(d3,b1,b3),
    new triangle(d3,b3,a1),
    new triangle(d3,d2,b1),
    new triangle(d3,d2,c2),
    new triangle(d3,a1,c2),
    new triangle(a1,c2,c1),
    new triangle(d2,b1,d1),
    new triangle(b2,a3,d1),
    new triangle(b2,d1,b1),
    new triangle(b2,b3,b1)
  ]

  for (var i = 0; i < triangles.length; i++) {
    triangles[i] = new triangle(
      normalize(triangles[i].p1),
      normalize(triangles[i].p2),
      normalize(triangles[i].p3)
    );
  }

  // Subdivide the triangles n times
  for (var times = 0; times < iterations; times++) {
    triangles = subdivideTriangles(triangles)
  }

  // Retrieve the actual coordinates from each triangle
  for (var i = 0; i < triangles.length; i++) {
    vertices = vertices.concat(triangles[i].p1, triangles[i].p2, triangles[i].p3)
  }

  return new Float32Array(vertices);
}

function subdivideTriangles(triangles) {
  var newTriangles = []

  // Interpolate over each triangle
  for (var i = 0; i < triangles.length; i++) {
    subdividedTriangles = subdivide(
      triangles[i].p1,
      triangles[i].p2,
      triangles[i].p3
    )

    newTriangles = newTriangles.concat(subdividedTriangles)
  }

  return newTriangles;
}

function subdivide(point1, point2, point3) {
  var triangles = []

  m1 = normalizedMidpoint(point1, point2)
  m2 = normalizedMidpoint(point1, point3)
  m3 = normalizedMidpoint(point2, point3)

  triangles.push(new triangle(m1, m2, m3))
  triangles.push(new triangle(point1, m1, m2))
  triangles.push(new triangle(m1, point2, m3))
  triangles.push(new triangle(m2, m3, point3))

  return triangles;
}

function normalizedMidpoint(point1, point2) {
  midpoint = [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2,
    (point1[2] + point2[2]) / 2
  ]

  return normalize(midpoint);
}

function normalize(points) {
  magnitude = Math.sqrt(
    points[0] * points[0] +
    points[1] * points[1] +
    points[2] * points[2]
  )

  return [
    points[0] / magnitude,
    points[1] / magnitude,
    points[2] / magnitude
  ]
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

function triangle(p1, p2, p3) {
  this.p1 = p1
  this.p2 = p2
  this.p3 = p3
}
