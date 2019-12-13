# Preview all emails at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview

  def new_signup
    UserMailer.new_signup(User.first)
  end

  def new_render
    UserMailer.new_render(User.first)
  end

end
