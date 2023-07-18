# Emberella Treadmill

Sometimes, your app may be required to display a long list of similar records.
But browsers aren't typically prepared to render hundreds or thousands of DOM
elements at the same time. That's where Emberella Treadmill comes in.

Provided an array of content, Emberella Treadmill renders the minimum number of
child listings to fill the visible portion of a scrolling area. As customers
scroll, these child listings are "recycled" (repositioned and redrawn with new
content) appropriately to create the illusion of a long, continuously scrolling
list.

For example, I have about 1,000 contacts in my address book. As I scroll, the
listing element with "Aaron" moves out of view above the scrolling area. That
element takes a new position below the scrolling area and updates to read
"Alex".

## Requirements

* Ember.js v4.4 or above
* Ember CLI v4.4 or above
* Node.js v16 or above

Passes all tests in the latest versions of Chrome, Firefox, and Safari
(macOS and iOS).

It uses "flexbox" and CSS transforms. Any browser that doesn't support those
features will likely not work correctly.

## Installation

As an Ember Addon, it's easy to get started with Emberella Treadmill.

### Ember CLI

From the root directory of your Ember project

```
$ ember install ember-ella-treadmill
```

### Plain NPM

From the root directory of your Ember project

```
$ npm install ember-ella-treadmill --save-dev
```

## Quickstart

At a minimum, Emberella Treadmill requires an array of content and something to
display for each item in the array. Assuming `model` is defined in the
controller as an array of 8,712 people profiles, the following would display a
listing of 8,712 names and email addresses 435,600 pixels tall (the default
listing height is `50px`).

```
{{#ella-treadmill content=model as |item|}}
  <p>{{item.name}}</p>
  <p>{{item.email}}</p>
{{/ella-treadmill}}
```

If content is set to an empty array, you may use an `{{else}}` block to display
custom messaging.

```
{{#ella-treadmill content=empty as |item|}}
  <p>{{item.name}}</p>
  <p>{{item.email}}</p>
{{else}}
  <div class="empty">Bummer. No search results for "Captain Gibberish"</div>
{{/ella-treadmill}}
```

### Options

Displaying a list of `50px` tall items is good. Applying custom row heights or
rendering listings in a grid format is even better. Emberella Treadmill offers a
few options for adjusting the size and position of listings.

#### fluctuate

Each item rendered by Emberella Treadmill will have a class name indicating
which row it belongs to. Typically, items will alternate between the class name
`ella-treadmill-item-row-1` and `ella-treadmill-item-row-2`. You can style these
classes to add horizontal "zebra striping" to your listings.

To adjust the frequency of class name reuse, set the `fluctuate` property to a
number other than `2`.

For example, the default value, `fluctuate: 2` would add class names to items as
follows:

* Row 1: `ella-treadmill-item-row-1`
* Row 2: `ella-treadmill-item-row-2`
* Row 3: `ella-treadmill-item-row-1`
* Row 4: `ella-treadmill-item-row-2`
* Row 5: `ella-treadmill-item-row-1`
* Row 6: `ella-treadmill-item-row-2`
* and so on...

Setting `fluctuate` to `4` would add class names to items as follows:

* Row 1: `ella-treadmill-item-row-1`
* Row 2: `ella-treadmill-item-row-2`
* Row 3: `ella-treadmill-item-row-3`
* Row 4: `ella-treadmill-item-row-4`
* Row 5: `ella-treadmill-item-row-1`
* Row 6: `ella-treadmill-item-row-2`
* and so on...

Every fourth row (1st, 5th, 9th, 13th, etc) will contain items with the class
name `ella-treadmill-item-row-1` in the following code example.

```
{{#ella-treadmill content=model fluctuate=4 as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### fluctuateColumn

Each item rendered by Emberella Treadmill will have a class name indicating
which column it belongs to. Typically, items will alternate between the class
name `ella-treadmill-item-column-1` and `ella-treadmill-item-column-2`. You can
style these classes to add vertical "zebra striping" to your listings.

To adjust the frequency of class name reuse, set the `fluctuateColumn` property
to a number other than `2`.

For example, the default value, `fluctuateColumn: 2` would add class names to
items as follows:

* Column 1: `ella-treadmill-item-column-1`
* Column 2: `ella-treadmill-item-column-2`
* Column 3: `ella-treadmill-item-column-1`
* Column 4: `ella-treadmill-item-column-2`
* Column 5: `ella-treadmill-item-column-1`
* Column 6: `ella-treadmill-item-column-2`
* and so on...

Setting `fluctuateColumn` to `3` would add class names to items as follows:

* Column 1: `ella-treadmill-item-column-1`
* Column 2: `ella-treadmill-item-column-2`
* Column 3: `ella-treadmill-item-column-3`
* Column 4: `ella-treadmill-item-column-1`
* Column 5: `ella-treadmill-item-column-2`
* Column 6: `ella-treadmill-item-column-3`
* and so on...

Every third column (1st, 4th, 7th, 10th, etc) will contain items with the
class name `ella-treadmill-item-column-1` in the following code example.

```
{{#ella-treadmill content=model fluctuateColumn=3 as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### minColumnWidth

If `minColumnWidth` is less than 50% of the Emberella Treadmill component
element's width, flexible columns will rendered to fill the available horizontal
space.

For example, if the component's rendered element is 600px wide and
`minColumnWidth: 180px`, `ella-treadmill` would place items into a grid with 3
columns of `200px` width. Resizing the viewport to allow the component's element
to be `720px` wide would rearrange the grid into four columns, each `180px`
wide.

The default behavior is to show a long list of items in a single column.
(`minColumnWidth: '100%'`)

Currently, minimum column widths can be set in `px` or `%`.

The following example uses a percentage for `minColumnWidth` to ensure 3 columns
are rendered even if the viewport is resized.

```
{{#ella-treadmill content=model minColumnWidth='33%' as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

Alternatively, setting `minColumnWidth` to a size in pixels ensures a dynamic
number of equally sized columns will be rendered to fill the available width of
the listing. Each listing will be no less than the specified number of pixels
wide.

```
{{#ella-treadmill content=model minColumnWidth='180px' as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### moveTo

The Emberella Treadmill will scroll to the item with the numeric index provided
to the `moveTo` property. For example, the following would scroll to the 300th
item in the list.

```
{{#ella-treadmill content=model moveTo=300 as |item| }}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### overdraw

Emberella Treadmill will typically render only enough rows to fill the currently
visible portion of the scrolling parent plus one additional row. Sometimes,
especially if data is fetched or computed asynchronously, perceived performance
can be improved by drawing a few additional rows above and below the visible
portion of the list. That way, data for these listings have an opportunity to be
fetched slightly before they scroll into view.

```
{{#ella-treadmill content=model overdraw=20 as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

In the above example, 20% more rows will be rendered above and below the visible
part of the listing. Therefore, if twenty items is enough to fill the viewport,
this `overdraw` value of `20` would render 8 additional items (four above the
viewable area and four below the viewable area). That's 20% more items in each
scrolling direction.

#### row

Specify the height of each listing.

The following example makes each listing `102px` tall.

```
{{#ella-treadmill content=model row=102 as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

The next example makes each listing `300px` tall.

```
{{#ella-treadmill content=model row='300px' as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

You may specify a percentage height. In this next code snippet, exactly 5 rows
will be visible on screen.

```
{{#ella-treadmill content=model row='20%' as |item|}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

You can also specify row height in `em`, `rem`, `vh`, or (in theory) any other
CSS unit of measure.

### Actions

Emberella Treadmill will send the following actions. All actions deliver the
current state of the component instance in the form of a plain Javascript
object.

```
actions: {
  handleSomeActionFromTreadmill(properties) {
    // Do something with the Treadmill's state
    // `properties` is a plain Javascript object in the following format:

    // {
    //   'scrollTop': 1078, // The parent scroll position
    //   'topDelta': 673,  // parent top - component top
    //   'startingIndex': 14, // which index is visually first (closest to top left)
    //   'numberOfVisibleItems': 12, // The number of rendered listings
    //   'visibleIndexes': [14, 15, 16, ... 23, 24, 25] // Array of currently visible indexes
    // }
  }
}
```

#### on-scroll-start

Triggered for the first in a series of `scroll` events.

```
{{#ella-treadmill
  content=model
  on-scroll-start=(action'handleSomeActionFromTreadmill') as |item|
}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### on-scroll

Triggered repeatedly as the scroll position changes.

```
{{#ella-treadmill
  content=model
  on-scroll=(action 'handleSomeActionFromTreadmill') as |item|
}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### on-scroll-end

Triggered whenever scrolling events have ceased for more than 50ms.

```
{{#ella-treadmill
  content=model
  on-scroll-end=(action'handleSomeActionFromTreadmill') as |item|
}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### on-resize-start

Triggered for the first in a series of `resize` events.

```
{{#ella-treadmill
  content=model
  on-resize-start=(action 'handleSomeActionFromTreadmill') as |item|
}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### on-resize

Triggered repeatedly as the component's element resizes.

```
{{#ella-treadmill
  content=model
  on-resize=(action 'handleSomeActionFromTreadmill') as |item|
}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

#### on-resize-end

Triggered whenever resizing events have ceased for more than 50ms.

```
{{#ella-treadmill
  content=model
  on-resize-end=(action 'handleSomeActionFromTreadmill') as |item|
}}
  <p>{{item.name}}</p>
{{/ella-treadmill}}
```

## But Why?

Pagination and "infinite scroll" can be painfully difficult to use.

Showing a large data set on pages of 25 items at a time is less than ideal. If I
have 547 pages of customer profiles to scan through, how do I jump to page 314?
What page is "Linda" on? What if I send someone a URL for page 3 and the record
I wanted her to see drifts to page 4?

While "infinite scroll" may work reasonably well for a social feed that
aggregates data produced by a multitude of other people, it isn't as suitable
for scanning through records of my own creation or members of a finite list.

That's where Emberella Treadmill comes in. It allows customers to skim through a
large list using the browser's native scrolling functionality. It doesn't
require learning a custom pagination UI or being forced to load batches of data
in sequential order.

It simply behaves like a scrolling list. Period.

## Contributing

If you use Ember CLI (and I hope you do), here are the standard instructions for
installing and modifying this addon for yourself or to pitch in with
enhancements or bugfixes.

### Installation

* `git clone http://github.com/realityendshere/ella-treadmill.git` this repository
* `cd ella-treadmill`
* `npm install` (or `yarn install`)

### Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `yarn test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
