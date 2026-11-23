
/*
  Refreshonback.js

  Browser ke Back / Forward button par page refresh hota hai.

  - installRefreshOnBack() event listeners add karta hai.
  - Component unmount hone par cleanup function call hota hai.
  - popstate: Back / Forward navigation ko handle karta hai.
  - pageshow: Browser ke bfcache se page restore hone ko handle karta hai.
*/

export function installRefreshOnBack() {
  if (typeof window === "undefined") {
    return () => {};
  }

  let isRefreshing = false;

  const refreshPage = () => {
    if (isRefreshing) return;

    isRefreshing = true;
    window.location.reload();
  };

  const onPopState = () => {
    refreshPage();
  };

  const onPageShow = (event) => {
    if (event.persisted) {
      refreshPage();
    }
  };

  window.addEventListener("popstate", onPopState);
  window.addEventListener("pageshow", onPageShow);

  // Cleanup: component unmount hone par listeners remove karein.
  return () => {
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("pageshow", onPageShow);
  };
}

export default installRefreshOnBack;
