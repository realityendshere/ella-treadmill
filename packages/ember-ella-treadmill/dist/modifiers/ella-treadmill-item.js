import { a as _defineProperty } from '../_rollupPluginBabelHelpers-2eca8644.js';
import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';

function cleanup(instance) {
  instance.resizeObserver.unobserve(instance.element);
  instance.resizeObserver.disconnect();
  instance.resizeObserver = null;
}

class EllaTreadmillItemModifier extends Modifier {
  constructor(owner, args) {
    super(owner, args);

    _defineProperty(this, "resizeObserver", null);

    registerDestructor(this, cleanup);
  }

  modify(element, [args], defaultArgs) {
    this.resizeObserver = new ResizeObserver(() => {
      defaultArgs['on-update'](element.getBoundingClientRect());
    });
    this.resizeObserver.observe(element);
  }

}

export { EllaTreadmillItemModifier as default };
