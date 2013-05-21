ResourceMap::Application.routes.draw do

  devise_for :users, :controllers => {:registrations => "registrations", :sessions => 'sessions' }

  # match 'messaging' => 'messaging#index'
  match 'nuntium' => 'nuntium#receive', :via => :post
  match 'authenticate' => 'nuntium#authenticate', :via => :post
  match 'android/collections' => 'android#collections_json', :via => :get
  match 'android/submission' => 'android#submission', :via => :post
  match 'collections/breadcrumbs' => 'collections#render_breadcrumbs', :via => :post
  match 'real-time-resource-tracking' => 'home#second_page', :via => :get
  match 'track-medical-supplies-and-personnel'=> 'home#medical_page', :via => :get
  match 'track-food-prices-and-supplies' => 'home#food_page', :via => :get
  match 'collections/alerted-collections' => 'collections#alerted_collections', :via => :get
  #match 'analytics' => 'analytics#index', :via => :get

  resources :repeats
  resources :collections do
    post :register_gateways
    get  :message_quota
    get :sites_by_term
    resources :sites
    resources :layers do
      member do
        put :set_order
      end
    end
    resources :fields

    resources :memberships do
      collection do
        get 'invitable'
        get 'search'
      end
      member do
        post 'set_layer_access'
        post 'set_admin'
        post 'unset_admin'
      end
    end
    resources :sites_permission

    get 'members'
    get 'settings'
    get 'quotas'
    get 'csv_template'
    get 'max_value_of_property'

    post 'upload_csv'

    post 'create_snapshot'
    post 'load_snapshot'
    post 'unload_current_snapshot'

    get 'recreate_index'
    get 'search'
    post 'decode_hierarchy_csv'

    resource :import_wizard, only: [] do
       get 'index'
       post 'upload_csv'
       get 'adjustments'
       get 'guess_columns_spec'
       post 'execute'
       post 'validate_sites_with_columns'
       get 'get_visible_sites/:page' => 'import_wizards#get_visible_sites'
       get 'import_in_progress'
       get 'import_finished'
       get 'job_status'
     end
  end

  resources :sites do
    get 'root_sites'
    get 'search', :on => :collection

    post 'update_property'
  end

  resources :activities, :only => [:index], :path => 'activity'
  resources :quotas
  resources :gateways do
    post 'status', :on => :member
    post 'try'
  end

  match 'terms_and_conditions' => redirect("http://instedd.org/terms-of-service/")

  namespace :api do
    get 'collections/:id' => 'collections#show',as: :collection
    get 'collections/:id/sample_csv' => 'collections#sample_csv',as: :sample_csv
    get 'collections/:id/count' => 'collections#count',as: :count
    get 'collections/:id/geo' => 'collections#geo_json',as: :geojson
    get 'sites/:id' => 'sites#show', as: :site
    get 'activity' => 'activities#index', as: :activity
    resources :tokens, :only => [:index, :destroy]
    resources :collections
    devise_for :users, :controllers => { :sessions => 'sessions' }
  end

  namespace :mobile do
    resources :collections do
      resources :sites
    end
  end

  scope '/plugin' do
    Plugin.all.each do |plugin|
      scope plugin.name do
        plugin.hooks[:routes].each { |plugin_routes_block| instance_eval &plugin_routes_block }
      end
    end
  end

  root :to => 'home#index'

  admin_constraint = lambda do |request|
    request.env['warden'].authenticate? and request.env['warden'].user.is_super_user?
  end

  constraints admin_constraint do
    mount Resque::Server, :at => "/admin/resque"
    match 'analytics' => 'analytics#index', :via => :get
    match 'quota' => 'quota#index', via: :get
  end

  offline = Rack::Offline.configure do  
    cache "/assets/application.js"
    cache "/assets/application.css"
    cache "/jquery.mobile-1.3.1.min.css"
    cache "/jquery.mobile-1.3.1.min.js"
    cache "/images/ajax-loader.gif"
    cache "/images/icons-18-white.png"
    cache "http://theme.instedd.org/theme/images/interface/add.png"
    cache "/images/favicon.ico"
    network "/"  
  end   
  match "/application.manifest" => offline 

  # TODO: deprecate later
  match 'collections/:collection_id/fred_api/v1/facilities/:id' => 'fred_api#show_facility', :via => :get
  match 'collections/:collection_id/fred_api/v1/facilities' => 'fred_api#facilities', :via => :get
  match 'collections/:collection_id/fred_api/v1/facilities/:id' => 'fred_api#delete_facility', :via => :delete
  match 'collections/:collection_id/fred_api/v1/facilities' => 'fred_api#create_facility', :via => :post
  match 'collections/:collection_id/fred_api/v1/facilities/:id(.:format)' => 'fred_api#update_facility', :via => :put


end
