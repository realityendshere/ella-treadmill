/* eslint no-console: 0 */

import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  small = false;
  moveTo = null;

  get numbers() {
    return this.model;
  }

  @action
  toggleSmall() {
    this.small = !!this.small;
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
    this.moveTo = this.__indexAtStart__;
  }

  @action
  handleResizeEnd() {
    this.moveTo = this.__indexAtStart__;
    console.log('RESIZE END ::', Date.now());
  }
}
