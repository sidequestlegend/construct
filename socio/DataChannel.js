var DataChannel = function(scope) {
    this.scope = scope;
    this.peers = {};
    this.OPENED = 0;
    this.MESSAGE = 1;
    this.CLOSED = 2;
    this.AUDIO = 3;
    this.ME_READY = 4;
    this.PLAYER_LEFT = 5;
};
DataChannel.prototype.send = function(message){
    for(var key in this.peers){
        var peer = this.peers[key];
        if(peer.isReady){
          peer.send(message);
        }
    };
};

DataChannel.prototype.close = function(message){
  for(var key in this.peers){
    this.peers[key].destroy();
  }
  this.socket.emit("leave-room");
  this.socket.disconnect();
};


DataChannel.prototype.join = function(me,room,callback){
  var that = this;
  this.callback = callback;
  this.socket = io.connect("https://vr.xactaccounts.co.uk:8082");
    this.socket.on("player-left",function(id){
      that.callback(that.PLAYER_LEFT,id);
    });
    navigator.getUserMedia({ video: false, audio: true }, function(stream){
      that.stream = stream;
      that.socket.on("joined-room",function(data){
        that.me = me;
        // Save the socket.io socket id and the seat number that the node app assigns.
        me.socketId = data.socketId;
        me.seatNumber = data.seatNumber;
        that.callback(that.ME_READY);
        for(var key in data.room.players){
          if(key != data.socketId){
            that.getPeer(key,room,true);
          }
        }
      });
      that.socket.on('signal',function(data){
          if(!that.peers[data.id]){
            that.getPeer(data.id,room,false);
          }
          that.peers[data.id].signal(data.signal);
        });
      // Join the socket.io room.
      that.socket.emit("join-room",{room:name,me:me.name});
    }, function () {});
};
DataChannel.prototype.getPeer = function(id,room,initiator){
  
  var that = this;
  var peer;
  peer = new SimplePeer(initiator?{initiator: initiator, channelName: room, stream:that.stream}:{channelName: room, stream:that.stream});
  peer.socketId = id;
  peer.on('signal', function (data) {
    that.socket.emit('signal',{signal:data,id:id});
  });
  that.peers[id] = peer;
  peer.on('connect', function () {
    //console.log("peer opened:"+id);
    peer.isReady = true;
    that.callback(that.OPENED, peer);
  });
  peer.on('close', function () {
    console.log("peer closed:"+id);
    that.removePeer(peer);
  });
  peer.on('error', function (e) {
    console.log("peer error:"+id,initiator,e,that.scope.multiplayer.me.socketId);
    that.removePeer(peer);
  });
  peer.on('stream', function (stream) {
    //console.log("peer audio:"+id);
    peer.stream = stream;
    peer.hasStream = true;
    //https://www.html5rocks.com/en/tutorials/webaudio/positional_audio/
    var context  = new AudioContext();
    // Create a AudioGainNode to control the main volume.
    var mainVolume = context.createGain();
    // Connect the main volume node to the context destination.
    mainVolume.connect(context.destination);
    // Create an object with a sound source and a volume control.
    var sound = {};
    var audio = document.createElement("audio");
     window.stream = stream; // stream available to console
    if (window.URL) {
      audio.src = window.URL.createObjectURL(stream);
    } else {
      audio.src = stream;
    }
    audio.play();
    sound.source = context.createMediaElementSource(audio);
    //sound.source = context.createMediaStreamSource(stream);
    sound.volume = context.createGain();
    // Connect the sound source to the volume control.
    sound.source.connect(sound.volume);
    // Hook up the sound volume control to the main volume.
    sound.volume.connect(mainVolume);
    sound.panner = context.createPanner();
    sound.panner.coneOuterGain = 0.5;
    sound.panner.coneOuterAngle = 180;
    sound.panner.coneInnerAngle = 60;
    sound.volume.connect(sound.panner);
    sound.panner.connect(mainVolume);
    sound.audio = document.createElement('audio');
    peer.sound = sound;
    peer.context = context;
    //callback(that.AUDIO,  id, stream, sound, context);
    that.callback(that.AUDIO, peer);
  });
  peer.on('data', function (data) {
    //console.log("peer message:"+data);
    that.callback(that.MESSAGE, peer, JSON.parse(data));
  });
};
DataChannel.prototype.removePeer = function(id){
    delete this.peers[id];
    this.callback(this.CLOSED,id);
};


DataChannel.prototype.setSoundPosition = function(object,ctx,panner,isListener){
    object.updateMatrixWorld();
    var p = new THREE.Vector3();
    p.setFromMatrixPosition(object.matrixWorld);
    // And copy the position over to the listener.
    var soundObject = isListener?ctx.listener:panner;
    soundObject.setPosition(p.x, p.y, p.z);
};
DataChannel.prototype.setSoundOrientation = function(object,ctx,panner,isListener){
    //https://www.html5rocks.com/en/tutorials/webaudio/positional_audio/
    // The camera's world matrix is named "matrix".
    var m = object.matrix;
    
    var mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
    m.elements[12] = m.elements[13] = m.elements[14] = 0;
    
    // Multiply the orientation vector by the world matrix of the camera.
    var vec = new THREE.Vector3(0,0,1);
    vec.applyProjection(m);
    vec.normalize();
    
    // Multiply the up vector by the world matrix.
    var up = new THREE.Vector3(0,-1,0);
    up.applyProjection(m);
    up.normalize();
    
    // Set the orientation and the up-vector for the listener.
    var soundObject = isListener?ctx.listener:panner;
    soundObject.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);
    
    m.elements[12] = mx;
    m.elements[13] = my;
    m.elements[14] = mz;
};
DataChannel.prototype.setSoundVelocity = function(sound,object,secondsSinceLastFrame){
        //https://www.html5rocks.com/en/tutorials/webaudio/positional_audio/
    var dt = secondsSinceLastFrame;

    var p = new THREE.Vector3();
    p.setFromMatrixPosition(object.matrixWorld);
    var px = p.x, py = p.y, pz = p.z;
    
    object.position.set(newX, newY, newZ);
    object.updateMatrixWorld();
    
    var q = new THREE.Vector3();
    q.setFromMatrixPosition(object.matrixWorld);
    var dx = q.x-px, dy = q.y-py, dz = q.z-pz;
    
    sound.panner.setPosition(q.x, q.y, q.z);
    sound.panner.setVelocity(dx/dt, dy/dt, dz/dt);
};