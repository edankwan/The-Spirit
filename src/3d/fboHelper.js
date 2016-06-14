var THREE = require('three');
var glslify = require('glslify');

var undef;


var _renderer;
var _mesh;
var _scene;
var _camera;

var rawShaderPrefix = exports.rawShaderPrefix = undef;
var vertexShader = exports.vertexShader = undef;
var copyMaterial = exports.copyMaterial = undef;

exports.init = init;
exports.copy = copy;
exports.render = render;
exports.createRenderTarget = createRenderTarget;
exports.getColorState = getColorState;
exports.setColorState = setColorState;

function init(renderer) {

    // ensure it wont initialized twice
    if(_renderer) return;

    _renderer = renderer;

    rawShaderPrefix = exports.rawShaderPrefix = 'precision ' + _renderer.capabilities.precision + ' float;\n';

    _scene = new THREE.Scene();
    _camera = new THREE.Camera();
    _camera.position.z = 1;

    copyMaterial = exports.copyMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: undef }
        },
        vertexShader: vertexShader = exports.vertexShader = rawShaderPrefix + glslify('./quad.vert'),
        fragmentShader: rawShaderPrefix + glslify('./quad.frag')
    });

    _mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), copyMaterial );
    _scene.add( _mesh );

}

function copy(inputTexture, ouputTexture) {
    _mesh.material = copyMaterial;
    copyMaterial.uniforms.u_texture.value = inputTexture;
    if(ouputTexture) {
        _renderer.render( _scene, _camera, ouputTexture );
    } else {
        _renderer.render( _scene, _camera );
    }
}
function render(material, renderTarget) {
    _mesh.material = material;
    if(renderTarget) {
        _renderer.render( _scene, _camera, renderTarget );
    } else {
        _renderer.render( _scene, _camera );
    }
}

function createRenderTarget(width, height, format, type, minFilter, magFilter) {
    var renderTarget = new THREE.WebGLRenderTarget(width || 1, height || 1, {
        format: format || THREE.RGBFormat,
        type: type || THREE.UnsignedByteType,
        minFilter: minFilter || THREE.LinearFilter,
        magFilter: magFilter || THREE.LinearFilter,
        // depthBuffer: false,
        // stencilBuffer: false
    });

    renderTarget.texture.generateMipMaps = false;

    return renderTarget;
}

function getColorState() {
    return {
        autoClearColor : _renderer.autoClearColor,
        clearColor : _renderer.getClearColor().getHex(),
        clearAlpha : _renderer.getClearAlpha()
    };
}

function setColorState(state) {
    _renderer.setClearColor(state.clearColor, state.clearAlpha);
    _renderer.autoClearColor = state.autoClearColor;
}
