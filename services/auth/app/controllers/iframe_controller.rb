class IframeController < ApplicationController
  def save_project
    if current_user.nil?
      return redirect_to "/users/sign_in"
    end
  end
end
