Rails.application.routes.draw do
  devise_for :users
  root to: "home#index"

  get '/current_user', to: 'user#current_user_info'
  get '/consume/:videoid', to: 'user#consume'

  get '/purchased_videos', to: 'purchased_videos#index'

end
