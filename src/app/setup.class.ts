
import {Reticle} from "./reticle.class";
/**
 * Created by autoc on 29/05/2017.
 */
declare let webvrui,THREE,module,exports;

import {Skybox} from "./skybox.class";
import {VNC} from "./vnc.class";
import {Menu} from "./menu.class";
import {Mirror} from "./mirror.class";
import {People} from "./people.class";


export class Setup{
    scene;
    camera;
    cameraDummy;
    renderer;
    manager;
    controls;
    effect;
    vrButton;
    vrDisplay;
    light;
    canvas;
    // rfb;
    // vnc;
    skybox;
    menu;
    selfie_camera;
    reticle;
    people;
    group;
    skeleton;
    constructor(){
        this.setupSceneAndCamera();
        this.setupLighting();
        this.skybox = new Skybox(this,'/assets/picture/paris.jpg');
        this.menu = new Menu(this);
        this.selfie_camera = new Mirror(this);
        //this.vnc = new VNC(this);
        this.reticle = new Reticle(this.camera);
        this.people = new People(this);
        this.setupTerrainAndMountains();
        //this.setupSpinningRings();
        this.scene.fog = new THREE.Fog(0xffffff, 0.015, 1000);
        window.addEventListener("resize",this.windowResize.bind(this));
         this.setupWebVR()
             .then(()=>{
                this.people.setMe("Shane","assets/avatars/2.png");
                //this.vnc.addVNC('192.168.0.8','8080','Slomosha1','websockify');
        
                  this.selfie_camera.open(this.camera.position);
                  this.selfie_camera.mirror.lookAt(this.cameraDummy.position);
                
                 //var loader = new THREE.ColladaLoader();
                 //loader.options.convertUpAxis = true;
                 //loader.load( '/assets/models/CasteliaCity.dae', ( collada ) =>{
                 //    var object = collada.scene;
                 //    //object.scale.set( 0.0025, 0.0025, 0.0025 );
                 //    //object.position.set( - 2, 0.2, 0 );
                 //    this.scene.add( object );
                 //} );
        
        
            });
    }
    setupSpinningRings(){
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.group.position.y=50;
        this.group.position.z=-100;
        this.group.scale.set(0.25,0.25,0.25);
        var geometry = new THREE.RingGeometry(20,22,32,32);
        var textureLoader = new THREE.TextureLoader();
        var material = new THREE.MeshPhongMaterial( {
            shininess: 0.99,
            emissive:0x000000,
            reflectivity: 0.99,
            map: textureLoader.load( "/assets/picture/map.png" ),
            emissiveMap: textureLoader.load( "/assets/picture/emissive.png" )
        } );
        var torus = new THREE.Mesh(geometry,material);


        // map.magFilter = THREE.NearestFilter;
        torus.material.emissiveMap.wrapS = THREE.RepeatWrapping;
        torus.material.emissiveMap.repeat.x = 2;

        for ( var i = 0; i < 10; i ++ ) {

            var clone = torus.clone();
            clone.geometry = new THREE.TorusGeometry( i * 10 + 20, 5, 32, 64 );
            clone.material = torus.material.clone();
            this.group.add( clone );

        }
    }
    renderSpinningRings(time){

        var children = this.group.children;

        for ( var i = 0; i < children.length; i ++ ) {

            var child = children[ i ];

            child.position.x = Math.sin( time - i * 0.15 ) * 50;
            child.position.y = Math.sin( time * 1.3 - i * 0.15 ) * 50;
            child.rotation.x = time * 2.123 - Math.pow( i, 1.15 ) * 0.15;
            child.rotation.y = time * 3 - Math.pow( i, 1.15 ) * 0.15;
            child.material.emissive.r = Math.max( 0, Math.sin( - time * 5 + i * 0.2 ) ) * 0.5;
            child.material.emissive.b = Math.pow( child.material.emissive.r * 2, 6 );

        }

    }
    setupTerrainAndMountains(){
        var geometry = new THREE.PlaneGeometry(1000,1000,100,100);
        var textureLoader = new THREE.TextureLoader();
        var material = new THREE.MeshPhongMaterial( {
             //color: 0x222923,
            // specular: 0x222923,
            // shininess: 35,
            map: textureLoader.load( "/assets/textures/rough-cobblestones/brick_floor_tileable_Base_Color.jpg" ),
            displacementMap: textureLoader.load( "/assets/textures/rough-cobblestones/brick_floor_tileable_Displacement.jpg" ),
            normalMap: textureLoader.load( "/assets/textures/rough-cobblestones/brick_floor_tileable_Normal.jpg" ),
            //specularMap: textureLoader.load( "/assets/textures/rough-cobblestones/brick_floor_tileable_Ambient_Occlusion.jpg" ),//
            normalScale: new THREE.Vector2( 0.8, 0.8 )
        } );
        material.map.wrapS = material.map.wrapT = material.displacementMap.wrapS = material.displacementMap.wrapT = material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        material.map.needsUpdate=true;
        material.displacementMap.needsUpdate=true;
        material.normalMap.needsUpdate=true;
        material.map.repeat.set(10,10);
        material.displacementMap.repeat.set(10,10);
        material.normalMap.repeat.set(10,10);

        var geo = geometry;
        geo.vertices.forEach(function(vert,i){
            if(Math.abs(vert.y)>300||Math.abs(vert.x)>300){
                //geo.vertices[i].z -= 20;
            }
        });

        geo.computeVertexNormals();
        geo.computeFaceNormals();

        geo.verticesNeedUpdate = true;
        geo.normalsNeedUpdate = true;
        //
        // var
        //
        // newx = distance * Math.cos(direction) + x
        // newy = distance * Math.sin(direction) + y


        var plane = new THREE.Mesh(geometry,material);
        plane.position.y=-15;
        plane.rotation.x=Math.PI+(Math.PI/2);
        this.scene.add(plane);

        material = new THREE.MeshPhongMaterial( {
            color: 0x020403
        });
        var nClusters= 60,nPerCluster= 8,heightMin = 10,heightMax = 80,radiusBottomMin=10,radiusBottomMax=30,mountainRadius = 300;
        for(var i = 0; i < nClusters; i++ ){
            var angle	= (i / nClusters) * (Math.PI*2);
            for(var j = 0; j < nPerCluster; j++){
                var deltaAngle	= THREE.Math.randFloatSpread(2/nClusters) * (Math.PI*2);
                var height	= THREE.Math.randFloat( heightMin, heightMax );
                var radiusBottom= THREE.Math.randFloat( radiusBottomMin, radiusBottomMax );
                var geom = new THREE.Geometry();
                var v1 = new THREE.Vector3(0,0,0);
                var v2 = new THREE.Vector3(radiusBottom*2,0,0);
                var v3 = new THREE.Vector3(radiusBottom,height,0);

                geom.vertices.push(v1);
                geom.vertices.push(v2);
                geom.vertices.push(v3);
                geom.faces.push( new THREE.Face3( 0, 1, 2 ) );
                geom.computeFaceNormals();
                var mesh	= new THREE.Mesh(geom, material);
                mesh.position.y	= -15;
                mesh.position.x	= (mountainRadius+Math.random()*20) * Math.cos(angle + deltaAngle);
                mesh.position.z	= (mountainRadius+Math.random()*20) * Math.sin(angle + deltaAngle);
                mesh.lookAt(this.scene.position);
                this.scene.add(mesh);
            }
        }
    }
    setupSceneAndCamera(){

        this.scene = new THREE.Scene();
        // this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
        // //this.camera.position.z=200;
        // this.camera.lookAt(new THREE.Vector3(0,0,0));
        // this.renderer = new THREE.WebGLRenderer();
        // this.renderer.setSize(window.innerWidth,window.innerHeight);
        // this.canvas = document.createElement('canvas');
        // document.body.appendChild(this.renderer.domElement);
        // window.addEventListener( 'resize', this.windowResize.bind(this), false );
        // return this.renderer.domElement;
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.cameraDummy = new THREE.Object3D();
        this.cameraDummy.add(this.camera);
        this.scene.add(this.cameraDummy);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.canvas = document.createElement('canvas');

        document.body.appendChild(this.renderer.domElement);

    }
    setupLighting(){

        var fr_light = new THREE.PointLight(0xFFFFFF);
        fr_light.position.y=500;
        fr_light.position.x=-100;
        fr_light.position.z=100;

        this.scene.add(fr_light);

        var bl_light = new THREE.PointLight(0xFFFFFF);
        bl_light.position.y=-500;
        bl_light.position.x=-100;
        bl_light.position.z=-100;

        this.scene.add(bl_light);

        this.light = new THREE.PointLight(0xFFFFFF);
        this.light.position.y=50;
        this.scene.add(this.light);
    };
    setupWebVR(){
        this.controls = new THREE.VRControls(this.camera);
        this.controls.standing = true;
        this.camera.position.y = this.controls.userHeight;
        this.camera.layers.enable(1);
        this.effect = new THREE.VREffect(this.renderer);
        this.effect.setSize(window.innerWidth, window.innerHeight);
        //mesh.rotation.y += Math.PI;
        this.vrButton = new webvrui.EnterVRButton(this.renderer.domElement, {
            color: 'black',
            background: 'white',
            corners: 'square'
        });
        this.vrButton.on('exit', ()=> {
            this.camera.quaternion.set(0, 0, 0, 1);
            this.camera.position.set(0, this.controls.userHeight, 0);
        });
        this.vrButton.on('hide', ()=> {
            document.getElementById('ui').style.display = 'none';
        });
        this.vrButton.on('show', ()=> {
            document.getElementById('ui').style.display = 'inherit';
        });
        //this.manager = new WebVRManager(this.renderer, this.effect, {predistorted: false});
        document.getElementById('vr-button').appendChild(this.vrButton.domElement);
        document.getElementById('magic-window').addEventListener('click', ()=> {
            this.vrButton.requestEnterFullscreen();
        });
        return navigator.getVRDisplays().then((displays)=> {
            if (displays.length > 0) {
                this.vrDisplay = displays[0];
                this.vrDisplay.requestAnimationFrame(this.animate.bind(this));
            }
        });
    }
    animate(time) {
        //mesh.rotation.y += 0.0005;
        // if(document.body.className == 'is_running'){
        //     texture.needsUpdate = true;
        // }
        //if (this.vrButton.isPresenting()) {
        this.vrDisplay.requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        //}
        this.menu.render();
        // if(altspace&&altspace.getThreeJSRenderer) {
        //     this.waitForJoint('Head','Center')
        //         .then((joint:any)=>{
        //             this.menu.menu_system.quaternion.copy(joint.quaternion);
        //             this.menu.menu_system.rotation.z=-Math.PI;
        //             this.menu.menu_system.rotation.x=-Math.PI;
        //             this.menu.menu_system.position.copy(joint.position);
        //         });
        //     this.renderer.render(this.scene);
        // }else{
        //     this.renderer.render(this.scene,this.camera);
        // }
        //this.skybox.render();
        this.selfie_camera.render();
        this.people.render();
        //this.vnc.render();
        this.selfie_camera.mirror.lookAt(this.cameraDummy.position);
        this.effect.render(this.scene, this.camera);

    }
    windowResize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.effect.setSize(window.innerWidth, window.innerHeight);
        this.camera.updateProjectionMatrix();
    }
}