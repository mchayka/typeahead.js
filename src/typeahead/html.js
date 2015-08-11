/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

var html = (function() {
  return {
    wrapper: '<span class="twitter-typeahead twitter-typeahead-custom"></span>',
    input: '<input autocomplete="off" spellcheck="false" type="text">',
    dropdown: '<span class="tt-dropdown-menu"></span>',
    button: '<span class="tt-button" role="button">&#x25BC;</span>',
    edit: '<span class="tt-edit"></span>',
    cancel: '<span class="tt-cancel" role="button">&times;</span>',
    dataset: '<div class="tt-dataset-%CLASS%"></div>',
    suggestions: '<span class="tt-suggestions"></span>',
    suggestion: '<div class="tt-suggestion"></div>'
  };
})();
