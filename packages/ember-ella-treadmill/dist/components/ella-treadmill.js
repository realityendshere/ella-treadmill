import { _ as _applyDecoratedDescriptor, a as _defineProperty, b as _initializerDefineProperty } from '../_rollupPluginBabelHelpers-2eca8644.js';
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';
import Component from '@glimmer/component';
import { A } from '@ember/array';
import { action } from '@ember/object';
import { run } from '@ember/runloop';
import { restartableTask, task, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

var TEMPLATE = hbs("<div\n  {{did-insert this.didInsert}}\n\n  class=\"\n    ella-treadmill\n    {{if this.resizing \"is-resizing\" \"not-resizing\"}}\n    {{if this.scrolling \"is-scrolling\" \"not-scrolling\"}}\n  \"\n  {{style\n    position=\"relative\"\n    width=\"100%\"\n    display=\"flex\"\n    flex-wrap=\"wrap\"\n    align-content=\"flex-start\"\n    box-sizing=\"border-box\"\n    height=(if this.totalHeight (concat this.totalHeight this._rowUnit))\n  }}\n\n  data-scroll-top={{get this \"data-scroll-top\"}}\n  data-scroll-delta={{this.topDelta}}\n  data-first-visible-index={{this.startingIndex}}\n  data-visible-items={{this.numberOfVisibleItems}}\n  ...attributes\n>\n  {{#each this.indices as |_ idx|}}\n    <EllaTreadmillItem\n      @parent={{this}}\n      @index={{get this.visibleIndexes (concat \"\" idx)}}\n      @item={{get this.visibleContent (concat \"\" idx)}}\n      @height={{this._row}}\n      @heightUnit={{this._rowUnit}}\n      @columns={{this.columns}}\n      @pageSize={{this.numberOfVisibleItems}}\n      @fluctuate={{this.fluctuate}}\n      @fluctuateColumn={{this.fluctuateColumn}}\n      @on-insert={{this.listItemInserted}}\n      @on-update={{this.listItemUpdated}}\n      @on-destroy={{this.listItemDestroyed}}\n      {{!-- I don\'t think this is need. --}}\n      {{!-- {{style webkit-overflow-scrolling=\"touch\"}} --}}\n      {{style pointer-events=(if this.scrolling \"none\" \"inherit\")}}\n      {{ella-treadmill-item on-update=this.listItemUpdated}}\n      as |item index|\n    >\n      <span\n      ></span>\n\n      {{#if (has-block)}}\n        {{yield item index}}\n      {{else}}\n        {{get this.visibleContent (concat \"\" idx)}}\n      {{/if}}\n    </EllaTreadmillItem>\n  {{else}}\n    {{yield to=\"inverse\"}}\n  {{/each}}\n</div>");

var _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
const RECALC_INTERVAL = 50;
const NO_WINDOW_HEIGHT = 1024;
const NO_WINDOW_WIDTH = 768;
const DEFAULT_ROW_HEIGHT = 50;
const FAKE_WINDOW = {
  clientWidth: NO_WINDOW_WIDTH,
  clientHeight: NO_WINDOW_HEIGHT,
  scrollY: 0
};

let ancestors = function (node, parents = []) {
  return node === null || node.parentNode === null ? parents : ancestors(node.parentNode, parents.concat([node]));
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


let EllaTreadmill = (_class = class EllaTreadmill extends Component {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "ariaRole", 'list');

    _initializerDefineProperty(this, "elementHeight", _descriptor, this);

    _initializerDefineProperty(this, "elementWidth", _descriptor2, this);

    _defineProperty(this, "fluctuate", 2);

    _defineProperty(this, "fluctuateColumn", 2);

    _initializerDefineProperty(this, "itemHeight", _descriptor3, this);

    _defineProperty(this, "itemWidth", 0);

    _initializerDefineProperty(this, "overdraw", _descriptor4, this);

    _initializerDefineProperty(this, "parentHeight", _descriptor5, this);

    _initializerDefineProperty(this, "parentWidth", _descriptor6, this);

    _initializerDefineProperty(this, "resizing", _descriptor7, this);

    _initializerDefineProperty(this, "sampleItem", _descriptor8, this);

    _initializerDefineProperty(this, "scrolling", _descriptor9, this);

    _initializerDefineProperty(this, "scrollTop", _descriptor10, this);

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
    value ? this._moveTo = value : this._moveTo = undefined;
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
    let od = this._overdrawRows; // Adjust starting index for overdraw above "stage"

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
    let {
      visibleIndexes,
      _content
    } = this;
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
    let {
      startingIndex,
      numberOfVisibleItems
    } = this;
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
    let {
      rowCount,
      _overdrawRows
    } = this;
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
    let {
      content
    } = this.args;

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
        result = row / 100 * parentHeight;
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

  didInsert() {
    this._rafWatcherBegin();

    this.updateGeometry();
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this._rafWatcherEnd();
  }

  listItemInserted(item) {
    if (!this.sampleItem) {
      this.sampleItem = item;
    }
  }

  listItemUpdated(geometry) {
    this.itemHeight = geometry.height;
    this.itemWidth = geometry.width;
  }

  listItemDestroyed(item) {
    if (this.sampleItem === item) {
      this.sampleItem = null;
    }
  }

  *resizeTask() {
    if (this.resizing === 0) {
      this.sendStateUpdate('on-resize-start');
    }

    this.resizing += 1;
    this.updateGeometry().sendStateUpdate('on-resize');
    yield timeout(RECALC_INTERVAL);
    this.resizing = 0;
    this.updateGeometry(); // this.notifyPropertyChange('visibleContent');

    this.sendStateUpdate('on-resize').sendStateUpdate('on-resize-end');
  }

  *scrollTask() {
    if (this.scrolling === 0) {
      this.sendStateUpdate('on-scroll-start');
    }

    this.scrolling += 1;
    this.updateGeometry().sendStateUpdate('on-scroll');
    yield timeout(RECALC_INTERVAL);
    this.scrolling = 0;
    this.updateGeometry(); // this.notifyPropertyChange('visibleContent');

    this.sendStateUpdate('on-scroll').sendStateUpdate('on-scroll-end');
  }

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
      return [getComputedStyle(node, null).getPropertyValue('overflow'), getComputedStyle(node, null).getPropertyValue('overflow-x'), getComputedStyle(node, null).getPropertyValue('overflow-y')].join(' ');
    };

    let scroller = A(ancestors(element.parentNode)).find(parent => {
      return /(auto|scroll)/.test(overflowProperties(parent));
    }); // I don't really understand what this was doing. Was it to account for weird parent
    // return element;

    return scroller || window || FAKE_WINDOW;
  }

  scrollToIndex(idx) {
    let parent = this.scrollingParent(); // let element = this.element;

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
      visibleIndexes
    }) => ({
      scrollTop,
      topDelta,
      startingIndex,
      numberOfVisibleItems,
      visibleIndexes
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

    if (elementWidth !== this.__elementWidth__ || elementHeight !== this.__elementHeight__ || parentWidth !== this.__parentWidth__ || parentHeight !== this.__parentHeight__) {
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

}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, "elementHeight", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "elementWidth", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "itemHeight", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 12;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, "overdraw", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, "parentHeight", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, "parentWidth", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, "resizing", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, "sampleItem", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return null;
  }
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, "scrolling", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, "scrollTop", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return 0;
  }
}), _applyDecoratedDescriptor(_class.prototype, "didInsert", [action], Object.getOwnPropertyDescriptor(_class.prototype, "didInsert"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "listItemInserted", [action], Object.getOwnPropertyDescriptor(_class.prototype, "listItemInserted"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "listItemUpdated", [action], Object.getOwnPropertyDescriptor(_class.prototype, "listItemUpdated"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "listItemDestroyed", [action], Object.getOwnPropertyDescriptor(_class.prototype, "listItemDestroyed"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "resizeTask", [restartableTask], Object.getOwnPropertyDescriptor(_class.prototype, "resizeTask"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "scrollTask", [restartableTask], Object.getOwnPropertyDescriptor(_class.prototype, "scrollTask"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "moveToTask", [task], Object.getOwnPropertyDescriptor(_class.prototype, "moveToTask"), _class.prototype)), _class);
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
  }

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
    return parent && typeof parent.getBoundingClientRect === 'function' ? parent.getBoundingClientRect() : {};
  }

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
  }

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
  }

});
setComponentTemplate(TEMPLATE, EllaTreadmill);

export { EllaTreadmill as default };
