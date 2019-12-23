require 'jwt'
require 'net/http'
require 'uri'

class UserController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:sign_out_current_user], raise: false

  def make_first_admin
    if current_user.nil?
      return redirect_to "/auth/"
    end

    if current_user.id == 1
      current_user.is_admin = true
      current_user.save!
      return redirect_to "/auth/"
    end

    return redirect_to "/auth/"
  end

  # User list
  def index
    if current_user.nil?
      return redirect_to "/auth/"
    end

    if not current_user.is_admin
      return redirect_to "/auth/"
    end

    @users = User.all()
  end

  def edit
    if current_user.nil?
      return redirect_to "/auth/"
    end

    if not current_user.is_admin
      return redirect_to "/auth/"
    end

    @user = User.find(params[:userid])
  end

  def save
    if current_user.nil?
      return redirect_to "/auth/"
    end

    if not current_user.is_admin
      return redirect_to "/auth/"
    end

    @user = User.find(params[:userid])
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

  def paypal_api_domain
    if Rails.env.production?
      api_domain = "api.paypal.com"
    else
      api_domain = "api.sandbox.paypal.com"
    end
    return api_domain
  end

  def get_paypal_token
    paypal_client_id = Rails.application.credentials.paypal_client_id
    paypal_secret = Rails.application.credentials.paypal_secret
    path = '/v1/oauth2/token'
    uri = URI("https://" + paypal_api_domain + path)

    req = Net::HTTP::Post.new(uri)

    req.body = "grant_type=client_credentials&response_type=token"
    req.basic_auth paypal_client_id, paypal_secret

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) {|http|
      http.request(req)
    }

    # after MVP TODO: cache token for some time

    return JSON.parse(res.body)['access_token']
  end

  def validate_render_credit_order
    order_id = params[:order_id]

    net = Net::HTTP.new(paypal_api_domain, 443)
    net.use_ssl = true
    headers = {'Authorization': 'Bearer ' + get_paypal_token}
    response = net.request_get("/v2/checkout/orders/" + order_id, headers)

    # This is pretty MVP-ish.
    # We should check for date + already activated orders
    # Anyway we'll see in the logs if people start doing that

    if response.code.to_i == 200
      current_user.increment(:render_credits, 5)
      current_user.save
      render :plain => "success"
    else
      render :plain => "error"
    end
  end

  def consume_render_credits
    if request.local?
      user = User.find(params[:user_id].to_i)

      count = params[:count].to_i

      if user.render_credits >= count
        user.decrement(:render_credits, count)
        user.save!
        render :plain => "success"
      else
        render :plain => "Error: Not enough credits"
      end
    else
      render :plain => "Error: non-local access"
    end
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
        email_summary: email_summary,
        render_credits: current_user.render_credits
      }
    end

    render :json => status
  end

  def notify_render
    if request.local?
      user = User.find(params[:user_id].to_i)
      UserMailer.new_render(user).deliver
    end
  end

  def sign_out_current_user
    sign_out @user
  end
end
