/* eslint no-console: 0 */

import Ember from 'ember';

const { Controller, computed: { alias } } = Ember;

export default Controller.extend({
  small: false,

  numbers: alias('model'),

  actions: {
    toggleSmall() {
      this.toggleProperty('small');
    },

    handleScrollStart() {
      console.log('SCROLL START ::', Date.now());
    },

    handleScrollEnd() {
      console.log('SCROLL END ::', Date.now());
    },

    handleResizeStart() {
      console.log('RESIZE START ::', Date.now());
    },

    handleResizeEnd() {
      console.log('RESIZE END ::', Date.now());
    }
  }
});
