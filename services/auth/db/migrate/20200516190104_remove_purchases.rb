class RemovePurchases < ActiveRecord::Migration[5.2]
  def change
    drop_table :user_purchases
    remove_column :users, :render_credits
    remove_column :users, :render_credits_per_week
    remove_column :users, :render_credits_last_renew_date
  end
end
