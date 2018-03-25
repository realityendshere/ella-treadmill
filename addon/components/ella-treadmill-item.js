import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import layout from '../templates/components/ella-treadmill-item';

/**
 *
 * Acts as a child of an `{{ella-treadmill}}` component. Each item computes
 * the necessary styling to position itself as a customer scrolls up or down
 * its parent `{{ella-treadmill}}` instance.
 *
 * @element ella-treadmill-item
 */

export default Component.extend({
  layout,

  /**
   * Tag name for the component's element.
   *
   * @property tagName
   * @type String
   * @default 'ella-treadmill-item'
   * @public
   */
  tagName: 'ella-treadmill-item',

  /**
   * An array of properties to apply as attributes on the component's element.
   *
   * @property attributeBindings
   * @type {Array|String}
   * @default [
   *   'aria-hidden'
   * ]
   * @public
   */
  attributeBindings: [
    'aria-hidden'
  ],

  /**
   * An array of additional CSS class names to add to the component's element.
   *
   * @property classNames
   * @type {Array|String}
   * @default ['ella-treadmill-item']
   * @public
   */
  classNames: ['ella-treadmill-item'],

  /**
   * An array of additional CSS class names to conditionally add to the
   * component's element.
   *
   * @property classNameBindings
   * @type {Array|String}
   * @default ['classRow', 'classColumn']
   * @public
   */
  classNameBindings: ['classRow', 'classColumn'],

  /**
   * Applied as the `role` attribute on the component's element.
   *
   * @property ariaRole
   * @type {String}
   * @default 'listitem'
   * @public
   */
  ariaRole: 'listitem',

  /**
   * The number of items per row the parent component expects to render.
   * Used to compute various styles and classes on this item.
   *
   * @property columns
   * @type {Number}
   * @default 1
   * @public
   */
  columns: 1,

  /**
   * How frequently to cycle through class names that indicate membership in a
   * "row" of listings.
   *
   * The parent component provides this setting to allow this item to compute
   * its own row class.
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
   * The parent component provides this setting to allow this item to compute
   * its own column class.
   *
   * @property fluctuateColumn
   * @type {Number}
   * @default 2
   * @public
   */
  fluctuateColumn: 2,

  /**
   * The numeric portion of the height style for this item. This component
   * uses this value to compute the item's height style and position in the
   * parent element.
   *
   * @property height
   * @type {Number}
   * @default 0
   * @public
   */
  height: 0,

  /**
   * The unit of measurement to use when computing and size and positioning
   * styles for this component.
   *
   * @property heightUnit
   * @type {String}
   * @default 'px'
   * @public
   */
  heightUnit: 'px',

  /**
   * The index of the content item wrapped in this component. This value helps
   * compute the position style for this component's element and is yielded to
   * the template.
   *
   * @property index
   * @type {Number}
   * @default -1
   * @public
   */
  index: -1,

  /**
   * The single item of content wrapped by this component instance. This value
   * is yielded to the template.
   *
   * @property item
   * @default null
   * @public
   */
  item: null,

  /**
   * The parent `{{ella-treadmill}}`.
   *
   * @property parent
   * @default null
   * @public
   */
  parent: null,

  /**
   * The number of visible items rendered by the parent `{{ella-treadmill}}`
   * component. You could also think of this as the "sibling count"
   * (self inclusive).
   *
   * @property pageSize
   * @type {Number}
   * @default 1
   * @public
   */
  pageSize: 1,

  /**
   * Toggle the aria-hidden attribute to hide this component's element from
   * screen readers.
   *
   * @property aria-hidden
   * @type {Boolean}
   * @default true
   * @public
   * @readOnly
   */
  'aria-hidden': computed.lt('index', 0).readOnly(),

  /**
   * The class name to apply to this component's element to indicate row
   * membership. The class name is in the format `ella-treadmill-item-row-##`,
   * where `##` is a number that cycles from 1 to the `fluctuate` value.
   *
   * @property classRow
   * @type {String}
   * @public
   * @readOnly
   */
  classRow: computed('fluctuate', 'index', 'columns', function() {
    let {
      fluctuate,
      index,
      columns
    } = getProperties(this, 'fluctuate', 'index', 'columns');

    let row = Math.floor((index % (fluctuate * columns)) / columns) + 1;

    return `ella-treadmill-item-row-${row}`;
  }).readOnly(),

  /**
   * The class name to apply to this component's element to indicate column
   * membership. The class name is in the format
   * `ella-treadmill-item-column-##`, where `##` is a number that cycles from 1
   * to the `fluctuateColumn` value.
   *
   * @property classColumn
   * @type {String}
   * @public
   * @readOnly
   */
  classColumn: computed('index', 'columns', 'fluctuateColumn', function() {
    let {
      index,
      columns,
      fluctuateColumn
    } = getProperties(this, 'index', 'columns', 'fluctuateColumn');

    let col = ((index % columns) % fluctuateColumn) + 1;

    return `ella-treadmill-item-column-${col}`;
  }).readOnly(),

  /**
   * Determine if this instance is the reference child for computing item
   * geometry. When `true`, certain additional rendering actions will be
   * triggered.
   *
   * @property isSampleItem
   * @type {Boolean}
   * @public
   * @readOnly
   */
  isSampleItem: computed('parent.sampleItem', function() {
    return get(this, 'parent.sampleItem') === this;
  }),

  /**
   * The computed `translateY` style.
   *
   * @property translateY
   * @type {String}
   * @public
   * @readOnly
   */
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
  }).readOnly(),

  /**
   * The computed `width` style as a percentage.
   *
   * @property width
   * @type {Number}
   * @default 100
   * @public
   * @readOnly
   */
  width: computed('columns', function() {
    let columns = parseInt(get(this, 'columns'), 10) || 1;

    return 100 / columns;
  }),

  /**
   * The unit of measurement to use in the width style.
   *
   * @property widthUnit
   * @type {String}
   * @default '%'
   * @public
   * @readOnly
   * @final
   */
  widthUnit: computed(function() {
    return '%';
  }).readOnly(),

  didInsertElement() {
    let fn = get(this, 'on-insert');

    if (typeof fn === 'function') {
      fn(this);
    }
  },

  didRender() {
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
