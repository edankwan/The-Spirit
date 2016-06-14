var Effect = require('../Effect');
var effectComposer = require('../effectComposer');
var fboHelper = require('../../fboHelper');

var glslify = require('glslify');
var THREE = require('three');

var undef;

var exports = module.exports = new Effect();
var _super = Effect.prototype;

exports.init = init;
exports.render = render;

exports.blurRadius = 1.3;
exports.amount = 0.3;

var _blurMaterial;

var BLUR_BIT_SHIFT = 1;

function init() {

    _super.init.call(this, {
        uniforms: {
            u_blurTexture: { type: 't', value: undef },
            u_amount: { type: 'f', value: 0 }
        },
        fragmentShader: glslify('./bloom.frag')
    });

    _blurMaterial = new THREE.RawShaderMaterial({
        uniforms: {
            u_texture: { type: 't', value: undef },
            u_delta: { type: 'v2', value: new THREE.Vector2() }
        },
        vertexShader: fboHelper.vertexShader,
        fragmentShader: fboHelper.rawShaderPrefix + glslify('./bloomBlur.frag')
    });

}


function render(dt, renderTarget, toScreen) {

    var tmpRenderTarget1 = effectComposer.getRenderTarget(BLUR_BIT_SHIFT);
    var tmpRenderTarget2 = effectComposer.getRenderTarget(BLUR_BIT_SHIFT);
    effectComposer.releaseRenderTarget(tmpRenderTarget1, tmpRenderTarget2);

    var blurRadius = exports.blurRadius;
    _blurMaterial.uniforms.u_texture.value = renderTarget;
    _blurMaterial.uniforms.u_delta.value.set(blurRadius / effectComposer.resolution.x, 0);

    fboHelper.render(_blurMaterial, tmpRenderTarget1);

    blurRadius = exports.blurRadius;
    _blurMaterial.uniforms.u_texture.value = tmpRenderTarget1;
    _blurMaterial.uniforms.u_delta.value.set(0, blurRadius / effectComposer.resolution.y);
    fboHelper.render(_blurMaterial, tmpRenderTarget2);

    this.uniforms.u_blurTexture.value = tmpRenderTarget2;
    this.uniforms.u_amount.value = exports.amount;
    _super.render.call(this, dt, renderTarget, toScreen);

}
