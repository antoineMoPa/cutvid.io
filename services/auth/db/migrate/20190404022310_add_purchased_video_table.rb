class AddPurchasedVideoTable < ActiveRecord::Migration[5.2]
  def change
    create_table :purchased_videos do |t|
      t.string :videoid
      t.integer :duration
      t.references :user, index: true
      t.timestamps
    end
  end
end
