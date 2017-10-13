/* eslint no-console: 0 */

import Ember from 'ember';

const { Controller, computed: { alias }, set } = Ember;

export default Controller.extend({
  small: false,

  moveTo: null,

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

    handleResizeStart(props) {
      this.__indexAtStart__ = props.startingIndex;
      console.log('RESIZE START ::', Date.now());
    },

    handleResize() {
      set(this, 'moveTo', this.__indexAtStart__);
    },

    handleResizeEnd() {
      set(this, 'moveTo', this.__indexAtStart__);
      console.log('RESIZE END ::', Date.now());
    }
  }
});
