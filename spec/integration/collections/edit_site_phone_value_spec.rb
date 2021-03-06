require 'spec_helper' 

describe "collections" do 
 
  it "should edit site phone values", js:true do   
    
    current_user = User.make(:email => 'user@manas.com.ar', :password => '1234567', :phone_number => '855123456789')
    collection = create_collection_for (current_user)
    member = User.make(:email => 'member@member.com')
    member.memberships.make collection: collection
    layer = create_layer_for (collection)
    phone = layer.phone_fields.make(:name => 'Phone', :code => 'phone')
    collection.sites.make properties: { phone.es_code => '1558769876' }
    login_as (current_user)
    visit collections_path
    find(:xpath, '//div[@id="collections-main"]/div[1]/div[2]/table/tbody/tr[1]/td/button').click
    find(:xpath, '//div[@id="collections-main"]/div[1]/div[2]/table/tbody/tr[1]/td/button').click
    click_link 'Edit Site'
    sleep 2
    find("input[placeholder='85512345678']").set "1157804274"
    click_button 'Done'
    sleep 3 
    page.should_not have_content '1558769876'
    sleep 2
    page.should have_content '1157804274'
    sleep 2
    page.save_screenshot "Edit_site_Phone_value.png"
  end
end
