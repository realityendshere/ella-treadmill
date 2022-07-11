'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let project = defaults.project;
  let options = {};

  // if (project.findAddonByName('ember-native-dom-event-dispatcher') && process.env.DEPLOY_TARGET === undefined) {
  //   options.vendorFiles = { 'jquery.js': null };
  // }

  let app = new EmberApp(defaults, options);

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  const { maybeEmbroider } = require('@embroider/test-setup');
  return maybeEmbroider(app, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
};
