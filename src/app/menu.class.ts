
import {Setup} from "./setup.class";
/**
 * Created by autoc on 03/06/2017.
 */
declare var THREE:any;
export class Menu{
    setup:Setup;
    buttons;
    buttonsGroup;
    active;
    type;
    MENU_ACTION_CONTENT=1;
    MENU_ACTION_CAMERA=2;
    MENU_ACTION_REMOTE=3;
    MENU_ACTION_MUTE=4;
    constructor(setup:Setup){
        this.setup = setup;
        this.buttons = [];
        this.buttonsGroup = new THREE.Group();
        this.type = "bottom";
        this.createButton(2,"assets/icons/ic_launcher_home.png",this.MENU_ACTION_CONTENT);
        this.createButton(2,"assets/icons/ic_launcher_camera.png",this.MENU_ACTION_CAMERA);
        this.createButton(2,"assets/icons/ic_launcher_remote.png",this.MENU_ACTION_REMOTE);
        this.createButton(2,"assets/icons/ic_launcher_audio_off.png",this.MENU_ACTION_MUTE);
        //this.room.camera.add(this.buttonsGroup);

        this.setBottomMenu();
    }

    createButton(width, image, action) {
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
        button.add(inner);
        button.add(outer);

        this.buttons.push({button:button,action:action});
        this.buttonsGroup.add(button);
        return button;
    }
    setBottomMenu(){
    var that = this;
     this.setup.camera.remove(this.buttonsGroup);
     this.setup.cameraDummy.add(this.buttonsGroup);
    this.buttonsGroup.rotation.set(0,0,0);
    this.buttonsGroup.position.set(0,0,0);
    this.buttons.forEach(function(button,i){
        button.button.rotation.set(-Math.PI/2,0,0);
        var angle = (360*(i/10))+220;
        button.button.position.y = -10;
        button.button.position.z = 3.8*Math.sin(angle*Math.PI/180);
        button.button.position.x = 3.8*Math.cos(angle*Math.PI/180);
      //  button.lookAt(that.room.camera.position);
        that.setOpacity(button.button, 0);
    });
    this.type="bottom";
};
    setArmMenu(){
    this.setup.cameraDummy.remove(this.buttonsGroup);
    this.setup.camera.add(this.buttonsGroup);
    // if(!(this.setup.multiplayer.hands.leftArmMesh)){
    //     if(!(this.setup.camera.armMeshes))this.room.camera.armMeshes = [];
    //     this.setup.multiplayer.hands.leftArmMesh = this.room.camera.armMeshes [ 0 ] || this.room.multiplayer.hands.addBoneMesh( this.room.camera.armMeshes );
    //     this.setup.multiplayer.hands.leftArmMesh.rotation.z=-Math.PI;
    // }
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


    fadeArmButtons() {
        var that = this;
        var angleDeg = 180/*+Math.radToDeg(this.room.multiplayer.hands.leftArmMesh.rotation.z)*/;
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
    setOpacity(button, opacity) {
        var outer = button.getObjectByName('outer');
        var inner = button.getObjectByName('inner');

        outer.material.opacity = opacity * 0.5;
        inner.material.opacity = opacity * 0.8;
    };

    fadeBottomButtons(camera) {
        var lookAt = new THREE.Vector3(0, 0, 1);
        lookAt.applyQuaternion(camera.quaternion);
        var that = this;
        this.buttons.forEach(function(button){
            var angle = button.button.position.angleTo(lookAt);
            var angleDeg = THREE.Math.radToDeg(angle);
            var opacity;
            angleDeg = 210-angleDeg;
            if (angleDeg < 35) {
                opacity = 1;
                button.button.children[0].material.shininess=50;
                that.active = button.action;
            } else if (angleDeg > 60) {
                button.button.children[0].material.shininess=0;
                that.active = undefined;
                opacity = 0;
            } else {
                // We are in the case START < angle < END. Linearly interpolate.
                var range = 60 - 30;
                var value = 60 - angleDeg;
                opacity = value / range;
            }
            that.setOpacity(button.button, opacity);
        });
    };
    action() {
        if (this.active) {
            switch (this.active) {
                case this.MENU_ACTION_CONTENT:
                    // if(this.room.content.isOpen){
                    //     this.room.content.close();
                    // }else{
                    //     this.room.content.open();
                    // }
                    break;
                case this.MENU_ACTION_CAMERA:
                    // if(this.room.selfieCamera.isOpen){
                    //     this.room.selfieCamera.close();
                    // }else{
                    //     this.room.selfieCamera.open(this.room.camera.position);
                    // }
                    break;
                case this.MENU_ACTION_REMOTE:
                    // if(this.room.airmouse.isEnabled){
                    //     this.room.airmouse.disable();
                    // }else{
                    //     this.room.airmouse.enable();
                    // }
                    break;
                case this.MENU_ACTION_MUTE:

                    break;
            }
        }
    }
    render(){
        if(this.type=="bottom"){
            this.fadeBottomButtons(this.setup.camera);
        }else{
            this.fadeArmButtons();
        }
    };
}