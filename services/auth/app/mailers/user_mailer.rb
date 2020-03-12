class UserMailer < ApplicationMailer
  default :from => 'noreply@cutvid.io'

  def new_signup(user)
    @user = user
    mail( :to => @user.email,
          :subject => 'Welcome to cutvid.io!' )
  end

  def new_render(user)
    mail( :to => user.email)
  end


end
