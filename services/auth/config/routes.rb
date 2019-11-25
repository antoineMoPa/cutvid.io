Rails.application.routes.draw do
  root to: "home#index"

  scope "/auth" do
    root to: "home#index"

    devise_for :users

    get '/current_user', to: 'user#current_user_info'
    get '/jwt_token', to: 'user#jwt_token'
    get '/validate_jwt_token', to: 'user#validate_jwt_token'

    get '/simple_order', to: 'simple_order#index'

    delete '/sign_out', to: 'user#sign_out_current_user'
  end

end
