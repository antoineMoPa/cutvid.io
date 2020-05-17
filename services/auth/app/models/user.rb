require 'jwt'

class User < ApplicationRecord
  extend Devise::Models
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  after_create :init_user

  def init_user
    UserMailer.new_signup(self).deliver
  end

  def get_jwt_token
    hmac_secret = Rails.application.credentials.jwt_hmac_secret
    # Tokens will be good for 10 minutes
    exp = Time.now.to_i + 60 * 10
    payload = { user_id: self.id, premium_tier: self.premium_tier, exp: exp}
    token = JWT.encode payload, hmac_secret, 'HS256'

    return token
  end

end
