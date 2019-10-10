Rails.application.routes.draw do
  devise_for :users
  root to: "home#index"
  get '/current_user', to: 'user#current_user_info'
  get '/simple_order', to: 'simple_order#index'
end
