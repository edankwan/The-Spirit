varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

uniform vec2 u_resolution;
uniform sampler2D u_texture;

varying vec2 v_uv;

#pragma glslify: fxaa = require(glsl-fxaa/fxaa.glsl)

void main() {

    vec2 fragCoord = v_uv * u_resolution;

    gl_FragColor = fxaa(u_texture, fragCoord, u_resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);

}
