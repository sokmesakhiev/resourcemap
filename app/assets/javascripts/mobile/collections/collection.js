//= require mobile/events
//= require mobile/field
//= require mobile/option
//= require mobile/field_logic
//= require mobile/sub_hierarchy
//= require mobile/collections/sites_permission

function Collection (collection) {
  this.id = collection != null ? collection.id : void 0;
  this.name = collection != null ? collection.name : void 0;
  this.layers = collection != null ? collection.layers : void 0;
  this.fields = [];
};

Collection.prototype.pushingPendingSites = function(){
  pendingSites = JSON.parse(window.localStorage.getItem("offlineSites"));
  if(pendingSites != null){
    for(var i=0; i< pendingSites.length; i++){
      data = pendingSites[i]["formData"];
      if(data["id"]){
        Collection.prototype.ajaxUpdateOfflineSite(pendingSites[i]["collectionId"], data);
      }
      else{
        Collection.prototype.ajaxCreateOfflineSite(pendingSites[i]["collectionId"], data);
      }
    }
    window.localStorage.setItem("offlineSites", JSON.stringify([]));
  }

}

Collection.prototype.buildLocation = function(){
  var currentCollectionSchema = Collection.getSchemaByCollectionId(currentCollectionId);
  currentLat = $('#lat').val();
  currentLng = $('#lng').val();

  for(i=0; i<currentCollectionSchema["layers"].length;i++){
    for(j=0; j<currentCollectionSchema["layers"][i]["fields"].length; j++){
      field = currentCollectionSchema["layers"][i]["fields"][j];
      if(field["kind"] == "location"){
        nearByPlaces = [];
        $('#'+field["code"]).empty();
        for(k=0; k<field["config"]["locations"].length; k++){
          fieldLocation = field["config"]["locations"][k]
          distance = Collection.calculateDistance(currentLat, currentLng, fieldLocation["latitude"], fieldLocation["longitude"]);
          if(distance < parseFloat(field["config"]["maximumSearchLength"])){
            fieldLocation["distance"] = distance;
            nearByPlaces.push(fieldLocation);
          }
        }

        nearByPlaces.sort(function(a, b){return a["distance"]-b["distance"]});
        nearByPlaces.splice(20, nearByPlaces.length);
        fieldValue = $('#hidden_'+field['code']).val();
        options = '<option value=""> (no value) </option>';
        for(l=0; l< nearByPlaces.length; l++){
          if(nearByPlaces[l]['code'] == fieldValue){
            options = options + '<option value="'+nearByPlaces[l]["code"]+'" selected="selected">'+nearByPlaces[l]["name"]+'</option>';
          }else{
            options = options + '<option value="'+nearByPlaces[l]["code"]+'">'+nearByPlaces[l]["name"]+'</option>';
          }
        }
        
        
        $('#'+field["code"]).append(options);
        $('#'+field["code"]).selectmenu('refresh');        
      }
    }
  }  
  
};

Collection.calculateDistance = function(fromLat, fromLng, toLat, toLng){
  fromLatlng = new google.maps.LatLng(fromLat, fromLng);
  toLatlng = new google.maps.LatLng(toLat, toLng);
  distance = google.maps.geometry.spherical.computeDistanceBetween(fromLatlng, toLatlng);
  return distance;
}

Collection.prototype.getSiteName = function(value){
  for(var a=0; a<window.sites.length; a++){
    if(window.sites[a]['id'] == value){
      return window.sites[a]['name'];
    }
  }
  return "";
}

Collection.prototype.filterSite = function(fieldId){
  Collection.prototype.clearSiteId(fieldId);
  value = $('#'+fieldId).val();
  if(value == ""){
    $('#filterSiteList_'+fieldId).empty();
    return;
  }
  collectionId = window.currentCollectionId;
  $.ajax({
      url: '/collections/' + collectionId + '/sites_by_term.json',
      type: 'GET',
      success: function(sites){
        Collection.prototype.buildSiteList(sites, fieldId);
      },error: function(data){
        
      },
      data: {term: value}
  }); 
}

Collection.prototype.filterUser = function(fieldId){
  $('#user_'+fieldId).val(null);
  value = $('#'+fieldId).val();
  if(value == ""){
    $('#filterUserList_'+fieldId).empty();
    return;
  }
  collectionId = window.currentCollectionId;
  $.ajax({
      url: '/collections/' + collectionId + '/memberships/search.json',
      type: 'GET',
      success: function(users){
        Collection.prototype.buildUserList(users, fieldId);
      },error: function(data){
        
      },
      data: {term: value}
  }); 
}

Collection.prototype.buildUserList = function(users, fieldId){
  userList = $('#filterUserList_'+fieldId);
  userList.empty();
  for(i=0; i<users.length; i++){
    if(i == 0){
      li = '<li onclick="Collection.prototype.selectUser(\''+ users[i] +'\',\''+ fieldId+'\')" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-first-child ui-btn-up-c">';
    }else if(i == sites.length - 1){
      li = '<li onclick="Collection.prototype.selectUser(\''+ users[i] +'\',\''+ fieldId+'\')" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-last-child ui-btn-up-c">';
    }else{
      li = '<li onclick="Collection.prototype.selectUser(\''+ users[i] +'\',\''+ fieldId+'\')" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-c">';
    }
    userEle = li +  '<div class="ui-btn-inner ui-li" style="padding-left:10px;padding-top: 10px; height: 25px;">'+
            '<span>'+users[i]+'</span>'+
      '</div>'+
    '</li>';
    
    userList.append(userEle);
  }
}

Collection.prototype.validFieldUser = function(fieldId){
  userVal = $('#user_'+fieldId).val();
  if(userVal == ''){
    $('#'+fieldId).val('');
  }
}

Collection.prototype.selectUser = function(userEmail, fieldId){
  $('#'+fieldId).val(userEmail);
  $('#user_'+fieldId).val(userEmail);
  $('#filterUserList_'+fieldId).empty();
}


Collection.prototype.clearSiteId = function(fieldId){
  $('#site_'+fieldId).val(null);
}

Collection.prototype.validFieldSite = function(fieldId){
  siteVal = $('#site_'+fieldId).val();
  if(siteVal == ''){
    $('#'+fieldId).val(null);
  }
}

Collection.prototype.buildSiteList = function(sites, fieldId){
  siteList = $('#filterSiteList_'+fieldId);
  siteList.empty();
  for(i=0; i<sites.length; i++){
    if(i == 0){
      li = '<li onclick="Collection.prototype.selectSite('+sites[i]["id"] +',\''+ sites[i]["name"] +'\',\''+ fieldId+'\')" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-first-child ui-btn-up-c">';
    }else if(i == sites.length - 1){
      li = '<li onclick="Collection.prototype.selectSite('+sites[i]["id"] +',\''+ sites[i]["name"] +'\',\''+ fieldId+'\')" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-last-child ui-btn-up-c">';
    }else{
      li = '<li onclick="Collection.prototype.selectSite('+sites[i]["id"] +',\''+ sites[i]["name"] +'\',\''+ fieldId+'\')" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-c">';
    }
    siteEle = li +  '<div class="ui-btn-inner ui-li" style="padding-left:10px;padding-top: 10px; height: 25px;">'+
            '<span>'+sites[i]["name"]+'</span>'+
      '</div>'+
    '</li>';
    
    siteList.append(siteEle);
  }
}

Collection.prototype.selectSite = function(siteId, siteName, fieldId){
  $('#'+fieldId).val(siteName);
  $('#site_'+fieldId).val(siteId);
  $('#filterSiteList_'+fieldId).empty();
}

Collection.prototype.fetchFields = function() {
  var fields = [];
  var layers = this.layers();
  for (var i = 0; i < layers.length; i++) {
    layer = layers[i];
    fields = layer.fields();
    for (j = 0; j < fields.length; j++) {
      field = fields[j];
      field.value(null);
      fields.push(field);
    }
  }
  return this.fields(fields);
};

Collection.prototype.createSite = function(id){
  currentCollectionSchema = Collection.getSchemaByCollectionId(id);
  Collection.hideWhileOffline();
  Collection.prototype.showFormAddSite(currentCollectionSchema);
}

Collection.hideWhileOffline = function(){
  if(!window.navigator.onLine){
    $("#linkPageMap").hide();
    $("#unsupportPhotoField").show();
  }
  else{
    $("#linkPageMap").show();
    $("#unsupportPhotoField").hide();
  }
}

Collection.getSchemaByCollectionId = function(id){
  for(var i=0; i< window.collectionSchema.length; i++){
    if(window.collectionSchema[i]["id"] == id){
      return window.collectionSchema[i];
    }
  }
}

Collection.prototype.showFormAddSite = function(schema){
  Collection.hidePages();
  Collection.clearFormData();
  $("#mobile-sites-main").show();
  fieldHtml = Collection.prototype.addLayerForm(schema);
  $("#title").html(schema["name"]);
  $("#fields").html(fieldHtml);
  Collection.prototype.applyBrowserLocation();
  Collection.prototype.handleFieldUI(schema);
  Collection.prototype.formSiteWithPermission(schema);
}

Collection.prototype.saveSite = function(){  
  var collectionId = window.currentCollectionId;
  if(Collection.prototype.validateData(collectionId)){ 
    if(window.navigator.onLine){
      if(window.currentSiteId){
        var formData = new FormData($('form')[0]);
        Collection.prototype.ajaxUpdateSite(collectionId, window.currentSiteId, formData);
      }
      else{
        var formData = new FormData($('form')[0]);
        Collection.prototype.ajaxCreateSite(collectionId, formData);
      }
    }
    else{
      var offlineData = Collection.prototype.getFormValue();
      var state;
      if(window.currentSiteId){
        offlineData["idSite"] = window.currentSiteId;
        Collection.prototype.removePreviousSite(collectionId, window.currentSiteId);
        state = "update";
      }else{
        sites = JSON.parse(localStorage.getItem("offlineSites"));
        if(!sites) offlineData["idSite"] = 1;
        else offlineData["idSite"] = sites.length + 1;
        state = "create";
      }
      Collection.prototype.storeOfflineData(collectionId, offlineData, state);
    }
  }
}

Collection.prototype.storeOfflineData = function(collectionId, formData, state){
  pendingSites = JSON.parse(window.localStorage.getItem("offlineSites"));
  if(pendingSites != null && pendingSites.length > 0){
    pendingSites.push({"collectionId" : collectionId, "formData" : formData});
  }
  else{
    pendingSites = [{"collectionId" : collectionId, "formData" : formData}];
  }
  try {
    window.localStorage.setItem("offlineSites", JSON.stringify(pendingSites));
    if (state == "update") {
      Collection.prototype.showListSites(collectionId, true);
      Collection.prototype.showErrorMessage("Offline site updated successfully.");
    } else{
      Collection.prototype.goHome();
      Collection.prototype.showErrorMessage("Offline site saved locally.");
    }
  }catch (e) {
    Collection.prototype.showErrorMessage("Unable to save record because your data is too big.");
  }
}

Collection.prototype.removePreviousSite = function(collectionId, siteId){
  sites = JSON.parse(window.localStorage.getItem("offlineSites"));
  for(var i=0 ; i<sites.length; i++){
    if(sites[i].formData["idSite"] == siteId){
      sites.splice(i, 1);
      window.localStorage.setItem("offlineSites", JSON.stringify(sites));
    }
  }
}

Collection.prototype.ajaxCreateSite = function(collectionId, formData){
  $.mobile.saving('show');
  $.ajax({
      url: '/mobile/collections/' + collectionId + '/sites',  //Server script to process data
      type: 'POST',
      success: function(){
        Collection.prototype.showListSites(collectionId , true);
        Collection.prototype.showErrorMessage("Successfully saved.");
      },
      error: function(data){
        var properties = JSON.parse(data.responseText);
        var error = "";
        for(var i=0;i<properties.length; i++){
          error = error + properties[i] + " .";
        }
        Collection.prototype.showErrorMessage("Save new site failed!" + error);
      },
      complete: function() {
        $.mobile.saving('hide');
      },
      data: formData,
      contentType: false,
      processData: false,
      cache: false
  });
}

Collection.prototype.ajaxUpdateSite = function(collectionId, siteId, formData){
  $.mobile.saving('show');
  $.ajax({
      url: '/mobile/collections/' + collectionId + '/sites/' + siteId + '.json',  //Server script to process data
      type: 'PUT',
      success: function(){
        Collection.prototype.showListSites(collectionId, true);
        Collection.prototype.showErrorMessage("Successfully updated.");
      },
      error: function(data){
        var properties = JSON.parse(data.responseText);
        var error = "";
        for(var i=0;i<properties.length; i++){
          error = error + properties[i] + " .";
        }
        Collection.prototype.showErrorMessage("Update site failed!" + error);
      },
      complete: function() {
        $.mobile.saving('hide');
      },
      data: formData,
      contentType: false,
      processData: false,
      cache: false
  });
}

Collection.prototype.ajaxCreateOfflineSite = function(collectionId, formData){
  $.ajax({
      url: '/mobile/collections/' + collectionId + '/create_offline_site',  //Server script to process data
      type: 'POST',
      success: function(){
        Collection.prototype.showErrorMessage("Locally saved sites synced successfully.");
      },
      error: function(data){
        Collection.prototype.showErrorMessage("Locally saved sites synced failed.");
      },
      data: formData,
      cache: false
  });
}

Collection.prototype.ajaxUpdateOfflineSite = function(collectionId, formData){
  $.ajax({
      url: '/mobile/collections/' + collectionId + '/sites/' + formData["id"]+ '/update_offline_site',  //Server script to process data
      type: 'PUT',
      success: function(){
        Collection.prototype.showErrorMessage("Locally update sites synced successfully.");
      },
      error: function(data){
        Collection.prototype.showErrorMessage("Locally update sites synced failed.");
      },
      data: formData,
      cache: false
  });
}

Collection.prototype.validateData = function(collectionId){
  currentCollectionSchema = Collection.getSchemaByCollectionId(currentCollectionId);
  if(currentCollectionSchema["is_visible_name"] == true && $("#name").val().trim() == ""){
    Collection.prototype.showErrorMessage("Name can not be empty.");
    return false;
  }
  if(currentCollectionSchema["is_visible_location"] == true && $("#lat").val().trim() == ""){
    Collection.prototype.showErrorMessage("Location's latitude can not be empty.");
    return false;
  }
  if(currentCollectionSchema["is_visible_location"] == true && $("#lng").val().trim() == ""){
    Collection.prototype.showErrorMessage("Location's longitude can not be empty.");
    return false;
  }
  for(var k=0; k< window.collectionSchema.length; k++){
    if(window.collectionSchema[k]["id"] == collectionId){
      schema = window.collectionSchema[k];
      for(i=0; i<schema["layers"].length;i++){
        for(j=0; j<schema["layers"][i]["fields"].length; j++){
          var field = schema["layers"][i]["fields"][j];
          state = true;
          switch(field["kind"])
          {
            case "text":
              state = Collection.valiateMandatoryText(field);
              break;
            case "numeric":
              value = $("#" + field["code"]).val();
              range = field["config"]["range"];
              digitsPrecision = field["config"]["digits_precision"];
              if(Collection.prototype.validateNumeric(value) == false){
                Collection.prototype.showErrorMessage(field["name"] + " is not valid numeric value.");
                return false;
              }
              if(field["config"]["allows_decimals"] == "false"){
                if(value.indexOf(".") != -1){
                  Collection.prototype.showErrorMessage("Please enter an integer.");
                  Collection.setFieldStyleFailed(field["code"]);
                  return false;                  
                }
              }

              if(range){
                if(value != ""){
                  msg = Collection.prototype.validateRange(value, range);
                  if(msg != ""){
                    Collection.prototype.showErrorMessage(msg);
                    $('div').removeClass('invalid_field');
                    Collection.setFieldStyleFailed(field["code"]);                    
                    return false;
                  }
                }
              }
              
              if(digitsPrecision){
                value = parseInt(value * Math.pow(10, parseInt(digitsPrecision))) / Math.pow(10, parseInt(digitsPrecision))
                $("#" + field["code"]).val(value);
              }

              state =  Collection.valiateMandatoryText(field);
              break;
            case "date":
              state =  Collection.valiateMandatoryText(field);
              break;
            case "yes_no":
              Collection.setYesNoFieldValue(field);   
              break;
            case "select_one":
              state =  Collection.valiateMandatorySelectOne(field);
              break;
            case "select_many":
              state =  Collection.valiateMandatorySelectMany(field);
              break;
            case "phone number":
              state =  Collection.valiateMandatoryText(field);
              break;
            case "email":
              value = $("#" + field["code"]).val();
              if(Collection.prototype.validateEmail(value) == false){
                Collection.prototype.showErrorMessage(field["name"] + " is not a valid email value.");
                return false;
              }
              state =  Collection.valiateMandatoryText(field);
              break;
            case "photo":
              state =  Collection.valiateMandatoryPhoto(field);
              break;
          }
          if(!state){
            Collection.prototype.showErrorMessage(field["name"] + " is mandatory.");
            Collection.setFieldStyleFailed(field["code"]);
            return false
          }
          else{
            Collection.setFieldStyleSuccess(field["code"]);
          }
        }
      }
    }
  }

  return true;
}

Collection.setYesNoFieldValue = function(field){
  if($( "#"+field["code"]+":checked").length == 1){
    value = true;
  }else{
    value = false;
  }
  $("#hidden_"+field["code"]).val(value);
}

Collection.setFocusOnFieldFromSelectMany = function(fieldId){
  $("div,span").removeClass('ui-focus');
  els = $(".field_" + fieldId);
  selected_options = []
  for(var i=0; i<els.length; i++){
    if(els[i].checked)
      selected_options.push(els[i].value);
  }
  id = Collection.findNextFieldId(fieldId, selected_options);
  if(id){
    fieldFocus = Collection.prototype.findFieldById(id); 
    Collection.prototype.setFieldFocusStyleByKind(fieldFocus);
  }
}

Collection.setFocusOnFieldFromNumeric = function(fieldId, fieldCode){
  $("div,span").removeClass('ui-focus');
  els = $("#" + fieldCode);
  id = Collection.findNextFieldIdByValue(fieldId, els.val());
  if(id){
    fieldFocus = Collection.prototype.findFieldById(id); 
    Collection.prototype.setFieldFocusStyleByKind(fieldFocus);
  }
}

Collection.findNextFieldIdByValue = function(fieldId, value){
  layers = Collection.getSchemaByCollectionId(window.currentCollectionId).layers;
  field = null;
  for(var i=0; i<layers.length; i++){
    fields = layers[i].fields
    for(var j=0; j<fields.length; j++){
      if(fields[j].id == fieldId)
        field = fields[j];
    }
  }
  if(field.is_enable_field_logic){
    field_logics = field.config["field_logics"]
    if (field_logics != undefined) {
      for(var j=0; j<field_logics.length; j++){
        valid = Collection.checkNumericConditionFieldLogic(field_logics[j], value);
        if(valid){
          return field_logics[j]["field_id"];
        }
      }
    }
    return null;
  }
  else{
    return null;
  }
}

Collection.checkNumericConditionFieldLogic = function(fieldLogic, value){
  switch(fieldLogic["condition_type"]){
    case "=":
      return (fieldLogic["value"] == value);     
      break;
    case "<":
      return (value < fieldLogic["value"]);
      break;
    case ">":
      return (value > fieldLogic["value"]);
      break;
    case "<=":
      return (value <= fieldLogic["value"]);
      break;
    case ">=":
      return (value >= fieldLogic["value"]);    
      break;        
  }
}

Collection.findNextFieldId = function(fieldId, options){
  layers = Collection.getSchemaByCollectionId(window.currentCollectionId).layers;
  field = null;
  for(var i=0; i<layers.length; i++){
    fields = layers[i].fields
    for(var j=0; j<fields.length; j++){
      if(fields[j].id == fieldId)
        field = fields[j];
    }
  }
  if(field.is_enable_field_logic){
    field_logics = field.config["field_logics"]
    if (field_logics != undefined) {
      for(var j=0; j<field_logics.length; j++){
        if(field_logics[j].condition_type == "all"){
          valid = Collection.checkAllConditionFieldLogic(field_logics[j]["selected_options"], options);
          if(valid){
            return field_logics[j]["field_id"];
          }
        }
        else{
          valid = Collection.checkAnyConditionFieldLogic(field_logics[j]["selected_options"], options);
          if(valid){
            return field_logics[j]["field_id"];
          }
        }
      }
    }
    return null;
  }
  else{
    return null;
  }
}

Collection.checkAllConditionFieldLogic = function(selectedOptions, options){
  for(op in selectedOptions){
    meet_condition = false
    for(var j=0; j<options.length; j++){
      if(selectedOptions[op]["value"] == options[j]){
        meet_condition = true;
      }
    }
    if(meet_condition == false){
      return false
    }
  }
  return true;
}

Collection.checkAnyConditionFieldLogic = function(selectedOptions, options){
  meet_condition = false
  for(op in selectedOptions){
    for(var j=0; j<options.length; j++){
      if(selectedOptions[op]["value"] == options[j]){
        meet_condition = true;
      }
    }
  }
  return meet_condition;
}

Collection.setFieldStyleSuccess = function(id){
  $("#div_wrapper_" + id).removeClass("invalid_field")
}

Collection.setFieldStyleFailed = function(id){
  $("#div_wrapper_" + id).addClass("invalid_field")
  $("#" + id).focus()
}

Collection.valiateMandatoryPhoto = function(field){
  value = $("#" + field["code"]).val();
  if(field["is_mandatory"] == true && value == ""){
    return false
  }
  return true
}

Collection.valiateMandatorySelectMany = function(field){
  value = $("input[name='properties[" + field["id"] + "][]']:checked").length;
  if(field["is_mandatory"] == true && value == 0){
    return false
  }
  return true
}

Collection.valiateMandatorySelectOne = function(field){
  value = $("#" + field["code"]).val();
  if(field["is_mandatory"] == true && value == 0 ){
    return false
  }
  return true
}

Collection.valiateMandatoryText = function(field){
  value = $("#" + field["code"]).val();
  if(field["is_mandatory"] == true && value == ""){
    return false
  }
  return true
}

Collection.prototype.validateEmail = function(email) {
  if(email == ""){
    return true;
  }
  else{
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
}

Collection.prototype.validateNumeric = function(number) {
  if(number == ""){
    return true;
  }
  else{
    var RE = /^-{0,1}\d*\.{0,1}\d+$/;
    return (RE.test(number));
  }
}

Collection.prototype.validateRange = function(number, range){
  if(range["minimum"] && range["maximum"]){
    if(parseInt(number) >= parseInt(range["minimum"]) && parseInt(number) <= parseInt(range["maximum"])){
      return '';
    }else{
      return('Invalid value, value must be in the range of ('+range["minimum"]+'-'+range["maximum"]+')');
    }
  }
  else{
    if(range["maximum"]){
      if(parseInt(number) <= parseInt(range["maximum"])){
        return "";
      }else{
        return('Invalid value, value must be less than or equal to '+range["maximum"]);
      }      
    }
    if(range["minimum"]){
      if(parseInt(value) >= parseInt(range["minimum"])){
        return "";
      }else{
        return('Invalid value, value must be greater than or equal to '+range["minimum"]);
      }      
    }
  }
  return true;
}

Collection.prototype.showErrorMessage = function(text){
  $.mobile.showPageLoadingMsg( $.mobile.pageLoadErrorMessageTheme, text, true );
  // hide after delay
  setTimeout( $.mobile.hidePageLoadingMsg, 2000 );
}

Collection.prototype.progressHandlingFunction =function(e){
  if(e.lengthComputable){
    $('progress').attr({value:e.loaded,max:e.total});
  }
}

Collection.prototype.addLayerForm = function(schema){
  form = "";
  for(i=0; i<schema["layers"].length;i++){
    form = form + '<div id="wrapper_layer_' + schema["layers"][i]["id"] + '"><h5>' + schema["layers"][i]["name"] + '</h5>';
    for(j=0; j<schema["layers"][i]["fields"].length; j++){
      var field = schema["layers"][i]["fields"][j];
      myField = new Field(field);
      form = form + myField.getField();
      writeable = schema["layers"][i]["fields"][j].writeable;
    }
    form = form + "</div>";
  }
  return form;
}

Collection.prototype.formSiteWithPermission = function(schema){
  for(i=0; i<schema["layers"].length;i++){
    var writeable = false;
    for(j=0; j<schema["layers"][i]["fields"].length; j++){
      writeable = schema["layers"][i]["fields"][j].writeable;
      break;
    }
    if(!writeable)
      $("#wrapper_layer_" + schema["layers"][i]["id"]).addClass("ui-disabled");
    else
      $("#wrapper_layer_" + schema["layers"][i]["id"]).removeClass("ui-disabled");
  }
}

Collection.prototype.handleFieldUI = function(schema){
  if(schema["is_visible_name"] == false){
    $('#collectionName').hide();
  }
  if(schema["is_visible_location"] == false){
    $('#location').hide();
  }  
  for(i=0; i<schema["layers"].length;i++){
    for(j=0; j<schema["layers"][i]["fields"].length; j++){
      var field = schema["layers"][i]["fields"][j];
      myField = new Field(field);
      myField.completeFieldRequirement();
    }
    form = form + "</div>";
  }
}

Collection.prototype.addDataToCollectionList = function(collection_schema){
  for(var i=0; i< collection_schema.length; i++){
    if(collection_schema.length > 1 && i == 0){
      classListName = "ui-first-child" 
    }
    else if(collection_schema.length > 1 && i == (collection_schema.length - 1)){
      classListName = "ui-last-child"
    }
    else{
      classListName = ""
    }
    item = Collection.prototype.getListCollectionTemplate(collection_schema[i], classListName)
    $("#listview").append(item);
  }
  
}

Collection.prototype.getListCollectionTemplate = function(collection, classListName){
  item = '<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-up-c ui-btn-icon-right ui-li-has-arrow ui-li ' + classListName + '" >' + 
            '<div class="ui-btn-inner ui-li">' + 
              '<div class="ui-btn-text">' +
                '<a style="cursor: pointer;" onclick="Collection.prototype.showListSites(' + collection["id"]  + ', ' + true + ')"' + ' href="javascript:void(0)" class="ui-link-inherit">' + collection["name"] + '</a>' + 
              '</div>' + 
              '<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
            '</div>' +
          '</li>';
  return item;
}

Collection.prototype.getListSiteTemplate = function(collectionId, site, classListName){
  siteName = site["name"] ? site["name"] : "&nbsp;";
  item = '<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-up-c ui-btn-icon-right ui-li-has-arrow ui-li ' + classListName + '" >' + 
            '<div class="ui-btn-inner ui-li">' + 
              '<div class="ui-btn-text">' +
                '<a style="cursor: pointer;" onclick="Collection.prototype.showSite(' + collectionId + ','+ site["id"] +  ','+ site["idSite"] + ')"' + ' href="javascript:void(0)" class="ui-link-inherit">' + siteName + '</a>' + 
              '</div>' + 
              '<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
            '</div>' +
          '</li>';
  return item;
}

Collection.prototype.addClassToSiteList = function(sites , index){
  if(sites.length > 1 && index == 0){
    classListName = "ui-first-child" 
  }
  else if(sites.length > 1 && index == (sites.length - 1)){
    classListName = "ui-last-child"
  }
  else{
    classListName = ""
  }
  return classListName;
}

Collection.prototype.showListSites = function(collectionId, isFromCollectionList){
  $.mobile.saving('show');
  window.currentCollectionId = collectionId;
  Collection.clearFormData();
  var have_site = false;
  if(window.navigator.onLine){
    $.ajax({
      url: "/mobile/collections/" + collectionId + "/sites.json",
      success: function(sites) {
        $("#listSitesView").html("");
        window.sites = sites;
        for(var i=0; i< sites.length; i++){
          classListName = Collection.prototype.addClassToSiteList(sites, i);
          item = Collection.prototype.getListSiteTemplate(collectionId, sites[i], classListName)
          $("#listSitesView").append(item);
        }
      }
    });
  } else {
    sites = JSON.parse(localStorage.getItem("offlineSites"));
    $("#listSitesView").html("");
    if(sites){
      for(var i=0; i< sites.length; i++){
        classListName = Collection.prototype.addClassToSiteList(sites, i);
        if(sites[i].collectionId == collectionId){
          item = Collection.prototype.getListSiteTemplate(collectionId, sites[i].formData, classListName);
          $("#listSitesView").append(item);
          have_site = true;
        }
      }
    }
  }
  if(!have_site && !window.navigator.onLine){
    Collection.hidePages();
    if(!isFromCollectionList){
      Collection.prototype.goHome();
    }else{
      $("#mobile-sites-main").show();
      Collection.prototype.createSite(window.currentCollectionId);
    }
    $.mobile.saving('hide');
  }else{
    Collection.hidePages();
    $("#mobile-list-sites-main").show();
    schema = Collection.getSchemaByCollectionId(collectionId);
    $("#collectionTitle").html(schema["name"]);
    $.mobile.saving('hide');
  }
}

Collection.prototype.applyBrowserLocation = function(){
  Collection.prototype.getLocation();
}

Collection.prototype.showError = function(error){
  switch(error.code){
    case error.PERMISSION_DENIED:
      Collection.prototype.showErrorMessage("User denied the request for Geolocation.")
      break;
    case error.POSITION_UNAVAILABLE:
      Collection.prototype.showErrorMessage("Location information is unavailable.")
      break;
    case error.TIMEOUT:
      Collection.prototype.showErrorMessage("The request to get user location timed out.")
      break;
    case error.UNKNOWN_ERROR:
      Collection.prototype.showErrorMessage("An unknown error occurred.")
      break;
  }
}

Collection.prototype.getLocation = function(){
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(Collection.prototype.showPosition, Collection.prototype.showError);
  }
  else{
    x.innerHTML="Geolocation is not supported by this browser.";
  }
}

Collection.prototype.setFieldFocus = function(fieldId,fieldCode, fieldKind){
  $("div,span").removeClass('ui-focus');
  fieldValue = Collection.prototype.setFieldValueByKind(fieldKind, fieldCode);
  fieldLogics = Collection.prototype.getFieldLogicByFieldId(fieldId);
  if(fieldLogics){
    for(i=0; i<fieldLogics.length; i++){
      if(fieldLogics[i]["field_id"] != null){
        if(fieldLogics[i]["value"] == fieldValue){       
          fieldFocus = Collection.prototype.findFieldById(fieldLogics[i]["field_id"]); 
          Collection.prototype.setFieldFocusStyleByKind(fieldFocus);
          return;
        }
      }
    }
  }
}

Collection.prototype.setFieldFocusStyleByKind = function(fieldFocus){
  if(fieldFocus['kind'] == 'select_many'){
    $("[name='properties["+fieldFocus['id']+"][]']").first().parent().parent().addClass('ui-focus');
    $("[name='properties["+fieldFocus['id']+"][]']").first().focus();
  }else{
    $('#'+fieldFocus["code"]).parent().addClass('ui-focus');
    $('#'+fieldFocus["code"]).focus();    
  }
}

Collection.prototype.setFieldValueByKind = function(fieldKind, fieldCode){
  if(fieldKind == 'yes_no'){
    if($( "#"+fieldCode+":checked").length == 1){
      value = 0;
    }else{
      value = 1;
    }    
  }else if(fieldKind == 'select_one'){
    value = fieldCode;
  }  

  return value;
}

Collection.prototype.findFieldById = function(fieldId){
  schema = Collection.getSchemaByCollectionId(window.currentCollectionId);
  for(i=0; i<schema["layers"].length;i++){
    for(j=0; j<schema["layers"][i]["fields"].length; j++){
      var field = schema["layers"][i]["fields"][j];   
      if(field["id"] == fieldId){
        return field;
      }
    }
  }
}

Collection.prototype.getFieldLogicByFieldId = function(fieldId){
  schema = Collection.getSchemaByCollectionId(window.currentCollectionId);
  for(i=0; i<schema["layers"].length;i++){
    for(j=0; j<schema["layers"][i]["fields"].length; j++){
      var field = schema["layers"][i]["fields"][j];   
      if(field["id"] == fieldId){
        return field["config"]["field_logics"];
      }
    }
  }
}

Collection.prototype.showPosition = function(position){
  $("#lat").val(position.coords.latitude);
  $("#lng").val(position.coords.longitude);
  Collection.prototype.buildLocation();
}

Collection.prototype.goHome = function(){
  $("#mobile-collections-main").show();
  $("#mobile-sites-main").hide();
  $("#name").val("");
}

Collection.hidePages = function(){
  var pages = ["#map-page", "#mobile-collections-main", "#mobile-sites-main", "#mobile-list-sites-main"];
  for(var i=0; i<pages.length; i++) {
    $(pages[i]).hide();
  }
}

Collection.showCollectionPage = function(){
  Collection.hidePages();
  $("#mobile-collections-main").show();
}

Collection.mapContainer = {} 

Collection.hideMapPage = function(){
  Collection.hidePages();
}

Collection.showMapPage = function() {
  Collection.hidePages();
  Collection.mapContainer.setLatLng( $("#lat").val(),$("#lng").val());
  $("#map-page").show();
  Map.loadMap();
}

Collection.showMainSitePage = function(){
  Collection.hidePages();
  $("#lat").val(Collection.mapContainer.currentLat);
  $("#lng").val(Collection.mapContainer.currentLng);
  Collection.prototype.buildLocation();
  $("#mobile-sites-main").show();
}

Collection.mapContainer.setLatLng = function(lat,lng){
  if(lat && lng) {
    Collection.mapContainer.currentLat = parseFloat(lat) ;
    Collection.mapContainer.currentLng = parseFloat(lng) ;
  }
  Collection.mapContainer.moveToCurrentMarker();
}

Collection.mapContainer.moveToCurrentMarker = function(){
  if(Collection.mapContainer.currentMarker)
    Collection.mapContainer.currentMarker.setMap(null)
  Collection.mapContainer.createCurrentMarker(); 
  
  var point = Collection.mapContainer.currentMarker.getPosition();
  Collection.mapContainer.map.panTo(point);
}

Collection.mapContainer.createCurrentMarker = function() {
  var latLng = new google.maps.LatLng(Collection.mapContainer.currentLat, Collection.mapContainer.currentLng); 
  Collection.mapContainer.currentMarker = new google.maps.Marker({
        position: latLng,
        map: Collection.mapContainer.map,
        title: "Drag this to new position",
        draggable: true
  });

  google.maps.event.addListener(Collection.mapContainer.currentMarker, 'dragend', function (event) {
    var lat = Collection.mapContainer.currentMarker.getPosition().lat();
    var lng = Collection.mapContainer.currentMarker.getPosition().lng();

    Collection.mapContainer.currentLat = lat ;
    Collection.mapContainer.currentLng = lng ;

    var point = Collection.mapContainer.currentMarker.getPosition();
    Collection.mapContainer.map.panTo(point);
  });
}

Collection.mapContainer.currentLatLng = function(){
  Collection.mapContainer.currentLat = Collection.mapContainer.currentLat || 10.803631 ;
  Collection.mapContainer.currentLng = Collection.mapContainer.currentLng || 103.793335;

   return new google.maps.LatLng( Collection.mapContainer.currentLat, Collection.mapContainer.currentLng);
}

Collection.createMap = function(canvasId){
  var latLng = Collection.mapContainer.currentLatLng();
  var myOptions = {
        zoom: 10,
        center: latLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
  };
    
  Collection.mapContainer.map = new google.maps.Map($(canvasId)[0], myOptions);
  Collection.mapContainer.createCurrentMarker();
  Collection.mapContainer.refresh();
}

Collection.assignSite = function(site){
  Collection.clearFormData();
  if(window.navigator.onLine)
    window.currentSiteId = site["id"]
  else
    window.currentSiteId = site["idSite"]
  $("#name").val(site["name"]);
  $("#lat").val(site["lat"]);
  $("#lng").val(site["lng"]);
  focusSchema = Collection.getSchemaByCollectionId(window.currentCollectionId);
  if(focusSchema["is_visible_name"] == false){
    $('#collectionName').hide();
  }
  if(focusSchema["is_visible_location"] == false){
    $('#location').hide();
  }
  var currentSchemaData = jQuery.extend(true, {}, focusSchema);
  $("#title").html(currentSchemaData["name"]);
  rule = SitesPermission.allRule(window.currentCollectionId, window.currentSiteId);
  $("#fields").show();
  if(rule.canRead || rule.canWrite){
    Collection.visibleLayer(window.currentCollectionId, window.currentSiteId, function(visible_layers){
      Collection.handleViewEdit({layers: visible_layers}, site)
      Collection.prototype.handleFieldUI(currentSchemaData);
    });
  }else if(rule.none){
    $("#fields").hide();
  }else{
    Collection.handleViewEdit(currentSchemaData, site);
    Collection.prototype.handleFieldUI(currentSchemaData);
  }
}

Collection.handleViewEdit = function(schema, site){
  fieldHtml = Collection.editLayerForm(schema, site["properties"]);
  $("#fields").html(fieldHtml);
  Collection.prototype.formSiteWithPermission(schema);
}

Collection.clearFormData = function(){
  $("#fields").html("");
  $("#name").val("");
  $("#lat").val("");
  $("#lng").val("");
  window.currentSiteId = null;
}

Collection.editLayerForm = function(schema, properties){
  form = "";
  for(i=0; i<schema["layers"].length;i++){
    form = form + '<div id="wrapper_layer_' + schema["layers"][i]["id"] + '"><h5>' + schema["layers"][i]["name"] + '</h5>';
    for(j=0; j<schema["layers"][i]["fields"].length; j++){
      var field = schema["layers"][i]["fields"][j]
      for(var key in properties){
        if(key == schema["layers"][i]["fields"][j]["id"]){
          field["value"] = properties[key];
        }
      }
      myField = new Field(field);
      form = form + myField.getField();
    }
    form = form + "</div>";
  }
  return form;
}

Collection.mapContainer.refresh =  function(){
  google.maps.event.trigger(Collection.mapContainer.map, 'resize');
}

Collection.prototype.showSite = function(collectionId, siteIdOnline, siteIdOffline){
  if(window.navigator.onLine)
    Collection.prototype.showSiteOnline(collectionId, siteIdOnline);
  else
    Collection.prototype.showSiteOffline(collectionId, siteIdOffline);
}

Collection.prototype.showSiteOffline = function(collectionId, siteId){
  $.mobile.saving('show');
  $("#listSitesView").html("");
  Collection.hidePages();

  sites = JSON.parse(localStorage.getItem("offlineSites"));
  for(var i=0; i< sites.length; i++){
    if(sites[i].formData["idSite"] == siteId){
      Collection.assignSite(sites[i].formData);
    }
  }
  Collection.hideWhileOffline();
  $("#mobile-sites-main").show();
  $.mobile.saving('hide');
}

Collection.prototype.showSiteOnline = function(collectionId, siteId){
  $.mobile.saving('show');
  $("#listSitesView").html("");
  $.ajax({
    url: "/mobile/collections/" + collectionId + "/sites/" + siteId + ".json",
    success: function(site) {
      Collection.hidePages();
      Collection.hideWhileOffline();
      Collection.assignSite(site);
      Collection.prototype.buildLocation();
      $("#mobile-sites-main").show();
      $.mobile.saving('hide');
    }
  });
}

Collection.visibleLayer = function(collectionId, siteId, callback){
  $.ajax({
    url: "/mobile/collections/" + collectionId + "/sites/" + siteId + "/visible_layers_for",
    success: callback
  });
}

Collection.prototype.getFormValue = function(){
  var site = {};
  var properties = {};
  var elements = $("#formSite")[0].elements;
  var propertyIds = []
  for(var i=0; i< elements.length; i++){
    if(elements[i].name.indexOf("properties") == 0 ){
      index = elements[i].name.replace(/[^0-9]/g, '')
      if($.inArray(index, propertyIds) == -1){
        switch(elements[i].getAttribute("datatype")){
          case "photo":
            if(elements[i].getAttribute("data") != null){
              properties[index] = elements[i].getAttribute("data");
            }              
            break;
          case "select_many":
            if(elements[i].checked && (elements[i].value != null || elements[i].value != "")){
              properties[index] = elements[i].value;         
            }
            break;
          case "yes_no":
            if(elements[i].checked){
              properties[index] = elements[i].checked;
            }
            break;
          default:
            if(elements[i].value != null || elements[i].value != ""){
              properties[index] = elements[i].value;
            }            
        }
        propertyIds.push(index);     
      }
      else{
        if(elements[i].getAttribute("datatype") == "select_many" && elements[i].checked && elements[i].value != null){
          if(!(Object.prototype.toString.call( properties[index] ) === '[object Array]') && properties[index] != null){
            properties[index] = [parseInt(properties[index])];
          }
          else if (!(Object.prototype.toString.call( properties[index] ) === '[object Array]') && properties[index] == null){
            properties[index] = [];
          }
          properties[index].push(parseInt(elements[i].value));
        }
      }
    }
    else{
      if(elements[i].name != ""){
        site[elements[i].name] = elements[i].value;
      }      
    }
  }
  site["properties"] = properties;
  return site;
}

Collection.prototype.handleFileUpload = function(el){
  var file = el.files[0];
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function (event) {    
    el.setAttribute('data', reader.result);
  };
}
