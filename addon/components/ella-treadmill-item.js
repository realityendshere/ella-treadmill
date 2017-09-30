import Ember from 'ember';
import layout from '../templates/components/ella-treadmill-item';

const { Component, computed, get, getProperties } = Ember;

export default Component.extend({
  layout,

  tagName: 'ella-treadmill-item',

  attributeBindings: [
    'aria-hidden'
  ],

  classNames: 'ella-treadmill-item',

  ariaRole: 'listitem',

  columns: 1,

  display: 'block',

  height: 0,
  heightUnit: 'px',

  index: -1,
  item: null,

  parent: null,

  pageSize: 1,

  'aria-hidden': computed.lt('index', 0),

  isSampleItem: computed('parent.sampleItem', function() {
    return get(this, 'parent.sampleItem') === this;
  }),

  translateY: computed('height', 'index', 'pageSize', 'columns', 'heightUnit', function() {
    let {
      index,
      height,
      pageSize,
      columns,
      heightUnit
    } = getProperties(this, 'height', 'index', 'pageSize', 'columns', 'heightUnit');

    let pageRows = Math.ceil(pageSize / columns);

    return ((Math.floor(index / pageSize) * pageRows * height) || 0) + heightUnit;
  }),

  width: computed('columns', function() {
    let columns = parseInt(get(this, 'columns'), 10) || 1;

    return 100 / columns;
  }),

  widthUnit: computed(function() {
    return '%';
  }).readOnly(),

  didInsertElement() {
    this.sendAction('on-insert', this);
  },

  didUpdate() {
    if (!get(this, 'isSampleItem')) {
      return;
    }

    let element = get(this, 'element');

    if (element && typeof element.getBoundingClientRect === 'function') {
      this.sendAction('on-update', element.getBoundingClientRect());
    }
  },

  willDestroyElement() {
    this.sendAction('on-destroy', this);
  }
});
