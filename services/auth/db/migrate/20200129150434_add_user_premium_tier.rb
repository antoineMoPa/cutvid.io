class AddUserPremiumTier < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :premium_tier, :integer
  end
end
