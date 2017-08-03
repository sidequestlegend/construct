var AirMouse = function(scope){
    this.scope = scope;
    var that = this;
    this.startPoint = new THREE.Vector3(20, -30, 0);
    this.endPoint = new THREE.Vector3(20, 0, -100);
    this.raycaster = new THREE.Raycaster();
    //this.mouse = new THREE.Vector2();
    this.extrudeBend = new THREE.CatmullRomCurve3([
        this.startPoint,
        new THREE.Vector3(20, 10, 0),
        this.endPoint
    ]);
    this.geometry= new THREE.TubeGeometry(this.extrudeBend, 100, 0.2, 24);
    this.mesh = new THREE.Mesh( this.geometry, new THREE.MeshLambertMaterial( { 
        color: 0xffffff
    }));
    //this.mesh.position.z=-90;
    //document.addEventListener("mousemove", function(event){
    //    that.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    //    that.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    //});
    this.scope.scene.renderQue.airmouse = {scope:this,callback:this.render};
    //this.scope.camera.add(this.mesh);
    var geoSph = new THREE.SphereGeometry(1, 10, 10);
    this.meshSph = new THREE.Mesh( geoSph, new THREE.MeshLambertMaterial( { 
        color: 0xffffff
    }));
    this.isEnabled = false;
};
AirMouse.prototype.enable = function(){
    this.isEnabled = true;
    this.scope.camera.add(this.meshSph);
    this.scope.camera.add(this.mesh);
};

AirMouse.prototype.disable = function(){
    this.scope.camera.remove(this.meshSph);
    this.scope.camera.remove(this.mesh);
    this.isEnabled = false;
};

AirMouse.prototype.render = function(time){
    var vector = this.startPoint.clone().unproject( this.scope.camera );
    var direction = new THREE.Vector3( 0, 0, -1 ).transformDirection( this.scope.camera.matrixWorld );
    this.raycaster.set( vector, direction );
    var intersects = this.raycaster.intersectObjects( this.scope._scene.children );
	if(intersects.length){
       this.endPoint=intersects[ 0 ].point;
	}
    
    this.meshSph.position.copy(this.endPoint);
    this.extrudeBend = new THREE.CatmullRomCurve3([
        this.startPoint,
        new THREE.Vector3(20, 10, 0),
        this.endPoint
    ]);
    this.mesh.geometry.dynamic = true;
    this.mesh.geometry=new THREE.TubeGeometry(this.extrudeBend, 100, 0.4, 24);
    this.mesh.geometry.verticesNeedUpdate = true;
};