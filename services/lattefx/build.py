"""
Combine all javascript files into one

This should only combine a minimal set of files for the app to boot.

Big scripts that can be loaded on demand should be loaded on demand with
utils.load_script.
"""

def build():
    all_js_files = [
        "./libs/vue.js",
        "./api.js",
        "./libs/utils.js",
        "./libs/video-utils.js",
        "./libs/dev.js",
        "./FileStore.js",
        "./shader_program.js",
        "./shader_player_webgl.js",
        "./components/sequence_effects.js",
        "./components/text_box.js",
        "./components/panel_selector.js",
        "./components/effects_selector.js",
        "./components/download_video.js",
        "./components/render_settings.js",
        "./components/sequencer.js",
        "./components/auth.js",
        "./components/projects.js",
        "./components/ui.js",
        "./components/player.js",
        "./components/console.js",
        "./app.js"
    ]

    all_js = ""

    for filename in all_js_files:
        with open(filename) as f:
            all_js += ";" + f.read()

    with open("app.build.js", "w") as target:
        target.write(all_js)

if __name__ == "__main__":
    build()
