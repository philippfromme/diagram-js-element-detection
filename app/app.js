import BpmnModeler from 'bpmn-js/lib/Modeler';

import elementDetectionModule from './element-detection';

import diagramXML from '../resources/complex.bpmn';

const containerEl = document.getElementById('container');

const bpmnModeler = new BpmnModeler({
  container: containerEl,
  additionalModules: [
    elementDetectionModule
  ]
});

bpmnModeler.importXML(diagramXML, (err) => {
  if (err) {
    console.error(err);
  }
});