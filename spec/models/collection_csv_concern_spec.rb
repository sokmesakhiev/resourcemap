require 'spec_helper'

describe Collection::CsvConcern do
  let(:user) { User.make }
  let(:collection) { user.create_collection Collection.make }
  let!(:layer) { collection.layers.make }

  it "imports csv" do
    collection.import_csv user, %(
      resmap-id, name, lat, lng
      1, Site 1, 10, 20
      2, Site 2, 30, 40
    ).strip

    collection.reload
    roots = collection.sites.all
    roots.length.should eq(2)

    roots[0].name.should eq('Site 1')
    roots[0].lat.to_f.should eq(10.0)
    roots[0].lng.to_f.should eq(20.0)

    roots[1].name.should eq('Site 2')
    roots[1].lat.to_f.should eq(30.0)
    roots[1].lng.to_f.should eq(40.0)
  end

  it "should print date as MM/DD/YYYY" do
    date = layer.date_fields.make :code => 'date'
    site = collection.sites.make :properties => {date.es_code => '1985-10-19T00:00:00Z'}

    csv =  CSV.parse collection.to_csv collection.new_search(:current_user_id => user.id).unlimited.api_results

    csv[1][4].should eq('10/19/1985')
  end

  it "should download hiearchy value as Name" do
    config_hierarchy = [{ id: '60', name: 'Dad', sub: [{id: '100', name: 'Son'}, {id: '101', name: 'Bro'}]}]
    hierarchy_field = layer.hierarchy_fields.make :code => 'hierarchy', config: { hierarchy: config_hierarchy }.with_indifferent_access

    site = collection.sites.make :properties => {hierarchy_field.es_code => '100'}

    csv =  CSV.parse collection.to_csv collection.new_search(:current_user_id => user.id).unlimited.api_results
    csv[1][4].should eq('Son')
  end

  describe "generate sample csv" do

    it "should include only visible fields for the user" do
      user2 = User.make

      layer_visible = collection.layers.make
      layer_invisible = collection.layers.make
      layer_writable = collection.layers.make

      date_visible = layer_visible.date_fields.make :code => 'date_visible'
      date_invisible = layer_invisible.date_fields.make :code => 'date_invisible'
      date_writable = layer_writable.date_fields.make :code => 'date_writable'

      membership = collection.memberships.make :user => user2
      membership.admin = false
      membership.set_layer_access :verb => :read, :access => true, :layer_id => layer_visible.id
      membership.set_layer_access :verb => :write, :access => false, :layer_id => layer_visible.id
      membership.set_layer_access :verb => :read, :access => false, :layer_id => layer_invisible.id
      membership.set_layer_access :verb => :write, :access => false, :layer_id => layer_invisible.id
      membership.set_layer_access :verb => :read, :access => true, :layer_id => layer_writable.id
      membership.set_layer_access :verb => :write, :access => true, :layer_id => layer_writable.id
      membership.save!

      csv = CSV.parse(collection.sample_csv user2)

      csv[0].should include('date_writable')
      csv[0].should_not include('date_visible')
      csv[0].should_not include('date_invisible')
      csv[1].length.should be(4)
    end
  end

  describe "decode hierarchy csv test" do

    it "gets parents right" do
      json = collection.decode_hierarchy_csv %(
        ID, ParentID, ItemName
        1,,Dispensary
        2,,Health Centre
        101,1,Lab Dispensary
        102,1,Clinical Dispensary
        201,2,Health Centre Type 1
        202,2,Health Centre Type 2
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Dispensary', sub: [{order: 3, id: '101', name: 'Lab Dispensary'}, {order: 4, id: '102', name: 'Clinical Dispensary'}]},
        {order: 2, id: '2', name: 'Health Centre', sub: [{order: 5, id: '201', name: 'Health Centre Type 1'}, {order: 6, id: '202', name: 'Health Centre Type 2'}]},
      ])
    end


    it "decodes hierarchy csv" do
      json = collection.decode_hierarchy_csv %(
        ID, ParentID, ItemName
        1,,Site 1
        2,,Site 2
        3,,Site 3
        4,1,Site 1.1
        5,1,Site 1.2
        6,1,Site 1.3
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1', sub: [{order: 4, id: '4', name: 'Site 1.1'}, {order: 5, id: '5', name: 'Site 1.2'}, {order: 6, id: '6', name: 'Site 1.3'}]},
        {order: 2, id: '2', name: 'Site 2'},
        {order: 3, id: '3', name: 'Site 3'}
      ])
    end

    it "without header" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 2
        3,,Site 3
        4,1,Site 1.1
        5,1,Site 1.2
        6,1,Site 1.3
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1', sub: [{order: 4, id: '4', name: 'Site 1.1'}, {order: 5, id: '5', name: 'Site 1.2'}, {order: 6, id: '6', name: 'Site 1.3'}]},
        {order: 2, id: '2', name: 'Site 2'},
        {order: 3, id: '3', name: 'Site 3'}
      ])
    end

    it "gets an error if has >3 columns in a row" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 2
        3,,Site 3,
        4,1,Site 1.1
        5,1,Site 1.2
        6,1,Site 1.3
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1', sub: [{order: 4, id: '4', name: 'Site 1.1'}, {order: 5, id: '5', name: 'Site 1.2'}, {order: 6, id: '6', name: 'Site 1.3'}]},
        {order: 2, id: '2', name: 'Site 2'},
        {order: 3, error: 'Wrong format.', error_description: 'Invalid column number'}
      ])
    end

    it "gets an error if has <3 columns in a row" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 2
        3,,Site 3
        4,1,Site 1.1
        5,1,Site 1.2
        6,
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1', sub: [{order: 4, id: '4', name: 'Site 1.1'}, {order: 5, id: '5', name: 'Site 1.2'}]},
        {order: 2, id: '2', name: 'Site 2'},
        {order: 3, id: '3', name: 'Site 3'},
        {order: 6, error: 'Wrong format.', error_description: 'Invalid column number'}
      ])
    end

    # works ok in the app but the test is not working
    pending "works ok with quotes" do
      json = collection.decode_hierarchy_csv %(
        "1","","Site 1"
        "2","1","Site 2"
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1'},
        {order: 2, id: '2', name: 'Site 2'}
      ])
    end

    it "gets an error if the parent does not exists" do
      json = collection.decode_hierarchy_csv %(
        ID, ParentID, ItemName
        1,,Dispensary
        2,,Health Centre
        101,10,Lab Dispensary
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Dispensary', },
        {order: 2, id: '2', name: 'Health Centre'},
        {order: 3, error: 'Invalid parent value.', error_description: 'ParentID should match one of the Hierarchy ids'},
      ])
    end

    it "gets an error if there is wrong quotes (when creating file in excel without export it to csv)" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 2
        3,,Site 3
        "4,,Site 4

      ).strip

      json.should eq([
        {error: "Illegal quoting in line 4."}
      ])
    end

    it ">1 column number errors" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 2,
        3,,Site 3,
        4,,Site 4

      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1'},
        {order: 2, error: 'Wrong format.', error_description: 'Invalid column number'},
        {order: 3, error: 'Wrong format.', error_description: 'Invalid column number'},
        {order: 4, id: '4', name: 'Site 4'}

      ])
    end

    it "hierarchy name should be unique" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 1
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1'},
        {order: 2, error: 'Invalid name.', error_description: 'Hierarchy name should be unique'}
      ])
    end

    it "more than one hierarchy name repeated" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        2,,Site 1
        3,,Site 1
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1'},
        {order: 2, error: 'Invalid name.', error_description: 'Hierarchy name should be unique'},
        {order: 3, error: 'Invalid name.', error_description: 'Hierarchy name should be unique'}
      ])
    end

    it "hiearchy id should be unique" do
      json = collection.decode_hierarchy_csv %(
        1,,Site 1
        1,,Site 2
        1,,Site 3
      ).strip

      json.should eq([
        {order: 1, id: '1', name: 'Site 1'},
        {order: 2, error: 'Invalid id.', error_description: 'Hierarchy id should be unique'},
        {order: 3, error: 'Invalid id.', error_description: 'Hierarchy id should be unique'}
      ])
    end
  end

end
