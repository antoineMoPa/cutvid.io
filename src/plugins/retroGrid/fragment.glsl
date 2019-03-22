// Fragment shader
precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time, r, g, b;
uniform float ratio;
uniform vec2 mouse;
uniform sampler2D texture0;

#define PI 3.1416
#define PI2 (3.1416 * 2.0)
#define grid_col vec4(r,g,b,1.0)

vec4 lines(vec2 pos){
    vec4 col = vec4(0.0);

    float size = 80.0;
    
    if(cos(size * pos.x) > 0.95){
        col = grid_col;
        col.rgb *= cos(size * 4.0 * pos.x);
    }
    
    return col;
}

vec4 grid(vec2 pos){
    vec4 col = vec4(0.0);
    
    col += lines(pos);
    col += lines(vec2(pos.y,pos.x));
    
    return col;
}

vec4 grid_with_angle(vec2 pos, float t){
    vec4 col = vec4(0.0);

    float line_y = 0.33;
    
    float intensity = 0.8 + 0.2 * cos(PI2 * time) * cos(20.0 * pos.y);
    
    if(pos.y > 0.6){
        return col;
    }
    
    // The line at the middle of the screen
    if(pos.y > line_y - 0.05){
        float fac = 1.0 - pow((pos.y - line_y + 0.005)/0.025, 2.0);

        fac *= 0.8;
        
        if(fac > 0.0){
            fac = 0.5 * fac + 6.0 * pow(fac, 8.0);
            col = 0.8 * grid_col * fac;
        }
    }

    // The grid
    if(pos.y < line_y){
        pos.x -= 0.5 * ratio;
        pos.x *= pos.y + 0.5;
        pos.y += 0.08 * t;
        
        col += grid(pos) * intensity;
    }
    
    return col;
}

vec4 line(vec2 pos, vec2 pt1, vec2 pt2, float width, float t){
    vec4 col = vec4(0.0);
    
    width /= 2.0;
    
    vec2 ab = pt2 - pt1;
    vec2 ac = pos - pt1;
    
    vec2 perp = vec2(-ab.y, ab.x);
    float dotp = dot(perp,ac);
    float dotab = dot(ac,ab)/length(ab);
    
    if(dotp < width && dotp > -width){
        if(dotab > 0.0 && dotab < length(ab)){
            float timefac = abs(0.2 * cos(PI * time + 4.0 * dotab));
            col +=
                grid_col * (1.0 - pow(dotp/width,2.0)) * timefac;
        }
    }
    
    return col;
}

vec4 triangle(vec2 pos, float t){
    vec4 col = vec4(0.0);
    
    pos.x += 0.01 * cos(PI2 * time);
    
    pos.y = 1.0 - pos.y;
    
    col += line(pos, vec2(0.2,0.3), vec2(0.5,0.8), 0.01, t);
    col += line(pos, vec2(0.5,0.8), vec2(0.8,0.3), 0.01, t);
    col += line(pos, vec2(0.8,0.3), vec2(0.2,0.3), 0.01, t);
    
    return col;
}

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;

    // Background
     vec4 col = vec4(0.02);
    
    col += 0.9 * grid_with_angle(vec2(x,y), time);
    
	col.a = 1.0;
    
    gl_FragColor = col;
}
