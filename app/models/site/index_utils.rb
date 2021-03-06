module Site::IndexUtils
  extend self

  DateFormat = "%Y%m%dT%H%M%S.%L%z"

  def store(site, site_id, index, options = {})

    hash = {
      id: site_id,
      name: site.name,
      id_with_prefix: site.id_with_prefix,
      uuid: site.uuid,
      name_not_analyzed: site.name,
      type: :site,
      properties: site.properties,
      created_at: site.created_at.strftime(DateFormat),
      updated_at: site.updated_at.strftime(DateFormat),
      icon: site.collection.icon
    }

    if site.lat? && site.lng?
      hash[:location] = {lat: site.lat.to_f, lon: site.lng.to_f}
      hash[:lat_analyzed] = site.lat.to_s
      hash[:lng_analyzed] = site.lng.to_s
    end

    hash.merge! site.extended_properties if site.is_a? Site
    result = index.store hash

    if result['error']
      raise "Can't store site in index: #{result['error']}"
    end
    index.refresh unless options[:refresh] == false
  end

  def site_mapping(fields)
    {
      properties: {
        name: { type: :string },
        id_with_prefix: { type: :string },
        uuid: { type: :string, index: :not_analyzed },
        name_not_analyzed: { type: :string, index: :not_analyzed },
        location: { type: :geo_point },
        lat_analyzed: { type: :string },
        lng_analyzed: { type: :string },
        created_at: { type: :date, format: :basic_date_time },
        updated_at: { type: :date, format: :basic_date_time },
        properties: { properties: fields_mapping(fields) }
      }
    }
  end

  def fields_mapping(fields)
    fields.each_with_object({}) { |field, hash| hash[field.es_code] = field.index_mapping }
  end
end
