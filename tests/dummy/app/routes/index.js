import Ember from 'ember';

const { Route } = Ember;

export default Route.extend({
  model() {
    let range = function (start, end) {
      return Array(end - start + 1).fill().map((_, idx) => start + idx)
    }

    return range(1, 1000);
  }
});
