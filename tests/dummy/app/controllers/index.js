/* eslint no-console: 0 */

import Controller from '@ember/controller';
import { set } from '@ember/object';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class IndexController extends Controller {
  @tracked small = false;
  @tracked moveTo = null;

  @action
  toggleSmall() {
    this.small = !this.small;
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
