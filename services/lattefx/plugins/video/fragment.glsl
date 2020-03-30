precision highp float;

varying vec2 UV;
varying vec2 lastUV;
uniform sampler2D previous_layer;
uniform vec2 mouse;
uniform float ratio, time, isLoaded, opacity;
uniform float videoWidth, videoHeight, videoScale, offsetTop, offsetLeft;
uniform sampler2D video;

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;

    vec2 videoUV = UV * vec2(1.0, -1.0) + vec2(0.0, 1.0);
    float videoRatio = videoHeight / videoWidth * ratio;
    // Apply aspect ratio
    videoUV.x *= videoRatio;


    // Apply scale
    videoUV.x -= offsetLeft;
    videoUV.y -= offsetTop;
    videoUV *= 1.0/videoScale;

    vec4 video = texture2D(video, videoUV);

    // Remove parts outside UV
    video *= 1.0 - step(1.0, videoUV.x);
    video *= 1.0 - step(1.0, videoUV.y);
    video *= step(0.0, videoUV.x);
    video *= step(0.0, videoUV.y);

    vec4 last = texture2D(previous_layer, lastUV);

    if(isLoaded < 0.5){ // Could be optimized!
      video = vec4(0.0,0.0,0.0,1.0);
    }

    video.a *= opacity;

    //vec4 col = (1.0 - video.a) * last + video.a * video;
    vec4 col = video * video.a + (1.0 - video.a) * last;

    gl_FragColor = col;
}
