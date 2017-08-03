var SelfieCamera = function(scope){
    this.scope = scope;
    var mirrorMaterial = new THREE.MeshBasicMaterial();
    var mirrorGeom =  new THREE.PlaneGeometry( 40, 30); 
    this.mirror = new THREE.Mesh( mirrorGeom, mirrorMaterial );
   // this.mirror.rotateX( - Math.PI / 2 );
    this.cubeCamera  = new THREE.CubeCamera( 0.001, 1000000000, 1280 );
    this.cubeCamera.layers.enable(1);
    this.cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
    mirrorMaterial.envMap = this.cubeCamera.renderTarget.texture;
    this.scope.scene.renderQue.mirror = {scope:this,callback:this.render};
    this.isOpen = false;
};
SelfieCamera.prototype.open = function(position){
    this.isOpen = true;
    this.mirror.position.copy(position);
    this.mirror.position.z-=15;
    this.mirror.position.x-=10;
    this.mirror.position.y+=2;
    this.mirror.lookAt(this.scope.cameraDummy.position);
    this.scope._scene.add(this.cubeCamera);
    this.scope._scene.add(this.mirror);
};
SelfieCamera.prototype.close = function(){
    this.isOpen = false;
    this.scope._scene.remove(this.cubeCamera);
    this.scope._scene.remove(this.mirror);
};
SelfieCamera.prototype.render = function(){
    this.mirror.visible = false;
    if(this.scope.sphere.sphereSpare)this.scope.sphere.sphereSpare.visible = true;
    this.cubeCamera.position.copy( this.mirror.position );
    this.cubeCamera.updateCubeMap( this.scope.renderer, this.scope._scene );
    if(this.scope.sphere.sphereSpare)this.scope.sphere.sphereSpare.visible = false;
    this.mirror.visible = true;
};