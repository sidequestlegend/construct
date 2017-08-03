/**
 * Created by autoc on 03/06/2017.
 */
import * as RFB from './../../noVNC/core/rfb.js';
import {Setup} from "./setup.class";
declare var THREE:any;
export class VNC {
    pool;
    setup;
    constructor(setup:Setup){
        this.setup = setup;
        this.pool = [];
    }

    addVNC(host,port,password,path){
        var streamCanvas = document.createElement('canvas');
        // var context = streamCanvas.getContext("2d");
        // // context.fillStyle="#000000";
        // // context.fillRect(0,0,512,512);
        // plane
        var texture = texture = new THREE.Texture(streamCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = - 1;
        var geometry = new THREE.SphereGeometry(15, 24, 24, 0.5, 2, 1, 1.25);//new THREE.PlaneGeometry( 80, 20 );
        geometry.applyMatrix( new THREE.Matrix4().makeScale( 4.0, 3.0, 3.0 ) );
        var material = new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide  } );
        var rfb:any = {
            rfb_options : {
                'target': streamCanvas,
                'encrypt': (window.location.protocol === "https:"),
                'repeaterID': '',
                'local_cursor': true,
                'shared': true,
                'view_only': false,
                'onNotification': function () {
                },
                'onUpdateState': function (state) {
                    console.log('update-state',state)
                },
                'onDisconnected': function () {
                    console.log('onDisconnected')
                },
                'onXvpInit': function () {
                },
                'onPasswordRequired': function () {
                    console.log('onPasswordRequired')
                },
                'onFBUComplete': function () {
                },
                'onDesktopName': function () {
                }
            },
            connection_options:{
                host:host||window.location.hostname,
                port:port||window.location.port,
                password:password||'',
                path:path||'websockify',
            },
            position_options:{
                position:new THREE.Vector3(),
                rotation:new THREE.Vector3(),
                //var geometry = new THREE.SphereGeometry(50, 24, 24, 0, 3, .75, 1.75);
            },
            mesh:new THREE.Mesh( geometry, material ),
            texture:texture
        };
        rfb.connection = new RFB.default(rfb.rfb_options);
        rfb.connection.connect(rfb.connection_options.host, rfb.connection_options.port, rfb.connection_options.password, rfb.connection_options.path);
        rfb.mesh.position.z = -30;
        rfb.mesh.rotation.y=Math.PI;
        this.setup.cameraDummy.add(rfb.mesh);
        console.log(document.getElementById("noVNC_mouse_capture_elem"));
        this.pool.push(rfb);
        return rfb;
    }
    render(){
        this.pool.forEach(function(screen){
            if(screen.connection._rfb_connection_state=="connected"){
                screen.texture.needsUpdate=true;
            }
        });
    }
}