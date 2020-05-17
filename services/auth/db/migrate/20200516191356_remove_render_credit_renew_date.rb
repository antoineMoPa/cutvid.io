class RemoveRenderCreditRenewDate < ActiveRecord::Migration[5.2]
  def change
    # That column was ever only in my dev env?
    # remove_column :users, :render_credit_renew_date
  end
end
