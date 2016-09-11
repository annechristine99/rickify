class CreatePictures < ActiveRecord::Migration[5.0]
  def change
    create_table :pictures do |t|
      t.string :url
      t.references :user, foreign_key: true
    end
  end
end
