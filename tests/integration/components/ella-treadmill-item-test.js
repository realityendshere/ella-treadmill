import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';

const { get, run } = Ember;

moduleForComponent('ella-treadmill-item', 'Integration | Component | ella treadmill item', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{ella-treadmill-item}}`);

  assert.equal(document.querySelectorAll('ella-treadmill-item').length, 1);

  this.render(hbs`
    {{#ella-treadmill-item}}
      I am a block.
    {{/ella-treadmill-item}}
  `);

  let element = document.querySelector('ella-treadmill-item');

  assert.equal(element.innerText, 'I am a block.');
});

test('it has the aria role of "listitem"', function(assert) {
  this.render(hbs`{{ella-treadmill-item}}`);

  let element = document.querySelector('ella-treadmill-item');

  assert.equal(element.attributes.role.value, 'listitem');
});

test('it has default dimensions and position', function(assert) {
  this.render(hbs`
    <div id="measurement" style="height: 0; width: 100%;">&nbsp;</div>
    {{ella-treadmill-item}}
  `);

  let comparison = document.getElementById('measurement').getBoundingClientRect();
  let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.width, comparison.width);
  assert.equal(geometry.height, comparison.height);
  assert.equal(geometry.top, comparison.top);
  assert.equal(geometry.left, comparison.left);
});

test('its dimensions can be modified', function(assert) {
  this.render(hbs`
    <div id="measurement" style="height: 50px; width: 50%;">&nbsp;</div>
    {{ella-treadmill-item height=50 width=50}}
  `);

  let comparison = document.getElementById('measurement').getBoundingClientRect();
  let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.width, comparison.width);
  assert.equal(geometry.height, comparison.height);
});

test('it has a default "index" of -1', function(assert) {
  this.render(hbs`
    <div id="measurement" style="height: 50px; width: 100%; position: absolute; top: 0; left: 0;">&nbsp;</div>
    {{ella-treadmill-item height=50 width=50}}
  `);

  let comparison = document.getElementById('measurement').getBoundingClientRect();
  let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.top, comparison.top + (-1 * comparison.height));
  assert.equal(geometry.left, comparison.left);
});

test('it computes a new top position when provided a numeric "index"', function(assert) {
  this.set('index', 4);

  this.render(hbs`
    <div id="measurement" style="height: 50px; width: 100%; position: absolute; top: 0; left: 0;">&nbsp;</div>
    {{ella-treadmill-item height=50 index=index}}
  `);

  let comparison = document.getElementById('measurement').getBoundingClientRect();
  let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.top, comparison.top + (this.get('index') * comparison.height));

  this.set('index', 17);

  comparison = document.getElementById('measurement').getBoundingClientRect();
  geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.top, comparison.top + (this.get('index') * comparison.height));
});

test('it triggers an "on-insert" action when added to the DOM', function(assert) {
  let actionTriggered = null;

  this.on('addedToDOM', function(item) {
    actionTriggered = item;
  });

  this.render(hbs`
    {{ella-treadmill-item height=50 on-insert=(action "addedToDOM")}}
  `);

  let element = document.querySelector('ella-treadmill-item');

  assert.equal(get(actionTriggered, 'element'), element);
});

test('it triggers an "on-destroy" action before removed from the DOM', function(assert) {
  let actionTriggered = false;

  this.set('showTest', true);
  this.on('aboutToDestroy', function() {
    actionTriggered = true;
  });

  this.render(hbs`
    {{#if showTest}}
      {{ella-treadmill-item height=50 on-destroy=(action "aboutToDestroy")}}
    {{/if}}
  `);

  assert.equal(actionTriggered, false);

  run(() => {
    this.set('showTest', false);
  });

  assert.ok(actionTriggered);
});

test('it triggers an "on-update" action when re-rendered (if it is the sample item)', function(assert) {
  let actionTriggered = false;

  this.set('height', 50);
  this.set('isSampleItem', false); // Typically a computed property
  this.on('updateHandler', function(geometry) {
    actionTriggered = geometry;
  });

  this.render(hbs`
    {{ella-treadmill-item height=height isSampleItem=isSampleItem on-update=(action "updateHandler")}}
  `);

  assert.equal(actionTriggered, false);

  run(() => {
    this.set('height', 51);
  });

  assert.equal(actionTriggered, false);

  run(() => {
    this.set('isSampleItem', true);
    this.set('height', 52);
  });

  assert.ok(actionTriggered);
});

test('its position changes when the columns and pageSize attributes are set', function(assert) {
  this.set('columns', 4);
  this.set('pageSize', 4);
  this.set('index', 6);

  this.render(hbs`
    <div id="measurement" style="height: 50px; width: 100%; position: absolute; top: 0; left: 0;">&nbsp;</div>
    {{ella-treadmill-item height=50 index=index columns=columns pageSize=pageSize}}
  `);

  let comparison = document.getElementById('measurement').getBoundingClientRect();
  let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.top, comparison.top + (1 * comparison.height));

  this.set('columns', 2);
  this.set('pageSize', 2);

  comparison = document.getElementById('measurement').getBoundingClientRect();
  geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.top, comparison.top + (3 * comparison.height));

  this.set('columns', 5);
  this.set('pageSize', 5);

  comparison = document.getElementById('measurement').getBoundingClientRect();
  geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

  assert.equal(geometry.top, comparison.top + (1 * comparison.height));
});

test('it adds a class name to indicate row membership', function(assert) {
  this.set('fluctuate', 2);
  this.set('columns', 1);
  this.set('index', 0);

  this.render(hbs`
    {{ella-treadmill-item fluctuate=fluctuate columns=columns index=index}}
  `);

  for (let i = 0; i < 6; ++i) {
    let query = `ella-treadmill-item.ella-treadmill-item-row-${(i % 2) + 1}`;

    this.set('index', i);

    assert.ok(document.querySelector(query));
  }

  this.set('fluctuate', 4);

  for (let i = 0; i < 6; ++i) {
    let query = `ella-treadmill-item.ella-treadmill-item-row-${(i % 4) + 1}`;

    this.set('index', i);

    assert.ok(document.querySelector(query));
  }

  this.set('columns', 3);

  for (let i = 0; i < 6; ++i) {
    this.set('index', i);

    if (i < 3) {
      assert.ok(document.querySelector('ella-treadmill-item.ella-treadmill-item-row-1'));
    } else {
      assert.ok(document.querySelector('ella-treadmill-item.ella-treadmill-item-row-2'));
    }
  }
});

test('it adds a class name to indicate column membership', function(assert) {
  this.set('columns', 5);
  this.set('index', 0);
  this.set('fluctuateColumn', 2);

  this.render(hbs`
    {{ella-treadmill-item columns=columns index=index fluctuateColumn=fluctuateColumn}}
  `);

  for (let i = 0; i < 6; ++i) {
    let query = `ella-treadmill-item.ella-treadmill-item-column-${(i % 2) + 1}`;

    this.set('index', i);

    if (i < 5) {
      assert.ok(document.querySelector(query));
    } else {
      assert.ok(document.querySelector('ella-treadmill-item.ella-treadmill-item-column-1'));
    }
  }

  this.set('fluctuateColumn', 4);

  for (let i = 0; i < 6; ++i) {
    let query = `ella-treadmill-item.ella-treadmill-item-column-${(i % 4) + 1}`;

    this.set('index', i);

    if (i < 5) {
      assert.ok(document.querySelector(query));
    } else {
      assert.ok(document.querySelector('ella-treadmill-item.ella-treadmill-item-column-1'));
    }
  }
});
