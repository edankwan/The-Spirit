// chunk(common);
// chunk(fog_pars_fragment);
// chunk(shadowmap_pars_fragment);

varying float vLife;
uniform vec3 color1;
uniform vec3 color2;

void main() {

    vec3 outgoingLight = mix(color2, color1, smoothstep(0.0, 0.7, vLife));

    // chunk(shadowmap_fragment);

    outgoingLight *= shadowMask;//pow(shadowMask, vec3(0.75));

    // chunk(fog_fragment);
    // chunk(linear_to_gamma_fragment);

    gl_FragColor = vec4( outgoingLight, 1.0 );

}
