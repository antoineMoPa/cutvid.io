class RemoveRenderCreditRenewDate < ActiveRecord::Migration[5.2]
  def change
    remove_column :users, :render_credit_renew_date
  end
end
