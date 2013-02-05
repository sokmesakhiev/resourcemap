module Field::Base
  extend ActiveSupport::Concern

  # [
  #   { :name => 'email', :css_class => 'lmessage' }
  # ]

  BaseKinds = [
   { name: 'text', css_class: 'ltext', small_css_class: 'stext' },
   { name: 'numeric', css_class: 'lnumber', small_css_class: 'snumeric' },
   { name: 'select_one', css_class: 'lsingleoption', small_css_class: 'sselect_one' },
   { name: 'select_many', css_class: 'lmultipleoptions', small_css_class: 'sselect_many' },
   { name: 'hierarchy', css_class: 'lhierarchy', small_css_class: 'shierarchy' },
   { name: 'date', css_class: 'ldate', small_css_class: 'sdate' },
   { name: 'site', css_class: 'lsite', small_css_class: 'ssite' },
   { name: 'user', css_class: 'luser', small_css_class: 'suser' }]

  PluginKinds = Plugin.hooks(:field_type).index_by { |h| h[:name] }

  Kinds = (BaseKinds.map{|k| k[:name]} | PluginKinds.keys).sort.freeze

  Kinds.each do |kind|
    class_eval %Q(def #{kind}?; kind == '#{kind}'; end)
  end

  def select_kind?
    select_one? || select_many?
  end

  def plugin?
    PluginKinds.has_key? kind
  end

  def stored_as_date?
    date?
  end

  def stored_as_number?
    numeric? || select_one? || select_many?
  end

  def strongly_type(value)
    if stored_as_number?
      value.is_a?(Array) ? value.map(&:to_i_or_f) : value.to_i_or_f
    else
      value
    end
  end

  def fred_api_value(value)
    if date?
      # Values are stored in ISO 8601 format.
      value
    else
      api_value(value)
    end
  end

  def api_value(value)
    if select_one?
      option = config['options'].find { |o| o['id'] == value }
      return option ? option['code'] : value
    elsif select_many?
      if value.is_a? Array
        return value.map do |val|
          option = config['options'].find { |o| o['id'] == val }
          option ? option['code'] : val
        end
      else
        return value
      end
    elsif hierarchy?
      return value
    elsif date?
      return Site.iso_string_to_mdy(value)
    else
      return value
    end
  end

  def human_value(value)
    if select_one?
      option = config['options'].find { |o| o['id'] == value }
      return option ? option['label'] : value
    elsif select_many?
      if value.is_a? Array
        return value.map do |val|
          option = config['options'].find { |o| o['id'] == val }
          option ? option['label'] : val
        end.join ', '
      else
        return value
      end
    elsif hierarchy?
      return find_hierarchy_value value
    elsif date?
      return Site.iso_string_to_mdy(value)
    else
      return value
    end
  end

  def sample_value(user = nil)
    if plugin?
      kind_config = PluginKinds[kind]
      if kind_config.has_key? :sample_value
        return kind_config[:sample_value]
      else
        return ''
      end
    end

    if text?
      value = 'sample text value'
    elsif numeric?
      value = -39.2
    elsif date?
      value = Site.format_date_iso_string(Site.parse_date('4/23/1851'))
    elsif user?
      return '' if user.nil?
      value = user.email
    elsif select_one?
      options = config['options']
      return '' if options.nil? or options.length == 0
      value = config['options'][0]['id']
    elsif select_many?
      options = config['options']
      return '' if options.nil? or options.length == 0
      if options.length == 1
        value = [options[0]['id']]
      else
        value = [options[0]['id'], options[1]['id']]
      end
    elsif hierarchy?
      @hierarchy_items_map ||= create_hierarchy_items_map
      keys = @hierarchy_items_map.keys
      return '' if keys.length == 0
      value = keys.first
    else
      return ''
    end
    api_value value
  end

  private

  def find_hierarchy_value(value)
    @hierarchy_items_map ||= create_hierarchy_items_map
    item = @hierarchy_items_map[value]
    item ? hierarchy_item_to_s(item) : value
  end

  def create_hierarchy_items_map(map = {}, items = config['hierarchy'] || [], parent = nil)
    items.each do |item|
      map_item = {'name' => item['name'], 'parent' => parent}
      map[item['id']] = map_item
      create_hierarchy_items_map map, item['sub'], map_item if item['sub'].present?
    end
    map
  end

  def hierarchy_item_to_s(str = '', item)
    if item['parent']
      hierarchy_item_to_s str, item['parent']
      str << ' - '
    end
    str << item['name']
    str
  end
end
