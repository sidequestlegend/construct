var Eyes = {
  LEFT: 1,
  RIGHT: 2
};
var Sphere = function(scene){
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
};
Sphere.prototype.setPhoto = function(src,options) {
    var loader = new THREE.TextureLoader();
    this.options = options;
    this.isStereo = options?options.isStereo||false:false;
    this.needsUpdate=true;
    loader.crossOrigin = 'anonymous';
    loader.load(src, this.updateTexture.bind(this),undefined,function(){console.log("error");});
};
Sphere.prototype.setupVideo = function(){
    this.videoElement = document.createElement('video');
    this.videoTexture = new THREE.VideoTexture(this.videoElement);
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.format = THREE.RGBFormat;
    videoTexture.generateMipmaps = false;
    this.videoIsSetup=true;
};
Sphere.prototype.setVideoFrame = function(options) {
    if(!(this.videoIsSetup)){
        this.setupVideo();
    }
    this.needsUpdate=true;
    this.isStereo = options.isStereo;
    this.updateTexture(this.videoTexture);
};

Sphere.prototype.updateTexture = function(texture) {
    var sphereLeft,sphereRight,sphereSpare;
    if(this.needsUpdate){
        if(this.sphereLeft){
            this.group.remove(this.sphereLeft);
        }
        if(this.sphereRight){
            this.group.remove(this.sphereLeft);
        }
        sphereLeft = this.createSphere({eye:Eyes.LEFT});
        sphereRight = this.createSphere({eye:Eyes.RIGHT,resetUpdateFlag:true});
    }else{
        sphereLeft = (this.sphereLeft)?this.sphereLeft:this.createSphere({eye:Eyes.LEFT});
        sphereRight = (this.sphereRight)?this.sphereRight:this.createSphere({eye:Eyes.RIGHT,resetUpdateFlag:true});
    }
    if(this.sphereSpare){
        this.group.remove(this.sphereSpare);
    }
    sphereSpare = this.createSphere({},true);
    var leftTexture = texture.clone();
    var rightTexture = texture.clone();
    rightTexture.wrapS = rightTexture.wrapT = leftTexture.wrapS = leftTexture.wrapT = THREE.RepeatWrapping;
    if (this.isStereo){
        leftTexture.repeat.set(1, 0.5);
        rightTexture.repeat.set(1,0.5);
        leftTexture.offset.set(0,0.5);
    }else{
        leftTexture.repeat.set(1, 1);
        leftTexture.offset.set(0, 0);
    }
    sphereLeft.material.map = leftTexture;
    sphereSpare.material.map = leftTexture;
    sphereRight.material.map = rightTexture;
    leftTexture.needsUpdate=rightTexture.needsUpdate=sphereSpare.material.needsUpdate=sphereLeft.material.needsUpdate=sphereRight.material.needsUpdate=true;
    this.sphereLeft = sphereLeft;
    this.sphereRight = sphereRight;
    this.sphereSpare = sphereSpare;
    if(this.callback&&typeof this.callback == "function"){
        this.callback.call(this);
    }
};
Sphere.prototype.createSphere = function(options,isSpare) {
    var geometry = new THREE.SphereGeometry(isSpare?2000:1000, 48, 48, 0, Math.PI * 2, 0, Math.PI);
    geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
    var material = new THREE.MeshBasicMaterial();//{side:THREE.DoubleSide}
    var sphere = new THREE.Mesh(geometry, material);
    if(!isSpare){
      sphere.layers.set(options.eye);
      sphere.eye = options.eye;
    }else{
      sphere.visible=false;
    }
    this.group.add(sphere);
    if(options.resetUpdateFlag){
        this.needsUpdate = false;
    }
    return sphere;
};