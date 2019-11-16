require 'jwt'

class UserController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:sign_out_current_user]

  def make_first_admin
    if current_user.nil?
      return redirect_to "/"
    end

    if current_user.id == 1
      current_user.is_admin = true
      current_user.save!
      return redirect_to "/"
    end

    return redirect_to "/"
  end

  # User list
  def index
    if current_user.nil?
      return redirect_to "/"
    end

    if not current_user.is_admin
      return redirect_to "/"
    end

    @users = User.all()
  end

  def edit
    if current_user.nil?
      return redirect_to "/"
    end

    if not current_user.is_admin
      return redirect_to "/"
    end

    @user = User.find(params[:userid])
  end

  def save
    if current_user.nil?
      return redirect_to "/"
    end

    if not current_user.is_admin
      return redirect_to "/"
    end

    @user = User.find(params[:userid])
    @user.seconds_per_month = params[:seconds_per_month]
    @user.seconds_left_this_month = params[:seconds_left_this_month]
    @user.save!

    render 'edit'
  end

  def jwt_token
    if current_user.nil?
      render :plain => ""
    else
      render :plain => current_user.get_jwt_token()
    end
  end

  def validate_jwt_token
    hmac_secret = Rails.application.credentials.jwt_hmac_secret
    puts params[:token]
    JWT.decode params[:token], hmac_secret

    # Exceptions are thown before we get here in case of bad token

    render :plain => "true"
  end

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
        email_summary: email_summary
      }
    end

    render :json => status
  end

  def sign_out_current_user
    sign_out @user
  end
end
