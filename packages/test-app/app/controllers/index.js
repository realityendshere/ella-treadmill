/* eslint no-console: 0 */

import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import { set, action } from '@ember/object';

export default class IndexController extends Controller {
  small = false;
  moveTo = null;

  numbers = alias('model');

  @action
  toggleSmall() {
    this.toggleProperty('small');
  }

  @action
  handleScrollStart() {
    console.log('SCROLL START ::', Date.now());
  }

  @action
  handleScrollEnd() {
    console.log('SCROLL END ::', Date.now());
  }

  @action
  handleResizeStart(props) {
    this.__indexAtStart__ = props.startingIndex;
    console.log('RESIZE START ::', Date.now());
  }

  @action
  handleResize() {
    set(this, 'moveTo', this.__indexAtStart__);
  }

  @action
  handleResizeEnd() {
    set(this, 'moveTo', this.__indexAtStart__);
    console.log('RESIZE END ::', Date.now());
  }
}