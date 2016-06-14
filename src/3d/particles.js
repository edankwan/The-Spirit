var settings = require('../core/settings');
var THREE = require('three');
var shaderParse = require('../helpers/shaderParse');
var glslify = require('glslify');
var simulator = require('./simulator');
var MeshMotionMaterial = require('./postprocessing/motionBlur/MeshMotionMaterial');

var undef;

var container = exports.container = undef;
exports.init = init;
exports.update = update;

var _renderer;
var _particleMesh;
var _triangleMesh;
var _meshes;

var _color1;
var _color2;
var _tmpColor;

var TEXTURE_WIDTH = settings.simulatorTextureWidth;
var TEXTURE_HEIGHT = settings.simulatorTextureHeight;
var AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT;

function init(renderer) {

    container = exports.container = new THREE.Object3D();

    _tmpColor = new THREE.Color();
    _color1 = new THREE.Color(settings.color1);
    _color2 = new THREE.Color(settings.color2);

    _meshes = [
        _triangleMesh = _createTriangleMesh(),
        _particleMesh = _createParticleMesh()
    ];
    _triangleMesh.visible = false;
    _particleMesh.visible = false;

    _renderer = renderer;

}

function _createParticleMesh() {

    var position = new Float32Array(AMOUNT * 3);
    var i3;
    for(var i = 0; i < AMOUNT; i++ ) {
        i3 = i * 3;
        position[i3 + 0] = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH;
        position[i3 + 1] = ~~(i / TEXTURE_WIDTH) / TEXTURE_HEIGHT;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ));

    var material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.shadowmap,
            {
                texturePosition: { type: 't', value: undef },
                color1: { type: 'c', value: undef },
                color2: { type: 'c', value: undef }
            }
        ]),
        vertexShader: shaderParse(glslify('../glsl/particles.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particles.frag')),
        blending: THREE.NoBlending
    });

    material.uniforms.color1.value = _color1;
    material.uniforms.color2.value = _color2;

    var mesh = new THREE.Points( geometry, material );

    mesh.customDistanceMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            lightPos: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
            texturePosition: { type: 't', value: undef }
        },
        vertexShader: shaderParse(glslify('../glsl/particlesDistance.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particlesDistance.frag')),
        depthTest: true,
        depthWrite: true,
        side: THREE.BackSide,
        blending: THREE.NoBlending
    });

    mesh.motionMaterial = new MeshMotionMaterial( {
        uniforms: {
            texturePosition: { type: 't', value: undef },
            texturePrevPosition: { type: 't', value: undef }
        },
        vertexShader: shaderParse(glslify('../glsl/particlesMotion.vert')),
        depthTest: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        blending: THREE.NoBlending
    });

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    container.add(mesh);

    return mesh;
}

function _createTriangleMesh() {

    var position = new Float32Array(AMOUNT * 3 * 3);
    var positionFlip = new Float32Array(AMOUNT * 3 * 3);
    var fboUV = new Float32Array(AMOUNT * 2 * 3);

    var PI = Math.PI;
    var angle = PI * 2 / 3;
    var angles = [
        Math.sin(angle * 2 + PI),
        Math.cos(angle * 2 + PI),
        Math.sin(angle + PI),
        Math.cos(angle + PI),
        Math.sin(angle * 3 + PI),
        Math.cos(angle * 3 + PI),
        Math.sin(angle * 2),
        Math.cos(angle * 2),
        Math.sin(angle),
        Math.cos(angle),
        Math.sin(angle * 3),
        Math.cos(angle * 3)
    ]
    var i6, i9;
    for(var i = 0; i < AMOUNT; i++ ) {
        i6 = i * 6;
        i9 = i * 9;
        if(i % 2) {
            position[ i9 + 0] = angles[0];
            position[ i9 + 1] = angles[1];
            position[ i9 + 3] = angles[2];
            position[ i9 + 4] = angles[3];
            position[ i9 + 6] = angles[4];
            position[ i9 + 7] = angles[5];

            positionFlip[ i9 + 0] = angles[6];
            positionFlip[ i9 + 1] = angles[7];
            positionFlip[ i9 + 3] = angles[8];
            positionFlip[ i9 + 4] = angles[9];
            positionFlip[ i9 + 6] = angles[10];
            positionFlip[ i9 + 7] = angles[11];
        } else {
            positionFlip[ i9 + 0] = angles[0];
            positionFlip[ i9 + 1] = angles[1];
            positionFlip[ i9 + 3] = angles[2];
            positionFlip[ i9 + 4] = angles[3];
            positionFlip[ i9 + 6] = angles[4];
            positionFlip[ i9 + 7] = angles[5];

            position[ i9 + 0] = angles[6];
            position[ i9 + 1] = angles[7];
            position[ i9 + 3] = angles[8];
            position[ i9 + 4] = angles[9];
            position[ i9 + 6] = angles[10];
            position[ i9 + 7] = angles[11];
        }

        fboUV[ i6 + 0] = fboUV[ i6 + 2] = fboUV[ i6 + 4] = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH;
        fboUV[ i6 + 1 ] = fboUV[ i6 + 3 ] = fboUV[ i6 + 5 ] = ~~(i / TEXTURE_WIDTH) / TEXTURE_HEIGHT;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ));
    geometry.addAttribute( 'positionFlip', new THREE.BufferAttribute( positionFlip, 3 ));
    geometry.addAttribute( 'fboUV', new THREE.BufferAttribute( fboUV, 2 ));

    var material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.shadowmap,
            {
                texturePosition: { type: 't', value: undef },
                flipRatio: { type: 'f', value: 0 },
                color1: { type: 'c', value: undef },
                color2: { type: 'c', value: undef },
                cameraMatrix: { type: 'm4', value: undef }
            }
        ]),
        vertexShader: shaderParse(glslify('../glsl/triangles.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particles.frag')),
        blending: THREE.NoBlending
    });

    material.uniforms.color1.value = _color1;
    material.uniforms.color2.value = _color2;
    material.uniforms.cameraMatrix.value = settings.camera.matrixWorld;

    var mesh = new THREE.Mesh( geometry, material );

    mesh.customDistanceMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            lightPos: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
            texturePosition: { type: 't', value: undef },
            flipRatio: { type: 'f', value: 0 }
        },
        vertexShader: shaderParse(glslify('../glsl/trianglesDistance.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particlesDistance.frag')),
        depthTest: true,
        depthWrite: true,
        side: THREE.BackSide,
        blending: THREE.NoBlending
    });

    mesh.motionMaterial = new MeshMotionMaterial( {
        uniforms: {
            texturePosition: { type: 't', value: undef },
            texturePrevPosition: { type: 't', value: undef },
            flipRatio: { type: 'f', value: 0 }
        },
        vertexShader: shaderParse(glslify('../glsl/trianglesMotion.vert')),
        depthTest: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        blending: THREE.NoBlending
    });

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    container.add(mesh);

    return mesh;
}

function update(dt) {
    var mesh;

    _triangleMesh.visible = settings.useTriangleParticles;
    _particleMesh.visible = !settings.useTriangleParticles;

    _tmpColor.setStyle(settings.color1);
    _color1.lerp(_tmpColor, 0.05);

    _tmpColor.setStyle(settings.color2);
    _color2.lerp(_tmpColor, 0.05);

    for(var i = 0; i < 2; i++) {
        mesh = _meshes[i];
        mesh.material.uniforms.texturePosition.value = simulator.positionRenderTarget;
        mesh.customDistanceMaterial.uniforms.texturePosition.value = simulator.positionRenderTarget;
        mesh.motionMaterial.uniforms.texturePrevPosition.value = simulator.prevPositionRenderTarget;
        if(mesh.material.uniforms.flipRatio ) {
            mesh.material.uniforms.flipRatio.value ^= 1;
            mesh.customDistanceMaterial.uniforms.flipRatio.value ^= 1;
            mesh.motionMaterial.uniforms.flipRatio.value ^= 1;
        }
    }
}
