import { elementHasEventsListeners, getElementsByEventNames } from "./helpers";
import {
  ConditionalEventsOptions,
  ExtendElement,
  intersectionEvents,
  IntersectionObserverHandler,
} from "./models";

export class intersectionObserver {
  observer: IntersectionObserver | null;
  constructor(
    public handlers: Array<IntersectionObserverHandler>,
    public options: ConditionalEventsOptions = {}
  ) {}
  hasMutations(entries: Array<IntersectionObserverEntry>) {
    for (let handler of this.handlers) {
        handler(entries);
    }
  }
  addElement(element: ExtendElement) {
    if (!(element instanceof Element)) return;
    this.create();
    this.observer.observe(element);    
  }
  removeElement(element: ExtendElement) {
    if (!(element instanceof Element)) return;
    if (!elementHasEventsListeners(element, intersectionEvents)) {
      this.observer.unobserve(element as Element);
    }

    if (!getElementsByEventNames(intersectionEvents).length) {
      this.destroy();
    }
  }
  create() {
    if (this.observer) return;
    this.observer = document.intersectionObserver
      ? document.intersectionObserver
      : new IntersectionObserver(
          (entries) => {
            this.hasMutations(entries);
          },
          {
            root: document,
            rootMargin:
              this.options?.intersectionObserverOptions?.rootMargin ?? "0px",
            threshold: [0, 1],
          }
        );
    document.resizeObserver = this.observer;
  }
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observer = null;
    delete document.intersectionObserver;
  }
}
