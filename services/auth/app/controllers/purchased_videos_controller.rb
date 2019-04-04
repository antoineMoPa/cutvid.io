class PurchasedVideosController < ApplicationController

  def index
    if current_user.nil?
      return redirect_to '/'
    end
    @videos = PurchasedVideo.where(user_id: current_user.id)
  end

end
