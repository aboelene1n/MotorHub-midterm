// An interrupted native transition rejects `ready`, even when navigation succeeds.
// React Router owns the update/finished promises; handle only this animation promise.
// https://developer.chrome.com/docs/web-platform/view-transitions/same-document
export function installViewTransitionHandling(doc = document) {
  const installed = Symbol.for('motorhub:view-transitions');
  if (!doc.startViewTransition || doc[installed]) return;
  const start = doc.startViewTransition.bind(doc);
  doc.startViewTransition = (...args) => {
    const transition = start(...args);
    transition.ready.catch(() => {
      // Superseded or skipped animations are allowed; the DOM update still runs.
    });
    return transition;
  };
  doc[installed] = true;
}
