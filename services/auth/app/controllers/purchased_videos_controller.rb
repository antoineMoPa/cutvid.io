class PurchasedVideosController < ApplicationController

  def index
    if current_user.nil?
      return redirect_to '/'
    end
    settings_file = open '../../src/settings.json'
    settings = JSON.parse(settings_file.read)
    @settings = settings

    @videos = PurchasedVideo.where(user_id: current_user.id).limit(10)
  end

end
