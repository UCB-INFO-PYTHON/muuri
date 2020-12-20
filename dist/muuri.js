/**
* Muuri v0.10.0
* https://muuri.dev/
* Copyright (c) 2015-present, Haltu Oy
* Released under the MIT license
* https://github.com/haltu/muuri/blob/master/LICENSE.md
* @license MIT
*
* Muuri Packer
* Copyright (c) 2016-present, Niklas Rämö <inramo@gmail.com>
* @license MIT
*
* Muuri Ticker / Muuri Emitter / Muuri Dragger
* Copyright (c) 2018-present, Niklas Rämö <inramo@gmail.com>
* @license MIT
*
* Muuri AutoScroller
* Copyright (c) 2019-present, Niklas Rämö <inramo@gmail.com>
* @license MIT
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Muuri = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var GRID_INSTANCES = new Map();
    var ITEM_ELEMENT_MAP = new Map();
    var ACTION_SWAP = 'swap';
    var ACTION_MOVE = 'move';
    var INSTANT_LAYOUT = 'instant';
    var EVENT_SYNCHRONIZE = 'synchronize';
    var EVENT_LAYOUT_START = 'layoutStart';
    var EVENT_LAYOUT_END = 'layoutEnd';
    var EVENT_LAYOUT_ABORT = 'layoutAbort';
    var EVENT_ADD = 'add';
    var EVENT_REMOVE = 'remove';
    var EVENT_SHOW_START = 'showStart';
    var EVENT_SHOW_END = 'showEnd';
    var EVENT_HIDE_START = 'hideStart';
    var EVENT_HIDE_END = 'hideEnd';
    var EVENT_FILTER = 'filter';
    var EVENT_SORT = 'sort';
    var EVENT_MOVE = 'move';
    var EVENT_SEND = 'send';
    var EVENT_BEFORE_SEND = 'beforeSend';
    var EVENT_RECEIVE = 'receive';
    var EVENT_BEFORE_RECEIVE = 'beforeReceive';
    var EVENT_DRAG_INIT = 'dragInit';
    var EVENT_DRAG_START = 'dragStart';
    var EVENT_DRAG_MOVE = 'dragMove';
    var EVENT_DRAG_SCROLL = 'dragScroll';
    var EVENT_DRAG_END = 'dragEnd';
    var EVENT_DRAG_RELEASE_START = 'dragReleaseStart';
    var EVENT_DRAG_RELEASE_END = 'dragReleaseEnd';
    var EVENT_DESTROY = 'destroy';
    var HAS_TOUCH_EVENTS = 'ontouchstart' in window;
    var HAS_POINTER_EVENTS = !!window.PointerEvent;
    var UA = window.navigator.userAgent.toLowerCase();
    var IS_EDGE = UA.indexOf('edge') > -1;
    var IS_IE = UA.indexOf('trident') > -1;
    var IS_FIREFOX = UA.indexOf('firefox') > -1;
    var IS_ANDROID = UA.indexOf('android') > -1;
    var IS_IOS = /^(iPad|iPhone|iPod)/.test(window.navigator.platform) ||
        (/^Mac/.test(window.navigator.platform) && window.navigator.maxTouchPoints > 1);
    var MAX_SAFE_FLOAT32_INTEGER = 16777216;
    var VIEWPORT_THRESHOLD = 100;
    var HAS_PASSIVE_EVENTS = (function () {
        var isPassiveEventsSupported = false;
        try {
            var passiveOpts = Object.defineProperty({}, 'passive', {
                get: function () {
                    isPassiveEventsSupported = true;
                },
            });
            // @ts-ignore
            window.addEventListener('testPassive', null, passiveOpts);
            // @ts-ignore
            window.removeEventListener('testPassive', null, passiveOpts);
        }
        catch (e) { }
        return isPassiveEventsSupported;
    })();

    /**
     * Event emitter.
     */
    var Emitter = /** @class */ (function () {
        function Emitter() {
            this._events = {};
            this._queue = [];
            this._counter = 0;
            this._clearOnEmit = false;
        }
        /**
         * Bind an event listener.
         */
        Emitter.prototype.on = function (event, listener) {
            if (!this._events)
                return this;
            // Get listeners queue and create it if it does not exist.
            var listeners = this._events[event] || [];
            this._events[event] = listeners;
            // Add the listener to the queue.
            listeners.push(listener);
            return this;
        };
        /**
         * Unbind all event listeners that match the provided listener function.
         */
        Emitter.prototype.off = function (event, listener) {
            if (!this._events)
                return this;
            // Get listeners and return immediately if none is found.
            var listeners = this._events[event];
            if (!listeners || !listeners.length)
                return this;
            // Remove all matching listeners.
            var index = 0;
            while ((index = listeners.indexOf(listener)) !== -1) {
                listeners.splice(index, 1);
            }
            return this;
        };
        /**
         * Unbind all listeners of the provided event.
         */
        Emitter.prototype.clear = function (event) {
            if (!this._events)
                return this;
            var listeners = this._events[event];
            if (listeners) {
                listeners.length = 0;
                delete this._events[event];
            }
            return this;
        };
        /**
         * Emit all listeners in a specified event with the provided arguments.
         */
        Emitter.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!this._events) {
                this._clearOnEmit = false;
                return this;
            }
            // Get event listeners and quit early if there's no listeners.
            var listeners = this._events[event];
            if (!listeners || !listeners.length) {
                this._clearOnEmit = false;
                return this;
            }
            var queue = this._queue;
            var startIndex = queue.length;
            // Add the current listeners to the callback queue before we process them.
            // This is necessary to guarantee that all of the listeners are called in
            // correct order even if new event listeners are removed/added during
            // processing and/or events are emitted during processing.
            queue.push.apply(queue, listeners);
            // Reset the event's listeners if need be.
            if (this._clearOnEmit) {
                listeners.length = 0;
                this._clearOnEmit = false;
            }
            // Increment queue counter. This is needed for the scenarios where emit is
            // triggered while the queue is already processing. We need to keep track of
            // how many "queue processors" there are active so that we can safely reset
            // the queue in the end when the last queue processor is finished.
            ++this._counter;
            // Process the queue (the specific part of it for this emit).
            var i = startIndex;
            var endIndex = queue.length;
            for (; i < endIndex; i++) {
                queue[i].apply(queue, args);
                // Stop processing if the emitter is destroyed.
                if (!this._events)
                    return this;
            }
            // Decrement queue process counter.
            --this._counter;
            // Reset the queue if there are no more queue processes running.
            if (!this._counter)
                queue.length = 0;
            return this;
        };
        /**
         * Emit all listeners in a specified event with the provided arguments and
         * remove the event's listeners just before calling the them. This method
         * allows the emitter to serve as a queue where all listeners are called only
         * once.
         */
        Emitter.prototype.burst = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!this._events)
                return this;
            this._clearOnEmit = true;
            return this.emit.apply(this, __spreadArrays([event], args));
        };
        /**
         * Check how many listeners there are for a specific event.
         */
        Emitter.prototype.countListeners = function (event) {
            if (!this._events)
                return 0;
            var listeners = this._events[event];
            return listeners ? listeners.length : 0;
        };
        /**
         * Destroy emitter instance. Basically just removes all bound listeners.
         */
        Emitter.prototype.destroy = function () {
            if (!this._events)
                return this;
            this._queue.length = this._counter = 0;
            this._events = null;
            return this;
        };
        return Emitter;
    }());

    var pointerOut = 'pointerout';
    var waitDuration = 100;
    /**
     * If you happen to use Legacy Edge or IE on a touch capable device there is a
     * a specific case where pointercancel and pointerend events are never emitted,
     * even though one of them should always be emitted when you release your finger
     * from the screen. The bug appears specifically when Muuri shifts the dragged
     * element's position in the DOM after pointerdown event, IE and Edge don't like
     * that behaviour and quite often forget to emit the pointerend/pointercancel
     * event. But, they do emit pointerout event so we utilize that here.
     * Specifically, if there has been no pointermove event within 100 milliseconds
     * since the last pointerout event we force cancel the drag operation. This hack
     * works surprisingly well 99% of the time. There is that 1% chance there still
     * that dragged items get stuck but it is what it is.
     *
     * @class
     * @param {Dragger} dragger
     */
    var EdgeHack = /** @class */ (function () {
        function EdgeHack(dragger) {
            this._dragger = dragger;
            this._timeout = null;
            this._outEvent = null;
            this._isActive = false;
            this._addBehaviour = this._addBehaviour.bind(this);
            this._removeBehaviour = this._removeBehaviour.bind(this);
            this._onTimeout = this._onTimeout.bind(this);
            this._resetData = this._resetData.bind(this);
            this._onStart = this._onStart.bind(this);
            this._onOut = this._onOut.bind(this);
            this._dragger.on('start', this._onStart);
        }
        EdgeHack.prototype._addBehaviour = function () {
            if (this._isActive)
                return;
            this._isActive = true;
            this._dragger.on('move', this._resetData);
            this._dragger.on('cancel', this._removeBehaviour);
            this._dragger.on('end', this._removeBehaviour);
            window.addEventListener(pointerOut, this._onOut);
        };
        EdgeHack.prototype._removeBehaviour = function () {
            if (!this._isActive)
                return;
            this._dragger.off('move', this._resetData);
            this._dragger.off('cancel', this._removeBehaviour);
            this._dragger.off('end', this._removeBehaviour);
            window.removeEventListener(pointerOut, this._onOut);
            this._resetData();
            this._isActive = false;
        };
        EdgeHack.prototype._resetData = function () {
            if (this._timeout !== null) {
                window.clearTimeout(this._timeout);
                this._timeout = null;
            }
            this._outEvent = null;
        };
        EdgeHack.prototype._onStart = function (e) {
            if (e.pointerType === 'mouse')
                return;
            this._addBehaviour();
        };
        EdgeHack.prototype._onOut = function (e) {
            if (!this._dragger.getTrackedTouch(e))
                return;
            this._resetData();
            this._outEvent = e;
            this._timeout = window.setTimeout(this._onTimeout, waitDuration);
        };
        EdgeHack.prototype._onTimeout = function () {
            var outEvent = this._outEvent;
            this._resetData();
            if (outEvent && this._dragger.isActive())
                this._dragger.onCancel(outEvent);
        };
        EdgeHack.prototype.destroy = function () {
            this._dragger.off('start', this._onStart);
            this._removeBehaviour();
        };
        return EdgeHack;
    }());

    // Playing it safe here, test all potential prefixes capitalized and lowercase.
    var vendorPrefixes = ['', 'webkit', 'moz', 'ms', 'o', 'Webkit', 'Moz', 'MS', 'O'];
    var cache = new Map();
    /**
     * Get prefixed CSS property name when given a non-prefixed CSS property name.
     * Returns null if the property is not supported at all.
     *
     * @param {CSSStyleDeclaration} style
     * @param {string} prop
     * @returns {string}
     */
    function getPrefixedPropName(style, styleProp) {
        var prefixedProp = cache.get(styleProp);
        if (prefixedProp)
            return prefixedProp;
        var camelProp = styleProp[0].toUpperCase() + styleProp.slice(1);
        var i = 0;
        while (i < vendorPrefixes.length) {
            prefixedProp = vendorPrefixes[i] ? vendorPrefixes[i] + camelProp : styleProp;
            if (prefixedProp in style) {
                cache.set(styleProp, prefixedProp);
                return prefixedProp;
            }
            ++i;
        }
        return '';
    }

    var POINTER_EVENTS = {
        start: 'pointerdown',
        move: 'pointermove',
        cancel: 'pointercancel',
        end: 'pointerup',
    };
    var TOUCH_EVENTS = {
        start: 'touchstart',
        move: 'touchmove',
        cancel: 'touchcancel',
        end: 'touchend',
    };
    var MOUSE_EVENTS = {
        start: 'mousedown',
        move: 'mousemove',
        cancel: '',
        end: 'mouseup',
    };
    var SOURCE_EVENTS = __assign({}, (HAS_TOUCH_EVENTS ? TOUCH_EVENTS : HAS_POINTER_EVENTS ? POINTER_EVENTS : MOUSE_EVENTS));
    var DRAGGER_EVENTS = {
        start: 'start',
        move: 'move',
        cancel: 'cancel',
        end: 'end',
    };
    var CAPTURE = 1;
    var PASSIVE = 2;
    var TA_AUTO = 'auto';
    var TA_PROP = 'touchAction';
    var TA_PROP_PREFIXED = getPrefixedPropName(document.documentElement.style, TA_PROP);
    function preventDefault(e) {
        if (e.preventDefault && e.cancelable !== false)
            e.preventDefault();
    }
    function getListenerType(capture, passive) {
        return ((capture ? CAPTURE : 0) | (HAS_PASSIVE_EVENTS && passive ? PASSIVE : 0));
    }
    function getListenerOptions(listenerType) {
        return HAS_PASSIVE_EVENTS
            ? {
                capture: !!(CAPTURE & listenerType),
                passive: !!(PASSIVE & listenerType),
            }
            : !!(CAPTURE & listenerType);
    }
    function getPointerType(e) {
        return 'pointerType' in e
            ? e.pointerType
            : 'touches' in e
                ? 'touch'
                : 'mouse';
    }
    function getEventPointerId(e) {
        // If we have pointer id available let's use it.
        if ('pointerId' in e)
            return e.pointerId;
        // For touch events let's get the first changed touch's identifier.
        if ('changedTouches' in e)
            return e.changedTouches[0] ? e.changedTouches[0].identifier : null;
        // For mouse/other events let's provide a static id.
        return 1;
    }
    function getTouchById(e, id) {
        // If we have a pointer event return the whole event if there's a match, and
        // null otherwise.
        if ('pointerId' in e) {
            return e.pointerId === id ? e : null;
        }
        // For touch events let's check if there's a changed touch object that matches
        // the pointerId in which case return the touch object.
        if ('changedTouches' in e) {
            var i = 0;
            for (; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === id) {
                    return e.changedTouches[i];
                }
            }
            return null;
        }
        // For mouse/other events let's assume there's only one pointer and just
        // return the event.
        return e;
    }
    /**
     * Creates a new DragProxy instance that propagates events from window to
     * dragger instances.
     */
    var DragProxy = /** @class */ (function () {
        function DragProxy(listenerType) {
            this._emitter = new Emitter();
            this._listenerOptions = getListenerOptions(listenerType);
            this._draggers = new Set();
            this._onMove = this._onMove.bind(this);
            this._onCancel = this._onCancel.bind(this);
            this._onEnd = this._onEnd.bind(this);
        }
        DragProxy.prototype._activate = function () {
            window.addEventListener(SOURCE_EVENTS.move, this._onMove, this._listenerOptions);
            window.addEventListener(SOURCE_EVENTS.end, this._onEnd, this._listenerOptions);
            if (SOURCE_EVENTS.cancel) {
                window.addEventListener(SOURCE_EVENTS.cancel, this._onCancel, this._listenerOptions);
            }
        };
        DragProxy.prototype._deactivate = function () {
            window.removeEventListener(SOURCE_EVENTS.move, this._onMove, this._listenerOptions);
            window.removeEventListener(SOURCE_EVENTS.end, this._onEnd, this._listenerOptions);
            if (SOURCE_EVENTS.cancel) {
                window.removeEventListener(SOURCE_EVENTS.cancel, this._onCancel, this._listenerOptions);
            }
        };
        DragProxy.prototype._onMove = function (e) {
            this._emitter.emit(DRAGGER_EVENTS.move, e);
        };
        DragProxy.prototype._onCancel = function (e) {
            this._emitter.emit(DRAGGER_EVENTS.cancel, e);
        };
        DragProxy.prototype._onEnd = function (e) {
            this._emitter.emit(DRAGGER_EVENTS.end, e);
        };
        DragProxy.prototype.hasDragger = function (dragger) {
            return this._draggers.has(dragger);
        };
        DragProxy.prototype.addDragger = function (dragger) {
            if (this._draggers.has(dragger))
                return;
            this._draggers.add(dragger);
            this._emitter.on(DRAGGER_EVENTS.move, dragger.onMove);
            this._emitter.on(DRAGGER_EVENTS.cancel, dragger.onCancel);
            this._emitter.on(DRAGGER_EVENTS.end, dragger.onEnd);
            if (this._draggers.size === 1) {
                this._activate();
            }
        };
        DragProxy.prototype.removeDragger = function (dragger) {
            if (!this._draggers.has(dragger))
                return;
            this._draggers.delete(dragger);
            this._emitter.off(DRAGGER_EVENTS.move, dragger.onMove);
            this._emitter.off(DRAGGER_EVENTS.cancel, dragger.onCancel);
            this._emitter.off(DRAGGER_EVENTS.end, dragger.onEnd);
            if (this._draggers.size === 0) {
                this._deactivate();
            }
        };
        DragProxy.prototype.destroy = function () {
            if (this._draggers.size)
                this._deactivate();
            this._draggers.clear();
            this._emitter.destroy();
        };
        return DragProxy;
    }());
    var dragProxies = [new DragProxy(0), new DragProxy(1)];
    if (HAS_PASSIVE_EVENTS)
        dragProxies.push(new DragProxy(2), new DragProxy(3));
    /**
     * Creates a new Dragger instance for an element.
     */
    var Dragger = /** @class */ (function () {
        function Dragger(element, cssProps, listenerOptions) {
            if (listenerOptions === void 0) { listenerOptions = {}; }
            var _a = listenerOptions.capture, capture = _a === void 0 ? true : _a, _b = listenerOptions.passive, passive = _b === void 0 ? true : _b;
            this._element = element;
            this._emitter = new Emitter();
            this._cssProps = {};
            this._touchAction = '';
            this._listenerType = getListenerType(capture, passive);
            this._isActive = false;
            this._pointerId = null;
            this._startTime = 0;
            this._startX = 0;
            this._startY = 0;
            this._currentX = 0;
            this._currentY = 0;
            // This hack should not exists. Let's remove it at earliest inconvenience.
            this._edgeHack = null;
            if ((IS_EDGE || IS_IE) && HAS_POINTER_EVENTS) {
                this._edgeHack = new EdgeHack(this);
            }
            this.onStart = this.onStart.bind(this);
            this.onMove = this.onMove.bind(this);
            this.onCancel = this.onCancel.bind(this);
            this.onEnd = this.onEnd.bind(this);
            // Apply initial CSS props.
            if (cssProps)
                this.setCssProps(cssProps);
            // Make sure we have some touch action set.
            if (!this._touchAction)
                this.setTouchAction(TA_AUTO);
            // Prevent native DnD API from kicking in for the item and it's children.
            element.addEventListener('dragstart', preventDefault, false);
            // Listen to start event.
            element.addEventListener(SOURCE_EVENTS.start, this.onStart, getListenerOptions(this._listenerType));
        }
        /**
         * Create a custom dragger event from a raw event.
         */
        Dragger.prototype._createEvent = function (type, e) {
            var touch = this.getTrackedTouch(e);
            if (!touch || !this._pointerId)
                return null;
            return {
                // Hammer.js compatibility interface.
                type: type,
                srcEvent: e,
                distance: this.getDistance(),
                deltaX: this.getDeltaX(),
                deltaY: this.getDeltaY(),
                deltaTime: type === DRAGGER_EVENTS.start ? 0 : this.getDeltaTime(),
                isFirst: type === DRAGGER_EVENTS.start,
                isFinal: type === DRAGGER_EVENTS.end || type === DRAGGER_EVENTS.cancel,
                pointerType: getPointerType(e),
                // Partial Touch API interface.
                identifier: this._pointerId,
                screenX: touch.screenX,
                screenY: touch.screenY,
                clientX: touch.clientX,
                clientY: touch.clientY,
                pageX: touch.pageX,
                pageY: touch.pageY,
                target: touch.target,
            };
        };
        /**
         * Emit a raw event as dragger event internally.
         */
        Dragger.prototype._emit = function (type, e) {
            this._emitter.emit(type, this._createEvent(type, e));
        };
        /**
         * If the provided event is a PointerEvent this method will return it if it has
         * the same pointerId as the instance. If the provided event is a TouchEvent
         * this method will try to look for a Touch instance in the changedTouches that
         * has an identifier matching this instance's pointerId. If the provided event
         * is a MouseEvent (or just any other event than PointerEvent or TouchEvent)
         * it will be returned immediately.
         */
        Dragger.prototype.getTrackedTouch = function (e) {
            if (this._pointerId === null)
                return null;
            return getTouchById(e, this._pointerId);
        };
        /**
         * Handler for start event.
         */
        Dragger.prototype.onStart = function (e) {
            if (!this._element)
                return;
            // If pointer id is already assigned let's return early.
            if (this._pointerId !== null)
                return;
            // Get (and set) pointer id.
            this._pointerId = getEventPointerId(e);
            if (this._pointerId === null)
                return;
            // Get the event/touch.
            var touch = this.getTrackedTouch(e);
            if (!touch)
                return;
            // Setup initial data and emit start event.
            this._startX = this._currentX = touch.clientX;
            this._startY = this._currentY = touch.clientY;
            this._startTime = Date.now();
            this._isActive = true;
            this._emit(DRAGGER_EVENTS.start, e);
            // If the drag procedure was not reset within the start procedure let's
            // activate the instance (start listening to move/cancel/end events).
            if (this._isActive) {
                var proxy = dragProxies[this._listenerType];
                if (proxy)
                    proxy.addDragger(this);
            }
        };
        /**
         * Handler for move event.
         */
        Dragger.prototype.onMove = function (e) {
            var touch = this.getTrackedTouch(e);
            if (!touch)
                return;
            this._currentX = touch.clientX;
            this._currentY = touch.clientY;
            this._emit(DRAGGER_EVENTS.move, e);
        };
        /**
         * Handler for cancel event.
         */
        Dragger.prototype.onCancel = function (e) {
            if (!this.getTrackedTouch(e))
                return;
            this._emit(DRAGGER_EVENTS.cancel, e);
            this.reset();
        };
        /**
         * Handler for end event.
         */
        Dragger.prototype.onEnd = function (e) {
            if (!this.getTrackedTouch(e))
                return;
            this._emit(DRAGGER_EVENTS.end, e);
            this.reset();
        };
        /**
         * Check if the element is being dragged at the moment.
         */
        Dragger.prototype.isActive = function () {
            return this._isActive;
        };
        /**
         * Set element's touch-action CSS property.
         */
        Dragger.prototype.setTouchAction = function (value) {
            if (!this._element || !value)
                return;
            // Store unmodified touch action value (we trust user input here).
            this._touchAction = value;
            // Set touch-action style.
            if (TA_PROP_PREFIXED) {
                this._cssProps[TA_PROP_PREFIXED] = '';
                this._element.style[TA_PROP_PREFIXED] = value;
            }
            // If we have an unsupported touch-action value let's add a special listener
            // that prevents default action on touch start event. A dirty hack, but best
            // we can do for now. The other options would be to somehow polyfill the
            // unsupported touch action behavior with custom heuristics which sounds like
            // a can of worms. We do a special exception here for Firefox Android which's
            // touch-action does not work properly if the dragged element is moved in the
            // the DOM tree on touchstart.
            if (HAS_TOUCH_EVENTS) {
                this._element.removeEventListener(TOUCH_EVENTS.start, preventDefault, true);
                if (value !== TA_AUTO &&
                    (this._element.style[TA_PROP_PREFIXED] !== value || (IS_FIREFOX && IS_ANDROID))) {
                    this._element.addEventListener(TOUCH_EVENTS.start, preventDefault, true);
                }
            }
        };
        /**
         * Update element's CSS properties. Accepts an object with camel cased style
         * props with value pairs as it's first argument.
         */
        Dragger.prototype.setCssProps = function (newProps) {
            if (!this._element)
                return;
            var currentProps = this._cssProps;
            var element = this._element;
            // Reset current props.
            var currentProp = '';
            for (currentProp in currentProps) {
                element.style[currentProp] = currentProps[currentProp];
                delete currentProps[currentProp];
            }
            // Set new props.
            var prop;
            for (prop in newProps) {
                // Make sure we have a value for the prop.
                var propValue = newProps[prop] || '';
                if (!propValue)
                    continue;
                // Special handling for touch-action.
                if (prop === TA_PROP) {
                    this.setTouchAction(propValue);
                    continue;
                }
                // Get prefixed prop and skip if it does not exist.
                var prefixedProp = getPrefixedPropName(element.style, prop);
                if (!prefixedProp)
                    continue;
                // Store the prop and add the style.
                currentProps[prefixedProp] = '';
                element.style[prefixedProp] = propValue;
            }
        };
        /**
         * Update the instance's event listener options.
         */
        Dragger.prototype.setListenerOptions = function (options) {
            if (!this._element)
                return;
            var _a = options.capture, capture = _a === void 0 ? true : _a, _b = options.passive, passive = _b === void 0 ? true : _b;
            var current = this._listenerType;
            var next = getListenerType(capture, passive);
            // If we need to update event listeners.
            if (current !== next) {
                // Unbind start listener.
                this._element.removeEventListener(SOURCE_EVENTS.start, this.onStart, getListenerOptions(this._listenerType));
                // Deactivate instance if it's active.
                var currentProxy = dragProxies[this._listenerType];
                var isActive = currentProxy ? currentProxy.hasDragger(this) : false;
                if (isActive)
                    currentProxy.removeDragger(this);
                // Update listener type.
                this._listenerType = next;
                // Rebind start listener with new listener options.
                this._element.addEventListener(SOURCE_EVENTS.start, this.onStart, getListenerOptions(this._listenerType));
                // Reactivate item with new listener options.
                if (isActive) {
                    var nextProxy = dragProxies[this._listenerType];
                    if (nextProxy)
                        nextProxy.addDragger(this);
                }
            }
        };
        /**
         * How much the pointer has moved on x-axis from start position, in pixels.
         * Positive value indicates movement from left to right.
         */
        Dragger.prototype.getDeltaX = function () {
            return this._currentX - this._startX;
        };
        /**
         * How much the pointer has moved on y-axis from start position, in pixels.
         * Positive value indicates movement from top to bottom.
         */
        Dragger.prototype.getDeltaY = function () {
            return this._currentY - this._startY;
        };
        /**
         * How far (in pixels) has pointer moved from start position.
         */
        Dragger.prototype.getDistance = function () {
            var x = this.getDeltaX();
            var y = this.getDeltaY();
            return Math.sqrt(x * x + y * y);
        };
        /**
         * How long has pointer been dragged.
         */
        Dragger.prototype.getDeltaTime = function () {
            return this._startTime ? Date.now() - this._startTime : 0;
        };
        /**
         * Bind drag event listeners.
         */
        Dragger.prototype.on = function (event, listener) {
            this._emitter.on(event, listener);
        };
        /**
         * Unbind drag event listeners.
         */
        Dragger.prototype.off = function (event, listener) {
            this._emitter.off(event, listener);
        };
        /**
         * Reset current drag operation (if any).
         */
        Dragger.prototype.reset = function () {
            this._pointerId = null;
            this._startTime = 0;
            this._startX = 0;
            this._startY = 0;
            this._currentX = 0;
            this._currentY = 0;
            this._isActive = false;
            var proxy = dragProxies[this._listenerType];
            if (proxy)
                proxy.removeDragger(this);
        };
        /**
         * Destroy the instance and unbind all drag event listeners.
         */
        Dragger.prototype.destroy = function () {
            var element = this._element;
            if (!element)
                return;
            if (this._edgeHack)
                this._edgeHack.destroy();
            // Reset data and deactivate the instance.
            this.reset();
            // Destroy emitter.
            this._emitter.destroy();
            // Unbind event handlers.
            element.removeEventListener(SOURCE_EVENTS.start, this.onStart, getListenerOptions(this._listenerType));
            element.removeEventListener('dragstart', preventDefault, false);
            element.removeEventListener(TOUCH_EVENTS.start, preventDefault, true);
            // Reset applied inline styles.
            var prop;
            for (prop in this._cssProps) {
                element.style[prop] = '';
            }
            // Reset data.
            this._cssProps = {};
            this._element = null;
        };
        return Dragger;
    }());

    /**
     * @param {Function} callback
     * @returns {number}
     */
    var raf = (window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        // @ts-ignore
        window.mozRequestAnimationFrame ||
        // @ts-ignore
        window.msRequestAnimationFrame).bind(window);

    /**
     * A lane for ticker.
     */
    var TickerLane = /** @class */ (function () {
        function TickerLane() {
            this._queue = [];
            this._indices = new Map();
            this._callbacks = new Map();
        }
        TickerLane.prototype.add = function (id, callback) {
            var _a = this, _queue = _a._queue, _indices = _a._indices, _callbacks = _a._callbacks;
            var index = _indices.get(id);
            if (index !== undefined)
                _queue[index] = undefined;
            _queue.push(id);
            _callbacks.set(id, callback);
            _indices.set(id, _queue.length - 1);
        };
        TickerLane.prototype.remove = function (id) {
            var _a = this, _queue = _a._queue, _indices = _a._indices, _callbacks = _a._callbacks;
            var index = _indices.get(id);
            if (index === undefined)
                return;
            _queue[index] = undefined;
            _callbacks.delete(id);
            _indices.delete(id);
        };
        TickerLane.prototype.flush = function (targetQueue, targetCallbacks) {
            var _a = this, _queue = _a._queue, _callbacks = _a._callbacks, _indices = _a._indices;
            var id;
            var i = 0;
            for (; i < _queue.length; i++) {
                id = _queue[i];
                if (!id || targetCallbacks.has(id))
                    continue;
                targetQueue.push(id);
                targetCallbacks.set(id, _callbacks.get(id));
            }
            _queue.length = 0;
            _callbacks.clear();
            _indices.clear();
        };
        return TickerLane;
    }());
    /**
     * A ticker system for handling DOM reads and writes in an efficient way.
     */
    var Ticker = /** @class */ (function () {
        function Ticker(numLanes) {
            if (numLanes === void 0) { numLanes = 1; }
            this._nextStep = null;
            this._lanes = [];
            this._stepQueue = [];
            this._stepCallbacks = new Map();
            this._step = this._step.bind(this);
            var i = 0;
            for (; i < numLanes; i++) {
                this._lanes.push(new TickerLane());
            }
        }
        Ticker.prototype._step = function (time) {
            var _a = this, _lanes = _a._lanes, _stepQueue = _a._stepQueue, _stepCallbacks = _a._stepCallbacks;
            var i = 0;
            this._nextStep = null;
            for (i = 0; i < _lanes.length; i++) {
                _lanes[i].flush(_stepQueue, _stepCallbacks);
            }
            for (i = 0; i < _stepQueue.length; i++) {
                _stepCallbacks.get(_stepQueue[i])(time);
            }
            _stepQueue.length = 0;
            _stepCallbacks.clear();
        };
        Ticker.prototype.add = function (laneIndex, id, callback) {
            var lane = this._lanes[laneIndex];
            if (lane) {
                lane.add(id, callback);
                if (!this._nextStep)
                    this._nextStep = raf(this._step);
            }
        };
        Ticker.prototype.remove = function (laneIndex, id) {
            var lane = this._lanes[laneIndex];
            if (lane)
                lane.remove(id);
        };
        return Ticker;
    }());

    var LAYOUT_READ = 'layoutRead';
    var LAYOUT_WRITE = 'layoutWrite';
    var VISIBILITY_READ = 'visibilityRead';
    var VISIBILITY_WRITE = 'visibilityWrite';
    var DRAG_START_READ = 'dragStartRead';
    var DRAG_START_WRITE = 'dragStartWrite';
    var DRAG_MOVE_READ = 'dragMoveRead';
    var DRAG_MOVE_WRITE = 'dragMoveWrite';
    var DRAG_SCROLL_READ = 'dragScrollRead';
    var DRAG_SCROLL_WRITE = 'dragScrollWrite';
    var DRAG_SORT_READ = 'dragSortRead';
    var RELEASE_SCROLL_READ = 'releaseScrollRead';
    var RELEASE_SCROLL_WRITE = 'releaseScrollWrite';
    var PLACEHOLDER_LAYOUT_READ = 'placeholderLayoutRead';
    var PLACEHOLDER_LAYOUT_WRITE = 'placeholderLayoutWrite';
    var PLACEHOLDER_RESIZE_WRITE = 'placeholderResizeWrite';
    var AUTO_SCROLL_READ = 'autoScrollRead';
    var AUTO_SCROLL_WRITE = 'autoScrollWrite';
    var DEBOUNCE_READ = 'debounceRead';
    var LANE_READ = 0;
    var LANE_READ_TAIL = 1;
    var LANE_WRITE = 2;
    var ticker = new Ticker(3);
    function addLayoutTick(itemId, read, write) {
        ticker.add(LANE_READ, LAYOUT_READ + itemId, read);
        ticker.add(LANE_WRITE, LAYOUT_WRITE + itemId, write);
    }
    function cancelLayoutTick(itemId) {
        ticker.remove(LANE_READ, LAYOUT_READ + itemId);
        ticker.remove(LANE_WRITE, LAYOUT_WRITE + itemId);
    }
    function addVisibilityTick(itemId, read, write) {
        ticker.add(LANE_READ, VISIBILITY_READ + itemId, read);
        ticker.add(LANE_WRITE, VISIBILITY_WRITE + itemId, write);
    }
    function cancelVisibilityTick(itemId) {
        ticker.remove(LANE_READ, VISIBILITY_READ + itemId);
        ticker.remove(LANE_WRITE, VISIBILITY_WRITE + itemId);
    }
    function addDragStartTick(itemId, read, write) {
        ticker.add(LANE_READ, DRAG_START_READ + itemId, read);
        ticker.add(LANE_WRITE, DRAG_START_WRITE + itemId, write);
    }
    function cancelDragStartTick(itemId) {
        ticker.remove(LANE_READ, DRAG_START_READ + itemId);
        ticker.remove(LANE_WRITE, DRAG_START_WRITE + itemId);
    }
    function addDragMoveTick(itemId, read, write) {
        ticker.add(LANE_READ, DRAG_MOVE_READ + itemId, read);
        ticker.add(LANE_WRITE, DRAG_MOVE_WRITE + itemId, write);
    }
    function cancelDragMoveTick(itemId) {
        ticker.remove(LANE_READ, DRAG_MOVE_READ + itemId);
        ticker.remove(LANE_WRITE, DRAG_MOVE_WRITE + itemId);
    }
    function addDragScrollTick(itemId, read, write) {
        ticker.add(LANE_READ, DRAG_SCROLL_READ + itemId, read);
        ticker.add(LANE_WRITE, DRAG_SCROLL_WRITE + itemId, write);
    }
    function cancelDragScrollTick(itemId) {
        ticker.remove(LANE_READ, DRAG_SCROLL_READ + itemId);
        ticker.remove(LANE_WRITE, DRAG_SCROLL_WRITE + itemId);
    }
    function addDragSortTick(itemId, read) {
        ticker.add(LANE_READ_TAIL, DRAG_SORT_READ + itemId, read);
    }
    function cancelDragSortTick(itemId) {
        ticker.remove(LANE_READ_TAIL, DRAG_SORT_READ + itemId);
    }
    function addReleaseScrollTick(itemId, read, write) {
        ticker.add(LANE_READ, RELEASE_SCROLL_READ + itemId, read);
        ticker.add(LANE_WRITE, RELEASE_SCROLL_WRITE + itemId, write);
    }
    function cancelReleaseScrollTick(itemId) {
        ticker.remove(LANE_READ, RELEASE_SCROLL_READ + itemId);
        ticker.remove(LANE_WRITE, RELEASE_SCROLL_WRITE + itemId);
    }
    function addPlaceholderLayoutTick(itemId, read, write) {
        ticker.add(LANE_READ, PLACEHOLDER_LAYOUT_READ + itemId, read);
        ticker.add(LANE_WRITE, PLACEHOLDER_LAYOUT_WRITE + itemId, write);
    }
    function cancelPlaceholderLayoutTick(itemId) {
        ticker.remove(LANE_READ, PLACEHOLDER_LAYOUT_READ + itemId);
        ticker.remove(LANE_WRITE, PLACEHOLDER_LAYOUT_WRITE + itemId);
    }
    function addPlaceholderResizeTick(itemId, write) {
        ticker.add(LANE_WRITE, PLACEHOLDER_RESIZE_WRITE + itemId, write);
    }
    function cancelPlaceholderResizeTick(itemId) {
        ticker.remove(LANE_WRITE, PLACEHOLDER_RESIZE_WRITE + itemId);
    }
    function addAutoScrollTick(read, write) {
        ticker.add(LANE_READ, AUTO_SCROLL_READ, read);
        ticker.add(LANE_WRITE, AUTO_SCROLL_WRITE, write);
    }
    function cancelAutoScrollTick() {
        ticker.remove(LANE_READ, AUTO_SCROLL_READ);
        ticker.remove(LANE_WRITE, AUTO_SCROLL_WRITE);
    }
    function addDebounceTick(debounceId, read) {
        ticker.add(LANE_READ, DEBOUNCE_READ + debounceId, read);
    }
    function cancelDebounceTick(debounceId) {
        ticker.remove(LANE_READ, DEBOUNCE_READ + debounceId);
    }

    var AXIS_X = 1;
    var AXIS_Y = 2;
    var FORWARD = 4;
    var BACKWARD = 8;
    var LEFT = AXIS_X | BACKWARD;
    var RIGHT = AXIS_X | FORWARD;
    var UP = AXIS_Y | BACKWARD;
    var DOWN = AXIS_Y | FORWARD;

    /**
     * Check if a value is a function.
     *
     * @param {*} val
     * @returns {boolean}
     */
    function isFunction(val) {
        return typeof val === 'function';
    }

    var cache$1 = new WeakMap();
    var cacheTimer = null;
    var canClearCache = true;
    var cacheTime = 1000;
    var clearCache = function () {
        if (canClearCache) {
            canClearCache = true;
            return;
        }
        if (cacheTimer !== null) {
            window.clearInterval(cacheTimer);
            cacheTimer = null;
        }
        cache$1 = new WeakMap();
    };
    /**
     * Returns the computed value of an element's style property as a string.
     *
     * @param {HTMLElement} element
     * @param {string} prop
     */
    function getStyle(element, prop) {
        if (!prop)
            return '';
        var styles = cache$1.get(element);
        if (!styles) {
            styles = window.getComputedStyle(element, null);
            cache$1.set(element, styles);
        }
        if (!cacheTimer) {
            cacheTimer = window.setInterval(clearCache, cacheTime);
        }
        else {
            canClearCache = false;
        }
        return styles.getPropertyValue(prop);
    }

    /**
     * Returns the computed value of an element's style property transformed into
     * a float value.
     *
     * @param {HTMLElement} el
     * @param {string} style
     * @returns {number}
     */
    function getStyleAsFloat(el, styleProp) {
        return parseFloat(getStyle(el, styleProp)) || 0;
    }

    var DOC_ELEM = document.documentElement;
    var BODY = document.body;
    var THRESHOLD_DATA = { value: 0, offset: 0 };

    /**
     * @param {HTMLElement|Window} element
     * @returns {HTMLElement|Window}
     */
    function getScrollElement(element) {
      if (element === window || element === DOC_ELEM || element === BODY) {
        return window;
      } else {
        return element;
      }
    }

    /**
     * @param {HTMLElement|Window} element
     * @returns {Number}
     */
    function getScrollLeft(element) {
      return element === window ? element.pageXOffset : element.scrollLeft;
    }

    /**
     * @param {HTMLElement|Window} element
     * @returns {Number}
     */
    function getScrollTop(element) {
      return element === window ? element.pageYOffset : element.scrollTop;
    }

    /**
     * @param {HTMLElement|Window} element
     * @returns {Number}
     */
    function getScrollLeftMax(element) {
      if (element === window) {
        return DOC_ELEM.scrollWidth - DOC_ELEM.clientWidth;
      } else {
        return element.scrollWidth - element.clientWidth;
      }
    }

    /**
     * @param {HTMLElement|Window} element
     * @returns {Number}
     */
    function getScrollTopMax(element) {
      if (element === window) {
        return DOC_ELEM.scrollHeight - DOC_ELEM.clientHeight;
      } else {
        return element.scrollHeight - element.clientHeight;
      }
    }

    /**
     * Get window's or element's client rectangle data relative to the element's
     * content dimensions (includes inner size + padding, excludes scrollbars,
     * borders and margins).
     *
     * @param {HTMLElement|Window} element
     * @returns {Rectangle}
     */
    function getContentRect(element, result) {
      result = result || {};

      if (element === window) {
        result.width = DOC_ELEM.clientWidth;
        result.height = DOC_ELEM.clientHeight;
        result.left = 0;
        result.right = result.width;
        result.top = 0;
        result.bottom = result.height;
      } else {
        var bcr = element.getBoundingClientRect();
        var borderLeft = element.clientLeft || getStyleAsFloat(element, 'border-left-width');
        var borderTop = element.clientTop || getStyleAsFloat(element, 'border-top-width');
        result.width = element.clientWidth;
        result.height = element.clientHeight;
        result.left = bcr.left + borderLeft;
        result.right = result.left + result.width;
        result.top = bcr.top + borderTop;
        result.bottom = result.top + result.height;
      }

      return result;
    }

    /**
     * @param {Item} item
     * @returns {Object}
     */
    function getItemAutoScrollSettings(item) {
      return item.getGrid()._settings.dragAutoScroll;
    }

    /**
     * @param {Item} item
     */
    function prepareItemScrollSync(item) {
      if (!item._drag) return;
      item._drag._prepareScroll();
    }

    /**
     * @param {Item} item
     */
    function applyItemScrollSync(item) {
      if (!item._drag || !item._isActive) return;
      var drag = item._drag;
      drag._scrollDiffX = drag._scrollDiffY = 0;
      item._setTranslate(drag._translateX, drag._translateY);
    }

    /**
     * Compute threshold value and edge offset.
     *
     * @param {Number} threshold
     * @param {Number} safeZone
     * @param {Number} itemSize
     * @param {Number} targetSize
     * @returns {Object}
     */
    function computeThreshold(threshold, safeZone, itemSize, targetSize) {
      THRESHOLD_DATA.value = Math.min(targetSize / 2, threshold);
      THRESHOLD_DATA.offset =
        Math.max(0, itemSize + THRESHOLD_DATA.value * 2 + targetSize * safeZone - targetSize) / 2;
      return THRESHOLD_DATA;
    }

    function ScrollRequest() {
      this.reset();
    }

    ScrollRequest.prototype.reset = function () {
      if (this.isActive) this.onStop();
      this.item = null;
      this.element = null;
      this.isActive = false;
      this.isEnding = false;
      this.direction = null;
      this.value = null;
      this.maxValue = 0;
      this.threshold = 0;
      this.distance = 0;
      this.speed = 0;
      this.duration = 0;
      this.action = null;
    };

    ScrollRequest.prototype.hasReachedEnd = function () {
      return FORWARD & this.direction ? this.value >= this.maxValue : this.value <= 0;
    };

    ScrollRequest.prototype.computeCurrentScrollValue = function () {
      if (this.value === null) {
        return AXIS_X & this.direction ? getScrollLeft(this.element) : getScrollTop(this.element);
      }
      return Math.max(0, Math.min(this.value, this.maxValue));
    };

    ScrollRequest.prototype.computeNextScrollValue = function (deltaTime) {
      var delta = this.speed * (deltaTime / 1000);
      var nextValue = FORWARD & this.direction ? this.value + delta : this.value - delta;
      return Math.max(0, Math.min(nextValue, this.maxValue));
    };

    ScrollRequest.prototype.computeSpeed = (function () {
      var data = {
        direction: null,
        threshold: 0,
        distance: 0,
        value: 0,
        maxValue: 0,
        deltaTime: 0,
        duration: 0,
        isEnding: false,
      };

      return function (deltaTime) {
        var item = this.item;
        var speed = getItemAutoScrollSettings(item).speed;

        if (isFunction(speed)) {
          data.direction = this.direction;
          data.threshold = this.threshold;
          data.distance = this.distance;
          data.value = this.value;
          data.maxValue = this.maxValue;
          data.duration = this.duration;
          data.speed = this.speed;
          data.deltaTime = deltaTime;
          data.isEnding = this.isEnding;
          return speed(item, this.element, data);
        } else {
          return speed;
        }
      };
    })();

    ScrollRequest.prototype.tick = function (deltaTime) {
      if (!this.isActive) {
        this.isActive = true;
        this.onStart();
      }
      this.value = this.computeCurrentScrollValue();
      this.speed = this.computeSpeed(deltaTime);
      this.value = this.computeNextScrollValue(deltaTime);
      this.duration += deltaTime;
      return this.value;
    };

    ScrollRequest.prototype.onStart = function () {
      var item = this.item;
      var onStart = getItemAutoScrollSettings(item).onStart;
      if (isFunction(onStart)) onStart(item, this.element, this.direction);
    };

    ScrollRequest.prototype.onStop = function () {
      var item = this.item;
      var onStop = getItemAutoScrollSettings(item).onStop;
      if (isFunction(onStop)) onStop(item, this.element, this.direction);
      // Manually nudge sort to happen. There's a good chance that the item is still
      // after the scroll stops which means that the next sort will be triggered
      // only after the item is moved or it's parent scrolled.
      if (item._drag) item._drag.sort();
    };

    function ScrollAction() {
      this.element = null;
      this.requestX = null;
      this.requestY = null;
      this.scrollLeft = 0;
      this.scrollTop = 0;
    }

    ScrollAction.prototype.reset = function () {
      if (this.requestX) this.requestX.action = null;
      if (this.requestY) this.requestY.action = null;
      this.element = null;
      this.requestX = null;
      this.requestY = null;
      this.scrollLeft = 0;
      this.scrollTop = 0;
    };

    ScrollAction.prototype.addRequest = function (request) {
      if (AXIS_X & request.direction) {
        this.removeRequest(this.requestX);
        this.requestX = request;
      } else {
        this.removeRequest(this.requestY);
        this.requestY = request;
      }
      request.action = this;
    };

    ScrollAction.prototype.removeRequest = function (request) {
      if (!request) return;
      if (this.requestX === request) {
        this.requestX = null;
        request.action = null;
      } else if (this.requestY === request) {
        this.requestY = null;
        request.action = null;
      }
    };

    ScrollAction.prototype.computeScrollValues = function () {
      this.scrollLeft = this.requestX ? this.requestX.value : getScrollLeft(this.element);
      this.scrollTop = this.requestY ? this.requestY.value : getScrollTop(this.element);
    };

    ScrollAction.prototype.scroll = function () {
      var element = this.element;
      if (!element) return;

      if (element.scrollTo) {
        element.scrollTo(this.scrollLeft, this.scrollTop);
      } else {
        element.scrollLeft = this.scrollLeft;
        element.scrollTop = this.scrollTop;
      }
    };

    function Pool(createItem, releaseItem) {
      this.pool = [];
      this.createItem = createItem;
      this.releaseItem = releaseItem;
    }

    Pool.prototype.pick = function () {
      return this.pool.pop() || this.createItem();
    };

    Pool.prototype.release = function (item) {
      this.releaseItem(item);
      if (this.pool.indexOf(item) !== -1) return;
      this.pool.push(item);
    };

    Pool.prototype.reset = function () {
      this.pool.length = 0;
    };

    /**
     * Check if two rectangles are overlapping.
     *
     * @param {Object} a
     * @param {Object} b
     * @returns {boolean}
     */
    function isOverlapping(a, b) {
        return !(a.left + a.width <= b.left ||
            b.left + b.width <= a.left ||
            a.top + a.height <= b.top ||
            b.top + b.height <= a.top);
    }

    /**
     * Calculate intersection area between two rectangle.
     *
     * @param {Object} a
     * @param {Object} b
     * @returns {number}
     */
    function getIntersectionArea(a, b) {
        if (!isOverlapping(a, b))
            return 0;
        var width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        var height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        return width * height;
    }

    /**
     * Calculate how many percent the intersection area of two rectangles is from
     * the maximum potential intersection area between the rectangles.
     *
     * @param {Object} a
     * @param {Object} b
     * @returns {number}
     */
    function getIntersectionScore(a, b) {
        var area = getIntersectionArea(a, b);
        if (!area)
            return 0;
        var maxArea = Math.min(a.width, b.width) * Math.min(a.height, b.height);
        return (area / maxArea) * 100;
    }

    var RECT_1 = {
      width: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };

    var RECT_2 = {
      width: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };

    function AutoScroller() {
      this._isDestroyed = false;
      this._isTicking = false;
      this._tickTime = 0;
      this._tickDeltaTime = 0;
      this._items = [];
      this._actions = [];
      this._requests = {};
      this._requests[AXIS_X] = {};
      this._requests[AXIS_Y] = {};
      this._requestOverlapCheck = {};
      this._dragPositions = {};
      this._dragDirections = {};
      this._overlapCheckInterval = 150;

      this._requestPool = new Pool(
        function () {
          return new ScrollRequest();
        },
        function (request) {
          request.reset();
        }
      );

      this._actionPool = new Pool(
        function () {
          return new ScrollAction();
        },
        function (action) {
          action.reset();
        }
      );

      this._readTick = this._readTick.bind(this);
      this._writeTick = this._writeTick.bind(this);
    }

    AutoScroller.AXIS_X = AXIS_X;
    AutoScroller.AXIS_Y = AXIS_Y;
    AutoScroller.FORWARD = FORWARD;
    AutoScroller.BACKWARD = BACKWARD;
    AutoScroller.LEFT = LEFT;
    AutoScroller.RIGHT = RIGHT;
    AutoScroller.UP = UP;
    AutoScroller.DOWN = DOWN;

    AutoScroller.smoothSpeed = function (maxSpeed, acceleration, deceleration) {
      return function (item, element, data) {
        var targetSpeed = 0;
        if (!data.isEnding) {
          if (data.threshold > 0) {
            var factor = data.threshold - Math.max(0, data.distance);
            targetSpeed = (maxSpeed / data.threshold) * factor;
          } else {
            targetSpeed = maxSpeed;
          }
        }

        var currentSpeed = data.speed;
        var nextSpeed = targetSpeed;

        if (currentSpeed === targetSpeed) {
          return nextSpeed;
        }

        if (currentSpeed < targetSpeed) {
          nextSpeed = currentSpeed + acceleration * (data.deltaTime / 1000);
          return Math.min(targetSpeed, nextSpeed);
        } else {
          nextSpeed = currentSpeed - deceleration * (data.deltaTime / 1000);
          return Math.max(targetSpeed, nextSpeed);
        }
      };
    };

    AutoScroller.pointerHandle = function (pointerSize) {
      var rect = { left: 0, top: 0, width: 0, height: 0 };
      var size = pointerSize || 1;
      return function (item, x, y, w, h, pX, pY) {
        rect.left = pX - size * 0.5;
        rect.top = pY - size * 0.5;
        rect.width = size;
        rect.height = size;
        return rect;
      };
    };

    AutoScroller.prototype._readTick = function (time) {
      if (this._isDestroyed) return;
      if (time && this._tickTime) {
        this._tickDeltaTime = time - this._tickTime;
        this._tickTime = time;
        this._updateRequests();
        this._updateActions();
      } else {
        this._tickTime = time;
        this._tickDeltaTime = 0;
      }
    };

    AutoScroller.prototype._writeTick = function () {
      if (this._isDestroyed) return;
      this._applyActions();
      addAutoScrollTick(this._readTick, this._writeTick);
    };

    AutoScroller.prototype._startTicking = function () {
      this._isTicking = true;
      addAutoScrollTick(this._readTick, this._writeTick);
    };

    AutoScroller.prototype._stopTicking = function () {
      this._isTicking = false;
      this._tickTime = 0;
      this._tickDeltaTime = 0;
      cancelAutoScrollTick();
    };

    AutoScroller.prototype._getItemHandleRect = function (item, handle, rect) {
      var itemDrag = item._drag;

      if (handle) {
        var ev = itemDrag._dragMoveEvent || itemDrag._dragStartEvent;
        var data = handle(
          item,
          itemDrag._clientX,
          itemDrag._clientY,
          item._width,
          item._height,
          ev.clientX,
          ev.clientY
        );
        rect.left = data.left;
        rect.top = data.top;
        rect.width = data.width;
        rect.height = data.height;
      } else {
        rect.left = itemDrag._clientX;
        rect.top = itemDrag._clientY;
        rect.width = item._width;
        rect.height = item._height;
      }

      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;

      return rect;
    };

    AutoScroller.prototype._requestItemScroll = function (
      item,
      axis,
      element,
      direction,
      threshold,
      distance,
      maxValue
    ) {
      var reqMap = this._requests[axis];
      var request = reqMap[item._id];

      if (request) {
        if (request.element !== element || request.direction !== direction) {
          request.reset();
        }
      } else {
        request = this._requestPool.pick();
      }

      request.item = item;
      request.element = element;
      request.direction = direction;
      request.threshold = threshold;
      request.distance = distance;
      request.maxValue = maxValue;
      reqMap[item._id] = request;
    };

    AutoScroller.prototype._cancelItemScroll = function (item, axis) {
      var reqMap = this._requests[axis];
      var request = reqMap[item._id];
      if (!request) return;
      if (request.action) request.action.removeRequest(request);
      this._requestPool.release(request);
      delete reqMap[item._id];
    };

    AutoScroller.prototype._checkItemOverlap = function (item, checkX, checkY) {
      var settings = getItemAutoScrollSettings(item);
      var targets = isFunction(settings.targets) ? settings.targets(item) : settings.targets;
      var threshold = settings.threshold;
      var safeZone = settings.safeZone;

      if (!targets || !targets.length) {
        checkX && this._cancelItemScroll(item, AXIS_X);
        checkY && this._cancelItemScroll(item, AXIS_Y);
        return;
      }

      var dragDirections = this._dragDirections[item._id];
      var dragDirectionX = dragDirections[0];
      var dragDirectionY = dragDirections[1];

      if (!dragDirectionX && !dragDirectionY) {
        checkX && this._cancelItemScroll(item, AXIS_X);
        checkY && this._cancelItemScroll(item, AXIS_Y);
        return;
      }

      var itemRect = this._getItemHandleRect(item, settings.handle, RECT_1);
      var testRect = RECT_2;

      var target = null;
      var testElement = null;
      var testAxisX = true;
      var testAxisY = true;
      var testScore = 0;
      var testPriority = 0;
      var testThreshold = null;
      var testDirection = null;
      var testDistance = 0;
      var testMaxScrollX = 0;
      var testMaxScrollY = 0;

      var xElement = null;
      var xPriority = -Infinity;
      var xThreshold = 0;
      var xScore = 0;
      var xDirection = null;
      var xDistance = 0;
      var xMaxScroll = 0;

      var yElement = null;
      var yPriority = -Infinity;
      var yThreshold = 0;
      var yScore = 0;
      var yDirection = null;
      var yDistance = 0;
      var yMaxScroll = 0;

      for (var i = 0; i < targets.length; i++) {
        target = targets[i];
        testAxisX = checkX && dragDirectionX && target.axis !== AXIS_Y;
        testAxisY = checkY && dragDirectionY && target.axis !== AXIS_X;
        testPriority = target.priority || 0;

        // Ignore this item if it's x-axis and y-axis priority is lower than
        // the currently matching item's.
        if ((!testAxisX || testPriority < xPriority) && (!testAxisY || testPriority < yPriority)) {
          continue;
        }

        testElement = getScrollElement(target.element || target);
        testMaxScrollX = testAxisX ? getScrollLeftMax(testElement) : -1;
        testMaxScrollY = testAxisY ? getScrollTopMax(testElement) : -1;

        // Ignore this item if there is no possibility to scroll.
        if (!testMaxScrollX && !testMaxScrollY) continue;

        testRect = getContentRect(testElement, testRect);
        testScore = getIntersectionScore(itemRect, testRect);

        // Ignore this item if it's not overlapping at all with the dragged item.
        if (testScore <= 0) continue;

        // Test x-axis.
        if (
          testAxisX &&
          testPriority >= xPriority &&
          testMaxScrollX > 0 &&
          (testPriority > xPriority || testScore > xScore)
        ) {
          testDirection = null;
          testThreshold = computeThreshold(
            typeof target.threshold === 'number' ? target.threshold : threshold,
            safeZone,
            itemRect.width,
            testRect.width
          );
          if (dragDirectionX === RIGHT) {
            testDistance = testRect.right + testThreshold.offset - itemRect.right;
            if (testDistance <= testThreshold.value && getScrollLeft(testElement) < testMaxScrollX) {
              testDirection = RIGHT;
            }
          } else if (dragDirectionX === LEFT) {
            testDistance = itemRect.left - (testRect.left - testThreshold.offset);
            if (testDistance <= testThreshold.value && getScrollLeft(testElement) > 0) {
              testDirection = LEFT;
            }
          }

          if (testDirection !== null) {
            xElement = testElement;
            xPriority = testPriority;
            xThreshold = testThreshold.value;
            xScore = testScore;
            xDirection = testDirection;
            xDistance = testDistance;
            xMaxScroll = testMaxScrollX;
          }
        }

        // Test y-axis.
        if (
          testAxisY &&
          testPriority >= yPriority &&
          testMaxScrollY > 0 &&
          (testPriority > yPriority || testScore > yScore)
        ) {
          testDirection = null;
          testThreshold = computeThreshold(
            typeof target.threshold === 'number' ? target.threshold : threshold,
            safeZone,
            itemRect.height,
            testRect.height
          );
          if (dragDirectionY === DOWN) {
            testDistance = testRect.bottom + testThreshold.offset - itemRect.bottom;
            if (testDistance <= testThreshold.value && getScrollTop(testElement) < testMaxScrollY) {
              testDirection = DOWN;
            }
          } else if (dragDirectionY === UP) {
            testDistance = itemRect.top - (testRect.top - testThreshold.offset);
            if (testDistance <= testThreshold.value && getScrollTop(testElement) > 0) {
              testDirection = UP;
            }
          }

          if (testDirection !== null) {
            yElement = testElement;
            yPriority = testPriority;
            yThreshold = testThreshold.value;
            yScore = testScore;
            yDirection = testDirection;
            yDistance = testDistance;
            yMaxScroll = testMaxScrollY;
          }
        }
      }

      // Request or cancel x-axis scroll.
      if (checkX) {
        if (xElement) {
          this._requestItemScroll(
            item,
            AXIS_X,
            xElement,
            xDirection,
            xThreshold,
            xDistance,
            xMaxScroll
          );
        } else {
          this._cancelItemScroll(item, AXIS_X);
        }
      }

      // Request or cancel y-axis scroll.
      if (checkY) {
        if (yElement) {
          this._requestItemScroll(
            item,
            AXIS_Y,
            yElement,
            yDirection,
            yThreshold,
            yDistance,
            yMaxScroll
          );
        } else {
          this._cancelItemScroll(item, AXIS_Y);
        }
      }
    };

    AutoScroller.prototype._updateScrollRequest = function (scrollRequest) {
      var item = scrollRequest.item;
      var settings = getItemAutoScrollSettings(item);
      var targets = isFunction(settings.targets) ? settings.targets(item) : settings.targets;
      var targetCount = (targets && targets.length) || 0;
      var threshold = settings.threshold;
      var safeZone = settings.safeZone;
      var itemRect = this._getItemHandleRect(item, settings.handle, RECT_1);
      var testRect = RECT_2;
      var target = null;
      var testElement = null;
      var testIsAxisX = false;
      var testScore = null;
      var testThreshold = null;
      var testDistance = null;
      var testScroll = null;
      var testMaxScroll = null;
      var hasReachedEnd = null;

      for (var i = 0; i < targetCount; i++) {
        target = targets[i];

        // Make sure we have a matching element.
        testElement = getScrollElement(target.element || target);
        if (testElement !== scrollRequest.element) continue;

        // Make sure we have a matching axis.
        testIsAxisX = !!(AXIS_X & scrollRequest.direction);
        if (testIsAxisX) {
          if (target.axis === AXIS_Y) continue;
        } else {
          if (target.axis === AXIS_X) continue;
        }

        // Stop scrolling if there is no room to scroll anymore.
        testMaxScroll = testIsAxisX ? getScrollLeftMax(testElement) : getScrollTopMax(testElement);
        if (testMaxScroll <= 0) {
          break;
        }

        testRect = getContentRect(testElement, testRect);
        testScore = getIntersectionScore(itemRect, testRect);

        // Stop scrolling if dragged item is not overlapping with the scroll
        // element anymore.
        if (testScore <= 0) {
          break;
        }

        // Compute threshold and edge offset.
        testThreshold = computeThreshold(
          typeof target.threshold === 'number' ? target.threshold : threshold,
          safeZone,
          testIsAxisX ? itemRect.width : itemRect.height,
          testIsAxisX ? testRect.width : testRect.height
        );

        // Compute distance (based on current direction).
        if (scrollRequest.direction === LEFT) {
          testDistance = itemRect.left - (testRect.left - testThreshold.offset);
        } else if (scrollRequest.direction === RIGHT) {
          testDistance = testRect.right + testThreshold.offset - itemRect.right;
        } else if (scrollRequest.direction === UP) {
          testDistance = itemRect.top - (testRect.top - testThreshold.offset);
        } else {
          testDistance = testRect.bottom + testThreshold.offset - itemRect.bottom;
        }

        // Stop scrolling if threshold is not exceeded.
        if (testDistance > testThreshold.value) {
          break;
        }

        // Stop scrolling if we have reached the end of the scroll value.
        testScroll = testIsAxisX ? getScrollLeft(testElement) : getScrollTop(testElement);
        hasReachedEnd =
          FORWARD & scrollRequest.direction ? testScroll >= testMaxScroll : testScroll <= 0;
        if (hasReachedEnd) {
          break;
        }

        // Scrolling can continue, let's update the values.
        scrollRequest.maxValue = testMaxScroll;
        scrollRequest.threshold = testThreshold.value;
        scrollRequest.distance = testDistance;
        scrollRequest.isEnding = false;
        return true;
      }

      // Before we end the request, let's see if we need to stop the scrolling
      // smoothly or immediately.
      if (settings.smoothStop === true && scrollRequest.speed > 0) {
        if (hasReachedEnd === null) hasReachedEnd = scrollRequest.hasReachedEnd();
        scrollRequest.isEnding = hasReachedEnd ? false : true;
      } else {
        scrollRequest.isEnding = false;
      }

      return scrollRequest.isEnding;
    };

    AutoScroller.prototype._updateRequests = function () {
      var items = this._items;
      var requestsX = this._requests[AXIS_X];
      var requestsY = this._requests[AXIS_Y];
      var item, reqX, reqY, checkTime, needsCheck, checkX, checkY;

      for (var i = 0; i < items.length; i++) {
        item = items[i];
        checkTime = this._requestOverlapCheck[item._id];
        needsCheck = checkTime > 0 && this._tickTime - checkTime > this._overlapCheckInterval;

        checkX = true;
        reqX = requestsX[item._id];
        if (reqX && reqX.isActive) {
          checkX = !this._updateScrollRequest(reqX);
          if (checkX) {
            needsCheck = true;
            this._cancelItemScroll(item, AXIS_X);
          }
        }

        checkY = true;
        reqY = requestsY[item._id];
        if (reqY && reqY.isActive) {
          checkY = !this._updateScrollRequest(reqY);
          if (checkY) {
            needsCheck = true;
            this._cancelItemScroll(item, AXIS_Y);
          }
        }

        if (needsCheck) {
          this._requestOverlapCheck[item._id] = 0;
          this._checkItemOverlap(item, checkX, checkY);
        }
      }
    };

    AutoScroller.prototype._requestAction = function (request, axis) {
      var actions = this._actions;
      var isAxisX = axis === AXIS_X;
      var action = null;

      for (var i = 0; i < actions.length; i++) {
        action = actions[i];

        // If the action's request does not match the request's -> skip.
        if (request.element !== action.element) {
          action = null;
          continue;
        }

        // If the request and action share the same element, but the request slot
        // for the requested axis is already reserved let's ignore and cancel this
        // request.
        if (isAxisX ? action.requestX : action.requestY) {
          this._cancelItemScroll(request.item, axis);
          return;
        }

        // Seems like we have found our action, let's break the loop.
        break;
      }

      if (!action) action = this._actionPool.pick();
      action.element = request.element;
      action.addRequest(request);

      request.tick(this._tickDeltaTime);
      actions.push(action);
    };

    AutoScroller.prototype._updateActions = function () {
      var items = this._items;
      var requests = this._requests;
      var actions = this._actions;
      var itemId;
      var reqX;
      var reqY;
      var i;

      // Generate actions.
      for (i = 0; i < items.length; i++) {
        itemId = items[i]._id;
        reqX = requests[AXIS_X][itemId];
        reqY = requests[AXIS_Y][itemId];
        if (reqX) this._requestAction(reqX, AXIS_X);
        if (reqY) this._requestAction(reqY, AXIS_Y);
      }

      // Compute actions' scroll values.
      for (i = 0; i < actions.length; i++) {
        actions[i].computeScrollValues();
      }
    };

    AutoScroller.prototype._applyActions = function () {
      var actions = this._actions;
      var items = this._items;
      var i;

      // No actions -> no scrolling.
      if (!actions.length) return;

      // Scroll all the required elements.
      for (i = 0; i < actions.length; i++) {
        actions[i].scroll();
        this._actionPool.release(actions[i]);
      }

      // Reset actions.
      actions.length = 0;

      // Sync the item position immediately after all the auto-scrolling business is
      // finished. Without this procedure the items will jitter during auto-scroll
      // (in some cases at least) since the drag scroll handler is async (bound to
      // raf tick). Note that this procedure should not emit any dragScroll events,
      // because otherwise they would be emitted twice for the same event.
      for (i = 0; i < items.length; i++) prepareItemScrollSync(items[i]);
      for (i = 0; i < items.length; i++) applyItemScrollSync(items[i]);
    };

    AutoScroller.prototype._updateDragDirection = function (item) {
      var dragPositions = this._dragPositions[item._id];
      var dragDirections = this._dragDirections[item._id];
      var x1 = item._drag._translateX;
      var y1 = item._drag._translateY;
      if (dragPositions.length) {
        var x2 = dragPositions[0];
        var y2 = dragPositions[1];
        dragDirections[0] = x1 > x2 ? RIGHT : x1 < x2 ? LEFT : dragDirections[0] || 0;
        dragDirections[1] = y1 > y2 ? DOWN : y1 < y2 ? UP : dragDirections[1] || 0;
      }
      dragPositions[0] = x1;
      dragPositions[1] = y1;
    };

    AutoScroller.prototype.addItem = function (item) {
      if (this._isDestroyed) return;
      var index = this._items.indexOf(item);
      if (index === -1) {
        this._items.push(item);
        this._requestOverlapCheck[item._id] = this._tickTime;
        this._dragDirections[item._id] = [0, 0];
        this._dragPositions[item._id] = [];
        if (!this._isTicking) this._startTicking();
      }
    };

    AutoScroller.prototype.updateItem = function (item) {
      if (this._isDestroyed) return;

      // Make sure the item still exists in the auto-scroller.
      if (!this._dragDirections[item._id]) return;

      this._updateDragDirection(item);
      if (!this._requestOverlapCheck[item._id]) {
        this._requestOverlapCheck[item._id] = this._tickTime;
      }
    };

    AutoScroller.prototype.removeItem = function (item) {
      if (this._isDestroyed) return;

      var index = this._items.indexOf(item);
      if (index === -1) return;

      var itemId = item._id;

      var reqX = this._requests[AXIS_X][itemId];
      if (reqX) {
        this._cancelItemScroll(item, AXIS_X);
        delete this._requests[AXIS_X][itemId];
      }

      var reqY = this._requests[AXIS_Y][itemId];
      if (reqY) {
        this._cancelItemScroll(item, AXIS_Y);
        delete this._requests[AXIS_Y][itemId];
      }

      delete this._requestOverlapCheck[itemId];
      delete this._dragPositions[itemId];
      delete this._dragDirections[itemId];
      this._items.splice(index, 1);

      if (this._isTicking && !this._items.length) {
        this._stopTicking();
      }
    };

    AutoScroller.prototype.isItemScrollingX = function (item) {
      var reqX = this._requests[AXIS_X][item._id];
      return !!(reqX && reqX.isActive);
    };

    AutoScroller.prototype.isItemScrollingY = function (item) {
      var reqY = this._requests[AXIS_Y][item._id];
      return !!(reqY && reqY.isActive);
    };

    AutoScroller.prototype.isItemScrolling = function (item) {
      return this.isItemScrollingX(item) || this.isItemScrollingY(item);
    };

    AutoScroller.prototype.destroy = function () {
      if (this._isDestroyed) return;

      var items = this._items.slice(0);
      for (var i = 0; i < items.length; i++) {
        this.removeItem(items[i]);
      }

      this._actions.length = 0;
      this._requestPool.reset();
      this._actionPool.reset();

      this._isDestroyed = true;
    };

    /**
     * Add class to an element.
     *
     * @param {HTMLElement} element
     * @param {string} className
     */
    function addClass(element, className) {
        className && element.classList.add(className);
    }

    /**
     * Insert an item or an array of items to array to a specified index. Mutates
     * the array. The index can be negative in which case the items will be added
     * to the end of the array.
     *
     * @param {Array} array
     * @param {*} items
     * @param {number} [index=-1]
     */
    function arrayInsert(array, items, index) {
        if (index === void 0) { index = -1; }
        if (index < 0)
            index = array.length - index + 1;
        Array.isArray(items) ? array.splice.apply(array, __spreadArrays([index, 0], items)) : array.splice(index, 0, items);
    }

    /**
     * Normalize array index. Basically this function makes sure that the provided
     * array index is within the bounds of the provided array and also transforms
     * negative index to the matching positive index. The third (optional) argument
     * allows you to define offset for array's length in case you are adding items
     * to the array or removing items from the array.
     *
     * @param {Array} array
     * @param {number} index
     * @param {number} [sizeOffset=0]
     * @returns {number}
     */
    function normalizeArrayIndex(array, index, sizeOffset) {
        if (sizeOffset === void 0) { sizeOffset = 0; }
        var maxIndex = Math.max(0, array.length - 1 + sizeOffset);
        return index > maxIndex ? maxIndex : index < 0 ? Math.max(maxIndex + index + 1, 0) : index;
    }

    /**
     * Move array item to another index.
     *
     * @param {Array} array
     * @param {number} fromIndex
     *   - Index (positive or negative) of the item that will be moved.
     * @param {number} toIndex
     *   - Index (positive or negative) where the item should be moved to.
     */
    function arrayMove(array, fromIndex, toIndex) {
        // Make sure the array has two or more items.
        if (array.length < 2)
            return;
        // Normalize the indices.
        var from = normalizeArrayIndex(array, fromIndex);
        var to = normalizeArrayIndex(array, toIndex);
        // Add target item to the new position.
        if (from !== to) {
            array.splice(to, 0, array.splice(from, 1)[0]);
        }
    }

    /**
     * Swap array items.
     *
     * @param {Array} array
     * @param {number} index
     *   - Index (positive or negative) of the item that will be swapped.
     * @param {number} withIndex
     *   - Index (positive or negative) of the other item that will be swapped.
     */
    function arraySwap(array, index, withIndex) {
        // Make sure the array has two or more items.
        if (array.length < 2)
            return;
        // Normalize the indices.
        var indexA = normalizeArrayIndex(array, index);
        var indexB = normalizeArrayIndex(array, withIndex);
        // Swap the items.
        if (indexA !== indexB) {
            var temp = array[indexA];
            array[indexA] = array[indexB];
            array[indexB] = temp;
        }
    }

    var transformProp = getPrefixedPropName(document.documentElement.style, 'transform') || 'transform';

    var styleNameRegEx = /([A-Z])/g;
    var prefixRegex = /^(webkit-|moz-|ms-|o-)/;
    var msPrefixRegex = /^(-m-s-)/;
    /**
     * Transforms a camel case style property to kebab case style property. Handles
     * vendor prefixed properties elegantly as well, e.g. "WebkitTransform" and
     * "webkitTransform" are both transformed into "-webkit-transform".
     *
     * @param {string} property
     * @returns {string}
     */
    function getStyleName(styleProp) {
        // Initial slicing, turns "fooBarProp" into "foo-bar-prop".
        var styleName = styleProp.replace(styleNameRegEx, '-$1').toLowerCase();
        // Handle properties that start with "webkit", "moz", "ms" or "o" prefix (we
        // need to add an extra '-' to the beginnig).
        styleName = styleName.replace(prefixRegex, '-$1');
        // Handle properties that start with "MS" prefix (we need to transform the
        // "-m-s-" into "-ms-").
        styleName = styleName.replace(msPrefixRegex, '-ms-');
        return styleName;
    }

    var transformStyle = getStyleName(transformProp);

    var transformNone = 'none';
    var displayInline = 'inline';
    var displayNone = 'none';
    var displayStyle = 'display';
    /**
     * Returns true if element is transformed, false if not. In practice the
     * element's display value must be anything else than "none" or "inline" as
     * well as have a valid transform value applied in order to be counted as a
     * transformed element. Borrowed from Mezr (v0.6.1):
     * https://github.com/niklasramo/mezr/blob/0.6.1/mezr.js#L661
     *
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    function isTransformed(element) {
        var transform = getStyle(element, transformStyle);
        if (!transform || transform === transformNone)
            return false;
        var display = getStyle(element, displayStyle);
        if (display === displayInline || display === displayNone)
            return false;
        return true;
    }

    /**
     * Returns an absolute positioned element's containing block, which is
     * considered to be the closest ancestor element that the target element's
     * positioning is relative to. Disclaimer: this only works as intended for
     * absolute positioned elements.
     *
     * @param {HTMLElement} element
     * @returns {(Document|Element)}
     */
    function getContainingBlock(element) {
        // As long as the containing block is an element, static and not
        // transformed, try to get the element's parent element and fallback to
        // document. https://github.com/niklasramo/mezr/blob/0.6.1/mezr.js#L339
        var res = element || document;
        while (res &&
            res !== document &&
            getStyle(res, 'position') === 'static' &&
            !isTransformed(res)) {
            res = res.parentElement || document;
        }
        return res;
    }

    var offsetA = { left: 0, top: 0 };
    var offsetB = { left: 0, top: 0 };
    var offsetDiff = { left: 0, top: 0 };
    /**
     * Returns the element's document offset, which in practice means the vertical
     * and horizontal distance between the element's northwest corner and the
     * document's northwest corner. Note that this function always returns the same
     * object so be sure to read the data from it instead using it as a reference.
     *
     * @param {(HTMLElement|Document|Window)} element
     * @param {Object} [offsetData]
     *   - Optional data object where the offset data will be inserted to. If not
     *     provided a new object will be created for the return data.
     * @returns {Object}
     */
    function getOffset(element, offset) {
        if (offset === void 0) { offset = { left: 0, top: 0 }; }
        // Set up return data.
        offset.left = 0;
        offset.top = 0;
        // Document's offsets are always 0.
        if (element === document)
            return offset;
        // Add viewport scroll left/top to the respective offsets.
        offset.left = window.pageXOffset || 0;
        offset.top = window.pageYOffset || 0;
        // Window's offsets are the viewport scroll left/top values.
        if ('self' in element && element.self === window.self)
            return offset;
        // Add element's client rects to the offsets.
        var _a = element.getBoundingClientRect(), left = _a.left, top = _a.top;
        offset.left += left;
        offset.top += top;
        // Exclude element's borders from the offset.
        offset.left += getStyleAsFloat(element, 'border-left-width');
        offset.top += getStyleAsFloat(element, 'border-top-width');
        return offset;
    }
    /**
     * Calculate the offset difference two elements.
     * @param {(HTMLElement|Document)} elemA
     * @param {(HTMLElement|Document)} elemB
     * @param {boolean} [compareContainingBlocks=false]
     *   - When this is set to true the containing blocks of the provided elements
     *     will be used for calculating the difference. Otherwise the provided
     *     elements will be compared directly.
     * @returns {object}
     */
    function getOffsetDiff(elemA, elemB, compareContainingBlocks) {
        if (compareContainingBlocks === void 0) { compareContainingBlocks = false; }
        offsetDiff.left = 0;
        offsetDiff.top = 0;
        // If elements are same let's return early.
        if (elemA === elemB)
            return offsetDiff;
        // Compare containing blocks if necessary.
        if (compareContainingBlocks) {
            elemA = getContainingBlock(elemA);
            elemB = getContainingBlock(elemB);
            // If containing blocks are identical, let's return early.
            if (elemA === elemB)
                return offsetDiff;
        }
        // Finally, let's calculate the offset diff.
        getOffset(elemA, offsetA);
        getOffset(elemB, offsetB);
        offsetDiff.left = offsetB.left - offsetA.left;
        offsetDiff.top = offsetB.top - offsetA.top;
        return offsetDiff;
    }

    /**
     * Remove class from an element.
     *
     * @param {HTMLElement} element
     * @param {string} className
     */
    function removeClass(element, className) {
        className && element.classList.remove(className);
    }

    var START_PREDICATE_INACTIVE = 0;
    var START_PREDICATE_PENDING = 1;
    var START_PREDICATE_RESOLVED = 2;
    var SCROLL_LISTENER_OPTIONS = HAS_PASSIVE_EVENTS ? { capture: true, passive: true } : true;
    var RECT_A = { left: 0, top: 0, width: 0, height: 0 };
    var RECT_B = { left: 0, top: 0, width: 0, height: 0 };
    /**
     * Default drag start predicate handler that handles anchor elements
     * gracefully. The return value of this function defines if the drag is
     * started, rejected or pending. When true is returned the dragging is started
     * and when false is returned the dragging is rejected. If nothing is returned
     * the predicate will be called again on the next drag movement.
     *
     * @param {Item} item
     * @param {Object} event
     * @param {Object} [options]
     *   - An optional options object which can be used to pass the predicate
     *     it's options manually. By default the predicate retrieves the options
     *     from the grid's settings.
     * @returns {(boolean|undefined)}
     */
    var defaultStartPredicate = function (item, event, options) {
        if (event.isFinal)
            return;
        var drag = item._drag;
        // Reject the predicate if left button is not pressed on mouse during first
        // event.
        if (event.isFirst && event.srcEvent.button) {
            drag._resetDefaultStartPredicate();
            return false;
        }
        // If the start event is trusted, non-cancelable and it's default action has
        // not been prevented it is in most cases a sign that the gesture would be
        // cancelled anyways right after it has started (e.g. starting drag while
        // the page is scrolling). So let's reject the predicate in this case.
        if (!IS_IOS &&
            event.isFirst &&
            event.srcEvent.isTrusted === true &&
            event.srcEvent.defaultPrevented === false &&
            event.srcEvent.cancelable === false) {
            drag._resetDefaultStartPredicate();
            return false;
        }
        // Setup predicate data from options if not already set.
        var predicate = drag._startPredicateData;
        if (!predicate) {
            predicate = drag._startPredicateData = { distance: 0, delay: 0 };
            var config = options || item.getGrid()._settings.dragStartPredicate;
            if (typeof config == 'object') {
                predicate.distance = Math.max(config.distance || 0, 0);
                predicate.delay = Math.max(config.delay || 0, 0);
            }
        }
        // If delay is defined let's keep track of the latest event and initiate
        // delay if it has not been done yet.
        if (predicate.delay) {
            predicate.event = event;
            if (!predicate.delayTimer) {
                predicate.delayTimer = window.setTimeout(function () {
                    // If predicate has changed there's nothing to do here.
                    if (drag._startPredicateData !== predicate)
                        return;
                    // If drag has been destroyed, let's clean things up and exit.
                    if (drag._isDestroyed) {
                        drag._resetDefaultStartPredicate();
                        return;
                    }
                    if (predicate) {
                        // Reset the delay.
                        predicate.delay = 0;
                        // Let's try to resolve the predicate.
                        if (drag._startPredicateState === START_PREDICATE_PENDING &&
                            predicate.event &&
                            predicate.event.distance >= predicate.distance) {
                            drag._resetDefaultStartPredicate();
                            drag._startPredicateState = START_PREDICATE_RESOLVED;
                            drag._onStart(predicate.event);
                        }
                    }
                }, predicate.delay);
            }
            return;
        }
        // Keep the predicate in pending state if the distance threshold is not
        // exceeded.
        if (event.distance < predicate.distance)
            return;
        // Resolve the predicate.
        return true;
    };
    var getTargetGrid = function (item, threshold) {
        var itemGrid = item.getGrid();
        var dragSort = itemGrid._settings.dragSort;
        var grids = dragSort === true
            ? [itemGrid]
            : isFunction(dragSort)
                ? dragSort.call(itemGrid, item)
                : undefined;
        var target = null;
        // Return immediately if there are no grids.
        if (!grids || !Array.isArray(grids) || !grids.length) {
            return target;
        }
        var itemRect = RECT_A;
        var targetRect = RECT_B;
        var bestScore = -1;
        var gridScore = 0;
        var grid;
        var container = null;
        var containerRect;
        var left = 0;
        var top = 0;
        var right = 0;
        var bottom = 0;
        var i = 0;
        // Set up item rect data for comparing against grids.
        itemRect.width = item._width;
        itemRect.height = item._height;
        itemRect.left = item._drag._clientX;
        itemRect.top = item._drag._clientY;
        // Loop through the grids and get the best match.
        for (; i < grids.length; i++) {
            grid = grids[i];
            // Filter out all destroyed grids.
            if (grid._isDestroyed)
                continue;
            // Compute the grid's client rect an clamp the initial boundaries to
            // viewport dimensions.
            grid._updateBoundingRect();
            left = Math.max(0, grid._left);
            top = Math.max(0, grid._top);
            right = Math.min(window.innerWidth, grid._right);
            bottom = Math.min(window.innerHeight, grid._bottom);
            // The grid might be inside one or more elements that clip it's visibility
            // (e.g overflow scroll/hidden) so we want to find out the visible portion
            // of the grid in the viewport and use that in our calculations.
            container = grid._element.parentNode;
            while (container &&
                container !== document &&
                container !== document.documentElement &&
                container !== document.body) {
                if (container.getRootNode && container instanceof DocumentFragment) {
                    container = container.getRootNode().host;
                    continue;
                }
                if (getStyle(container, 'overflow') !== 'visible') {
                    containerRect = container.getBoundingClientRect();
                    left = Math.max(left, containerRect.left);
                    top = Math.max(top, containerRect.top);
                    right = Math.min(right, containerRect.right);
                    bottom = Math.min(bottom, containerRect.bottom);
                }
                if (getStyle(container, 'position') === 'fixed') {
                    break;
                }
                container = container.parentNode;
            }
            // No need to go further if target rect does not have visible area.
            if (left >= right || top >= bottom)
                continue;
            // Check how much dragged element overlaps the container element.
            targetRect.left = left;
            targetRect.top = top;
            targetRect.width = right - left;
            targetRect.height = bottom - top;
            gridScore = getIntersectionScore(itemRect, targetRect);
            // Check if this grid is the best match so far.
            if (gridScore > threshold && gridScore > bestScore) {
                bestScore = gridScore;
                target = grid;
            }
        }
        return target;
    };
    /**
     * Default drag sort predicate.
     *
     * @param {Item} item
     * @param {Object} [options]
     * @param {number} [options.threshold=50]
     * @param {string} [options.action='move']
     * @returns {?Object}
     */
    var defaultSortPredicate = function (item, options) {
        var drag = item._drag;
        var sortAction = (options && options.action === ACTION_SWAP ? ACTION_SWAP : ACTION_MOVE);
        var migrateAction = (options && options.migrateAction === ACTION_SWAP
            ? ACTION_SWAP
            : ACTION_MOVE);
        // Sort threshold must be a positive number capped to a max value of 100. If
        // that's not the case this function will not work correctly. So let's clamp
        // the threshold just in case.
        var sortThreshold = Math.min(Math.max(options && typeof options.threshold === 'number' ? options.threshold : 50, 1), 100);
        // Get the target grid.
        var grid = getTargetGrid(item, sortThreshold);
        if (!grid)
            return null;
        var isMigration = item.getGrid() !== grid;
        var itemRect = RECT_A;
        var targetRect = RECT_B;
        // Set item rect for comparing against grid items.
        itemRect.width = item._width;
        itemRect.height = item._height;
        if (isMigration) {
            grid._updateBorders(true, false, true, false);
            itemRect.left = drag._clientX - (grid._left + grid._borderLeft);
            itemRect.top = drag._clientY - (grid._top + grid._borderTop);
        }
        else {
            itemRect.left = drag._translateX - item._containerDiffX + item._marginLeft;
            itemRect.top = drag._translateY - item._containerDiffY + item._marginTop;
        }
        var matchScore = 0;
        var matchIndex = -1;
        var hasValidTargets = false;
        // Loop through the target grid items and try to find the best match.
        for (var i = 0; i < grid._items.length; i++) {
            var target = grid._items[i];
            // If the target item is not active or the target item is the dragged
            // item let's skip to the next item.
            if (!target._isActive || target === item) {
                continue;
            }
            // Mark the grid as having valid target items.
            hasValidTargets = true;
            // Calculate the target's overlap score with the dragged item.
            targetRect.width = target._width;
            targetRect.height = target._height;
            targetRect.left = target._left + target._marginLeft;
            targetRect.top = target._top + target._marginTop;
            var score = getIntersectionScore(itemRect, targetRect);
            // Update best match index and score if the target's overlap score with
            // the dragged item is higher than the current best match score.
            if (score > matchScore) {
                matchIndex = i;
                matchScore = score;
            }
        }
        // If there is no valid match and the dragged item is being moved into
        // another grid we need to do some guess work here. If there simply are no
        // valid targets (which means that the dragged item will be the only active
        // item in the new grid) we can just add it as the first item. If we have
        // valid items in the new grid and the dragged item is overlapping one or
        // more of the items in the new grid let's make an exception with the
        // threshold and just pick the item which the dragged item is overlapping
        // most. However, if the dragged item is not overlapping any of the valid
        // items in the new grid let's position it as the last item in the grid.
        if (isMigration && matchScore < sortThreshold) {
            matchIndex = hasValidTargets ? matchIndex : 0;
            matchScore = sortThreshold;
        }
        // Check if the best match overlaps enough to justify a placement switch.
        if (matchScore >= sortThreshold) {
            return {
                grid: grid,
                index: matchIndex,
                action: isMigration ? migrateAction : sortAction,
            };
        }
        return null;
    };
    /**
     * Bind touch interaction to an item.
     *
     * @class
     * @param {Item} item
     */
    var ItemDrag = /** @class */ (function () {
        function ItemDrag(item) {
            var element = item._element;
            var grid = item.getGrid();
            var settings = grid._settings;
            this._item = item;
            this._rootGridId = grid._id;
            this._isDestroyed = false;
            this._isMigrated = false;
            this._isActive = false;
            this._isStarted = false;
            this._startPredicateState = START_PREDICATE_INACTIVE;
            this._startPredicateData = null;
            // Data for drag sort predicate heuristics.
            this._isSortNeeded = false;
            this._sortTimer = undefined;
            this._blockedSortIndex = null;
            this._sortX1 = 0;
            this._sortX2 = 0;
            this._sortY1 = 0;
            this._sortY2 = 0;
            // The dragged item's container element and containing block.
            this._container = null;
            this._containingBlock = null;
            // Drag/scroll event data.
            this._dragStartEvent = null;
            this._dragEndEvent = null;
            this._dragMoveEvent = null;
            this._dragPrevMoveEvent = null;
            this._scrollEvent = null;
            // The current translateX/translateY.
            this._translateX = 0;
            this._translateY = 0;
            // Dragged element's current offset from window's northwest corner. Does
            // not account for element's margins.
            this._clientX = 0;
            this._clientY = 0;
            // Keep track of the clientX/Y diff for scrolling.
            this._scrollDiffX = 0;
            this._scrollDiffY = 0;
            // Keep track of the clientX/Y diff for moving.
            this._moveDiffX = 0;
            this._moveDiffY = 0;
            // Keep track of the container diff between grid element and drag container.
            // Note that these are only used for the start phase to store the initial
            // container diff between the item's grid element and drag container element.
            // To get always get the latest applied container diff you should read it
            // from item._containerDiffX/Y.
            this._containerDiffX = 0;
            this._containerDiffY = 0;
            // Bind the methods that needs binding.
            this._preStartCheck = this._preStartCheck.bind(this);
            this._preEndCheck = this._preEndCheck.bind(this);
            this._onScroll = this._onScroll.bind(this);
            this._prepareStart = this._prepareStart.bind(this);
            this._applyStart = this._applyStart.bind(this);
            this._prepareMove = this._prepareMove.bind(this);
            this._applyMove = this._applyMove.bind(this);
            this._prepareScroll = this._prepareScroll.bind(this);
            this._applyScroll = this._applyScroll.bind(this);
            this._handleSort = this._handleSort.bind(this);
            this._handleSortDelayed = this._handleSortDelayed.bind(this);
            // Init dragger.
            this._dragger = new Dragger((typeof settings.dragHandle === 'string' && element.querySelector(settings.dragHandle)) ||
                element, settings.dragCssProps, settings.dragEventListenerOptions);
            this._dragger.on('start', this._preStartCheck);
            this._dragger.on('move', this._preStartCheck);
            this._dragger.on('cancel', this._preEndCheck);
            this._dragger.on('end', this._preEndCheck);
        }
        /**
         * Get Grid instance.
         *
         * @public
         * @returns {?Grid}
         */
        ItemDrag.prototype.getRootGrid = function () {
            return GRID_INSTANCES.get(this._rootGridId) || null;
        };
        /**
         * Abort dragging and reset drag data.
         *
         * @public
         */
        ItemDrag.prototype.stop = function () {
            if (!this._isActive)
                return;
            // If the item has been dropped into another grid, finish up the process and
            // and don't go any further here. The _finishMigration() method will destroy
            // this instance which in turn will
            if (this._isMigrated) {
                this._finishMigration();
                return;
            }
            var item = this._item;
            // Stop auto-scroll.
            ItemDrag.autoScroller.removeItem(item);
            // Cancel queued ticks.
            cancelDragStartTick(item._id);
            cancelDragMoveTick(item._id);
            cancelDragScrollTick(item._id);
            // Cancel sort procedure.
            this._cancelSort();
            if (this._isStarted) {
                var element = item._element;
                var grid = item.getGrid();
                var draggingClass = grid._settings.itemDraggingClass;
                // Remove scroll listeners.
                this._unbindScrollHandler();
                // Append item element to it's current grid's container element if it's
                // not there already. Also make sure the translate values are adjusted to
                // account for the DOM shift.
                if (element.parentNode !== grid._element) {
                    grid._element.appendChild(element);
                    item._setTranslate(this._translateX - item._containerDiffX, this._translateY - item._containerDiffY);
                    item._containerDiffX = this._containerDiffX = 0;
                    item._containerDiffY = this._containerDiffY = 0;
                    // We need to do forced reflow to make sure the dragging class is
                    // removed gracefully.
                    // eslint-disable-next-line
                    if (draggingClass)
                        element.clientWidth;
                }
                // Remove dragging class.
                removeClass(element, draggingClass);
            }
            // Reset drag data.
            this._reset();
        };
        /**
         * Manually trigger drag sort. This is only needed for special edge cases where
         * e.g. you have disabled sort and want to trigger a sort right after enabling
         * it (and don't want to wait for the next move/scroll event).
         *
         * @public
         * @param {boolean} [force=false]
         */
        ItemDrag.prototype.sort = function (force) {
            if (force === void 0) { force = false; }
            var item = this._item;
            if (this._isActive && item._isActive && this._dragMoveEvent) {
                if (force) {
                    this._handleSort();
                }
                else {
                    addDragSortTick(item._id, this._handleSort);
                }
            }
        };
        /**
         * Destroy instance.
         *
         * @public
         */
        ItemDrag.prototype.destroy = function () {
            if (this._isDestroyed)
                return;
            // It's important to always do the destroying as if migration did not happen
            // because otherwise the item's drag handler might be recreated when there's
            // no need.
            this._isMigrated = false;
            this.stop();
            this._dragger.destroy();
            this._isDestroyed = true;
        };
        /**
         * Start predicate.
         *
         * @private
         * @param {Item} item
         * @param {Object} event
         * @returns {(boolean|undefined)}
         */
        ItemDrag.prototype._startPredicate = function (item, event) {
            var predicate = item.getGrid()._settings.dragStartPredicate;
            return isFunction(predicate)
                ? predicate(item, event)
                : ItemDrag.defaultStartPredicate(item, event);
        };
        /**
         * Setup/reset drag data.
         *
         * @private
         */
        ItemDrag.prototype._reset = function () {
            this._isActive = false;
            this._isStarted = false;
            this._container = null;
            this._containingBlock = null;
            this._dragStartEvent = null;
            this._dragEndEvent = null;
            this._dragMoveEvent = null;
            this._dragPrevMoveEvent = null;
            this._scrollEvent = null;
            this._translateX = 0;
            this._translateY = 0;
            this._clientX = 0;
            this._clientY = 0;
            this._scrollDiffX = 0;
            this._scrollDiffY = 0;
            this._moveDiffX = 0;
            this._moveDiffY = 0;
            this._containerDiffX = 0;
            this._containerDiffY = 0;
        };
        /**
         * Bind drag scroll handlers.
         *
         * @private
         */
        ItemDrag.prototype._bindScrollHandler = function () {
            window.addEventListener('scroll', this._onScroll, SCROLL_LISTENER_OPTIONS);
        };
        /**
         * Unbind currently bound drag scroll handlers.
         *
         * @private
         */
        ItemDrag.prototype._unbindScrollHandler = function () {
            window.removeEventListener('scroll', this._onScroll, SCROLL_LISTENER_OPTIONS);
        };
        /**
         * Reset drag sort heuristics.
         *
         * @private
         * @param {number} x
         * @param {number} y
         */
        ItemDrag.prototype._resetHeuristics = function (x, y) {
            this._blockedSortIndex = null;
            this._sortX1 = this._sortX2 = x;
            this._sortY1 = this._sortY2 = y;
        };
        /**
         * Run heuristics and return true if overlap check can be performed, and false
         * if it can not.
         *
         * @private
         * @param {number} x
         * @param {number} y
         * @returns {boolean}
         */
        ItemDrag.prototype._checkHeuristics = function (x, y) {
            var grid = this._item.getGrid();
            var _a = grid._settings.dragSortHeuristics, minDragDistance = _a.minDragDistance, minBounceBackAngle = _a.minBounceBackAngle;
            // Skip heuristics if not needed.
            if (minDragDistance <= 0) {
                this._blockedSortIndex = null;
                return true;
            }
            var diffX = x - this._sortX2;
            var diffY = y - this._sortY2;
            // If we can't do proper bounce back check make sure that the blocked index
            // is not set.
            var canCheckBounceBack = minDragDistance > 3 && minBounceBackAngle > 0;
            if (!canCheckBounceBack) {
                this._blockedSortIndex = null;
            }
            if (Math.abs(diffX) > minDragDistance || Math.abs(diffY) > minDragDistance) {
                // Reset blocked index if angle changed enough. This check requires a
                // minimum value of 3 for minDragDistance to function properly.
                if (canCheckBounceBack) {
                    var angle = Math.atan2(diffX, diffY);
                    var prevAngle = Math.atan2(this._sortX2 - this._sortX1, this._sortY2 - this._sortY1);
                    var deltaAngle = Math.atan2(Math.sin(angle - prevAngle), Math.cos(angle - prevAngle));
                    if (Math.abs(deltaAngle) > minBounceBackAngle) {
                        this._blockedSortIndex = null;
                    }
                }
                // Update points.
                this._sortX1 = this._sortX2;
                this._sortY1 = this._sortY2;
                this._sortX2 = x;
                this._sortY2 = y;
                return true;
            }
            return false;
        };
        /**
         * Reset default drag start predicate data.
         *
         * @private
         */
        ItemDrag.prototype._resetDefaultStartPredicate = function () {
            var predicate = this._startPredicateData;
            if (predicate) {
                if (predicate.delayTimer) {
                    predicate.delayTimer = void window.clearTimeout(predicate.delayTimer);
                }
                this._startPredicateData = null;
            }
        };
        /**
         * Handle the sorting procedure. Manage drag sort heuristics/interval and
         * check overlap when necessary.
         *
         * @private
         */
        ItemDrag.prototype._handleSort = function () {
            if (!this._isActive)
                return;
            var item = this._item;
            var _a = item.getGrid()._settings, dragSort = _a.dragSort, dragSortHeuristics = _a.dragSortHeuristics, dragAutoScroll = _a.dragAutoScroll;
            // No sorting when drag sort is disabled. Also, account for the scenario where
            // dragSort is temporarily disabled during drag procedure so we need to reset
            // sort timer heuristics state too.
            if (!dragSort ||
                (!dragAutoScroll.sortDuringScroll && ItemDrag.autoScroller.isItemScrolling(item))) {
                this._sortX1 = this._sortX2 = this._translateX - item._containerDiffX;
                this._sortY1 = this._sortY2 = this._translateY - item._containerDiffY;
                // We set this to true intentionally so that overlap check would be
                // triggered as soon as possible after sort becomes enabled again.
                this._isSortNeeded = true;
                if (this._sortTimer !== undefined) {
                    this._sortTimer = void window.clearTimeout(this._sortTimer);
                }
                return;
            }
            // If sorting is enabled we always need to run the heuristics check to keep
            // the tracked coordinates updated. We also allow an exception when the sort
            // timer is finished because the heuristics are intended to prevent overlap
            // checks based on the dragged element's immediate movement and a delayed
            // overlap check is valid if it comes through, because it was valid when it
            // was invoked.
            var shouldSort = this._checkHeuristics(this._translateX - item._containerDiffX, this._translateY - item._containerDiffY);
            if (!this._isSortNeeded && !shouldSort)
                return;
            var sortInterval = dragSortHeuristics.sortInterval;
            if (sortInterval <= 0 || this._isSortNeeded) {
                this._isSortNeeded = false;
                if (this._sortTimer !== undefined) {
                    this._sortTimer = void window.clearTimeout(this._sortTimer);
                }
                this._checkOverlap();
            }
            else if (this._sortTimer === undefined) {
                this._sortTimer = window.setTimeout(this._handleSortDelayed, sortInterval);
            }
        };
        /**
         * Delayed sort handler.
         *
         * @private
         */
        ItemDrag.prototype._handleSortDelayed = function () {
            this._isSortNeeded = true;
            this._sortTimer = undefined;
            addDragSortTick(this._item._id, this._handleSort);
        };
        /**
         * Cancel and reset sort procedure.
         *
         * @private
         */
        ItemDrag.prototype._cancelSort = function () {
            this._isSortNeeded = false;
            if (this._sortTimer !== undefined) {
                this._sortTimer = void window.clearTimeout(this._sortTimer);
            }
            cancelDragSortTick(this._item._id);
        };
        /**
         * Handle the ending of the drag procedure for sorting.
         *
         * @private
         */
        ItemDrag.prototype._finishSort = function () {
            var isSortEnabled = this._item.getGrid()._settings.dragSort;
            var needsFinalMoveCheck = isSortEnabled && (this._isSortNeeded || this._sortTimer !== undefined);
            this._cancelSort();
            if (needsFinalMoveCheck)
                this._checkOverlap();
            if (isSortEnabled)
                this._checkOverlap(true);
        };
        /**
         * Check (during drag) if an item is overlapping other items based on
         * the configuration layout the items.
         *
         * @private
         * @param {Boolean} [isDrop=false]
         */
        ItemDrag.prototype._checkOverlap = function (isDrop) {
            if (isDrop === void 0) { isDrop = false; }
            if (!this._isActive)
                return;
            var item = this._item;
            var element = item._element;
            var settings = item.getGrid()._settings;
            // Get overlap check result.
            var result = null;
            if (isFunction(settings.dragSortPredicate)) {
                result = settings.dragSortPredicate(item, (isDrop ? this._dragEndEvent : this._dragMoveEvent));
            }
            else if (!isDrop) {
                result = ItemDrag.defaultSortPredicate(item, settings.dragSortPredicate);
            }
            // Let's make sure the result object has a valid index before going further.
            if (!result || typeof result.index !== 'number')
                return;
            var sortAction = result.action === ACTION_SWAP ? ACTION_SWAP : ACTION_MOVE;
            var currentGrid = item.getGrid();
            var targetGrid = result.grid || currentGrid;
            var isMigration = currentGrid !== targetGrid;
            var currentIndex = currentGrid._items.indexOf(item);
            var targetIndex = normalizeArrayIndex(targetGrid._items, result.index, isMigration && sortAction === ACTION_MOVE ? 1 : 0);
            // Prevent position bounce.
            if (!isMigration && targetIndex === this._blockedSortIndex) {
                return;
            }
            // If the item was moved within it's current grid.
            if (!isMigration) {
                // Make sure the target index is not the current index.
                if (currentIndex !== targetIndex) {
                    this._blockedSortIndex = currentIndex;
                    // Do the sort.
                    (sortAction === ACTION_SWAP ? arraySwap : arrayMove)(currentGrid._items, currentIndex, targetIndex);
                    // Emit move event.
                    if (currentGrid._hasListeners(EVENT_MOVE)) {
                        currentGrid._emit(EVENT_MOVE, {
                            item: item,
                            fromIndex: currentIndex,
                            toIndex: targetIndex,
                            action: sortAction,
                        });
                    }
                    // Layout the grid.
                    currentGrid.layout();
                }
            }
            // If the item was moved to another grid.
            else {
                this._blockedSortIndex = null;
                // Let's fetch the target item when it's still in it's original index.
                var targetItem = targetGrid._items[targetIndex];
                var targetSettings = targetGrid._settings;
                // Emit beforeSend event.
                if (currentGrid._hasListeners(EVENT_BEFORE_SEND)) {
                    currentGrid._emit(EVENT_BEFORE_SEND, {
                        item: item,
                        fromGrid: currentGrid,
                        fromIndex: currentIndex,
                        toGrid: targetGrid,
                        toIndex: targetIndex,
                    });
                }
                // Emit beforeReceive event.
                if (targetGrid._hasListeners(EVENT_BEFORE_RECEIVE)) {
                    targetGrid._emit(EVENT_BEFORE_RECEIVE, {
                        item: item,
                        fromGrid: currentGrid,
                        fromIndex: currentIndex,
                        toGrid: targetGrid,
                        toIndex: targetIndex,
                    });
                }
                // If the drag is not active anymore after the events or either of the
                // grids got destroyed during the emitted events, let's abort the process.
                if (!this._isActive || currentGrid._isDestroyed || targetGrid._isDestroyed) {
                    return;
                }
                // Update item's grid id reference.
                item._gridId = targetGrid._id;
                // Update migrating indicator.
                this._isMigrated = item._gridId !== this._rootGridId;
                // Move item instance from current grid to target grid.
                currentGrid._items.splice(currentIndex, 1);
                arrayInsert(targetGrid._items, item, targetIndex);
                // Reset sort data.
                item._sortData = null;
                // Get the next drag container.
                var currentDragContainer = this._container;
                var targetDragContainer = (targetSettings.dragContainer ||
                    targetGrid._element);
                // Update item's container offset so we can keep computing the item's
                // current translate position relative to it's current grid element. It's
                // important to keep this synced so that we can feed correct data to the
                // drag sort heuristics and easily compute the item's position within it's
                // current grid element.
                var offsetDiff = getOffsetDiff(targetDragContainer, targetGrid._element, true);
                item._containerDiffX = this._containerDiffX = offsetDiff.left;
                item._containerDiffY = this._containerDiffY = offsetDiff.top;
                // If drag container changed let's update containing block and move the
                // element to it's new container.
                if (targetDragContainer !== currentDragContainer) {
                    offsetDiff = getOffsetDiff(currentDragContainer, targetDragContainer, true);
                    this._containingBlock = getContainingBlock(targetDragContainer);
                    this._container = targetDragContainer;
                    this._translateX -= offsetDiff.left;
                    this._translateY -= offsetDiff.top;
                    targetDragContainer.appendChild(element);
                    item._setTranslate(this._translateX, this._translateY);
                }
                // Update item class.
                if (settings.itemClass !== targetSettings.itemClass) {
                    removeClass(element, settings.itemClass);
                    addClass(element, targetSettings.itemClass);
                }
                // Update dragging class.
                if (settings.itemDraggingClass !== targetSettings.itemDraggingClass) {
                    removeClass(element, settings.itemDraggingClass);
                    addClass(element, targetSettings.itemDraggingClass);
                }
                // Update visibility styles/class.
                if (item._isActive) {
                    if (settings.itemVisibleClass !== targetSettings.itemVisibleClass) {
                        removeClass(element, settings.itemVisibleClass);
                        addClass(element, targetSettings.itemVisibleClass);
                    }
                    item._visibility.setStyles(targetSettings.visibleStyles);
                }
                else {
                    if (settings.itemHiddenClass !== targetSettings.itemHiddenClass) {
                        removeClass(element, settings.itemHiddenClass);
                        addClass(element, targetSettings.itemHiddenClass);
                    }
                    item._visibility.setStyles(targetSettings.hiddenStyles);
                }
                // Update placeholder class.
                if (item._dragPlaceholder) {
                    item._dragPlaceholder.updateClassName(targetSettings.itemPlaceholderClass);
                }
                // Update item's cached dimensions.
                // NOTE: This should be only done if there's a chance that the DOM writes
                // have cause this to change. Maybe this is not needed always?
                item._updateDimensions();
                // Emit send event.
                if (currentGrid._hasListeners(EVENT_SEND)) {
                    currentGrid._emit(EVENT_SEND, {
                        item: item,
                        fromGrid: currentGrid,
                        fromIndex: currentIndex,
                        toGrid: targetGrid,
                        toIndex: targetIndex,
                    });
                }
                // Emit receive event.
                if (targetGrid._hasListeners(EVENT_RECEIVE)) {
                    targetGrid._emit(EVENT_RECEIVE, {
                        item: item,
                        fromGrid: currentGrid,
                        fromIndex: currentIndex,
                        toGrid: targetGrid,
                        toIndex: targetIndex,
                    });
                }
                // If the sort action is "swap" let's respect it and send the target item
                // (if it exists) from the target grid to the originating grid. This process
                // is done on purpose after the dragged item placed within the target grid
                // so that we can keep this implementation as simple as possible utilizing
                // the existing API.
                if (sortAction === ACTION_SWAP && targetItem && targetItem.isActive()) {
                    // Sanity check to make sure that the target item is still part of the
                    // target grid. It could have been manipulated in the event handlers.
                    if (targetGrid._items.indexOf(targetItem) > -1) {
                        targetGrid.send(targetItem, currentGrid, currentIndex, {
                            appendTo: currentDragContainer || document.body,
                            layoutSender: false,
                            layoutReceiver: false,
                        });
                    }
                }
                // Layout both grids.
                currentGrid.layout();
                targetGrid.layout();
            }
        };
        /**
         * If item is dragged into another grid, finish the migration process.
         *
         * @private
         */
        ItemDrag.prototype._finishMigration = function () {
            var item = this._item;
            var dragEnabled = item.getGrid()._settings.dragEnabled;
            this.destroy();
            item._drag = dragEnabled ? new ItemDrag(item) : null;
            item._dragRelease.start();
        };
        /**
         * Drag pre-start handler.
         *
         * @private
         * @param {Object} event
         */
        ItemDrag.prototype._preStartCheck = function (event) {
            // Let's activate drag start predicate state.
            if (this._startPredicateState === START_PREDICATE_INACTIVE) {
                this._startPredicateState = START_PREDICATE_PENDING;
            }
            // If predicate is pending try to resolve it.
            if (this._startPredicateState === START_PREDICATE_PENDING) {
                var shouldStart = this._startPredicate(this._item, event);
                if (shouldStart === true) {
                    this._startPredicateState = START_PREDICATE_RESOLVED;
                    this._onStart(event);
                }
                else if (shouldStart === false) {
                    this._startPredicateState = START_PREDICATE_INACTIVE;
                    this._dragger.reset();
                }
            }
            // Otherwise if predicate is resolved and drag is active, move the item.
            else if (this._startPredicateState === START_PREDICATE_RESOLVED && this._isActive) {
                this._onMove(event);
            }
        };
        /**
         * Drag pre-end handler.
         *
         * @private
         * @param {Object} event
         */
        ItemDrag.prototype._preEndCheck = function (event) {
            var isResolved = this._startPredicateState === START_PREDICATE_RESOLVED;
            // Do final predicate check to allow user to unbind stuff for the current
            // drag procedure within the predicate callback. The return value of this
            // check will have no effect to the state of the predicate.
            this._startPredicate(this._item, event);
            // Let's automatically reset the default start predicate (even if it is not
            // used) to make sure it is ready for next round.
            this._resetDefaultStartPredicate();
            this._startPredicateState = START_PREDICATE_INACTIVE;
            if (!isResolved || !this._isActive)
                return;
            if (this._isStarted) {
                this._onEnd(event);
            }
            else {
                this.stop();
            }
        };
        /**
         * Drag start handler.
         *
         * @private
         * @param {Object} event
         */
        ItemDrag.prototype._onStart = function (event) {
            var item = this._item;
            if (!item._isActive)
                return;
            this._isActive = true;
            this._dragStartEvent = event;
            ItemDrag.autoScroller.addItem(item);
            addDragStartTick(item._id, this._prepareStart, this._applyStart);
        };
        /**
         * @private
         */
        ItemDrag.prototype._prepareStart = function () {
            if (!this._isActive)
                return;
            var item = this._item;
            if (!item._isActive)
                return;
            var element = item._element;
            var grid = item.getGrid();
            var settings = grid._settings;
            var dragContainer = (settings.dragContainer || grid._element);
            var containingBlock = getContainingBlock(dragContainer);
            var translate = item._getTranslate();
            var elementRect = element.getBoundingClientRect();
            this._container = dragContainer;
            this._containingBlock = containingBlock;
            this._clientX = elementRect.left;
            this._clientY = elementRect.top;
            this._translateX = translate.x;
            this._translateY = translate.y;
            this._scrollDiffX = this._scrollDiffY = 0;
            this._moveDiffX = this._moveDiffY = 0;
            this._containerDiffX = this._containerDiffY = 0;
            if (dragContainer !== grid._element) {
                var _a = getOffsetDiff(containingBlock, grid._element), left = _a.left, top_1 = _a.top;
                this._containerDiffX = left;
                this._containerDiffY = top_1;
            }
            this._resetHeuristics(this._translateX - item._containerDiffX, this._translateY - item._containerDiffY);
        };
        /**
         * @private
         */
        ItemDrag.prototype._applyStart = function () {
            if (!this._isActive)
                return;
            var item = this._item;
            if (!item._isActive)
                return;
            if (item.isPositioning()) {
                item._layout.stop(true, this._translateX, this._translateY);
            }
            var migrate = item._migrate;
            if (migrate._isActive) {
                this._translateX -= item._containerDiffX;
                this._translateY -= item._containerDiffY;
                migrate.stop(true, this._translateX, this._translateY);
            }
            var release = item._dragRelease;
            if (item.isReleasing()) {
                release._reset();
            }
            var grid = item.getGrid();
            var element = item._element;
            if (grid._settings.dragPlaceholder.enabled) {
                item._dragPlaceholder.create();
            }
            this._isStarted = true;
            grid._emit(EVENT_DRAG_INIT, item, this._dragStartEvent);
            // If the dragged element is not a child of the drag container we need to
            // append the element inside the correct container, setup the actual drag
            // position data and adjust the element's translate values to account for
            // the DOM position shift.
            if (element.parentNode !== this._container) {
                this._translateX += this._containerDiffX;
                this._translateY += this._containerDiffY;
                this._container.appendChild(element);
                item._setTranslate(this._translateX, this._translateY);
            }
            // Make sure item's container diff is synced at this point.
            item._containerDiffX = this._containerDiffX;
            item._containerDiffY = this._containerDiffY;
            addClass(element, grid._settings.itemDraggingClass);
            this._bindScrollHandler();
            grid._emit(EVENT_DRAG_START, item, this._dragStartEvent);
        };
        /**
         * Drag move handler.
         *
         * @private
         * @param {Object} event
         */
        ItemDrag.prototype._onMove = function (event) {
            var item = this._item;
            if (!item._isActive) {
                this.stop();
                return;
            }
            this._dragMoveEvent = event;
            addDragMoveTick(item._id, this._prepareMove, this._applyMove);
            addDragSortTick(item._id, this._handleSort);
        };
        /**
         * Prepare dragged item for moving.
         *
         * @private
         */
        ItemDrag.prototype._prepareMove = function () {
            if (!this._isActive)
                return;
            var item = this._item;
            if (!item._isActive)
                return;
            var axis = item.getGrid()._settings.dragAxis;
            var nextEvent = this._dragMoveEvent;
            var prevEvent = (this._dragPrevMoveEvent || this._dragStartEvent || nextEvent);
            // Update horizontal position data.
            if (axis !== 'y') {
                var moveDiffX = nextEvent.clientX - prevEvent.clientX;
                this._translateX = this._translateX - this._moveDiffX + moveDiffX;
                this._clientX = this._clientX - this._moveDiffX + moveDiffX;
                this._moveDiffX = moveDiffX;
            }
            // Update vertical position data.
            if (axis !== 'x') {
                var moveDiffY = nextEvent.clientY - prevEvent.clientY;
                this._translateY = this._translateY - this._moveDiffY + moveDiffY;
                this._clientY = this._clientY - this._moveDiffY + moveDiffY;
                this._moveDiffY = moveDiffY;
            }
            this._dragPrevMoveEvent = nextEvent;
        };
        /**
         * Apply movement to dragged item.
         *
         * @private
         */
        ItemDrag.prototype._applyMove = function () {
            if (!this._isActive)
                return;
            var item = this._item;
            if (!item._isActive)
                return;
            this._moveDiffX = this._moveDiffY = 0;
            item._setTranslate(this._translateX, this._translateY);
            item.getGrid()._emit(EVENT_DRAG_MOVE, item, this._dragMoveEvent);
            ItemDrag.autoScroller.updateItem(item);
        };
        /**
         * Drag scroll handler.
         *
         * @private
         * @param {Object} event
         */
        ItemDrag.prototype._onScroll = function (event) {
            var item = this._item;
            if (!item._isActive) {
                this.stop();
                return;
            }
            this._scrollEvent = event;
            addDragScrollTick(item._id, this._prepareScroll, this._applyScroll);
            addDragSortTick(item._id, this._handleSort);
        };
        /**
         * Prepare dragged item for scrolling.
         *
         * @private
         */
        ItemDrag.prototype._prepareScroll = function () {
            if (!this._isActive)
                return;
            // If item is not active do nothing.
            var item = this._item;
            if (!item._isActive)
                return;
            var element = item._element;
            var grid = item.getGrid();
            // Update container diff.
            if (this._container !== grid._element) {
                var _a = getOffsetDiff(this._containingBlock, grid._element), left_1 = _a.left, top_2 = _a.top;
                item._containerDiffX = this._containerDiffX = left_1;
                item._containerDiffY = this._containerDiffY = top_2;
            }
            var dragAxis = grid._settings.dragAxis;
            var _b = element.getBoundingClientRect(), left = _b.left, top = _b.top;
            // Update horizontal position data.
            if (dragAxis !== 'y') {
                var scrollDiffX = this._clientX - this._moveDiffX - this._scrollDiffX - left;
                this._translateX = this._translateX - this._scrollDiffX + scrollDiffX;
                this._scrollDiffX = scrollDiffX;
            }
            // Update vertical position data.
            if (dragAxis !== 'x') {
                var scrollDiffY = this._clientY - this._moveDiffY - this._scrollDiffY - top;
                this._translateY = this._translateY - this._scrollDiffY + scrollDiffY;
                this._scrollDiffY = scrollDiffY;
            }
        };
        /**
         * Apply scroll to dragged item.
         *
         * @private
         */
        ItemDrag.prototype._applyScroll = function () {
            if (!this._isActive)
                return;
            var item = this._item;
            if (!item._isActive)
                return;
            this._scrollDiffX = this._scrollDiffY = 0;
            item._setTranslate(this._translateX, this._translateY);
            item.getGrid()._emit(EVENT_DRAG_SCROLL, item, this._scrollEvent);
        };
        /**
         * Drag end handler.
         *
         * @private
         * @param {Object} event
         */
        ItemDrag.prototype._onEnd = function (event) {
            var item = this._item;
            // If item is not active, reset drag.
            if (!item._isActive) {
                this.stop();
                return;
            }
            var grid = item.getGrid();
            this._dragEndEvent = event;
            // Cancel queued ticks.
            cancelDragStartTick(item._id);
            cancelDragMoveTick(item._id);
            cancelDragScrollTick(item._id);
            // Finish sort procedure (does final overlap check if needed).
            this._finishSort();
            // Remove scroll listeners.
            this._unbindScrollHandler();
            // Reset drag data.
            this._reset();
            // Remove dragging class from element.
            removeClass(item._element, grid._settings.itemDraggingClass);
            // Stop auto-scroll.
            ItemDrag.autoScroller.removeItem(item);
            // Emit dragEnd event.
            grid._emit(EVENT_DRAG_END, item, event);
            // Finish up the migration process or start the release process.
            this._isMigrated ? this._finishMigration() : item._dragRelease.start();
        };
        /**
         * @public
         * @static
         * @type {AutoScroller}
         */
        ItemDrag.autoScroller = new AutoScroller();
        /**
         * @public
         * @static
         * @type {defaultStartPredicate}
         */
        ItemDrag.defaultStartPredicate = defaultStartPredicate;
        /**
         * Default drag sort predicate.
         *
         * @public
         * @static
         * @type {defaultSortPredicate}
         */
        ItemDrag.defaultSortPredicate = defaultSortPredicate;
        return ItemDrag;
    }());

    var unprefixRegEx = /^(webkit|moz|ms|o|Webkit|Moz|MS|O)(?=[A-Z])/;
    var cache$2 = new Map();
    /**
     * Remove any potential vendor prefixes from a property name.
     *
     * @param {string} prop
     * @returns {string}
     */
    function getUnprefixedPropName(prop) {
        var result = cache$2.get(prop);
        if (result)
            return result;
        result = prop.replace(unprefixRegEx, '');
        if (result !== prop) {
            result = result[0].toLowerCase() + result.slice(1);
        }
        cache$2.set(prop, result);
        return result;
    }

    var nativeCode = '[native code]';
    /**
     * Check if a value (e.g. a method or constructor) is native code. Good for
     * detecting when a polyfill is used and when not.
     *
     * @param {*} feat
     * @returns {boolean}
     */
    function isNative(feat) {
        return !!(feat &&
            isFunction(window.Symbol) &&
            isFunction(window.Symbol.toString) &&
            window.Symbol(feat).toString().indexOf(nativeCode) > -1);
    }

    /**
     * Set inline styles to an element.
     *
     * @param {HTMLElement} element
     * @param {Object} styles
     */
    function setStyles(element, styles) {
        var prop;
        for (prop in styles) {
            element.style[prop] = styles[prop] || '';
        }
    }

    var HAS_WEB_ANIMATIONS = isFunction(Element.prototype.animate);
    var HAS_NATIVE_WEB_ANIMATIONS = isNative(Element.prototype.animate);
    function createKeyframe(props, prefix) {
        var keyframe = {};
        var prop;
        for (prop in props) {
            keyframe[prefix ? prop : getUnprefixedPropName(prop)] = props[prop];
        }
        return keyframe;
    }
    /**
     * Item animation handler powered by Web Animations API.
     */
    var Animator = /** @class */ (function () {
        function Animator(element) {
            this.element = element || null;
            this.animation = null;
            this._finishCallback = null;
            this._onFinish = this._onFinish.bind(this);
        }
        /**
         * Animation end handler.
         */
        Animator.prototype._onFinish = function () {
            var _finishCallback = this._finishCallback;
            this.animation = this._finishCallback = null;
            _finishCallback && _finishCallback();
        };
        /**
         * Start instance's animation. Automatically stops current animation if it is
         * running.
         */
        Animator.prototype.start = function (propsFrom, propsTo, options) {
            if (!this.element)
                return;
            var element = this.element;
            var _a = options || {}, duration = _a.duration, easing = _a.easing, onFinish = _a.onFinish;
            // If we don't have web animations available let's not animate.
            if (!HAS_WEB_ANIMATIONS) {
                setStyles(element, propsTo);
                this._finishCallback = isFunction(onFinish) ? onFinish : null;
                this._onFinish();
                return;
            }
            // Cancel existing animation.
            if (this.animation)
                this.animation.cancel();
            // Start the animation. We need to provide unprefixed property names to the
            // Web Animations polyfill if it is being used. If we have native Web
            // Animations available we need to provide prefixed properties instead.
            this.animation = element.animate([
                createKeyframe(propsFrom, HAS_NATIVE_WEB_ANIMATIONS),
                createKeyframe(propsTo, HAS_NATIVE_WEB_ANIMATIONS),
            ], {
                duration: duration || 300,
                easing: easing || 'ease',
            });
            // Set animation finish callback.
            this._finishCallback = isFunction(onFinish) ? onFinish : null;
            this.animation.onfinish = this._onFinish;
            // Set the end styles. This makes sure that the element stays at the end
            // values after animation is finished.
            setStyles(element, propsTo);
        };
        /**
         * Stop instance's current animation if running.
         */
        Animator.prototype.stop = function () {
            if (!this.element || !this.animation)
                return;
            this.animation.cancel();
            this.animation = this._finishCallback = null;
        };
        /**
         * Check if the instance is animating.
         */
        Animator.prototype.isAnimating = function () {
            return !!this.animation;
        };
        /**
         * Destroy the instance and stop current animation if it is running.
         */
        Animator.prototype.destroy = function () {
            if (!this.element)
                return;
            this.stop();
            this.element = null;
        };
        return Animator;
    }());

    /**
     * Transform translateX and translateY value into CSS transform style
     * property's value.
     *
     * @param {number} x
     * @param {number} y
     * @returns {string}
     */
    function getTranslateString(x, y) {
        return 'translateX(' + x + 'px) translateY(' + y + 'px)';
    }

    var translateValue = { x: 0, y: 0 };
    var transformNone$1 = 'none';
    var rxMat3d = /^matrix3d/;
    var rxMatTx = /([^,]*,){4}/;
    var rxMat3dTx = /([^,]*,){12}/;
    var rxNextItem = /[^,]*,/;
    /**
     * Returns the element's computed translateX and translateY values as a floats.
     * The returned object is always the same object and updated every time this
     * function is called.
     *
     * @param {HTMLElement} element
     * @returns {Object}
     */
    function getTranslate(element) {
        translateValue.x = 0;
        translateValue.y = 0;
        var transform = getStyle(element, transformStyle);
        if (!transform || transform === transformNone$1) {
            return translateValue;
        }
        // Transform style can be in either matrix3d(...) or matrix(...).
        var isMat3d = rxMat3d.test(transform);
        var tX = transform.replace(isMat3d ? rxMat3dTx : rxMatTx, '');
        var tY = tX.replace(rxNextItem, '');
        translateValue.x = parseFloat(tX) || 0;
        translateValue.y = parseFloat(tY) || 0;
        return translateValue;
    }

    var CURRENT_STYLES = {};
    var TARGET_STYLES = {};
    /**
     * Drag placeholder.
     *
     * @class
     * @param {Item} item
     */
    var ItemDragPlaceholder = /** @class */ (function () {
        function ItemDragPlaceholder(item) {
            this._item = item;
            this._animation = new Animator();
            this._element = null;
            this._className = '';
            this._didMigrate = false;
            this._resetAfterLayout = false;
            this._left = 0;
            this._top = 0;
            this._transX = 0;
            this._transY = 0;
            this._nextTransX = 0;
            this._nextTransY = 0;
            // Bind animation handlers.
            this._setupAnimation = this._setupAnimation.bind(this);
            this._startAnimation = this._startAnimation.bind(this);
            this._updateDimensions = this._updateDimensions.bind(this);
            // Bind event handlers.
            this._onLayoutStart = this._onLayoutStart.bind(this);
            this._onLayoutEnd = this._onLayoutEnd.bind(this);
            this._onReleaseEnd = this._onReleaseEnd.bind(this);
            this._onMigrate = this._onMigrate.bind(this);
            this._onHide = this._onHide.bind(this);
        }
        /**
         * Update placeholder's dimensions to match the item's dimensions.
         *
         * @private
         */
        ItemDragPlaceholder.prototype._updateDimensions = function () {
            if (!this._element)
                return;
            setStyles(this._element, {
                width: this._item._width + 'px',
                height: this._item._height + 'px',
            });
        };
        /**
         * Move placeholder to a new position.
         *
         * @private
         * @param {Item[]} items
         * @param {boolean} isInstant
         */
        ItemDragPlaceholder.prototype._onLayoutStart = function (items, isInstant) {
            if (!this._element)
                return;
            var item = this._item;
            // If the item is not part of the layout anymore reset placeholder.
            if (items.indexOf(item) === -1) {
                this.reset();
                return;
            }
            var nextLeft = item._left;
            var nextTop = item._top;
            var currentLeft = this._left;
            var currentTop = this._top;
            // Keep track of item layout position.
            this._left = nextLeft;
            this._top = nextTop;
            // If item's position did not change, and the item did not migrate and the
            // layout is not instant and we can safely skip layout.
            if (!isInstant && !this._didMigrate && currentLeft === nextLeft && currentTop === nextTop) {
                return;
            }
            // Slots data is calculated with item margins added to them so we need to
            // add item's left and top margin to the slot data to get the placeholder's
            // next position.
            var nextX = nextLeft + item._marginLeft;
            var nextY = nextTop + item._marginTop;
            // Just snap to new position without any animations if no animation is
            // required or if placeholder moves between grids.
            var grid = item.getGrid();
            var animEnabled = !isInstant && grid._settings.layoutDuration > 0;
            if (!animEnabled || this._didMigrate) {
                // Cancel potential (queued) layout tick.
                cancelPlaceholderLayoutTick(item._id);
                // Snap placeholder to correct position.
                this._element.style[transformProp] = getTranslateString(nextX, nextY);
                this._animation.stop();
                // Move placeholder inside correct container after migration.
                if (this._didMigrate) {
                    grid.getElement().appendChild(this._element);
                    this._didMigrate = false;
                }
                return;
            }
            // Let's make sure an ongoing animation's callback is cancelled before going
            // further. Without this there's a chance that the animation will finish
            // before the next tick and mess up our logic.
            if (this._animation.animation) {
                this._animation.animation.onfinish = null;
            }
            // Start the placeholder's layout animation in the next tick. We do this to
            // avoid layout thrashing.
            this._nextTransX = nextX;
            this._nextTransY = nextY;
            addPlaceholderLayoutTick(item._id, this._setupAnimation, this._startAnimation);
        };
        /**
         * Prepare placeholder for layout animation.
         *
         * @private
         */
        ItemDragPlaceholder.prototype._setupAnimation = function () {
            if (!this._element)
                return;
            var _a = getTranslate(this._element), x = _a.x, y = _a.y;
            this._transX = x;
            this._transY = y;
        };
        /**
         * Start layout animation.
         *
         * @private
         */
        ItemDragPlaceholder.prototype._startAnimation = function () {
            if (!this._element)
                return;
            var animation = this._animation;
            var currentX = this._transX;
            var currentY = this._transY;
            var nextX = this._nextTransX;
            var nextY = this._nextTransY;
            // If placeholder is already in correct position let's just stop animation
            // and be done with it.
            if (currentX === nextX && currentY === nextY) {
                if (animation.isAnimating()) {
                    this._element.style[transformProp] = getTranslateString(nextX, nextY);
                    animation.stop();
                }
                return;
            }
            // Otherwise let's start the animation.
            var _a = this._item.getGrid()._settings, layoutDuration = _a.layoutDuration, layoutEasing = _a.layoutEasing;
            CURRENT_STYLES[transformProp] = getTranslateString(currentX, currentY);
            TARGET_STYLES[transformProp] = getTranslateString(nextX, nextY);
            animation.start(CURRENT_STYLES, TARGET_STYLES, {
                duration: layoutDuration,
                easing: layoutEasing,
                onFinish: this._onLayoutEnd,
            });
        };
        /**
         * Layout end handler.
         *
         * @private
         */
        ItemDragPlaceholder.prototype._onLayoutEnd = function () {
            if (this._resetAfterLayout) {
                this.reset();
            }
        };
        /**
         * Drag end handler. This handler is called when dragReleaseEnd event is
         * emitted and receives the event data as it's argument.
         *
         * @private
         * @param {Item} item
         */
        ItemDragPlaceholder.prototype._onReleaseEnd = function (item) {
            if (item._id === this._item._id) {
                // If the placeholder is not animating anymore we can safely reset it.
                if (!this._animation.isAnimating()) {
                    this.reset();
                    return;
                }
                // If the placeholder item is still animating here, let's wait for it to
                // finish it's animation.
                this._resetAfterLayout = true;
            }
        };
        /**
         * Migration start handler. This handler is called when beforeSend event is
         * emitted and receives the event data as it's argument.
         *
         * @private
         * @param {Object} data
         * @param {Item} data.item
         * @param {Grid} data.fromGrid
         * @param {number} data.fromIndex
         * @param {Grid} data.toGrid
         * @param {number} data.toIndex
         */
        ItemDragPlaceholder.prototype._onMigrate = function (data) {
            // Make sure we have a matching item.
            if (data.item !== this._item)
                return;
            // Unbind listeners from current grid.
            var grid = this._item.getGrid();
            grid.off(EVENT_DRAG_RELEASE_END, this._onReleaseEnd);
            grid.off(EVENT_LAYOUT_START, this._onLayoutStart);
            grid.off(EVENT_BEFORE_SEND, this._onMigrate);
            grid.off(EVENT_HIDE_START, this._onHide);
            // Bind listeners to the next grid.
            var nextGrid = data.toGrid;
            nextGrid.on(EVENT_DRAG_RELEASE_END, this._onReleaseEnd);
            nextGrid.on(EVENT_LAYOUT_START, this._onLayoutStart);
            nextGrid.on(EVENT_BEFORE_SEND, this._onMigrate);
            nextGrid.on(EVENT_HIDE_START, this._onHide);
            // Mark the item as migrated.
            this._didMigrate = true;
        };
        /**
         * Reset placeholder if the associated item is hidden.
         *
         * @private
         * @param {Item[]} items
         */
        ItemDragPlaceholder.prototype._onHide = function (items) {
            if (items.indexOf(this._item) > -1)
                this.reset();
        };
        /**
         * Create placeholder. Note that this method only writes to DOM and does not
         * read anything from DOM so it should not cause any additional layout
         * thrashing when it's called at the end of the drag start procedure.
         *
         * @public
         */
        ItemDragPlaceholder.prototype.create = function () {
            // If we already have placeholder set up we can skip the initiation logic.
            if (this._element) {
                this._resetAfterLayout = false;
                return;
            }
            var item = this._item;
            var grid = item.getGrid();
            var settings = grid._settings;
            // Keep track of layout position.
            this._left = item._left;
            this._top = item._top;
            // Create placeholder element.
            if (isFunction(settings.dragPlaceholder.createElement)) {
                this._element = settings.dragPlaceholder.createElement(item);
            }
            else {
                this._element = document.createElement('div');
            }
            var element = this._element;
            // Update element to animation instance.
            this._animation.element = element;
            // Add placeholder class to the placeholder element.
            this._className = settings.itemPlaceholderClass || '';
            if (this._className) {
                addClass(element, this._className);
            }
            // Set initial styles.
            setStyles(element, {
                position: 'absolute',
                left: '0px',
                top: '0px',
                width: item._width + 'px',
                height: item._height + 'px',
            });
            // Set initial position.
            element.style[transformProp] = getTranslateString(item._left + item._marginLeft, item._top + item._marginTop);
            // Bind event listeners.
            grid.on(EVENT_LAYOUT_START, this._onLayoutStart);
            grid.on(EVENT_DRAG_RELEASE_END, this._onReleaseEnd);
            grid.on(EVENT_BEFORE_SEND, this._onMigrate);
            grid.on(EVENT_HIDE_START, this._onHide);
            // onCreate hook.
            if (isFunction(settings.dragPlaceholder.onCreate)) {
                settings.dragPlaceholder.onCreate(item, element);
            }
            // Insert the placeholder element to the grid.
            grid.getElement().appendChild(element);
        };
        /**
         * Reset placeholder data.
         *
         * @public
         */
        ItemDragPlaceholder.prototype.reset = function () {
            var _a;
            if (!this._element)
                return;
            var element = this._element;
            var item = this._item;
            var grid = item.getGrid();
            // Reset flag.
            this._resetAfterLayout = false;
            // Cancel potential (queued) layout tick.
            cancelPlaceholderLayoutTick(item._id);
            cancelPlaceholderResizeTick(item._id);
            // Reset animation instance.
            var animation = this._animation;
            animation.stop();
            animation.element = null;
            // Unbind event listeners.
            grid.off(EVENT_DRAG_RELEASE_END, this._onReleaseEnd);
            grid.off(EVENT_LAYOUT_START, this._onLayoutStart);
            grid.off(EVENT_BEFORE_SEND, this._onMigrate);
            grid.off(EVENT_HIDE_START, this._onHide);
            // Remove placeholder class from the placeholder element.
            if (this._className) {
                removeClass(element, this._className);
                this._className = '';
            }
            // Remove element.
            (_a = element.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(element);
            this._element = null;
            // onRemove hook. Note that here we use the current grid's onRemove callback
            // so if the item has migrated during drag the onRemove method will not be
            // the originating grid's method.
            var onRemove = grid._settings.dragPlaceholder.onRemove;
            if (isFunction(onRemove))
                onRemove(item, element);
        };
        /**
         * Check if placeholder is currently active (visible).
         *
         * @public
         * @returns {Boolean}
         */
        ItemDragPlaceholder.prototype.isActive = function () {
            return !!this._element;
        };
        /**
         * Get placeholder element.
         *
         * @public
         * @returns {?HTMLElement}
         */
        ItemDragPlaceholder.prototype.getElement = function () {
            return this._element;
        };
        /**
         * Update placeholder's dimensions to match the item's dimensions. Note that
         * the updating is done asynchronously in the next tick to avoid layout
         * thrashing.
         *
         * @public
         */
        ItemDragPlaceholder.prototype.updateDimensions = function () {
            if (!this.isActive())
                return;
            addPlaceholderResizeTick(this._item._id, this._updateDimensions);
        };
        /**
         * Update placeholder's class name.
         *
         * @public
         * @param {string} className
         */
        ItemDragPlaceholder.prototype.updateClassName = function (className) {
            if (!this._element)
                return;
            removeClass(this._element, this._className);
            this._className = className;
            addClass(this._element, className);
        };
        /**
         * Destroy placeholder instance.
         *
         * @public
         */
        ItemDragPlaceholder.prototype.destroy = function () {
            this.reset();
            this._animation && this._animation.destroy();
        };
        return ItemDragPlaceholder;
    }());

    var SCROLL_LISTENER_OPTIONS$1 = HAS_PASSIVE_EVENTS ? { capture: true, passive: true } : true;
    /**
     * The release process handler constructor. Although this might seem as proper
     * fit for the drag process this needs to be separated into it's own logic
     * because there might be a scenario where drag is disabled, but the release
     * process still needs to be implemented (dragging from a grid to another).
     *
     * @class
     * @param {Item} item
     */
    var ItemDragRelease = /** @class */ (function () {
        function ItemDragRelease(item) {
            this._item = item;
            this._isActive = false;
            this._isDestroyed = false;
            this._isPositioningStarted = false;
            this._onScroll = this._onScroll.bind(this);
        }
        /**
         * Start the release process of an item.
         *
         * @public
         */
        ItemDragRelease.prototype.start = function () {
            if (this._isDestroyed || this._isActive)
                return;
            var item = this._item;
            var grid = item.getGrid();
            var settings = grid._settings;
            this._isActive = true;
            addClass(item._element, settings.itemReleasingClass);
            if (!settings.dragRelease.useDragContainer) {
                this._placeToGrid();
            }
            else if (item._element.parentNode !== grid._element) {
                window.addEventListener('scroll', this._onScroll, SCROLL_LISTENER_OPTIONS$1);
            }
            grid._emit(EVENT_DRAG_RELEASE_START, item);
            // Let's start layout manually _only_ if there is no unfinished layout
            // about to finish.
            if (!grid._nextLayoutData)
                item._layout.start(false);
        };
        /**
         * End the release process of an item. This method can be used to abort an
         * ongoing release process (animation) or finish the release process.
         *
         * @public
         * @param {Boolean} [abort=false]
         *  - Should the release be aborted? When true, the release end event won't be
         *    emitted. Set to true only when you need to abort the release process
         *    while the item is animating to it's position.
         * @param {number} [left]
         *  - The element's current translateX value (optional).
         * @param {number} [top]
         *  - The element's current translateY value (optional).
         */
        ItemDragRelease.prototype.stop = function (abort, left, top) {
            if (abort === void 0) { abort = false; }
            if (this._isDestroyed || !this._isActive)
                return;
            var item = this._item;
            if (!abort && (left === undefined || top === undefined)) {
                left = item._left;
                top = item._top;
            }
            var didReparent = this._placeToGrid(left, top);
            this._reset(didReparent);
            if (!abort)
                item.getGrid()._emit(EVENT_DRAG_RELEASE_END, item);
        };
        ItemDragRelease.prototype.isJustReleased = function () {
            return this._isActive && this._isPositioningStarted === false;
        };
        /**
         * Destroy instance.
         *
         * @public
         */
        ItemDragRelease.prototype.destroy = function () {
            if (this._isDestroyed)
                return;
            this.stop(true);
            this._isDestroyed = true;
        };
        /**
         * Move the element back to the grid container element if it does not exist
         * there already.
         *
         * @private
         * @param {number} [left]
         *  - The element's current translateX value (optional).
         * @param {number} [top]
         *  - The element's current translateY value (optional).
         * @returns {boolean}
         *   - Returns `true` if the element was reparented, `false` otherwise.
         */
        ItemDragRelease.prototype._placeToGrid = function (left, top) {
            var didReparent = false;
            if (this._isDestroyed)
                return didReparent;
            var item = this._item;
            var element = item._element;
            var container = item.getGrid()._element;
            if (container && element.parentNode !== container) {
                if (left === undefined || top === undefined) {
                    var _a = item._getTranslate(), x = _a.x, y = _a.y;
                    left = x - item._containerDiffX;
                    top = y - item._containerDiffY;
                }
                container.appendChild(element);
                item._setTranslate(left, top);
                item._containerDiffX = 0;
                item._containerDiffY = 0;
                didReparent = true;
            }
            return didReparent;
        };
        /**
         * Reset data and remove releasing class.
         *
         * @private
         * @param {Boolean} [needsReflow=false]
         */
        ItemDragRelease.prototype._reset = function (needsReflow) {
            if (needsReflow === void 0) { needsReflow = false; }
            if (this._isDestroyed)
                return;
            var item = this._item;
            var releasingClass = item.getGrid()._settings.itemReleasingClass;
            this._isActive = false;
            this._isPositioningStarted = false;
            cancelReleaseScrollTick(item._id);
            window.removeEventListener('scroll', this._onScroll, SCROLL_LISTENER_OPTIONS$1);
            // If the element was just reparented we need to do a forced reflow to remove
            // the class gracefully.
            if (releasingClass) {
                // eslint-disable-next-line
                if (needsReflow)
                    item._element.clientWidth;
                removeClass(item._element, releasingClass);
            }
        };
        /**
         * @private
         */
        ItemDragRelease.prototype._onScroll = function () {
            var _this = this;
            if (this._isDestroyed || !this._isActive)
                return;
            var item = this._item;
            var diffX = 0;
            var diffY = 0;
            addReleaseScrollTick(item._id, function () {
                if (!_this._isActive)
                    return;
                var itemContainer = item._element.parentNode;
                var gridContainer = item.getGrid()._element;
                if (itemContainer && gridContainer) {
                    var _a = getOffsetDiff(itemContainer, gridContainer, true), left = _a.left, top_1 = _a.top;
                    diffX = left;
                    diffY = top_1;
                }
            }, function () {
                if (!_this._isActive)
                    return;
                if (Math.abs(diffX - item._containerDiffX) > 0.1 ||
                    Math.abs(diffY - item._containerDiffY) > 0.1) {
                    item._containerDiffX = diffX;
                    item._containerDiffY = diffY;
                    if (item._dragPlaceholder)
                        item._dragPlaceholder.reset();
                    item._layout.stop(true, item._left, item._top);
                    _this.stop(false, item._left, item._top);
                }
            });
        };
        return ItemDragRelease;
    }());

    var MIN_ANIMATION_DISTANCE = 2;
    var CURRENT_STYLES$1 = {};
    var TARGET_STYLES$1 = {};
    var ANIM_OPTIONS = {
        duration: 0,
        easing: '',
        onFinish: undefined,
    };
    /**
     * Layout manager for Item instance, handles the positioning of an item.
     *
     * @class
     * @param {Item} item
     */
    var ItemLayout = /** @class */ (function () {
        function ItemLayout(item) {
            this._item = item;
            this._isActive = false;
            this._isDestroyed = false;
            this._isInterrupted = false;
            this._skipNextAnimation = false;
            this._easing = '';
            this._duration = 0;
            this._tX = 0;
            this._tY = 0;
            this._animation = new Animator(item._element);
            this._queue = 'layout-' + item._id;
            // Bind animation handlers.
            this._setupAnimation = this._setupAnimation.bind(this);
            this._startAnimation = this._startAnimation.bind(this);
            this._finish = this._finish.bind(this);
            // Set element's initial position styles.
            var style = item._element.style;
            style.left = '0px';
            style.top = '0px';
            item._setTranslate(0, 0);
        }
        /**
         * Start item layout based on it's current data.
         *
         * @public
         * @param {boolean} instant
         * @param {Function} [onFinish]
         */
        ItemLayout.prototype.start = function (instant, onFinish) {
            if (this._isDestroyed)
                return;
            var item = this._item;
            var grid = item.getGrid();
            var release = item._dragRelease;
            var gridSettings = grid._settings;
            var isPositioning = this._isActive;
            var isJustReleased = release.isJustReleased();
            var animation = this._animation;
            var animDuration = isJustReleased
                ? gridSettings.dragRelease.duration
                : gridSettings.layoutDuration;
            var animEasing = isJustReleased ? gridSettings.dragRelease.easing : gridSettings.layoutEasing;
            var animEnabled = !instant && !this._skipNextAnimation && animDuration > 0;
            // If the item is currently positioning cancel potential queued layout tick
            // and process current layout callback queue with interrupted flag on.
            if (isPositioning) {
                cancelLayoutTick(item._id);
                item._emitter.burst(this._queue, true, item);
            }
            // Mark release positioning as started.
            if (isJustReleased)
                release._isPositioningStarted = true;
            // Push the callback to the callback queue.
            if (onFinish && isFunction(onFinish)) {
                item._emitter.on(this._queue, onFinish);
            }
            // Reset animation skipping flag.
            this._skipNextAnimation = false;
            // If no animations are needed, easy peasy!
            if (!animEnabled) {
                item._setTranslate(item._left + item._containerDiffX, item._top + item._containerDiffY);
                animation.stop();
                this._finish();
                return;
            }
            // Let's make sure an ongoing animation's callback is cancelled before going
            // further. Without this there's a chance that the animation will finish
            // before the next tick and mess up our logic.
            if (animation.animation) {
                animation.animation.onfinish = null;
            }
            // Kick off animation to be started in the next tick.
            grid._itemLayoutNeedsDimensionRefresh = true;
            this._isActive = true;
            this._easing = animEasing;
            this._duration = animDuration;
            this._isInterrupted = isPositioning;
            addLayoutTick(item._id, this._setupAnimation, this._startAnimation);
        };
        /**
         * Stop item's position animation if it is currently animating.
         *
         * @public
         * @param {boolean} processCallbackQueue
         * @param {number} [left]
         * @param {number} [top]
         */
        ItemLayout.prototype.stop = function (processCallbackQueue, left, top) {
            if (this._isDestroyed || !this._isActive)
                return;
            var item = this._item;
            // Cancel animation init.
            cancelLayoutTick(item._id);
            // Stop animation.
            if (this._animation.isAnimating()) {
                if (left === undefined || top === undefined) {
                    var _a = getTranslate(item._element), x = _a.x, y = _a.y;
                    item._setTranslate(x, y);
                }
                else {
                    item._setTranslate(left, top);
                }
                this._animation.stop();
            }
            // Remove positioning class.
            removeClass(item._element, item.getGrid()._settings.itemPositioningClass || '');
            // Reset active state.
            this._isActive = false;
            // Process callback queue if needed.
            if (processCallbackQueue) {
                item._emitter.burst(this._queue, true, item);
            }
        };
        /**
         * Destroy the instance and stop current animation if it is running.
         *
         * @public
         */
        ItemLayout.prototype.destroy = function () {
            if (this._isDestroyed)
                return;
            this.stop(true, 0, 0);
            this._item._emitter.clear(this._queue);
            this._animation.destroy();
            var style = this._item._element.style;
            style[transformProp] = '';
            style.left = '';
            style.top = '';
            this._isDestroyed = true;
        };
        /**
         * Finish item layout procedure.
         *
         * @private
         */
        ItemLayout.prototype._finish = function () {
            if (this._isDestroyed)
                return;
            var item = this._item;
            // Update internal translate values.
            item._translateX = item._left + item._containerDiffX;
            item._translateY = item._top + item._containerDiffY;
            // Mark the item as inactive and remove positioning classes.
            if (this._isActive) {
                this._isActive = false;
                removeClass(item._element, item.getGrid()._settings.itemPositioningClass || '');
            }
            // Finish up release and migration.
            if (item._dragRelease._isActive)
                item._dragRelease.stop();
            if (item._migrate._isActive)
                item._migrate.stop();
            // Process the callback queue.
            item._emitter.burst(this._queue, false, item);
        };
        /**
         * Prepare item for layout animation.
         *
         * @private
         */
        ItemLayout.prototype._setupAnimation = function () {
            if (this._isDestroyed || !this._isActive)
                return;
            var item = this._item;
            var _a = item._getTranslate(), x = _a.x, y = _a.y;
            this._tX = x;
            this._tY = y;
            var grid = item.getGrid();
            if (grid._settings._animationWindowing && grid._itemLayoutNeedsDimensionRefresh) {
                grid._itemLayoutNeedsDimensionRefresh = false;
                grid._updateBoundingRect();
                grid._updateBorders(true, false, true, false);
            }
        };
        /**
         * Start layout animation.
         *
         * @private
         */
        ItemLayout.prototype._startAnimation = function () {
            if (this._isDestroyed || !this._isActive)
                return;
            var item = this._item;
            var grid = item.getGrid();
            var settings = grid._settings;
            var isInstant = this._duration <= 0;
            // Calculate next translate values.
            var nextLeft = item._left + item._containerDiffX;
            var nextTop = item._top + item._containerDiffY;
            // Check if we can skip the animation and just snap the element to it's place.
            var xDiff = Math.abs(item._left - (this._tX - item._containerDiffX));
            var yDiff = Math.abs(item._top - (this._tY - item._containerDiffY));
            if (isInstant ||
                (xDiff < MIN_ANIMATION_DISTANCE && yDiff < MIN_ANIMATION_DISTANCE) ||
                (settings._animationWindowing &&
                    !item._isInViewport(this._tX, this._tY, VIEWPORT_THRESHOLD) &&
                    !item._isInViewport(nextLeft, nextTop, VIEWPORT_THRESHOLD))) {
                if (this._isInterrupted || xDiff > 0.1 || yDiff > 0.1) {
                    item._setTranslate(nextLeft, nextTop);
                }
                this._animation.stop();
                this._finish();
                return;
            }
            // Set item's positioning class if needed.
            if (!this._isInterrupted) {
                addClass(item._element, settings.itemPositioningClass);
            }
            // Get current/next styles for animation and provide animation options.
            CURRENT_STYLES$1[transformProp] = getTranslateString(this._tX, this._tY);
            TARGET_STYLES$1[transformProp] = getTranslateString(nextLeft, nextTop);
            ANIM_OPTIONS.duration = this._duration;
            ANIM_OPTIONS.easing = this._easing;
            ANIM_OPTIONS.onFinish = this._finish;
            // Set internal translation values to undefined for the duration of the
            // animation since they will be changing on each animation frame for the
            // duration of the animation and tracking them would mean reading the DOM on
            // each frame, which is pretty darn expensive.
            item._translateX = item._translateY = undefined;
            // Start animation.
            // NOTE: If item is being released or migrated when this is called we might
            // want to check if the item is still positioning towards the same position as
            // the layout skipping omits released and migrated items. If the item is
            // indeed positioning towards the same position we should probably just change
            // the finish callback and that's it, or not. Food for thought...
            this._animation.start(CURRENT_STYLES$1, TARGET_STYLES$1, ANIM_OPTIONS);
            // Unreference callback to avoid mem leaks.
            ANIM_OPTIONS.onFinish = undefined;
        };
        return ItemLayout;
    }());

    /**
     * The migrate process handler constructor.
     *
     * @class
     * @param {Item} item
     */
    var ItemMigrate = /** @class */ (function () {
        function ItemMigrate(item) {
            this._item = item;
            this._isActive = false;
            this._isDestroyed = false;
            this._container = null;
        }
        /**
         * Start the migrate process of an item.
         *
         * @public
         * @param {Grid} targetGrid
         * @param {(HTMLElement|Number|Item)} position
         * @param {HTMLElement} [container]
         */
        ItemMigrate.prototype.start = function (targetGrid, position, container) {
            if (this._isDestroyed)
                return;
            var targetElement = targetGrid._element;
            if (!targetElement)
                return;
            var item = this._item;
            var grid = item.getGrid();
            var element = item._element;
            var isActive = item.isActive();
            var isVisible = item.isVisible();
            var settings = grid._settings;
            var currentIndex = grid._items.indexOf(item);
            var targetSettings = targetGrid._settings;
            var targetItems = targetGrid._items;
            var targetContainer = container || document.body;
            // Get target index.
            var targetIndex = 0;
            if (typeof position === 'number') {
                targetIndex = normalizeArrayIndex(targetItems, position, 1);
            }
            else {
                var targetItem = targetGrid.getItem(position);
                if (!targetItem)
                    return;
                targetIndex = targetItems.indexOf(targetItem);
            }
            // If item is being dragged, stop it.
            if (item._drag)
                item._drag.stop();
            // Abort current positioning/migration/releasing.
            if (this._isActive || item.isPositioning() || item.isReleasing()) {
                var _a = item._getTranslate(), x = _a.x, y = _a.y;
                if (item.isPositioning()) {
                    item._layout.stop(true, x, y);
                }
                x -= item._containerDiffX;
                y -= item._containerDiffY;
                if (this._isActive) {
                    this.stop(true, x, y);
                }
                else if (item.isReleasing()) {
                    item._dragRelease.stop(true, x, y);
                }
            }
            // Stop current visibility animation.
            item._visibility.stop(true);
            // Emit beforeSend event.
            if (grid._hasListeners(EVENT_BEFORE_SEND)) {
                grid._emit(EVENT_BEFORE_SEND, {
                    item: item,
                    fromGrid: grid,
                    fromIndex: currentIndex,
                    toGrid: targetGrid,
                    toIndex: targetIndex,
                });
            }
            // Emit beforeReceive event.
            if (targetGrid._hasListeners(EVENT_BEFORE_RECEIVE)) {
                targetGrid._emit(EVENT_BEFORE_RECEIVE, {
                    item: item,
                    fromGrid: grid,
                    fromIndex: currentIndex,
                    toGrid: targetGrid,
                    toIndex: targetIndex,
                });
            }
            // Let's make sure that the item and both grids are not destroyed after
            // we have emitted the events.
            if (item._isDestroyed || grid._isDestroyed || targetGrid._isDestroyed) {
                return;
            }
            // Destroy current drag.
            if (item._drag) {
                item._drag.destroy();
                item._drag = null;
            }
            // Update item class.
            if (settings.itemClass !== targetSettings.itemClass) {
                removeClass(element, settings.itemClass);
                addClass(element, targetSettings.itemClass);
            }
            // Update visibility class.
            var currentVisClass = isVisible ? settings.itemVisibleClass : settings.itemHiddenClass;
            var nextVisClass = isVisible
                ? targetSettings.itemVisibleClass
                : targetSettings.itemHiddenClass;
            if (currentVisClass !== nextVisClass) {
                removeClass(element, currentVisClass);
                addClass(element, nextVisClass);
            }
            // Move item instance from current grid to target grid.
            grid._items.splice(currentIndex, 1);
            arrayInsert(targetItems, item, targetIndex);
            // Update item's grid id reference.
            item._gridId = targetGrid._id;
            // If item is active we need to move the item inside the target container for
            // the duration of the (potential) animation if it's different than the
            // current container.
            if (isActive) {
                var currentContainer = element.parentNode;
                if (targetContainer !== currentContainer) {
                    targetContainer.appendChild(element);
                    var offsetDiff = getOffsetDiff(targetContainer, currentContainer, true);
                    var t = item._getTranslate();
                    item._setTranslate(t.x + offsetDiff.left, t.y + offsetDiff.top);
                }
            }
            // If item is not active let's just append it to the target grid's element.
            else {
                targetElement.appendChild(element);
            }
            // Update child element's styles to reflect the current visibility state.
            item._visibility.setStyles(isVisible ? targetSettings.visibleStyles : targetSettings.hiddenStyles);
            // Get offset diff for the migration data, if the item is active.
            if (isActive) {
                var _b = getOffsetDiff(targetContainer, targetElement, true), left = _b.left, top_1 = _b.top;
                item._containerDiffX = left;
                item._containerDiffY = top_1;
            }
            // Update item's cached dimensions.
            item._updateDimensions();
            // Reset item's sort data.
            item._sortData = null;
            // Create new drag handler.
            if (targetSettings.dragEnabled) {
                item._drag = new ItemDrag(item);
            }
            // Setup migration data.
            if (isActive) {
                this._isActive = true;
                this._container = targetContainer;
            }
            else {
                this._isActive = false;
                this._container = null;
            }
            // Emit send event.
            if (grid._hasListeners(EVENT_SEND)) {
                grid._emit(EVENT_SEND, {
                    item: item,
                    fromGrid: grid,
                    fromIndex: currentIndex,
                    toGrid: targetGrid,
                    toIndex: targetIndex,
                });
            }
            // Emit receive event.
            if (targetGrid._hasListeners(EVENT_RECEIVE)) {
                targetGrid._emit(EVENT_RECEIVE, {
                    item: item,
                    fromGrid: grid,
                    fromIndex: currentIndex,
                    toGrid: targetGrid,
                    toIndex: targetIndex,
                });
            }
        };
        /**
         * End the migrate process of an item. This method can be used to abort an
         * ongoing migrate process (animation) or finish the migrate process.
         *
         * @public
         * @param {boolean} [abort=false]
         *  - Should the migration be aborted?
         * @param {number} [left]
         *  - The element's current translateX value (optional).
         * @param {number} [top]
         *  - The element's current translateY value (optional).
         */
        ItemMigrate.prototype.stop = function (abort, left, top) {
            if (abort === void 0) { abort = false; }
            if (this._isDestroyed || !this._isActive)
                return;
            var item = this._item;
            var gridElement = item.getGrid()._element;
            if (!gridElement)
                return;
            if (this._container !== gridElement) {
                if (left === undefined || top === undefined) {
                    if (abort) {
                        var t = item._getTranslate();
                        left = t.x - item._containerDiffX;
                        top = t.y - item._containerDiffY;
                    }
                    else {
                        left = item._left;
                        top = item._top;
                    }
                }
                gridElement.appendChild(item._element);
                item._setTranslate(left, top);
                item._containerDiffX = 0;
                item._containerDiffY = 0;
            }
            this._isActive = false;
            this._container = null;
        };
        /**
         * Destroy instance.
         *
         * @public
         */
        ItemMigrate.prototype.destroy = function () {
            if (this._isDestroyed)
                return;
            this.stop(true);
            this._isDestroyed = true;
        };
        return ItemMigrate;
    }());

    /**
     * Get current values of the provided styles definition object or array.
     *
     * @param {HTMLElement} element
     * @param {(Object|Array} styles
     * @return {Object}
     */
    function getCurrentStyles(element, styles) {
        var result = {};
        var prop;
        if (Array.isArray(styles)) {
            var i = 0;
            for (; i < styles.length; i++) {
                prop = styles[i];
                result[prop] = getStyle(element, getStyleName(prop));
            }
        }
        else {
            for (prop in styles) {
                result[prop] = getStyle(element, getStyleName(prop));
            }
        }
        return result;
    }

    /**
     * Visibility manager for Item instance, handles visibility of an item.
     *
     * @class
     * @param {Item} item
     */
    var ItemVisibility = /** @class */ (function () {
        function ItemVisibility(item) {
            var isActive = item._isActive;
            var element = item._element;
            var childElement = element.children[0];
            if (!childElement) {
                throw new Error('No valid child element found within item element.');
            }
            this._item = item;
            this._isDestroyed = false;
            this._isHidden = !isActive;
            this._isHiding = false;
            this._isShowing = false;
            this._childElement = childElement;
            this._currentStyleProps = [];
            this._animation = new Animator(childElement);
            this._queue = 'visibility-' + item._id;
            this._finishShow = this._finishShow.bind(this);
            this._finishHide = this._finishHide.bind(this);
            element.style.display = isActive ? '' : 'none';
            var settings = item.getGrid()._settings;
            addClass(element, isActive ? settings.itemVisibleClass : settings.itemHiddenClass);
            this.setStyles(isActive ? settings.visibleStyles : settings.hiddenStyles);
        }
        /**
         * Show item.
         *
         * @public
         * @param {boolean} instant
         * @param {Function} [onFinish]
         */
        ItemVisibility.prototype.show = function (instant, onFinish) {
            if (this._isDestroyed)
                return;
            var item = this._item;
            var callback = isFunction(onFinish) ? onFinish : null;
            // If item is visible call the callback and be done with it.
            if (!this._isShowing && !this._isHidden) {
                callback && callback(false, item);
                return;
            }
            // If item is showing and does not need to be shown instantly, let's just
            // push callback to the callback queue and be done with it.
            if (this._isShowing && !instant) {
                callback && item._emitter.on(this._queue, callback);
                return;
            }
            // If the item is hiding or hidden process the current visibility callback
            // queue with the interrupted flag active, update classes and set display
            // to block if necessary.
            if (!this._isShowing) {
                item._emitter.burst(this._queue, true, item);
                var element = item._element;
                var settings = item.getGrid()._settings;
                if (settings) {
                    removeClass(element, settings.itemHiddenClass);
                    addClass(element, settings.itemVisibleClass);
                }
                if (!this._isHiding)
                    element.style.display = '';
            }
            // Push callback to the callback queue.
            callback && item._emitter.on(this._queue, callback);
            // Update visibility states.
            this._isShowing = true;
            this._isHiding = this._isHidden = false;
            // Finally let's start show animation.
            this._startAnimation(true, instant, this._finishShow);
        };
        /**
         * Hide item.
         *
         * @public
         * @param {boolean} instant
         * @param {Function} [onFinish]
         */
        ItemVisibility.prototype.hide = function (instant, onFinish) {
            if (this._isDestroyed)
                return;
            var item = this._item;
            var callback = isFunction(onFinish) ? onFinish : null;
            // If item is already hidden call the callback and be done with it.
            if (!this._isHiding && this._isHidden) {
                callback && callback(false, item);
                return;
            }
            // If item is hiding and does not need to be hidden instantly, let's just
            // push callback to the callback queue and be done with it.
            if (this._isHiding && !instant) {
                callback && item._emitter.on(this._queue, callback);
                return;
            }
            // If the item is showing or visible process the current visibility callback
            // queue with the interrupted flag active, update classes and set display
            // to block if necessary.
            if (!this._isHiding) {
                item._emitter.burst(this._queue, true, item);
                var element = item._element;
                var settings = item.getGrid()._settings;
                if (settings) {
                    addClass(element, settings.itemHiddenClass);
                    removeClass(element, settings.itemVisibleClass);
                }
            }
            // Push callback to the callback queue.
            callback && item._emitter.on(this._queue, callback);
            // Update visibility states.
            this._isHidden = this._isHiding = true;
            this._isShowing = false;
            // Finally let's start hide animation.
            this._startAnimation(false, instant, this._finishHide);
        };
        /**
         * Stop current hiding/showing process.
         *
         * @public
         * @param {boolean} processCallbackQueue
         */
        ItemVisibility.prototype.stop = function (processCallbackQueue) {
            if (this._isDestroyed)
                return;
            if (!this._isHiding && !this._isShowing)
                return;
            var item = this._item;
            cancelVisibilityTick(item._id);
            this._animation.stop();
            if (processCallbackQueue) {
                item._emitter.burst(this._queue, true, item);
            }
        };
        /**
         * Reset all existing visibility styles and apply new visibility styles to the
         * visibility element. This method should be used to set styles when there is a
         * chance that the current style properties differ from the new ones (basically
         * on init and on migrations).
         *
         * @public
         * @param {Object} styles
         */
        ItemVisibility.prototype.setStyles = function (styles) {
            var childElement = this._childElement;
            var currentStyleProps = this._currentStyleProps;
            this._removeCurrentStyles();
            var prop;
            for (prop in styles) {
                currentStyleProps.push(prop);
                childElement.style[prop] = styles[prop];
            }
        };
        /**
         * Destroy the instance and stop current animation if it is running.
         *
         * @public
         */
        ItemVisibility.prototype.destroy = function () {
            if (this._isDestroyed)
                return;
            var item = this._item;
            var element = item._element;
            var settings = item.getGrid()._settings;
            this.stop(true);
            item._emitter.clear(this._queue);
            this._animation.destroy();
            this._removeCurrentStyles();
            if (settings) {
                removeClass(element, settings.itemVisibleClass);
                removeClass(element, settings.itemHiddenClass);
            }
            element.style.display = '';
            // Reset state.
            this._isHiding = this._isShowing = false;
            this._isDestroyed = this._isHidden = true;
        };
        /**
         * Start visibility animation.
         *
         * @private
         * @param {boolean} toVisible
         * @param {boolean} instant
         * @param {Function} [onFinish]
         */
        ItemVisibility.prototype._startAnimation = function (toVisible, instant, onFinish) {
            var _this = this;
            if (this._isDestroyed)
                return;
            var item = this._item;
            var grid = item.getGrid();
            var animation = this._animation;
            var childElement = this._childElement;
            var settings = grid._settings;
            var targetStyles = toVisible ? settings.visibleStyles : settings.hiddenStyles;
            var duration = toVisible ? settings.showDuration : settings.hideDuration;
            var easing = toVisible ? settings.showEasing : settings.hideEasing;
            var isInstant = instant || duration <= 0;
            // No target styles? Let's quit early.
            if (!targetStyles) {
                animation.stop();
                onFinish && onFinish();
                return;
            }
            // Cancel queued visibility tick.
            cancelVisibilityTick(item._id);
            // If we need to apply the styles instantly without animation.
            if (isInstant) {
                setStyles(childElement, targetStyles);
                animation.stop();
                onFinish && onFinish();
                return;
            }
            // Let's make sure an ongoing animation's callback is cancelled before going
            // further. Without this there's a chance that the animation will finish
            // before the next tick and mess up our logic.
            if (animation.animation) {
                animation.animation.onfinish = null;
            }
            var currentStyles;
            var tX = 0;
            var tY = 0;
            // Start the animation in the next tick (to avoid layout thrashing).
            grid._itemVisibilityNeedsDimensionRefresh = true;
            addVisibilityTick(item._id, function () {
                // Make sure the item is still in hiding/showing.
                if (_this._isDestroyed || (toVisible ? !_this._isShowing : !_this._isHiding))
                    return;
                currentStyles = getCurrentStyles(childElement, targetStyles);
                var _a = item._getTranslate(), x = _a.x, y = _a.y;
                tX = x;
                tY = y;
                if (settings._animationWindowing && grid._itemVisibilityNeedsDimensionRefresh) {
                    grid._itemVisibilityNeedsDimensionRefresh = false;
                    grid._updateBoundingRect();
                    grid._updateBorders(true, false, true, false);
                }
            }, function () {
                // Make sure the item is still in hiding/showing.
                if (_this._isDestroyed || (toVisible ? !_this._isShowing : !_this._isHiding))
                    return;
                // If item is not in the viewport let's skip the animation.
                if (settings._animationWindowing && !item._isInViewport(tX, tY, VIEWPORT_THRESHOLD)) {
                    if (!item.isActive() ||
                        !item._isInViewport(item._left + item._containerDiffX, item._top + item._containerDiffY, VIEWPORT_THRESHOLD)) {
                        setStyles(childElement, targetStyles);
                        animation.stop();
                        onFinish && onFinish();
                        return;
                    }
                }
                if (currentStyles) {
                    animation.start(currentStyles, targetStyles, {
                        duration: duration,
                        easing: easing,
                        onFinish: onFinish,
                    });
                }
            });
        };
        /**
         * Finish show procedure.
         *
         * @private
         */
        ItemVisibility.prototype._finishShow = function () {
            if (this._isHidden)
                return;
            this._isShowing = false;
            this._item._emitter.burst(this._queue, false, this._item);
        };
        /**
         * Finish hide procedure.
         *
         * @private
         */
        ItemVisibility.prototype._finishHide = function () {
            if (!this._isHidden)
                return;
            var item = this._item;
            this._isHiding = false;
            item._layout.stop(true, 0, 0);
            item._element.style.display = 'none';
            item._emitter.burst(this._queue, false, item);
        };
        /**
         * Remove currently applied visibility related inline style properties.
         *
         * @private
         */
        ItemVisibility.prototype._removeCurrentStyles = function () {
            var childElement = this._childElement;
            var currentStyleProps = this._currentStyleProps;
            var i = 0;
            for (; i < currentStyleProps.length; i++) {
                childElement.style[currentStyleProps[i]] = '';
            }
            currentStyleProps.length = 0;
        };
        return ItemVisibility;
    }());

    var id = 0;
    /**
     * Returns a unique numeric id (increments a base value on every call).
     * @returns {number}
     */
    function createUid() {
        return ++id;
    }

    var windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    window.addEventListener('resize', function () {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
    });

    var targetRect = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    };
    var viewportRect = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    };
    /**
     * Check if the provided rectangle is in viewport.
     *
     * @param {number} width
     * @param {number} height
     * @param {number} left
     * @param {number} top
     * @param {number} padding
     * @returns {boolean}
     */
    function isInViewport(width, height, left, top, padding) {
        padding = padding || 0;
        targetRect.left = left;
        targetRect.top = top;
        targetRect.width = width;
        targetRect.height = height;
        viewportRect.left = 0 - padding;
        viewportRect.top = 0 - padding;
        viewportRect.width = windowSize.width + padding + padding;
        viewportRect.height = windowSize.height + padding + padding;
        return isOverlapping(targetRect, viewportRect);
    }

    var _getTranslateResult = { x: 0, y: 0 };
    var _getClientRootPositionResult = { left: 0, top: 0 };
    /**
     * Creates a new Item instance for a Grid instance.
     *
     * @class
     * @param {Grid} grid
     * @param {HTMLElement} element
     * @param {boolean} [isActive]
     */
    var Item = /** @class */ (function () {
        function Item(grid, element, isActive) {
            var settings = grid._settings;
            // Store item/element pair to a map (for faster item querying by element).
            if (ITEM_ELEMENT_MAP) {
                if (ITEM_ELEMENT_MAP.has(element)) {
                    throw new Error('You can only create one Muuri Item per element!');
                }
                else {
                    ITEM_ELEMENT_MAP.set(element, this);
                }
            }
            this._id = createUid();
            this._gridId = grid._id;
            this._element = element;
            this._isDestroyed = false;
            this._left = 0;
            this._top = 0;
            this._width = 0;
            this._height = 0;
            this._marginLeft = 0;
            this._marginRight = 0;
            this._marginTop = 0;
            this._marginBottom = 0;
            this._translateX = undefined;
            this._translateY = undefined;
            this._containerDiffX = 0;
            this._containerDiffY = 0;
            this._sortData = null;
            this._emitter = new Emitter();
            // If the provided item element is not a direct child of the grid container
            // element, append it to the grid container. Note, we are indeed reading the
            // DOM here but it's a property that does not cause reflowing.
            if (grid._element && element.parentNode !== grid._element) {
                grid._element.appendChild(element);
            }
            // Set item class.
            addClass(element, settings.itemClass);
            // If isActive is not defined, let's try to auto-detect it. Note, we are
            // indeed reading the DOM here but it's a property that does not cause
            // reflowing.
            if (typeof isActive !== 'boolean') {
                isActive = getStyle(element, 'display') !== 'none';
            }
            // Set up active state (defines if the item is considered part of the layout
            // or not).
            this._isActive = isActive;
            // Setup visibility handler.
            this._visibility = new ItemVisibility(this);
            // Set up layout handler.
            this._layout = new ItemLayout(this);
            // Set up migration handler data.
            this._migrate = new ItemMigrate(this);
            // Set up drag handler.
            this._drag = settings.dragEnabled ? new ItemDrag(this) : null;
            // Set up release handler. Note that although this is fully linked to dragging
            // this still needs to be always instantiated to handle migration scenarios
            // correctly.
            this._dragRelease = new ItemDragRelease(this);
            // Set up drag placeholder handler. Note that although this is fully linked to
            // dragging this still needs to be always instantiated to handle migration
            // scenarios correctly.
            this._dragPlaceholder = new ItemDragPlaceholder(this);
            // Note! You must call the following methods before you start using the
            // instance. They are deliberately not called in the end as it would cause
            // potentially a massive amount of reflows if multiple items were instantiated
            // in a loop.
            // this._updateDimensions();
            // this._updateSortData();
        }
        /**
         * Get the instance grid reference.
         *
         * @public
         * @returns {?Grid}
         */
        Item.prototype.getGrid = function () {
            return GRID_INSTANCES.get(this._gridId) || null;
        };
        /**
         * Get the instance element.
         *
         * @public
         * @returns {HTMLElement}
         */
        Item.prototype.getElement = function () {
            return this._element;
        };
        /**
         * Get instance element's cached width.
         *
         * @public
         * @returns {number}
         */
        Item.prototype.getWidth = function () {
            return this._width;
        };
        /**
         * Get instance element's cached height.
         *
         * @public
         * @returns {number}
         */
        Item.prototype.getHeight = function () {
            return this._height;
        };
        /**
         * Get instance element's cached margins.
         *
         * @public
         * @returns {Object}
         */
        Item.prototype.getMargin = function () {
            return {
                left: this._marginLeft,
                right: this._marginRight,
                top: this._marginTop,
                bottom: this._marginBottom,
            };
        };
        /**
         * Get instance element's cached position.
         *
         * @public
         * @returns {Object}
         */
        Item.prototype.getPosition = function () {
            return {
                left: this._left,
                top: this._top,
            };
        };
        /**
         * Is the item active?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isActive = function () {
            return this._isActive;
        };
        /**
         * Is the item visible?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isVisible = function () {
            return !!this._visibility && !this._visibility._isHidden;
        };
        /**
         * Is the item being animated to visible?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isShowing = function () {
            return !!(this._visibility && this._visibility._isShowing);
        };
        /**
         * Is the item being animated to hidden?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isHiding = function () {
            return !!(this._visibility && this._visibility._isHiding);
        };
        /**
         * Is the item positioning?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isPositioning = function () {
            return !!(this._layout && this._layout._isActive);
        };
        /**
         * Is the item being dragged (or queued for dragging)?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isDragging = function () {
            return !!(this._drag && this._drag._isActive);
        };
        /**
         * Is the item being released?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isReleasing = function () {
            return !!(this._dragRelease && this._dragRelease._isActive);
        };
        /**
         * Is the item destroyed?
         *
         * @public
         * @returns {boolean}
         */
        Item.prototype.isDestroyed = function () {
            return this._isDestroyed;
        };
        /**
         * Recalculate item's dimensions.
         *
         * @private
         * @param {boolean} [force=false]
         */
        Item.prototype._updateDimensions = function (force) {
            if (this._isDestroyed)
                return;
            if (force !== true && !this.isVisible() && !this.isHiding())
                return;
            var element = this._element;
            // Calculate width and height.
            var rect = element.getBoundingClientRect();
            this._width = rect.width;
            this._height = rect.height;
            // Calculate margins (ignore negative margins).
            this._marginLeft = Math.max(0, getStyleAsFloat(element, 'margin-left'));
            this._marginRight = Math.max(0, getStyleAsFloat(element, 'margin-right'));
            this._marginTop = Math.max(0, getStyleAsFloat(element, 'margin-top'));
            this._marginBottom = Math.max(0, getStyleAsFloat(element, 'margin-bottom'));
            // Keep drag placeholder's dimensions synced with the item's.
            var dragPlaceholder = this._dragPlaceholder;
            if (dragPlaceholder)
                dragPlaceholder.updateDimensions();
        };
        /**
         * Fetch and store item's sort data.
         *
         * @private
         */
        Item.prototype._updateSortData = function () {
            if (this._isDestroyed)
                return;
            this._sortData = {};
            var getters = this.getGrid()._settings.sortData;
            if (getters) {
                var prop = void 0;
                for (prop in getters) {
                    this._sortData[prop] = getters[prop](this, this._element);
                }
            }
        };
        /**
         * Add item to layout.
         *
         * @private
         * @param {number} [left=0]
         * @param {number} [top=0]
         */
        Item.prototype._addToLayout = function (left, top) {
            if (left === void 0) { left = 0; }
            if (top === void 0) { top = 0; }
            if (this._isActive)
                return;
            this._isActive = true;
            this._left = left;
            this._top = top;
        };
        /**
         * Remove item from layout.
         *
         * @private
         */
        Item.prototype._removeFromLayout = function () {
            if (!this._isActive)
                return;
            this._isActive = false;
            this._left = 0;
            this._top = 0;
        };
        /**
         * Check if the layout procedure can be skipped for the item.
         *
         * @private
         * @param {number} left
         * @param {number} top
         * @returns {boolean}
         */
        Item.prototype._canSkipLayout = function (left, top) {
            return (this._left === left &&
                this._top === top &&
                !this._migrate._isActive &&
                !this._dragRelease._isActive &&
                !this._layout._skipNextAnimation);
        };
        /**
         * Set the provided left and top arguments as the item element's translate
         * values in the DOM. This method keeps track of the currently applied
         * translate values and skips the update operation if the provided values are
         * identical to the currently applied values.
         *
         * @private
         * @param {number} x
         * @param {number} y
         */
        Item.prototype._setTranslate = function (x, y) {
            if (this._translateX === x && this._translateY === y)
                return;
            this._translateX = x;
            this._translateY = y;
            this._element.style[transformProp] = getTranslateString(x, y);
        };
        /**
         * Get the item's current translate values. If they can't be detected from cache
         * we will read them from the DOM (so try to use this only when it is safe
         * to query the DOM without causing a forced reflow).
         *
         * @private
         * @returns {Object}
         */
        Item.prototype._getTranslate = function () {
            if (this._translateX === undefined || this._translateY === undefined) {
                var translate = getTranslate(this._element);
                _getTranslateResult.x = translate.x;
                _getTranslateResult.y = translate.y;
            }
            else {
                _getTranslateResult.x = this._translateX;
                _getTranslateResult.y = this._translateY;
            }
            return _getTranslateResult;
        };
        /**
         * Returns the current container's position relative to the client (viewport)
         * with borders excluded from the container. This equals to the client position
         * where the item will be if it is not transformed and it's left/top position at
         * zero. Note that this method uses the cached dimensions of grid, so it is up
         * to the user to update those when necessary before using this method.
         *
         * @private
         * @returns {Object}
         */
        Item.prototype._getClientRootPosition = function () {
            var grid = this.getGrid();
            _getClientRootPositionResult.left = grid._left + grid._borderLeft - this._containerDiffX;
            _getClientRootPositionResult.top = grid._top + grid._borderTop - this._containerDiffY;
            return _getClientRootPositionResult;
        };
        /**
         * Check if item will be in viewport with the provided coordinates. The third
         * argument allows defining extra padding for the viewport.
         *
         * @private
         * @param {number} x
         * @param {number} y
         * @param {number} [viewportThreshold=0]
         * @returns {boolean}
         */
        Item.prototype._isInViewport = function (x, y, viewportThreshold) {
            if (viewportThreshold === void 0) { viewportThreshold = 0; }
            var rootPosition = this._getClientRootPosition();
            return isInViewport(this._width, this._height, rootPosition.left + this._marginLeft + x, rootPosition.top + this._marginTop + y, viewportThreshold || 0);
        };
        /**
         * Destroy item instance.
         *
         * @private
         * @param {boolean} [removeElement=false]
         */
        Item.prototype._destroy = function (removeElement) {
            var _a;
            if (removeElement === void 0) { removeElement = false; }
            if (this._isDestroyed)
                return;
            var element = this._element;
            var grid = this.getGrid();
            var settings = grid._settings;
            // Destroy handlers.
            this._dragPlaceholder.destroy();
            this._dragRelease.destroy();
            this._migrate.destroy();
            this._layout.destroy();
            this._visibility.destroy();
            if (this._drag)
                this._drag.destroy();
            // Destroy emitter.
            this._emitter.destroy();
            // Remove item class.
            removeClass(element, settings.itemClass);
            // Remove element from DOM.
            if (removeElement)
                (_a = element.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(element);
            // Remove item/element pair from map.
            if (ITEM_ELEMENT_MAP)
                ITEM_ELEMENT_MAP.delete(element);
            // Reset state.
            this._isActive = false;
            this._isDestroyed = true;
        };
        return Item;
    }());

    function createPackerProcessor(isWorker) {
        if (isWorker === void 0) { isWorker = false; }
        var FILL_GAPS = 1;
        var HORIZONTAL = 2;
        var ALIGN_RIGHT = 4;
        var ALIGN_BOTTOM = 8;
        var ROUNDING = 16;
        var EPS = 0.001;
        var MIN_SLOT_SIZE = 0.5;
        // Rounds number first to three decimal precision and then floors the result
        // to two decimal precision.
        // Math.floor(Math.round(number * 1000) / 10) / 100
        function roundNumber(number) {
            return ((((number * 1000 + 0.5) << 0) / 10) << 0) / 100;
        }
        var PrivatePackerProcessor = /** @class */ (function () {
            function PrivatePackerProcessor() {
                this._currentRects = [];
                this._nextRects = [];
                this._rectStore = [];
                this._slotSizes = [];
                this._shards = [];
                this._rectTarget = { left: 0, top: 0, width: 0, height: 0 };
                this._tempRectA = { left: 0, top: 0, width: 0, height: 0 };
                this._tempRectB = { left: 0, top: 0, width: 0, height: 0 };
                this._rectId = 0;
                this._slotIndex = -1;
                this._slot = { left: 0, top: 0, width: 0, height: 0 };
                this._sortRectsLeftTop = this._sortRectsLeftTop.bind(this);
                this._sortRectsTopLeft = this._sortRectsTopLeft.bind(this);
            }
            /**
             * Takes a layout object as an argument and computes positions (slots) for
             * the layout items. Also computes the final width and height of the layout.
             * The provided layout object's slots array is mutated as well as the width
             * and height properties.
             */
            PrivatePackerProcessor.prototype.computeLayout = function (layout, settings) {
                var items = layout.items;
                if (!items.length)
                    return layout;
                var slots = layout.slots;
                var fillGaps = !!(settings & FILL_GAPS);
                var horizontal = !!(settings & HORIZONTAL);
                var alignRight = !!(settings & ALIGN_RIGHT);
                var alignBottom = !!(settings & ALIGN_BOTTOM);
                var rounding = !!(settings & ROUNDING);
                var isPreProcessed = typeof items[0] === 'number';
                var bump = isPreProcessed ? 2 : 1;
                var i = 0;
                var slotWidth = 0;
                var slotHeight = 0;
                var slot;
                var item;
                // Compute slots for the items.
                for (i = 0; i < items.length; i += bump) {
                    // If items are pre-processed it means that items array contains only
                    // the raw dimensions of the items. Otherwise we assume it is an array
                    // of normal Muuri items.
                    if (isPreProcessed) {
                        slotWidth = items[i];
                        slotHeight = items[i + 1];
                    }
                    else {
                        item = items[i];
                        slotWidth = item._width + (item._marginLeft || 0) + (item._marginRight || 0);
                        slotHeight = item._height + (item._marginTop || 0) + (item._marginBottom || 0);
                    }
                    // If rounding is enabled let's round the item's width and height to
                    // make the layout algorithm a bit more stable. This has a performance
                    // cost so don't use this if not necessary.
                    if (rounding) {
                        slotWidth = roundNumber(slotWidth);
                        slotHeight = roundNumber(slotHeight);
                    }
                    // Get slot data.
                    slot = this._computeNextSlot(layout, slotWidth, slotHeight, fillGaps, horizontal);
                    // Update layout width/height.
                    if (horizontal) {
                        if (slot.left + slot.width > layout.width) {
                            layout.width = slot.left + slot.width;
                        }
                    }
                    else {
                        if (slot.top + slot.height > layout.height) {
                            layout.height = slot.top + slot.height;
                        }
                    }
                    // Add item slot data to layout slots.
                    slots[++this._slotIndex] = slot.left;
                    slots[++this._slotIndex] = slot.top;
                    // Store the size too (for later usage) if needed.
                    if (alignRight || alignBottom) {
                        this._slotSizes.push(slot.width, slot.height);
                    }
                }
                // If the alignment is set to right we need to adjust the results.
                if (alignRight) {
                    for (i = 0; i < slots.length; i += 2) {
                        slots[i] = layout.width - (slots[i] + this._slotSizes[i]);
                    }
                }
                // If the alignment is set to bottom we need to adjust the results.
                if (alignBottom) {
                    for (i = 1; i < slots.length; i += 2) {
                        slots[i] = layout.height - (slots[i] + this._slotSizes[i]);
                    }
                }
                // Reset stuff.
                this._slotSizes.length = 0;
                this._currentRects.length = 0;
                this._nextRects.length = 0;
                this._shards.length = 0;
                this._rectId = 0;
                this._slotIndex = -1;
                return layout;
            };
            /**
             * Calculate next slot in the layout. Returns a slot object with position
             * and dimensions data. The returned object is reused between calls.
             */
            PrivatePackerProcessor.prototype._computeNextSlot = function (layout, slotWidth, slotHeight, fillGaps, horizontal) {
                var _a = this, slot = _a._slot, currentRects = _a._currentRects, nextRects = _a._nextRects;
                var ignoreCurrentRects = false;
                var foundInitialSlot = false;
                var rect;
                var rectId;
                var i = 0;
                var j = 0;
                // Reset new slots.
                nextRects.length = 0;
                // Set item slot initial data.
                slot.left = 0;
                slot.top = 0;
                slot.width = slotWidth;
                slot.height = slotHeight;
                // Try to find position for the slot from the existing free spaces in the
                // layout.
                for (i = 0; i < currentRects.length; i++) {
                    rectId = currentRects[i];
                    if (!rectId)
                        continue;
                    rect = this._getRect(rectId);
                    if (slot.width <= rect.width + EPS && slot.height <= rect.height + EPS) {
                        foundInitialSlot = true;
                        slot.left = rect.left;
                        slot.top = rect.top;
                        break;
                    }
                }
                // If no position was found for the slot let's position the slot to
                // the bottom left (in vertical mode) or top right (in horizontal mode) of
                // the layout.
                if (!foundInitialSlot) {
                    if (horizontal) {
                        slot.left = layout.width;
                        slot.top = 0;
                    }
                    else {
                        slot.left = 0;
                        slot.top = layout.height;
                    }
                    // If gaps don't need filling let's throw away all the current free
                    // spaces (currentRects).
                    if (!fillGaps) {
                        ignoreCurrentRects = true;
                    }
                }
                // In vertical mode, if the slot's bottom overlaps the layout's bottom.
                if (!horizontal && slot.top + slot.height > layout.height + EPS) {
                    // If slot is not aligned to the left edge, create a new free space to
                    // the left of the slot.
                    if (slot.left > MIN_SLOT_SIZE) {
                        nextRects.push(this._addRect(0, layout.height, slot.left, Infinity));
                    }
                    // If slot is not aligned to the right edge, create a new free space to
                    // the right of the slot.
                    if (slot.left + slot.width < layout.width - MIN_SLOT_SIZE) {
                        nextRects.push(this._addRect(slot.left + slot.width, layout.height, layout.width - slot.left - slot.width, Infinity));
                    }
                    // Update layout height.
                    layout.height = slot.top + slot.height;
                }
                // In horizontal mode, if the slot's right overlaps the layout's right
                // edge.
                if (horizontal && slot.left + slot.width > layout.width + EPS) {
                    // If slot is not aligned to the top, create a new free space above the
                    // slot.
                    if (slot.top > MIN_SLOT_SIZE) {
                        nextRects.push(this._addRect(layout.width, 0, Infinity, slot.top));
                    }
                    // If slot is not aligned to the bottom, create a new free space below
                    // the slot.
                    if (slot.top + slot.height < layout.height - MIN_SLOT_SIZE) {
                        nextRects.push(this._addRect(layout.width, slot.top + slot.height, Infinity, layout.height - slot.top - slot.height));
                    }
                    // Update layout width.
                    layout.width = slot.left + slot.width;
                }
                // Clean up the current free spaces making sure none of them overlap with
                // the slot. Split all overlapping free spaces into smaller shards that do
                // not overlap with the slot.
                if (!ignoreCurrentRects) {
                    if (fillGaps)
                        i = 0;
                    for (; i < currentRects.length; i++) {
                        rectId = currentRects[i];
                        if (!rectId)
                            continue;
                        rect = this._getRect(rectId);
                        var shards = this._splitRect(rect, slot);
                        for (j = 0; j < shards.length; j++) {
                            rectId = shards[j];
                            rect = this._getRect(rectId);
                            // Make sure that the free space is within the boundaries of the
                            // layout. This routine is critical to the algorithm as it makes
                            // sure that there are no leftover spaces with infinite
                            // height/width. It's also essential that we don't compare values
                            // absolutely to each other but leave a little headroom (EPSILON) to
                            // get rid of false positives.
                            if (horizontal
                                ? rect.left + EPS < layout.width - EPS
                                : rect.top + EPS < layout.height - EPS) {
                                nextRects.push(rectId);
                            }
                        }
                    }
                }
                // Sanitize and sort all the new free spaces that will be used in the next
                // iteration. This procedure is critical to make the bin-packing algorithm
                // work. The free spaces have to be in correct order in the beginning of
                // the next iteration.
                if (nextRects.length > 1) {
                    this._purgeRects(nextRects).sort(horizontal ? this._sortRectsLeftTop : this._sortRectsTopLeft);
                }
                // Finally we need to make sure that `this.currentRects` points to
                // `nextRects` array as that is used in the next iteration's beginning
                // when we try to find a space for the next slot.
                this._currentRects = nextRects;
                this._nextRects = currentRects;
                return slot;
            };
            /**
             * Add a new rectangle to the rectangle store. Returns the id of the new
             * rectangle.
             */
            PrivatePackerProcessor.prototype._addRect = function (left, top, width, height) {
                var rectId = ++this._rectId;
                this._rectStore[rectId] = left || 0;
                this._rectStore[++this._rectId] = top || 0;
                this._rectStore[++this._rectId] = width || 0;
                this._rectStore[++this._rectId] = height || 0;
                return rectId;
            };
            /**
             * Get rectangle data from the rectangle store by id. Optionally you can
             * provide a target object where the rectangle data will be written in. By
             * default an internal object is reused as a target object.
             */
            PrivatePackerProcessor.prototype._getRect = function (id, target) {
                target = target || this._rectTarget;
                target.left = this._rectStore[id] || 0;
                target.top = this._rectStore[++id] || 0;
                target.width = this._rectStore[++id] || 0;
                target.height = this._rectStore[++id] || 0;
                return target;
            };
            /**
             * Punch a hole into a rectangle and return the shards (1-4).
             */
            PrivatePackerProcessor.prototype._splitRect = function (rect, hole) {
                var shards = this._shards;
                var width = 0;
                var height = 0;
                // Reset shards.
                shards.length = 0;
                // If the slot does not overlap with the hole add slot to the return data
                // as is. Note that in this case we are eager to keep the slot as is if
                // possible so we use the EPSILON in favour of that logic.
                if (rect.left + rect.width <= hole.left + EPS ||
                    hole.left + hole.width <= rect.left + EPS ||
                    rect.top + rect.height <= hole.top + EPS ||
                    hole.top + hole.height <= rect.top + EPS) {
                    shards.push(this._addRect(rect.left, rect.top, rect.width, rect.height));
                    return shards;
                }
                // Left split.
                width = hole.left - rect.left;
                if (width >= MIN_SLOT_SIZE) {
                    shards.push(this._addRect(rect.left, rect.top, width, rect.height));
                }
                // Right split.
                width = rect.left + rect.width - (hole.left + hole.width);
                if (width >= MIN_SLOT_SIZE) {
                    shards.push(this._addRect(hole.left + hole.width, rect.top, width, rect.height));
                }
                // Top split.
                height = hole.top - rect.top;
                if (height >= MIN_SLOT_SIZE) {
                    shards.push(this._addRect(rect.left, rect.top, rect.width, height));
                }
                // Bottom split.
                height = rect.top + rect.height - (hole.top + hole.height);
                if (height >= MIN_SLOT_SIZE) {
                    shards.push(this._addRect(rect.left, hole.top + hole.height, rect.width, height));
                }
                return shards;
            };
            /**
             * Check if a rectangle is fully within another rectangle.
             */
            PrivatePackerProcessor.prototype._isRectAWithinRectB = function (a, b) {
                return (a.left + EPS >= b.left &&
                    a.top + EPS >= b.top &&
                    a.left + a.width - EPS <= b.left + b.width &&
                    a.top + a.height - EPS <= b.top + b.height);
            };
            /**
             * Loops through an array of rectangle ids and resets all that are fully
             * within another rectangle in the array. Resetting in this case means that
             * the rectangle id value is replaced with zero.
             */
            PrivatePackerProcessor.prototype._purgeRects = function (rectIds) {
                var _a = this, a = _a._tempRectA, b = _a._tempRectB;
                var i = rectIds.length;
                var j = 0;
                while (i--) {
                    j = rectIds.length;
                    if (!rectIds[i])
                        continue;
                    this._getRect(rectIds[i], a);
                    while (j--) {
                        if (!rectIds[j] || i === j)
                            continue;
                        this._getRect(rectIds[j], b);
                        if (this._isRectAWithinRectB(a, b)) {
                            rectIds[i] = 0;
                            break;
                        }
                    }
                }
                return rectIds;
            };
            /**
             * Sort rectangles with top-left gravity.
             */
            PrivatePackerProcessor.prototype._sortRectsTopLeft = function (aId, bId) {
                var _a = this, a = _a._tempRectA, b = _a._tempRectB;
                this._getRect(aId, a);
                this._getRect(bId, b);
                return a.top < b.top && a.top + EPS < b.top
                    ? -1
                    : a.top > b.top && a.top - EPS > b.top
                        ? 1
                        : a.left < b.left && a.left + EPS < b.left
                            ? -1
                            : a.left > b.left && a.left - EPS > b.left
                                ? 1
                                : 0;
            };
            /**
             * Sort rectangles with left-top gravity.
             */
            PrivatePackerProcessor.prototype._sortRectsLeftTop = function (aId, bId) {
                var _a = this, a = _a._tempRectA, b = _a._tempRectB;
                this._getRect(aId, a);
                this._getRect(bId, b);
                return a.left < b.left && a.left + EPS < b.left
                    ? -1
                    : a.left > b.left && a.left - EPS < b.left
                        ? 1
                        : a.top < b.top && a.top + EPS < b.top
                            ? -1
                            : a.top > b.top && a.top - EPS > b.top
                                ? 1
                                : 0;
            };
            return PrivatePackerProcessor;
        }());
        var processor = new PrivatePackerProcessor();
        if (isWorker) {
            var workerScope_1 = self;
            var PACKET_INDEX_WIDTH_1 = 1;
            var PACKET_INDEX_HEIGHT_1 = 2;
            var PACKET_INDEX_SETTINGS_1 = 3;
            var PACKET_HEADER_SLOTS_1 = 4;
            workerScope_1.onmessage = function (msg) {
                var data = new Float32Array(msg.data);
                var items = data.subarray(PACKET_HEADER_SLOTS_1, data.length);
                var slots = new Float32Array(items.length);
                var settings = data[PACKET_INDEX_SETTINGS_1];
                var layout = {
                    items: items,
                    slots: slots,
                    width: data[PACKET_INDEX_WIDTH_1],
                    height: data[PACKET_INDEX_HEIGHT_1],
                };
                // Compute the layout (width / height / slots).
                processor.computeLayout(layout, settings);
                // Copy layout data to the return data.
                data[PACKET_INDEX_WIDTH_1] = layout.width;
                data[PACKET_INDEX_HEIGHT_1] = layout.height;
                data.set(layout.slots, PACKET_HEADER_SLOTS_1);
                // Send layout back to the main thread.
                workerScope_1.postMessage(data.buffer, [data.buffer]);
            };
        }
        return processor;
    }

    // Cache packer processor's blob url so we don't have to create multiple times
    // for nothing.
    var blobUrl = '';
    // Keep track of all spawned workers.
    var allWorkers = new Set();
    function createWorkerProcessors(amount, onmessage) {
        var workers = [];
        if (amount > 0) {
            if (!blobUrl) {
                blobUrl = URL.createObjectURL(new Blob(['(' + createPackerProcessor.toString() + ')(true)'], {
                    type: 'application/javascript',
                }));
            }
            var i = 0;
            for (; i < amount; i++) {
                var worker = new Worker(blobUrl);
                worker.onmessage = onmessage;
                workers.push(worker);
                allWorkers.add(worker);
            }
        }
        return workers;
    }
    function destroyWorkerProcessors(workers) {
        var i = 0;
        for (; i < workers.length; i++) {
            var worker = workers[i];
            worker.onmessage = null;
            worker.onerror = null;
            worker.onmessageerror = null;
            worker.terminate();
            allWorkers.delete(worker);
        }
        if (blobUrl && !allWorkers.size) {
            URL.revokeObjectURL(blobUrl);
            blobUrl = '';
        }
    }

    var FILL_GAPS = 1;
    var HORIZONTAL = 2;
    var ALIGN_RIGHT = 4;
    var ALIGN_BOTTOM = 8;
    var ROUNDING = 16;
    var PACKET_INDEX_ID = 0;
    var PACKET_INDEX_WIDTH = 1;
    var PACKET_INDEX_HEIGHT = 2;
    var PACKET_INDEX_SETTINGS = 3;
    var PACKET_HEADER_SLOTS = 4;
    var PACKER_PROCESSOR = createPackerProcessor();
    var Packer = /** @class */ (function () {
        function Packer(numWorkers, options) {
            if (numWorkers === void 0) { numWorkers = 0; }
            this._settings = 0;
            this._asyncMode = true;
            this._workers = [];
            this._layoutWorkerQueue = [];
            this._layoutsProcessing = new Set();
            this._layoutWorkerData = new Map();
            this._onWorkerMessage = this._onWorkerMessage.bind(this);
            // Set initial options.
            if (options)
                this.updateSettings(options);
            // Try to init the workers.
            try {
                this._workers = createWorkerProcessors(numWorkers, this._onWorkerMessage);
                this._asyncMode = !!this._workers.length;
            }
            catch (e) { }
        }
        Packer.prototype._sendToWorker = function () {
            if (!this._layoutWorkerQueue.length || !this._workers.length)
                return;
            var worker = this._workers.pop();
            var layoutId = this._layoutWorkerQueue.shift();
            var workerData = this._layoutWorkerData.get(layoutId);
            workerData.worker = worker;
            this._layoutsProcessing.add(layoutId);
            var buffer = workerData.packet.buffer;
            worker.postMessage(buffer, [buffer]);
        };
        Packer.prototype._onWorkerMessage = function (msg) {
            var data = new Float32Array(msg.data);
            var layoutId = data[PACKET_INDEX_ID];
            var layoutData = this._layoutWorkerData.get(layoutId);
            // Delete internal references.
            this._layoutWorkerData.delete(layoutId);
            this._layoutsProcessing.delete(layoutId);
            // If we don't have layout data for some reason, there's nothing we can do.
            if (!layoutData)
                return;
            // Return worker to the pool.
            var worker = layoutData.worker;
            if (worker)
                this._workers.push(worker);
            // If layout has not been aborted let's finish things up.
            if (!layoutData.aborted) {
                var layout = {
                    id: layoutId,
                    items: layoutData.items,
                    slots: data.subarray(PACKET_HEADER_SLOTS, data.length),
                    width: data[PACKET_INDEX_WIDTH],
                    height: data[PACKET_INDEX_HEIGHT],
                    styles: {},
                };
                this._setContainerStyles(layout, layoutData.container, layoutData.settings);
                layoutData.callback(layout);
            }
            // Finally try to process the next layout in the queue.
            if (worker)
                this._sendToWorker();
        };
        Packer.prototype._setContainerStyles = function (layout, containerData, settings) {
            var isHorizontal = !!(settings & HORIZONTAL);
            var isBorderBox = containerData.boxSizing === 'border-box';
            var _a = containerData.borderLeft, borderLeft = _a === void 0 ? 0 : _a, _b = containerData.borderRight, borderRight = _b === void 0 ? 0 : _b, _c = containerData.borderTop, borderTop = _c === void 0 ? 0 : _c, _d = containerData.borderBottom, borderBottom = _d === void 0 ? 0 : _d;
            var styles = layout.styles, width = layout.width, height = layout.height;
            if (isHorizontal) {
                styles.width = (isBorderBox ? width + borderLeft + borderRight : width) + 'px';
            }
            else {
                styles.height = (isBorderBox ? height + borderTop + borderBottom : height) + 'px';
            }
        };
        Packer.prototype.updateSettings = function (options) {
            var fillGaps = this._settings & FILL_GAPS;
            if (typeof options.fillGaps === 'boolean') {
                fillGaps = options.fillGaps ? FILL_GAPS : 0;
            }
            var horizontal = this._settings & HORIZONTAL;
            if (typeof options.horizontal === 'boolean') {
                horizontal = options.horizontal ? HORIZONTAL : 0;
            }
            var alignRight = this._settings & ALIGN_RIGHT;
            if (typeof options.alignRight === 'boolean') {
                alignRight = options.alignRight ? ALIGN_RIGHT : 0;
            }
            var alignBottom = this._settings & ALIGN_BOTTOM;
            if (typeof options.alignBottom === 'boolean') {
                alignBottom = options.alignBottom ? ALIGN_BOTTOM : 0;
            }
            var rounding = this._settings & ROUNDING;
            if (typeof options.rounding === 'boolean') {
                rounding = options.rounding ? ROUNDING : 0;
            }
            this._settings = fillGaps | horizontal | alignRight | alignBottom | rounding;
        };
        Packer.prototype.createLayout = function (grid, layoutId, items, width, height, callback) {
            if (this._layoutWorkerData.has(layoutId)) {
                throw new Error('A layout with the provided id is currently being processed.');
            }
            var containerData = {
                width: width,
                height: height,
                borderLeft: grid._borderLeft,
                borderRight: grid._borderRight,
                borderTop: grid._borderTop,
                borderBottom: grid._borderBottom,
                boxSizing: grid._boxSizing,
            };
            var useSyncProcessing = !this._asyncMode || !items.length;
            var isHorizontal = this._settings & HORIZONTAL;
            var layout = {
                id: layoutId,
                items: items,
                slots: new Float32Array(useSyncProcessing ? items.length * 2 : 0),
                width: isHorizontal ? 0 : containerData.width,
                height: !isHorizontal ? 0 : containerData.height,
                styles: {},
            };
            // Compute layout synchronously if needed.
            if (useSyncProcessing) {
                if (items.length)
                    PACKER_PROCESSOR.computeLayout(layout, this._settings);
                this._setContainerStyles(layout, containerData, this._settings);
                callback(layout);
                return;
            }
            // Create worker packet.
            var packet = new Float32Array(PACKET_HEADER_SLOTS + items.length * 2);
            // Add headers to packet.
            packet[PACKET_INDEX_ID] = layoutId;
            packet[PACKET_INDEX_WIDTH] = layout.width;
            packet[PACKET_INDEX_HEIGHT] = layout.height;
            packet[PACKET_INDEX_SETTINGS] = this._settings;
            // Add items packet.
            var i = 0;
            var j = PACKET_HEADER_SLOTS - 1;
            for (; i < items.length; i++) {
                var item = items[i];
                packet[++j] = item._width + (item._marginLeft || 0) + (item._marginRight || 0);
                packet[++j] = item._height + (item._marginTop || 0) + (item._marginBottom || 0);
            }
            // Store the layout data and add it to worker queue.
            this._layoutWorkerQueue.push(layoutId);
            this._layoutWorkerData.set(layoutId, __assign(__assign({}, layout), { container: containerData, settings: this._settings, callback: callback, packet: packet, aborted: false }));
            // Try to send the next layout to worker for processing.
            this._sendToWorker();
            // Return the cancel method for this specific layout.
            return this.cancelLayout.bind(this, layoutId);
        };
        Packer.prototype.cancelLayout = function (layoutId) {
            var data = this._layoutWorkerData.get(layoutId);
            if (!data || data.aborted)
                return;
            // If the layout is queueing to worker we can safely just remove
            // all the refences to it, otherwise let's mark it as aborted.
            if (data.worker) {
                data.aborted = true;
            }
            else {
                var queueIndex = this._layoutWorkerQueue.indexOf(layoutId);
                this._layoutWorkerQueue.splice(queueIndex, 1);
                this._layoutWorkerData.delete(layoutId);
            }
        };
        Packer.prototype.destroy = function () {
            var _this = this;
            // Cancel all queueing and processing layouts, and move all currently used
            // workers back into the workers array.
            this._layoutWorkerData.forEach(function (data) {
                _this.cancelLayout(data.id);
                if (data.worker)
                    _this._workers.push(data.worker);
            });
            // Reset all the worker related data.
            this._layoutWorkerData.clear();
            this._layoutsProcessing.clear();
            this._layoutWorkerQueue.length = 0;
            // Destroy all workers.
            destroyWorkerProcessors(this._workers);
            this._workers.length = 0;
        };
        return Packer;
    }());

    var debounceId = 0;
    /**
     * Returns a function, that, as long as it continues to be invoked, will not
     * be triggered. The function will be called after it stops being called for
     * N milliseconds. The returned function accepts one argument which, when
     * being `true`, cancels the debounce function immediately. When the debounce
     * function is canceled it cannot be invoked again.
     *
     * @param {Function} fn
     * @param {number} durationMs
     * @returns {Function}
     */
    function debounce(fn, durationMs) {
        var id = ++debounceId;
        var timer = 0;
        var lastTime = 0;
        var isCanceled = false;
        var tick = function (time) {
            if (isCanceled)
                return;
            if (lastTime)
                timer -= time - lastTime;
            lastTime = time;
            if (timer > 0) {
                tick && addDebounceTick(id, tick);
            }
            else {
                timer = lastTime = 0;
                fn();
            }
        };
        return function debouncedFn(cancel) {
            if (cancel === void 0) { cancel = false; }
            if (isCanceled)
                return;
            if (durationMs <= 0) {
                if (cancel !== true)
                    fn();
                return;
            }
            if (cancel === true) {
                isCanceled = true;
                timer = lastTime = 0;
                tick = undefined;
                cancelDebounceTick(id);
                return;
            }
            if (timer <= 0) {
                timer = durationMs;
                tick && tick(0);
            }
            else {
                timer = durationMs;
            }
        };
    }

    var matches = Element.prototype.matches ||
        Element.prototype.webkitMatchesSelector ||
        // @ts-ignore
        Element.prototype.msMatchesSelector ||
        function () {
            return false;
        };
    /**
     * Check if element matches a CSS selector.
     *
     * @param {HTMLElement} el
     * @param {string} selector
     * @returns {boolean}
     */
    function elementMatches(el, selector) {
        return matches.call(el, selector);
    }

    var htmlCollectionType = '[object HTMLCollection]';
    var nodeListType = '[object NodeList]';
    /**
     * Check if a value is a node list or a html collection.
     *
     * @param {*} val
     * @returns {boolean}
     */
    function isNodeListOrHTMLCollection(val) {
        var type = Object.prototype.toString.call(val);
        return type === htmlCollectionType || type === nodeListType;
    }

    var toString = Object.prototype.toString;
    /**
     * Check if a value is a plain object.
     *
     * @param {*} val
     * @returns {boolean}
     */
    function isPlainObject(val) {
        return typeof val === 'object' && toString.call(val) === '[object Object]';
    }

    /**
     * Converts a value to an array or clones an array.
     *
     * @param {*} val
     * @returns {array}
     */
    function toArray(val) {
        return isNodeListOrHTMLCollection(val)
            ? Array.prototype.slice.call(val)
            : Array.prototype.concat(val);
    }

    var layoutId = 0;
    /**
     * Merge default settings with user settings. The returned object is a new
     * object with merged values. The merging is a deep merge meaning that all
     * objects and arrays within the provided settings objects will be also merged
     * so that modifying the values of the settings object will have no effect on
     * the returned object.
     *
     * @param {Object} baseSettings
     * @param {Object} [overrides={}]
     * @returns {Object}
     */
    function createSettings(baseSettings, overrides) {
        if (overrides === void 0) { overrides = {}; }
        // Create a fresh copy of default settings.
        var newSettings = mergeObjects({}, baseSettings);
        // Merge user settings to default settings.
        newSettings = mergeObjects(newSettings, overrides);
        // Handle visible/hidden styles manually so that the whole object is
        // overridden instead of the props.
        if (overrides.visibleStyles) {
            newSettings.visibleStyles = __assign({}, overrides.visibleStyles);
        }
        else if (baseSettings.visibleStyles) {
            newSettings.visibleStyles = __assign({}, baseSettings.visibleStyles);
        }
        if (overrides.hiddenStyles) {
            newSettings.hiddenStyles = __assign({}, overrides.hiddenStyles);
        }
        else if (baseSettings.hiddenStyles) {
            newSettings.hiddenStyles = __assign({}, baseSettings.hiddenStyles);
        }
        return newSettings;
    }
    /**
     * Merge two objects recursively (deep merge). The source object's properties
     * are merged to the target object.
     *
     * @param {Object} target
     * @param {Object} source
     * @returns {Object}
     */
    function mergeObjects(target, source) {
        var sourceKeys = Object.keys(source);
        var length = sourceKeys.length;
        var i = 0;
        for (; i < length; i++) {
            var propName = sourceKeys[i];
            var isSourceObject = isPlainObject(source[propName]);
            // If target and source values are both objects, merge the objects and
            // assign the merged value to the target property.
            if (isPlainObject(target[propName]) && isSourceObject) {
                target[propName] = mergeObjects(mergeObjects({}, target[propName]), source[propName]);
                continue;
            }
            // If source's value is object and target's is not let's clone the object as
            // the target's value.
            if (isSourceObject) {
                target[propName] = mergeObjects({}, source[propName]);
                continue;
            }
            // If source's value is an array let's clone the array as the target's
            // value.
            if (Array.isArray(source[propName])) {
                target[propName] = source[propName].slice(0);
                continue;
            }
            // In all other cases let's just directly assign the source's value as the
            // target's value.
            target[propName] = source[propName];
        }
        return target;
    }
    /**
     * Collect and return initial items for grid.
     *
     * @param {HTMLElement} gridElement
     * @param {(HTMLElement[]|NodeList|HtmlCollection|string)} elements
     * @returns {(HTMLElement[]|NodeList|HtmlCollection)}
     */
    function getInitialGridElements(gridElement, elements) {
        // If we have a wildcard selector let's return all the children.
        if (elements === '*') {
            return gridElement.children;
        }
        // If we have some more specific selector, let's filter the elements.
        if (typeof elements === 'string') {
            var result = [];
            var children = gridElement.children;
            var i = 0;
            for (; i < children.length; i++) {
                if (elementMatches(children[i], elements)) {
                    result.push(children[i]);
                }
            }
            return result;
        }
        // If we have an array of elements or a node list.
        if (Array.isArray(elements) || isNodeListOrHTMLCollection(elements)) {
            return elements;
        }
        // Otherwise just return an empty array.
        return [];
    }
    /**
     * Bind grid's resize handler to window.
     *
     * @param {Grid} grid
     * @param {(number|boolean)} delay
     */
    function bindLayoutOnResize(grid, delay) {
        if (typeof delay !== 'number') {
            delay = delay === true ? 0 : -1;
        }
        if (delay >= 0) {
            grid._resizeHandler = debounce(function () {
                grid.refreshItems().layout();
            }, delay);
            window.addEventListener('resize', grid._resizeHandler);
        }
    }
    /**
     * Unbind grid's resize handler from window.
     *
     * @param {Grid} grid
     */
    function unbindLayoutOnResize(grid) {
        if (grid._resizeHandler) {
            grid._resizeHandler(true);
            window.removeEventListener('resize', grid._resizeHandler);
            grid._resizeHandler = null;
        }
    }
    /**
     * Normalize style declaration object, returns a normalized (new) styles object
     * (prefixed properties and invalid properties removed).
     *
     * @param {Object} styles
     * @returns {Object}
     */
    function normalizeStyles(styles) {
        var normalized = {};
        var docElemStyle = document.documentElement.style;
        var prop;
        var prefixedProp;
        // Normalize visible styles (prefix and remove invalid).
        for (prop in styles) {
            if (!styles[prop])
                continue;
            prefixedProp = getPrefixedPropName(docElemStyle, prop);
            if (!prefixedProp)
                continue;
            normalized[prefixedProp] = styles[prop];
        }
        return normalized;
    }
    /**
     * Create index map from items.
     *
     * @param {Item[]} items
     * @returns {Object}
     */
    function createIndexMap(items) {
        var result = {};
        var i = 0;
        for (; i < items.length; i++) {
            result[items[i]._id] = i;
        }
        return result;
    }
    /**
     * Sort comparer function for items' index map.
     *
     * @param {Object} indexMap
     * @param {Item} itemA
     * @param {Item} itemB
     * @returns {number}
     */
    function compareIndexMap(indexMap, itemA, itemB) {
        var indexA = indexMap[itemA._id];
        var indexB = indexMap[itemB._id];
        return indexA - indexB;
    }
    /**
     * Check if the provided objects have same keys and and values.
     *
     * @param {Object} a
     * @param {Object} b
     * @returns {boolean}
     */
    function isEqualObjects(a, b) {
        var key;
        for (key in a) {
            if (a[key] !== b[key])
                return false;
        }
        return Object.keys(a).length === Object.keys(b).length;
    }
    /**
     * Creates a new Grid instance.
     *
     * @class
     * @param {(HTMLElement|string)} element
     * @param {Object} [options]
     * @param {(string|HTMLElement[]|NodeList|HTMLCollection)} [options.items="*"]
     * @param {number} [options.showDuration=300]
     * @param {string} [options.showEasing="ease"]
     * @param {Object} [options.visibleStyles={opacity: "1", transform: "scale(1)"}]
     * @param {number} [options.hideDuration=300]
     * @param {string} [options.hideEasing="ease"]
     * @param {Object} [options.hiddenStyles={opacity: "0", transform: "scale(0.5)"}]
     * @param {(Function|Object)} [options.layout]
     * @param {boolean} [options.layout.fillGaps=false]
     * @param {boolean} [options.layout.horizontal=false]
     * @param {boolean} [options.layout.alignRight=false]
     * @param {boolean} [options.layout.alignBottom=false]
     * @param {boolean} [options.layout.rounding=false]
     * @param {(boolean|number)} [options.layoutOnResize=150]
     * @param {boolean} [options.layoutOnInit=true]
     * @param {number} [options.layoutDuration=300]
     * @param {string} [options.layoutEasing="ease"]
     * @param {?Object} [options.sortData=null]
     * @param {boolean} [options.dragEnabled=false]
     * @param {?string} [options.dragHandle=null]
     * @param {?HTMLElement} [options.dragContainer=null]
     * @param {?Function} [options.dragStartPredicate]
     * @param {number} [options.dragStartPredicate.distance=0]
     * @param {number} [options.dragStartPredicate.delay=0]
     * @param {string} [options.dragAxis="xy"]
     * @param {(boolean|Function)} [options.dragSort=true]
     * @param {Object} [options.dragSortHeuristics]
     * @param {number} [options.dragSortHeuristics.sortInterval=100]
     * @param {number} [options.dragSortHeuristics.minDragDistance=10]
     * @param {number} [options.dragSortHeuristics.minBounceBackAngle=1]
     * @param {(Function|Object)} [options.dragSortPredicate]
     * @param {number} [options.dragSortPredicate.threshold=50]
     * @param {string} [options.dragSortPredicate.action="move"]
     * @param {string} [options.dragSortPredicate.migrateAction="move"]
     * @param {Object} [options.dragRelease]
     * @param {number} [options.dragRelease.duration=300]
     * @param {string} [options.dragRelease.easing="ease"]
     * @param {boolean} [options.dragRelease.useDragContainer=true]
     * @param {Object} [options.dragCssProps]
     * @param {string} [options.dragCssProps.touchAction="none"]
     * @param {string} [options.dragCssProps.userSelect="none"]
     * @param {string} [options.dragCssProps.userDrag="none"]
     * @param {string} [options.dragCssProps.tapHighlightColor="rgba(0, 0, 0, 0)"]
     * @param {string} [options.dragCssProps.touchCallout="none"]
     * @param {string} [options.dragCssProps.contentZooming="none"]
     * @param {Object} [options.dragEventListenerOptions]
     * @param {boolean} [options.dragEventListenerOptions.capture=false]
     * @param {boolean} [options.dragEventListenerOptions.passive=true]
     * @param {Object} [options.dragPlaceholder]
     * @param {boolean} [options.dragPlaceholder.enabled=false]
     * @param {?Function} [options.dragPlaceholder.createElement=null]
     * @param {?Function} [options.dragPlaceholder.onCreate=null]
     * @param {?Function} [options.dragPlaceholder.onRemove=null]
     * @param {Object} [options.dragAutoScroll]
     * @param {(Function|Array)} [options.dragAutoScroll.targets=[]]
     * @param {?Function} [options.dragAutoScroll.handle=null]
     * @param {number} [options.dragAutoScroll.threshold=50]
     * @param {number} [options.dragAutoScroll.safeZone=0.2]
     * @param {(Function|number)} [options.dragAutoScroll.speed]
     * @param {boolean} [options.dragAutoScroll.sortDuringScroll=true]
     * @param {boolean} [options.dragAutoScroll.smoothStop=false]
     * @param {?Function} [options.dragAutoScroll.onStart=null]
     * @param {?Function} [options.dragAutoScroll.onStop=null]
     * @param {string} [options.containerClass="muuri"]
     * @param {string} [options.itemClass="muuri-item"]
     * @param {string} [options.itemVisibleClass="muuri-item-visible"]
     * @param {string} [options.itemHiddenClass="muuri-item-hidden"]
     * @param {string} [options.itemPositioningClass="muuri-item-positioning"]
     * @param {string} [options.itemDraggingClass="muuri-item-dragging"]
     * @param {string} [options.itemReleasingClass="muuri-item-releasing"]
     * @param {string} [options.itemPlaceholderClass="muuri-item-placeholder"]
     * @param {boolean} [options._animationWindowing=false]
     */
    var Grid = /** @class */ (function () {
        function Grid(element, options) {
            if (options === void 0) { options = {}; }
            // Allow passing element as selector string
            if (typeof element === 'string') {
                var queriedElement = document.querySelector(element);
                if (!queriedElement)
                    throw new Error('No container element found.');
                element = queriedElement;
            }
            // Throw an error if the container element is not body element or does not
            // exist within the body element.
            var isElementInDom = element.getRootNode
                ? element.getRootNode({ composed: true }) === document
                : document.body.contains(element);
            if (!isElementInDom || element === document.documentElement) {
                throw new Error('Container element must be an existing DOM element.');
            }
            // Create instance settings by merging the options with default options.
            var settings = createSettings(Grid.defaultOptions, options);
            settings.visibleStyles = normalizeStyles(settings.visibleStyles);
            settings.hiddenStyles = normalizeStyles(settings.hiddenStyles);
            this._id = createUid();
            this._element = element;
            this._settings = settings;
            this._items = [];
            this._isDestroyed = false;
            this._width = 0;
            this._height = 0;
            this._left = 0;
            this._top = 0;
            this._right = 0;
            this._bottom = 0;
            this._borderLeft = 0;
            this._borderRight = 0;
            this._borderTop = 0;
            this._borderBottom = 0;
            this._boxSizing = '';
            this._itemLayoutNeedsDimensionRefresh = false;
            this._itemVisibilityNeedsDimensionRefresh = false;
            this._layout = {
                id: 0,
                items: [],
                slots: [],
            };
            this._isLayoutFinished = true;
            this._nextLayoutData = null;
            this._resizeHandler = null;
            this._emitter = new Emitter();
            this._onLayoutDataReceived = this._onLayoutDataReceived.bind(this);
            // Store grid instance to the grid instances collection.
            GRID_INSTANCES.set(this._id, this);
            // Add container element's class name.
            addClass(element, settings.containerClass);
            // If layoutOnResize option is a valid number sanitize it and bind the resize
            // handler.
            bindLayoutOnResize(this, settings.layoutOnResize);
            // Add initial items.
            this.add(getInitialGridElements(element, settings.items), { layout: false });
            // Layout on init if necessary.
            if (settings.layoutOnInit) {
                this.layout(true);
            }
        }
        /**
         * Emit a grid event.
         *
         * @private
         * @param {string} event
         * @param {...*} [args]
         */
        Grid.prototype._emit = function (event) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (this._isDestroyed)
                return;
            (_a = this._emitter).emit.apply(_a, __spreadArrays([event], args));
        };
        /**
         * Check if there are any events listeners for an event.
         *
         * @private
         * @param {string} event
         * @returns {boolean}
         */
        Grid.prototype._hasListeners = function (event) {
            if (this._isDestroyed)
                return false;
            return this._emitter.countListeners(event) > 0;
        };
        /**
         * Update container's width, height and offsets.
         *
         * @private
         */
        Grid.prototype._updateBoundingRect = function () {
            var element = this._element;
            var rect = element.getBoundingClientRect();
            this._width = rect.width;
            this._height = rect.height;
            this._left = rect.left;
            this._top = rect.top;
            this._right = rect.right;
            this._bottom = rect.bottom;
        };
        /**
         * Update container's border sizes.
         *
         * @private
         * @param {boolean} left
         * @param {boolean} right
         * @param {boolean} top
         * @param {boolean} bottom
         */
        Grid.prototype._updateBorders = function (left, right, top, bottom) {
            var element = this._element;
            if (left)
                this._borderLeft = getStyleAsFloat(element, 'border-left-width');
            if (right)
                this._borderRight = getStyleAsFloat(element, 'border-right-width');
            if (top)
                this._borderTop = getStyleAsFloat(element, 'border-top-width');
            if (bottom)
                this._borderBottom = getStyleAsFloat(element, 'border-bottom-width');
        };
        /**
         * Refresh all of container's internal dimensions and offsets.
         *
         * @private
         */
        Grid.prototype._updateDimensions = function () {
            this._updateBoundingRect();
            this._updateBorders(true, true, true, true);
            this._boxSizing = getStyle(this._element, 'box-sizing');
        };
        /**
         * Calculate and apply item positions.
         *
         * @private
         * @param {Object} layout
         */
        Grid.prototype._onLayoutDataReceived = function (layout) {
            var _this = this;
            if (this._isDestroyed || !this._nextLayoutData || this._nextLayoutData.id !== layout.id)
                return;
            var instant = this._nextLayoutData.instant;
            var onFinish = this._nextLayoutData.onFinish;
            var numItems = layout.items.length;
            var counter = numItems;
            var item;
            var left;
            var top;
            var i;
            // Reset next layout data.
            this._nextLayoutData = null;
            if (!this._isLayoutFinished && this._hasListeners(EVENT_LAYOUT_ABORT)) {
                this._emit(EVENT_LAYOUT_ABORT, this._layout.items.slice(0));
            }
            // Update the layout reference.
            this._layout = layout;
            // Update the item positions and collect all items that need to be laid
            // out. It is critical that we update the item position _before_ the
            // layoutStart event as the new data might be needed in the callback.
            var itemsToLayout = [];
            for (i = 0; i < numItems; i++) {
                item = layout.items[i];
                // Make sure we have a matching item.
                if (!item) {
                    --counter;
                    continue;
                }
                // Get the item's new left and top values.
                left = layout.slots[i * 2];
                top = layout.slots[i * 2 + 1];
                // Let's skip the layout process if we can. Possibly avoids a lot of DOM
                // operations which saves us some CPU cycles.
                if (item._canSkipLayout(left, top)) {
                    --counter;
                    continue;
                }
                // Update the item's position.
                item._left = left;
                item._top = top;
                // Only active non-dragged items need to be moved.
                if (item.isActive() && !item.isDragging()) {
                    itemsToLayout.push(item);
                }
                else {
                    --counter;
                }
            }
            // Set layout styles to the grid element.
            if (layout.styles) {
                setStyles(this._element, layout.styles);
            }
            // layoutStart event is intentionally emitted after the container element's
            // dimensions are set, because otherwise there would be no hook for reacting
            // to container dimension changes.
            if (this._hasListeners(EVENT_LAYOUT_START)) {
                this._emit(EVENT_LAYOUT_START, layout.items.slice(0), instant);
                // Let's make sure that the current layout process has not been overridden
                // in the layoutStart event, and if so, let's stop processing the aborted
                // layout.
                if (this._layout.id !== layout.id)
                    return;
            }
            var tryFinish = function () {
                if (--counter > 0)
                    return;
                var isAborted = _this._layout.id !== layout.id;
                if (!isAborted) {
                    _this._isLayoutFinished = true;
                }
                if (isFunction(onFinish)) {
                    onFinish(layout.items.slice(0), isAborted);
                }
                if (!isAborted && _this._hasListeners(EVENT_LAYOUT_END)) {
                    _this._emit(EVENT_LAYOUT_END, layout.items.slice(0));
                }
            };
            if (!itemsToLayout.length) {
                tryFinish();
                return this;
            }
            this._isLayoutFinished = false;
            for (i = 0; i < itemsToLayout.length; i++) {
                if (this._layout.id !== layout.id)
                    break;
                itemsToLayout[i]._layout.start(instant, tryFinish);
            }
            return this;
        };
        /**
         * Show or hide Grid instance's items.
         *
         * @private
         * @param {Item[]} items
         * @param {boolean} toVisible
         * @param {Object} [options]
         * @param {boolean} [options.instant=false]
         * @param {boolean} [options.syncWithLayout=true]
         * @param {Function} [options.onFinish]
         * @param {(boolean|Function|string)} [options.layout=true]
         */
        Grid.prototype._setItemsVisibility = function (items, toVisible, options) {
            var _this = this;
            if (options === void 0) { options = {}; }
            var targetItems = items.slice(0);
            var isInstant = options.instant === true;
            var callback = options.onFinish;
            var layout = options.layout ? options.layout : options.layout === undefined;
            var startEvent = toVisible ? EVENT_SHOW_START : EVENT_HIDE_START;
            var endEvent = toVisible ? EVENT_SHOW_END : EVENT_HIDE_END;
            var method = toVisible ? 'show' : 'hide';
            var completedItems = [];
            var hiddenItems = [];
            var needsLayout = false;
            var counter = targetItems.length;
            var item;
            var i;
            // If there are no items call the callback, but don't emit any events.
            if (!counter) {
                if (isFunction(callback))
                    callback(targetItems);
                return;
            }
            // Prepare the items.
            for (i = 0; i < targetItems.length; i++) {
                item = targetItems[i];
                // If inactive item is shown or active item is hidden we need to do
                // layout.
                if ((toVisible && !item._isActive) || (!toVisible && item._isActive)) {
                    needsLayout = true;
                }
                // If inactive item is shown we also need to do a little hack to make the
                // item not animate it's next positioning (layout).
                item._layout._skipNextAnimation = !!(toVisible && !item._isActive);
                // If a hidden item is being shown we need to refresh the item's
                // dimensions.
                if (toVisible && !item.isVisible() && !item.isHiding()) {
                    hiddenItems.push(item);
                }
                // Add item to layout or remove it from layout.
                if (toVisible) {
                    item._addToLayout();
                }
                else {
                    item._removeFromLayout();
                }
            }
            // Force refresh the dimensions of all hidden items.
            // TODO: How can we avoid this?
            //       - 1. Set item visibility: 'hidden' and display: ''
            //       - 2. Read the dimensions in the next read tick.
            //       - 3. Set item visibility: '' and display: 'none' in the following write tick or maybe just continue the flow there already.
            //       - 4. Continue with the normal flow. To make this simpler we could always do this
            //            one tick delay.
            if (hiddenItems.length) {
                this.refreshItems(hiddenItems, true);
                hiddenItems.length = 0;
            }
            // Show the items in sync with the next layout.
            var triggerVisibilityChange = function () {
                if (needsLayout && options.syncWithLayout !== false) {
                    _this.off(EVENT_LAYOUT_START, triggerVisibilityChange);
                }
                if (_this._hasListeners(startEvent)) {
                    _this._emit(startEvent, targetItems.slice(0));
                }
                for (i = 0; i < targetItems.length; i++) {
                    // Make sure the item is still in the original grid. There is a chance
                    // that the item starts migrating before tiggerVisibilityChange is called.
                    if (targetItems[i]._gridId !== _this._id) {
                        if (--counter < 1) {
                            if (isFunction(callback))
                                callback(completedItems.slice(0));
                            if (_this._hasListeners(endEvent))
                                _this._emit(endEvent, completedItems.slice(0));
                        }
                        continue;
                    }
                    targetItems[i]._visibility[method](isInstant, function (interrupted, item) {
                        // If the current item's animation was not interrupted add it to the
                        // completedItems array.
                        if (!interrupted)
                            completedItems.push(item);
                        // If all items have finished their animations call the callback
                        // and emit showEnd/hideEnd event.
                        if (--counter < 1) {
                            if (isFunction(callback))
                                callback(completedItems.slice(0));
                            if (_this._hasListeners(endEvent))
                                _this._emit(endEvent, completedItems.slice(0));
                        }
                    });
                }
            };
            // Trigger the visibility change, either async with layout or instantly.
            if (needsLayout && options.syncWithLayout !== false) {
                this.on(EVENT_LAYOUT_START, triggerVisibilityChange);
            }
            else {
                triggerVisibilityChange();
            }
            // Trigger layout if needed.
            if (needsLayout && layout) {
                this.layout(layout === INSTANT_LAYOUT, isFunction(layout) ? layout : undefined);
            }
        };
        /**
         * Bind an event listener.
         *
         * @public
         * @param {string} event
         * @param {Function} listener
         * @returns {Grid}
         */
        Grid.prototype.on = function (event, listener) {
            this._emitter.on(event, listener);
            return this;
        };
        /**
         * Unbind an event listener.
         *
         * @public
         * @param {string} event
         * @param {Function} listener
         * @returns {Grid}
         */
        Grid.prototype.off = function (event, listener) {
            this._emitter.off(event, listener);
            return this;
        };
        /**
         * Get the container element.
         *
         * @public
         * @returns {HTMLElement}
         */
        Grid.prototype.getElement = function () {
            return this._element;
        };
        /**
         * Get instance's item by element or by index. Target can also be an Item
         * instance in which case the function returns the item if it exists within
         * related Grid instance. If nothing is found with the provided target, null
         * is returned.
         *
         * @private
         * @param {(HTMLElement|Item|number)} [target]
         * @returns {?Item}
         */
        Grid.prototype.getItem = function (target) {
            // If no target is specified or the instance is destroyed, return null.
            if (this._isDestroyed || (!target && target !== 0)) {
                return null;
            }
            // If target is number return the item in that index. If the number is lower
            // than zero look for the item starting from the end of the items array. For
            // example -1 for the last item, -2 for the second last item, etc.
            if (typeof target === 'number') {
                return this._items[target > -1 ? target : this._items.length + target] || null;
            }
            // If the target is an instance of Item return it if it is attached to this
            // Grid instance, otherwise return null.
            if (target instanceof Item) {
                return target._gridId === this._id ? target : null;
            }
            // In other cases let's assume that the target is an element, so let's try
            // to find an item that matches the element and return it. If item is not
            // found return null.
            var item = ITEM_ELEMENT_MAP.get(target);
            return item && item._gridId === this._id ? item : null;
        };
        /**
         * Get all items. Optionally you can provide specific targets (elements,
         * indices and item instances). All items that are not found are omitted from
         * the returned array.
         *
         * @public
         * @param {(HTMLElement|Item|number|Array)} [targets]
         * @returns {Item[]}
         */
        Grid.prototype.getItems = function (targets) {
            // Return all items immediately if no targets were provided or if the
            // instance is destroyed.
            if (this._isDestroyed || targets === undefined) {
                return this._items.slice(0);
            }
            var items = [];
            if (Array.isArray(targets) || isNodeListOrHTMLCollection(targets)) {
                var item = void 0;
                var i = 0;
                for (; i < targets.length; i++) {
                    item = this.getItem(targets[i]);
                    if (item)
                        items.push(item);
                }
            }
            else {
                var item = this.getItem(targets);
                if (item)
                    items.push(item);
            }
            return items;
        };
        /**
         * Update the grid's settings.
         *
         * @public
         * @param {Object} options
         * @returns {Grid}
         */
        Grid.prototype.updateSettings = function (options) {
            if (this._isDestroyed || !options)
                return this;
            var settings = this._settings;
            var items = this._items;
            var itemClasses = [];
            var dragEnabledChanged = false;
            var dragHandleChanged = false;
            var dragCssPropsChanged = false;
            var dragEventListenerOptionsChanged = false;
            var visibleStylesChanged = false;
            var hiddenStylesChanged = false;
            // Create new settings object.
            var nextSettings = createSettings(settings, options);
            nextSettings.visibleStyles = normalizeStyles(nextSettings.visibleStyles);
            nextSettings.hiddenStyles = normalizeStyles(nextSettings.hiddenStyles);
            // Update internal settings object.
            this._settings = nextSettings;
            // Handle all options that need special care.
            for (var option in options) {
                switch (option) {
                    case 'visibleStyles': {
                        visibleStylesChanged = !isEqualObjects(settings[option], nextSettings[option]);
                        break;
                    }
                    case 'hiddenStyles': {
                        hiddenStylesChanged = !isEqualObjects(settings[option], nextSettings[option]);
                        break;
                    }
                    case 'dragEnabled': {
                        dragEnabledChanged = settings[option] !== nextSettings[option];
                        break;
                    }
                    case 'dragHandle': {
                        dragHandleChanged = settings[option] !== nextSettings[option];
                        break;
                    }
                    case 'dragCssProps': {
                        dragCssPropsChanged = !isEqualObjects(settings[option], nextSettings[option]);
                        break;
                    }
                    case 'dragEventListenerOptions': {
                        dragEventListenerOptionsChanged = !isEqualObjects(settings[option], nextSettings[option]);
                        break;
                    }
                    case 'layoutOnResize': {
                        if (settings[option] !== nextSettings[option]) {
                            unbindLayoutOnResize(this);
                            bindLayoutOnResize(this, nextSettings[option]);
                        }
                        break;
                    }
                    case 'containerClass': {
                        if (settings[option] !== nextSettings[option]) {
                            removeClass(this._element, settings[option]);
                            addClass(this._element, nextSettings[option]);
                        }
                        break;
                    }
                    case 'itemClass':
                    case 'itemVisibleClass':
                    case 'itemHiddenClass':
                    case 'itemPositioningClass':
                    case 'itemDraggingClass':
                    case 'itemReleasingClass':
                    case 'itemPlaceholderClass': {
                        if (settings[option] !== nextSettings[option]) {
                            itemClasses.push(option, settings[option], nextSettings[option]);
                        }
                        break;
                    }
                }
            }
            // If any property changed that needs updating in the item level, let's loop
            // through the items and do the updates.
            if (itemClasses.length ||
                visibleStylesChanged ||
                hiddenStylesChanged ||
                dragEnabledChanged ||
                dragHandleChanged ||
                dragCssPropsChanged ||
                dragEventListenerOptionsChanged) {
                var i = void 0;
                var j = void 0;
                for (i = 0; i < items.length; i++) {
                    var item = items[i];
                    // Handle item class name changes.
                    for (j = 0; j < itemClasses.length; j += 3) {
                        var option = itemClasses[j];
                        var currentValue = itemClasses[j + 1];
                        var nextValue = itemClasses[j + 2];
                        var switchClass = false;
                        switch (option) {
                            case 'itemClass': {
                                switchClass = true;
                                break;
                            }
                            case 'itemVisibleClass': {
                                switchClass = item.isVisible();
                                break;
                            }
                            case 'itemHiddenClass': {
                                switchClass = !item.isVisible();
                                break;
                            }
                            case 'itemPositioningClass': {
                                switchClass = item.isPositioning();
                                break;
                            }
                            case 'itemDraggingClass': {
                                switchClass = item.isDragging();
                                break;
                            }
                            case 'itemReleasingClass': {
                                switchClass = item.isReleasing();
                                break;
                            }
                            case 'itemPlaceholderClass': {
                                if (item._dragPlaceholder)
                                    item._dragPlaceholder.updateClassName(nextValue);
                                break;
                            }
                        }
                        if (switchClass) {
                            removeClass(item._element, currentValue);
                            addClass(item._element, nextValue);
                        }
                    }
                    // Handle visibleStyles/hiddenStyles change.
                    if (item.isActive()) {
                        if (visibleStylesChanged) {
                            item._visibility.setStyles(nextSettings.visibleStyles);
                            item._visibility.stop(true);
                        }
                    }
                    else {
                        if (hiddenStylesChanged) {
                            item._visibility.setStyles(nextSettings.hiddenStyles);
                            item._visibility.stop(true);
                        }
                    }
                    if ((dragHandleChanged || dragEnabledChanged) &&
                        item._drag &&
                        item._drag.getRootGrid() === this) {
                        item._drag.destroy();
                        item._drag = null;
                    }
                    if (nextSettings.dragEnabled) {
                        if (item._drag) {
                            if (item._drag.getRootGrid() === this) {
                                if (dragCssPropsChanged) {
                                    item._drag._dragger.setCssProps(nextSettings.dragCssProps);
                                }
                                if (dragEventListenerOptionsChanged) {
                                    item._drag._dragger.setListenerOptions(nextSettings.dragEventListenerOptions);
                                }
                            }
                        }
                        else {
                            item._drag = new ItemDrag(item);
                        }
                    }
                }
            }
            // Lastly, update sort data if it potentially changed.
            if ('sortData' in options) {
                this.refreshSortData();
            }
            return this;
        };
        /**
         * Update the cached dimensions of the instance's items. By default all the
         * items are refreshed, but you can also provide an array of target items as the
         * first argument if you want to refresh specific items. Note that all hidden
         * items are not refreshed by default since their "display" property is "none"
         * and their dimensions are therefore not readable from the DOM. However, if you
         * do want to force update hidden item dimensions too you can provide `true`
         * as the second argument, which makes the elements temporarily visible while
         * their dimensions are being read.
         *
         * @public
         * @param {Item[]} [items]
         * @param {boolean} [force=false]
         * @returns {Grid}
         */
        Grid.prototype.refreshItems = function (items, force) {
            if (force === void 0) { force = false; }
            if (this._isDestroyed)
                return this;
            var targets = items || this._items;
            var i;
            var item;
            var style;
            var hiddenItemStyles;
            if (force === true) {
                hiddenItemStyles = [];
                for (i = 0; i < targets.length; i++) {
                    item = targets[i];
                    if (!item.isVisible() && !item.isHiding()) {
                        style = item.getElement().style;
                        style.visibility = 'hidden';
                        style.display = '';
                        hiddenItemStyles.push(style);
                    }
                }
            }
            for (i = 0; i < targets.length; i++) {
                targets[i]._updateDimensions(force);
            }
            if (hiddenItemStyles) {
                for (i = 0; i < hiddenItemStyles.length; i++) {
                    style = hiddenItemStyles[i];
                    style.visibility = '';
                    style.display = 'none';
                }
                hiddenItemStyles.length = 0;
            }
            return this;
        };
        /**
         * Update the sort data of the instance's items. By default all the items are
         * refreshed, but you can also provide an array of target items if you want to
         * refresh specific items.
         *
         * @public
         * @param {Item[]} [items]
         * @returns {Grid}
         */
        Grid.prototype.refreshSortData = function (items) {
            if (this._isDestroyed)
                return this;
            var targets = items || this._items;
            var i = 0;
            for (; i < targets.length; i++) {
                targets[i]._updateSortData();
            }
            return this;
        };
        /**
         * Synchronize the item elements to match the order of the items in the DOM.
         * This comes handy if you need to keep the DOM structure matched with the
         * order of the items. Note that if an item's element is not currently a child
         * of the container element (if it is dragged for example) it is ignored and
         * left untouched.
         *
         * @public
         * @returns {Grid}
         */
        Grid.prototype.synchronize = function () {
            if (this._isDestroyed)
                return this;
            var items = this._items;
            if (!items.length)
                return this;
            var fragment;
            var element;
            var i = 0;
            for (; i < items.length; i++) {
                element = items[i]._element;
                if (element.parentNode === this._element) {
                    if (!fragment)
                        fragment = document.createDocumentFragment();
                    fragment.appendChild(element);
                }
            }
            if (!fragment)
                return this;
            this._element.appendChild(fragment);
            this._emit(EVENT_SYNCHRONIZE);
            return this;
        };
        /**
         * Calculate and apply item positions.
         *
         * @public
         * @param {boolean} [instant=false]
         * @param {Function} [onFinish]
         * @returns {Grid}
         */
        Grid.prototype.layout = function (instant, onFinish) {
            if (instant === void 0) { instant = false; }
            if (this._isDestroyed)
                return this;
            // Cancel unfinished layout algorithm if possible.
            var unfinishedLayout = this._nextLayoutData;
            if (unfinishedLayout && isFunction(unfinishedLayout.cancel)) {
                unfinishedLayout.cancel();
            }
            // Compute layout id (let's stay in Float32 range).
            var nextLayoutId = (layoutId = (layoutId % MAX_SAFE_FLOAT32_INTEGER) + 1);
            // Store data for next layout.
            this._nextLayoutData = {
                id: nextLayoutId,
                instant: instant,
                onFinish: onFinish,
                cancel: null,
            };
            // Collect layout items (all active grid items).
            var items = this._items;
            var layoutItems = [];
            var i = 0;
            for (; i < items.length; i++) {
                if (items[i]._isActive)
                    layoutItems.push(items[i]);
            }
            // Compute new layout.
            // TODO: This causes forced reflows. As we already have async layout system
            // Maybe we could always postpone this to the next tick's read queue and
            // then start the layout process in the write tick?
            this._updateDimensions();
            var gridWidth = this._width - this._borderLeft - this._borderRight;
            var gridHeight = this._height - this._borderTop - this._borderBottom;
            var layoutSettings = this._settings.layout;
            var cancelLayout;
            if (isFunction(layoutSettings)) {
                cancelLayout = layoutSettings(this, nextLayoutId, layoutItems, gridWidth, gridHeight, this._onLayoutDataReceived);
            }
            else {
                Grid.defaultPacker.updateSettings(layoutSettings);
                cancelLayout = Grid.defaultPacker.createLayout(this, nextLayoutId, layoutItems, gridWidth, gridHeight, this._onLayoutDataReceived);
            }
            // Store layout cancel method if available.
            if (isFunction(cancelLayout) &&
                this._nextLayoutData &&
                this._nextLayoutData.id === nextLayoutId) {
                this._nextLayoutData.cancel = cancelLayout;
            }
            return this;
        };
        /**
         * Add new items by providing the elements you wish to add to the instance and
         * optionally provide the index where you want the items to be inserted into.
         * All elements that are not already children of the container element will be
         * automatically appended to the container element. If an element has it's CSS
         * display property set to "none" it will be marked as inactive during the
         * initiation process. As long as the item is inactive it will not be part of
         * the layout, but it will retain it's index. You can activate items at any
         * point with grid.show() method. This method will automatically call
         * grid.layout() if one or more of the added elements are visible. If only
         * hidden items are added no layout will be called. All the new visible items
         * are positioned without animation during their first layout.
         *
         * @public
         * @param {(HTMLElement|HTMLElement[])} elements
         * @param {Object} [options]
         * @param {number} [options.index=-1]
         * @param {boolean} [options.active]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Item[]}
         */
        Grid.prototype.add = function (elements, options) {
            if (options === void 0) { options = {}; }
            if (this._isDestroyed || !elements)
                return [];
            var newElements = toArray(elements);
            if (!newElements.length)
                return [];
            var layout = options.layout ? options.layout : options.layout === undefined;
            var items = this._items;
            var needsLayout = false;
            var fragment;
            var element;
            var item;
            var i;
            // Collect all the elements that are not child of the grid element into a
            // document fragment.
            for (i = 0; i < newElements.length; i++) {
                element = newElements[i];
                if (element.parentNode !== this._element) {
                    fragment = fragment || document.createDocumentFragment();
                    fragment.appendChild(element);
                }
            }
            // If we have a fragment, let's append it to the grid element. We could just
            // not do this and the `new Item()` instantiation would handle this for us,
            // but this way we can add the elements into the DOM a bit faster.
            if (fragment) {
                this._element.appendChild(fragment);
            }
            // Map provided elements into new grid items.
            var newItems = [];
            for (i = 0; i < newElements.length; i++) {
                element = newElements[i];
                item = newItems[i] = new Item(this, element, options.active);
                // If the item to be added is active, we need to do a layout. Also, we
                // need to mark the item with the skipNextAnimation flag to make it
                // position instantly (without animation) during the next layout. Without
                // the hack the item would animate to it's new position from the northwest
                // corner of the grid, which feels a bit buggy (imho).
                if (item._isActive) {
                    needsLayout = true;
                    item._layout._skipNextAnimation = true;
                }
            }
            // Set up the items' initial dimensions and sort data. This needs to be done
            // in a separate loop to avoid layout thrashing.
            for (i = 0; i < newItems.length; i++) {
                item = newItems[i];
                item._updateDimensions();
                item._updateSortData();
            }
            // Add the new items to the items collection to correct index.
            arrayInsert(items, newItems, options.index);
            // Emit add event.
            if (this._hasListeners(EVENT_ADD)) {
                this._emit(EVENT_ADD, newItems.slice(0));
            }
            // If layout is needed.
            if (needsLayout && layout) {
                this.layout(layout === INSTANT_LAYOUT, isFunction(layout) ? layout : undefined);
            }
            return newItems;
        };
        /**
         * Remove items from the instance.
         *
         * @public
         * @param {Item[]} items
         * @param {Object} [options]
         * @param {boolean} [options.removeElements=false]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Item[]}
         */
        Grid.prototype.remove = function (items, options) {
            if (options === void 0) { options = {}; }
            if (this._isDestroyed || !items.length)
                return [];
            var layout = options.layout ? options.layout : options.layout === undefined;
            var allItems = this.getItems();
            var targetItems = [];
            var indices = [];
            var needsLayout = false;
            var index;
            var item;
            var i;
            // Remove the individual items.
            for (i = 0; i < items.length; i++) {
                item = items[i];
                if (item._isDestroyed)
                    continue;
                index = this._items.indexOf(item);
                if (index === -1)
                    continue;
                if (item._isActive)
                    needsLayout = true;
                targetItems.push(item);
                indices.push(allItems.indexOf(item));
                item._destroy(options.removeElements);
                this._items.splice(index, 1);
            }
            // Emit remove event.
            if (this._hasListeners(EVENT_REMOVE)) {
                this._emit(EVENT_REMOVE, targetItems.slice(0), indices);
            }
            // If layout is needed.
            if (needsLayout && layout) {
                this.layout(layout === INSTANT_LAYOUT, isFunction(layout) ? layout : undefined);
            }
            return targetItems;
        };
        /**
         * Show specific instance items.
         *
         * @public
         * @param {Item[]} items
         * @param {Object} [options]
         * @param {boolean} [options.instant=false]
         * @param {boolean} [options.syncWithLayout=true]
         * @param {Function} [options.onFinish]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Grid}
         */
        Grid.prototype.show = function (items, options) {
            if (options === void 0) { options = {}; }
            if (!this._isDestroyed && items.length) {
                this._setItemsVisibility(items, true, options);
            }
            return this;
        };
        /**
         * Hide specific instance items.
         *
         * @public
         * @param {Item[]} items
         * @param {Object} [options]
         * @param {boolean} [options.instant=false]
         * @param {boolean} [options.syncWithLayout=true]
         * @param {Function} [options.onFinish]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Grid}
         */
        Grid.prototype.hide = function (items, options) {
            if (options === void 0) { options = {}; }
            if (!this._isDestroyed && items.length) {
                this._setItemsVisibility(items, false, options);
            }
            return this;
        };
        /**
         * Filter items. Expects at least one argument, a predicate, which should be
         * either a function or a string. The predicate callback is executed for every
         * item in the instance. If the return value of the predicate is truthy the
         * item in question will be shown and otherwise hidden. The predicate callback
         * receives the item instance as it's argument. If the predicate is a string
         * it is considered to be a selector and it is checked against every item
         * element in the instance with the native element.matches() method. All the
         * matching items will be shown and others hidden.
         *
         * @public
         * @param {(Function|string)} predicate
         * @param {Object} [options]
         * @param {boolean} [options.instant=false]
         * @param {boolean} [options.syncWithLayout=true]
         * @param {FilterCallback} [options.onFinish]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Grid}
         */
        Grid.prototype.filter = function (predicate, options) {
            if (options === void 0) { options = {}; }
            if (this._isDestroyed || !this._items.length)
                return this;
            // Check which items need to be shown and which hidden.
            var itemsToShow = [];
            var itemsToHide = [];
            if (isFunction(predicate) || typeof predicate === 'string') {
                var item = void 0;
                var i = void 0;
                for (i = 0; i < this._items.length; i++) {
                    item = this._items[i];
                    if (isFunction(predicate) ? predicate(item) : elementMatches(item._element, predicate)) {
                        itemsToShow.push(item);
                    }
                    else {
                        itemsToHide.push(item);
                    }
                }
            }
            var onFinish = isFunction(options.onFinish) ? options.onFinish : undefined;
            var shownItems = [];
            var hiddenItems = [];
            var finishCounter = -1;
            // Show items that need to be shown.
            if (itemsToShow.length) {
                this.show(itemsToShow, {
                    instant: !!options.instant,
                    syncWithLayout: !!options.syncWithLayout,
                    onFinish: onFinish
                        ? function (items) {
                            shownItems = items;
                            ++finishCounter && onFinish(shownItems, hiddenItems);
                        }
                        : undefined,
                    layout: false,
                });
            }
            else if (onFinish) {
                ++finishCounter && onFinish(shownItems, hiddenItems);
            }
            // Hide items that need to be hidden.
            if (itemsToHide.length) {
                this.hide(itemsToHide, {
                    instant: !!options.instant,
                    syncWithLayout: !!options.syncWithLayout,
                    onFinish: onFinish
                        ? function (items) {
                            hiddenItems = items;
                            ++finishCounter && onFinish(shownItems, hiddenItems);
                        }
                        : undefined,
                    layout: false,
                });
            }
            else if (onFinish) {
                ++finishCounter && onFinish(shownItems, hiddenItems);
            }
            // If there are any items to filter.
            if (itemsToShow.length || itemsToHide.length) {
                // Emit filter event.
                if (this._hasListeners(EVENT_FILTER)) {
                    this._emit(EVENT_FILTER, itemsToShow.slice(0), itemsToHide.slice(0));
                }
                // If layout is needed.
                var layout = options.layout ? options.layout : options.layout === undefined;
                if (layout) {
                    this.layout(layout === INSTANT_LAYOUT, isFunction(layout) ? layout : undefined);
                }
            }
            return this;
        };
        /**
         * Sort items. There are three ways to sort the items. The first is simply by
         * providing a function as the comparer which works identically to native
         * array sort. Alternatively you can sort by the sort data you have provided
         * in the instance's options. Just provide the sort data key(s) as a string
         * (separated by space) and the items will be sorted based on the provided
         * sort data keys. Lastly you have the opportunity to provide a presorted
         * array of items which will be used to sync the internal items array in the
         * same order.
         *
         * @param {(Function|string|Item[])} comparer
         * @param {Object} [options]
         * @param {boolean} [options.descending=false]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Grid}
         */
        Grid.prototype.sort = function (comparer, options) {
            if (options === void 0) { options = {}; }
            if (this._isDestroyed || this._items.length < 2)
                return this;
            var items = this._items;
            var origItems = items.slice(0);
            var layout = options.layout ? options.layout : options.layout === undefined;
            var isDescending = !!options.descending;
            var indexMap = null;
            // If function is provided do a native array sort.
            if (isFunction(comparer)) {
                items.sort(function (a, b) {
                    var result = isDescending ? -comparer(a, b) : comparer(a, b);
                    if (!result) {
                        if (!indexMap)
                            indexMap = createIndexMap(origItems);
                        result = isDescending ? compareIndexMap(indexMap, b, a) : compareIndexMap(indexMap, a, b);
                    }
                    return result;
                });
            }
            // Otherwise if we got a string, let's sort by the sort data as provided in
            // the instance's options.
            else if (typeof comparer === 'string') {
                var sortCriteria_1 = comparer
                    .trim()
                    .split(' ')
                    .filter(function (val) {
                    return val;
                })
                    .map(function (val) {
                    return val.split(':');
                });
                items.sort(function (a, b) {
                    var result = 0;
                    var i = 0;
                    // Loop through the list of sort criteria.
                    for (; i < sortCriteria_1.length; i++) {
                        // Get the criteria name, which should match an item's sort data key.
                        var criteriaName = sortCriteria_1[i][0];
                        var criteriaOrder = sortCriteria_1[i][1];
                        // Get items' cached sort values for the criteria. If the item has no sort
                        // data let's update the items sort data (this is a lazy load mechanism).
                        if (a._sortData === null)
                            a._updateSortData();
                        if (b._sortData === null)
                            b._updateSortData();
                        var valA = a._sortData[criteriaName];
                        var valB = b._sortData[criteriaName];
                        // Sort the items in descending order if defined so explicitly. Otherwise
                        // sort items in ascending order.
                        if (criteriaOrder === 'desc' || (!criteriaOrder && isDescending)) {
                            result = valB < valA ? -1 : valB > valA ? 1 : 0;
                        }
                        else {
                            result = valA < valB ? -1 : valA > valB ? 1 : 0;
                        }
                        // If we have -1 or 1 as the return value, let's return it immediately.
                        if (result)
                            return result;
                    }
                    // If values are equal let's compare the item indices to make sure we
                    // have a stable sort. Note that this is not necessary in evergreen browsers
                    // because Array.sort() is nowadays stable. However, in order to guarantee
                    // same results in older browsers we need this.
                    if (!result) {
                        if (!indexMap)
                            indexMap = createIndexMap(origItems);
                        result = isDescending ? compareIndexMap(indexMap, b, a) : compareIndexMap(indexMap, a, b);
                    }
                    return result;
                });
            }
            // Otherwise if we got an array, let's assume it's a presorted array of the
            // items and order the items based on it. Here we blindly trust that the
            // presorted array consists of the same item instances as the current
            // `gird._items` array.
            else if (Array.isArray(comparer)) {
                items.length = 0;
                items.push.apply(items, comparer);
            }
            // Otherwise let's throw an error.
            else {
                throw new Error('Invalid comparer argument provided.');
            }
            // Emit sort event.
            if (this._hasListeners(EVENT_SORT)) {
                this._emit(EVENT_SORT, items.slice(0), origItems);
            }
            // If layout is needed.
            if (layout) {
                this.layout(layout === INSTANT_LAYOUT, isFunction(layout) ? layout : undefined);
            }
            return this;
        };
        /**
         * Move item to another index or in place of another item.
         *
         * @public
         * @param {(Item|HTMLElement|number)} item
         * @param {(Item|HTMLElement|number)} position
         * @param {Object} [options]
         * @param {string} [options.action="move"]
         * @param {(boolean|Function|string)} [options.layout=true]
         * @returns {Grid}
         */
        Grid.prototype.move = function (item, position, options) {
            if (options === void 0) { options = {}; }
            if (this._isDestroyed || this._items.length < 2)
                return this;
            var items = this._items;
            var layout = options.layout ? options.layout : options.layout === undefined;
            var isSwap = options.action === ACTION_SWAP;
            var action = isSwap ? ACTION_SWAP : ACTION_MOVE;
            var fromItem = this.getItem(item);
            var toItem = this.getItem(position);
            // Make sure the items exist and are not the same.
            if (fromItem && toItem && fromItem !== toItem) {
                // Get the indices of the items.
                var fromIndex = items.indexOf(fromItem);
                var toIndex = items.indexOf(toItem);
                // Do the move/swap.
                if (isSwap) {
                    arraySwap(items, fromIndex, toIndex);
                }
                else {
                    arrayMove(items, fromIndex, toIndex);
                }
                // Emit move event.
                if (this._hasListeners(EVENT_MOVE)) {
                    this._emit(EVENT_MOVE, {
                        item: fromItem,
                        fromIndex: fromIndex,
                        toIndex: toIndex,
                        action: action,
                    });
                }
                // If layout is needed.
                if (layout) {
                    this.layout(layout === INSTANT_LAYOUT, isFunction(layout) ? layout : undefined);
                }
            }
            return this;
        };
        /**
         * Send item to another Grid instance.
         *
         * @public
         * @param {(Item|HTMLElement|number)} item
         * @param {Grid} targetGrid
         * @param {(Item|HTMLElement|number)} position
         * @param {Object} [options]
         * @param {HTMLElement} [options.appendTo=document.body]
         * @param {(boolean|Function|string)} [options.layoutSender=true]
         * @param {(boolean|Function|string)} [options.layoutReceiver=true]
         * @returns {Grid}
         */
        Grid.prototype.send = function (item, targetGrid, position, options) {
            if (options === void 0) { options = {}; }
            if (this._isDestroyed || targetGrid._isDestroyed || this === targetGrid)
                return this;
            // Make sure we have a valid target item.
            var targetItem = this.getItem(item);
            if (!targetItem)
                return this;
            // Start the migration process.
            targetItem._migrate.start(targetGrid, position, options.appendTo || document.body);
            // If migration was started successfully and the item is active, let's layout
            // the grids.
            if (targetItem._migrate._isActive && targetItem._isActive) {
                var layoutSender = options.layoutSender
                    ? options.layoutSender
                    : options.layoutSender === undefined;
                var layoutReceiver = options.layoutReceiver
                    ? options.layoutReceiver
                    : options.layoutReceiver === undefined;
                if (layoutSender) {
                    this.layout(layoutSender === INSTANT_LAYOUT, isFunction(layoutSender) ? layoutSender : undefined);
                }
                if (layoutReceiver) {
                    targetGrid.layout(layoutReceiver === INSTANT_LAYOUT, isFunction(layoutReceiver) ? layoutReceiver : undefined);
                }
            }
            return this;
        };
        /**
         * Destroy the instance.
         *
         * @public
         * @param {boolean} [removeElements=false]
         * @returns {Grid}
         */
        Grid.prototype.destroy = function (removeElements) {
            if (removeElements === void 0) { removeElements = false; }
            if (this._isDestroyed)
                return this;
            var container = this._element;
            var items = this.getItems();
            var layoutStyles = (this._layout && this._layout.styles) || {};
            // Unbind window resize event listener.
            unbindLayoutOnResize(this);
            // Destroy items.
            var i = 0;
            for (; i < items.length; i++)
                items[i]._destroy(removeElements);
            this._items.length = 0;
            // Restore container.
            removeClass(container, this._settings.containerClass);
            var prop;
            for (prop in layoutStyles)
                container.style[prop] = '';
            // Remove reference from the grid instances collection.
            GRID_INSTANCES.delete(this._id);
            // Flag instance as destroyed. It's important to set this to `true` before
            // emitting the destroy event to avoid potential infinite loop.
            this._isDestroyed = true;
            // Emit destroy event and unbind all events. Note that we can't use the
            // grid's _emit method for emitting this event because it shortcircuits if
            // _isDestroyed flag is true.
            this._emitter.emit(EVENT_DESTROY);
            this._emitter.destroy();
            return this;
        };
        Grid.Item = Item;
        Grid.ItemLayout = ItemLayout;
        Grid.ItemVisibility = ItemVisibility;
        Grid.ItemMigrate = ItemMigrate;
        Grid.ItemDrag = ItemDrag;
        Grid.ItemDragRelease = ItemDragRelease;
        Grid.ItemDragPlaceholder = ItemDragPlaceholder;
        Grid.Emitter = Emitter;
        Grid.Animator = Animator;
        Grid.Dragger = Dragger;
        Grid.Packer = Packer;
        Grid.AutoScroller = AutoScroller;
        Grid.defaultPacker = new Packer();
        Grid.defaultOptions = {
            // Initial item elements
            items: '*',
            // Default show animation
            showDuration: 300,
            showEasing: 'ease',
            // Default hide animation
            hideDuration: 300,
            hideEasing: 'ease',
            // Item's visible/hidden state styles
            visibleStyles: {
                opacity: '1',
                transform: 'scale(1)',
            },
            hiddenStyles: {
                opacity: '0',
                transform: 'scale(0.5)',
            },
            // Layout
            layout: {
                fillGaps: false,
                horizontal: false,
                alignRight: false,
                alignBottom: false,
                rounding: false,
            },
            layoutOnResize: 150,
            layoutOnInit: true,
            layoutDuration: 300,
            layoutEasing: 'ease',
            // Sorting
            sortData: null,
            // Drag & Drop
            dragEnabled: false,
            dragContainer: null,
            dragHandle: null,
            dragStartPredicate: {
                distance: 0,
                delay: 0,
            },
            dragAxis: 'xy',
            dragSort: true,
            dragSortHeuristics: {
                sortInterval: 100,
                minDragDistance: 10,
                minBounceBackAngle: 1,
            },
            dragSortPredicate: {
                threshold: 50,
                action: ACTION_MOVE,
                migrateAction: ACTION_MOVE,
            },
            dragRelease: {
                duration: 300,
                easing: 'ease',
                useDragContainer: true,
            },
            dragCssProps: {
                touchAction: 'none',
                userSelect: 'none',
                userDrag: 'none',
                tapHighlightColor: 'rgba(0, 0, 0, 0)',
                touchCallout: 'none',
                contentZooming: 'none',
            },
            dragEventListenerOptions: {
                passive: true,
                capture: false,
            },
            dragPlaceholder: {
                enabled: false,
                createElement: null,
                onCreate: null,
                onRemove: null,
            },
            dragAutoScroll: {
                targets: [],
                handle: null,
                threshold: 50,
                safeZone: 0.2,
                speed: AutoScroller.smoothSpeed(1000, 2000, 2500),
                sortDuringScroll: true,
                smoothStop: false,
                onStart: null,
                onStop: null,
            },
            // Classnames
            containerClass: 'muuri',
            itemClass: 'muuri-item',
            itemVisibleClass: 'muuri-item-shown',
            itemHiddenClass: 'muuri-item-hidden',
            itemPositioningClass: 'muuri-item-positioning',
            itemDraggingClass: 'muuri-item-dragging',
            itemReleasingClass: 'muuri-item-releasing',
            itemPlaceholderClass: 'muuri-item-placeholder',
            // Experimental animation optimization (animate only items that are in the
            // viewport).
            _animationWindowing: false,
        };
        return Grid;
    }());

    return Grid;

})));
