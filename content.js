// Fetch phrases from the bundled phrases.txt and filter YouTube comments.
(async () => {
  let phrases = [];

  try {
    const url = browser.runtime.getURL("phrases.txt");
    const response = await fetch(url);
    const text = await response.text();
    phrases = text
      .split("\n")
      .map(line => line.trim().toLowerCase())
      .filter(line => line.length > 0);
  } catch (e) {
    console.error("[Hide Dumb Comments] Failed to load phrases.txt:", e);
    return;
  }

  if (phrases.length === 0) return;

  function containsPhrase(text) {
    const lower = text.toLowerCase();
    return phrases.some(phrase => lower.includes(phrase));
  }

  function filterComment(node) {
    // YouTube comment text lives in #content-text inside ytd-comment-renderer.
    const textEl = node.querySelector
      ? node.querySelector("#content-text")
      : null;
    if (!textEl) return;

    if (containsPhrase(textEl.textContent)) {
      // Hide the whole comment thread (includes replies).
      const thread = node.closest("ytd-comment-thread-renderer") || node;
      thread.style.display = "none";
    }
  }

  function filterAll() {
    document
      .querySelectorAll("ytd-comment-renderer")
      .forEach(filterComment);
  }

  // Run once on existing comments and then watch for new ones.
  filterAll();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const added of mutation.addedNodes) {
        if (added.nodeType !== Node.ELEMENT_NODE) continue;

        // The added node itself might be a comment renderer.
        if (added.matches("ytd-comment-renderer")) {
          filterComment(added);
        } else {
          // Or it may contain comment renderers further down.
          added
            .querySelectorAll("ytd-comment-renderer")
            .forEach(filterComment);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
