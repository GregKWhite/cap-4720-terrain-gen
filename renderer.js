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
}

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
