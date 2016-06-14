
uniform sampler2D u_texture;
uniform vec2 u_delta;

varying vec2 v_uv;

void main()
{

    vec3 color = texture2D( u_texture, v_uv ).rgb * 0.1633;

    vec2 delta = u_delta;
    color += texture2D( u_texture,  v_uv - delta ).rgb * 0.1531;
    color += texture2D( u_texture,  v_uv + delta ).rgb * 0.1531;

    delta += u_delta;
    color += texture2D( u_texture,  v_uv - delta ).rgb * 0.12245;
    color += texture2D( u_texture,  v_uv + delta ).rgb * 0.12245;

    delta += u_delta;
    color += texture2D( u_texture,  v_uv - delta ).rgb * 0.0918;
    color += texture2D( u_texture,  v_uv + delta ).rgb * 0.0918;

    delta += u_delta;
    color += texture2D( u_texture,  v_uv - delta ).rgb * 0.051;
    color += texture2D( u_texture,  v_uv + delta ).rgb * 0.051;

    gl_FragColor = vec4(color, 1.0);

}
