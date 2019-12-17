class UserMailer < ApplicationMailer
  default :from => 'noreply@lattefx.com'

  def new_signup(user)
    @user = user
    mail( :to => @user.email,
          :subject => 'Welcome to LatteFX!' )
  end

  def new_render(user)
    mail( :to => user.email)
  end


end
