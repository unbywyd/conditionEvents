import Init from "./index";
Init(window.ConditionalEventsOptions ?? {
    mutationObserverOptions: {
        globalSingleListener: true
    }
});