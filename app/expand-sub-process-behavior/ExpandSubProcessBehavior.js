import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  asTRBL,
  getMid
} from 'diagram-js/lib/layout/LayoutUtil';

import { getBBox } from 'diagram-js/lib/util/Elements';

import {
  selfAndAllChildren as getAllChildren
} from 'diagram-js/lib/util/Elements';

var PADDING = 50,
    THRESHOLD = 1;

var OPPOSITE_DIRECTIONS = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right'
};

var DIRECTION_AXIS = {
  top: 'y',
  right: 'x',
  bottom: 'y',
  left: 'x'
};

var DIRECTION_OFFSET = {
  top: -1,
  right: 1,
  bottom: 1,
  left: -1
};


export default function ExpandSubProcessBehavior(
  bpmnAutoResize,
  canvas,
  elementDetection,
  elementFactory,
  injector,
  modeling,
  spaceTool
) {
  injector.invoke(CommandInterceptor, this);

  this._bpmnAutoResize = bpmnAutoResize;
  this._canvas = canvas;
  this._elementDetection = elementDetection;
  this._elementFactory = elementFactory;
  this._modeling = modeling;
  this._spaceTool = spaceTool;

  var self = this;

  this.preExecuted('shape.toggleCollapse', function(event) {
    var context = event.context,
        shape = context.shape;

    if (!is(shape, 'bpmn:SubProcess')) {
      return;
    }

    if (!shape.collapsed) {
      return;
    };

    var newBounds = self.getNewBounds(shape);

    var boundsTRBL = asTRBL(shape),
        newBoundsTRBL = asTRBL(newBounds);

    [
      'left',
      'right',
      'top',
      'bottom'
    ].forEach(function(direction) {
      var rect = self.getRect(boundsTRBL, newBoundsTRBL, direction);

      var detectedElements = self.detectAt(rect);

      if (!detectedElements.length) {

        // no elements detected
        return;
      }

      var delta = self.getDelta(detectedElements, boundsTRBL, newBoundsTRBL, direction);

      var movingShapes = self.getMovingShapes(direction, boundsTRBL[ direction ]);

      self.moveShapes(movingShapes, delta, direction);
    });
  });
}

inherits(ExpandSubProcessBehavior, CommandInterceptor);

ExpandSubProcessBehavior.$inject = [
  'bpmnAutoResize',
  'canvas',
  'elementDetection',
  'elementFactory',
  'injector',
  'modeling',
  'spaceTool'
];

ExpandSubProcessBehavior.prototype.getRect = function(
  boundsTRBL,
  newBoundsTRBL,
  detectionDirection
) {
  var detectionRect = {
    top: newBoundsTRBL.top - PADDING,
    right: newBoundsTRBL.right + PADDING,
    bottom: newBoundsTRBL.bottom + PADDING,
    left: newBoundsTRBL.left - PADDING
  };

  if (detectionDirection === 'top') {
    detectionRect.bottom = boundsTRBL.top - THRESHOLD;
  }

  if (detectionDirection === 'right') {
    detectionRect.left = boundsTRBL.right + THRESHOLD;
  }

  if (detectionDirection === 'bottom') {
    detectionRect.top = boundsTRBL.bottom + THRESHOLD;
  }

  if (detectionDirection === 'left') {
    detectionRect.right = boundsTRBL.left - THRESHOLD;
  }

  return detectionRect;
}

/**
 * Detect elements intersecting rectangle.
 * 
 * @param {TRBL} rect
 *
 * @param {Array<djs.model.shape>}
 */
ExpandSubProcessBehavior.prototype.detectAt = function(rect) {
  return this._elementDetection.detectAt(rect).filter(function(element) {
    return !isConnection(element) && !isHidden(element);
  });
}

ExpandSubProcessBehavior.prototype.getNewBounds = function(shape) {
  var defaultSize = this._elementFactory._getDefaultSize(shape);

  var optimalBounds = this._bpmnAutoResize._getOptimalBounds(shape.children || [], shape);

  var shapeMid = getMid(shape);

  var newWidth = defaultSize.width > optimalBounds.width ? defaultSize.width : optimalBounds.width,
      newHeight = defaultSize.height > optimalBounds.height ? defaultSize.height : optimalBounds.height;

  return {
    x: shapeMid.x - newWidth / 2,
    y: shapeMid.y - newHeight / 2,
    width: newWidth,
    height: newHeight
  };
};

ExpandSubProcessBehavior.prototype.getDelta = function(detectedElements, boundsTRBL, newBoundsTRBL, direction) {
  var bbox = asTRBL(getBBox(detectedElements));

  var requiredSpace, availableSpace;

  if (isTop(direction) || isLeft(direction)) {
    requiredSpace = boundsTRBL[ direction ] - newBoundsTRBL[ direction ];
    availableSpace = boundsTRBL[ direction ] - bbox[ OPPOSITE_DIRECTIONS[ direction ] ];
  } else {
    requiredSpace = newBoundsTRBL[ direction ] - boundsTRBL[ direction ];
    availableSpace = bbox[ OPPOSITE_DIRECTIONS[ direction ] ] - boundsTRBL[ direction ];
  }

  return requiredSpace - availableSpace + PADDING;
}

ExpandSubProcessBehavior.prototype.getMovingShapes = function(detectionDirection, spacePos) {
  var axis = DIRECTION_AXIS[ detectionDirection ];

  var offset = DIRECTION_OFFSET[ detectionDirection ];

  var rootShape = this._canvas.getRootElement();

  var allShapes = getAllChildren(rootShape, true);

  var adjustments = this._spaceTool.calculateAdjustments(allShapes, axis, offset, spacePos);

  var movingShapes = adjustments.movingShapes;

  return movingShapes.filter(function(shape) {
    return !isHidden(shape);
  });
};

ExpandSubProcessBehavior.prototype.moveShapes = function(movingShapes, delta, direction) {
  var d = {
    x: 0,
    y: 0
  };

  d[ getAxis(direction) ] = delta * DIRECTION_OFFSET[ direction ];

  this._modeling.createSpace(movingShapes, [], d, toCardinalDirection(direction));
}

// helpers //////////

function isConnection(element) {
  return !!element.waypoints;
}

function isHidden(element) {
  return !!element.hidden;
}

function getAxis(direction) {
  if (direction === 'top' || direction === 'bottom') {
    return 'y';
  }

  return 'x';
}

function toCardinalDirection(direction) {
  if (direction === 'top') {
    return 'n';
  } else if (direction === 'right') {
    return 'w';
  } else if (direction === 'bottom') {
    return 's';
  } else {
    return 'w';
  }
}

function isLeft(direction) {
  return direction && direction === 'left';
}

function isTop(direction) {
  return direction && direction === 'top';
}