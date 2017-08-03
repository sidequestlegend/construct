/**
 * Created by autoc on 04/06/2017.
 */
declare var THREE:any;
export class Reticle{
    constructor(camera){
        var geometry = new THREE.RingGeometry(0.01, 0.02, 32);//new THREE.TorusGeometry(0.01, 0.005, 10, 20);
        var material = new THREE.MeshBasicMaterial({color: 0x0000ff});
        var reticle = new THREE.Mesh(geometry, material);
        reticle.position.z = -3;
        camera.add(reticle);
    }
}