onImportWizard ->
  class @ValidationErrors
    constructor: (data) ->
      #private variables
      @errors = data
      @errorsByType = @processErrors()

    hasErrors: =>
      for errorKey,errorValue of @errors
        return true unless $.isEmptyObject(errorValue)
      return false

    toIndex1BasedSentence: (index_array) =>
      index_array = $.map index_array, (index) => index + 1
      window.toSentence(index_array)

    summarizedErrorList: =>
      $.map @errorsByType, (e) => {description: e.description, more_info: e.more_info}

    errorsForColumn: (column_index) =>
      (error for error in @errorsByType when $.inArray(column_index, error.columns) != -1)

    processErrors: =>
      errorsByType = []
      for errorType,errors of @errors
        if !$.isEmptyObject(errors)
          for errorId, errorColumns of errors
            error_description = {error_kind: errorType, columns: errorColumns}
            switch errorType
              when 'missing_name'
                error_description.description = "Please select a column to be used as 'Name'"
                error_description.more_info = "You need to select a column to be used as 'Name' of the sites in order to continue with the upload."
              when 'duplicated_code'
                error_description.description = "There is more than one column with code '#{errorId}'."
                error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} have the same code. To fix this issue, leave only one with that code and modify the rest."
              when 'duplicated_label'
                error_description.description = "There is more than one column with name '#{errorId}'."
                error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} have the same name. To fix this issue, leave only one with that name and modify the rest."
              when 'missing_code'
                if errorColumns.length >1
                  error_description.description = "Columns #{@toIndex1BasedSentence(errorColumns)} are missing the field's code."
                  error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} are missing the field's code, which is required for new fields. To fix this issue, add a code for each of these columns."
                else
                  error_description.description = "Column #{@toIndex1BasedSentence(errorColumns)} is missing the field's code."
                  error_description.more_info = "Column #{@toIndex1BasedSentence(errorColumns)} is missing the field's code, which is required for new fields. To fix this issue, add a code for this column."
              when 'missing_label'
                if errorColumns.length >1
                  error_description.description = "Columns #{@toIndex1BasedSentence(errorColumns)} are missing the field's name."
                  error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} are missing the field's name, which is required for new fields. To fix this issue, add a name for each of these columns."
                else
                  error_description.description = "Column #{@toIndex1BasedSentence(errorColumns)} is missing the field's name."
                  error_description.more_info = "Column #{@toIndex1BasedSentence(errorColumns)} is missing the field's name, which is required for new fields. To fix this issue, add a name for this column."
              when 'duplicated_usage'
                field = window.model.findField(errorId)
                if field
                  duplicated = "field #{field.name}"
                else
                  duplicated = errorId
                error_description.description = "Only one column can be the #{duplicated}."
                error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} are marked as #{duplicated}. To fix this issue, leave only one of them assigned as '#{duplicated}' and modify the rest."
              when 'existing_code'
                error_description.description = "There is already a field with code #{errorId} in this collection."
                if errorColumns.length >1
                  error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} have code #{errorId}. To fix this issue, change all their codes."
                else
                  error_description.more_info = "Column #{errorColumns[0] + 1} has code #{errorId}. To fix this issue, change its code."
              when 'existing_label'
                error_description.description = "There is already a field with name #{errorId} in this collection."
                if errorColumns.length >1
                  error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} have name #{errorId}. To fix this issue, change all their names."
                else
                  error_description.more_info = "Column #{errorColumns[0] + 1} has name #{errorId}. To fix this issue, change its name."
              when 'hierarchy_field_found'
                error_description.description = "Hierarchy fields can only be created via web in the Layers page."
                error_description.more_info = "Column numbers: #{@toIndex1BasedSentence(errorColumns)}."
              when 'reserved_code'
                error_description.description = "Reserved code '#{errorId}'. ResourceMap uses the code 'resmap-id' to identify sites, thus it can't be used as a custom field code."
                if errorColumns.length >1
                  error_description.more_info = "Columns #{@toIndex1BasedSentence(errorColumns)} have code '#{errorId}'. To fix this issue, change all their codes."
                else
                  error_description.more_info = "Column #{errorColumns[0] + 1} has code '#{errorId}'. To fix this issue, change its code."
              when 'non_existent_site_id'
                # In this case errorColumns contains an object with the following structure:
                # {column: 1, rows: [1, 3, 5, 6]} 
                error = errorColumns
                error_description.columns = [error.column]
                error_description.description = "There are #{error.rows.length} issues with the values in column #{error.column + 1}."
                error_description.more_info = "ResourceMap uses the name 'resmap-id' to identify sites, thus it can't be used as a custom field name."
                error_description.more_info = error_description.more_info + "If you want to update sites information, all the values in the column 'resmap-id' must correspond to already existing sites in the collection, and new sites must be blank."
                error_description.more_info = error_description.more_info + "If you just want to create new sites, please change the column's code from 'resmap-id' to something else."
                if error.rows.length < 25
                  error_description.more_info = error_description.more_info + "The non-existing site-id values are in the following rows: #{@toIndex1BasedSentence(error.rows)}."
              when 'data_errors'
                # In this case errorColumns contains an object with the following structure:
                # {description: “Error description”, column: 1, rows: [1, 3, 5, 6], example: "Hint", type: 'numeric'}
                error = errorColumns
                error_description.columns = [error.column]
                if error.rows.length > 1
                  error_description.description = "There are #{error.rows.length} invalid values in column #{error.column + 1}."
                else
                  error_description.description = "There is 1 invalid value in column #{error.column + 1}."
                error_description.more_info = "#{error.description} To fix this, either change the column's type or edit your CSV so that all rows hold valid #{error.type}."
                if error.example
                  error_description.more_info = error_description.more_info + " " + error.example
                if error.rows.length < 25
                  error_description.more_info = error_description.more_info + " The invalid #{error.type} are in the following rows: #{@toIndex1BasedSentence(error.rows)}."
            errorsByType.push(error_description)
      errorsByType

