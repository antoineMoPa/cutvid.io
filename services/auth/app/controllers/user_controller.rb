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
end
