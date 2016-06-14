var THREE = require('three');
var glslify = require('glslify');
var mixIn = require('mout/object/mixIn');
var fillIn = require('mout/object/fillIn');
var shaderParse = require('../../../helpers/shaderParse');

function MeshMotionMaterial ( parameters ) {

    parameters = parameters || {};

    var uniforms = parameters.uniforms || {};
    var vertexShader = shaderParse(glslify('./motionBlurMotion.vert'));
    var fragmentShader = shaderParse(glslify('./motionBlurMotion.frag'));
    this.motionMultiplier = parameters.motionMultiplier || 1;

    THREE.ShaderMaterial.call( this, mixIn({

        uniforms: fillIn(uniforms, {
            u_prevModelViewMatrix: {type: 'm4', value: new THREE.Matrix4()},
            u_motionMultiplier: {type: 'f', value: 1}
        }),
        vertexShader : vertexShader,
        fragmentShader : fragmentShader

    }, parameters));

}

var _p = MeshMotionMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );
_p.constructor = MeshMotionMaterial;
module.exports = MeshMotionMaterial;
