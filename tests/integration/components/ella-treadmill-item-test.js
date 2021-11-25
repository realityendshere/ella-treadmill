import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { get } from '@ember/object';
import { run } from '@ember/runloop';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | ella treadmill item', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('it renders', async function(assert) {
    await render(hbs`<EllaTreadmillItem />`);

    assert.equal(document.querySelectorAll('ella-treadmill-item').length, 1);

    await render(hbs`
      <EllaTreadmillItem>
        I am a block.
      </EllaTreadmillItem>
    `);

    let element = document.querySelector('ella-treadmill-item');

    assert.equal(element.innerText, 'I am a block.');
  });

  test('it has the aria role of "listitem"', async function(assert) {
    await render(hbs`<EllaTreadmillItem />`);

    let element = document.querySelector('ella-treadmill-item');

    assert.equal(element.attributes.role.value, 'listitem');
  });

  test('it has default dimensions and position', async function(assert) {
    await render(hbs`
      <div id="measurement" style="height: 0; width: 100%;">&nbsp;</div>
      <EllaTreadmillItem />
    `);

    let comparison = document.getElementById('measurement').getBoundingClientRect();
    let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

    assert.equal(geometry.width, comparison.width);
    assert.equal(geometry.height, comparison.height);
    assert.equal(geometry.top, comparison.top);
    assert.equal(geometry.left, comparison.left);
  });

  test('its dimensions can be modified', async function(assert) {
    await render(hbs`
      <div id="measurement" style="height: 50px; width: 50%;">&nbsp;</div>
      <EllaTreadmillItem @height="50" @heightUnit="px" @columns="2" />
    `);

    let comparison = document.getElementById('measurement').getBoundingClientRect();
    let geometry = document.querySelector('.ella-treadmill-item').getBoundingClientRect();

    assert.equal(geometry.width, comparison.width);
    assert.equal(geometry.height, comparison.height);
  });

  test('it has a default "index" of -1', async function(assert) {
    await render(hbs`
      <div id="measurement" style="height: 50px; width: 100%; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <EllaTreadmillItem @height="50" />
    `);

    let comparison = document.getElementById('measurement').getBoundingClientRect();
    let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

    assert.equal(geometry.top, comparison.top + (-1 * comparison.height));
    assert.equal(geometry.left, comparison.left);
  });

  test('it computes a new top position when provided a numeric "index"', async function(assert) {
    this.set('index', 4);

    await render(hbs`
      <div id="measurement" style="height: 50px; width: 100%; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <EllaTreadmillItem @height="50" @index={{index}} />
    `);

    let comparison = document.getElementById('measurement').getBoundingClientRect();
    let geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

    assert.equal(
      Math.round(geometry.top),
      Math.round(comparison.top + (this.index * comparison.height))
    );

    this.set('index', 17);

    comparison = document.getElementById('measurement').getBoundingClientRect();
    geometry = document.querySelector('ella-treadmill-item').getBoundingClientRect();

    assert.equal(
      Math.round(geometry.top),
      Math.round(comparison.top + (this.index * comparison.height))
    );
  });

  test('it triggers an "on-insert" action when added to the DOM', async function(assert) {
    let actionTriggered = null;

    this.actions.addedToDOM = function(item) {
      actionTriggered = item;
    };

    await render(hbs`
      <EllaTreadmillItem @height="50" @on-insert={{action "addedToDOM"}} />
    `);

    let element = document.querySelector('ella-treadmill-item');

    assert.equal(get(actionTriggered, 'element'), element);
  });

  test('it triggers an "on-destroy" action before removed from the DOM', async function(assert) {
    let actionTriggered = false;

    this.set('showTest', true);
    this.actions.aboutToDestroy = function() {
      actionTriggered = true;
    };

    await render(hbs`
      {{#if showTest}}
        <EllaTreadmillItem @height="50" @on-destroy={{action "aboutToDestroy"}} />
      {{/if}}
    `);

    assert.equal(actionTriggered, false);

    run(() => {
      this.set('showTest', false);
    });

    assert.ok(actionTriggered);
  });

  test('it triggers an "on-update" action when re-rendered (if it is the sample item)', async function(assert) {
    let actionTriggered = false;

    this.set('height', 50);
    this.set('isSampleItem', false); // Typically a computed property
    this.actions.updateHandler = function(geometry) {
      actionTriggered = geometry;
    };

    await render(hbs`
      <EllaTreadmillItem @height={{height}} @isSampleItem={{isSampleItem}} @on-update={{action "updateHandler"}} />
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

  test('its position changes when the columns and pageSize attributes are set', async function(assert) {
    this.set('columns', 4);
    this.set('pageSize', 4);
    this.set('index', 6);

    await render(hbs`
      <div id="measurement" style="height: 50px; width: 100%; position: absolute; top: 0; left: 0;">&nbsp;</div>
      <EllaTreadmillItem @height="50" @index={{index}} @columns={{columns}} @pageSize={{pageSize}} />
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

  test('it adds a class name to indicate row membership', async function(assert) {
    this.set('fluctuate', 2);
    this.set('columns', 1);
    this.set('index', 0);

    await render(hbs`
      <EllaTreadmillItem @fluctuate={{fluctuate}} @columns={{columns}} @index={{index}} />
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

  test('it adds a class name to indicate column membership', async function(assert) {
    this.set('columns', 5);
    this.set('index', 0);
    this.set('fluctuateColumn', 2);

    await render(hbs`
      <EllaTreadmillItem @columns={{columns}} @index={{index}} @fluctuateColumn={{fluctuateColumn}} />
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
});
