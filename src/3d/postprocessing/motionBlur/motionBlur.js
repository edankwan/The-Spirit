var Effect = require('../Effect');
var effectComposer = require('../effectComposer');
var fboHelper = require('../../fboHelper');

var glslify = require('glslify');
var THREE = require('three');

var undef;

var exports = module.exports = new Effect();
var _super = Effect.prototype;

exports.init = init;
exports.resize = resize;
exports.render = render;

exports.useSampling = false;

// for debug
exports.skipMatrixUpdate = false;

exports.fadeStrength = 1;
exports.motionMultiplier = 1;
exports.maxDistance = 100;
exports.targetFPS = 60;
exports.leaning = 0.5;

// lines method only options
exports.jitter = 0;
exports.opacity = 1;
exports.depthBias = 0.002;
exports.depthTest = false;
exports.useDithering = false;

exports.motionRenderTargetScale = 1;
exports.linesRenderTargetScale = 1 / 2;

var _motionRenderTarget;
var _linesRenderTarget;

var _lines;
var _linesCamera;
var _linesScene;
var _linesPositions;
var _linesPositionAttribute;
var _linesGeometry;
var _linesMaterial;

var _samplingMaterial;

var _prevUseDithering;
var _prevUseSampling;

var _visibleCache = [];

var _width;
var _height;

function init(sampleCount) {

    var gl = effectComposer.renderer.getContext();
    if(!gl.getExtension('OES_texture_float') || !gl.getExtension('OES_texture_float_linear')) {
        alert('no float linear support');
    }

    _motionRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat, THREE.FloatType);
    _motionRenderTarget.depthBuffer = true;

    _linesRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat, THREE.FloatType);
    _linesCamera = new THREE.Camera();
    _linesCamera.position.z = 1.0;
    _linesScene = new THREE.Scene();

    _super.init.call(this, {
        uniforms: {
            u_lineAlphaMultiplier: { type: 'f', value: 1 },
            u_linesTexture: { type: 't', value: _linesRenderTarget }
            // u_motionTexture: { type: 't', value: _motionRenderTarget }
        },
        fragmentShader: glslify('./motionBlur.frag')
    });

    _linesPositions = [];
    _linesGeometry = new THREE.BufferGeometry();
    _linesMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: undef },
            u_motionTexture: { type: 't', value: _motionRenderTarget },
            u_resolution: { type: 'v2', value: effectComposer.resolution },
            u_maxDistance: { type: 'f', value: 1 },
            u_jitter: { type: 'f', value: 0.3 },
            u_fadeStrength: { type: 'f', value: 1 },
            u_motionMultiplier: { type: 'f', value: 1 },
            u_depthTest: { type: 'f', value: 0 },
            u_opacity: { type: 'f', value: 1 },
            u_leaning: { type: 'f', value: 0.5 },
            u_depthBias: { type: 'f', value: 0.01 }
        },
        vertexShader: fboHelper.rawShaderPrefix + glslify('./motionBlurLines.vert'),
        fragmentShader: fboHelper.rawShaderPrefix + glslify('./motionBlurLines.frag'),

        blending : THREE.CustomBlending,
        blendEquation : THREE.AddEquation,
        blendSrc : THREE.OneFactor,
        blendDst : THREE.OneFactor ,
        blendEquationAlpha : THREE.AddEquation,
        blendSrcAlpha : THREE.OneFactor,
        blendDstAlpha : THREE.OneFactor,
        depthTest: false,
        depthWrite: false,
        transparent: true
    });
    _lines = new THREE.LineSegments(_linesGeometry, _linesMaterial);
    _linesScene.add(_lines);

    _samplingMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: undef },
            u_motionTexture: { type: 't', value: _motionRenderTarget },
            u_resolution: { type: 'v2', value: effectComposer.resolution },
            u_maxDistance: { type: 'f', value: 1 },
            u_fadeStrength: { type: 'f', value: 1 },
            u_motionMultiplier: { type: 'f', value: 1 },
            u_leaning: { type: 'f', value: 0.5 }
        },
        defines: {
            SAMPLE_COUNT: sampleCount || 21
        },
        vertexShader: this.material.vertexShader,
        fragmentShader: fboHelper.rawShaderPrefix + '#define SAMPLE_COUNT ' + (sampleCount || 21) + '\n' + glslify('./motionBlurSampling.frag')
    });
}

function resize(width, height) {

    if(!width) {
        width = _width;
        height = _height;
    } else {
        _width = width;
        _height = height;
    }

    var motionWidth = ~~(width * exports.motionRenderTargetScale);
    var motionHeight = ~~(height * exports.motionRenderTargetScale);
    _motionRenderTarget.setSize(motionWidth , motionHeight);

    if(!exports.useSampling) {
        var linesWidth = ~~(width * exports.linesRenderTargetScale);
        var linesHeight = ~~(height * exports.linesRenderTargetScale);
        _linesRenderTarget.setSize(linesWidth, linesHeight);

        var i;
        var noDithering = !exports.useDithering;
        var amount = noDithering ? linesWidth * linesHeight : _getDitheringAmount(linesWidth, linesHeight);
        var currentLen = _linesPositions.length / 6;
        if(amount > currentLen) {
            _linesPositions = new Float32Array(amount * 6);
            _linesPositionAttribute = new THREE.BufferAttribute(_linesPositions, 3);
            _linesGeometry.removeAttribute('position');
            _linesGeometry.addAttribute( 'position', _linesPositionAttribute );
        }
        var i6 = 0;
        var x, y;
        var size = linesWidth * linesHeight;
        for(i = 0; i < size; i++) {
            x = i % linesWidth;
            y = ~~(i / linesWidth);
            if(noDithering || ((x + (y & 1)) & 1)) {
                _linesPositions[i6 + 0] = _linesPositions[i6 + 3] = (x + 0.5) / linesWidth;
                _linesPositions[i6 + 1] = _linesPositions[i6 + 4] = (y + 0.5) / linesHeight;
                _linesPositions[i6 + 2] = 0;
                _linesPositions[i6 + 5] = (0.001 + 0.999 * Math.random());
                i6 += 6;
            }
        }
        _linesPositionAttribute.needsUpdate = true;
        _linesGeometry.drawRange.count = amount * 2;
    }

    _prevUseDithering = exports.useDithering;
    _prevUseSampling = exports.useSampling;

}

// dithering
function _getDitheringAmount(width, height) {
    if((width & 1) && (height & 1)) {
        return (((width - 1) * (height - 1)) >> 1) + (width >> 1) + (height >> 1);
    } else {
        return (width * height) >> 1;
    }
}

function render(dt, renderTarget, toScreen) {

    if(_prevUseDithering !== exports.useDithering) {
        resize();
    } else if(_prevUseSampling !== exports.useSampling) {
        resize();
    }

    var useSampling = exports.useSampling;
    var fpsRatio = 1000 / (dt < 16.667 ? 16.667 : dt) / exports.targetFPS;

    var state = fboHelper.getColorState();
    effectComposer.renderer.setClearColor(0, 1);
    effectComposer.renderer.clearTarget(_motionRenderTarget, true);

    effectComposer.scene.traverseVisible(_setObjectBeforeState);
    effectComposer.renderScene(_motionRenderTarget);
    for(var i = 0, len = _visibleCache.length; i < len; i++) {
        _setObjectAfterState(_visibleCache[i]);
    }
    _visibleCache = [];

    if(!useSampling) {
        _linesMaterial.uniforms.u_maxDistance.value = exports.maxDistance;
        _linesMaterial.uniforms.u_jitter.value = exports.jitter;
        _linesMaterial.uniforms.u_fadeStrength.value = exports.fadeStrength;
        _linesMaterial.uniforms.u_motionMultiplier.value = exports.motionMultiplier * fpsRatio;
        _linesMaterial.uniforms.u_depthTest.value = exports.depthTest;
        _linesMaterial.uniforms.u_opacity.value = exports.opacity;
        _linesMaterial.uniforms.u_leaning.value = Math.max(0.001, Math.min(0.999, exports.leaning));
        _linesMaterial.uniforms.u_depthBias.value = Math.max(0.00001, exports.depthBias);
        _linesMaterial.uniforms.u_texture.value = renderTarget;

        effectComposer.renderer.setClearColor(0, 0);
        effectComposer.renderer.clearTarget(_linesRenderTarget, true);
        effectComposer.renderer.render(_linesScene, _linesCamera, _linesRenderTarget);
    }

    fboHelper.setColorState(state);

    if(useSampling) {
        _samplingMaterial.uniforms.u_maxDistance.value = exports.maxDistance;
        _samplingMaterial.uniforms.u_fadeStrength.value = exports.fadeStrength;
        _samplingMaterial.uniforms.u_motionMultiplier.value = exports.motionMultiplier * fpsRatio;
        _samplingMaterial.uniforms.u_leaning.value = Math.max(0.001, Math.min(0.999, exports.leaning));
        _samplingMaterial.uniforms.u_texture.value = renderTarget;

        effectComposer.render(_samplingMaterial, toScreen);
    } else {
        this.uniforms.u_lineAlphaMultiplier.value = 1 + exports.useDithering;
        _super.render.call(this, dt, renderTarget, toScreen);
    }

}

function _setObjectBeforeState(obj) {
    if(obj.motionMaterial) {
        obj._tmpMaterial = obj.material;
        obj.material = obj.motionMaterial;
        obj.material.uniforms.u_motionMultiplier.value = obj.material.motionMultiplier;
    } else if(obj.material) {
        obj.visible = false;
    }

    _visibleCache.push(obj);
}

function _setObjectAfterState(obj) {
    if(obj.motionMaterial) {
        obj.material = obj._tmpMaterial;
        obj._tmpMaterial = undef;
        if(!exports.skipMatrixUpdate) {
            obj.motionMaterial.uniforms.u_prevModelViewMatrix.value.copy(obj.modelViewMatrix);
        }
    } else {
        obj.visible = true;
    }
}
