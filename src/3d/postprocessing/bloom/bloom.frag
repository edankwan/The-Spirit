
uniform sampler2D u_texture;
uniform sampler2D u_blurTexture;

uniform float u_amount;

varying vec2 v_uv;

void main()
{

    vec3 baseColor = texture2D(u_texture, v_uv).rgb;
    vec3 blurColor = texture2D(u_blurTexture, v_uv).rgb;
    vec3 color = mix(baseColor, 1.0 - ((1.0 - baseColor) * (1.0 - blurColor)), u_amount);
    // vec3 color = mix(baseColor, max(baseColor, blurColor), u_amount);

    gl_FragColor = vec4(color, 1.0);

}
