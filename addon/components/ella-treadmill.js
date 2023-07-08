import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { action } from '@ember/object';
import { get, set } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { run } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';

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

class EllaTreadmill extends Component {
  elementId = guidFor(this);

  @tracked _moveTo = null;

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
  get fluctuate() {
    return this.args.fluctuate || 2;
  }

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
  get fluctuateColumn() {
    return this.args.fluctuateColumn || 2;
  }

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
  @tracked itemHeight = 0;

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
  @tracked itemWidth = 0;

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
  get minColumnWidth() {
    return this.args.minColumnWidth || '100%';
  }

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
  get overdraw() {
    return this.args.overdraw || 0;
  }

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
  get row() {
    return this.args.row || DEFAULT_ROW_HEIGHT;
  }

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
    const { minColumnWidth, elementWidth, unitString } = this;
    const col = parseFloat(minColumnWidth, 10);
    const colUnit = unitString(col);
    let result;

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
    const v = parseInt(value, 10);

    this._moveTo = isNaN(v) ? null : v;
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
    const { visibleRows, columns, content } = this;

    return Math.min(visibleRows * columns, content?.length || 0);
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
    const { parentHeight, _defaultHeight, itemHeight } = this;
    const outerHeight = parentHeight || _defaultHeight;
    const rowCount = outerHeight / itemHeight || 0;

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
    const {
      columns,
      topDelta,
      itemHeight,
      content,
      _overdrawRows,
      numberOfVisibleItems,
    } = this;
    const len = content?.length || 0;
    let idx = Math.floor(topDelta / itemHeight) * columns;

    // Adjust starting index for overdraw above "stage"
    idx = idx - _overdrawRows * columns;

    return Math.min(len - numberOfVisibleItems, Math.max(0, idx)) || 0;
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
    const { geometryElement, geometryParent } = this;
    const elementTop = geometryElement?.top || 0;
    const parentTop = geometryParent?.top || 0;

    return parentTop - elementTop || 0;
  }

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
  get totalHeight() {
    const { _row, columns, content } = this;
    const row = parseFloat(_row, 10);
    const cols = parseFloat(columns, 10);
    const len = content?.length || 0;

    return row * Math.ceil(len / cols);
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
    const { visibleIndexes, content } = this;

    return A(content.objectsAt(visibleIndexes));
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
    const { startingIndex, numberOfVisibleItems, content } = this;
    const len = content?.length || 0;
    const mod = startingIndex % numberOfVisibleItems;
    const page = Math.floor(startingIndex / numberOfVisibleItems);
    const maxIdx = Math.min(numberOfVisibleItems, len);
    const result = A();

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
    const { rowCount, _overdrawRows } = this;

    return (Math.ceil(rowCount + 2 * _overdrawRows) || 0) + 1;
  }

  /**
   * Determine the available function for `cancelAnimationFrame` or equivalent.
   *
   * @property _cancelAnimationFrameFn
   * @type {Function}
   * @private
   * @readOnly
   */
  get _cancelAnimationFrameFn() {
    return (window || {}).cancelAnimationFrame || clearTimeout;
  }

  /**
   * Coerce provided content into an Ember Array
   *
   * @property content
   * @type {Array}
   * @private
   * @readOnly
   */
  get content() {
    const { content } = this.args;

    return typeof content?.objectsAt !== 'function'
      ? A([].concat(content))
      : content;
  }

  get element() {
    return document.getElementById(this.elementId);
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
    const { rowCount, overdraw } = this;
    const od = (parseInt(overdraw, 10) || 0) / 100;

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
    const callback = () => {
      this.resizeTask.perform();
    };

    return callback;
  }

  /**
   * Determine the available function for `requestAnimationFrame` or equivalent.
   *
   * @property _requestAnimationFrameFn
   * @type {Function}
   * @private
   * @readOnly
   */
  get _requestAnimationFrameFn() {
    const nativeRaf = (window || {}).requestAnimationFrame;
    const simulatedRaf = function (fn) {
      return setTimeout(fn, 20);
    };

    return nativeRaf || simulatedRaf;
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
    let parent;
    let parentHeight;
    let result;
    let row = this.row || '';
    const rowUnit = this.unitString(row);

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
    let row = this.row || '';
    let result;
    const rowUnit = this.unitString(row);

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
    const callback = () => {
      this.scrollTask.perform();
    };

    return callback;
  }

  constructor() {
    super(...arguments);

    const { moveTo } = this.args;

    if (moveTo) this.moveTo = moveTo;

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
      set(this, 'sampleItem', null);
    }
  }

  resizeTask = task({ restartable: true }, async () => {
    if (this.resizing === 0) {
      this.sendStateUpdate('on-resize-start');
    }

    this.resizing = this.resizing + 1;
    this.updateGeometry();
    this.sendStateUpdate('on-resize');

    await timeout(RECALC_INTERVAL);

    this.resizing = 0;
    this.updateGeometry();
    this.sendStateUpdate('on-resize').sendStateUpdate('on-resize-end');
  });

  scrollTask = task({ restartable: true }, async () => {
    if (this.scrolling === 0) {
      this.sendStateUpdate('on-scroll-start');
    }

    this.scrolling = this.scrolling + 1;
    this.updateGeometry();
    this.sendStateUpdate('on-scroll');

    await timeout(RECALC_INTERVAL);

    this.scrolling = 0;
    this.updateGeometry();
    this.sendStateUpdate('on-scroll').sendStateUpdate('on-scroll-end');
  });

  moveToTask = task(async () => {
    const { moveTo } = this;

    if (moveTo) {
      await this.scrollToIndex(moveTo);
      this.moveTo = null;
    }
  });

  /**
   * Find the scrolling parent of the component. This may be an HTML element,
   * the window (in a browser) or a fake window object for Node.
   *
   * @method scrollingParent
   * @return {HtmlElement|window|Object}
   * @public
   */
  scrollingParent() {
    const { element } = this;

    if (!element) {
      return window || FAKE_WINDOW;
    }

    const overflowProperties = function (node) {
      return [
        getComputedStyle(node, null).getPropertyValue('overflow'),
        getComputedStyle(node, null).getPropertyValue('overflow-x'),
        getComputedStyle(node, null).getPropertyValue('overflow-y'),
      ].join(' ');
    };

    const scroller = A(ancestors(element.parentNode)).find((parent) => {
      return /(auto|scroll)/.test(overflowProperties(parent));
    });

    return scroller || window || FAKE_WINDOW;
  }

  scrollToIndex(idx) {
    const { element, columns, scrollTop, topDelta } = this;
    const parent = this.scrollingParent();

    if (!parent || !element) {
      return this;
    }

    const itemHeight = this.sampleItem?.element?.clientHeight;
    const row = Math.floor(idx / columns);
    const top = row * itemHeight;
    const delta = scrollTop - topDelta;

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
    let fn = get(this, action);

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
    const {
      scrollTop,
      topDelta,
      startingIndex,
      numberOfVisibleItems,
      visibleIndexes,
    } = this;

    const props = {
      scrollTop,
      topDelta,
      startingIndex,
      numberOfVisibleItems,
      visibleIndexes,
    };

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
    const parent = this.scrollingParent();
    const { geometryParent, _defaultHeight, _defaultWidth } = this;

    this.scrollTop = (parent ? parent.scrollTop || parent.scrollY : 0) || null;
    this.parentHeight = geometryParent.height || _defaultHeight;
    this.parentWidth = geometryParent.width || _defaultWidth;
    this.elementHeight = this.element?.clientHeight || _defaultHeight;
    this.elementWidth = this.element?.clientWidth || _defaultWidth;

    return this;
  }

  _rafWatcherBegin() {
    const rafFn = this._requestAnimationFrameFn;

    const step = () => {
      this._rafWatcherPerform();
      nextStep();
    };

    const nextStep = () => {
      this.__rafWatcherId__ = rafFn(step);
    };

    this._rafWatcherSetup();

    nextStep();
  }

  _rafWatcherEnd() {
    const rafCancelFn = this._cancelAnimationFrameFn;

    if (this.__rafId__) {
      rafCancelFn(this.__rafId__);
      this.__rafId__ = undefined;
    }
  }

  _rafWatcherPerform() {
    const parent = this.scrollingParent();
    const scrollTop = parent ? parent.scrollTop || parent.scrollY : 0;
    let scrollChanged = false;

    if (scrollTop !== this.__scrollTop__) {
      scrollChanged = true;
      this.__scrollTop__ = scrollTop;
    }

    const elementWidth = this.element?.clientWidth;
    const elementHeight = this.element?.clientHeight;
    const parentWidth = parent.clientWidth || parent.innerWidth;
    const parentHeight = parent.clientHeight || parent.innerHeight;
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

    if (this.isDestroyed) return;

    const scrollHandler = this._scrollHandler;
    const resizeHandler = this._resizeHandler;

    const callHandlers = () => {
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
    const parent = this.scrollingParent();

    this.__elementWidth__ = this.element?.clientWidth;
    this.__elementHeight__ = this.element?.clientHeight;

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
    let element = this.element;

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

export default EllaTreadmill;
