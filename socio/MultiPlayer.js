var MultiplayerMode = function(scope) {
    // Pass in highest level scope to allow accessing of other objects below that scope.
    this.scope = scope;
    // Set the default object for "me" i.e. the current user on this end.
    // This user object could be expanded in the future for more full body tracking.
    // The seat number defines where in the virtual table this user is sitting.
    // Socket id is the socket.io id and the peer id is the webRTC peer id.
    this.me = {
        name:"Not Set",
        faceImage: false,
        headPosition:{
            x:0,
            y:0,
            z:0,
        },
        headQuaternion:{
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
    this.players = {};
    this.hands = new Hands(scope);
};

MultiplayerMode.prototype.setMe = function(name,face){
    // Set the current users name and face image url ( 256 by 256 only )
    // TODO validate image size.
    this.me.name = name;
    this.me.face = face;
   // this.me = {me:{name:data.name,face:data.face},position:{x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z},quaternion:{w:this.camera.quaternion._w,x:this.camera.quaternion._x,y:this.camera.quaternion._y,z:this.camera.quaternion._z},leftHand:[],rightHand:[]};
};

MultiplayerMode.prototype.join = function(name){
    var that = this;
    // Connect to socket.io
    that.room_name = name;
    that.scope.dataChannel.join(this.me,name,function(type,peer,data,context){
            
      switch(type){
          case that.scope.dataChannel.OPENED:
              // Connection to peer opened
              
              break;
          case that.scope.dataChannel.CLOSED:
              // Connection to peer closed
              //for(var id in that.players){
              //    var p = that.players[id];
              //    if(p.person.peerId == peerId){
              //      that.scope._scene.remove( that.players[id] );
              //      delete that.players[id];
              //      break;
              //    }
              //}
              break;
          case that.scope.dataChannel.MESSAGE:
              // Recieved a "me" object from another user. Render it.
              that.renderPerson(data);
              break;
          case that.scope.dataChannel.AUDIO:
              setTimeout(function(){
                that.renderPersonAudio(peer);
                
              },3000);
              break;
            
          case that.scope.dataChannel.ME_READY:
              that.scope.scene.renderQue["multi-player"] = {scope:that,callback:that.render};
              break;
          case that.scope.dataChannel.PLAYER_LEFT:
              if(that.players[peer]){
                that.scope._scene.remove( that.players[peer] );
                delete that.players[peer];
              }
              break;
            
      }
    });
    // Setup render que for rendering your hands and other players.
    // Seperate QUE for sending your "me" object over webRTC. Want to be able to control the rate of this loop.
    clearInterval(this.peerLoop);
    this.peerLoop = setInterval(function(){
        // Send "me" over webRTC
        that.scope.dataChannel.send(JSON.stringify(that.me));
    },30);
    this.hands.enable();
    this.hands.headMounted(false);
    var geometry = new THREE.SphereGeometry( 50, 64, 64 );
    var material = new THREE.MeshPhongMaterial( {color: 0xefefef, transparent: true,opacity: 0.8} );
    geometry.applyMatrix( new THREE.Matrix4().makeScale( 1.0, 1.0, 0.03 ) );
    var table = new THREE.Mesh(geometry,material);
    table.rotation.x=Math.PI/2;
    table.position.y=-20;
    this.scope._scene.add(table);
};

MultiplayerMode.prototype.renderPersonAudio = function(peer/*id, stream, sound, context*/){
    var player;
    for(var id in this.players){
        var p = this.players[id];
        if(p.person.socketId == peer.socketId){
          player = p;
          break;
        }
    }
    if(player){
      player.sound = peer.sound;
      player.stream = peer.stream;
      player.context = peer.context;
    }
};
MultiplayerMode.prototype.render = function(){
    // Update each player orientation from the "me" object stored in the sub-property "person".
    var that = this;
    for(var id in this.players){
        var player = this.players[id];
        player.quaternion.copy(player.person.quaternion);
        if(player.person.socketId!=this.me.socketId&&player.sound){
          that.scope.dataChannel.setSoundPosition(player,player.context,player.sound.panner,false);
          that.scope.dataChannel.setSoundOrientation(player,player.context,player.sound.panner,false);
          that.scope.dataChannel.setSoundPosition(this.scope.camera,player.context,player.sound.panner,true);
          that.scope.dataChannel.setSoundOrientation(this.scope.camera,player.context,player.sound.panner,true);
        }
    }
    // Set the "me" position from the current camera position.
    this.me.position = {
        x:this.scope.camera.position.x,
        y:this.scope.camera.position.y,
        z:this.scope.camera.position.z
    };
    // Set the "me" orientation from the current camera quaternion.
    this.me.quaternion = {
        w:this.scope.camera.quaternion._w,
        x:this.scope.camera.quaternion._x,
        y:this.scope.camera.quaternion._y,
        z:this.scope.camera.quaternion._z
    };
    
    this.renderPerson(this.me);
};

MultiplayerMode.prototype.leave = function(){
    // Leave the webRTC room
    this.scope.dataChannel.close();
};
MultiplayerMode.prototype.showMe = function(show){
    if(this.players[this.me.socketId]){
        this.players[this.me.socketId].visible=show;
    }
};
MultiplayerMode.prototype.renderPerson = function(person){
    // person base position from seatnumber.
    var angle = (360*((person.seatNumber)/4));
    if(!(this.players[person.socketId])){
        var geometry = new THREE.SphereGeometry( 15, 24, 24 );
        var material = new THREE.MeshPhongMaterial( {} );
        geometry.applyMatrix( new THREE.Matrix4().makeScale( 1.0, 1.2, 0.2 ) );
        cube = new THREE.Group();
        cube.cube = new THREE.Mesh( geometry, material );
        cube.add(cube.cube);
        cube.leftMeshes=[];
        cube.rightMeshes=[];
        cube.originalPosition = {x:60*Math.cos(angle*(Math.PI/180)),z:60*Math.sin(angle*(Math.PI/180))};
        cube.position.set(cube.originalPosition.x,0,cube.originalPosition.z);
        cube.person = person;
        this.players[person.socketId] = cube;
        this.scope._scene.add( cube );
        var loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';
        loader.load(person.face, function(texture){
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.offset.x = 0.75;
            cube.cube.material.map = texture;
            texture.needsUpdate=true;
            cube.cube.material.needsUpdate=true;
        });
    }else{
        this.players[person.socketId].person = person;
    }
    if(person.socketId!=this.me.socketId){
        if(this.players[person.socketId]){
            this.hands.render(this.players[person.socketId],person,false,"other");
        }
    }else{
        var originalPosition = {x:60*Math.cos(angle*Math.PI/180),z:60*Math.sin(angle*Math.PI/180)};
        this.scope.cameraDummy.position.x = originalPosition.x;
        this.scope.cameraDummy.position.z = originalPosition.z;
    }
    //}
    //for(var id in MultiplayerMode.prototype.players){
    //    if(!(id in room.people)){
    //        this.room.scene.remove( MultiplayerMode.prototype.players[id] );
    //        delete MultiplayerMode.prototype.players[id];
    //    }
    //}
};