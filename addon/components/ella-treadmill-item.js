import classic from 'ember-classic-decorator';

import {
 classNames,
 attributeBindings,
 classNameBindings,
 tagName,
 layout as templateLayout,
} from '@ember-decorators/component';

import Component from '@ember/component';
import { get, getProperties, computed } from '@ember/object';
import layout from '../templates/components/ella-treadmill-item';

/**
 *
 * Acts as a child of an `{{ella-treadmill}}` component. Each item computes
 * the necessary styling to position itself as a customer scrolls up or down
 * its parent `{{ella-treadmill}}` instance.
 *
 * @element ella-treadmill-item
 */

@classic
@templateLayout(layout)
@tagName('ella-treadmill-item')
@attributeBindings('aria-hidden')
@classNames('ella-treadmill-item')
@classNameBindings('classRow', 'classColumn')
export default class EllaTreadmillItem extends Component {
 /**
  * Applied as the `role` attribute on the component's element.
  *
  * @property ariaRole
  * @type {String}
  * @default 'listitem'
  * @public
  */
 ariaRole = 'listitem';

 /**
  * The number of items per row the parent component expects to render.
  * Used to compute various styles and classes on this item.
  *
  * @property columns
  * @type {Number}
  * @default 1
  * @public
  */
 columns = 1;

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
 fluctuate = 2;

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
 fluctuateColumn = 2;

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
 height = 0;

 /**
  * The unit of measurement to use when computing and size and positioning
  * styles for this component.
  *
  * @property heightUnit
  * @type {String}
  * @default 'px'
  * @public
  */
 heightUnit = 'px';

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
 index = -1;

 /**
  * The single item of content wrapped by this component instance. This value
  * is yielded to the template.
  *
  * @property item
  * @default null
  * @public
  */
 item = null;

 /**
  * The parent `{{ella-treadmill}}`.
  *
  * @property parent
  * @default null
  * @public
  */
 parent = null;

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
 pageSize = 1;

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
 get 'aria-hidden'() {
   return this.index < 0;
 }

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
 @computed('fluctuate', 'index', 'columns')
 get classRow() {
   let {
     fluctuate,
     index,
     columns
   } = getProperties(this, 'fluctuate', 'index', 'columns');

   let row = Math.floor((index % (fluctuate * columns)) / columns) + 1;

   return `ella-treadmill-item-row-${row}`;
 }

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
 @computed('index', 'columns', 'fluctuateColumn')
 get classColumn() {
   let {
     index,
     columns,
     fluctuateColumn
   } = getProperties(this, 'index', 'columns', 'fluctuateColumn');

   let col = ((index % columns) % fluctuateColumn) + 1;

   return `ella-treadmill-item-column-${col}`;
 }

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
 @computed('parent.sampleItem', '_isSampleItem')
 get isSampleItem() {
   return this._isSampleItem || (get(this, 'parent.sampleItem') === this);
 }

 set isSampleItem(value) {
   return this.set('_isSampleItem', value);
 }

 /**
  * The computed `translateY` style.
  *
  * @property translateY
  * @type {String}
  * @public
  * @readOnly
  */
@computed('height', 'index', 'pageSize', 'columns', 'heightUnit')
 get translateY() {
   let {
     index,
     height,
     pageSize,
     columns,
     heightUnit
   } = getProperties(this, 'height', 'index', 'pageSize', 'columns', 'heightUnit');

   let pageRows = Math.ceil(pageSize / columns);

   return ((Math.floor(index / pageSize) * pageRows * height) || 0) + heightUnit;
 }

 /**
  * The computed `width` style as a percentage.
  *
  * @property width
  * @type {Number}
  * @default 100
  * @public
  * @readOnly
  */
 @computed('columns')
 get width() {
   let columns = parseInt(this.columns, 10) || 1;

   return 100 / columns;
 }

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
 get widthUnit() {
   return '%';
 }

 didInsertElement() {
   let fn = this['on-insert'];

   if (typeof fn === 'function') {
     fn(this);
   }
 }

 didRender() {
   if (!this.isSampleItem) {
     return;
   }

   let element = this.element;
   let fn = this['on-update'];

   if (element && typeof element.getBoundingClientRect === 'function' && typeof fn === 'function') {
     fn(element.getBoundingClientRect());
   }
 }

 willDestroyElement() {
   let fn = this['on-destroy'];

   if (typeof fn === 'function') {
     fn(this);
   }
 }
}
