Rails.application.routes.draw do
  devise_for :users
  root to: "home#index"

  get '/users/make_first_admin', to: 'user#make_first_admin'
  get '/users/list', to: 'user#index'
  get '/users/:userid/edit', to: 'user#edit'
  post '/users/:userid/edit', to: 'user#save'
  
  
  get '/current_user', to: 'user#current_user_info'
  get '/consume/:videoid', to: 'user#consume'

  get '/purchased_videos', to: 'purchased_videos#index'
  
end
