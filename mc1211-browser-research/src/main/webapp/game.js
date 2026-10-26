"use strict";

(() => {
  const canvas = document.querySelector("#game");
  const status = document.querySelector("#status");
  const positionLabel = document.querySelector("#position");
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  if (!gl) {
    status.textContent = "ERROR: WebGL 2 is unavailable in this browser.";
    status.style.color = "#ff9a9a";
    return;
  }

  const vertexShader = `#version 300 es
    in vec3 aPosition;
    in vec3 aColor;
    uniform mat4 uProjection;
    uniform mat4 uView;
    out vec3 vColor;
    void main() {
      gl_Position = uProjection * uView * vec4(aPosition, 1.0);
      vColor = aColor;
    }`;

  const fragmentShader = `#version 300 es
    precision highp float;
    in vec3 vColor;
    out vec4 outColor;
    void main() {
      outColor = vec4(vColor, 1.0);
    }`;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || "Shader compilation failed");
    }
    return shader;
  }

  function createProgram(vsSource, fsSource) {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
    }
    return program;
  }

  let program;
  try {
    program = createProgram(vertexShader, fragmentShader);
  } catch (error) {
    status.textContent = "Renderer error: " + error.message;
    status.style.color = "#ff9a9a";
    return;
  }

  const loc = {
    position: gl.getAttribLocation(program, "aPosition"),
    color: gl.getAttribLocation(program, "aColor"),
    projection: gl.getUniformLocation(program, "uProjection"),
    view: gl.getUniformLocation(program, "uView")
  };

  // Each face uses two triangles. Colors are placeholders for block textures.
  const faces = [
    { n:[0,1,0], c:[0.32,0.72,0.29], v:[[0,1,0],[0,1,1],[1,1,1],[0,1,0],[1,1,1],[1,1,0]] },
    { n:[0,-1,0], c:[0.39,0.27,0.19], v:[[0,0,0],[1,0,0],[1,0,1],[0,0,0],[1,0,1],[0,0,1]] },
    { n:[0,0,1], c:[0.40,0.56,0.25], v:[[0,0,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1],[0,1,1]] },
    { n:[0,0,-1], c:[0.34,0.47,0.22], v:[[1,0,0],[0,0,0],[0,1,0],[1,0,0],[0,1,0],[1,1,0]] },
    { n:[1,0,0], c:[0.38,0.51,0.24], v:[[1,0,1],[1,0,0],[1,1,0],[1,0,1],[1,1,0],[1,1,1]] },
    { n:[-1,0,0], c:[0.29,0.43,0.21], v:[[0,0,0],[0,0,1],[0,1,1],[0,0,0],[0,1,1],[0,1,0]] }
  ];

  const terrain = new Map();
  const key = (x,y,z) => `${x},${y},${z}`;
  const heightAt = (x,z) =>
    2 + Math.floor(
      (Math.sin(x * 0.43) + Math.cos(z * 0.37) +
       Math.sin((x + z) * 0.21)) * 1.25 + 1
    );

  for (let x = -20; x < 20; x++) {
    for (let z = -20; z < 20; z++) {
      const top = Math.max(1, heightAt(x,z));
      for (let y = 0; y < top; y++) terrain.set(key(x,y,z), {x,y,z,top});
    }
  }

  const vertices = [];
  for (const block of terrain.values()) {
    for (const face of faces) {
      const [nx,ny,nz] = face.n;
      if (terrain.has(key(block.x+nx, block.y+ny, block.z+nz))) continue;

      let color = face.c;
      if (ny === 1 && block.top > 4) color = [0.34,0.66,0.30];
      for (const p of face.v) {
        vertices.push(
          block.x + p[0], block.y + p[1], block.z + p[2],
          color[0], color[1], color[2]
        );
      }
    }
  }

  const vertexArray = new Float32Array(vertices);
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc.position);
  gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(loc.color);
  gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, 24, 12);
  gl.bindVertexArray(null);

  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1,
      0,0,(2*far*near)*nf,0
    ]);
  }

  function viewMatrix(eye, yaw, pitch) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const fx = -sy * cp, fy = sp, fz = -cy * cp;
    const rx = cy, ry = 0, rz = -sy;
    const ux = sy * sp, uy = cp, uz = cy * sp;
    return new Float32Array([
      rx, ux, -fx, 0,
      ry, uy, -fy, 0,
      rz, uz, -fz, 0,
      -(rx*eye[0]+ry*eye[1]+rz*eye[2]),
      -(ux*eye[0]+uy*eye[1]+uz*eye[2]),
      fx*eye[0]+fy*eye[1]+fz*eye[2], 1
    ]);
  }

  const camera = { x: 0, y: 8, z: 12, yaw: 0, pitch: -0.25 };
  const keys = new Set();
  let lastTime = 0;

  window.addEventListener("keydown", e => {
    keys.add(e.code);
    if (["Space","ArrowUp","ArrowDown"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());

  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
  });
  document.addEventListener("mousemove", e => {
    if (document.pointerLockElement !== canvas) return;
    camera.yaw -= e.movementX * 0.0025;
    camera.pitch -= e.movementY * 0.0025;
    camera.pitch = Math.max(-1.52, Math.min(1.52, camera.pitch));
  });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resize);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0.43, 0.69, 0.91, 1);
  status.textContent = `WebGL 2 ready · ${terrain.size.toLocaleString()} terrain blocks`;

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.05);
    lastTime = now;

    const speed = (keys.has("ShiftLeft") || keys.has("ShiftRight")) ? 9 : 5;
    const forward = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
    const side = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
    camera.x += (side * Math.cos(camera.yaw) - forward * Math.sin(camera.yaw)) * speed * dt;
    camera.z += (side * -Math.sin(camera.yaw) - forward * Math.cos(camera.yaw)) * speed * dt;
    if (keys.has("Space")) camera.y += speed * dt;
    if (keys.has("ControlLeft") || keys.has("ControlRight")) camera.y -= speed * dt;

    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniformMatrix4fv(loc.projection, false,
      perspective(Math.PI/3, canvas.width/canvas.height, 0.1, 160));
    gl.uniformMatrix4fv(loc.view, false,
      viewMatrix([camera.x,camera.y,camera.z],camera.yaw,camera.pitch));
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, vertexArray.length / 6);
    gl.bindVertexArray(null);

    positionLabel.textContent =
      `${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}, ${camera.z.toFixed(1)}`;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
