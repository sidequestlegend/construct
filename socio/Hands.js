var Hands = function(scope) {
    // Pass in highest level scope to allow accessing of other objects below that scope.
    this.scope = scope;
};
Hands.prototype.render = function(object,frame,isLeap){
    var countBones = 0;
    var countArms = 0;
    var that = this;
    if(isLeap){
        object.armMeshes.forEach(function(item){object.remove(item);});
        object.boneMeshes.forEach(function(item){object.remove(item);});
        frame.hands.forEach(function(hand){
            that.scope.multiplayer.me[hand.type+"Arm"] = [];
            hand.fingers.forEach(function(finger){
                finger.bones.forEach(function(bone){
                    //if (  === 0 ) { continue; }
                    bone.center_ = bone.center();
                    bone.matrix_ = bone.matrix();
                    //var boneMesh = object.boneMeshes [ countBones ] || that.addBoneMesh( object.boneMeshes );
                    var boneMesh;
                    if(object.boneMeshes [ countBones ]){
                         boneMesh = object.boneMeshes [ countBones ];
                    }else{
                         boneMesh = that.addBoneMesh( object.boneMeshes );
                         //object.add( boneMesh );
                    }
                    that.updateBoneMesh( bone, boneMesh, object, isLeap );
                    that.addHandToMe(hand.type,bone);
                    countBones++;
                });
            });
            var arm = hand.arm;
            arm.center_ = arm.center();
            arm.matrix_ = arm.matrix();
            var armMesh = object.armMeshes [ countArms++ ] || that.addBoneMesh( object.armMeshes );
            if(hand.type=="left"){
                that.leftArmMesh = armMesh;
                if(that.scope.menu&&that.scope.menu.type=="arm"){
                    that.scope.menu.buttonsGroup.setRotationFromMatrix( new THREE.Matrix4().fromArray( arm.matrix_ ) );
                    that.scope.menu.buttonsGroup.position.set( arm.center_[0]*0.1,(arm.center_[1]*0.1)-(that.isHMD?30:10),(arm.center_[2]*0.1)+(that.isHMD?0:-20));
                }
            }
            that.updateBoneMesh( arm, armMesh, object, isLeap );
            armMesh.scale.set( arm.width *0.05, arm.width *0.05, arm.length  *0.1);
        });
    }else{
        object.leftMeshes.forEach(function(item){object.remove(item);});
        object.rightMeshes.forEach(function(item){object.remove(item);});
        frame.leftArm.forEach(function(bone,i){
            var boneMesh;
            if(object.leftMeshes [ i ]){
                 boneMesh = object.leftMeshes [ i ];
            }else{
                 boneMesh = that.addBoneMesh( object.leftMeshes );
                 //object.add( boneMesh );
            }
            that.updateBoneMesh( bone, boneMesh, object, isLeap);
        });
        frame.rightArm.forEach(function(bone,i){
             var boneMesh;
            if(object.rightMeshes [ i ]){
                 boneMesh = object.rightMeshes [ i ];
            }else{
                 boneMesh = that.addBoneMesh( object.rightMeshes );
                 //object.add( boneMesh );
            }
            that.updateBoneMesh( bone, boneMesh, object, isLeap);
        });
    }
};

Hands.prototype.addHandToMe = function( side, bone ) {
    this.scope.multiplayer.me[side+"Arm"].push({center_: bone.center_});
};

Hands.prototype.addBoneMesh = function( meshes ) {
    var geometry = new THREE.SphereGeometry( 0.4, 20, 20 );
    var material = new THREE.MeshPhongMaterial( {color: 0xefefef} );
    var mesh = new THREE.Mesh( geometry, material );
    meshes.push( mesh );
    return mesh;
};

Hands.prototype.updateBoneMesh = function( bone, mesh, parent, isLeap) {
    if(isLeap){
        mesh.setRotationFromMatrix( new THREE.Matrix4().fromArray( bone.matrix_ ) );
        if(this.isHMD){
            mesh.quaternion.multiply( new THREE.Quaternion().setFromEuler( new THREE.Euler( 0, 0, Math.PI / 2 ) ) );
        }
        mesh.scale.set( bone.width*0.1, bone.width*0.1, bone.length*0.1>0?bone.length*0.1:1);
        mesh.position.set( bone.center_[0]*0.1,(bone.center_[1]*0.1)-(this.isHMD?30:10),(bone.center_[2]*0.1)+(this.isHMD?0:-20));
    }else{
        mesh.scale.set(2,2,2);
        mesh.position.set( bone.center_[0]*0.1,(bone.center_[1]*0.1)-30,(bone.center_[2]*0.1));
    }
    parent.add(mesh);
};
Hands.prototype.headMounted = function(isHMD){
    this.isHMD = isHMD;
    this.leapController.setOptimizeHMD(isHMD);
};
Hands.prototype.enable = function(isRemote){
    var that = this;
    if(isRemote){
        this.leapSocket = io.connect('http://'+window.location.host.split(":")[0]+":8083");
        that.scope.camera.leftMeshes=[];
        that.scope.camera.rightMeshes=[];
        console.log("leap remote");
        this.leapSocket.on("bones",function(frame){
            that.renderHands(that.scope.camera,frame,false,"remote");
        });
    }else{
        if(!(this.scope.camera.armMeshes))this.scope.camera.armMeshes = [];
        this.scope.camera.boneMeshes = [];
        
        this.leapController = Leap.loop({enableGestures:true,optimizeHMD: false,background: true}, function(frame){
            that.render(that.scope.camera,frame,true,"local");
        }).use('transform', {
            quaternion: function(){
                if(that.isHMD){
                    return new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.PI * -0.3)-(Math.PI/2), 0, Math.PI, 'ZXY'));
                }else{
                    return new THREE.Quaternion();
                }
            },
        });
    }
};