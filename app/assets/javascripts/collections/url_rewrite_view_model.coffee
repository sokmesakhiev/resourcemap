onCollections ->

  class @UrlRewriteViewModel
    @rewriteUrl: ->
      return if @rewritingUrl

      @rewritingUrl = true

      hash = ""
      query = {}

      if @currentCollection()
        hash = "##{@currentCollection().id()}"
      else
        hash = "#/"

      # Append collection parameters (search, filters, hierarchy, etc.)
      @currentCollection().setQueryParams(query) if @currentCollection()

      # Append selected site or editing site, if any
      if @editingSite()
        query.editing_site = @editingSite().id()
      else if @selectedSite()
        query.selected_site = @selectedSite().id()

      # Append map center and zoom
      if @map
        center = @map.getCenter()
        if center
          query.lat = center.lat()
          query.lng = center.lng()
          query.z = @map.getZoom()

      params = $.param query
      hash += "?#{params}" if params.length > 0

      if window.location.hash == hash
        @rewritingUrl = false
      else
        window.location.hash = hash

    @processQueryParams: ->
      @ignorePerformSearchOrHierarchy = true
      selectedSiteId = null
      editingSiteId = null

      for key in @queryParams.keys(true)
        value = @queryParams[key]
        switch key
          when 'collection', 'lat', 'lng', 'z'
            continue
          when 'search'
            @search(value)
          when 'updated_since'
            switch value
              when 'last_hour' then @filterByLastHour()
              when 'last_day' then @filterByLastDay()
              when 'last_week' then @filterByLastWeek()
              when 'last_month' then @filterByLastMonth()
          when 'selected_site'
            selectedSiteId = parseInt(value)
          when 'editing_site'
            editingSiteId = parseInt(value)
          else
            key = key.substring(1) if key[0] == '@'
            @expandedRefineProperty(key)

            if value.length >= 2 && (value[0] == '>' || value[0] == '<') && value[1] == '='
              @expandedRefinePropertyOperator(value.substring(0, 2))
              @expandedRefinePropertyValue(value.substring(2))
            else if value[0] == '=' || value[0] == '>' || value[0] == '<'
              @expandedRefinePropertyOperator(value[0])
              @expandedRefinePropertyValue(value.substring(1))
            else
              @expandedRefinePropertyValue(value)
            @filterByProperty()

      @ignorePerformSearchOrHierarchy = false
      @performSearchOrHierarchy()

      @selectSiteFromId(selectedSiteId) if selectedSiteId
      @editSiteFromMarker(editingSiteId) if editingSiteId
