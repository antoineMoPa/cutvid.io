Rails.application.routes.draw do
  root to: "home#index"

  variant_name = Rails.configuration.lattefx_settings["variant_name"]
  root_url = "/auth"

  if variant_name != "prod"
    root_url += "-" + variant_name
  end

  # In prod, we have different root path for:
  #  - normal app
  #  - next version
  #  - variant A and B (A/B testing)
  scope root_url do
    # :as => :user_root is for proper redirection in devise
    # (else we get redirected to home)
    root to: "home#index", :as => :user_root

    devise_for :users

    get '/current_user', to: 'user#current_user_info'
    get '/validate_render_credit_order/:order_id', to: 'user#validate_render_credit_order'
    get '/consume_render_credits/:user_id/:count', to: 'user#consume_render_credits'
    get '/notify_render/:user_id/:render_id', to: 'user#notify_render'
    get '/jwt_token', to: 'user#jwt_token'
    get '/validate_jwt_token', to: 'user#validate_jwt_token'

    get '/simple_order', to: 'simple_order#index'

    delete '/sign_out', to: 'user#sign_out_current_user'
  end
end
