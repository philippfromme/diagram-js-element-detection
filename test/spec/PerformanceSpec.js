import Modeler from 'bpmn-js/lib/Modeler';

import elementDetectionModule from 'app/element-detection';

import TestContainer from 'mocha-test-container-support';

import { insertCSS } from 'bpmn-js/test/helper';

import {
  append as svgAppend,
  attr as svgAttr,
  clear as svgClear,
  create as svgCreate
} from 'tiny-svg';

import { isNumber } from 'min-dash';

import diagramXML from 'resources/complex.bpmn';

import diagramCSS from 'diagram-js/assets/diagram-js.css';
import bpmnFontCSS from 'bpmn-font/dist/css/bpmn-embedded.css';

insertCSS('diagram-js.css', diagramCSS);

insertCSS('bpmn-embedded.css', bpmnFontCSS);

insertCSS('diagram-js-testing.css',
  'body .test-container { height: auto }' +
  'body .test-container .test-content-container { height: 90vmin; }'
);


describe('Performance', function() {

  var modeler;

  beforeEach(function(done) {
    modeler = new Modeler({
      container: TestContainer.get(this),
      additionalModules: [
        elementDetectionModule
      ]
    });

    modeler.importXML(diagramXML, function(err) {
      if (!err) {
        done();
      }
    });
  });


  it('should detect 1000 times', function(done) {

    // given
    var elementDetection = modeler.get('elementDetection');

    var viewbox = modeler.get('canvas').viewbox().inner;

    var durations = [];

    var rect;

    // when
    for(var i = 0; i < 1000; i++) {

      rect = {
        x: random(viewbox.x, viewbox.x + viewbox.width - 100),
        y: random(viewbox.y, viewbox.y + viewbox.height - 100),
        width: 100,
        height: 100
      };

      var result = measureDuration(() => {
        return elementDetection.detectAt(rect);
      });

      var duration = result.duration;

      durations.push(duration);
    }

    var averageDuration = durations.reduce(add, 0) / durations.length;

    averageDuration = Math.round(averageDuration * 100) / 100;

    console.log('Average Duration: ' + averageDuration + 'ms');

    // then
    // expect less than 2ms average duration
    expect(averageDuration < 2);

    done();
  });


  it.skip('should detect every 1000ms', function() {

    // given
    var commandStack = modeler.get('commandStack'),
        elementDetection = modeler.get('elementDetection'),
        modeling = modeler.get('modeling');

    var viewbox = modeler.get('canvas').viewbox().inner;

    // when
    setInterval(function() {
      var rect = {
        x: random(viewbox.x, viewbox.x + viewbox.width - 100),
        y: random(viewbox.y, viewbox.y + viewbox.height - 100),
        width: 100,
        height: 100
      };

      var result = measureDuration(() => {
        return elementDetection.detectAt(rect);
      });

      var duration = result.duration,
          detectedElements = result.returnValue;

      console.log('Duration: ' + duration + 'ms');

      drawRect(rect, modeler);

      while (commandStack.canUndo()) {
        commandStack.undo();
      }
  
      detectedElements.forEach(element => {
        modeling.setColor(element, {
          stroke: 'fuchsia'
        });
      });
    }, 1000);
  });

});

// helpers //////////

function drawRect(rect, modeler) {
  const layer = modeler.get('canvas').getLayer('element-detection');

  svgClear(layer);

  const gfx = svgCreate('rect');

  svgAttr(gfx, {
    fill: 'fuchsia',
    fillOpacity: 0.25,
    stroke: 'fuchsia',
    strokeOpacity: 0.25,
    strokeWidth: 2,
    x: rect.x,
    y: rect.y,
    width: Math.max(rect.width, 2),
    height: Math.max(rect.height, 2)
  });

  svgAppend(layer, gfx);
}

function measureDuration(fn) {
  const now = performance.now();

  const returnValue = fn();

  const duration = Math.round((performance.now() - now) * 10) / 10

  return {
    returnValue: returnValue,
    duration: duration
  };
}

function add(a, b) {
  return a + b;
}

function random(min, max) {
  if (!isNumber(max)) {
    max = min;
    min = 0;
  }

  return Math.round((Math.random() * (max - min)) + min);
}