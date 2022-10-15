import { EventName, ExtendElement } from "./models";
import { eventStorage } from "./state";

export function splitValue(value: string) {
  return value
    .split(/[,\s]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e);
}
export function prepareValue(value: any): any {
  if ("string" === typeof value) {
    return value.trim();
  } else if (Array.isArray(value)) {
    let els = value
      .map((e) => (e.trim !== undefined ? e.trim().toLowerCase() : e))
      .filter((e) => e !== undefined);
    return els.length ? els : undefined;
  }
  return value;
}

export function elementHasEventsListeners(element: ExtendElement, eventNames: Array<EventName>): boolean {
  let storage = eventStorage.get(element);
  if(!storage) return false; // No events
  for(let eventName of eventNames) {   
    if(eventName in storage) {
      return true;
    } 
  }
  return false;
}
export function getElementsByEventNames(eventNames: Array<EventName>): Array<ExtendElement> {
  let els: Array<ExtendElement> = [];
  for(let eventName of eventNames) {
    els = [...els, ...getElementsByEventName(eventName)];
  }
  return els;
}

export function getElementsByEventName(eventName: EventName): Array<ExtendElement> {
  let els: Array<ExtendElement> = [];
  eventStorage.forEach((storage, el) => {
    if(eventName in storage) {
      els.push(el);
    }
  });
  return els;
}

export function omit(obj: any, ...props: any) {
  const result = { ...obj };
  props.forEach(function (prop: any) {
    delete result[prop];
  });
  return result;
}

export function elementInViewport(el: HTMLElement) {
  var rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function elementPartialInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  const vertInView = rect.top <= windowHeight && rect.top + rect.height >= 0;
  const horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;
  return vertInView && horInView;
}

export function checkValues(checkAs: any, value: any): boolean {
  let checks = Array.isArray(checkAs) ? checkAs : [checkAs];
  for (let checkAs of checks) {
    if (!checkValue(checkAs, value)) {
      return false;
    }
  }
  return true;
}
export function checkValue(checkAs: any, value: any): boolean {
  if (checkAs instanceof RegExp) {
    if(value === undefined) {
      value = '';
    }
    try {
      value = value.toString();
    } catch(e) {      
    }
    if(value === null) {
      value = '';
    }
    if('string' !== typeof value) {
      console.error(`${value} is not a string`);
      return false;
    }
    return checkAs.test(value);
  } else {
    if ("string" === typeof value) {
      value = value.toLowerCase().trim();
    }
    return value === checkAs;
  }
}
