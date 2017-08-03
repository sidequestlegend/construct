import {Setup} from "./setup.class";
/**
 * Created by autoc on 04/06/2017.
 */
declare var THREE:any;
export class People{
    setup:Setup;
    me = {
        name:"Not Set",
        faceImage: false,
        face:"",
        position:{
            x:0,
            y:0,
            z:0,
        },
        quaternion:{
            w:0,
            x:0,
            y:0,
            z:0
        },
        leftArm:[],
        rightArm:[],
        seatNumber:0,
        socketId:0
    };
    players;
    constructor(setup:Setup){
        this.setup = setup;
        this.players = {};
    }
    setMe(name:string,face:string){
        this.me.name = name;
        this.me.face = face;
    };
    render(){
        // Update each player orientation from the "me" object stored in the sub-property "person".
        var that = this;
        for(var id in this.players){
            var player = this.players[id];
            player.quaternion.copy(player.person.quaternion);
            if(player.person.socketId!=this.me.socketId&&player.sound){
                // that.scope.dataChannel.setSoundPosition(player,player.context,player.sound.panner,false);
                // that.scope.dataChannel.setSoundOrientation(player,player.context,player.sound.panner,false);
                // that.scope.dataChannel.setSoundPosition(this.scope.camera,player.context,player.sound.panner,true);
                // that.scope.dataChannel.setSoundOrientation(this.scope.camera,player.context,player.sound.panner,true);
            }
        }
        // Set the "me" position from the current camera position.
        this.me.position = {
            x:this.setup.camera.position.x,
            y:this.setup.camera.position.y,
            z:this.setup.camera.position.z
        };
        // Set the "me" orientation from the current camera quaternion.
        this.me.quaternion = {
            w:this.setup.camera.quaternion._w,
            x:this.setup.camera.quaternion._x,
            y:this.setup.camera.quaternion._y,
            z:this.setup.camera.quaternion._z
        };

        this.renderPerson(this.me);
    }
    loadObject(texture){
        var that = this;
        return new Promise(function(resolve){
            // var onProgress = function ( xhr ) {
            //     if ( xhr.lengthComputable ) {
            //         var percentComplete = xhr.loaded / xhr.total * 100;
            //         console.log( Math.round(percentComplete) + '% downloaded' );
            //     }
            // };
            // var onError = function ( xhr ) {
            // };
            var points = [];
            for ( var deg = 0; deg <= 180; deg += 6 ) {

                var rad = Math.PI * deg / 180;
                var point = new THREE.Vector2( ( 1.22 - .05 * Math.cos( rad ) ) * Math.sin( rad ), -Math.cos( rad ) ); // the "egg equation"
                //console.log( point ); // x-coord should be greater than zero to avoid degenerate triangles; it is not in this formula.
                points.push( point );

            }
            resolve(new THREE.Mesh(new THREE.LatheBufferGeometry( points, 32 ),new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture } )));
            // var loader = new THREE.STLLoader();
            // loader.load( 'assets/models/head.stl', function ( object ) {
            //     resolve(new THREE.Mesh(object,new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } )));
            //     // object.traverse( function ( child ) {
            //     //     if ( child instanceof THREE.Mesh ) {
            //     //         // child.geometry.computeVertexNormals();
            //     //         // child.geometry.computeFaceNormals();
            //     //         //child.geometry.needsUpdate=true;
            //     //
            //     //         child.material.map = texture;
            //     //         texture.needsUpdate = true;
            //     //         resolve(child);//new THREE.Mesh(child.geometry,new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } )));
            //     //     }
            //     // } );
            // }, onProgress, onError );
        });

    }
    renderPerson(person){
        var that = this;
        // person base position from seatnumber.
        var angle = (360*((person.seatNumber)/4));
        if(!(this.players[person.socketId])){

            //base mesh by Samuel Sharit

            // var geometry = new THREE.SphereGeometry( 15, 24, 24 );
            // var material = new THREE.MeshPhongMaterial( {} );
            // geometry.applyMatrix( new THREE.Matrix4().makeScale( 1.0, 1.2, 0.2 ) );
            var cube:any = new THREE.Group();
            //cube.cube = new THREE.Mesh( geometry, material );

            cube.leftMeshes=[];
            cube.rightMeshes=[];
            cube.originalPosition = {x:60*Math.cos(angle*(Math.PI/180)),z:60*Math.sin(angle*(Math.PI/180))};
            cube.position.set(cube.originalPosition.x,0,cube.originalPosition.z);
            cube.person = person;
            this.players[person.socketId] = cube;
            this.setup.scene.add( cube );
            var loader = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';
            loader.load(person.face, function(texture){
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                //texture.offset.y = 0.3;
                texture.offset.x = -0.25;
                // cube.cube.material.map = texture;

                texture.repeat.set(1.5,1)
                that.loadObject(texture).then(function(object:any){
                    object.scale.set(5,5,5);
                    cube.head = object;
                    cube.add(cube.head);
                });

                // texture.needsUpdate=true;
                // cube.cube.material.needsUpdate=true;
            });
        }else{
            this.players[person.socketId].person = person;
        }
        if(person.socketId!=this.me.socketId){
            if(this.players[person.socketId]){
                //this.hands.render(this.players[person.socketId],person,false,"other");
            }
        }else{
            var originalPosition = {x:60*Math.cos(angle*Math.PI/180),z:60*Math.sin(angle*Math.PI/180)};
            this.setup.cameraDummy.position.x = originalPosition.x;
            this.setup.cameraDummy.position.z = originalPosition.z;
        }
        //}
        //for(var id in MultiplayerMode.prototype.players){
        //    if(!(id in room.people)){
        //        this.room.scene.remove( MultiplayerMode.prototype.players[id] );
        //        delete MultiplayerMode.prototype.players[id];
        //    }
        //}
    }
}