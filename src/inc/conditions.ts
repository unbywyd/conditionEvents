import {
  prepareValue,
  elementInViewport,
  elementPartialInViewport,
  checkValue,
} from "./helpers";
import {
  ConditionalConfig,
  ConditionFunction,
  ConditionsStorage,
  EventData,
  EventName,
  EventType,
  onResizeEventName,
} from "./models";

import { conditionsStorage } from "./state";

import * as conditionsModules from "./conditions.modules";

function regCondition(checker: ConditionFunction) {
  conditionsStorage.set(checker.name as keyof ConditionalConfig, checker);
}

for (let moduleName in conditionsModules) {
  let modules: any = conditionsModules;
  regCondition(modules[moduleName]);
}

export function conditionsChecker(
  eventName: EventName,
  event: EventType,
  eventData: EventData
): boolean {
  let conditionalConfig = eventData.conditionalConfig;

  for (let key in conditionalConfig) {
    if (key in conditionsModules) {
      let configValue = prepareValue(
        conditionalConfig[key as keyof ConditionalConfig]
      );
      if (
        conditionsStorage.has(key as keyof ConditionalConfig) &&
        configValue !== undefined
      ) {
        let conditionChecker = conditionsStorage.get(
          key as keyof ConditionalConfig
        );
        if (!conditionChecker(configValue, event, eventName, eventData)) {
          return false;
        }
      }
    }
  }
  return true;
}
