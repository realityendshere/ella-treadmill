import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';

function cleanup(instance) {
  instance.resizeObserver.unobserve(instance.element);
  instance.resizeObserver.disconnect();
  instance.resizeObserver = null;
}

export default class EllaTreadmillItemModifier extends Modifier {
  resizeObserver = null;

  constructor(owner, args) {
    super(owner, args);
    registerDestructor(this, cleanup);
  }

  modify(element, [args], defaultArgs) {
    this.resizeObserver = new ResizeObserver(() => {
      defaultArgs["on-update"](element.getBoundingClientRect());
    });

    this.resizeObserver.observe(element);
  }
}