from waitress import serve

import cloud

serve(cloud.app, host='0.0.0.0', port=8004)
