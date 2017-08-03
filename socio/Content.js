var Content = function(scope){
    this.scope = scope;
    var geometry =  new THREE.SphereGeometry(1, 10, 10);
    geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
    // materials
    materials = [
        new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.8}),
        new THREE.MeshBasicMaterial( { transparent: true, opacity: 0 } )
    ];
    
    // assign material to each face
    for( var i = 0; i < geometry.faces.length; i++ ) {
        if(/*(i>49&&i<54)||*//*(i>59&&i<69)||*//*(i>69&&i<74)||*/(i>81&&i<88)||/*(i>89&&i<94)||*/(i>101&&i<108)){
            geometry.faces[ i ].materialIndex = 0;
        }else{
            geometry.faces[ i ].materialIndex = 1;
        }
    }
    
    var material = new THREE.MeshFaceMaterial( materials ); //;//{side:THREE.BackSide}
    this.menuSphere = new THREE.Mesh(geometry, material);
    this.menuSphere.position.x = 60;
  this.isOpen = false;
};

Content.prototype.open = function(){
     
  this.isOpen = true;
    this.scope._scene.add(this.menuSphere);
    this.menuSphere.scale.set(0,0,0);
    new TWEEN.Tween(this.menuSphere.scale)
    .to({ x: 10, y: 10, z: 10 }, 1000)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        //console.log(this.x, this.y);
    })
    .start();
};

Content.prototype.close = function(){
  this.isOpen = false;
  var that = this;
   new TWEEN.Tween(this.menuSphere.scale)
    .to({ x: 0, y: 0, z: 0 }, 750)
    .easing(TWEEN.Easing.Quadratic.In)
    .onComplete(function() {
        that.scope._scene.remove(this.menuSphere);
    })
    .start();
  
};