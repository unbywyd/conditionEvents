import { conditionsChecker } from "./inc/conditions";
import { omit } from "./inc/helpers";

import {
  Callback,
  ConditionalConfig,
  ConditionalEventsOptions,
  EventData,
  EventName,
  EventStorageData,
  EventType,
  ExtendElement,
  ImplementedHandler,
  InitReturns,
  IntersectionObserverHandler,
  ListenerConfig,
  MutationObserverHandler,
  ResizeObserverHandler,
} from "./inc/models";
import { customEventsStorage, eventStorage } from "./inc/state";

import customEventsInit from "./inc/customEvents";
import { mutationObserver } from "./inc/mutationObserver";
import { resizeObserver } from "./inc/resizeObserver";
import { intersectionObserver } from "./inc/intersectionObserver";
import initLazy from "./inc/lazy";

export default function (options: ConditionalEventsOptions = {}) {
  options = Object.assign(
    {},
    {
      customEvents: true,
      resizeObserverOptions: {
        box: "content-box",
      },
      intersectionObserverOptions: {
        rootMargin: "0px",
      },
    },    
    options,
  );
  let mutationHandlers: Array<MutationObserverHandler> = [];
  let mutationObserverController = new mutationObserver(
    mutationHandlers,
    options
  );

  let resizeHandlers: Array<ResizeObserverHandler> = [];
  let resizeObserverController = new resizeObserver(resizeHandlers, options);

  let intersectionHandlers: Array<IntersectionObserverHandler> = [];
  let intersectionObserverController = new intersectionObserver(
    intersectionHandlers,
    options
  );

  let controllers = {
    mutationObserver: mutationObserverController,
    resizeObserver: resizeObserverController,
    intersectionObserver: intersectionObserverController,
  };
  let LazyInstance = initLazy(options, controllers);

  let customEvents = customEventsInit(options, controllers);

  if (options.customEvents) {
    for (let moduleName in customEvents) {
      let CustomEventsClasses: any = customEvents;
      customEventsStorage[CustomEventsClasses[moduleName].name] =
        new CustomEventsClasses[moduleName]();
      if (
        "mutationsHandler" in
        customEventsStorage[CustomEventsClasses[moduleName].name]
      ) {
        let method = customEventsStorage[
          CustomEventsClasses[moduleName].name
        ].mutationsHandler;
        Object.defineProperty(method, "name", {
          value: CustomEventsClasses[moduleName].name,
        });

        mutationHandlers.push(method.bind(
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
    eventListenerOptions?: ListenerConfig
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
    eventListenerOptions: ListenerConfig
  ) {
    let callbacks = getCallbacks(this, eventName);
    let lazyCallback;
    if (eventListenerOptions.lazy && conditionalConfig.selector) {
      lazyCallback = function (element: Element) {};
      LazyInstance.provide(conditionalConfig.selector, eventName, lazyCallback);
    }
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
      state: {
        lazyCallback,
      },
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
          removeHandler(eventName as EventName);
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

    let afterRemove = eventData.state.lazyCallback ? false : true;
    if (eventData.state.lazyCallback) {
      LazyInstance.unprovide(
        eventData.conditionalConfig.selector,
        eventName,
        eventData.state.lazyCallback
      );
    }

    callbacks.delete(callback); 
    if (callbacks.size === 0 && removeEventListener) {
      element.removeEventListener(
        eventName,
        storage[eventName].implementedHandler,
        true
      );
      delete storage[eventName];
    }
    if (afterRemove) {
      afterRemoveCallbacksForCustomEvent(eventName, element);
    }
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
        omit(eventListenerOptions, "once", "lazy")
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
    setOptions(_options: ConditionalEventsOptions) {
      options = Object.assign(options, _options);      
    },
    ...controllers,
  };
  return initReturns;
}
