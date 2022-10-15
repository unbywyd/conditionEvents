import { conditionsChecker } from "./inc/conditions";
import { omit } from "./inc/helpers";

import {
  Callback,
  ConditionalConfig,
  ConditionEventsOption,
  EventData,
  EventName,
  EventStorageData,
  EventType,
  ExtendElement,
  ImplementedHandler,
  InitReturns,
} from "./inc/models";
import { customEventsStorage, eventStorage } from "./inc/state";

import customEventsInit from "./inc/customEvents";
import { mutationObserver } from "./inc/mutationObserver";
import { resizeObserver } from "./inc/resizeObserver";
import { intersectionObserver } from "./inc/intersectionObserver";

export default function(options: ConditionEventsOption={}) {
  options = Object.assign(
    {},
    {
      customEvents: true,
      resizeObserverOptions: {
        box: "content-box",
      },
      intersectionObserverOptions: {
        rootMargin: "0px",
      }
    },
    options
  );
  let mutationHandlers: any[] = [];
  let mutationObserverController = new mutationObserver(
    mutationHandlers,
    options
  );

  let resizeHandlers: any[] = [];
  let resizeObserverController = new resizeObserver(resizeHandlers, options);

  let intersectionHandlers: any[] = [];
  let intersectionObserverController = new intersectionObserver(
    intersectionHandlers,
    options
  );

  let customEvents = customEventsInit(options, {
    mutationObserver: mutationObserverController,
    resizeObserver: resizeObserverController,
    intersectionObserver: intersectionObserverController,
  });
  if (options.customEvents) {
    for (let moduleName in customEvents) {
      let CustomEventsClasses: any = customEvents;
      customEventsStorage[CustomEventsClasses[moduleName].name] =
        new CustomEventsClasses[moduleName]();
      if (
        "mutationsHandler" in
        customEventsStorage[CustomEventsClasses[moduleName].name]
      ) {
        mutationHandlers.push(
          customEventsStorage[
            CustomEventsClasses[moduleName].name
          ].mutationsHandler.bind(
            customEventsStorage[CustomEventsClasses[moduleName].name]
          )
        );
      }
      if (
        "resizeHandler" in
        customEventsStorage[CustomEventsClasses[moduleName].name]
      ) {
        resizeHandlers.push(
          customEventsStorage[
            CustomEventsClasses[moduleName].name
          ].resizeHandler.bind(
            customEventsStorage[CustomEventsClasses[moduleName].name]
          )
        );
      }
      if (
        "intersectionHandler" in
        customEventsStorage[CustomEventsClasses[moduleName].name]
      ) {
        intersectionHandlers.push(
          customEventsStorage[
            CustomEventsClasses[moduleName].name
          ].intersectionHandler.bind(
            customEventsStorage[CustomEventsClasses[moduleName].name]
          )
        );
      }
    }
  }

  let regCallbacksForCustomEvent = function (
    eventName: keyof typeof customEventsStorage,
    element: ExtendElement,
    callback: Callback,
    conditionalConfig?: ConditionalConfig,
    eventListenerOptions?: any
  ) {
    if (eventName in customEventsStorage) {
      customEventsStorage[eventName].regCallback(
        element,
        callback,
        conditionalConfig,
        eventListenerOptions
      );
    }
  };

  let removeCallbacksForCustomEvent = function (
    eventName: keyof typeof customEventsStorage,
    element: ExtendElement,
    callback: Callback,
    eventData: EventData
  ) {
    if (eventName in customEventsStorage) {
      customEventsStorage[eventName].removeCallback(
        element,
        callback,
        eventData
      );
    }
  };

  let afterRemoveCallbacksForCustomEvent = function (
    eventName: keyof typeof customEventsStorage,
    element: ExtendElement
  ) {
    if (eventName in customEventsStorage) {
      customEventsStorage[eventName].afterRemoveCallback(element);
    }
  };

  const regEventImplementedHandler = function (
    element: ExtendElement,
    eventName: EventName,
    implementedHandler: ImplementedHandler
  ) {
    if (!eventStorage.has(element)) {
      eventStorage.set(element, {});
    }
    let storage = eventStorage.get(element);
    if (!(eventName in storage)) {
      let data: EventStorageData = {
        implementedHandler,
        callbacks: new Map(),
      };
      storage[eventName] = data;
    }
  };

  const getCallbacks = function (element: ExtendElement, eventName: EventName) {
    let storage = eventStorage.get(element);
    return storage[eventName].callbacks;
  };

  const implementedHandlerIsRegistered = function (
    element: ExtendElement,
    eventName: EventName
  ): boolean {
    if (!eventStorage.has(element)) {
      return false;
    }
    let storage = eventStorage.get(element);
    return eventName in storage;
  };

  const callbackIsRegistered = function (
    element: ExtendElement,
    eventName: EventName,
    callback: Callback
  ): boolean {
    if (!implementedHandlerIsRegistered(element, eventName)) {
      return false;
    }
    let callbacks = getCallbacks(element, eventName);
    if (!callbacks.has(callback)) {
      return false;
    }
    return true;
  };

  let executeEventCallback = function (eventName: EventName, e: EventType) {
    let storage = eventStorage.get(this);
    if (eventName in storage) {
      let callbacks = storage[eventName].callbacks;
      callbacks.forEach((eventData) => {
        if (conditionsChecker(eventName, e, eventData)) {
          eventData.callback(e);
          if (eventData.listenerConfig.once) {
            removeCallback(this, eventName, eventData.callback);
          }
        }
      });
    }
  };

  let createImplementedHandler = function (
    eventName: EventName,
    element: ExtendElement
  ): ImplementedHandler {
    return (e: any) => {
      executeEventCallback.call(element, eventName, e);
    };
  };

  let regCallback = function (
    eventName: EventName,
    callback: Callback,
    conditionalConfig: ConditionalConfig,
    eventListenerOptions: any
  ) {
    let callbacks = getCallbacks(this, eventName);
    regCallbacksForCustomEvent(
      eventName,
      this,
      callback,
      conditionalConfig,
      eventListenerOptions
    );
    callbacks.set(callback, {
      el: this,
      eventName,
      callback,
      conditionalConfig,
      listenerConfig: eventListenerOptions,
      state: {},
    });
  };

  function removeEvents(
    eventName?: EventName,
    element?: ExtendElement,
    callback?: Callback
  ): void {
    eventStorage.forEach((storage, el) => {
      let removeHandler = (eventName: EventName) => {
        if (
          element === undefined ||
          (element instanceof Element && el === element)
        ) {
          if (eventName in storage) {
            let callbacks = storage[eventName].callbacks;
            callbacks.forEach((data, cb) => {
              if (
                callback === undefined ||
                ("function" == typeof callback && callback === cb)
              ) {
                removeCallback(el, eventName, cb);
              }
            });
          }
        }
      };
      if (eventName) {
        removeHandler(eventName);
      } else {
        for (let eventName in storage) {
          removeHandler(eventName);
        }
      }
    });
  }

  let removeCallback = function (
    element: ExtendElement,
    eventName: EventName,
    callback: Callback,
    removeEventListener: boolean = true
  ) {
    let storage = eventStorage.get(element);
    let callbacks = storage[eventName].callbacks;
    let eventData = callbacks.get(callback);
    removeCallbacksForCustomEvent(eventName, element, callback, eventData);

    callbacks.delete(callback); // Remove only callback not listener
    if (callbacks.size === 0 && removeEventListener) {
      element.removeEventListener(
        eventName,
        storage[eventName].implementedHandler
      );
      delete storage[eventName];
    }
    afterRemoveCallbacksForCustomEvent(eventName, element);
  };

  let removeConditionalEventListener = function (
    eventName: EventName,
    callback: Callback
  ) {
    if (callbackIsRegistered(this, eventName, callback)) {
      removeCallback(this, eventName, callback);
    }
  };

  let addConditionalEventListener = function (
    eventName: EventName,
    callback: Callback,
    conditionalConfig: ConditionalConfig,
    eventListenerOptions: any = {}
  ) {
    if (callbackIsRegistered(this, eventName, callback)) {
      removeCallback(this, eventName, callback, false);
    }
    if (!implementedHandlerIsRegistered(this, eventName)) {
      let implementedHandler = createImplementedHandler(eventName, this);
      regEventImplementedHandler(this, eventName, implementedHandler);

      this.addEventListener(
        eventName,
        implementedHandler,
        omit(eventListenerOptions, "once")
      );
    }
    regCallback.call(
      this,
      eventName,
      callback,
      conditionalConfig,
      eventListenerOptions
    );
  };

  Element.prototype.addConditionalEventListener = addConditionalEventListener;
  Document.prototype.addConditionalEventListener = addConditionalEventListener;
  Window.prototype.addConditionalEventListener = addConditionalEventListener;

  Element.prototype.removeConditionalEventListener =
    removeConditionalEventListener;
  Document.prototype.removeConditionalEventListener =
    removeConditionalEventListener;
  Window.prototype.removeConditionalEventListener =
    removeConditionalEventListener;

  let initReturns: InitReturns = {
    removeEvents,
    options,
    mutationObserver: mutationObserverController,
    resizeObserver: resizeObserverController,
    intersectionObserver: intersectionObserverController,
  };
  return initReturns;
}
