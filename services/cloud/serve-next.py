from waitress import serve

import renderer

serve(renderer.app, host='0.0.0.0', port=9004)
