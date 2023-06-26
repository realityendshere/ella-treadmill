import { module, test } from 'qunit';
/* eslint ember/named-functions-in-promises: 0 */

import { setupRenderingTest } from 'ember-qunit';
import { render, waitUntil } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import { A } from '@ember/array';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | ella treadmill', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  hooks.beforeEach(function() {
    let testElement = document.getElementById('ember-testing');

    testElement.style.overflow = 'auto';
  });

  const DEFAULT_HEIGHT = 50;

  let range = function(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
  }

  const ONE_ITEM_ARRAY = range(1, 1);
  const LARGE_ARRAY = range(1, 10000);

  test('it renders', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    assert.equal(document.querySelectorAll('ella-treadmill').length, 1, 'tag name is ella-treadmill');
    assert.equal(document.querySelectorAll('.ella-treadmill').length, 1, 'has class "ella-treadmill"');
    assert.equal(document.querySelectorAll('.not-resizing').length, 1, 'has class "not-resizing"');
    assert.equal(document.querySelectorAll('.not-scrolling').length, 1, 'has class "not-scrolling"');
  });

  test('it has an ARIA role of "list"', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.attributes.role.value, 'list');
  });

  test('it has a "data-visible-items" attribute', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.attributes['data-visible-items'].value, '0');
  });

  test('it has a "data-first-visible-index" attribute', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.attributes['data-first-visible-index'].value, '0');
  });

  test('it has a "data-scroll-delta" attribute', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    let element = document.querySelector('ella-treadmill');

    assert.ok(element.attributes['data-scroll-delta'].value);
  });

  test('it has a "data-scroll-top" attribute', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.attributes['data-scroll-top'].value, '0');
  });

  test('it does not set a height property when no content provided', async function(assert) {
    await render(hbs`<EllaTreadmill />`);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.clientHeight, 0);
  });

  test('it renders an inverse block when no content to display', async function(assert) {
    this.set('model', []);

    await render(hbs`
      {{#ella-treadmill content=model as |item index|}}
        I am a listing.
      {{else}}
        Nothing to see here.
      {{/ella-treadmill}}
    `);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.querySelectorAll('ella-treadmill-item').length, 0);
    assert.equal(element.innerText, 'Nothing to see here.');
  });

  test('it renders with a default row height', async function(assert) {
    let model = A(range(1, 1));

    this.set('model', model);

    await render(hbs`<EllaTreadmill @content={{model}} />`);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.clientHeight, DEFAULT_HEIGHT, 'height multiplies by 1');

    run(() => {
      this.model.pushObject('b');
    });

    assert.equal(element.clientHeight, DEFAULT_HEIGHT * 2, 'height multiplies by 2');

    this.set('model', LARGE_ARRAY);

    assert.equal(
      element.clientHeight,
      DEFAULT_HEIGHT * LARGE_ARRAY.length,
      'height multiplies content length'
    );
  });

  test('it renders with a default width of 100%', async function(assert) {
    this.set('model', ONE_ITEM_ARRAY);

    await render(hbs`
      <EllaTreadmill @content={{model}} />
      <div id="measurement" style="width: 100%;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let expected = document.getElementById('measurement');

    assert.equal(
      element.clientWidth,
      expected.clientWidth,
      'default width is 100%, the same width as the comparison element'
    );

    this.set('model', LARGE_ARRAY);

    assert.equal(
      element.clientWidth,
      expected.clientWidth,
      'default width is (still) 100%'
    );
  });

  test('it renders with a custom row height (in px)', async function(assert) {
    let rowHeight = 24;

    this.set('model', ONE_ITEM_ARRAY);
    this.set('rowHeight', rowHeight);

    await render(hbs`
      <EllaTreadmill @row={{rowHeight}} @content={{model}} />
      <div id="test1" style="height: 24px;">&nbsp;</div>
      <div id="test2" style="height: 100px;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let expected = document.getElementById('test1');

    assert.equal(element.clientHeight, expected.clientHeight);

    this.set('model', LARGE_ARRAY);

    assert.equal(element.clientHeight, expected.clientHeight * LARGE_ARRAY.length);

    this.set('rowHeight', rowHeight = 100);

    expected = document.getElementById('test2');

    assert.equal(element.clientHeight, expected.clientHeight * LARGE_ARRAY.length);
  });

  test('it renders with a custom row height unit (rem)', async function(assert) {
    this.set('model', LARGE_ARRAY);
    this.set('expectedHeight', (LARGE_ARRAY.length * 5.35) + 'rem');

    await render(hbs`
      <EllaTreadmill @row="5.35rem" @content={{model}} />
      <style type="text/css">
        #measurement {
          height: {{expectedHeight}};
        }
      </style>
      <div id="measurement">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let expected = document.getElementById('measurement');

    assert.equal(element.clientHeight, expected.clientHeight);
  });

  test('it renders with a custom row height unit (%)', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="height: 500px; overflow: auto;">
        <EllaTreadmill @row="20%" @content={{model}} />
      </div>
    `);

    let element = document.querySelector('ella-treadmill');

    assert.equal(element.clientHeight, 100 * LARGE_ARRAY.length);
  });

  test('it renders enough list items to fill the available vertical space (default px)', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = (10 * DEFAULT_HEIGHT) + 'px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`<EllaTreadmill @content={{model}} />`);

    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, itemCountAttr, 'rendered item count matches attribute value');
    assert.equal(itemCount, 11, 'enough rows rendered to fill 500px height');

    run(() => {
      testElement.style.height = (16.7 * DEFAULT_HEIGHT) + 'px';
    });

    return waitUntil(() => {
      return (document.querySelectorAll('ella-treadmill > ella-treadmill-item').length !== itemCount);
    }).then(() => {
      let itemCountAttr = element.attributes['data-visible-items'].value;
      let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

      assert.equal(itemCount, 18, 'enough rows rendered to fill 835px height');
      assert.equal(itemCount, itemCountAttr, 'rendered item count (still) matches attribute value');
    });
  });

  test('it renders enough list items to fill the available vertical space (dynamic px)', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '600px';

    this.set('model', LARGE_ARRAY);
    this.set('rowHeight', 30);

    await render(hbs`<EllaTreadmill @row={{rowHeight}} @content={{model}} />`);

    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, itemCountAttr);
    assert.equal(itemCount, 21, 'enough rows rendered to fill 600px height');

    this.set('rowHeight', 60);

    itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, itemCountAttr);
    assert.equal(itemCount, 11, 'row count updates after row height changed');
  });

  test('it renders enough list items to fill the available vertical space (em)', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @row="2.35em" @content={{model}} />
      <div id="measurement" style="height: 2.35em;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let expected = document.getElementById('measurement');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.ok(itemCount > Math.ceil(500 / expected.clientHeight));
    assert.ok(itemCount < Math.ceil(500 / expected.clientHeight) + 3);
    assert.equal(itemCount, itemCountAttr);

    run(() => {
      testElement.style.height = '600px';
    });

    return waitUntil(() => {
      return (document.querySelectorAll('ella-treadmill > ella-treadmill-item').length !== itemCount);
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
      let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

      assert.ok(itemCount > Math.ceil(600 / expected.clientHeight));
      assert.ok(itemCount < Math.ceil(600 / expected.clientHeight) + 3);
      assert.equal(itemCount, itemCountAttr);
    });
  });

  test('it renders enough list items to fill the available vertical space (rem)', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @row="3.1rem" @content={{model}} />
      <div id="measurement" style="height: 3.1rem;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let expected = document.getElementById('measurement');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.ok(itemCount > Math.ceil(500 / expected.clientHeight));
    assert.ok(itemCount < Math.ceil(500 / expected.clientHeight) + 3);
    assert.equal(itemCount, itemCountAttr);

    run(() => {
      testElement.style.height = '600px';
    });

    return waitUntil(() => {
      return (document.querySelectorAll('ella-treadmill > ella-treadmill-item').length !== itemCount);
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
      let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

      assert.ok(itemCount > Math.ceil(600 / expected.clientHeight));
      assert.ok(itemCount < Math.ceil(600 / expected.clientHeight) + 3);
      assert.equal(itemCount, itemCountAttr);
    });
  });

  test('it renders enough list items to fill the available vertical space (%)', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @row="20%" @content={{model}} />
    `);

    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;
    let stopWait = false;

    assert.equal(itemCount, 6);
    assert.equal(itemCount, itemCountAttr);

    run(() => {
      testElement.style.height = '600px';
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
      let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

      assert.equal(itemCount, 6);
      assert.equal(itemCount, itemCountAttr);
    });
  });

  test('it renders fewer list items when content fits in visible space', async function(assert) {
    this.set('model', ONE_ITEM_ARRAY);

    await render(hbs`<EllaTreadmill @content={{model}} />`);

    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCountAttr, 1, 'renders only enough children to show single item');
    assert.equal(itemCount, itemCountAttr);
  });

  test('it adds an "is-resizing" class while resizing', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    await render(hbs`<EllaTreadmill />`);

    run(() => {
      testElement.style.height = '600px';
      testElement.style.height = '620px';
    });

    return waitUntil(() => {
      return document.querySelector('ella-treadmill.is-resizing');
    }).then(() => {
      assert.ok(document.querySelector('ella-treadmill.is-resizing'), 'adds class for event');

      return waitUntil(() => {
        return document.querySelector('ella-treadmill.not-resizing');
      }).then(() => {
        assert.ok(document.querySelector('ella-treadmill.not-resizing'), 'removes class when events stop');
      });
    });
  });

  test('it triggers an "on-resize-start" action', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let actionTriggered = 0;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    this.actions.handleResizeStart = function() {
      actionTriggered = actionTriggered + 1;
    };

    await render(hbs`<EllaTreadmill @row="100" @content={{model}} @on-resize-start={{action "handleResizeStart"}} />`);

    assert.equal(actionTriggered, 0, 'action not yet called');

    run(() => {
      testElement.style.height = '600px';
      testElement.style.height = '620px';
      testElement.style.height = '610px';
    });

    return waitUntil(() => {
      return actionTriggered;
    }).then(() => {
      assert.equal(actionTriggered, 1, 'action called just once');
    });
  });

  test('it triggers an "on-resize-end" action', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let actionTriggered = false;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    this.actions.handleResizeEnd = function() {
      actionTriggered = true;
    };

    await render(hbs`<EllaTreadmill @row="100" @content={{model}} @on-resize-end={{action "handleResizeEnd"}} />`);

    assert.equal(actionTriggered, false, 'action not yet called');

    run(() => {
      testElement.style.height = '600px';
      testElement.style.height = '620px';
    });

    return waitUntil(() => {
      return actionTriggered;
    }).then(() => {
      assert.ok(actionTriggered, 'action called');
    });
  });

  test('its "data-first-visible-index" updates when columns', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let stopWait = false;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`<EllaTreadmill @row="100px" @content={{model}} @minColumnWidth="100px" />`);

    let element = document.querySelector('ella-treadmill');

    run(() => {
      testElement.scrollTop = 3030;
      testElement.style.width = '1000px';
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      assert.equal(element.attributes['data-first-visible-index'].value, '300');
    });
  });

  test('"moveTo=" scrolls that index into view', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let stopWait = false;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);
    this.set('moveTo', 300);

    await render(hbs`
      <EllaTreadmill @moveTo={{moveTo}} @content={{model}} @row="100px" @minColumnWidth="100px" />
    `);

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let result = parseInt(element.attributes['data-first-visible-index'].value, 10);

      // Firefox behaves slightly differently
      assert.ok((result > 285 && result < 305), 'Firefox behaves slightly differently');
    });
  });

  test('setting "moveTo" scrolls that index into view', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let stopWait = false;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);
    this.set('moveTo', 0);

    await render(hbs`
      <EllaTreadmill @moveTo={{moveTo}} @content={{model}} @row="100px" @minColumnWidth="100px" />
    `);

    run(() => {
      this.set('moveTo', 300);
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let result = parseInt(element.attributes['data-first-visible-index'].value, 10);

      // Firefox behaves slightly differently
      assert.ok((result > 285 && result < 305), 'Firefox behaves slightly differently');
    });
  });

  test('it adds an "is-scrolling" class while scrolling', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`<EllaTreadmill @content={{model}} @row="100" />`);

    run(() => {
      testElement.scrollTop = 100;
      testElement.scrollTop = 101;
      testElement.scrollTop = 102;
      testElement.scrollTop = 103;
      testElement.scrollTop = 104;
      testElement.scrollTop = 105;
    });

    return waitUntil(() => {
      return document.querySelector('ella-treadmill.is-scrolling');
    }).then(() => {
      assert.ok(document.querySelector('ella-treadmill.is-scrolling'), 'adds class for event');

      return waitUntil(() => {
        return document.querySelector('ella-treadmill.not-scrolling');
      }).then(() => {
        assert.ok(document.querySelector('ella-treadmill.not-scrolling'), 'removes class when events stop');
      });
    });
  });

  test('it triggers an "on-scroll-start" action', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let actionTriggered = 0;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);
    this.actions.handleScrollStart = function() {
      actionTriggered = actionTriggered + 1;
    };

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="100" @on-scroll-start={{action "handleScrollStart"}} />
      </div>
    `);

    assert.equal(actionTriggered, 0, 'action not yet called');

    run(() => {
      document.getElementById('scroller').scrollTop = 100;
      document.getElementById('scroller').scrollTop = 101;
      document.getElementById('scroller').scrollTop = 102;
      document.getElementById('scroller').scrollTop = 103;
      document.getElementById('scroller').scrollTop = 104;
      document.getElementById('scroller').scrollTop = 105;
    });

    return waitUntil(() => {
      return actionTriggered;
    }).then(() => {
      assert.equal(actionTriggered, 1, 'action called just once');
    });
  });

  test('it triggers an "on-scroll-end" action', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let actionTriggered = false;

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);
    this.actions.handleScrollEnd = function(props) {
      actionTriggered = props;
    };

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="100" @on-scroll-end={{action "handleScrollEnd"}} />
      </div>
    `);

    assert.equal(actionTriggered, false, 'action not yet called');

    run(() => {
      document.getElementById('scroller').scrollTop = 100;
    });

    return waitUntil(() => {
      return actionTriggered;
    }).then(() => {
      assert.equal(actionTriggered.scrollTop, 100, 'action called with expected scrollTop');
      assert.equal(actionTriggered.startingIndex, 1, 'action called with expected startingIndex');
      assert.equal(
        actionTriggered.numberOfVisibleItems,
        6,
        'action called with expected numberOfVisibleItems'
      );
      assert.deepEqual(
        actionTriggered.visibleIndexes,
        [1, 2, 3, 4, 5, 6],
        'action called with expected visibleIndexes'
      );
    });
  });

  test('it triggers "on-scroll" action', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let actionTriggered = false;

    testElement.style.height = '600px';

    this.set('model', LARGE_ARRAY);

    this.actions.handleListingStateChanged = function(props) {
      actionTriggered = props;
    };

    await render(hbs`
      <div id="bumper" style="height: 300px;">&nbsp;</div>
      <EllaTreadmill @content={{model}} @row="100" @on-scroll={{action "handleListingStateChanged"}} />
    `);

    assert.equal(actionTriggered, false, 'action not yet called');

    run(() => {
      testElement.scrollTop = 30010;
    });

    return waitUntil(() => {
      return actionTriggered;
    }).then(() => {
      assert.equal(actionTriggered.scrollTop, 30010, 'action called with expected scrollTop');
      assert.equal(actionTriggered.startingIndex, 297, 'action called with expected startingIndex');
      assert.equal(
        actionTriggered.numberOfVisibleItems,
        7,
        'action called with expected numberOfVisibleItems'
      );
      assert.deepEqual(
        actionTriggered.visibleIndexes,
        [297, 298, 299, 300, 301, 302, 303],
        'action called with expected visibleIndexes'
      );
    });
  });

  test('it triggers "on-resize" action', async function(assert) {
    let testElement = document.getElementById('ember-testing');
    let actionTriggered = false;

    testElement.style.height = '600px';

    this.set('model', LARGE_ARRAY);

    this.actions.handleListingStateChanged = function(props) {
      actionTriggered = props;
    };

    await render(hbs`
      <EllaTreadmill @content={{model}} @row="100" @on-resize={{action "handleListingStateChanged"}} />
    `);

    assert.equal(actionTriggered, false, 'action not yet called');

    run(() => {
      testElement.style.height = '1200px';
    });

    return waitUntil(() => {
      return actionTriggered;
    }).then(() => {
      assert.notOk(actionTriggered.scrollTop, 'action called with falsy scrollTop');
      assert.equal(actionTriggered.startingIndex, 0, 'action called with expected startingIndex');
      assert.equal(
        actionTriggered.numberOfVisibleItems,
        13,
        'action called with expected numberOfVisibleItems'
      );
      assert.deepEqual(
        actionTriggered.visibleIndexes,
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'action called with expected visibleIndexes'
      );
    });
  });

  test('it updates the data-scroll-top attribute', async function(assert) {
    let stopWait = false;

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
    `);

    run(() => {
      document.getElementById('scroller').scrollTop = 100;
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let attr = element.attributes['data-scroll-top'].value;

      assert.equal(attr, '100');
    });
  });

  test('it updates the data-scroll-delta attribute', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
      <div id="measurement" style="height: 100px;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-scroll-delta'].value;
    let stopWait = false;

    assert.equal(attr, '0', 'starts at 0');

    run(() => {
      document.getElementById('scroller').scrollTop = 100;
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let testHeight = document.getElementById('measurement').getBoundingClientRect().height;

      attr = element.attributes['data-scroll-delta'].value;
      assert.equal(attr, `${testHeight}`);
    });
  });

  test('its data-scroll-delta attribute can be a negative number', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <div id="bumper" style="height: 300px;">&nbsp;</div>
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
      <div id="measurement" style="height: 100px;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-scroll-delta'].value;
    let testHeight = document.getElementById('measurement').getBoundingClientRect().height;
    let stopWait = false;

    assert.equal(Math.round(parseFloat(attr, 10)), testHeight * -3, 'starts at -300');

    run(() => {
      document.getElementById('scroller').scrollTop = 1000;
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      attr = element.attributes['data-scroll-delta'].value;
      assert.equal(Math.round(parseFloat(attr, 10)), testHeight * 7);
    });
  });

  test('its data-first-visible-index attribute updates on scroll', async function(assert) {
    let stopWait = false;

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
    `);

    run(() => {
      document.getElementById('scroller').scrollTop = 30010;
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let attr = element.attributes['data-first-visible-index'].value;

      assert.equal(attr, '300');
    });
  });

  test('its data-first-visible-index attribute updates on scroll when below other content', async function(assert) {
    let stopWait = false;

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <div id="bumper" style="height: 300px;">&nbsp;</div>
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
    `);

    run(() => {
      document.getElementById('scroller').scrollTop = 30010;
    });

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let attr = element.attributes['data-first-visible-index'].value;

      assert.equal(attr, '297');
    });
  });

  test('it displays the correct content item in each listing', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @content={{model}} @row="100" />
    `);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `${index + 1}`;

      assert.equal(node.innerText, expected);
    });
  });

  test('it displays the correct content item in each listing (block usage)', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '500px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @content={{model}} @row="100" as |item index|>
        [{{{index}}}]: I am item #{{item}}
      </EllaTreadmill>
    `);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `[${index}]: I am item #${index + 1}`;

      assert.equal(node.innerText, expected);
    });
  });

  test('it displays the correct content item in each listing when rendered below other content', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <div id="bumper" style="height: 300px;">&nbsp;</div>
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
    `);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `${index + 1}`;

      assert.equal(node.innerText, expected);
    });
  });

  test('it updates the content in each listing on scroll', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
    `);

    run(() => {
      document.getElementById('scroller').scrollTop = 1310;
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index, list) => {
        let expected = (index) >= 1 ? `${index + 1 + (2 * list.length)}` : `${index + 1 + (3 * list.length)}`;

        assert.equal(node.innerText, expected);
      });
    });
  });

  test('it does not update the content in each listing until items scroll out of view', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 500px;" id="scroller">
        <div id="bumper" style="height: 300px;">&nbsp;</div>
        <EllaTreadmill @content={{model}} @row="100" />
      </div>
    `);

    run(() => {
      document.getElementById('scroller').scrollTop = 300;
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
        let expected = `${index + 1}`;

        assert.equal(node.innerText, expected);
      });
    });
  });

  test('it updates the content in each listing on scroll after items scroll out of view', async function(assert) {
    let scrollPx = 65350;
    let rowHeight = 72;

    this.set('model', LARGE_ARRAY);
    this.set('rowHeight', rowHeight);

    await render(hbs`
      <div style="overflow: auto; height: 768px;" id="scroller">
        <div id="bumper" style="height: 300px;">&nbsp;</div>
        <EllaTreadmill @content={{model}} @row={{rowHeight}} />
      </div>
    `);

    run(() => {
      document.getElementById('scroller').scrollTop = scrollPx;
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index, list) => {
        let scrollDelta = scrollPx - 300;
        let multiplier = Math.floor(scrollDelta / list.length / rowHeight);
        let mod = Math.floor(scrollDelta % (list.length * rowHeight) / rowHeight);

        let expected = (index) >= mod ?
          `${(multiplier * list.length) + (index + 1)}` :
          `${((multiplier + 1) * list.length) + (index + 1)}`;

        assert.equal(node.innerText, expected);
      });
    });
  });

  test('it has an "overdraw" attribute that enables a few extra items to be rendered', async function(assert) {
    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div style="overflow: auto; height: 600px;" id="scroller">
        <EllaTreadmill @content={{model}} @row="30" @overdraw={{overdraw}} />
      </div>
    `);

    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, 21);

    // Overdraw specified as a percentage.
    // In this case, approximately 20% more items should be rendered above and
    // below the visible area.
    this.set('overdraw', 20);

    itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, 29);

    this.set('overdraw', 100);

    itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, 61);

    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-first-visible-index'].value;

    assert.equal(attr, '0', 'the starting index has a minimum value of 0');

    run(() => {
      document.getElementById('scroller').scrollTop = 9010;
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let element = document.querySelector('ella-treadmill');
      let attr = element.attributes['data-first-visible-index'].value;

      assert.equal(attr, '280', 'the starting index accounts for overdraw');
    });
  });

  test('it renders items in a grid when "minColumnWidth" set as percentage', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '600px';
    testElement.style.width = '600px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @content={{model}} @row="60" @minColumnWidth="33%" />

      <div id="test0" style="height: 60px; width: 200px; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <div id="test1" style="height: 60px; width: 200px; position: absolute; top: 0; left: 200px;">&nbsp;</div>
      <div id="test2" style="height: 60px; width: 200px; position: absolute; top: 0; left: 400px;">&nbsp;</div>
      <div id="test3" style="height: 60px; width: 200px; position: absolute; top: 60px; left: 0;">&nbsp;</div>
      <div id="test4" style="height: 60px; width: 200px; position: absolute; top: 60px; left: 200px;">&nbsp;</div>
      <div id="test5" style="height: 60px; width: 200px; position: absolute; top: 60px; left: 400px;">&nbsp;</div>
      <div id="resize0" style="height: 60px; width: 400px; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <div id="resize1" style="height: 60px; width: 400px; position: absolute; top: 0; left: 400px;">&nbsp;</div>
      <div id="resize2" style="height: 60px; width: 400px; position: absolute; top: 0; left: 800px;">&nbsp;</div>
      <div id="resize3" style="height: 60px; width: 400px; position: absolute; top: 60px; left: 0;">&nbsp;</div>
      <div id="resize4" style="height: 60px; width: 400px; position: absolute; top: 60px; left: 400px;">&nbsp;</div>
      <div id="resize5" style="height: 60px; width: 400px; position: absolute; top: 60px; left: 800px;">&nbsp;</div>

      <div id="testTotal" style="height: 200040px;">&nbsp;</div>
    `);

    let element = document.querySelector('ella-treadmill');
    let items = document.querySelectorAll('ella-treadmill > ella-treadmill-item');
    let expectedTotal = document.getElementById('testTotal');

    assert.equal(element.clientHeight, expectedTotal.clientHeight);
    assert.equal(items.length, 33, 'renders 11 rows of 3 columns');

    for (let i = 0; i < 6; i++) {
      let geom = items.item(i).getBoundingClientRect();
      let expected = document.getElementById(`test${i}`).getBoundingClientRect();

      assert.equal(geom.height, expected.height, 'height matches comparison element');
      assert.equal(geom.width, expected.width, 'width matches comparison element');
      assert.equal(geom.top, expected.top, 'top position matches comparison element');
      assert.equal(geom.left, expected.left, 'left position matches comparison element');
    }

    run(() => {
      testElement.style.width = '1200px';
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      for (let i = 0; i < 6; i++) {
        let geom = items.item(i).getBoundingClientRect();
        let expected = document.getElementById(`resize${i}`).getBoundingClientRect();

        assert.equal(geom.height, expected.height, 'resized height matches comparison element');
        assert.equal(geom.width, expected.width, 'resized width matches comparison element');
        assert.equal(geom.top, expected.top, 'resized top position matches comparison element');
        assert.equal(geom.left, expected.left, 'resized left position matches comparison element');
      }
    });
  });

  test('it renders items in a grid when "minColumnWidth" set in pixels', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '600px';
    testElement.style.width = '600px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <EllaTreadmill @content={{model}} @row="60" @minColumnWidth="180px" />

      <div id="test0" style="height: 60px; width: 200px; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <div id="test1" style="height: 60px; width: 200px; position: absolute; top: 0; left: 200px;">&nbsp;</div>
      <div id="test2" style="height: 60px; width: 200px; position: absolute; top: 0; left: 400px;">&nbsp;</div>
      <div id="test3" style="height: 60px; width: 200px; position: absolute; top: 60px; left: 0;">&nbsp;</div>
      <div id="test4" style="height: 60px; width: 200px; position: absolute; top: 60px; left: 200px;">&nbsp;</div>
      <div id="test5" style="height: 60px; width: 200px; position: absolute; top: 60px; left: 400px;">&nbsp;</div>
      <div id="resize0" style="height: 60px; width: 180px; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <div id="resize1" style="height: 60px; width: 180px; position: absolute; top: 0; left: 180px;">&nbsp;</div>
      <div id="resize2" style="height: 60px; width: 180px; position: absolute; top: 0; left: 360px;">&nbsp;</div>
      <div id="resize3" style="height: 60px; width: 180px; position: absolute; top: 0; left: 540px;">&nbsp;</div>
      <div id="resize4" style="height: 60px; width: 180px; position: absolute; top: 0; left: 720px;">&nbsp;</div>
      <div id="resize5" style="height: 60px; width: 180px; position: absolute; top: 60px; left: 0;">&nbsp;</div>
    `);

    let items = document.querySelectorAll('ella-treadmill > ella-treadmill-item');

    assert.equal(items.length, 33, 'renders 11 rows of 3 columns');

    for (let i = 0; i < 6; i++) {
      let geom = items.item(i).getBoundingClientRect();
      let expected = document.getElementById(`test${i}`).getBoundingClientRect();

      assert.equal(geom.height, expected.height, 'height matches comparison element');
      assert.equal(geom.width, expected.width, 'width matches comparison element');
      assert.equal(geom.top, expected.top, 'top position matches comparison element');
      assert.equal(geom.left, expected.left, 'left position matches comparison element');
    }

    run(() => {
      testElement.style.width = '900px';
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let items = document.querySelectorAll('ella-treadmill > ella-treadmill-item');

      for (let i = 0; i < 6; i++) {
        let geom = items.item(i).getBoundingClientRect();
        let expected = document.getElementById(`resize${i}`).getBoundingClientRect();

        assert.equal(geom.height, expected.height, 'resized height matches comparison element');
        assert.equal(geom.width, expected.width, 'resized width matches comparison element');
        assert.equal(geom.top, expected.top, 'resized top position matches comparison element');
        assert.equal(geom.left, expected.left, 'resized left position matches comparison element');
      }
    });
  });

  test('it repositions grid items after scroll', async function(assert) {
    let testElement = document.getElementById('ember-testing');

    testElement.style.height = '900px';
    testElement.style.width = '900px';

    this.set('model', LARGE_ARRAY);

    await render(hbs`
      <div id="bumper" style="height: 372px;">&nbsp;</div>

      <EllaTreadmill @content={{model}} @row="150" @minColumnWidth="300px" />

      <div id="test0" style="height: 150px; width: 300px; position: absolute; top: 35022px; left: 0;">&nbsp;</div>
      <div id="test1" style="height: 150px; width: 300px; position: absolute; top: 35022px; left: 300px;">&nbsp;</div>
      <div id="test2" style="height: 150px; width: 300px; position: absolute; top: 35022px; left: 600px;">&nbsp;</div>
      <div id="test3" style="height: 150px; width: 300px; position: absolute; top: 34122px; left: 0;">&nbsp;</div>
      <div id="test4" style="height: 150px; width: 300px; position: absolute; top: 34122px; left: 300px;">&nbsp;</div>
      <div id="test5" style="height: 150px; width: 300px; position: absolute; top: 34122px; left: 600px;">&nbsp;</div>
    `);

    let items = document.querySelectorAll('ella-treadmill > ella-treadmill-item');

    assert.equal(items.length, 21, 'renders 7 rows of 3 columns');

    run(() => {
      testElement.scrollTop = 34222;
    });

    let stopWait = false;

    run.later(() => {
      stopWait = true;
    }, 100);

    return waitUntil(() => {
      return stopWait;
    }).then(() => {
      let items = document.querySelectorAll('ella-treadmill > ella-treadmill-item');

      for (let i = 0; i < 6; i++) {
        let geom = items.item(i).getBoundingClientRect();
        let expected = document.getElementById(`test${i}`).getBoundingClientRect();

        assert.equal(
          Math.round(10 * geom.height),
          Math.round(10 * expected.height),
          'repositioned height matches comparison element'
        );
        assert.equal(
          Math.round(10 * geom.width),
          Math.round(10 * expected.width),
          'repositioned width matches comparison element'
        );
        assert.equal(
          Math.round(10 * geom.top),
          Math.round(10 * expected.top),
          'repositioned top position matches comparison element'
        );
        assert.equal(
          Math.round(10 * geom.left),
          Math.round(10 * expected.left),
          'repositioned left position matches comparison element'
        );
      }
    });
  });

  test('it renders items with a class name that indicates row membership', async function(assert) {
    this.set('model', LARGE_ARRAY);
    this.set('fluctuate', 2);
    this.set('minColumnWidth', '100%');

    await render(hbs`
      <EllaTreadmill @content={{model}} @fluctuate={{fluctuate}} @minColumnWidth={{minColumnWidth}} />
    `);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `ella-treadmill-item-row-${(index % 2) + 1}`;

      assert.dom(node).hasClass(expected);
    });

    this.set('fluctuate', 5);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `ella-treadmill-item-row-${(index % 5) + 1}`;

      assert.dom(node).hasClass(expected);
    });

    this.set('minColumnWidth', '25%');

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      if (index < 4) {
        assert.dom(node).hasClass('ella-treadmill-item-row-1');
      } else if (index === 4) {
        assert.dom(node).hasClass('ella-treadmill-item-row-2');
      }
    });
  });

  test('it renders items with a class name that indicates column membership', async function(assert) {
    this.set('model', LARGE_ARRAY);
    this.set('fluctuateColumn', 2);
    this.set('minColumnWidth', '33%');

    await render(hbs`
      <EllaTreadmill @content={{model}} @fluctuateColumn={{fluctuateColumn}} @minColumnWidth={{minColumnWidth}} />
    `);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `ella-treadmill-item-column-${((index % 3) % 2) + 1}`;

      assert.dom(node).hasClass(expected);
    });

    this.set('minColumnWidth', '20%');

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `ella-treadmill-item-column-${((index % 5) % 2) + 1}`;

      assert.dom(node).hasClass(expected);
    });

    this.set('fluctuateColumn', 3);

    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `ella-treadmill-item-column-${((index % 5) % 3) + 1}`;

      assert.dom(node).hasClass(expected);
    });
  });
});
