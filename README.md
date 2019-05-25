# diagram-js Element Detection

> :warning: This is a highly experimental feature! Do NOT use this in production!

A utility that detects elements at a point or in a rectangular area.

![Screencast](docs/screencast.gif)

To verify the usefulness of such a feature this project also implements [ExpandSubProcessBehavior](https://github.com/philippfromme/diagram-js-element-detection/blob/master/app/expand-sub-process-behavior/ExpandSubProcessBehavior.js) solving a [common issue in bpmn-js](https://github.com/camunda/camunda-modeler/issues/1243).

```javascript
const elementDetection = bpmnModeler.get('elementDetection');

// works with points
const point = {
  x: 100,
  y: 100
};

let detectedElements = elementDetection.detectAt(point);

// works with rects
const rect = {
  x: 100,
  y: 100,
  width: 100,
  height: 100
};

detectedElements = elementDetection.detectAt(rect);

const trbl = {
  top: 100,
  right: 200,
  bottom: 200,
  left: 100
};

detectedElements = elementDetection.detectAt(trbl);
```

# Run

Install:

```shell
npm install
```

Run an example featuring [ExpandSubProcessBehavior](https://github.com/philippfromme/diagram-js-element-detection/blob/master/app/expand-sub-process-behavior/ExpandSubProcessBehavior.js):

```shell
npm start
```

Test:

```shell
npm test
```

or

```shell
npm run dev
```


# License

MIT