/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var Typeahead = (function() {
  'use strict';

  var attrsKey = 'ttAttrs';

  // constructor
  // -----------

  // THOUGHT: what if datasets could dynamically be added/removed?
  function Typeahead(o) {
    var $menu, $input, $hint, $select, $button, $cancel, $edit, that;

    o = o || {};

    if (!o.select) {
      $.error('missing select');
    }

    o.datasets = {};

    that = this;
    this.isActivated = false;
    this.autoselect = !!o.autoselect;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
    this.$node = buildDom(o.select, o.withHint);
    this.$select = $(o.select);

    $select = $(o.select);
    $menu = this.$node.find('.tt-dropdown-menu');
    $input = this.$node.find('.tt-input');
    $hint = this.$node.find('.tt-hint');
    $button = this.$node.find('.tt-button');
    $cancel = this.$node.find('.tt-cancel');
    $edit = this.$node.find('.tt-edit');

    o.datasets = getSelectDataset($select);

    // #705: if there's scrollable overflow, ie doesn't support
    // blur cancellations when the scrollbar is clicked
    //
    // #351: preventDefault won't cancel blurs in ie <= 8
    $input.on('blur.tt', function($e) {
      var active, isActive, hasActive;

      active = document.activeElement;
      isActive = $menu.is(active);
      hasActive = $menu.has(active).length > 0;

      if (_.isMsie() && (isActive || hasActive)) {
        $e.preventDefault();
        // stop immediate in order to prevent Input#_onBlur from
        // getting exectued
        $e.stopImmediatePropagation();
        _.defer(function() { $input.focus(); });
      }
    });

    // #351: prevents input blur due to clicks within dropdown menu
    $menu.on('mousedown.tt', function($e) { $e.preventDefault(); });

    this.eventBus = o.eventBus || new EventBus({ el: $input });

    this.dropdown = new Dropdown({ menu: $menu, datasets: o.datasets })
    .onSync('suggestionClicked', this._onSuggestionClicked, this)
    .onSync('cursorMoved', this._onCursorMoved, this)
    .onSync('cursorRemoved', this._onCursorRemoved, this)
    .onSync('opened', this._onOpened, this)
    .onSync('closed', this._onClosed, this)
    .onAsync('datasetRendered', this._onDatasetRendered, this);

    this.input = new Input({ input: $input, hint: $hint, select: $select })
    .onSync('focused', this._onFocused, this)
    .onSync('blurred', this._onBlurred, this)
    .onSync('enterKeyed', this._onEnterKeyed, this)
    .onSync('tabKeyed', this._onTabKeyed, this)
    .onSync('escKeyed', this._onEscKeyed, this)
    .onSync('upKeyed', this._onUpKeyed, this)
    .onSync('downKeyed', this._onDownKeyed, this)
    .onSync('leftKeyed', this._onLeftKeyed, this)
    .onSync('rightKeyed', this._onRightKeyed, this)
    .onSync('queryChanged', this._onQueryChanged, this)
    .onSync('whitespaceChanged', this._onWhitespaceChanged, this)
    .onSync('cancelValue', this._checkChanges, this);

    $button.on('mousedown.tt', function($e) {
      $e.preventDefault();
      that.dropdown.update('', that.input.getInputValue());
      that.dropdown.open();
    });

    $cancel.on('mousedown.tt', function($e) {
      $e.preventDefault();
      that.input.blur();
      that.input.cancelInputValue();
      that._checkChanges();
    });

    $edit.on('click.tt', function($e) {
      that.input.focus();
    });

    this._setLanguageDirection();
  }

  // instance methods
  // ----------------

  _.mixin(Typeahead.prototype, {

    // ### private

    _onSuggestionClicked: function onSuggestionClicked(type, $el) {
      var datum;

      if (datum = this.dropdown.getDatumForSuggestion($el)) {
        this._select(datum);
      }
    },

    _onCursorMoved: function onCursorMoved() {
      var datum = this.dropdown.getDatumForCursor();

      this.input.setInputValue(datum.value, true);

      this.eventBus.trigger('cursorchanged', datum.raw, datum.datasetName);
    },

    _onCursorRemoved: function onCursorRemoved() {
      this.input.resetInputValue();
      this._updateHint();
    },

    _onDatasetRendered: function onDatasetRendered() {
      this._updateHint();
    },

    _onOpened: function onOpened() {
      this._updateHint();

      this.eventBus.trigger('opened');
    },

    _onClosed: function onClosed() {
      this.input.clearHint();
      this.eventBus.trigger('closed');
    },

    _onFocused: function onFocused() {
      this.isActivated = true;
      // this.dropdown.update('', this.input.getInputValue());
      // this.dropdown.open();
      this.$node.addClass('is-active');
    },

    _onBlurred: function onBlurred() {
      this.isActivated = false;
      this.dropdown.empty();
      this.dropdown.close();
      this.$node.removeClass('is-active');
      this.input.checkInputQuery();
      this._checkChanges();
    },

    _onEnterKeyed: function onEnterKeyed(type, $e) {
      var cursorDatum, topSuggestionDatum;

      cursorDatum = this.dropdown.getDatumForCursor();
      topSuggestionDatum = this.dropdown.getDatumForTopSuggestion();

      if (cursorDatum) {
        this._select(cursorDatum);
        $e.preventDefault();
      }

      else if (this.autoselect && topSuggestionDatum) {
        this._select(topSuggestionDatum);
        $e.preventDefault();
      }
    },

    _onTabKeyed: function onTabKeyed(type, $e) {
      var datum;

      if (datum = this.dropdown.getDatumForCursor()) {
        this._select(datum);
        $e.preventDefault();
      }

      else {
        this._autocomplete(true);
      }
    },

    _onEscKeyed: function onEscKeyed() {
      this.dropdown.close();
      this.input.resetInputValue();
    },

    _onUpKeyed: function onUpKeyed() {
      var query = this.input.getQuery();

      this.dropdown.isEmpty && query.length >= this.minLength ?
        this.dropdown.update(query) :
        this.dropdown.moveCursorUp();

      this.dropdown.open();
    },

    _onDownKeyed: function onDownKeyed() {
      var query = this.input.getQuery();

      this.dropdown.isEmpty && query.length >= this.minLength ?
        this.dropdown.update(query) :
        this.dropdown.moveCursorDown();

      this.dropdown.open();
    },

    _onLeftKeyed: function onLeftKeyed() {
      this.dir === 'rtl' && this._autocomplete();
    },

    _onRightKeyed: function onRightKeyed() {
      this.dir === 'ltr' && this._autocomplete();
    },

    _onQueryChanged: function onQueryChanged(e, query) {
      this.input.clearHintIfInvalid();

      if (query.length >= this.minLength) {
        // if (this.$select.find('option:selected').text() === query) {
        //   this.dropdown.empty();
        // }
        // else {
          this.dropdown.update(query);
        // }
      }
      else {
        this.dropdown.empty();
      }

      this.dropdown.open();
      this._setLanguageDirection();
      this._checkChanges();
    },

    _onWhitespaceChanged: function onWhitespaceChanged() {
      this._updateHint();
      this.dropdown.open();
    },

    _checkChanges: function checkChanges() {
      this.input.getInputValue() === this.input.getInputDefaultValue() ?
        this.$select.removeClass('is-changed') : this.$select.addClass('is-changed');
      this.$select.trigger('changedInput.tt');
    },

    _setLanguageDirection: function setLanguageDirection() {
      var dir;

      if (this.dir !== (dir = this.input.getLanguageDirection())) {
        this.dir = dir;
        this.$node.css('direction', dir);
        this.dropdown.setLanguageDirection(dir);
      }
    },

    _updateHint: function updateHint() {
      var datum, val, query, escapedQuery, frontMatchRegEx, match;

      datum = this.dropdown.getDatumForTopSuggestion();

      if (datum && this.dropdown.isVisible() && !this.input.hasOverflow()) {
        val = this.input.getInputValue();
        query = Input.normalizeQuery(val);
        escapedQuery = _.escapeRegExChars(query);

        // match input value, then capture trailing text
        frontMatchRegEx = new RegExp('^(?:' + escapedQuery + ')(.+$)', 'i');
        match = frontMatchRegEx.exec(datum.value);

        // clear hint if there's no trailing text
        match ? this.input.setHint(val + match[1]) : this.input.clearHint();
      }

      else {
        this.input.clearHint();
      }
    },

    _autocomplete: function autocomplete(laxCursor) {
      var hint, query, isCursorAtEnd, datum;

      hint = this.input.getHint();
      query = this.input.getQuery();
      isCursorAtEnd = laxCursor || this.input.isCursorAtEnd();

      if (hint && query !== hint && isCursorAtEnd) {
        datum = this.dropdown.getDatumForTopSuggestion();
        datum && this.input.setInputValue(datum.value);

        this.eventBus.trigger('autocompleted', datum.raw, datum.datasetName);
      }
    },

    _select: function select(datum) {
      this.input.setQuery(datum.value);
      this.input.setInputValue(datum.value, true);

      this._setLanguageDirection();

      this.eventBus.trigger('selected', datum.raw, datum.datasetName);
      this.dropdown.close();
      this._checkChanges();

      // #118: allow click event to bubble up to the body before removing
      // the suggestions otherwise we break event delegation
      _.defer(_.bind(this.dropdown.empty, this.dropdown));
    },

    // ### public

    open: function open() {
      this.dropdown.open();
    },

    cancelValue: function cancelValue() {
      this.input.cancelInputValue();
    },

    close: function close() {
      this.dropdown.close();
    },

    setVal: function setVal(val) {
      // expect val to be a string, so be safe, and coerce
      val = _.toStr(val);

      if (this.isActivated) {
        this.input.setInputValue(val);
      }

      else {
        this.input.setQuery(val);
        this.input.setInputValue(val, true);
      }

      this._setLanguageDirection();
    },

    getVal: function getVal() {
      return this.input.getQuery();
    },

    destroy: function destroy() {
      this.input.destroy();
      this.dropdown.destroy();

      destroyDomStructure(this.$node);

      this.$node = null;
    }
  });

  return Typeahead;

  function buildDom(select, withHint) {
    var $select, $input, $wrapper, $dropdown, $hint, $button, $cancel, $edit;

    $select = $(select).css(css.control);
    $input = $(html.input).css(css.input);
    $wrapper = $(html.wrapper).css(css.wrapper);
    $dropdown = $(html.dropdown).css(css.dropdown);
    $hint = $(html.input).css(css.hint).css(getBackgroundStyles($input));
    $button = $(html.button).css(css.button);
    $cancel = $(html.cancel).css(css.cancel);
    $edit = $(html.edit);

    $select
    .addClass('tt-select');

    $hint
    .val('')
    .addClass('tt-hint')
    .prop('readonly', true)
    .attr({ tabindex: -1 });

    $input
    .val($select.find('option:selected').text())
    .addClass('tt-input')
    .css(withHint ? css.input : css.inputWithNoHint);

    return $select
    .wrap($wrapper)
    .parent()
    .append(withHint ? $hint : null)
    .append($input)
    .append($button)
    .append($edit)
    .append($dropdown)
    .append($cancel);
  }

  function getBackgroundStyles($el) {
    return {
      backgroundAttachment: $el.css('background-attachment'),
      backgroundClip: $el.css('background-clip'),
      backgroundColor: $el.css('background-color'),
      backgroundImage: $el.css('background-image'),
      backgroundOrigin: $el.css('background-origin'),
      backgroundPosition: $el.css('background-position'),
      backgroundRepeat: $el.css('background-repeat'),
      backgroundSize: $el.css('background-size')
    };
  }

  function getSelectDataset($select) {
    var data = [];

    $.each($select.find('option'), function(index, option){
        data.push(option.text);
    });
    return [{
      name: 'select',
      source: substringMatcher(data),
      displayKey: 'value'
    }];
  }

  function substringMatcher(strs) {
    return function findMatches(q, cb, excludeStr) {
      var matches, substrRegex;

      matches = [];

      substrRegex = new RegExp(q, 'i');

      $.each(strs, function(i, str) {
        if (substrRegex.test(str) && str !== excludeStr) {
          matches.push({ value: str });
        }
      });

      cb(matches);
    };
  };

  function destroyDomStructure($node) {
    var $select = $node.find('.tt-select');

    $select
    .detach()
    .removeClass('tt-select')
    .insertAfter($node);

    $node.remove();
  }
})();
