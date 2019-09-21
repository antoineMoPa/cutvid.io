class PurchasedVideosController < ApplicationController

  def index
    if current_user.nil?
      return redirect_to '/'
    end
    settings_file = open '../lattefx/settings.json'
    settings = JSON.parse(settings_file.read)
    @settings = settings

    @videos = PurchasedVideo.where(user_id: current_user.id, deleted: [nil, false]).limit(100)
  end

  def delete
    if current_user.nil?
      return redirect_to '/'
    end

    video = PurchasedVideo.where(user_id: current_user.id, videoid: params[:videoid], deleted: [nil, false]).first

    if video.nil?
      return redirect_to '/purchased_videos', :flash => { :alert => "This video does not exist in our database." }
    end

    `rm ../downloadables/public/#{video.videoid}/*`
    `rmdir ../downloadables/public/#{video.videoid}`

    video.deleted = true;
    video.save()

    return redirect_to '/purchased_videos', :flash => { :notice => "Your video was deleted" }

  end
end
