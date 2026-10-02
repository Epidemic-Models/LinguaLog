/*
 * LinguaLog Community
 *
 * Community data is intentionally isolated from journals,
 * iPen, connections, and cloud journal synchronization.
 */

(function () {
  "use strict";

  const MAX_POST_LENGTH = 5000;

  function escapeCommunityHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPostDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  }

  async function loadCommunityPosts() {
    const feed = document.getElementById("communityFeed");

    if (!feed) {
      return;
    }

    let feedStatus = document.getElementById("communityFeedStatus");

    if (!feedStatus) {
      feedStatus = document.createElement("div");
      feedStatus.id = "communityFeedStatus";
      feedStatus.className = "community-feed-status";
      feed.before(feedStatus);
    }

    const user = await window.getCurrentUser?.();

    if (!user) {
      feed.innerHTML = "";

      if (feedStatus) {
        feedStatus.textContent =
          "Log in to view community posts.";
      }

      return;
    }

    if (feedStatus) {
      feedStatus.textContent = "Loading posts...";
    }

    const { data: posts, error } = await supabaseClient
      .from("posts")
      .select("id, author_id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Community posts load failed:", error);

      if (feedStatus) {
        feedStatus.textContent =
          "Could not load community posts.";
      }

      return;
    }

    const authorIds = [
      ...new Set(
        (posts || [])
          .map((post) => post.author_id)
          .filter(Boolean)
      )
    ];

    let profiles = [];

    if (authorIds.length > 0) {
      const { data, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, username")
        .in("id", authorIds);

      if (profileError) {
        console.error(
          "Community profile load failed:",
          profileError
        );
      } else {
        profiles = data || [];
      }
    }

    const profilesById = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    feed.innerHTML = "";

    if (!posts || posts.length === 0) {
      if (feedStatus) {
        feedStatus.textContent =
          "No posts yet. Start the conversation.";
      }

      return;
    }

    if (feedStatus) {
      feedStatus.textContent = "";
    }

    posts.forEach((post) => {
      const profile = profilesById.get(post.author_id);
      const username = profile?.username || "LinguaLog user";

      const article = document.createElement("article");
      article.className = "community-post";

      const header = document.createElement("div");
      header.className = "community-post-header";

      const author = document.createElement("strong");
      author.className = "community-post-author";
      author.textContent = username;

      const time = document.createElement("time");
      time.className = "community-post-time";
      time.dateTime = post.created_at || "";
      time.textContent = formatPostDate(post.created_at);

      const body = document.createElement("p");
      body.className = "community-post-content";
      body.textContent = post.content || "";

      header.append(author, time);
      article.append(header, body);
      feed.appendChild(article);
    });
  }

  async function publishCommunityPost() {
    const input = document.getElementById("communityPostInput");
    const button = document.getElementById("communityPublishBtn");
    const status = document.getElementById("communityPostStatus");

    if (!input || !button) {
      return;
    }

    const content = input.value.trim();

    if (!content) {
      if (status) {
        status.textContent = "Write something before posting.";
      }

      input.focus();
      return;
    }

    if (content.length > MAX_POST_LENGTH) {
      if (status) {
        status.textContent =
          `Posts can be up to ${MAX_POST_LENGTH} characters.`;
      }

      return;
    }

    const user = await window.getCurrentUser?.();

    if (!user) {
      if (status) {
        status.textContent = "Log in before posting.";
      }

      window.openAuthModal?.();
      return;
    }

    button.disabled = true;
    button.textContent = "Posting...";

    if (status) {
      status.textContent = "";
    }

    const { error } = await supabaseClient
      .from("posts")
      .insert({
        author_id: user.id,
        content
      });

    if (error) {
      console.error("Community post failed:", error);

      if (status) {
        status.textContent =
          "Could not publish your post. Please try again.";
      }

      button.disabled = false;
      button.textContent = "Post";
      return;
    }

    input.value = "";

    if (status) {
      status.textContent = "Posted.";
    }

    button.disabled = false;
    button.textContent = "Post";

    await loadCommunityPosts();
  }

  function initializeCommunity() {
    const input = document.getElementById("communityPostInput");
    const button = document.getElementById("communityPublishBtn");

    if (!input || !button) {
      return;
    }

    if (button.dataset.communityAttached !== "true") {
      button.dataset.communityAttached = "true";

      button.addEventListener(
        "click",
        publishCommunityPost
      );
    }

    loadCommunityPosts();
  }

  window.initializeCommunity = initializeCommunity;
  window.loadCommunityPosts = loadCommunityPosts;
})();

