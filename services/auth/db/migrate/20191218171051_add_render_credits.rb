class AddRenderCredits < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :render_credits, :integer
    add_column :users, :render_credits_per_week, :integer
    add_column :users, :render_credits_last_renew_date, :datetime
  end
end
