import { ConditionsStorage, EventStorage } from "./models";

export const eventStorage: EventStorage = document.eventStorage || new Map();
export const conditionsStorage: ConditionsStorage =
  document.conditionsStorage || new Map();


export const customEventsStorage: any = {}