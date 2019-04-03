class UserController < ApplicationController
  def current_user_info
    status = nil

    if current_user.nil?
      status = {
        status: "logged_out"
      }
    else
      # sep for separator
      sep = current_user.email.index("@")
      sep = current_user.email.length - sep
      email_summary = current_user.email[0,5]
      email_summary += "..."
      email_summary += current_user.email[-sep,sep]

      status = {
        status: "logged_in",
        email_summary: email_summary,
        seconds_per_month: current_user.seconds_per_month,
        seconds_left_this_month: current_user.seconds_left_this_month
      }
    end

    render :json => status
  end

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

    duration = `mediainfo --Inform="Video;%Duration%" ../downloadables/candidates/#{videoid}/purchased-video-#{videoid}.avi`
    # Milliseconds to seconds
    duration = duration.to_i / 1000

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
