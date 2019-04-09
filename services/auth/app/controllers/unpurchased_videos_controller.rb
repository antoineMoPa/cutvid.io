class UnpurchasedVideosController < ApplicationController
  skip_before_action :verify_authenticity_token, only: :consume

  def consume
    if current_user.nil? and params[:unitbuy].nil?
      response = {
        error: "user-not-logged"
      }
      return render :json => response
    end

    videoid = params[:videoid]
    # Sanitize (important, we'll pass this to a shell)
    videoid.gsub!(/[^a-zA-Z0-9]/, '')

    exists_test = `ls ../downloadables/candidates/#{videoid}/purchased-video-#{videoid}.avi | wc -l`

    if exists_test.to_i < 1
      response = {
        error: "no-candidate-found-for-asked-id",
        md: "ls ../downloadables/candidates/#{videoid}/purchased-video-#{videoid}.avi | wc -l"
      }
      return render :json => response
    end

    duration = `mediainfo --Inform="Video;%Duration%" ../downloadables/candidates/#{videoid}/purchased-video-#{videoid}.avi`
    # Milliseconds to seconds
    duration = duration.to_i / 1000

    # Save purchased video
    purchased_video = PurchasedVideo.new
    purchased_video.videoid = videoid
    purchased_video.duration = duration
    if not current_user.nil?
      purchased_video.user_id = current_user.id
    end
    purchased_video.save!

    if not current_user.seconds_left_this_month.nil? and
      current_user.seconds_left_this_month > duration
      # Make available
      `mv ../downloadables/candidates/#{videoid} ../downloadables/public`

      current_user.seconds_left_this_month -= duration
      current_user.save()

      response = {
        success: "video-purchased",
        seconds_left: current_user.seconds_left_this_month,
        seconds_consumed: duration,
      }

      render :json => response
    else
      response = {
        error: "not-enough-seconds",
        seconds_left: current_user.seconds_left_this_month,
        duration_asked: duration
      }
      render :json => response
    end
  end

end
