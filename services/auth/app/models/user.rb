require 'jwt'

class User < ApplicationRecord
  extend Devise::Models
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable


  after_create :init_user

  def init_user
    # Set default render credits amount
    self.update_render_credits
    UserMailer.new_signup(self).deliver
  end

  def render_credits
    if super.nil?
      self.render_credits_per_week = 2
      self.render_credits = self.render_credits_per_week
      self.render_credits_last_renew_date = DateTime.now
      self.save!
    else
      seconds_diff = DateTime.now.to_i - self.render_credits_last_renew_date.to_i
      one_week = 3600 * 24 * 7

      if seconds_diff > one_week
        # Only add credits
        if super < self.render_credits_per_week
          self.render_credits = self.render_credits_per_week
          self.render_credits_last_renew_date = DateTime.now
          self.save!
        end
      end
    end

    return super
  end

  def get_jwt_token
    hmac_secret = Rails.application.credentials.jwt_hmac_secret
    # Tokens will be good for 10 minutes
    exp = Time.now.to_i + 60 * 10
    payload = { user_id: self.id, exp: exp}
    token = JWT.encode payload, hmac_secret, 'HS256'

    return token
  end

end
