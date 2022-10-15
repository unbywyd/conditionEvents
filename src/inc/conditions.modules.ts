import {
  checkValues,
  elementInViewport,
  elementPartialInViewport,
} from "./helpers";
import {
  ConditionalConfig,
  EventType,
  onVisibilityDetail,
  onVisibleDetail,
} from "./models";

export function selector(
  configValue: ConditionalConfig["selector"],
  event: EventType
): boolean {
  for (let el of event.composedPath()) {
    if ("matches" in el) {
      let elm: any = el as any;
      if (elm.matches(configValue)) {
        return true;
      }
    }
  }
  return false;
}

export function media(configValue: ConditionalConfig["media"]): boolean {
  if ("matchMedia" in window) {
    let rules = Array.isArray(configValue) ? configValue : [configValue];

    for (let rule of rules) {
      if (!window.matchMedia(rule).matches) {
        return false;
      }
    }
  }
  return true;
}

export function isFocused(
  configValue: ConditionalConfig["isFocused"],
  event: EventType
): boolean {
  let exclude = [document, document.body];

  let isFocused =
    document.activeElement === event.target ||
    (document.activeElement.contains(event.target as any) &&
      !exclude.includes(document.activeElement as any));
  return configValue ? isFocused : !isFocused;
}

export function isFullyVisible(
  configValue: ConditionalConfig["isFullyVisible"],
  event: EventType
): boolean {
  if (event.detail instanceof onVisibilityDetail) {
    return event.detail.isFullyVisible;
  }
  if (event.detail instanceof onVisibleDetail && !event.detail.isVisible) {
    return false;
  }
  let inViewport = elementInViewport(event.target as any);
  return configValue ? inViewport : !inViewport;
}

export function isVisible(
  configValue: ConditionalConfig["isVisible"],
  event: EventType
): boolean {
  if (
    event.detail instanceof onVisibleDetail ||
    event.detail instanceof onVisibilityDetail
  ) {
    return event.detail.isVisible;
  }
  let inViewport = elementPartialInViewport(event.target as any);
  return configValue ? inViewport : !inViewport;
}

export function isChecked(
  configValue: ConditionalConfig["isChecked"],
  event: EventType
): boolean {
  let el = event.target as any;
  if ("checked" in el) {
    return configValue ? el.checked : !el.checked;
  } else {
    return false;
  }
}

export function isDisabled(
  configValue: ConditionalConfig["isDisabled"],
  event: EventType
): boolean {
  let el = event.target as any;
  if ("disabled" in el) {
    return configValue ? el.disabled : !el.disabled;
  } else {
    return false;
  }
}

export function is(
  configValue: ConditionalConfig["is"],
  event: EventType
): boolean {
  if (typeof is !== "function") {
    console.error(`is must me a function that returns a boolean`);
    return false;
  }
  return configValue(event);
}

export function valueContains(
  configValue: ConditionalConfig["valueContains"],
  event: EventType
): boolean {
  let el = event.target as any;
  let value = "";
  if ("value" in el) {
    value = el.value;
  } else if (
    "detail" in event &&
    "object" == typeof event.detail &&
    "value" in event.detail
  ) {
    value = event.detail.value;
  }
  return checkValues(configValue, value);
}

export function oldValueContains(
  configValue: ConditionalConfig["oldValueContains"],
  event: EventType
): boolean {
  if (
    "detail" in event &&
    "object" == typeof event.detail &&
    "oldValue" in event.detail
  ) {
    return checkValues(configValue, event.detail.oldValue);
  }
  return true;
}

export function attrNameContains(
  configValue: ConditionalConfig["attrNameContains"],
  event: EventType
): boolean {
  if (
    "detail" in event &&
    "object" == typeof event.detail &&
    "attributeName" in event.detail
  ) {
    return checkValues(configValue, event.detail.attributeName);
  }
  return true;
}
