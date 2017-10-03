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

  classNameBindings: ['classRow', 'classColumn'],

  ariaRole: 'listitem',

  columns: 1,

  display: 'block',

  fluctuate: 2,
  fluctuateColumn: 2,

  height: 0,
  heightUnit: 'px',

  index: -1,
  item: null,

  parent: null,

  pageSize: 1,

  'aria-hidden': computed.lt('index', 0),

  classRow: computed('fluctuate', 'index', 'columns', function() {
    let {
      fluctuate,
      index,
      columns
    } = getProperties(this, 'fluctuate', 'index', 'columns');

    let row = Math.floor((index % (fluctuate * columns)) / columns) + 1;

    return `ella-treadmill-item-row-${row}`;
  }),

  classColumn: computed('index', 'columns', 'fluctuateColumn', function() {
    let {
      index,
      columns,
      fluctuateColumn
    } = getProperties(this, 'index', 'columns', 'fluctuateColumn');

    let col = ((index % columns) % fluctuateColumn) + 1;

    return `ella-treadmill-item-column-${col}`;
  }),

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
    let fn = get(this, 'on-insert');

    if (typeof fn === 'function') {
      fn(this);
    }
  },

  didUpdate() {
    if (!get(this, 'isSampleItem')) {
      return;
    }

    let element = get(this, 'element');
    let fn = get(this, 'on-update');

    if (element && typeof element.getBoundingClientRect === 'function' && typeof fn === 'function') {
      fn(element.getBoundingClientRect());
    }
  },

  willDestroyElement() {
    let fn = get(this, 'on-destroy');

    if (typeof fn === 'function') {
      fn(this);
    }
  }
});
