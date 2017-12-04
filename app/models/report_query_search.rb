class ReportQuerySearch
  include ReportQueryBuilder

  attr_accessor :result, :facet

  def initialize(report_query)
    @report_query = report_query
    @index_name = Collection.index_name(@report_query.collection_id)
  end

  def query
    result_query = query_builder
    result_query['aggs'] = ReportQueryGroupByBuilder.new(@report_query).facet unless @report_query.aggregate_fields.empty?
    result_query['size'] = Settings.max_aggregate_result_size.to_i
    if @report_query.condition_fields.empty? and @report_query.group_by_fields.empty?
      result_query = ignor_null_field result_query
    end
    query_log(result_query)

    client = Elasticsearch::Client.new
    begin
      # {"query"=>{"match_all"=>{}}, "facets"=>{"20530"=>{"terms"=>{"field"=>"20530", "size"=>500}}}}
      response = client.search(index: @index_name, body: result_query)
      @facet = response['aggregations']
      ReportQuerySearchResult.new(@report_query, @facet).as_table
    rescue Exception => e
      Rails.logger.error { e }
    end
  end

  def query_log result_query
    Rails.logger.debug { result_query }
  end

end
