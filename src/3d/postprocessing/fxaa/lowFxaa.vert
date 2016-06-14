varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 u_resolution;

varying vec2 v_uv;

#pragma glslify: texcoords = require(glsl-fxaa/texcoords.glsl)

void main() {

   vec2 fragCoord = uv * u_resolution;
   texcoords(fragCoord, u_resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);

    v_uv = uv;
    gl_Position = vec4( position, 1.0 );

}
