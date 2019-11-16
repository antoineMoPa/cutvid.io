Rails.application.routes.draw do
  devise_for :users
  root to: "home#index"

  get '/current_user', to: 'user#current_user_info'
  get '/jwt_token', to: 'user#jwt_token'
  get '/validate_jwt_token', to: 'user#validate_jwt_token'

  get '/simple_order', to: 'simple_order#index'

  get '/iframe/save_project', to: 'iframe#save_project'

  delete '/sign_out', to: 'user#sign_out_current_user'

end
