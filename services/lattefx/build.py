"""
Combine all javascript files into one
"""

all_js_files = [
    "./libs/vue.js",
    "./libs/utils.js",
    "./libs/gif.js",
    "./shader_program.js",
    "./shader_player_webgl.js",
    "./components/sequence_effects.js",
    "./components/text_box.js",
    "./components/panel_selector.js",
    "./components/effects_selector.js",
    "./components/buy_video_lq.js",
    "./components/buy_render_credits.js",
    "./components/scene_template_selector.js",
    "./components/sequencer.js",
    "./libs/jszip.min.js",
    "./components/auth.js",
    "./components/projects.js",
    "./components/ui.js",
    "./components/player.js",
    "./app.js"
]

all_js = ""

for filename in all_js_files:
    with open(filename) as f:
        all_js += ";" + f.read()

with open("app.build.js", "w") as target:
    target.write(all_js)
