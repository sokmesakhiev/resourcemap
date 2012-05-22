#= require models/threshold

describe 'Threshold', ->
  beforeEach ->
    @threshold = new rm.Threshold { priority: 1, color: '#ff0000', conditions: [{ field: 'beds', is: 'lt', type: 'value', value: 10 }] }

  it 'should have 1 condition', ->
    expect(@threshold.conditions().length).toEqual 1

  it 'should be new record', ->
    expect(@threshold.isNewRecord()).toBeTruthy()

  it 'should default threshold have no conditions', ->
    threshold = new rm.Threshold {}
    expect(threshold.conditions().length).toEqual 0

  describe '#destroy', ->
    it 'should dispatch ThresholdEvent:DESTROY event', ->
      spyOn rm.EventDispatcher, 'trigger'
      @threshold.destroy()
      expect(rm.EventDispatcher.trigger).toHaveBeenCalledWith rm.ThresholdEvent.DESTROY, new rm.ThresholdEvent @threshold

  describe '#create', ->
    it 'should dispatch ThresholdEvent:CREAT event', ->
      spyOn rm.EventDispatcher, 'trigger'
      @threshold.create()
      expect(rm.EventDispatcher.trigger).toHaveBeenCalledWith rm.ThresholdEvent.CREATE, new rm.ThresholdEvent @threshold
      
  describe '#setPriority', ->
    it 'should dispatch ThresholdEvent:SET_PRIORITY event', ->
      spyOn rm.EventDispatcher, 'trigger'
      @threshold.setPriority 99
      expect(rm.EventDispatcher.trigger).toHaveBeenCalledWith rm.ThresholdEvent.SET_PRIORITY, new rm.ThresholdEvent @threshold

  it 'should check is first condtion', ->
    @threshold.isFirstCondition @threshold.conditions()[0]

  it 'should check is last condtion', ->
    @threshold.isLastCondition @threshold.conditions()[0]

  it 'should add condition', ->
    @threshold.addNewCondition()
    expect(@threshold.conditions().length).toEqual 2

  it 'should remove condition', ->
    @threshold.removeCondition @threshold.conditions()[0]
    expect(@threshold.conditions().length).toEqual 0
