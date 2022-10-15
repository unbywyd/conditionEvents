import { elementHasEventsListeners, getElementsByEventName } from "./helpers";
import { ConditionalEventsOption, ExtendElement, onResizeEventName } from "./models";

export class resizeObserver {
  observer: ResizeObserver | null;
  constructor(
    public handlers: any[],
    public options: ConditionalEventsOption = {}
  ) {}
  hasMutations(mutations: any[]) {
    for (let handler of this.handlers) {
      handler(mutations);
    }
  }
  addElement(element: ExtendElement) {
    this.create();
    if (element instanceof Element) {
      element.prevOnResizeRect = element.getBoundingClientRect();
      this.observer.observe(element, {
        box: this.options?.resizeObserverOptions?.box || "content-box",
      });
    }
  }
  removeElement(element: ExtendElement) {
    if (!(element instanceof Element)) return;    
    if(!elementHasEventsListeners(element, [onResizeEventName])) {
      this.observer.unobserve(element as Element);
    }

    if (!getElementsByEventName(onResizeEventName).length) {
      this.destroy();
    }
  }
  create() {
    if (this.observer) return;
    this.observer = document.resizeObserver
      ? document.resizeObserver
      : new ResizeObserver((entries) => {
          this.hasMutations(entries);
        });
    document.resizeObserver = this.observer;
  }
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observer = null;
    delete document.resizeObserver;
  }
}
