import initConditionalEvents from "./index";
window.ConditionalEvents = initConditionalEvents(typeof window.ConditionalEventsOptions === 'object' ? window.ConditionalEventsOptions : {});