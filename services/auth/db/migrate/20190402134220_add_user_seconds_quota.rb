class AddUserSecondsQuota < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :seconds_per_month, :integer
    add_column :users, :seconds_left_this_month, :integer
  end
end
