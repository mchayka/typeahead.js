/*
* typeahead.js
* https://github.com/twitter/typeahead.js
* Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
*/

var ControlPlain = (function() {
  'use strict';

  var specialKeyCodeMap;

  specialKeyCodeMap = {
    9: 'tab',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  // constructor
  // -----------

  function ControlPlain(o) {
    var $cancel, $edit, that, onBlur, onFocus, onInput;

    that = this;

    if (!o.control) {
      $.error('missing control');
    }

    // bound functions
    onBlur = _.bind(this._onBlur, this);
    onFocus = _.bind(this._onFocus, this);
    onInput = _.bind(this._onInput, this);

    this.$node = buildDom(o.control);
    $edit = this.$node.find('.tt-edit');

    this.$control = $(o.control)
    .on('blur.tt', onBlur)
    .on('focus.tt', onFocus);

    // ie7 and ie8 don't support the input event
    // ie9 doesn't fire the input event when characters are removed
    // not sure if ie10 is compatible
    if (!_.isMsie()) {
      this.$control.on('input.tt', onInput);
    }

    else {
      this.$control.on('keydown.tt keypress.tt cut.tt paste.tt', function($e) {
        // if a special key triggered this, ignore it
        if (specialKeyCodeMap[$e.which || $e.keyCode]) { return; }

          // give the browser a chance to update the value of the input
          // before checking to see if the query changed
          _.defer(_.bind(that._onInput, that, $e));
        });
      }

    $cancel = this.$node.find('.tt-cancel');

    $cancel.on('mousedown.tt', function($e) {
      $e.preventDefault();
      that.cancelValue();
      that.$control.blur();
      that._checkChanges();
    });

    $edit.on('click.tt', function($e) {
      that.$control.focus();
    });

    // store default value to be able to reset value
    this.setDefaultValue(this.getValue());
  }

  // instance methods
  // ----------------

  _.mixin(ControlPlain.prototype, {

    // ### private

    _onBlur: function onBlur() {
      this.$node.removeClass('is-active');
    },

    _onFocus: function onFocus() {
      this.$node.addClass('is-active');
    },

    _onInput: function onInput() {
      this._checkChanges();
    },

    _checkChanges: function checkChanges() {
      this.getValue() === this.getDefaultValue() ?
      this.$control.removeClass('is-changed') : this.$control.addClass('is-changed');
      this.$control.trigger('changedInput.tt');
    },

    // ### public

    setValue: function setControlValue(value) {
      this.$control.val(value);
    },

    getValue: function getValue() {
      return this.$control.val();
    },

    getDefaultValue: function getDefaultValue() {
      return this.$control.data('default-value');
    },

    setDefaultValue: function getDefaultValue(value) {
      return this.$control.data('default-value', value);
    },

    cancelValue: function cancelValue() {
      this.$control.val(this.getDefaultValue());
      this._checkChanges();
    },

    destroy: function destroy() {
      destroyDomStructure(this.$node);

      this.$node = null;
    }
  });

  return ControlPlain;

  function buildDom(control) {
    var $control, $wrapper, $cancel, $edit;

    $wrapper = $(html.wrapper).css(css.wrapper);
    $control = $(control);
    $cancel = $(html.cancel).css(css.cancel);
    $edit = $(html.edit);

    $control.addClass('tt-control');

    return $control
    .wrap($wrapper)
    .parent()
    .append($cancel)
    .append($edit);
  };

  function destroyDomStructure($node) {
    var $control = $node.find('.tt-control');

    $control
    .detach()
    .removeClass('tt-control')
    .insertAfter($node);

    $node.remove();
  }
})();
