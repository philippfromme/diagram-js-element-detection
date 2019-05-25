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
    PADDING_SELF = 1; // avoid detecting expanding sub process itself


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

/**
 * Get rect for detecting elements depending on direction.
 *
 * @param{TRBL} boundsTRBL - Sub-process bounds before expanding.
 * @param{TRBL} newBoundsTRBL - Sub-process bounds after expanding.
 * @param{string} direction - Direction in which to detect elements.
 *
 * @returns {TRBL}
 * 
 */
ExpandSubProcessBehavior.prototype.getRect = function(
  boundsTRBL,
  newBoundsTRBL,
  direction
) {
  var rect = {
    top: newBoundsTRBL.top - PADDING,
    right: newBoundsTRBL.right + PADDING,
    bottom: newBoundsTRBL.bottom + PADDING,
    left: newBoundsTRBL.left - PADDING
  };

  if (direction === 'top') {
    rect.bottom = boundsTRBL.top - PADDING_SELF;
  }

  if (direction === 'right') {
    rect.left = boundsTRBL.right + PADDING_SELF;
  }

  if (direction === 'bottom') {
    rect.top = boundsTRBL.bottom + PADDING_SELF;
  }

  if (direction === 'left') {
    rect.right = boundsTRBL.left - PADDING_SELF;
  }

  return rect;
}

/**
 * Detect elements intersecting rectangle.
 * 
 * @param {TRBL} rect
 *
 * @param {Array<djs.model.Shape>}
 */
ExpandSubProcessBehavior.prototype.detectAt = function(rect) {
  return this._elementDetection.detectAt(rect).filter(function(element) {
    return !isConnection(element) && !isHidden(element);
  });
}

/**
 * Get bounds of sub-process after expanding.
 *
 * @param{djs.model.Shape} shape - Sub-process before expanding.
 *
 * @returns {Bounds}
 */
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

/**
 * Get delta for moving elements to avoid overlapping.
 *
 * @param {Array<djs.model.Shape>} elements
 * @param {TRBL} boundsTRBL
 * @param {TRBL} newBoundsTRBL
 * @param {string} direction
 *
 * @returns {number}
 */
ExpandSubProcessBehavior.prototype.getDelta = function(elements, boundsTRBL, newBoundsTRBL, direction) {
  var bbox = asTRBL(getBBox(elements));

  var oppositeDirection = getOppositeDirection(direction);

  var requiredSpace, availableSpace;

  if (isTop(direction) || isLeft(direction)) {
    requiredSpace = boundsTRBL[ direction ] - newBoundsTRBL[ direction ];
    availableSpace = boundsTRBL[ direction ] - bbox[ oppositeDirection ];
  } else {
    requiredSpace = newBoundsTRBL[ direction ] - boundsTRBL[ direction ];
    availableSpace = bbox[ oppositeDirection ] - boundsTRBL[ direction ];
  }

  return requiredSpace - availableSpace + PADDING;
}

/**
 * Get all moving shapes before creating space.
 *
 * @param {string} direction
 * @param {number} position
 *
 * @returns{Array<djs.model.Shape>}
 */
ExpandSubProcessBehavior.prototype.getMovingShapes = function(direction, position) {
  var axis = getAxis(direction);

  var offset = getDirectionOffset(direction);

  var rootShape = this._canvas.getRootElement();

  var allShapes = getAllChildren(rootShape, true);

  var adjustments = this._spaceTool.calculateAdjustments(allShapes, axis, offset, position);

  var movingShapes = adjustments.movingShapes;

  return movingShapes.filter(function(shape) {
    return !isHidden(shape);
  });
};

/**
 * Move shapes in given direction.
 *
 * @param{Array<djs.model.Shape>}
 * @param {number} delta
 * @param {string} direction
 */
ExpandSubProcessBehavior.prototype.moveShapes = function(movingShapes, delta, direction) {
  var d = {
    x: 0,
    y: 0
  };

  d[ getAxis(direction) ] = delta * getDirectionOffset(direction);

  this._modeling.moveElements(movingShapes, d);
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

/**
 * Get positive or negative offset depending on direction.
 * This is necessary to use SpaceTool#calculateAdjustments.
 *
 * @param {string} direction
 *
 * @return {number}
 */
function getDirectionOffset(direction) {
  if (direction === 'right' || direction === 'bottom') {
    return 1;
  }

  return -1;
}

function getOppositeDirection(direction) {
  if (direction === 'top') {
    return 'bottom';
  } else if (direction === 'right') {
    return 'left';
  } else if (direction === 'bottom') {
    return 'top';
  }

  return 'right';
}

function isLeft(direction) {
  return direction && direction === 'left';
}

function isTop(direction) {
  return direction && direction === 'top';
}