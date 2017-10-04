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

/**
 *
 * Sometimes, your app may be required to display a long list of records.
 *
 * Even the best pagination user experience tends to be awkward to use. What
 * page has the records starting with the letter "L"? How do I navigate through
 * a large number of pages? What if I send a URL for page 3 and the record I
 * wanted to share moves to page 4?
 *
 * As a common alternative, "infinite scroll" suffers from some of the same
 * challenges: impossible URL sharing and difficulty finding specific records.
 * Infinite scroll may work for showing a social feed, but it's less enjoybale
 * for scanning through a large, finite data set.
 *
 * That's where `{{ella-treadmill}}` comes in. It renders an element tall
 * enough to indicate hundreds or thousands of items, but renders only enough
 * child elements to fill the screen. As the page scrolls, `{{ella-treadmill}}`
 * recycles listings to provide the illusion of one really long, continuous
 * scrolling list. This keeps the browser from being overwhelmed with thousands
 * of elements and boosts overall perceived performance.
 *
 * @element ella-treadmill
 */

export default Component.extend({
  layout,

  /**
   * Tag name for the component's element.
   *
   * @property tagName
   * @type String
   * @default 'ella-treadmill'
   * @public
   */
  tagName: 'ella-treadmill',

  /**
   * An array of properties to apply as attributes on the component's element.
   *
   * @property attributeBindings
   * @type {Array|String}
   * @default [
   *   'data-scroll-top',
   *   'topDelta:data-scroll-delta',
   *   'startingIndex:data-first-visible-index',
   *   'numberOfVisibleItems:data-visible-items'
   * ]
   * @public
   */
  attributeBindings: [
    'data-scroll-top',
    'topDelta:data-scroll-delta',
    'startingIndex:data-first-visible-index',
    'numberOfVisibleItems:data-visible-items'
  ],

  /**
   * An array of additional CSS class names to add to the component's element.
   *
   * @property classNames
   * @type {Array|String}
   * @default ['ella-treadmill']
   * @public
   */
  classNames: ['ella-treadmill'],

  /**
   * An array of additional CSS class names to conditionally add to the
   * component's element.
   *
   * @property classNameBindings
   * @type {Array|String}
   * @default [
   *   'resizing:is-resizing:not-resizing',
   *   'scrolling:is-scrolling:not-scrolling'
   * ]
   * @public
   */
  classNameBindings: [
    'resizing:is-resizing:not-resizing',
    'scrolling:is-scrolling:not-scrolling'
  ],

  /**
   * Applied as the `role` attribute on the component's element.
   *
   * @property ariaRole
   * @type {String}
   * @default 'list'
   * @public
   */
  ariaRole: 'list',

  /**
   * How frequently to cycle through class names that indicate membership in a
   * "row" of listings.
   *
   * For example, `fluctuate: 2` would add the class name
   * `ella-treadmill-item-row-1` to the first row, `ella-treadmill-item-row-2`
   * to the second row, `ella-treadmill-item-row-1` to the third row,
   * `ella-treadmill-item-row-2` to the fourth row, and so on.
   *
   * A setting of `fluctuate: 5` would add class names
   * `ella-treadmill-item-row-1` through `ella-treadmill-item-row-5` to each
   * of the first five rows and then start again with
   * `ella-treadmill-item-row-1` on row six.
   *
   * @property fluctuate
   * @type {Number}
   * @default 2
   * @public
   */
  fluctuate: 2,

  /**
   * How frequently to cycle through class names that indicate membership in a
   * "column" of listings.
   *
   * For example, `fluctuateColumn: 2` would add the class name
   * `ella-treadmill-item-column-1` to items in the first column,
   * `ella-treadmill-item-column-2` to the second column,
   * `ella-treadmill-item-column-1` to the third column,
   * `ella-treadmill-item-column-2` to the fourth column, and so on.
   *
   * A setting of `fluctuateColumn: 5` would add class names
   * `ella-treadmill-item-column-1` through `ella-treadmill-item-column-5` to
   * items in each of the first five columns and then start again with
   * `ella-treadmill-item-column-1` on column six.
   *
   * @property fluctuateColumn
   * @type {Number}
   * @default 2
   * @public
   */
  fluctuateColumn: 2,

  /**
   * The element height reported by the first rendered child listing.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property itemHeight
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  itemHeight: 0,

  /**
   * The element width reported by the first rendered child listing.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property itemWidth
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  itemWidth: 0,

  /**
   * The minimum width of a listing. If `minColumnWidth` is less than 50% of
   * the component element's width, flexible columns will rendered to fill the
   * available horizontal space.
   *
   * For example, if the component's rendered element is 600px wide,
   * `minColumnWidth: 180`, and `widthUnit: 'px'`, `ella-treadmill` would
   * place items into a grid with 3 columns of `200px` width. Resizing the
   * viewport to allow the component's element to be `720px` wide would
   * rearrange the grid into four columns, each `180px` wide.
   *
   * The default behavior is to show a long list of items in a single column.
   * (`minColumnWidth: 180` and `widthUnit: '%'`)
   *
   * @property minColumnWidth
   * @type {Number}
   * @default 100
   * @public
   */
  minColumnWidth: 100,

  /**
   * An additional number of rows, indicated by a percentage, to render above
   * and below the visible scroll area.
   *
   * For example, if twenty items is enough to fill the viewport, an `overdraw`
   * value of `20` would render 8 additional items (four above the viewable
   * area and four below the viewable area). That's 20% more items in each
   * scrolling direction.
   *
   * This can be useful if data for the listing is computed or fetched
   * asynchronously. The overdraw allows data for a list item to start being
   * gathered moments before it scrolls into view. This can boost the perceived
   * performance of the listing.
   *
   * @property overdraw
   * @type {Number}
   * @default 0
   * @public
   */
  overdraw: 0,

  /**
   * The scrollable parent's height captured on first render and on
   * scroll/resize events.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property parentHeight
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  parentHeight: 0,

  /**
   * The scrollable parent's height captured on first render and on
   * scroll/resize events.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property parentWidth
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  parentWidth: 0,

  /**
   * Indicates when `resize` events are firing. Toggles the
   * `is-resizing` class.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property resizing
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  resizing: 0,

  /**
   * The numeric height of each row.
   *
   * The default height of each row is `50px`.
   *
   * @property row
   * @type {Number}
   * @default 50
   * @public
   */
  row: DEFAULT_ROW_HEIGHT,

  /**
   * The unit of measurement to use when defining the height of each row.
   * (e.g. 'px', 'em', 'rem', '%', etc.)
   *
   * The default height of each row is `50px`.
   *
   * @property rowUnit
   * @type {String}
   * @default 'px'
   * @public
   */
  rowUnit: 'px',

  /**
   * A sample child element to reference when computing how many child elements
   * are necessary to cover the visible scroll area.
   *
   * This is typcially the first rendered child item.
   *
   * This property is updated by the component. Setting it has no
   * lasting effect.
   *
   * @property sampleItem
   * @type {Component|Null}
   * @default null
   * @public
   * @readOnly
   */
  sampleItem: null,

  /**
   * Indicates when `scroll` events are firing. Toggles the
   * `is-scrolling` class.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property scrolling
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  scrolling: 0,

  /**
   * Indicates the current scroll position.
   *
   * This property is updated by the component. Setting it has no
   * lasting effect.
   *
   * @property scrollTop
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  scrollTop: 0,

  /**
   * The unit of measurement to use when defining the width of each column.
   * (only 'px' and '%' are officially supported)
   *
   * The default width of each column is `100%`.
   *
   * @property widthUnit
   * @type {String}
   * @default '%'
   * @public
   */
  widthUnit: '%',

  /**
   * The number of items to render per row.
   *
   * @property columns
   * @type {Number}
   * @default 1
   * @public
   * @readOnly
   */
  columns: computed('minColumnWidth', 'widthUnit', 'parentWidth', function() {
    let { minColumnWidth, widthUnit } = getProperties(this, 'minColumnWidth', 'widthUnit');
    let element;
    let elementWidth;
    let result;

    switch (widthUnit) {
      case '%':
        result = Math.floor(100 / minColumnWidth);
        break;
      case 'px':
        element = get(this, 'element');

        if (element) {
          elementWidth = get(element, 'clientWidth');
        } else {
          elementWidth = get(this, '_defaultWidth');
        }

        result = Math.floor(elementWidth / minColumnWidth);

        break;
      default:
        result = 1;
        break;
    }

    return Math.max(result, 1);
  }).readOnly(),

  /**
   * @property data-scroll-top
   * @type {String}
   * @default '0'
   * @private
   * @readOnly
   */
  'data-scroll-top': computed('scrollTop', function() {
    return get(this, 'scrollTop') || '0';
  }).readOnly(),

  /**
   * The plain object obtained by calling `.getBoundingClientRect()` on the
   * component's element.
   *
   * @property geometryElement
   * @type {Object}
   * @public
   * @readOnly
   */
  geometryElement: computed(function() {
    let element = get(this, 'element');

    if (!element) {
      return {};
    }

    return element.getBoundingClientRect();
  }).volatile().readOnly(),

  /**
   * The plain object obtained by calling `.getBoundingClientRect()` on the
   * component's scrolling parent element (if applicable).
   *
   * @property geometryParent
   * @type {Object}
   * @public
   * @readOnly
   */
  geometryParent: computed(function() {
    let parent = this.scrollingParent();

    return (parent && typeof parent.getBoundingClientRect === 'function') ?
      parent.getBoundingClientRect() : {};
  }).volatile().readOnly(),

  /**
   * An array with a length equal to the number of items to display. The
   * component's template iterates over this array to render the appropriate
   * number of child elements.
   *
   * @property geometryElement
   * @type {Object}
   * @public
   * @readOnly
   */
  indices: computed('numberOfVisibleItems', function() {
    return [...Array(get(this, 'numberOfVisibleItems'))];
  }).readOnly(),

  /**
   * The computed number of items to render.
   *
   * @property numberOfVisibleItems
   * @type {Number}
   * @public
   * @readOnly
   */
  numberOfVisibleItems: computed('visibleRows', 'columns', 'content.[]', function() {
    return Math.min(get(this, 'visibleRows') * get(this, 'columns'), get(this, 'content.length') || 0);
  }).readOnly(),

  /**
   * The computed minimum number of rows to render.
   *
   * @property rowCount
   * @type {Number}
   * @public
   * @readOnly
   */
  rowCount: computed('parentHeight', 'itemHeight', function() {
    let parentHeight = get(this, 'parentHeight') || get(this, '_defaultHeight');
    let itemHeight = get(this, 'itemHeight');
    let rowCount = (parentHeight / itemHeight) || 0;

    return (rowCount && rowCount !== Infinity) ? Math.ceil(rowCount) : 0;
  }).readOnly(),

  /**
   * The index of the first item of content to render into the visible portion
   * of the scrolling list.
   *
   * @property startingIndex
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  startingIndex: computed('topDelta', 'itemHeight', 'numberOfVisibleItems', 'content.[]', 'columns', '_overdrawRows', function() {
    let columns = get(this, 'columns');
    let idx = Math.floor(get(this, 'topDelta') / get(this, 'itemHeight')) * columns;
    let len = get(this, 'content.length');
    let od = get(this, '_overdrawRows');

    // Adjust starting index for overdraw above "stage"
    idx = idx - (od * columns);

    return Math.min(len - get(this, 'numberOfVisibleItems'), Math.max(0, idx)) || 0;
  }).readOnly(),

  /**
   * The distance in pixels between the top of this component and the top of
   * the scrollable parent container.
   *
   * @property topDelta
   * @type {Number}
   * @public
   * @readOnly
   */
  topDelta: computed('scrollTop', function() {
    let elementTop = get(this, 'geometryElement.top');
    let parentTop = get(this, 'geometryParent.top') || 0;

    return (parentTop - elementTop) || 0;
  }).readOnly(),

  /**
   * The numeric height of the component's element.
   *
   * For example, if the row height is `50px`, the `minColumnWidth` is `50%`
   * and the content contains 1000 items, the `totalHeight` would be 25,000
   * pixels (`25000px`). That's 500 rows each `50px` tall with two
   * items each.
   *
   * @property totalHeight
   * @type {Number}
   * @public
   * @readOnly
   */
  totalHeight: computed('content.[]', '_row', 'columns', function() {
    let row = parseFloat(get(this, '_row'), 10);
    let columns = parseFloat(get(this, 'columns'), 10);
    let len = get(this, 'content.length');

    return row * len / columns;
  }).readOnly(),

  /**
   * The slice of content to render.
   *
   * @property visibleContent
   * @type {Array}
   * @public
   * @readOnly
   */
  visibleContent: computed('visibleIndices', '_content', function() {
    let {
      visibleIndices,
      _content
    } = getProperties(this, 'visibleIndices', '_content');

    return A(_content.objectsAt(visibleIndices));
  }).readOnly(),

  /**
   * The indexes of the content to render.
   *
   * @property visibleIndices
   * @type {Array}
   * @public
   * @readOnly
   */
  visibleIndices: computed('startingIndex', 'numberOfVisibleItems', 'content.[]', function() {
    let {
      startingIndex,
      numberOfVisibleItems
    } = getProperties(this, 'startingIndex', 'numberOfVisibleItems');

    let mod = startingIndex % numberOfVisibleItems;
    let page = Math.floor(startingIndex / numberOfVisibleItems);
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
  }).readOnly(),

  /**
   * Computed total number of rows to render including overdraw.
   *
   * @property visibleRows
   * @type {Number}
   * @public
   * @readOnly
   */
  visibleRows: computed('rowCount', '_overdrawRows', function() {
    let { rowCount, _overdrawRows } = getProperties(this, 'rowCount', '_overdrawRows');

    return (Math.ceil(rowCount + (2 * _overdrawRows)) || 0) + 1;
  }).readOnly(),

  /**
   * Coerce provided content into an Ember Array
   *
   * @property _content
   * @type {Array}
   * @private
   * @readOnly
   */
  _content: computed('content.[]', function() {
    return A([].concat(get(this, 'content')));
  }).readOnly(),

  /**
   * Provide a scrolling parent height if no scrolling parent can be detected.
   *
   * @property _defaultHeight
   * @type {Number}
   * @private
   * @readOnly
   */
  _defaultHeight: computed(function() {
    return (window) ? window.innerHeight : NO_WINDOW_HEIGHT;
  }).volatile().readOnly(),

  /**
   * Provide an element or parent element width if no rendered width can
   * be determined.
   *
   * @property _defaultWidth
   * @type {Number}
   * @private
   * @readOnly
   */
  _defaultWidth: computed(function() {
    return (window) ? window.innerWidth : NO_WINDOW_WIDTH;
  }).volatile().readOnly(),

  /**
   * The number of additional rows to render above and below the visible area.
   *
   * @property _overdrawRows
   * @type {Number}
   * @private
   * @readOnly
   */
  _overdrawRows: computed('rowCount', 'overdraw', function() {
    let rowCount = get(this, 'rowCount');
    let od = (parseInt(get(this, 'overdraw'), 10) || 0) / 100;

    return Math.ceil(rowCount * od)
  }).readOnly(),

  /**
   * Callback function for resize events.
   *
   * @property _resizeHandler
   * @type {Function}
   * @private
   * @readOnly
   */
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
  }).readOnly(),

  /**
   * Compute a meaningful numeric style for row height. For example, if the
   * `rowUnit` is `'%'`, convert the percentage height into a pixel height
   * based on measurments of the parent element.
   *
   * @property _row
   * @type {Number}
   * @private
   * @readOnly
   */
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
  }).readOnly(),

  /**
   * Compute a meaningful unit of measurement for row height. For example, a
   * `rowUnit` of `'%'` would be replaced by `'px'` to render rows a fraction
   * of the height of the scrolling parent.
   *
   * @property _rowUnit
   * @type {String}
   * @private
   * @readOnly
   */
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
  }).readOnly(),

  /**
   * Callback function for scroll events.
   *
   * @property _scrollHandler
   * @type {Function}
   * @private
   * @readOnly
   */
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
  }).readOnly(),

  didInsertElement() {
    let resizeHandler = get(this, '_resizeHandler');
    let scrollHandler = get(this, '_scrollHandler');
    let parents = ancestors(get(this, 'element.parentNode'));
    let parent = this.scrollingParent();

    parents.forEach((node) => {
      node.addEventListener('resize', resizeHandler);
    });

    if (parent) {
      parent.addEventListener('scroll', scrollHandler);
    }

    if (document) {
      document.addEventListener('scroll', scrollHandler);
    }

    if (window) {
      window.addEventListener('resize', resizeHandler);
    }

    this.updateGeometry();
  },

  willDestroyElement() {
    let resizeHandler = get(this, '_resizeHandler');
    let scrollHandler = get(this, '_scrollHandler');
    let parents = ancestors(get(this, 'element.parentNode'));
    let parent = this.scrollingParent();

    if (window) {
      window.removeEventListener('resize', resizeHandler);
    }

    if (document) {
      document.removeEventListener('scroll', scrollHandler);
    }

    if (parent) {
      parent.removeEventListener('scroll', scrollHandler);
    }

    parents.forEach((node) => {
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

  /**
   * Updates properties regarding scroll position and parent dimensions.
   *
   * @method updateGeometry
   * @return {Null}
   * @public
   */
  updateGeometry() {
    let parent = this.scrollingParent();

    setProperties(this, {
      scrollTop: parent ? (parent.scrollTop || parent.scrollY) : 0,
      parentHeight: get(this, 'geometryParent.height') || get(this, '_defaultHeight'),
      parentWidth: get(this, 'geometryParent.width') || get(this, '_defaultWidth')
    });
  },

  /**
   * Find the scrolling parent of the component. This may be an HTML element,
   * the window (in a browser) or a fake window object for Node.
   *
   * @method scrollingParent
   * @return {HtmlElement|window|Object}
   * @public
   */
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
