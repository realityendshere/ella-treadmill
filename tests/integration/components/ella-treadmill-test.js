/* eslint ember/named-functions-in-promises: 0 */

import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

moduleForComponent('ella-treadmill', 'Integration | Component | ella treadmill', {
  integration: true,

  beforeEach: function() {
    let testElement = document.getElementById('ember-testing');

    testElement.style.overflow = 'auto';
  }
});

const { run, A } = Ember;
// const { getComputedStyle } = window;

const DEFAULT_HEIGHT = 50;

let range = function(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

const ONE_ITEM_ARRAY = range(1, 1);
const LARGE_ARRAY = range(1, 10000);

test('it renders', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  assert.equal(document.querySelectorAll('ella-treadmill').length, 1, 'tag name is ella-treadmill');
  assert.equal(document.querySelectorAll('.ella-treadmill').length, 1, 'has class "ella-treadmill"');
  assert.equal(document.querySelectorAll('.not-resizing').length, 1, 'has class "not-resizing"');
  assert.equal(document.querySelectorAll('.not-scrolling').length, 1, 'has class "not-scrolling"');
});

test('it has an ARIA role of "list"', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.attributes.role.value, 'list');
});

test('it has a "data-visible-items" attribute', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.attributes['data-visible-items'].value, '0');
});

test('it has a "data-first-visible-index" attribute', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.attributes['data-first-visible-index'].value, '0');
});

test('it has a "data-scroll-delta" attribute', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  let element = document.querySelector('ella-treadmill');

  assert.ok(element.attributes['data-scroll-delta'].value);
});

test('it has a "data-scroll-top" attribute', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.attributes['data-scroll-top'].value, '0');
});

test('it does not set a height property when no content provided', function(assert) {
  this.render(hbs`{{ella-treadmill}}`);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.clientHeight, 0);
});

test('it renders an inverse block when no content to display', function(assert) {
  this.set('model', []);

  this.render(hbs`
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

test('it renders with a default row height', function(assert) {
  let model = A(range(1, 1));

  this.set('model', model);

  this.render(hbs`{{ella-treadmill content=model}}`);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.clientHeight, DEFAULT_HEIGHT, 'height multiplies by 1');

  run(() => {
    this.get('model').pushObject('b');
  });

  assert.equal(element.clientHeight, DEFAULT_HEIGHT * 2, 'height multiplies by 2');

  this.set('model', LARGE_ARRAY);

  assert.equal(
    element.clientHeight,
    DEFAULT_HEIGHT * LARGE_ARRAY.length,
    'height multiplies content length'
  );
});

test('it renders with a default width of 100%', function(assert) {
  this.set('model', ONE_ITEM_ARRAY);

  this.render(hbs`
    {{ella-treadmill content=model}}
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

test('it renders with a custom row height (in px)', function(assert) {
  let rowHeight = 24;

  this.set('model', ONE_ITEM_ARRAY);
  this.set('rowHeight', rowHeight);

  this.render(hbs`
    {{ella-treadmill row=rowHeight content=model}}
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

test('it renders with a custom row height unit (rem)', function(assert) {
  this.set('model', LARGE_ARRAY);
  this.set('expectedHeight', (LARGE_ARRAY.length * 5.35) + 'rem');

  this.render(hbs`
    {{ella-treadmill row='5.35rem' content=model}}
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

test('it renders with a custom row height unit (%)', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="height: 500px; overflow: auto;">
      {{ella-treadmill row='20%' content=model}}
    </div>
  `);

  let element = document.querySelector('ella-treadmill');

  assert.equal(element.clientHeight, 100 * LARGE_ARRAY.length);
});

test('it renders enough list items to fill the available vertical space (default px)', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = (10 * DEFAULT_HEIGHT) + 'px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`{{ella-treadmill content=model}}`);

  let element = document.querySelector('ella-treadmill');
  let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
  let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

  assert.equal(itemCount, itemCountAttr, 'rendered item count matches attribute value');
  assert.equal(itemCount, 11, 'enough rows rendered to fill 500px height');

  run(() => {
    testElement.style.height = (16.7 * DEFAULT_HEIGHT) + 'px';
  });

  return wait().then(() => {
    let itemCountAttr = element.attributes['data-visible-items'].value;
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, 18, 'enough rows rendered to fill 835px height');
    assert.equal(itemCount, itemCountAttr, 'rendered item count (still) matches attribute value');
  });
});

test('it renders enough list items to fill the available vertical space (dynamic px)', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '600px';

  this.set('model', LARGE_ARRAY);
  this.set('rowHeight', 30);

  this.render(hbs`{{ella-treadmill row=rowHeight content=model}}`);

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

test('it renders enough list items to fill the available vertical space (em)', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{ella-treadmill row='2.35em' content=model}}
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

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.ok(itemCount > Math.ceil(600 / expected.clientHeight));
    assert.ok(itemCount < Math.ceil(600 / expected.clientHeight) + 3);
    assert.equal(itemCount, itemCountAttr);
  });
});

test('it renders enough list items to fill the available vertical space (rem)', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{ella-treadmill row='3.1rem' content=model}}
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

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.ok(itemCount > Math.ceil(600 / expected.clientHeight));
    assert.ok(itemCount < Math.ceil(600 / expected.clientHeight) + 3);
    assert.equal(itemCount, itemCountAttr);
  });
});

test('it renders enough list items to fill the available vertical space (%)', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{ella-treadmill row='20%' content=model}}
  `);

  let element = document.querySelector('ella-treadmill');
  let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
  let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

  assert.equal(itemCount, 6);
  assert.equal(itemCount, itemCountAttr);

  run(() => {
    testElement.style.height = '600px';
  });

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
    let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

    assert.equal(itemCount, 6);
    assert.equal(itemCount, itemCountAttr);
  });
});

test('it renders fewer list items when content fits in visible space', function(assert) {
  this.set('model', ONE_ITEM_ARRAY);

  this.render(hbs`{{ella-treadmill content=model}}`);

  let element = document.querySelector('ella-treadmill');
  let itemCountAttr = parseInt(element.attributes['data-visible-items'].value, 10);
  let itemCount = document.querySelectorAll('ella-treadmill > ella-treadmill-item').length;

  assert.equal(itemCountAttr, 1, 'renders only enough children to show single item');
  assert.equal(itemCount, itemCountAttr);
});

test('it adds an "is-resizing" class while resizing', function(assert) {
  let testElement = document.getElementById('ember-testing');

  this.render(hbs`{{ella-treadmill}}`);

  run(() => {
    testElement.style.height = '600px';
    testElement.style.height = '620px';
  });

  run.later(() => {
    assert.ok(document.querySelector('ella-treadmill.is-resizing'), 'adds class for event');
  }, 20);

  return wait().then(() => {
    assert.ok(document.querySelector('ella-treadmill.not-resizing'), 'removes class when events stop');
  });
});

test('it triggers an "on-resize-start" action', function(assert) {
  let testElement = document.getElementById('ember-testing');
  let actionTriggered = 0;

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.on('handleResizeStart', function() {
    actionTriggered = actionTriggered + 1;
  });

  this.render(hbs`{{ella-treadmill row=100 content=model on-resize-start=(action "handleResizeStart")}}`);

  assert.equal(actionTriggered, 0, 'action not yet called');

  run(() => {
    testElement.style.height = '600px';
    testElement.style.height = '620px';
    testElement.style.height = '610px';
  });

  return wait().then(() => {
    assert.equal(actionTriggered, 1, 'action called just once');
  });
});

test('it triggers an "on-resize-end" action', function(assert) {
  let testElement = document.getElementById('ember-testing');
  let actionTriggered = false;

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.on('handleResizeEnd', function() {
    actionTriggered = true;
  });

  this.render(hbs`{{ella-treadmill row=100 content=model on-resize-end=(action "handleResizeEnd")}}`);

  assert.equal(actionTriggered, false, 'action not yet called');

  run(() => {
    testElement.style.height = '600px';
    testElement.style.height = '620px';
  });

  return wait().then(() => {
    assert.ok(actionTriggered, 'action called');
  });
});

test('its "data-first-visible-index" updates when columns', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`{{ella-treadmill content=model row='100px' minColumnWidth='100px'}}`);

  let element = document.querySelector('ella-treadmill');

  run(() => {
    testElement.scrollTop = 3000;
    testElement.style.width = '1000px';
  });

  return wait().then(() => {
    assert.equal(element.attributes['data-first-visible-index'].value, '300');
  });
});

test('"anchor=false" allows updates to the first visible index on resize', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`{{ella-treadmill content=model row='100px' minColumnWidth='100px' anchor=false}}`);

  let element = document.querySelector('ella-treadmill');

  run(() => {
    testElement.scrollTop = 3000;
    testElement.style.width = '1000px';
  });

  run.later(() => {
    testElement.style.width = '500px';
  }, 21);

  return wait().then(() => {
    assert.equal(element.attributes['data-first-visible-index'].value, '150');
  });
});

test('"anchor=true" prevents updates to the first visible index on resize', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`{{ella-treadmill content=model row='100px' minColumnWidth='100px' anchor=true}}`);

  let element = document.querySelector('ella-treadmill');

  run(() => {
    testElement.scrollTop = 3000;
    testElement.style.width = '1000px';
  });

  run.later(() => {
    testElement.style.width = '500px';
  }, 21);

  return wait().then(() => {
    assert.equal(element.attributes['data-first-visible-index'].value, '300');
  });
});

test('it adds an "is-scrolling" class while scrolling', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`{{ella-treadmill row=100 content=model}}`);

  run(() => {
    testElement.scrollTop = 100;
    testElement.scrollTop = 101;
    testElement.scrollTop = 102;
    testElement.scrollTop = 103;
    testElement.scrollTop = 104;
    testElement.scrollTop = 105;
  });

  run.later(() => {
    assert.ok(document.querySelector('ella-treadmill.is-scrolling'), 'adds class for event');
  }, 20);

  return wait().then(() => {
    assert.ok(document.querySelector('ella-treadmill.not-scrolling'), 'removes class when events stop');
  });
});

test('it triggers an "on-scroll-start" action', function(assert) {
  let testElement = document.getElementById('ember-testing');
  let actionTriggered = 0;

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);
  this.on('handleScrollStart', function() {
    actionTriggered = actionTriggered + 1;
  });

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      {{ella-treadmill row=100 content=model on-scroll-start=(action "handleScrollStart")}}
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

  return wait().then(() => {
    assert.equal(actionTriggered, 1, 'action called just once');
  });
});

test('it triggers an "on-scroll-end" action', function(assert) {
  let testElement = document.getElementById('ember-testing');
  let actionTriggered = false;

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);
  this.on('handleScrollEnd', function(props) {
    actionTriggered = props;
  });

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      {{ella-treadmill row=100 content=model on-scroll-end=(action "handleScrollEnd")}}
    </div>
  `);

  assert.equal(actionTriggered, false, 'action not yet called');

  run(() => {
    document.getElementById('scroller').scrollTop = 100;
  });

  return wait().then(() => {
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

test('it triggers "on-scroll" action', function(assert) {
  let testElement = document.getElementById('ember-testing');
  let actionTriggered = false;

  testElement.style.height = '600px';

  this.set('model', LARGE_ARRAY);

  this.on('handleListingStateChanged', function(props) {
    actionTriggered = props;
  });

  this.render(hbs`
    <div id="bumper" style="height: 300px;">&nbsp;</div>
    {{ella-treadmill row=100 content=model on-scroll=(action "handleListingStateChanged")}}
  `);

  assert.equal(actionTriggered, false, 'action not yet called');

  run(() => {
    testElement.scrollTop = 30010;
  });

  return wait().then(() => {
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

test('it triggers "on-resize" action', function(assert) {
  let testElement = document.getElementById('ember-testing');
  let actionTriggered = false;

  testElement.style.height = '600px';

  this.set('model', LARGE_ARRAY);

  this.on('handleListingStateChanged', function(props) {
    actionTriggered = props;
  });

  this.render(hbs`
    {{ella-treadmill row=100 content=model on-resize=(action "handleListingStateChanged")}}
  `);

  assert.equal(actionTriggered, false, 'action not yet called');

  run(() => {
    testElement.style.height = '1200px';
  });

  return wait().then(() => {
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

test('it updates the data-scroll-top attribute', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      {{ella-treadmill row=100 content=model}}
    </div>
  `);

  run(() => {
    document.getElementById('scroller').scrollTop = 100;
  });

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-scroll-top'].value;

    assert.equal(attr, '100');
  });
});

test('it updates the data-scroll-delta attribute', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      {{ella-treadmill row=100 content=model}}
    </div>
    <div id="measurement" style="height: 100px;">&nbsp;</div>
  `);

  let element = document.querySelector('ella-treadmill');
  let attr = element.attributes['data-scroll-delta'].value;

  assert.equal(attr, '0', 'starts at 0');

  run(() => {
    document.getElementById('scroller').scrollTop = 100;
  });

  return wait().then(() => {
    let testHeight = document.getElementById('measurement').getBoundingClientRect().height;

    attr = element.attributes['data-scroll-delta'].value;
    assert.equal(attr, `${testHeight}`);
  });
});

test('its data-scroll-delta attribute can be a negative number', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      <div id="bumper" style="height: 300px;">&nbsp;</div>
      {{ella-treadmill row=100 content=model}}
    </div>
    <div id="measurement" style="height: 100px;">&nbsp;</div>
  `);

  let element = document.querySelector('ella-treadmill');
  let attr = element.attributes['data-scroll-delta'].value;
  let testHeight = document.getElementById('measurement').getBoundingClientRect().height;

  assert.equal(Math.round(parseFloat(attr, 10)), testHeight * -3, 'starts at -300');

  run(() => {
    document.getElementById('scroller').scrollTop = 1000;
  });

  return wait().then(() => {
    attr = element.attributes['data-scroll-delta'].value;
    assert.equal(Math.round(parseFloat(attr, 10)), testHeight * 7);
  });
});

test('its data-first-visible-index attribute updates on scroll', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      {{ella-treadmill row=100 content=model}}
    </div>
  `);

  run(() => {
    document.getElementById('scroller').scrollTop = 30010;
  });

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-first-visible-index'].value;

    assert.equal(attr, '300');
  });
});

test('its data-first-visible-index attribute updates on scroll when below other content', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      <div id="bumper" style="height: 300px;">&nbsp;</div>
      {{ella-treadmill row=100 content=model}}
    </div>
  `);

  run(() => {
    document.getElementById('scroller').scrollTop = 30010;
  });

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-first-visible-index'].value;

    assert.equal(attr, '297');
  });
});

test('it displays the correct content item in each listing', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{ella-treadmill row=100 content=model}}
  `);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `${index + 1}`;

    assert.equal(node.innerText, expected);
  });
});

test('it displays the correct content item in each listing (block usage)', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '500px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{#ella-treadmill row=100 content=model as |item index|}}
      [{{{index}}}]: I am item #{{item}}
    {{/ella-treadmill}}
  `);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `[${index}]: I am item #${index + 1}`;

    assert.equal(node.innerText, expected);
  });
});

test('it displays the correct content item in each listing when rendered below other content', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      <div id="bumper" style="height: 300px;">&nbsp;</div>
      {{ella-treadmill row=100 content=model}}
    </div>
  `);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `${index + 1}`;

    assert.equal(node.innerText, expected);
  });
});

test('it updates the content in each listing on scroll', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      {{ella-treadmill row=100 content=model}}
    </div>
  `);

  run(() => {
    document.getElementById('scroller').scrollTop = 1310;
  });

  return wait().then(() => {
    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index, list) => {
      let expected = (index) >= 1 ? `${index + 1 + (2 * list.length)}` : `${index + 1 + (3 * list.length)}`;

      assert.equal(node.innerText, expected);
    });
  });
});

test('it does not update the content in each listing until items scroll out of view', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 500px;" id="scroller">
      <div id="bumper" style="height: 300px;">&nbsp;</div>
      {{ella-treadmill row=100 content=model}}
    </div>
  `);

  run(() => {
    document.getElementById('scroller').scrollTop = 300;
  });

  return wait().then(() => {
    document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
      let expected = `${index + 1}`;

      assert.equal(node.innerText, expected);
    });
  });
});

test('it updates the content in each listing on scroll after items scroll out of view', function(assert) {
  let scrollPx = 65350;
  let rowHeight = 72;

  this.set('model', LARGE_ARRAY);
  this.set('rowHeight', rowHeight);

  this.render(hbs`
    <div style="overflow: auto; height: 768px;" id="scroller">
      <div id="bumper" style="height: 300px;">&nbsp;</div>
      {{ella-treadmill row=rowHeight content=model}}
    </div>
  `);

  run(() => {
    document.getElementById('scroller').scrollTop = scrollPx;
  });

  return wait().then(() => {
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

test('it has an "overdraw" attribute that enables a few extra items to be rendered', function(assert) {
  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div style="overflow: auto; height: 600px;" id="scroller">
      {{ella-treadmill row=30 overdraw=overdraw content=model}}
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

  return wait().then(() => {
    let element = document.querySelector('ella-treadmill');
    let attr = element.attributes['data-first-visible-index'].value;

    assert.equal(attr, '280', 'the starting index accounts for overdraw');
  });
});

test('it renders items in a grid when "minColumnWidth" set as percentage', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '600px';
  testElement.style.width = '600px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{ella-treadmill row=60 minColumnWidth='33%' content=model}}
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
    testElement.style.width = '1200px';
  });

  return wait().then(() => {
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

test('it renders items in a grid when "minColumnWidth" set in pixels', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '600px';
  testElement.style.width = '600px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    {{ella-treadmill row=60 minColumnWidth='180px' content=model}}
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

  return wait().then(() => {
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

test('it repositions grid items after scroll', function(assert) {
  let testElement = document.getElementById('ember-testing');

  testElement.style.height = '900px';
  testElement.style.width = '900px';

  this.set('model', LARGE_ARRAY);

  this.render(hbs`
    <div id="bumper" style="height: 372px;">&nbsp;</div>
    {{ella-treadmill row=150 minColumnWidth='300px' content=model}}
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

  return wait().then(() => {
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

test('it renders items with a class name that indicates row membership', function(assert) {
  this.set('model', LARGE_ARRAY);
  this.set('fluctuate', 2);
  this.set('minColumnWidth', '100%');

  this.render(hbs`
    {{ella-treadmill fluctuate=fluctuate minColumnWidth=minColumnWidth content=model}}
  `);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `ella-treadmill-item-row-${(index % 2) + 1}`;

    assert.ok(node.classList.contains(expected));
  });

  this.set('fluctuate', 5);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `ella-treadmill-item-row-${(index % 5) + 1}`;

    assert.ok(node.classList.contains(expected));
  });

  this.set('minColumnWidth', '25%');

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    if (index < 4) {
      assert.ok(node.classList.contains('ella-treadmill-item-row-1'));
    } else if (index === 4) {
      assert.ok(node.classList.contains('ella-treadmill-item-row-2'));
    }
  });
});

test('it renders items with a class name that indicates column membership', function(assert) {
  this.set('model', LARGE_ARRAY);
  this.set('fluctuateColumn', 2);
  this.set('minColumnWidth', '33%');

  this.render(hbs`
    {{ella-treadmill fluctuateColumn=fluctuateColumn minColumnWidth=minColumnWidth content=model}}
  `);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `ella-treadmill-item-column-${((index % 3) % 2) + 1}`;

    assert.ok(node.classList.contains(expected));
  });

  this.set('minColumnWidth', '20%');

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `ella-treadmill-item-column-${((index % 5) % 2) + 1}`;

    assert.ok(node.classList.contains(expected));
  });

  this.set('fluctuateColumn', 3);

  document.querySelectorAll('ella-treadmill > ella-treadmill-item').forEach((node, index) => {
    let expected = `ella-treadmill-item-column-${((index % 5) % 3) + 1}`;

    assert.ok(node.classList.contains(expected));
  });
});
