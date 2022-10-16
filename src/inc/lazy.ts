import {
  AnyCallback,
  ConditionalEventsOptions,
  EventName,
  intersectionEvents,
  ObserverControllers,
  onResizeEventName,
} from "./models";

export type lazyPlugin = (
  options: ConditionalEventsOptions,
  observers: ObserverControllers
) => {
  provide: (
    selector: string,
    eventName: EventName,
    callback: AnyCallback
  ) => void;
  unprovide: (
    selector: string,
    eventName: EventName,
    callback: AnyCallback
  ) => void;
};

interface CallbackData {
  eventName: EventName;
  callback: AnyCallback;
}
const Init: lazyPlugin = function (
  options: ConditionalEventsOptions,
  observers: ObserverControllers
) {
  let state: Map<string, Array<CallbackData>> = new Map();
  let notifi = () => {
    if (!options.mutationObserverOptions?.globalSingleListener) {
      console.warn(
        `Requires "mutationObserverOptions?.globalSingleListener" option to be set to True to use lazy method`
      );
    }
    return options.mutationObserverOptions?.globalSingleListener;
  };
  if (options.mutationObserverOptions?.globalSingleListener) {
    observers.mutationObserver.handlers.push(function lazy(
      mutations: Array<MutationRecord>
    ) {
      for (let mutation of mutations) {
        let el = mutation.target;
        if (el instanceof Element) {
          let nodes = Array.from(mutation.addedNodes).filter(
            (el) => el instanceof Element
          ) as Array<Element>;
          let els: Array<Element> = [el, ...nodes];
          for (let selector of state.keys()) {
            for (let elm of els) {
              if (elm.matches(selector)) {
                let storage = state.get(selector);
                if (storage?.length) {
                  for (let callbackData of storage) {
                    _handler(elm, callbackData);
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  function _handler(elm: Element, callbackData: CallbackData) {
    callbackData.callback(elm);
    if (callbackData.eventName === onResizeEventName) {
      observers.resizeObserver.addElement(elm);
    } else if (intersectionEvents.includes(callbackData.eventName)) {
      observers.intersectionObserver.addElement(elm);
    }
  }
  function _destroy(selector: string, callbackData: CallbackData) {
    let storage = state.get(selector);
    storage?.splice(storage?.indexOf(callbackData), 1);
  }
  function unprovide(
    selector: string,
    eventName: EventName,
    callback: AnyCallback
  ) {
    if (!notifi()) {
      return;
    }
    if (!state.has(selector)) {
      return;
    }
    let storage = state.get(selector);
    let registeredCallback = storage?.find(
      (el) => el.callback === callback && el.eventName === eventName
    );
    if (registeredCallback) {
      _destroy(selector, registeredCallback);
    }
  }
  function provide(
    selector: string,
    eventName: EventName,
    callback: AnyCallback
  ) {
    if (!notifi()) {
      return;
    }
    if (!state.has(selector)) {
      state.set(selector, []);
    }
    let storage = state.get(selector);
    let callbackData: CallbackData = {
      eventName,
      callback,
    };
    if (
      storage?.find(
        (el) => el.callback === callback && el.eventName === eventName
      )
    ) {
      return console.warn(
        `lazy callback for ${eventName} event by ${selector} selector already registered`
      );
    }
    document.querySelectorAll(selector).forEach((el) => {
      _handler(el, callbackData);
    });
    storage?.push(callbackData);
  }
  return {
    provide,
    unprovide,
  };
};

export default Init;
