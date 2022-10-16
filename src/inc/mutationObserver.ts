import { getElementsByEventNames, getRegisteredEventNames } from "./helpers";
import {
  ConditionalEventsOptions,
  ExtendElement,
  mutationObserverEvents,
  MutationObserverHandler,
} from "./models";

export class mutationObserver {
  mutationObserver: MutationObserver | null;
  mutationObserverConfig: any = {
    attributes: true,
    attributeOldValue: true,
    childList: false,
    characterData: false,
  };
  constructor(
    public handlers: Array<MutationObserverHandler>,
    public options: ConditionalEventsOptions = {}
  ) {
    if (options.mutationObserverOptions?.globalSingleListener) {
      this.create();
    }
  }
  hasMutations(mutations: Array<MutationRecord>) {
    let availableEvents = [...getRegisteredEventNames(), "lazy"];

    for (let handler of this.handlers) {
      let eventName = handler.name.split(" ").pop();
      if (availableEvents.includes(eventName)) {
        handler(mutations);
      }
    }
  }
  addElement(element: ExtendElement) {
    this.create();
    if (
      element instanceof Element &&
      !this.options.mutationObserverOptions?.globalSingleListener
    ) {
      this.mutationObserver.observe(element, {
        subtree: this.options.mutationObserverOptions?.subtree ?? true,
        ...this.mutationObserverConfig,
      });
    } else if (!(element instanceof Element)) {
      console.warn(
        `${
          element?.constructor?.name || element?.toString()
        } cannot be assigned as a listener for MutationObserver`
      );
    }
  }
  removeElement(element: ExtendElement) {
    if (!(element instanceof Element)) return;
    if (!getElementsByEventNames(mutationObserverEvents).length) {
      this.destroy();
    }
  }
  create() {
    if (this.mutationObserver) return;
    this.mutationObserver =
      document.mutationObserver ||
      new MutationObserver((mutations) => {
        this.hasMutations(mutations);
      });
    if (this.options.mutationObserverOptions?.globalSingleListener) {
      this.mutationObserver.observe(
        this.options.mutationObserverOptions?.rootElement || document.body,
        {
          ...this.mutationObserverConfig,
          subtree: true,
          childList: true,
        }
      );
    }
    document.mutationObserver = this.mutationObserver;
  }
  destroy() {
    if (this.options.mutationObserverOptions?.globalSingleListener) {
      return;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    this.mutationObserver = null;
    delete document.resizeObserver;
  }
}
