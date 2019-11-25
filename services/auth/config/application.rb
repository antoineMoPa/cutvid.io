require_relative 'boot'

require 'rails/all'
require 'json'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Auth
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2
    config.relative_url_root = "/auth"

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.
    settings_file = open '../lattefx/settings.json'
    settings = JSON.parse(settings_file.read)

    config.action_dispatch.default_headers = {
      'Access-Control-Allow-Origin' => settings['app'],
      'Access-Control-Request-Method' => 'GET, POST'
    }
  end
end
