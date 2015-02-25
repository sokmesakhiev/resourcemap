#= require thresholds/value_type
#= require thresholds/operator

onThresholds ->
  class @Condition
    constructor: (data) ->
      @field = ko.observable window.model.findField data?.field
      @compareField = ko.observable window.model.findField data?.compare_field ? data?.field # assign data.field only when data.compare_field doesn't exist to prevent error on view
      @op = ko.observable if data?.op then Operator.findByCode(data?.op) else ''
      @selectedOperator = ko.observable(@op().code)
      @value = ko.observable data?.value
      @kind = ko.observable data?.kind
      @valueType = ko.observable ValueType.findByCode data?.type ? 'value'
      @selectedValueType = ko.observable(@valueType().label)

      @selectedOperator.subscribe =>
        @op(Operator.findByCode(@selectedOperator()))

      @selectedValueType.subscribe =>
        @valueType(ValueType.findByLabel(@selectedValueType()))

      @valueUI = ko.computed
        read: => @field()?.format @value()
        write: (value) => @value value

      @formattedValue = ko.computed =>
        switch @field()?.kind()
          when 'numeric' then ValueType.format(@valueType().code, @value())
          else @valueUI()

      @error = ko.computed => return window.t('javascripts.plugins.alerts.errors.value_is_invalid') unless @field()?.valid @value()
      @valid = ko.computed => not @error()?

      @field.subscribe =>
        @op Operator.EQ()
        @compareField null
        @valueType ValueType.VALUE()
        @value null

    toJSON: =>
      field: @field().esCode()
      op: @op().code
      value: @field()?.encode @value()
      type: @valueType().code
      compare_field: @compareField()?.esCode()
      kind: @field().kind
