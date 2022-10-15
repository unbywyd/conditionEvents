import { AbstractEvent } from "./abstracts";
import { eventStorage } from "./state";
import {
  Callback,
  ConditionalConfig,
  ConditionalEventsOptions,
  EventData,
  EventStorage,
  EventStorageData,
  ExtendElement,
  onAddAttributeDetail,
  onAddAttributeEventName,
  onChangeAttributeEventName,
  onResizeEventName,
  onResizeDetail,
  onChangeAttributeDetail,
  onDeleteAttributeEventName,
  onDeleteAttributeDetail,
  onAddClassNameEventName,
  onAddClassNameDetail,
  onDeleteClassNameDetail,
  onDeleteClassNameEventName,
  onVisibilityEventName,
  onVisibilityDetail,
  onVisibleEventName,
  onVisibleDetail,
  onHiddenEventName,
  EventName,
  ObserverControllers,
  ListenerConfig,
} from "./models";

export default function customEventsInit(
  options: ConditionalEventsOptions,
  observers: ObserverControllers
) {
  let displatchEvent = (el: Element, eventName: EventName, data: any) => {
    let event = new CustomEvent(eventName, data);
    el.dispatchEvent(event);
  };

  let { mutationObserver, resizeObserver, intersectionObserver } = observers;
  class mutationDepEvents extends AbstractEvent {
    options: ConditionalEventsOptions;
    constructor(eventName: string) {
      super(eventName);
    }
    mutationsHandler(mutations: any[]) {}
    regCallback(element: ExtendElement) {
      mutationObserver.addElement(element);
    }
    afterRemoveCallback(element: ExtendElement) {
      mutationObserver.removeElement(element);
    }
  }

  class onAttributeChange extends mutationDepEvents {
    constructor() {
      super(onChangeAttributeEventName);
    }
    mutationsHandler(mutations: any[]) {
      for (let mutation of mutations.filter((m) => m.type == "attributes")) {
        displatchEvent(mutation.target, this.eventName, {
          bubbles: true,
          detail: new onChangeAttributeDetail(
            mutation,
            mutation.target.getAttribute(mutation.attributeName)
          ),
        });
      }
    }
  }
  Object.defineProperty(onAttributeChange, "name", {
    value: onChangeAttributeEventName,
  });

  class onAttributeAdded extends mutationDepEvents {
    constructor() {
      super(onAddAttributeEventName);
    }
    mutationsHandler(mutations: any[]) {
      for (let mutation of mutations.filter((m) => m.type == "attributes")) {
        if (mutation.oldValue === null) {
          displatchEvent(mutation.target, this.eventName, {
            bubbles: true,
            detail: new onAddAttributeDetail(
              mutation,
              mutation.target.getAttribute(mutation.attributeName)
            ),
          });
        }
      }
    }
  }
  Object.defineProperty(onAttributeAdded, "name", {
    value: onAddAttributeEventName,
  });

  function classListHandler(mutation: MutationRecord) {
    if (mutation.target instanceof Element) {
      let el = mutation.target;
      let prevClassNames = mutation.oldValue
        ? mutation.oldValue.replace(/\s+/, " ").split(" ")
        : [];

      let currentClassNames: Array<string> = Array.from(el.classList);

      let removeClasses: Array<string> = [];
      if (prevClassNames.length) {
        for (let oldClassName of prevClassNames) {
          if (!currentClassNames.includes(oldClassName)) {
            removeClasses.push(oldClassName);
          }
        }
      }
      if (removeClasses.length) {
        displatchEvent(el, onDeleteClassNameEventName, {
          bubbles: true,
          detail: new onDeleteClassNameDetail(
            mutation,
            removeClasses,
            prevClassNames,
            currentClassNames
          ),
        });
      }
      let hasClassAttr = el.hasAttribute("class");
      if (hasClassAttr) {
        let newClasses: Array<string> = [];
        for (let val of currentClassNames) {
          if (!prevClassNames.includes(val)) {
            newClasses.push(val);
          }
        }
        if (newClasses.length) {
          displatchEvent(el, onAddClassNameEventName, {
            bubbles: true,
            detail: new onAddClassNameDetail(
              mutation,
              newClasses,
              prevClassNames,
              currentClassNames
            ),
          });
        }
      }
    }
  }

  class onAddClassName extends mutationDepEvents {
    constructor() {
      super(onAddClassNameEventName);
    }
    mutationsHandler(mutations: Array<MutationRecord>) {
      for (let mutation of mutations.filter(
        (m) => m.type == "attributes" && m.attributeName === "class"
      )) {
        classListHandler(mutation);
      }
    }
  }

  Object.defineProperty(onAddClassName, "name", {
    value: onAddClassNameEventName,
  });

  class onDeleteClassName extends mutationDepEvents {
    constructor() {
      super(onDeleteClassNameEventName);
    }
    mutationsHandler(mutations: any[]) {
      for (let mutation of mutations.filter(
        (m) => m.type == "attributes" && m.attributeName === "class"
      )) {
        classListHandler(mutation);
      }
    }
  }
  Object.defineProperty(onDeleteClassName, "name", {
    value: onDeleteClassNameEventName,
  });

  class onAttributeDeleted extends mutationDepEvents {
    constructor() {
      super(onDeleteAttributeEventName);
    }
    mutationsHandler(mutations: any[]) {
      for (let mutation of mutations.filter((m) => m.type == "attributes")) {
        if (!mutation.target.hasAttribute(mutation.attributeName)) {
          displatchEvent(mutation.target, this.eventName, {
            bubbles: true,
            detail: new onDeleteAttributeDetail(mutation),
          });
        }
      }
    }
  }
  Object.defineProperty(onAttributeDeleted, "name", {
    value: onDeleteAttributeEventName,
  });

  class onResize extends AbstractEvent {
    constructor() {
      super(onResizeEventName);
    }
    resizeHandler(entries: Array<ResizeObserverEntry>) {
      for (const entry of entries) {
        if (entry.contentBoxSize && entry.contentRect) {
          entry.target.prevOnResizeRect = entry.contentRect;
          displatchEvent(entry.target, this.eventName, {
            bubbles: true,
            detail: new onResizeDetail(entry, entry.target?.prevOnResizeRect),
          });
        }
      }
    }
    regCallback(
      element: ExtendElement,
      callback: Callback,
      conditionalConfig: ConditionalConfig,
      eventListenerOptions: ListenerConfig
    ) {
      if(eventListenerOptions.lazy && conditionalConfig.selector) return
      resizeObserver.addElement(element);
    }
    afterRemoveCallback(element: ExtendElement) {
      resizeObserver.removeElement(element);
    }
  }
  Object.defineProperty(onResize, "name", { value: onResizeEventName });

  class onVisibility extends AbstractEvent {
    constructor() {
      super(onVisibilityEventName);
    }
    intersectionHandler(entries: any[]) {
      for (const entry of entries) {
        let detail = new onVisibilityDetail(entry);
        let state = `${detail.isFullyVisible}-${detail.isVisible}-${detail.isHidden}`;

        if (entry.target.prevOnVisibilityState != state) {
          entry.target.prevOnVisibilityState = state;
          displatchEvent(entry.target, this.eventName, {
            detail,
            bubbles: true, // ?
          });
        }
      }
    }
    regCallback(
      element: ExtendElement,
      callback: Callback,
      conditionalConfig: ConditionalConfig,
      eventListenerOptions: ListenerConfig
    ) {
      if(eventListenerOptions.lazy && conditionalConfig.selector) return
      intersectionObserver.addElement(element);
    }
    afterRemoveCallback(element: ExtendElement) {
      intersectionObserver.removeElement(element);
    }
  }
  Object.defineProperty(onVisibility, "name", { value: onVisibilityEventName });

  function onVisibleHandler(entry: any) {
    let detail = new onVisibleDetail(entry);
    let push = (eventName: string, state: boolean) => {
      entry.target.prevOnVisibleState = state;
      displatchEvent(entry.target, eventName, {
        detail,
        bubbles: true,
      });
    };
    if (detail.isVisible && !entry.target.prevOnVisibleState) {
      push(onVisibleEventName, true);
    } else if (!detail.isVisible && entry.target.prevOnVisibleState) {
      push(onHiddenEventName, false);
    }
  }
  class onVisible extends AbstractEvent {
    constructor() {
      super(onVisibleEventName);
    }
    intersectionHandler(entries: any[]) {
      for (const entry of entries) {
        onVisibleHandler(entry);
      }
    }
    regCallback(
      element: ExtendElement,
      callback: Callback,
      conditionalConfig: ConditionalConfig,
      eventListenerOptions: ListenerConfig
    ) {
      if(eventListenerOptions.lazy && conditionalConfig.selector) return
      intersectionObserver.addElement(element);
    }
    afterRemoveCallback(element: ExtendElement) {
      intersectionObserver.removeElement(element);
    }
  }
  Object.defineProperty(onVisible, "name", { value: onVisibleEventName });

  class onHidden extends AbstractEvent {
    constructor() {
      super(onHiddenEventName);
    }
    intersectionHandler(entries: any[]) {
      for (const entry of entries) {
        onVisibleHandler(entry);
      }
    }
    regCallback(
      element: ExtendElement,
      callback: Callback,
      conditionalConfig: ConditionalConfig,
      eventListenerOptions: ListenerConfig
    ) {
      if(eventListenerOptions.lazy && conditionalConfig.selector) return
      intersectionObserver.addElement(element);
    }
    afterRemoveCallback(element: ExtendElement) {
      intersectionObserver.removeElement(element);
    }
  }
  Object.defineProperty(onHidden, "name", { value: onHiddenEventName });

  return {
    onAttributeChange,
    onAttributeAdded,
    onAttributeDeleted,
    onDeleteClassName,
    onAddClassName,
    onResize,
    onVisibility,
    onVisible,
    onHidden,
  };
}
