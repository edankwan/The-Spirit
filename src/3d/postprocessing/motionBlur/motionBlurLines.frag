uniform sampler2D u_motionTexture;
uniform float u_depthTest;
uniform float u_opacity;
uniform float u_leaning;
uniform float u_fadeStrength;
uniform float u_depthBias;
uniform float u_useDepthWeight;

varying vec3 v_color;
varying float v_ratio;
varying float v_depth;
varying vec2 v_uv;

void main() {

    vec3 motion = texture2D( u_motionTexture, v_uv ).xyz;

    float alpha = smoothstep(0.0, u_leaning, v_ratio) * (1.0 - smoothstep (u_leaning, 1.0, v_ratio));

    alpha = pow(alpha, u_fadeStrength) * u_opacity;

    if(alpha < 0.00392157) {
        discard;
    }

    float threshold = v_depth * step(0.0001, motion.z);
    alpha *= max(1.0 - u_depthTest, smoothstep(threshold - u_depthBias, threshold, motion.z));

    gl_FragColor = vec4( v_color * alpha, alpha );

}
