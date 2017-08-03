/**
 * Created by autoc on 03/06/2017.
 */

import {Setup} from "./setup.class";
declare var THREE:any;

export class Skybox {
    setup:Setup;
    skyboxGroup;
    loader;
    texture;
    textureClone;
    videoElement:HTMLVideoElement;
    is_stereo=false;
    src:string;
    type:string;
    skybox_mat;
    constructor(setup:Setup,image){
        this.loader = new THREE.TextureLoader();
        var geo = new THREE.SphereGeometry(500,700,4);
        this.skybox_mat = new THREE.MeshBasicMaterial({side: THREE.BackSide,map:new THREE.TextureLoader().load(image)})
        var skybox = new THREE.Mesh(geo, this.skybox_mat);
        setup.scene.add(skybox);
    }
    update(image){
        this.loader.load(image,(texture)=> {
            texture.needsUpdate = true;
            this.skybox_mat.map = texture;
        });
    }
}