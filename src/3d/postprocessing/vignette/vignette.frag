uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_aspect;

uniform float u_reduction;
uniform float u_boost;

varying vec2 v_uv;

void main() {

  vec4 color = texture2D( u_texture, v_uv );

  vec2 center = u_resolution * 0.5;
  float vignette = length( v_uv - vec2(0.5) ) * u_aspect;
  vignette = u_boost - vignette * u_reduction;

  color.rgb *= vignette;
  gl_FragColor = color;

}
