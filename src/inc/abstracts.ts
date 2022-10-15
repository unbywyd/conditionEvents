import { Callback, ConditionalConfig, ConditionalEventsOptions, EventData, EventStorage, ExtendElement } from "./models";

export abstract class AbstractEvent {
    constructor(public eventName: string) {
    }
    init(options: ConditionalEventsOptions) {}
    regCallback(element: ExtendElement, callback: Callback, conditionalConfig?: ConditionalConfig, eventListenerOptions?: any) {}
    removeCallback(element: ExtendElement, callback: Callback, eventData: EventData) {}
    afterRemoveCallback(element: ExtendElement) {}
}
