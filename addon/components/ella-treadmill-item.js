import Component from '@glimmer/component';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';

class EllaTreadmillItemComponent extends Component {
  elementId = guidFor(this);

  get element() {
    return document.getElementById(this.elementId);
  }

  /**
   * The number of items per row the parent component expects to render.
   * Used to compute various styles and classes on this item.
   *
   * @property columns
   * @type {Number}
   * @default 1
   * @public
   */
  get columns() {
    return this.args.columns || 1;
  }

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
  get fluctuate() {
    return this.args.fluctuate || 2;
  }

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
  get fluctuateColumn() {
    return this.args.fluctuateColumn || 2;
  }

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
  get height() {
    return this.args.height || 0;
  }

  /**
   * The unit of measurement to use when computing and size and positioning
   * styles for this component.
   *
   * @property heightUnit
   * @type {String}
   * @default 'px'
   * @public
   */
  get heightUnit() {
    return this.args.heightUnit || 'px';
  }

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
  get index() {
    return this.args.index ?? -1;
  }

  /**
   * The single item of content wrapped by this component instance. This value
   * is yielded to the template.
   *
   * @property item
   * @default null
   * @public
   */
  get item() {
    return this.args.item || null;
  }

  /**
   * The parent `{{ella-treadmill}}`.
   *
   * @property parent
   * @default null
   * @public
   */
  get parent() {
    return this.args.parent || null;
  }

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
  get pageSize() {
    return this.args.pageSize || 1;
  }

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
  get classRow() {
    const { fluctuate, index, columns } = this;
    const row = Math.floor((index % (fluctuate * columns)) / columns) + 1;

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
  get classColumn() {
    const { index, columns, fluctuateColumn } = this;
    const col = ((index % columns) % fluctuateColumn) + 1;

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
  get isSampleItem() {
    return (
      this._isSampleItem ||
      this.parent?.sampleItem === this ||
      this.args.isSampleItem
    );
  }

  /**
   * The computed `translateY` style.
   *
   * @property translateY
   * @type {String}
   * @public
   * @readOnly
   */
  get translateY() {
    const { index, height, pageSize, columns, heightUnit } = this;
    const pageRows = Math.ceil(pageSize / columns);

    return (Math.floor(index / pageSize) * pageRows * height || 0) + heightUnit;
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
  get width() {
    const columns = parseInt(this.columns, 10) || 1;

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

  @action
  handleInsertElement() {
    const fn = this.args['on-insert'];

    if (typeof fn === 'function') {
      fn(this);
    }

    this.handleUpdateElement();
  }

  @action
  handleUpdateElement() {
    const { isSampleItem, element } = this;

    if (!isSampleItem) return;

    const fn = this.args['on-update'];

    if (
      typeof element?.getBoundingClientRect === 'function' &&
      typeof fn === 'function'
    ) {
      fn(element.getBoundingClientRect());
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);

    const fn = this.args['on-destroy'];

    if (typeof fn === 'function') {
      fn(this);
    }
  }
}

export default EllaTreadmillItemComponent;
