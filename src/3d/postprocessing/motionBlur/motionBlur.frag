uniform sampler2D u_texture;
uniform sampler2D u_linesTexture;
uniform float u_lineAlphaMultiplier;

varying vec2 v_uv;

void main() {

    vec3 base = texture2D( u_texture, v_uv.xy ).rgb;
    vec4 lines = texture2D( u_linesTexture, v_uv.xy );

    vec3 color = (base + lines.rgb * u_lineAlphaMultiplier) / (lines.a * u_lineAlphaMultiplier + 1.0);

    gl_FragColor = vec4( color, 1.0 );

}
