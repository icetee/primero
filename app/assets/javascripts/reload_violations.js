var ViolationListReload = Backbone.View.extend({
  el: '.side-tab-content',

  events: {
    "change fieldset[id$='_violation_wrapper']": 'reload'
  },

  initialize: function() {
    $('body').on('violation-removed', $.proxy(function() {
      this.reload();
    }, this));
  },

  //Refresh the options in the violations select
  reload: function(event) {
    var violation_list = [];
    var count = 0;

    var context = this.el;

    // Build new violations list
    $(context).find("fieldset[id$='_violation_wrapper']").each(function(x, violationListEl){
      var index = 0;  // counter for each type of violation
      $(violationListEl).find(".subforms").children('div').each(function(x, violationEl){
        if ($(violationEl).children().length > 0) {

          //Only add to the list if the fields have values
          var valueLength = 0;
          $(violationEl).find('input, select, textarea').each(function(x, fieldEl){
            var tmpLen = $.trim($(fieldEl).val()).length;
            if (tmpLen > 0 && $(fieldEl).val() != fieldEl.defaultValue){
               valueLength++;
               return false;
            }
          });

          if (valueLength > 0) {
            // get subform header
            _primero.update_subform_heading(violationEl);
            var tmpValue = $(violationEl).find(".collapse_expand_subform_header div.display_field span").text();
            var tmpRes = $(violationEl).find(".collapse_expand_subform_header label").text();
            var res = tmpRes + " " + tmpValue + " " + index;
            violation_list.push(res);
            index++;
          }
        }
      });
    });

    if (violation_list.length === 0){
      violation_list.push("NONE");
    }

    // Find all violations selects and replace options with new list
    $(context).find("select[id$='_violations_']").each(function(x, violationSelectEl){
      // Save the select values
      var selectedItems = $(violationSelectEl).val();

      //Clear out existing options
      $(violationSelectEl).empty();

      //Add new options
      _.each(violation_list, function(i){
        var newOption = $('<option value="' + i + '">' + i + '</option>');
        $(violationSelectEl).append(newOption);
      });

      //Add back the select values
      $(violationSelectEl).val(selectedItems);

      $(violationSelectEl).trigger("chosen:updated");
    });
  },
});

$(document).ready(function() {
  var violationListReload = new ViolationListReload();
});
