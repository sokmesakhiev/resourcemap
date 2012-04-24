ResourceMap::Application.routes.draw do
  devise_for :users

  resources :collections do
    resources :sites
    resources :layers
    resources :fields
    resources :thresholds do
      member do
        post 'set_priority'
      end
    end
    resources :memberships do
      collection do
        get 'invitable'
      end
      member do
        post 'set_layer_access'
      end
    end
    get 'members'
    get 'reminders'
    get 'settings'
    get 'download_as_csv'
    get 'csv_template'
    get 'max_value_of_property'

    post 'upload_csv'

    get 'import_wizard'
    post 'import_wizard_upload_csv'
    get 'import_wizard_adjustments'
    post 'import_wizard_execute'

    member do
      get 'search'
    end
  end

  resources :sites do
    get 'root_sites'
    get 'search', :on => :collection

    post 'update_property'
  end

  resources :gateways

  get 'terms_and_conditions', :to => redirect('/')

  namespace :api do
    get 'collections/:id' => 'collections#show',as: :collection
    get 'sites/:id' => 'sites#show', as: :site
  end

  root :to => 'home#index'

  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => 'welcome#index'

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id))(.:format)'
end
