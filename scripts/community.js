/*
 * LinguaLog Community
 *
 * Intentionally isolated from journals, iPen, profiles,
 * connections, and cloud journal synchronization.
 *
 * Backend posting will be added only after the Community
 * page itself has been safely integrated and verified.
 */

(function () {
  "use strict";

  function initializeCommunity() {
    const input = document.getElementById("communityPostInput");
    const button = document.getElementById("communityPublishBtn");
    const status = document.getElementById("communityPostStatus");

    if (!input || !button) {
      return;
    }

    if (button.dataset.communityAttached === "true") {
      return;
    }

    button.dataset.communityAttached = "true";

    button.addEventListener("click", () => {
      const content = input.value.trim();

      if (!content) {
        if (status) {
          status.textContent = "Write something before posting.";
        }
        input.focus();
        return;
      }

      /*
       * No Supabase write yet.
       *
       * This is deliberate. First we verify that the Community
       * module can coexist with the existing LinguaLog app
       * without changing journal behavior.
       */
      if (status) {
        status.textContent =
          "Community posting is ready for backend connection.";
      }
    });
  }

  window.initializeCommunity = initializeCommunity;
})();
