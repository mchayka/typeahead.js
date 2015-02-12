 /*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

(function() {
  'use strict';

  var old, typeaheadKey, methods;

  old = $.fn.typeahead;

  typeaheadKey = 'ttTypeahead';

  methods = {
    initialize: function initialize(o) {

      o = o || {};

      return this.each(attach);

      function attach() {
        var $control = $(this), typeahead;

        if ($control.is("select")) {
          typeahead = new Typeahead({
            select: $control,
            withHint: _.isUndefined(o.hint) ? true : !!o.hint,
            minLength: 0,
            autoselect: o.autoselect,
            hint: false
          });
        } else {
          typeahead = new ControlPlain({
            control: $control,
          });
        }

        $control.data(typeaheadKey, typeahead);
      }
    },

    open: function open() {
      return this.each(openTypeahead);

      function openTypeahead() {
        var $control = $(this), typeahead;

        if (typeahead = $control.data(typeaheadKey) && $control.is("select")) {
          typeahead.open();
        }
      }
    },

    close: function close() {
      return this.each(closeTypeahead);

      function closeTypeahead() {
        var $control = $(this), typeahead;

        if (typeahead = $control.data(typeaheadKey) && $control.is("select")) {
          typeahead.close();
        }
      }
    },

    val: function val(newVal) {
      // mirror jQuery#val functionality: reads opearte on first match,
      // write operates on all matches
      return !arguments.length ? getVal(this.first()) : this.each(setVal);

      function setVal() {
        var $control = $(this), typeahead;

        if (typeahead = $control.data(typeaheadKey) && $control.is("select")) {
          typeahead.setVal(newVal);
        }
      }

      function getVal($select) {
        var $control = $(this), typeahead, query;

        if (typeahead = $control.data(typeaheadKey) && $control.is("select")) {
          query = typeahead.getVal();
        }

        return query;
      }
    },

    destroy: function destroy() {
      return this.each(unattach);

      function unattach() {
        var $control = $(this), typeahead;

        if (typeahead = $control.data(typeaheadKey)) {
          typeahead.destroy();
          $control.removeData(typeaheadKey);
        }
      }
    },

    cancelValue: function cancelValue() {
      return this.each(cancelValue);

      function cancelValue() {
        var $control = $(this), typeahead;

        if (typeahead = $control.data(typeaheadKey)) {
          typeahead.cancelValue();
        }
      }
    }
  };

  $.fn.typeahead = function(method) {
    var tts;

    // methods that should only act on intialized typeaheads
    if (methods[method] && method !== 'initialize') {
      // filter out non-typeahead inputs
      tts = this.filter(function() { return !!$(this).data(typeaheadKey); });
      return methods[method].apply(tts, [].slice.call(arguments, 1));
    }

    else {
      return methods.initialize.apply(this, arguments);
    }
  };

  $.fn.typeahead.noConflict = function noConflict() {
    $.fn.typeahead = old;
    return this;
  };
})();
