import { getElementsByEventName, getElementsByEventNames } from "./helpers";
import { ConditionEventsOption, ExtendElement, mutationObserverEvents } from "./models";

export class mutationObserver {
  mutationObserver: MutationObserver | null;
  constructor(public handlers: any[], options: ConditionEventsOption = {}) {}
  hasMutations(mutations: any[]) {
    for (let handler of this.handlers) {
      handler(mutations);
    }
  }
  addElement(element: ExtendElement) {
    this.create();
    if (element instanceof Element) {
      this.mutationObserver.observe(element, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterDataOldValue: true,
      });
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
    document.mutationObserver = this.mutationObserver;
  }
  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    this.mutationObserver = null;
    delete document.resizeObserver;
  }
}
