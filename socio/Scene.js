var Scene = function(room){
    this.room = room;
    return this.initialise();
};
Scene.prototype.initialise = function(){
    
    this.camera();
    this.renderer();
    this.vr();
    this.room._scene = new THREE.Scene();
    this.lighting();
    this.room._scene.add(this.room.cameraDummy);
    this.renderQue = {};
 
    this.background();
    this.render(0);
    
    window.addEventListener('resize', this.resize.bind(this));
};
Scene.prototype.lighting = function(){
    
    var fr_light = new THREE.PointLight(0xFFFFFF);
    fr_light.position.y=500;
    fr_light.position.x=-100;
    fr_light.position.z=100;
    
    this.room._scene.add(fr_light);
    
    var bl_light = new THREE.PointLight(0xFFFFFF);
    bl_light.position.y=-500;
    bl_light.position.x=-100;
    bl_light.position.z=-100;
    
    this.room._scene.add(bl_light);
    
    this.light = new THREE.PointLight(0xFFFFFF);
    this.light.position.y=50;
    this.room._scene.add(this.light);
};
Scene.prototype.renderer = function(){
    this.room.renderer = new THREE.WebGLRenderer({antialias: false});
    this.room.renderer.setClearColor(0x000000, 0);
    this.room.renderer.setSize(window.innerWidth, window.innerHeight);
    this.room.renderer.setPixelRatio(window.devicePixelRatio);
    //var container = document.querySelector('body');
    //container.appendChild(this.room.renderer.domElement);
};

Scene.prototype.camera = function(){
    var aspect = window.innerWidth / window.innerHeight;
    this.room.camera = new THREE.PerspectiveCamera(75, aspect, 0.0001, 10000);
    this.room.camera.layers.enable(1);
    this.room.cameraDummy = new THREE.Object3D();
    this.room.cameraDummy.add(this.room.camera);
};

Scene.prototype.vr = function(){
    this.room.controls = new THREE.VRControls(this.room.camera);
    this.room.effect = new THREE.VREffect(this.room.renderer);
    // Disable eye separation.
    this.room.effect.scale = 0;
    this.room.effect.setSize(window.innerWidth, window.innerHeight);
    this.manager = new WebVRManager(this.room.renderer, this.room.effect, {predistorted: false});
};
var sceneRender;
Scene.prototype.render = function(time){
    if(!sceneRender)sceneRender = this;
    var renderQ = sceneRender.renderQue;
    for(var i in renderQ){
        if(renderQ[i]&&typeof renderQ[i].callback == "function"){
            renderQ[i].callback.call(renderQ[i].scope,time);
        }
    }
    
    sceneRender.room.controls.update();
    sceneRender.manager.render(sceneRender.room._scene,sceneRender.room.camera);
    requestAnimationFrame(sceneRender.render);
    TWEEN.update(time);
};

Scene.prototype.resize = function() {
  this.room.renderer.setSize(window.innerWidth, window.innerHeight);
  this.room.effect.setSize(window.innerWidth, window.innerHeight);
  this.room.camera.aspect = window.innerWidth / window.innerHeight;
  this.room.camera.updateProjectionMatrix();
};
Scene.prototype.background = function(){
    var that = this;
    var geometry = new THREE.SphereBufferGeometry( 4000, 64, 64 );
    geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load("assets/img/download.png", function(texture){
      var material = new THREE.MeshBasicMaterial( {
          map:texture
      });
      that.backgroundMesh = new THREE.Mesh( geometry, material );
      that.backgroundMesh.rotation.set(0,Math.PI,0);
      that.room._scene.add(that.backgroundMesh);
    },undefined,function(){console.log("error");});
    
    //if(this.backgroundShader.uniforms.resolution){
    //    this.backgroundShader.uniforms.resolution.value = new THREE.Vector2(1,1);
    //}
    //if(this.backgroundShader.uniforms.mouse){
    //    this.backgroundShader.uniforms.mouse.value = new THREE.Vector2(0,0);
    //}
    //this.renderQue.sceneBackground = {scope:this,callback:function(time){
    //  if(this.backgroundShader.uniforms.time){
    //      this.backgroundShader.uniforms.time.value = (time/1000)*0.2;
    //  }
    //  if(this.backgroundShader.uniforms.cameraPosition){
    //      //this.backgroundShader.uniforms.cameraPosition.value = (time/1000)*0.2;
    //  }
    //}};
};
Scene.prototype.backgroundShader = {
  "fragment": "precision highp float;\nprecision highp int;\nuniform vec2 resolution;\nuniform float time;\nvarying vec2 vUv;\nconst int max_iterations = 80;\nconst float stop_threshold = 0.001;\nconst float grad_step = 0.0001;\nconst float clip_far = 1000.0;\nconst float PI = 3.14159265358979323846264;\nconst float DEG_TO_RAD = PI / 180.0;\n\n// Equirectangular stuff==============================================================================\n\n\n/// Convert degrees to radians\nfloat deg2rad(in float deg)\n{\n  return deg * PI / 180.0;\n}\n\n/// Calculates the rotation matrix of a rotation around X axis with an angle in radians\nmat3 rotateAroundX( in float angle )\n{\n  float s = sin(angle);\n  float c = cos(angle);\n  return mat3(1.0,0.0,0.0,\n              0.0,  c, -s,\n              0.0,  s,  c);\n}\n\n// Calculates the rotation matrix of a rotation around Y axis with an angle in radians\nmat3 rotateAroundY( in float angle )\n{\n  float s = sin(angle);\n  float c = cos(angle);\n  return mat3(  c,0.0,  s,\n              0.0,1.0,0.0,\n               -s,0.0,  c);\n}\n\n// Calculates the rotation matrix of a rotation around Z axis with an angle in radians\nmat3 rotateAroundZ( in float angle )\n{\n  float s = sin(angle);\n  float c = cos(angle);\n  return mat3(  c, -s,0.0,\n                s,  c,0.0,\n              0.0,0.0,1.0);\n}\n\n// Calculate rotation by given yaw and pitch angles (in degrees!)\nmat3 rotationMatrix(in float yaw, in float pitch, in float roll)\n{\n  return rotateAroundZ(deg2rad(yaw)) *\n         rotateAroundY(deg2rad(-pitch)) *\n         rotateAroundX(deg2rad(roll));\n}\n\nfloat equirectangular_direction(out vec3 rd)\n{\n  vec2 uv = vUv.xy / resolution.xy;\n  \n  // Calculate azimuthal and polar angles from screen coordinates\n  float theta =  uv.t * PI,\n        phi =  uv.s * 2.0 * PI;\n        \n  // Calculate ray directions from polar and azimuthal angle\n  rd = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));\n  \n  // formulas are on wikipedia:\n  // https://en.wikipedia.org/wiki/Spherical_coordinate_system\t\n  return 1.0;\n}\nfloat direction(float roll, float pitch, float yaw, out vec3 rd)\n{\n  if (equirectangular_direction(rd) < 0.0)\n  {\n    return -1.0;\n  }\n  // Rotate the ray direction to have camera rotation with\n  // pitch, yaw and roll angles\n  rd *= rotateAroundZ(yaw)*rotateAroundY(pitch)*rotateAroundX(roll);\n  return 1.0;\n}\n\n\n// Equirectangular stuff==============================================================================\nfloat dist_field(vec3 p) \n{\n    p = mod(p, 8.0) - 4.0;\n    p = abs(p);\n    float cube = length(max(p - 1.0, 0.0));\n    float xd = max(p.y, p.z);\n    float yd = max(p.x, p.z);\n    float zd = max(p.x, p.y);\n    float beams = min(zd, min(xd, yd)) - 0.25;\n    return min(beams, cube);\n}\nvec3 shading(vec3 v, vec3 n, vec3 eye) \n{\n    vec3 light_pos = vec3(100.0 * cos(time * 0.2), 200.0 * sin(time * 0.4), 20.0);\n    vec3 light_color = vec3(0.2);\n    vec3 vl = normalize(light_pos - v);\n    float diffuse = abs(dot(vl, n));\n    return light_color * diffuse;\n}\nvec3 gradient(vec3 pos) \n{\n    const vec3 dx = vec3(grad_step, 0.0, 0.0);\n    const vec3 dy = vec3(0.0, grad_step, 0.0);\n    const vec3 dz = vec3(0.0, 0.0, grad_step);\n    return normalize(vec3(dist_field(pos + dx) - dist_field(pos - dx), dist_field(pos + dy) - dist_field(pos - dy), dist_field(pos + dz) - dist_field(pos - dz)));\n}\nfloat ray_marching(vec3 origin, vec3 dir, float start, float end) \n{\n    float depth = start;\n    for (int i = 0; i < max_iterations; i++) \n    {\n        float dist = dist_field(origin + dir * depth);\n        if (dist < stop_threshold) \n        {\n            return depth;\n        }\n         depth += dist;\n        if (depth >= end) \n        {\n            return end;\n        }\n     }\n    return end;\n}\nvec3 ray_dir(float fov, vec2 size, vec2 pos) \n{\n    vec2 xy = pos - size * 0.5;\n    float cot_half_fov = tan((90.0 - fov * 0.5) * DEG_TO_RAD);\n    float z = size.y * 0.5 * cot_half_fov;\n    return normalize(vec3(xy, -z));\n}\nmat3 rotationXY(vec2 angle) \n{\n    vec2 c = cos(angle);\n    vec2 s = sin(angle);\n    return mat3(c.y, 0.0, -s.y, s.y * s.x, c.x, c.y * s.x, s.y * c.x, -s.x, c.y * c.x);\n}\nvoid main() \n{\n    vec3 dir = ray_dir(35.0, resolution.xy, vUv.xy);\n     // Equirectangular stuff\n    float camera_yaw = PI*0.5;\n    float camera_pitch = PI*0.0;//yaxis;\n    float camera_roll = 0.0;//xaxis + PI * 2.0;\n    direction(camera_yaw,camera_pitch,camera_roll,dir);\n    vec3 eye = vec3(0.0, 0.0, 10.0);\n    mat3 rot = rotationXY(vec2(time * 0.13, time * 0.19));\n    eye.y = eye.x = 0.0;\n    float depth = ray_marching(eye, dir, 3.75, clip_far);\n    if (depth >= clip_far) \n    {\n        gl_FragColor = vec4(1.0);\n    }\n else \n    {\n        vec3 pos = eye + dir * depth;\n        vec3 n = gradient(pos);\n        gl_FragColor = vec4(shading(pos, n, eye), 1.0);\n        gl_FragColor += depth / clip_far * 12.0;\n    }\n}\n",
  "vertex": "/**\n* Example Vertex Shader\n* Sets the position of the vertex by setting gl_Position\n*/\n\n// Set the precision for data types used in this shader\nprecision highp float;\nprecision highp int;\n\n// \nattribute vec2 uv2;\n\n// Examples of variables passed from vertex to fragment shader\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec2 vUv2;\n\nvoid main() {\n\n    // To pass variables to the fragment shader, you assign them here in the\n    // main function. Traditionally you name the varying with vAttributeName\n    vNormal = normal;\n    vUv = uv;\n    vUv2 = uv2;\n    vPosition = position;\n\n    // This sets the position of the vertex in 3d space. The correct math is\n    // provided below to take into account camera and object data.\n    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n}",
  "uniforms": {
    "cameraPosition": {
      "name": "cameraPosition",
      "displayName": null,
      "type": "v3",
      "glslType": "vec3",
      "useGridHelper": false,
      "useRange": false,
      "range": null,
      "isRandom": false,
      "randomRange": null,
      "useToggle": false,
      "toggle": null,
      "description": ""
    },
    "time": {
      "name": "time",
      "displayName": null,
      "type": "f",
      "glslType": "float",
      "useGridHelper": false,
      "useRange": false,
      "range": null,
      "isRandom": false,
      "randomRange": null,
      "useToggle": false,
      "toggle": null,
      "description": ""
    },
    "resolution": {
      "name": "resolution",
      "displayName": null,
      "type": "v2",
      "glslType": "vec2",
      "useGridHelper": false,
      "useRange": false,
      "range": null,
      "isRandom": false,
      "randomRange": null,
      "useToggle": false,
      "toggle": null,
      "description": ""
    }
  }
};