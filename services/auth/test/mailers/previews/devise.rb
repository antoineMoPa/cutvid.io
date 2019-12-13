class Devise::MailerPreview < ActionMailer::Preview

  # hit http://localhost:8000/rails/mailers/devise

  def confirmation_instructions
    # We don't currently send confirmations
    Devise::Mailer.confirmation_instructions(User.first, {})
  end

  def reset_password_instructions
    Devise::Mailer.reset_password_instructions(User.first, {})
  end

  def unlock_instructions
    Devise::Mailer.unlock_instructions(User.first, {})
  end
end
