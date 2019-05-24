import BpmnModeler from 'bpmn-js/lib/Modeler';

import elementDetectionModule from './element-detection';
import expandSubProcessBehaviorModule from './expand-sub-process-behavior';

import diagramXML from '../resources/collapsed-sub-process.bpmn';

const containerEl = document.getElementById('container');

const bpmnModeler = new BpmnModeler({
  container: containerEl,
  additionalModules: [
    elementDetectionModule,
    expandSubProcessBehaviorModule
  ],
  keyboard: {
    bind: document
  }
});

bpmnModeler.importXML(diagramXML, (err) => {
  if (err) {
    console.error(err);
  }
});