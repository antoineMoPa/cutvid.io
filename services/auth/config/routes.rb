Rails.application.routes.draw do
  devise_for :users
  root to: "home#index"

  get '/current_user', to: 'user#current_user_info'
end
