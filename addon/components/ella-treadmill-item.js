import Component from '@glimmer/component';
import { action } from '@ember/object';

/**
 *
 * Acts as a child of an `{{ella-treadmill}}` component. Each item computes
 * the necessary styling to position itself as a customer scrolls up or down
 * its parent `{{ella-treadmill}}` instance.
 *
 * @element ella-treadmill-item
 */

export default class EllaTreadmillItem extends Component {
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
    return this.args.index < 0;
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
    let { index, fluctuate, columns } = this.args;
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
  get classColumn() {
    let { index, fluctuateColumn, columns } = this.args;
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
  get isSampleItem() {
    return this._isSampleItem || this.args.parent.sampleItem === this;
  }

  set isSampleItem(value) {
    this._isSampleItem = value;
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
    let { height, heightUnit, index, pageSize, columns } = this.args;
    let pageRows = Math.ceil(pageSize / columns);

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
    let columns = parseInt(this.args.columns, 10) || 1;

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
  didInsert() {
    let fn = this.args['on-insert'];

    if (typeof fn === 'function') {
      fn(this);
    }
    this.didRender();
  }

  @action
  didRender() {
    if (!this.isSampleItem) {
      return;
    }

    let element = document.querySelector(
      `.ella-treadmill-item.${this.classRow}.${this.classColumn}`
    );
    let fn = this.args['on-update'];

    if (
      element &&
      typeof element.getBoundingClientRect === 'function' &&
      typeof fn === 'function'
    ) {
      fn(element.getBoundingClientRect());
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);
    let fn = this.args['on-destroy'];

    if (typeof fn === 'function') {
      fn(this);
    }
  }
}
