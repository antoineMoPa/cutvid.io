class AddDeletedFieldToPurchasedVideos < ActiveRecord::Migration[5.2]
  def change
    add_column :purchased_videos, :deleted, :boolean
  end
end
