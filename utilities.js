/*
Copyright (c) 2014 Sumanta Pattanaik
File: utilities.js
Associated files:
	rendereV1.html, 
	rendereV1.js, 
	assimpJsonMeshObjectV1.js,
	ourJsonMeshObjectV1.js
	simpleMeshObjectV1.js
	
Uses public domain library gl-matrix.js (http://glmatrix.net/)

Permission is hereby granted, to the UCF Computer Graphics class students
to use this software for their class assignment. They can use, copy, modify, 
merge, as long as it is for the assignment submission purposes.

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

This version along with its associated files
supports Texturing of Triangular Mesh(es) using WebGL.

Sumanta Pattanaik
Sept 6, 2014.
*/
"use strict";

function initWebGL(canvas, optionalParameters) {
  // Initialize glContext to null.
  var glContext;

  try {
	// Try to grab the standard context. If it fails, fallback to experimental.
	glContext = canvas.getContext("webgl", optionalParameters);
  }
  catch(e) {  
	  alert("Unable to initialize WebGL. Your browser may not support it.");
  }

  return glContext;
}

function init(canvasName, optionalParameters) {
  var canvas = document.getElementById(canvasName);
  var gl = initWebGL(canvas, optionalParameters);
  if (gl) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
	gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
	gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things
 }
  return gl;
}

function initShaders(gl, vShaderCode, fShaderCode)
{
	function compilationError(shader, shaderType)
	{
		// Check the compile status
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			// Something went wrong during compilation; 
			console.log("Error in compiling " + shaderType + " shader:" + 
				gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return true;
		}
		return false;
	}
	function linkError(p)
	{
		if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
			// something went wrong with the link
			var lastError = gl.getProgramInfoLog(p);
			console.log("Error in program linking:" + lastError);
			gl.deleteProgram(p);
			return true;
		}
		return false;			  
	}
	// 1. Create vertex shader , attach the source and compile
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vShaderCode);	
	gl.compileShader(vertexShader);
	if (compilationError(vertexShader, "VERTEX")) return null;

	// 2. Create fragment shader, attach the source and compile
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fShaderCode);
	gl.compileShader(fragmentShader);
	if (compilationError(fragmentShader, "FRAGMENT")) return null;

	 // 3. Create shader program, attach the shaders and link
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (linkError(program)) return null;
	return program;
}

function initBuffer(gl,attribArray) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attribArray), gl.STATIC_DRAW);
  return buffer;
}

function initElementsBuffer(gl,indexArray) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);  
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
  return buffer;
}

function bufferDraw(gl,drawMode,attributeSetter,nVertices,buffers)
{
	Object.keys(attributeSetter).forEach(function(attribName) {
		attributeSetter[attribName](buffers[attribName]);
    });
	if (buffers["index"]){
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers["index"]);
		gl.drawElements(gl[drawMode], nVertices, gl.UNSIGNED_SHORT, 0);
	}
	else{
		gl.drawArrays(gl[drawMode], 0, nVertices);	
	}
}
function deleteBuffers(gl,buffers){
	Object.keys(buffers).forEach(function(attribName) {
			gl.deleteBuffer(buffers[attribName]);
	});
}
function validData (A) {
	return (A.indexOf("NaN") >= 0);
}
function createBuffers (gl,meshData)
{
	var buffers={};
	Object.keys(meshData).forEach(function(name) {
		if(meshData[name]){
			if (!validData(meshData[name])){
				buffers[name] = (name == "index")?
					initElementsBuffer(gl, meshData[name]):
					initBuffer(gl, meshData[name]);
			}
			else console.log("Invalid "+ name+". Ex: There may be 'NaN' in data");
		}
    });
	return buffers;
}

function createTextureFrom2DImage(gl,textureFileName)
{
	function completeTexture(imgData)
	{
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgData);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);//gl.CLAMP_TO_EDGE
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);//gl.CLAMP_TO_EDGE
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	function isPowerOfTwo(x) {
		return (x & (x - 1)) == 0;
	}
	function nextHighestPowerOfTwo(x) {
		--x;
		for (var i = 1; i < 32; i <<= 1) {
			x = x | x >> i;
		}
		return x + 1;
	}
	
	if (textureFileName){
		//console.log(textureFileName);
		var tex=rendererGlobal.imageDictionary[textureFileName];
		if (tex) return tex;
		tex = gl.createTexture();
		rendererGlobal.imageDictionary[textureFileName] = tex;
		tex.width = 0; tex.height = 0;
		var img = new Image();
		rendererGlobal.imagecount++;
		img.onload = function(){
			//console.log("image loaded. Size: "+img.width+"x"+img.height);
			if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) {
				// Scale up the texture to the next highest power of two dimensions.
				var canvas = document.createElement("canvas");
				canvas.width = nextHighestPowerOfTwo(img.width);
				canvas.height = nextHighestPowerOfTwo(img.height);
				//console.log(canvas.width+"x"+canvas.height);
				var ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				img = canvas;
			}
			completeTexture(img);
			tex.complete = true;
			rendererGlobal.imagecount--; 
		};
		img.onerror = function() {
			console.log("ERROR: "+textureFileName+" does not exist or can not load.");
			rendererGlobal.imagecount--; 
		};
		img.src = textureFileName;
		return tex;
	}
	else {
		console.log("ERROR: Texture File does not exist.");
		return null;
	}
}

function parseJSON(jsonFile)
{
	var	xhttp = new XMLHttpRequest();
	xhttp.open("GET", jsonFile, false);
	xhttp.overrideMimeType("application/document");
	xhttp.send(null);	
	var Doc = xhttp.responseText;
	return JSON.parse(Doc);
}

function Bounds(min,max)
{
	this.min=[Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE];
	this.max=[-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE];
	if (min) this.min = [min[0],min[1],min[2]];
	if (max) this.max = [max[0],max[1],max[2]];
	this.center = function(){
		return [
			(this.min[0]+this.max[0])/2,
			(this.min[1]+this.max[1])/2,
			(this.min[2]+this.max[2])/2
		];
	};
	this.diagonal = function(){
		return Math.sqrt(
			(this.max[0]-this.min[0])*(this.max[0]-this.min[0])+
			(this.max[1]-this.min[1])*(this.max[1]-this.min[1])+
			(this.max[2]-this.min[2])*(this.max[2]-this.min[2])
		);
	};
	this.baseLength = function(){
			var length = this.max[0]-this.min[0];
			return (length<0)?0:length;
	};
	this.maxLength = function(){
			var length = Math.max(this.max[0]-this.min[0],this.max[1]-this.min[1],this.max[2]-this.min[2]);
			return (length<0)?0:length;
	};
	this.merge=function(b){
		var i;
		for (i=0; i<3; i++)this.min[i] = Math.min(this.min[i],b.min[i]);
		for (i=0; i<3; i++)this.max[i] = Math.max(this.max[i],b.max[i]);
	};
}
