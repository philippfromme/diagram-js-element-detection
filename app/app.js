import BpmnModeler from 'bpmn-js/lib/Modeler';

import autoPlaceModule from './auto-place';
import elementDetectionModule from './element-detection';

import diagramXML from '../resources/diagram.bpmn';

const containerEl = document.getElementById('container');

// create modeler
const bpmnModeler = new BpmnModeler({
  container: containerEl,
  additionalModules: [
    autoPlaceModule,
    elementDetectionModule
  ]
});

// import XML
bpmnModeler.importXML(diagramXML, (err) => {
  if (err) {
    console.error(err);
  }

  const commandStack = bpmnModeler.get('commandStack'),
        elementDetection = bpmnModeler.get('elementDetection'),
        modeling = bpmnModeler.get('modeling');

  window.detectAt = elementDetection.detectAt.bind(elementDetection);

  function detectAt(positionOrReact) {
    const elements = elementDetection.detectAt(positionOrReact, 'element-registry');

    while (commandStack.canUndo()) {
      commandStack.undo();
    }

    elements.forEach(element => {
      modeling.setColor(element, {
        stroke: 'fuchsia'
      });
    });
  }

  // setInterval(() => {
  //   detectAt({
  //     x: Math.round(Math.random() * 500),
  //     y: Math.round(Math.random() * 500),
  //     width: 100,
  //     height: 100
  //   });
  // }, 1000);
});