class ImportWizardsController < ApplicationController
  before_filter :authenticate_user!
  before_filter :show_properties_breadcrumb

  def upload_csv
    ImportWizard.import current_user, collection, params[:file].read
    redirect_to adjustments_collection_import_wizard_path(collection)
  rescue => ex
    redirect_to collection_import_wizard_path(collection), :notice => "The file was not a valid CSV file"
  end

  def index
    add_breadcrumb "Import wizard", collection_import_wizard_path(collection)
  end

  def adjustments
    add_breadcrumb "Import wizard", collection_import_wizard_path(collection)
  end

  def guess_columns_spec
    render json: ImportWizard.guess_columns_spec(current_user, collection)
  end

  def validate_sites_with_columns
    render json: ImportWizard.validate_sites_with_columns(current_user, collection, JSON.parse(params[:columns]))
  end

  def execute
    columns = params[:columns].values
    if columns.find { |x| x[:usage] == 'new_field' } and not current_user.admins? collection
      render text: "Non-admin users can't create new fields", status: :unauthorized
    else
      ImportWizard.create_job current_user, collection, params[:columns].values
      render json: :ok
    end
  end

  def import_in_progress
    add_breadcrumb "Import wizard", collection_import_wizard_path(collection)
  end
end
