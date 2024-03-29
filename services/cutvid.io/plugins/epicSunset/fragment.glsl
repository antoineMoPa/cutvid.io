/* This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.  */
precision highp float;

varying vec2 UV;
uniform vec2 mouse;
uniform float ratio, time;
uniform sampler2D previous_pass;

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
    
	float highlight = clamp(pow(cos(time * 6.2832 - p.x * 10.0), 20.0), 0.0, 1.0);
	highlight *= cos(p.y * 100.0 + p.x * 20.0);
	
	col.rgb = clamp(col.rgb, 0.0, 1.0);
	
    col.a = 1.0;
	gl_FragColor = col;
}

