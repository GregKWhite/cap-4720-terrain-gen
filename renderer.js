renderState = {}
var gl, canvas, program;
var then = 0;

var lastMousePos = [];
var mouseIsDown = false;
var rotationMat = mat4.create();
mat4.identity(rotationMat, rotationMat);

function renderSphere() {
  canvas = document.getElementById('myCanvas');
  gl = canvas.getContext('webgl');
  gl.enable(gl.DEPTH_TEST);
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
  program.uMinLight = gl.getUniformLocation(program, "uMinLight");

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

  gl.uniform1f(program.uScale, getFloatFrom('scale'))
  gl.uniform1f(program.uFrequency, getFloatFrom('frequency'))
  gl.uniform1f(program.uMinLight, getFloatFrom('min-light'))

  // Set up the normal matrix
  normalMat = mat3.create();
  mat3.fromMat4(normalMat, mvMat);
  mat3.invert(normalMat, normalMat);
  mat3.transpose(normalMat, normalMat);
  gl.uniformMatrix3fv(program.uNormalMatrix, false, normalMat);

  gl.drawArrays(gl.TRIANGLES, 0, renderState.geometry.length / 3);

  requestAnimationFrame(drawScene);
}

function getFloatFrom(elementId, defaultValue) {
  parsedValue = parseFloat(document.getElementById(elementId).value);

  if (typeof defaultValue === "undefined") {
    defaultValue = 0
  }

  return parsedValue || defaultValue;
}

// Inspiration for roating came from this site:
// http://learningwebgl.com/blog/?p=1253
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
  var length = 1.618033988749895; // Golden ratio

  // Generate the initial rectangles used to
  // create the icosphere
  var p11 = new Point(-length/2, width/2, 0.0).normalize();
  var p12 = new Point(length/2, width/2, 0.0).normalize();
  var p13 = new Point(-length/2, -width/2, 0.0).normalize();
  var p14 = new Point(length/2, -width/2, 0.0).normalize();

  var p21 = new Point(-width/2, 0.0, length/2).normalize();
  var p22 = new Point(width/2, 0.0, length/2).normalize();
  var p23 = new Point(-width/2, 0.0, -length/2).normalize();
  var p24 = new Point(width/2, 0.0, -length/2).normalize();

  var p31 = new Point(0.0, -length/2, width/2).normalize();
  var p32 = new Point(0.0, length/2, width/2).normalize();
  var p33 = new Point(0.0, -length/2, -width/2).normalize();
  var p34 = new Point(0.0, length/2, -width/2).normalize();


  // Make the initial 20 triangles.
  var triangles = [
    new Triangle(p21,p11,p13),
    new Triangle(p21,p13,p31),
    new Triangle(p21,p11,p32),
    new Triangle(p21,p22,p32),
    new Triangle(p21,p22,p31),
    new Triangle(p33,p31,p13),
    new Triangle(p33,p31,p14),
    new Triangle(p33,p23,p13),
    new Triangle(p33,p24,p14),
    new Triangle(p33,p24,p23),
    new Triangle(p34,p12,p32),
    new Triangle(p34,p32,p11),
    new Triangle(p34,p24,p12),
    new Triangle(p34,p24,p23),
    new Triangle(p34,p11,p23),
    new Triangle(p11,p23,p13),
    new Triangle(p24,p12,p14),
    new Triangle(p22,p31,p14),
    new Triangle(p22,p14,p12),
    new Triangle(p22,p32,p12)
  ]

  // Subdivide the triangles 4 times
  for (var times = 0; times < 4; times++) {
    triangles = subdivideTriangles(triangles)
  }

  // Retrieve the actual coordinates from each triangle
  for (var i = 0; i < triangles.length; i++) {
    vertices = vertices.concat(
      triangles[i].p1.toArray(),
      triangles[i].p2.toArray(),
      triangles[i].p3.toArray()
    )
  }

  return new Float32Array(vertices);
}

function subdivideTriangles(triangles) {
  var newTriangles = []

  // Interpolate over each triangle
  for (var i = 0; i < triangles.length; i++) {
    newTriangles = newTriangles.concat(
      subdivide(triangles[i])
    )
  }

  return newTriangles;
}

function subdivide(triangle) {
  m1 = triangle.p1.midpoint(triangle.p2).normalize();
  m2 = triangle.p1.midpoint(triangle.p3).normalize();
  m3 = triangle.p2.midpoint(triangle.p3).normalize();

  return [
    new Triangle(m1, m2, m3),
    new Triangle(triangle.p1, m1, m2),
    new Triangle(m1, triangle.p2, m3),
    new Triangle(m2, m3, triangle.p3)
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
     throw("Program failed to link :( " + gl.getProgramInfoLog(program));
  }

  return program;
}

function createShader(gl, shaderId) {
  var shaderScript = document.getElementById(shaderId);

  var shader = gl.createShader(getShaderType(gl, shaderScript.type));
  gl.shaderSource(shader, shaderScript.text);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw("Shader compilation error: " + gl.getShaderInfoLog(shader));
  }

  return shader;
}

function getShaderType(gl, type) {
  if (type == 'x-shader/x-vertex') {
    return gl.VERTEX_SHADER;
  } else if (type == 'x-shader/x-fragment') {
    return gl.FRAGMENT_SHADER;
  }

  throw(type + " is not a valid shader type.")
}

function Triangle(p1, p2, p3) {
  this.p1 = p1
  this.p2 = p2
  this.p3 = p3
}

function Point(v1, v2, v3) {
  this.v1 = v1
  this.v2 = v2
  this.v3 = v3

  this.normalize = function() {
    magnitude = Math.sqrt(this.v1 * this.v1 + this.v2 * this.v2 + this.v3 * this.v3);

    return new Point(
      this.v1 / magnitude,
      this.v2 / magnitude,
      this.v3 / magnitude
    );
  }

  this.add = function(point2) {
    return new Point(
      this.v1 + point2.v1,
      this.v2 + point2.v2,
      this.v3 + point2.v3
    );
  }

  this.divide = function(value) {
    return new Point(
      this.v1 / value,
      this.v2 / value,
      this.v3 / value
    );
  }

  this.toArray = function() {
    return [
      this.v1,
      this.v2,
      this.v3
    ];
  }

  this.midpoint = function(point2) {
    return this.add(point2).divide(2);
  }
}
