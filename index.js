'use strict';

module.exports = {
  name: require('./package').name,
  isDevelopingAddon: () => {
    // eslint-disable-next-line no-console
    console.log(
      '**********************************************************ella treadmill'
    );
    return true;
  },
};
