import Route from '@ember/routing/route';
import { set } from '@ember/object';

export default Route.extend({
  model() {
    let range = function (start, end) {
      return Array(end - start + 1).fill().map((_, idx) => {
        return { note: `Note number ${start + idx}` , number: start + idx };
      })
    }

    return range(1, 1000);
  },

  setupController(controller, model) {
    set(controller, 'numbers', model);
  }
});
