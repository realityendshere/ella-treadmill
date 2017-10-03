import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';
import layout from '../templates/components/ella-treadmill';

const {
  Component,
  computed,
  get,
  getProperties,
  set,
  setProperties,
  run: {
    debounce
  },
  A
} = Ember;

const RECALC_INTERVAL = 20;
const NO_WINDOW_HEIGHT = 1024;
const NO_WINDOW_WIDTH = 768;
const DEFAULT_ROW_HEIGHT = 50;

const FAKE_WINDOW = {
  clientWidth: NO_WINDOW_WIDTH,
  clientHeight: NO_WINDOW_HEIGHT,
  scrollY: 0
};

let ancestors = function(node, parents = []) {
  return (node === null || node.parentNode === null) ?
    parents : ancestors(node.parentNode, parents.concat([node]));
};

export default Component.extend({
  layout,

  tagName: 'ella-treadmill',

  attributeBindings: [
    'data-scroll-top',
    'topDelta:data-scroll-delta',
    'startingIndex:data-first-visible-index',
    'numberOfVisibleItems:data-visible-items'
  ],

  classNames: 'ella-treadmill',
  classNameBindings: [
    'resizing:is-resizing:not-resizing',
    'scrolling:is-scrolling:not-scrolling'
  ],

  ariaRole: 'list',

  display: 'flex',

  fluctuate: 2,
  fluctuateColumn: 2,

  itemHeight: 0,
  itemWidth: 0,

  minItemWidth: 100,
  widthUnit: '%',

  overdraw: 0,

  parentHeight: 0,
  parentWidth: 0,

  resizing: 0,

  row: DEFAULT_ROW_HEIGHT,
  rowUnit: 'px',

  sampleItem: null,

  scrolling: 0,
  scrollTop: 0,

  height: computed.alias('row'),
  heightUnit: computed.alias('rowUnit'),

  columns: computed('minItemWidth', 'widthUnit', 'parentWidth', function() {
    let { minItemWidth, widthUnit } = getProperties(this, 'minItemWidth', 'widthUnit');
    let parent;
    let parentWidth;
    let result;

    switch (widthUnit) {
      case '%':
        result = Math.floor(100 / minItemWidth);
        break;
      case 'px':
        parent = this.scrollingParent();

        if (parent === window) {
          parentWidth = get(document, 'body.clientWidth');
        } else {
          parentWidth = get(parent, 'clientWidth') || get(this, '_defaultWidth');
        }

        result = Math.floor(parentWidth / minItemWidth);

        break;
      default:
        result = 1;
        break;
    }

    return Math.max(result, 1);
  }),

  'data-scroll-top': computed('scrollTop', function() {
    return get(this, 'scrollTop') || '0';
  }).readOnly(),

  geometryElement: computed(function() {
    let element = get(this, 'element');

    if (!element) {
      return {};
    }

    return element.getBoundingClientRect();
  }).volatile(),

  geometryParent: computed(function() {
    let parent = this.scrollingParent();

    return (parent && typeof parent.getBoundingClientRect === 'function') ?
      parent.getBoundingClientRect() : {};
  }).volatile(),

  indices: computed('numberOfVisibleItems', 'content.length', function() {
    let maxIdx = Math.min(get(this, 'numberOfVisibleItems'), get(this, 'content.length'));
    let result = A();

    for (let i = 0; i < maxIdx; ++i) {
      result.push(i);
    }

    return result;
  }),

  numberOfVisibleItems: computed('visibleRows', 'columns', 'content.length', function() {
    return Math.min(get(this, 'visibleRows') * get(this, 'columns'), get(this, 'content.length') || 0);
  }),

  rowCount: computed('scrollTop', 'parentHeight', 'itemHeight', function() {
    let parentHeight = get(this, 'parentHeight') || get(this, '_defaultHeight');
    let itemHeight = get(this, 'itemHeight');
    let rowCount = (parentHeight / itemHeight) || 0;

    return (rowCount && rowCount !== Infinity) ? Math.ceil(rowCount) : 0;
  }),

  startingIndex: computed('topDelta', 'itemHeight', 'numberOfVisibleItems', 'content.length', 'columns', '_overdrawRows', function() {
    let columns = get(this, 'columns');
    let idx = Math.floor(get(this, 'topDelta') / get(this, 'itemHeight')) * columns;
    let len = get(this, 'content.length');
    let od = get(this, '_overdrawRows');

    // Adjust starting index for overdraw above "stage"
    idx = idx - (od * columns);

    return Math.min(len - get(this, 'numberOfVisibleItems'), Math.max(0, idx)) || 0;
  }),

  topDelta: computed('scrollTop', function() {
    let elementTop = get(this, 'geometryElement.top');
    let parentTop = get(this, 'geometryParent.top') || 0;

    return (parentTop - elementTop) || 0;
  }),

  totalHeight: computed('_row', 'content', 'content.length', 'columns', function() {
    let row = parseFloat(get(this, '_row'), 10);
    let columns = parseFloat(get(this, 'columns'), 10);
    let length = get(this, 'content.length');

    return row * length / columns;
  }),

  totalWidth: computed('column', function() {
    let column = parseInt(get(this, 'column'), 10);

    return column;
  }),

  visibleContent: computed('visibleIndices', '_content', function() {
    let {
      visibleIndices,
      _content
    } = getProperties(this, 'visibleIndices', '_content');

    return A(_content.objectsAt(visibleIndices));
  }),

  visibleIndices: computed('startingIndex', 'numberOfVisibleItems', 'content.length', function() {
    let {
      startingIndex,
      numberOfVisibleItems
    } = getProperties(this, 'startingIndex', 'numberOfVisibleItems');

    let mod = startingIndex % numberOfVisibleItems;
    let page = Math.floor(startingIndex/numberOfVisibleItems);
    let maxIdx = Math.min(numberOfVisibleItems, get(this, 'content.length'));
    let result = A();

    for (let i = 0; i < maxIdx; ++i) {
      let p = page;

      if (i < mod) {
        p = page + 1;
      }

      result.push((p * numberOfVisibleItems) + i);
    }

    return result;
  }),

  visibleRows: computed('rowCount', '_overdrawRows', function() {
    let { rowCount, _overdrawRows } = getProperties(this, 'rowCount', '_overdrawRows');

    return (Math.ceil(rowCount + (2 * _overdrawRows)) || 0) + 1;
  }),

  _content: computed('content', function() {
    return A([].concat(get(this, 'content')));
  }),

  _defaultHeight: computed(function() {
    return (window) ? window.innerHeight : NO_WINDOW_HEIGHT;
  }).volatile(),

  _defaultWidth: computed(function() {
    return (window) ? window.innerWidth : NO_WINDOW_WIDTH;
  }).volatile(),

  _overdrawRows: computed('rowCount', 'overdraw', function() {
    let rowCount = get(this, 'rowCount');
    let od = (parseInt(get(this, 'overdraw'), 10) || 0) / 100;

    return Math.ceil(rowCount * od)
  }),

  _resizeHandler: computed(function() {
    let interval = RECALC_INTERVAL;

    let debouncedHandler = () => {
      get(this, 'resizeTask').cancelAll();
      get(this, 'resizeEndTask').perform();
    };

    return (evt) => {
      get(this, 'resizeTask').perform();
      debounce(this, debouncedHandler, evt, interval * 2);
    };
  }),

  _row: computed('row', 'rowUnit', 'parentHeight', function() {
    let { row, rowUnit } = getProperties(this, 'row', 'rowUnit');
    let parent;
    let parentHeight;
    let result;

    switch (rowUnit) {
      case '%':
        parent = this.scrollingParent();
        parentHeight = get(parent, 'clientHeight') || get(this, '_defaultHeight');
        result = (row / 100) * parentHeight;
        break;
      default:
        result = (row && row > 0) ? row : DEFAULT_ROW_HEIGHT;
        break;
    }

    return result;
  }),

  _rowUnit: computed('rowUnit', function() {
    let rowUnit = get(this, 'rowUnit');
    let result;

    switch (rowUnit) {
      case '%':
        result = 'px';
        break;
      default:
        result =  rowUnit;
        break;
    }

    return result;
  }),

  _scrollHandler: computed(function() {
    let interval = RECALC_INTERVAL;

    let debouncedHandler = () => {
      get(this, 'scrollTask').cancelAll();
      get(this, 'scrollEndTask').perform();
    };

    return (evt) => {
      get(this, 'scrollTask').perform();
      debounce(this, debouncedHandler, evt, interval * 2);
    };
  }),

  didInsertElement() {
    let scrollHandler = get(this, '_scrollHandler');
    let resizeHandler = get(this, '_resizeHandler');
    let parents = ancestors(get(this, 'element.parentNode'));

    parents.forEach((node) => {
      node.addEventListener('scroll', scrollHandler);
      node.addEventListener('resize', resizeHandler);
    });

    if (document) {
      document.addEventListener('scroll', scrollHandler);
    }

    if (window) {
      window.addEventListener('resize', resizeHandler);
    }

    this.updateGeometry();
  },

  willDestroyElement() {
    let scrollHandler = get(this, '_scrollHandler');
    let resizeHandler = get(this, '_resizeHandler');
    let parents = ancestors(get(this, 'element.parentNode'));

    if (window) {
      window.removeEventListener('resize', resizeHandler);
    }

    if (document) {
      document.removeEventListener('scroll', scrollHandler);
    }

    parents.forEach((node) => {
      node.removeEventListener('scroll', scrollHandler);
      node.removeEventListener('resize', resizeHandler);
    });
  },

  actions: {
    listItemInserted(item) {
      if (!get(this, 'sampleItem')) {
        set(this, 'sampleItem', item);
      }
    },

    listItemUpdated(geometry) {
      setProperties(this, {
        itemHeight: geometry.height,
        itemWidth: geometry.width
      });
    },

    listItemDestroyed(item) {
      if (get(this, 'sampleItem') === item) {
        set(this, 'sampleItem', null);
      }
    }
  },

  resizeTask: task(function* () {
    this.incrementProperty('resizing');
    this.updateGeometry();
    yield timeout(RECALC_INTERVAL);
  }),

  resizeEndTask: task(function* () {
    try {
      yield this.updateGeometry();
    } finally {
      let fn = get(this, 'on-resize-end');
      set(this, 'resizing', 0);

      if (typeof fn === 'function') {
        fn();
      }
    }
  }),

  scrollTask: task(function* () {
    this.incrementProperty('scrolling');
    this.updateGeometry();
    yield timeout(RECALC_INTERVAL);
  }),

  scrollEndTask: task(function* () {
    try {
      yield this.updateGeometry();
    } finally {
      let fn = get(this, 'on-scroll-end');
      set(this, 'scrolling', 0);

      if (typeof fn === 'function') {
        fn();
      }
    }
  }),

  updateGeometry() {
    let parent = this.scrollingParent();

    setProperties(this, {
      scrollTop: parent ? (parent.scrollTop || parent.scrollY) : 0,
      parentHeight: get(this, 'geometryParent.height') || get(this, '_defaultHeight'),
      parentWidth: get(this, 'geometryParent.width') || get(this, '_defaultWidth')
    });
  },

  scrollingParent() {
    let element = get(this, 'element');

    if (!element) {
      return window || FAKE_WINDOW;
    }

    let overflowProperties = function(node) {
      return [
        getComputedStyle(node, null).getPropertyValue('overflow'),
        getComputedStyle(node, null).getPropertyValue('overflow-x'),
        getComputedStyle(node, null).getPropertyValue('overflow-y')
      ].join(' ');
    };

    let scroller = A(ancestors(element.parentNode)).find((parent) => {
      return /(auto|scroll)/.test(overflowProperties(parent));
    });

    return scroller || window || FAKE_WINDOW;
  }
});
