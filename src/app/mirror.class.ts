import {Setup} from "./setup.class";
/**
 * Created by autoc on 03/06/2017.
 */
declare var THREE:any;
export class Mirror{
    setup:Setup;
    mirror;
    cubeCamera;
    isOpen=false;
    constructor(setup:Setup){
        this.setup = setup;
        var mirrorMaterial = new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
        var mirrorGeom =  new THREE.PlaneGeometry( 10, 10);
        this.mirror = new THREE.Mesh( mirrorGeom, mirrorMaterial );
        // this.mirror.rotateX( - Math.PI / 2 );
        this.cubeCamera  = new THREE.CubeCamera( 0.1, 10000, 1280 );
        this.cubeCamera.layers.enable(1);
        this.cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
        mirrorMaterial.envMap = this.cubeCamera.renderTarget.texture;
    }
    open(position){
        this.isOpen = true;
        this.mirror.position.copy(position);
        this.mirror.position.z-=15;
        this.mirror.position.x-=13;
        this.mirror.position.y+=0;
        this.mirror.lookAt(this.setup.cameraDummy.position);
        this.cubeCamera.lookAt(this.setup.cameraDummy.position);
        this.setup.scene.add(this.cubeCamera);
        this.setup.scene.add(this.mirror);
    }
    close = function(){
        this.isOpen = false;
        this.setup.scene.remove(this.cubeCamera);
        this.setup.scene.remove(this.mirror);
    }
    render(){
        this.mirror.visible = false;
        //this.mirror.rotation.y+=0.001
        //if(this.setup.sphere.sphereSpare)this.scope.sphere.sphereSpare.visible = true;
        this.cubeCamera.position.copy( this.mirror.position );
        this.cubeCamera.updateCubeMap( this.setup.renderer, this.setup.scene );
       // if(this.scope.sphere.sphereSpare)this.scope.sphere.sphereSpare.visible = false;
        this.mirror.visible = true;
    }
}