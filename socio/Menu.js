var Menu = function(room){
    this.room = room;
    this.type="bottom";
    this.buttons=[];
    this.reticle(this.room.camera);
    this.buttonsGroup = new THREE.Group();
    this.MENU_ACTION_CONTENT = 1;
    this.MENU_ACTION_CAMERA = 2;
    this.MENU_ACTION_REMOTE = 3;
    this.MENU_ACTION_MUTE = 4;
    this.createButton(2,"assets/img/ic_launcher_home.png",this.MENU_ACTION_CONTENT);
    this.createButton(2,"assets/img/ic_launcher_camera.png",this.MENU_ACTION_CAMERA);
    this.createButton(2,"assets/img/ic_launcher_remote.png",this.MENU_ACTION_REMOTE);
    this.createButton(2,"assets/img/ic_launcher_audio_off.png",this.MENU_ACTION_MUTE);
    this.room.camera.add(this.buttonsGroup);
    this.setBottomMenu();
    this.room.scene.renderQue.menu = {scope:this,callback:this.render};
    window.addEventListener('mouseup', this.action.bind(this));
};
Menu.prototype.render = function(){
     if(this.type=="bottom"){
        this.fadeBottomButtons(this.room.camera);
    }else{
        this.fadeArmButtons();
    }
};
Menu.prototype.action = function(){
  if(this.active){
      switch(this.active){
          case this.MENU_ACTION_CONTENT:
            if(this.room.content.isOpen){
                this.room.content.close();
            }else{
                this.room.content.open();
            }
            break;
          case this.MENU_ACTION_CAMERA:
            if(this.room.selfieCamera.isOpen){
                this.room.selfieCamera.close();
            }else{
                this.room.selfieCamera.open(this.room.camera.position);
            }
            break;
          case this.MENU_ACTION_REMOTE:
            if(this.room.airmouse.isEnabled){
                this.room.airmouse.disable();
            }else{
                this.room.airmouse.enable();
            }
            break;
          case this.MENU_ACTION_MUTE:
            
            break;
      }
  }
};
Menu.prototype.setBottomMenu = function(){
    var that = this;
    this.room.camera.remove(this.buttonsGroup);
    this.room.cameraDummy.add(this.buttonsGroup);
    this.buttonsGroup.rotation.set(0,0,0);
    this.buttonsGroup.position.set(0,0,0);
    this.buttons.forEach(function(button,i){
        button.rotation.set(-Math.PI/2,0,0);
        var angle = (360*(i/10))+220;
        button.position.y = -10;
        button.position.z = 3.8*Math.sin(angle*Math.PI/180);
        button.position.x = 3.8*Math.cos(angle*Math.PI/180);
        button.lookAt(that.room.camera.position);
        that.setOpacity(button, 0);
    });
    this.type="bottom";
};
Menu.prototype.setArmMenu = function(){
    this.room.cameraDummy.remove(this.buttonsGroup);
    this.room.camera.add(this.buttonsGroup);
    if(!(this.room.multiplayer.hands.leftArmMesh)){
        if(!(this.room.camera.armMeshes))this.room.camera.armMeshes = [];
        this.room.multiplayer.hands.leftArmMesh = this.room.camera.armMeshes [ 0 ] || this.room.multiplayer.hands.addBoneMesh( this.room.camera.armMeshes );
        this.room.multiplayer.hands.leftArmMesh.rotation.z=-Math.PI;
    }
    var that = this;
    this.buttons.forEach(function(button,i){
        button.rotation.set(0,0,0);
        button.position.y = 0;
        button.position.z = (3*i)-25;
        button.position.x = -9;
        button.rotation.set(Math.PI/2,0,0);
        that.setOpacity(button, 0);
    });
    this.type="arm";
};

Menu.prototype.createButton = function(width, image, action) {
  var innerGeometry = new THREE.CircleGeometry(width/2, 32);

  var innerMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff, side: THREE.DoubleSide, transparent: true,
    opacity: 1
  });
  if(image&&image!="0"){
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(image, function(texture){
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      innerMaterial.map = texture;
      innerMaterial.map.needsUpdate = true;
      innerMaterial.needsUpdate = true;
    });
  }
  var inner = new THREE.Mesh(innerGeometry, innerMaterial);
  inner.name = 'inner';
  var outerMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000, side: THREE.DoubleSide, transparent: true,
    opacity: 1
  });
  var outerGeometry = new THREE.RingGeometry(width/2 * 0.85, width/2, 32);
  var outer = new THREE.Mesh(outerGeometry, outerMaterial);
  outer.name = 'outer';
    outer.position.z=1;
  var button = new THREE.Object3D();
  button.action = action;
  button.add(inner);
  button.add(outer);

    this.buttons.push(button);
    this.buttonsGroup.add(button);
  return button;
};


Menu.prototype.fadeArmButtons = function() {
  var that = this;
  var angleDeg = 180+THREE.Math.radToDeg(this.room.multiplayer.hands.leftArmMesh.rotation.z);
    var opacity;
    if (angleDeg < 0) {
      opacity = 0;
    } else if (angleDeg > 180) {
      opacity = 0;
    } else if (angleDeg > 90) {
      opacity = 1;
    } else {
      // We are in the case START < angle < END. Linearly interpolate.
      var range = 60;
      var value = angleDeg;
      opacity = value / range;
    }
  this.buttons.forEach(function(button){
    
    that.setOpacity(button, opacity);
  });
};

Menu.prototype.fadeBottomButtons = function(camera) {
  var lookAt = new THREE.Vector3(0, 0, 1);
  lookAt.applyQuaternion(camera.quaternion);
  var that = this;
  this.buttons.forEach(function(button){
    var angle = button.position.angleTo(lookAt);
    var angleDeg = THREE.Math.radToDeg(angle);
    var opacity;
    angleDeg = 210-angleDeg;
    if (angleDeg < 35) {
      opacity = 1;
      button.children[0].material.shininess=50;
      that.active = button.action;
    } else if (angleDeg > 60) {
      button.children[0].material.shininess=0;
      that.active = undefined;
      opacity = 0;
    } else {
      // We are in the case START < angle < END. Linearly interpolate.
      var range = 60 - 30;
      var value = 60 - angleDeg;
      opacity = value / range;
    }
    that.setOpacity(button, opacity);
  });
};

Menu.prototype.reticle = function(camera){
  var geometry = new THREE.TorusGeometry(0.01, 0.005, 10, 20);
  var material = new THREE.MeshPhongMaterial({color: 0x000000});
  var reticle = new THREE.Mesh(geometry, material);
  reticle.position.z = -1;
  camera.add(reticle);
};

Menu.prototype.setOpacity = function(button, opacity) {
  var outer = button.getObjectByName('outer');
  var inner = button.getObjectByName('inner');

  outer.material.opacity = opacity * 0.5;
  inner.material.opacity = opacity * 0.8;
};