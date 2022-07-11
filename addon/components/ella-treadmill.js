import Component from '@glimmer/component';
import { A } from '@ember/array';
import { action } from '@ember/object';
import { run } from '@ember/runloop';
import { task, timeout, restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

const RECALC_INTERVAL = 50;
const NO_WINDOW_HEIGHT = 1024;
const NO_WINDOW_WIDTH = 768;
const DEFAULT_ROW_HEIGHT = 50;

const FAKE_WINDOW = {
  clientWidth: NO_WINDOW_WIDTH,
  clientHeight: NO_WINDOW_HEIGHT,
  scrollY: 0,
};

let ancestors = function (node, parents = []) {
  return node === null || node.parentNode === null
    ? parents
    : ancestors(node.parentNode, parents.concat([node]));
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

export default class EllaTreadmill extends Component {
  constructor(...args) {
    super(...args);
    if (this.args.moveTo) {
      this._moveTo = this.args.moveTo;
    }
  }

  /**
   * Applied as the `role` attribute on the component's element.
   *
   * @property ariaRole
   * @type {String}
   * @default 'list'
   * @public
   */
  ariaRole = 'list';

  /**
   * The component element's height captured on first render and on
   * scroll/resize events.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property elementHeight
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  @tracked elementHeight = 0;

  /**
   * The component element's height captured on first render and on
   * scroll/resize events.
   *
   * This property is updated frequently by the component. Setting it has no
   * lasting effect.
   *
   * @property elementWidth
   * @type {Number}
   * @default 0
   * @public
   * @readOnly
   */
  @tracked elementWidth = 0;

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
  fluctuate = 2;

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
  fluctuateColumn = 2;

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
  @tracked itemHeight = 12;

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
  itemWidth = 0;

  /**
   * The minimum width of a listing. If `minColumnWidth` is less than 50% of
   * the component element's width, flexible columns will rendered to fill the
   * available horizontal space.
   *
   * For example, if the component's rendered element is 600px wide and
   * `minColumnWidth: 180px`, `ella-treadmill` would place items into a grid
   * with 3 columns of `200px` width. Resizing the viewport to allow the
   * component's element to be `720px` wide would rearrange the grid into four
   * columns, each `180px` wide.
   *
   * The default behavior is to show a long list of items in a single column.
   * (`minColumnWidth: '100%'`)
   *
   * @property minColumnWidth
   * @type {Number|String}
   * @default '100%'
   * @public
   */
  // @tracked minColumnWidth = '100%';

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
  @tracked overdraw = 0;

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
  @tracked parentHeight = 0;

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
  @tracked parentWidth = 0;

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
  @tracked resizing = 0;

  /**
   * The height of each row.
   *
   * The default height of each row is `50px`.
   *
   * @property row
   * @type {Number|String}
   * @default 50
   * @public
   */
  // @tracked row = DEFAULT_ROW_HEIGHT;

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
  @tracked sampleItem = null;

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
  @tracked scrolling = 0;

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
  @tracked scrollTop = 0;

  /**
   * The number of items to render per row.
   *
   * @property columns
   * @type {Number}
   * @default 1
   * @public
   * @readOnly
   */

  get columns() {
    let col = this.args.minColumnWidth;
    let colUnit = this.unitString(col);
    let elementWidth = this.elementWidth;
    let result;

    col = parseFloat(col, 10);

    switch (colUnit) {
      case '%':
        result = Math.floor(100 / col);
        break;
      case 'px':
        result = Math.floor(elementWidth / col);

        break;
      default:
        result = 1;
        break;
    }

    return Math.max(result, 1);
  }

  /**
   * @property data-scroll-top
   * @type {String}
   * @default '0'
   * @private
   * @readOnly
   */
  get 'data-scroll-top'() {
    return this.scrollTop || '0';
  }

  /**
   * An array with a length equal to the number of items to display. The
   * component's template iterates over this array to render the appropriate
   * number of child elements.
   *
   * @property indices
   * @type {Array}
   * @public
   * @readOnly
   */
  get indices() {
    return [...Array(this.numberOfVisibleItems)];
  }

  /**
   * The Emberella Treadmill will scroll to the item with the numeric index
   * provided to the `moveTo` property. For example, the following would scroll
   * to the 300th item in the list.
   *
   * ```
   * {{#ella-treadmill content=model moveTo=300 as |item| }}
   *   // ITEM CONTENT
   * {{/ella-treadmill}}
   * ```
   *
   * @property moveTo
   * @type {Number}
   * @default undefined
   * @public
   */
  get moveTo() {
    return this._moveTo;
  }

  set moveTo(value) {
    value = parseInt(value, 10);
    value ? (this._moveTo = value) : (this._moveTo = undefined);
  }

  /**
   * The computed number of items to render.
   *
   * @property numberOfVisibleItems
   * @type {Number}
   * @public
   * @readOnly
   */
  get numberOfVisibleItems() {
    let content = this.args.content;

    return Math.min(this.visibleRows * this.columns, content.length || 0);
  }

  /**
   * The computed minimum number of rows to render.
   *
   * @property rowCount
   * @type {Number}
   * @public
   * @readOnly
   */
  get rowCount() {
    let parentHeight = this.parentHeight || this._defaultHeight;
    let itemHeight = this.itemHeight;
    let rowCount = parentHeight / itemHeight || 0;

    return rowCount && rowCount !== Infinity ? Math.ceil(rowCount) : 0;
  }

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
  get startingIndex() {
    let columns = this.columns;
    let idx = Math.floor(this.topDelta / this.itemHeight) * columns;
    let len = this.args.content.length;
    let od = this._overdrawRows;

    // Adjust starting index for overdraw above "stage"
    idx = idx - od * columns;

    return Math.min(len - this.numberOfVisibleItems, Math.max(0, idx)) || 0;
  }

  /**
   * The distance in pixels between the top of this component and the top of
   * the scrollable parent container.
   *
   * @property topDelta
   * @type {Number}
   * @public
   * @readOnly
   */

  get topDelta() {
    let elementTop = this.geometryElement.top;
    let parentTop = this.geometryParent.top || 0;

    return parentTop - elementTop || 0;
  }

  /**
   * The numeric height of the component's element.
   *
   * For example, if the row height is `50px`, the `minColumnWidth` is `50%`
   * and the content contains 1000 items, the `this.totalHeight` would be 25,000
   * pixels (`25000px`). That's 500 rows each `50px` tall with two
   * items each.
   *
   * @property this.totalHeight
   * @type {Number}
   * @public
   * @readOnly
   */
  get totalHeight() {
    let row = parseFloat(this._row, 10);
    let columns = parseFloat(this.columns, 10);
    let len = this.args.content.length;

    return row * Math.ceil(len / columns);
  }

  /**
   * The slice of content to render.
   *
   * @property visibleContent
   * @type {Array}
   * @public
   * @readOnly
   */
  get visibleContent() {
    let { visibleIndexes, _content } = this;

    return A(_content.objectsAt(visibleIndexes));
  }

  /**
   * The indexes of the content to render.
   *
   * @property visibleIndexes
   * @type {Array}
   * @public
   * @readOnly
   */
  get visibleIndexes() {
    let { startingIndex, numberOfVisibleItems } = this;

    let mod = startingIndex % numberOfVisibleItems;
    let page = Math.floor(startingIndex / numberOfVisibleItems);
    let maxIdx = Math.min(numberOfVisibleItems, this.args.content.length);
    let result = A();

    for (let i = 0; i < maxIdx; ++i) {
      let p = page;

      if (i < mod) {
        p = page + 1;
      }

      result.push(p * numberOfVisibleItems + i);
    }

    return result;
  }

  /**
   * Computed total number of rows to render including overdraw.
   *
   * @property visibleRows
   * @type {Number}
   * @public
   * @readOnly
   */
  get visibleRows() {
    let { rowCount, _overdrawRows } = this;

    return (Math.ceil(rowCount + 2 * _overdrawRows) || 0) + 1;
  }

  /**
   * Coerce provided content into an Ember Array
   *
   * @property _content
   * @type {Array}
   * @private
   * @readOnly
   */
  get _content() {
    let { content } = this.args;

    if (typeof content.objectsAt !== 'function') {
      content = A([].concat(content));
    }

    return content;
  }

  /**
   * The number of additional rows to render above and below the visible area.
   *
   * @property _overdrawRows
   * @type {Number}
   * @private
   * @readOnly
   */
  get _overdrawRows() {
    let rowCount = this.rowCount;
    let od = (parseInt(this.overdraw, 10) || 0) / 100;

    return Math.ceil(rowCount * od);
  }

  /**
   * Callback function for resize events.
   *
   * @property _resizeHandler
   * @type {Function}
   * @private
   * @readOnly
   */
  get _resizeHandler() {
    let callback = () => {
      this.resizeTask.perform();
    };

    return callback;
  }

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
  get _row() {
    let row = this.args.row || '';
    let rowUnit = this.unitString(row);
    let parent;
    let parentHeight;
    let result;

    row = parseFloat(row, 10);

    switch (rowUnit) {
      case '%':
        parent = this.scrollingParent();
        parentHeight = parent.clientHeight || this._defaultHeight;
        result = (row / 100) * parentHeight;
        break;
      default:
        result = row && row > 0 ? row : DEFAULT_ROW_HEIGHT;
        break;
    }

    return result;
  }

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
  get _rowUnit() {
    let row = this.args.row || '';
    let rowUnit = this.unitString(row);
    let result;

    switch (rowUnit) {
      case '%':
        result = 'px';
        break;
      default:
        result = rowUnit;
        break;
    }

    return result;
  }

  /**
   * Callback function for scroll events.
   *
   * @property _scrollHandler
   * @type {Function}
   * @private
   * @readOnly
   */
  get _scrollHandler() {
    let callback = () => {
      this.scrollTask.perform();
    };

    return callback;
  }

  @action
  didInsert() {
    this._rafWatcherBegin();
    this.updateGeometry();
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this._rafWatcherEnd();
  }

  @action
  listItemInserted(item) {
    if (!this.sampleItem) {
      this.sampleItem = item;
    }
  }

  @action
  listItemUpdated(geometry) {
    this.itemHeight = geometry.height;
    this.itemWidth = geometry.width;
  }

  @action
  listItemDestroyed(item) {
    if (this.sampleItem === item) {
      this.sampleItem = null;
    }
  }

  @restartableTask
  *resizeTask() {
    if (this.resizing === 0) {
      this.sendStateUpdate('on-resize-start');
    }

    this.resizing += 1;
    this.updateGeometry().sendStateUpdate('on-resize');

    yield timeout(RECALC_INTERVAL);

    this.resizing = 0;

    this.updateGeometry();
    // this.notifyPropertyChange('visibleContent');
    this.sendStateUpdate('on-resize').sendStateUpdate('on-resize-end');
  }

  @restartableTask
  *scrollTask() {
    if (this.scrolling === 0) {
      this.sendStateUpdate('on-scroll-start');
    }

    this.scrolling += 1;
    this.updateGeometry().sendStateUpdate('on-scroll');

    yield timeout(RECALC_INTERVAL);

    this.scrolling = 0;

    this.updateGeometry();
    // this.notifyPropertyChange('visibleContent');
    this.sendStateUpdate('on-scroll').sendStateUpdate('on-scroll-end');
  }

  @task
  *moveToTask() {
    let moveTo = this.moveTo;

    if (moveTo) {
      yield this.scrollToIndex(moveTo);
      this.moveTo = null;
    }
  }

  /**
   * Find the scrolling parent of the component. This may be an HTML element,
   * the window (in a browser) or a fake window object for Node.
   *
   * @method scrollingParent
   * @return {HtmlElement|window|Object}
   * @public
   */
  scrollingParent() {
    let element = document.querySelector(`.ella-treadmill`);

    if (!element) {
      return window || FAKE_WINDOW;
    }

    let overflowProperties = function (node) {
      return [
        getComputedStyle(node, null).getPropertyValue('overflow'),
        getComputedStyle(node, null).getPropertyValue('overflow-x'),
        getComputedStyle(node, null).getPropertyValue('overflow-y'),
      ].join(' ');
    };

    let scroller = A(ancestors(element.parentNode)).find((parent) => {
      return /(auto|scroll)/.test(overflowProperties(parent));
    });
    // I don't really understand what this was doing. Was it to account for weird parent
    // return element;
    return scroller || window || FAKE_WINDOW;
  }

  scrollToIndex(idx) {
    let parent = this.scrollingParent();
    // let element = this.element;
    let element = document.querySelector(`.ella-treadmill`);

    if (!parent || !element) {
      return this;
    }

    let columns = this.columns;
    let itemHeight = this.sampleItem.element.clientHeight;
    let row = Math.floor(idx / columns);
    let top = row * itemHeight;
    let delta = this.scrollTop - this.topDelta;

    if (typeof parent.scrollTo === 'function') {
      parent.scrollTo(parent.scrollX, top + delta);
    } else {
      parent.scrollTop = top;
    }

    return this;
  }

  /**
   * Adheres to the recommended use of "closure actions."
   *
   * @method sendClosureAction
   * @param {String} action The name of the action to send
   * @param ...args Parameters to pass through to the action call
   * @chainable
   * @public
   */
  sendClosureAction(action, ...args) {
    let fn = this.args[action];

    if (typeof fn === 'function') {
      fn(...args);
    }

    return this;
  }

  /**
   * Send action(s) with state data about this listing.
   *
   * @method sendStateUpdate
   * @param {String} action The action to send
   * @chainable
   * @public
   */
  sendStateUpdate(action = 'on-update') {
    let props = (({
      scrollTop,
      topDelta,
      startingIndex,
      numberOfVisibleItems,
      visibleIndexes,
    }) => ({
      scrollTop,
      topDelta,
      startingIndex,
      numberOfVisibleItems,
      visibleIndexes,
    }))(this);

    props.visibleIndexes = props.visibleIndexes.slice().sort(function (a, b) {
      return a - b;
    });

    this.sendClosureAction(action, props);

    return this;
  }

  /**
   * Take a sizing style like `100px` or `22.56rem` and find its unit of
   * measure (e.g. `px` or `rem`).
   *
   * @method unitString
   * @param measure A CSS measurement
   * @param {String} instead A unit of measurement to send if no matches
   * @return {String}
   * @public
   */
  unitString(measure = '', instead = 'px') {
    let unit = `${measure}`.match(/[^-\d.]+$/g);

    return unit ? unit[0] : instead;
  }

  /**
   * Updates properties regarding scroll position and parent dimensions.
   *
   * @method updateGeometry
   * @chainable
   * @public
   */
  updateGeometry() {
    let parent = this.scrollingParent();
    let geometryParent = this.geometryParent;
    let element = document.querySelector(`.ella-treadmill`);

    this.scrollTop = (parent ? parent.scrollTop || parent.scrollY : 0) || null;
    this.parentHeight = geometryParent.height || this._defaultHeight;
    this.parentWidth = geometryParent.width || this._defaultWidth;
    this.elementHeight = element.clientHeight || this._defaultHeight;
    this.elementWidth = element.clientWidth || this._defaultWidth;

    return this;
  }

  _rafWatcherBegin() {
    let rafFn = window.requestAnimationFrame;

    let step = () => {
      this._rafWatcherPerform();
      nextStep();
    };

    let nextStep = () => {
      this.__rafWatcherId__ = rafFn(step);
    };

    this._rafWatcherSetup();

    nextStep();
  }

  _rafWatcherEnd() {
    let rafCancelFn = window.cancelAnimationFrame;

    if (this.__rafId__) {
      rafCancelFn(this.__rafId__);
      this.__rafId__ = undefined;
    }
  }

  _rafWatcherPerform() {
    let parent = this.scrollingParent();
    let scrollTop = parent ? parent.scrollTop || parent.scrollY : 0;
    let scrollChanged = false;
    let element = document.querySelector(`.ella-treadmill`);

    if (scrollTop !== this.__scrollTop__) {
      scrollChanged = true;
      this.__scrollTop__ = scrollTop;
    }

    let elementWidth = element.clientWidth;
    let elementHeight = element.clientHeight;
    let parentWidth = parent.clientWidth || parent.innerWidth;
    let parentHeight = parent.clientHeight || parent.innerHeight;
    let sizeChanged = false;

    if (
      elementWidth !== this.__elementWidth__ ||
      elementHeight !== this.__elementHeight__ ||
      parentWidth !== this.__parentWidth__ ||
      parentHeight !== this.__parentHeight__
    ) {
      sizeChanged = true;
      this.__elementWidth__ = elementWidth;
      this.__elementHeight__ = elementHeight;
      this.__parentWidth__ = parentWidth;
      this.__parentHeight__ = parentHeight;
    }

    let scrollHandler = this._scrollHandler;
    let resizeHandler = this._resizeHandler;

    let callHandlers = () => {
      if (scrollChanged) {
        scrollHandler();
      }

      if (sizeChanged) {
        resizeHandler();
      }

      this.moveToTask.perform();
    };

    if (scrollChanged || sizeChanged || this._moveTo) {
      run(callHandlers);
    }
  }

  _rafWatcherSetup() {
    let parent = this.scrollingParent();
    let element = document.querySelector(`.ella-treadmill`);

    this.__elementWidth__ = element.clientWidth;
    this.__elementHeight__ = element.clientHeight;

    this.__parentWidth__ = parent.clientWidth || parent.innerWidth;
    this.__parentHeight__ = parent.clientHeight || parent.innerHeight;

    this.__scrollTop__ = parent ? parent.scrollTop || parent.scrollY : 0;

    return this;
  }
}

/**
 * The plain object obtained by calling `.getBoundingClientRect()` on the
 * component's element.
 *
 * @property geometryElement
 * @type {Object}
 * @public
 * @readOnly
 */
Object.defineProperty(EllaTreadmill.prototype, 'geometryElement', {
  get() {
    // let element = this.element;
    let element = document.querySelector(`.ella-treadmill`);
    if (!element) {
      return {};
    }

    return element.getBoundingClientRect();
  },
});

/**
 * The plain object obtained by calling `.getBoundingClientRect()` on the
 * component's scrolling parent element (if applicable).
 *
 * @property geometryParent
 * @type {Object}
 * @public
 * @readOnly
 */
Object.defineProperty(EllaTreadmill.prototype, 'geometryParent', {
  get() {
    let parent = this.scrollingParent();

    return parent && typeof parent.getBoundingClientRect === 'function'
      ? parent.getBoundingClientRect()
      : {};
  },
});

/**
 * Provide a scrolling parent height if no scrolling parent can be detected.
 *
 * @property _defaultHeight
 * @type {Number}
 * @private
 * @readOnly
 */
Object.defineProperty(EllaTreadmill.prototype, '_defaultHeight', {
  get() {
    return window ? window.innerHeight : NO_WINDOW_HEIGHT;
  },
});

/**
 * Provide an element or parent element width if no rendered width can
 * be determined.
 *
 * @property _defaultWidth
 * @type {Number}
 * @private
 * @readOnly
 */
Object.defineProperty(EllaTreadmill.prototype, '_defaultWidth', {
  get() {
    return window ? window.innerWidth : NO_WINDOW_WIDTH;
  },
});
