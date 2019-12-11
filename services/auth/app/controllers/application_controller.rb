class ApplicationController < ActionController::Base
  # CSRF tokens mess with the iframe
  skip_before_action :verify_authenticity_token, raise: false
end
