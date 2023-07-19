import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | ella treadmill item', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) =>
      this.actions[actionName].apply(this, args);
  });

  test('it renders', async function (assert) {
    assert.expect(2);

    await render(hbs`<EllaTreadmillItem />`);

    assert.strictEqual(
      document.querySelectorAll('ella-treadmill-item').length,
      1
    );

    await render(hbs`
      <EllaTreadmillItem>
        I am a block.
      </EllaTreadmillItem>
    `);

    const element = document.querySelector('ella-treadmill-item');

    assert.strictEqual(element.innerText, 'I am a block.');
  });

  test('it has the aria role of "listitem"', async function (assert) {
    assert.expect(1);

    await render(hbs`<EllaTreadmillItem />`);

    const element = document.querySelector('ella-treadmill-item');

    assert.strictEqual(element.attributes.role.value, 'listitem');
  });

  test('it has default dimensions and position', async function (assert) {
    assert.expect(4);

    await render(hbs`
      <div id="measurement" style={{html-safe "height: 0; width: 100%;"}}>&nbsp;</div>
      <EllaTreadmillItem />
    `);

    const comparison = document
      .getElementById('measurement')
      .getBoundingClientRect();
    const geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(geometry.width, comparison.width);
    assert.strictEqual(geometry.height, comparison.height);
    assert.strictEqual(geometry.top, comparison.top);
    assert.strictEqual(geometry.left, comparison.left);
  });

  test('its dimensions can be modified', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <div id="measurement" style={{html-safe "height: 50px; width: 50%;"}}>&nbsp;</div>
      <EllaTreadmillItem @height="50" @columns="2" />
    `);

    const comparison = document
      .getElementById('measurement')
      .getBoundingClientRect();
    const geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(geometry.width, comparison.width);
    assert.strictEqual(geometry.height, comparison.height);
  });

  test('it has a default "index" of -1', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <div id="measurement" style={{html-safe "height: 50px; width: 100%; position: absolute; top: 0; left: 0;"}}>&nbsp;</div>
      <EllaTreadmillItem @height="50" />
    `);

    const comparison = document
      .getElementById('measurement')
      .getBoundingClientRect();
    const geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(geometry.top, comparison.top + -1 * comparison.height);
    assert.strictEqual(geometry.left, comparison.left);
  });

  test('it computes a new top position when provided a numeric "index"', async function (assert) {
    assert.expect(2);

    this.set('index', 4);

    await render(hbs`
      <div id="measurement" style={{html-safe "height: 50px; width: 100%; position: absolute; top: 0; left: 0;"}}>&nbsp;</div>
      <EllaTreadmillItem @height="50" @index={{this.index}} />
    `);

    let comparison = document
      .getElementById('measurement')
      .getBoundingClientRect();
    let geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(
      Math.round(geometry.top),
      Math.round(comparison.top + this.index * comparison.height)
    );

    this.set('index', 17);

    comparison = document.getElementById('measurement').getBoundingClientRect();
    geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(
      Math.round(geometry.top),
      Math.round(comparison.top + this.index * comparison.height)
    );
  });

  test('it triggers an "on-insert" action when added to the DOM', async function (assert) {
    assert.expect(1);

    let actionTriggered = null;

    this.addedToDOM = function (item) {
      actionTriggered = item;
    };

    await render(hbs`
      <EllaTreadmillItem @height="50" @on-insert={{this.addedToDOM}} />
    `);

    const element = document.querySelector('ella-treadmill-item');

    assert.strictEqual(actionTriggered.element, element);
  });

  test('it triggers an "on-destroy" action before removed from the DOM', async function (assert) {
    assert.expect(2);

    let actionTriggered = false;

    this.set('showTest', true);
    this.aboutToDestroy = function () {
      actionTriggered = true;
    };

    await render(hbs`
      {{#if this.showTest}}
        <EllaTreadmillItem @height="50" @on-destroy={{this.aboutToDestroy}} />
      {{/if}}
    `);

    assert.false(actionTriggered);

    run(() => {
      this.set('showTest', false);
    });

    assert.ok(actionTriggered);
  });

  test('it triggers an "on-update" action when re-rendered (if it is the sample item)', async function (assert) {
    assert.expect(1);

    this.set('height', 50);
    this.set('isSampleItem', false); // Typically a computed property
    this.updateHandler = function () {
      assert.ok(true);
    };

    await render(hbs`
      <EllaTreadmillItem @height={{this.height}} @isSampleItem={{this.isSampleItem}} @on-update={{this.updateHandler}} />
    `);

    run(() => {
      this.set('height', 51);
    });

    run(() => {
      this.set('isSampleItem', true);
      this.set('height', 52);
    });
  });

  test('its position changes when the columns and pageSize attributes are set', async function (assert) {
    assert.expect(3);

    this.set('columns', 4);
    this.set('pageSize', 4);
    this.set('index', 6);

    await render(hbs`
      <div id="measurement" style={{html-safe "height: 50px; width: 100%; position: absolute; top: 0; left: 0;"}}>&nbsp;</div>
      <EllaTreadmillItem @height="50" @index={{this.index}} @columns={{this.columns}} @pageSize={{this.pageSize}} />
    `);

    let comparison = document
      .getElementById('measurement')
      .getBoundingClientRect();
    let geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(geometry.top, comparison.top + 1 * comparison.height);

    this.set('columns', 2);
    this.set('pageSize', 2);

    comparison = document.getElementById('measurement').getBoundingClientRect();
    geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(geometry.top, comparison.top + 3 * comparison.height);

    this.set('columns', 5);
    this.set('pageSize', 5);

    comparison = document.getElementById('measurement').getBoundingClientRect();
    geometry = document
      .querySelector('ella-treadmill-item')
      .getBoundingClientRect();

    assert.strictEqual(geometry.top, comparison.top + 1 * comparison.height);
  });

  test('it adds a class name to indicate row membership', async function (assert) {
    assert.expect(18);

    this.set('fluctuate', 2);
    this.set('columns', 1);
    this.set('index', 0);

    await render(hbs`
      <EllaTreadmillItem @fluctuate={{this.fluctuate}} @columns={{this.columns}} @index={{this.index}} />
    `);

    for (let i = 0; i < 6; ++i) {
      const query = `ella-treadmill-item.ella-treadmill-item-row-${
        (i % 2) + 1
      }`;

      this.set('index', i);

      assert.ok(document.querySelector(query));
    }

    this.set('fluctuate', 4);

    for (let i = 0; i < 6; ++i) {
      const query = `ella-treadmill-item.ella-treadmill-item-row-${
        (i % 4) + 1
      }`;

      this.set('index', i);

      assert.ok(document.querySelector(query));
    }

    this.set('columns', 3);

    for (let i = 0; i < 6; ++i) {
      this.set('index', i);

      const query =
        i < 3
          ? 'ella-treadmill-item.ella-treadmill-item-row-1'
          : 'ella-treadmill-item.ella-treadmill-item-row-2';

      assert.ok(document.querySelector(query));
    }
  });

  test('it adds a class name to indicate column membership', async function (assert) {
    assert.expect(12);

    this.set('columns', 5);
    this.set('index', 0);
    this.set('fluctuateColumn', 2);

    await render(hbs`
      <EllaTreadmillItem @columns={{this.columns}} @index={{this.index}} @fluctuateColumn={{this.fluctuateColumn}} />
    `);

    for (let i = 0; i < 6; ++i) {
      const query = `ella-treadmill-item.ella-treadmill-item-column-${
        (i % 2) + 1
      }`;

      this.set('index', i);

      const selector =
        i < 5 ? query : 'ella-treadmill-item.ella-treadmill-item-column-1';

      assert.ok(document.querySelector(selector));
    }

    this.set('fluctuateColumn', 4);

    for (let i = 0; i < 6; ++i) {
      const query = `ella-treadmill-item.ella-treadmill-item-column-${
        (i % 4) + 1
      }`;

      this.set('index', i);

      const selector =
        i < 5 ? query : 'ella-treadmill-item.ella-treadmill-item-column-1';

      assert.ok(document.querySelector(selector));
    }
  });
});
