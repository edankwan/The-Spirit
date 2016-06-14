
uniform float u_motionMultiplier;

varying vec2 v_motion;

void main() {

        gl_FragColor = vec4( v_motion * u_motionMultiplier, gl_FragCoord.z, 1.0 );

}
