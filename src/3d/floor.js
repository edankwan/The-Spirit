var settings = require('../core/settings');
var THREE = require('three');

var undef;

exports.mesh = undef;
exports.init = init;

function init() {
    var geometry = new THREE.PlaneBufferGeometry( 4500, 4500, 10, 10 );
    var planeMaterial = new THREE.MeshStandardMaterial( {
        color: settings.bgColor,
        roughness: 0.4,
        metalness: 0.4,
    } );
    var mesh = exports.mesh = new THREE.Mesh( geometry, planeMaterial );

    mesh.rotation.x = -1.57;
    mesh.castShadow = false;
    mesh.receiveShadow = true;

}
