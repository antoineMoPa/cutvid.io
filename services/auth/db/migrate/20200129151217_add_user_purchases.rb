class AddUserPurchases < ActiveRecord::Migration[5.2]
  def change
    create_table :user_purchases do |t|
      ## Database authenticatable
      t.references :user, foreign_key: true
      t.datetime :purchase_date
      t.string :purchased_premium_tier
      t.string :purchased_credit_amount
      t.string :order_id
    end
  end
end
