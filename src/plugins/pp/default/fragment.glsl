#version 300 es
precision highp float;

in vec2 UV;
uniform vec2 mouse;
out vec4 out_color;
uniform float ratio, time;
uniform sampler2D texture0;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;

    
    // Position of current point
    vec2 p = vec2(x, y) - vec2(0.5 * ratio, 0.5);
    
    // Some fake camera position 
    vec3 camera = vec3(p.x * 1.0, -10.0, p.y * 1.0);
    float h = 0.0;
    p.y *= 2.0;
    
    vec2 p_backup = p;

    h += 1.1 * cos(p.x * 172.2 - 10.0 * sin(p.y * 20.0)+ time * 6.2832);
    h += 1.1 * cos(p.y * 272.2 + time * 6.2832);
    h += 0.1 * cos(p.x * 311.0 + time * 6.2832);
    h += 0.1 * cos(p.y * 361.0 + time * 6.2832);
    h += 0.2 * cos(p.x * 3.0 + time * 6.2832);
    h += 0.2 * cos(p.y * 5.0 + time * 6.2832);
    
    // Approximate derivative of H with respect to x and y
    float dhx = 0.8 * -sin(p.x * 172.2 - 10.0 * sin(p.y * 20.0) + time * 6.2832);
    float dhy = 0.8 * -sin(p.y * 272.2 + time * 6.2832);
    dhx += 0.1 * -sin(p.x * 311.0 + time * 6.2832);
    dhy += 0.1 * -sin(p.y * 361.0 + time * 6.2832);
    dhx += 0.2 * -sin(p.x * 3.0 + time * 6.2832);
    dhy += 0.2 * -sin(p.y * 5.0 + time * 6.2832);
    
    p.y += 0.004 * h;
    
    vec4 col = vec4(0.0);

    vec2 center = vec2(0.0);

    // Also try:
    //center = mouse;

    // Distance of current point to center of circle
    float d = distance(p, center);
    
    vec3 lamp = vec3(2.0, 10.0, 2.0);
 
    float a = atan(p.y, p.x);
    
    if(p.y < 0.0){
        col.rgba = vec4(0.3, 0.3, 0.5, 1.0);
        
        vec3 normal = normalize(vec3(-1.0,-1.0,dhx + dhy));
        vec3 refl = reflect(lamp - vec3(p,0.0), normal);
        
        // Pretty sure the spec and/or diffuse lighting is wrong here, 
        // But I like the result
        float spec = pow(10.0,-3.0) * pow(dot(refl, camera - vec3(p,0.0)), 4.0);
        float diff = pow(10.0,-2.4) * pow(dot(normal, lamp), 2.0);
        col.rgb += 0.04 * clamp(spec, 0.0, 1.0);
        col.rgb += 0.04 * clamp(diff, 0.0, 1.0);
        col -= 0.6;
    }
    
    p = vec2(x, y) - vec2(0.5 * ratio, 0.5);
    
    
    if(p.y < 0.0){
        p.y *= -1.0 ;
    }
    
    col.r += 0.4;
    col.rg += 1.0 - 2.0 * p.y;
    col.b += 0.4;
    col.rgb *= 1.1 + 0.3 * clamp(1.0 - 0.1 * vec3(0.9, 0.5, 0.4) * 
       pow(4.5 * length(p + vec2(0.0, -0.1)), 10.0), 0.0, 1.0) 
       *
       clamp(pow(4.0 * cos(-p.y * 160.0 + time * 6.2832), 3.0), 0.0, 1.0);
    col.b += 0.1;
    
    if(p_backup.y < 0.0){
        col *= 0.8;
    }
    
    if(p_backup.y < 0.0){
        col.r += 0.7 * clamp(cos(p.x * 10.0 - p.x * pow(2.0 - p.y,2.0) * 10.0),0.4, 0.5) - 0.3;
        col.r += 0.7 * clamp(cos(pow(1.0 + p.y, 2.0) * 100.0 - time * 6.2832),0.4, 0.5) - 0.3;
    }
    
	vec2 uv = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
	

	uv.y -= 0.04;
	
	uv -= 0.5;
	
	uv *= 1.0 + 0.1 * cos(time * 6.2832 + 0.3 * tan(p.x * 2.0 + time * 6.2832) + p.y * 10.0);
	
	uv += 0.5;
	
    vec4 tex = texture(texture0,  uv);
	vec4 tex1 = texture(texture0,  uv + vec2( 0.000, 0.004));
	vec4 tex2 = texture(texture0,  uv + vec2( 0.004, 0.000));
	vec4 tex3 = texture(texture0,  uv + vec2( 0.000,-0.004));
	vec4 tex4 = texture(texture0,  uv + vec2(-0.004, 0.000));

	tex += tex1 * 0.2;
	tex += tex2 * 0.2;
	tex += tex3 * 0.2;
	tex += tex4 * 0.2;
	
	float highlight = clamp(pow(cos(time * 6.2832 - p.x * 10.0), 20.0), 0.0, 1.0);
	highlight *= cos(p.y * 100.0 + p.x * 20.0);
	
	tex.rgb += 0.5 * highlight * tex.a;
	
	col = tex.a * tex + (1.0 - tex.a) * col;
    
    col.a = 1.0;
    out_color = col;
}

