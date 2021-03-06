class Api::MembershipsController < ApplicationController
  protect_from_forgery :except => [:create, :update, :register_new_member, :destroy_member]
  USER_NAME, PASSWORD = 'iLab', '1c4989610bce6c4879c01bb65a45ad43'

  # POST /user
  def create
    user = User.new(params[:user])
    role = params[:role]
    collection = Collection.find(params[:collection_id])
    if user.save
      if !user.memberships.where(:collection_id => collection.id).exists?
        if role == "Admin"
          user.memberships.create! admin: false, :collection_id => collection.id
          membership = collection.memberships.find_by_user_id user.id
          layer_id = params[:layer_id]? params[:layer_id] : collection.layers.first.id
          membership.set_layer_access({:verb => "read", :access => true, :layer_id => layer_id})
        elsif role == "Super Admin"
          user.memberships.create! admin: true, :collection_id => collection.id
        end
      end
      render :json => params[:user], :status => :ok
    else
      render :json => params[:user], :status => :unauthorized
    end
  end

  def register_new_member
    if (params[:user][:email].strip.length == 0)
      params[:user][:email] = User.generate_default_email
    end
    collection = Collection.find_by_id(params[:collection_id])
    params[:user][:password] = User.generate_random_password if params[:user]
    if (User.find_all_by_phone_number(params[:user][:phone_number]).count == 0)
      user = User.create params[:user] if params[:user]    
      user.confirmed_at = Time.now
      if user.save!
        user = User.find_by_email params[:user][:email]
        user.memberships.create! admin: false, user_id: user.id, collection_id: collection.id
        membership = collection.memberships.find_by_user_id user.id
        user_display_name = User.generate_user_display_name user  
        if membership
          collection.layers.each do |l|
            membership.set_layer_access :access => true, :layer_id => l.id, :verb => "write"
          end 
        end
        layer_memberships = collection.layer_memberships.all.inject({}) do |hash, membership|
          (hash[membership.user_id] ||= []) << membership
          hash
        end
        render :json => params[:user], :status => :ok
      else
        render json: :unsaved
      end 
    else
      render json: {status: :phone_existed}
    end
  end

  def update
    if (params["user"]["email"])
      user = User.find_by_email(params["user"]["email"])
    else
      user = User.find_by_phone_number(params["reporter_phone"])
    end
    role = params[:role]
    begin
      if user.update_attributes!(params[:user])
        if role == "Admin"
          collection = Collection.find(params[:collection_id])
          member = collection.memberships.find_by_user_id(user.id)
          member.update_attributes! admin: false
          layer_id = params[:layer_id]? params[:layer_id] : collection.layers.first.id
          member.set_layer_access({:verb => "read", :access => true, :layer_id => layer_id})
        elsif role == "Super Admin"
          member = user.memberships.find_by_collection_id(params[:collection_id])
          member.update_attributes! admin: true
        end
        render :json => params[:user], :status => :ok
      else
        render :json => params[:user], :status => :unauthorized
      end
    rescue
      render :json => params[:user], :status => :unauthorized
    end
  end

  def destroy_member
    if (params["user"]["phone_number"])
      user = User.find_by_phone_number(params["user"]["phone_number"])
      role = params[:role]
      if user.memberships.destroy_all and user.destroy
        render :json => params[:user], :status => :ok
      else
        render :json => params[:user], :status => :unauthorized
      end
    else
      render :json => {}.to_json, :status => :unauthorized
    end
    
  end

  def authenticate
    authenticate_or_request_with_http_basic 'Dynamic Resource Map - HTTP' do |username, password|
      USER_NAME == username && PASSWORD == Digest::MD5.hexdigest(password)
    end
  end
end
