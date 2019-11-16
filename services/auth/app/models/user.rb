require 'jwt'

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  def get_jwt_token
    hmac_secret = Rails.application.credentials.jwt_hmac_secret
    # Tokens will be good for 10 minutes
    exp = Time.now.to_i + 60 * 10
    payload = { user_id: self.id, exp: exp}
    token = JWT.encode payload, hmac_secret, 'HS256'

    return token
  end

end
