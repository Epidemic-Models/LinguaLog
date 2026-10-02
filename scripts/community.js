/*
 * LinguaLog Community
 *
 * Community data is intentionally isolated from journals,
 * iPen, connections, and cloud journal synchronization.
 */

(function () {
  "use strict";

  const MAX_POST_LENGTH = 5000;
  const MAX_COMMENT_LENGTH = 2000;

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

    const postIds = (posts || [])
      .map((post) => post.id)
      .filter(Boolean);

    let comments = [];

    if (postIds.length > 0) {
      const {
        data: commentData,
        error: commentError
      } = await supabaseClient
        .from("comments")
        .select("id, post_id, author_id, content, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      if (commentError) {
        console.error(
          "Community comments load failed:",
          commentError
        );
      } else {
        comments = commentData || [];
      }
    }

    const authorIds = [
      ...new Set(
        [
          ...(posts || []).map((post) => post.author_id),
          ...comments.map((comment) => comment.author_id)
        ].filter(Boolean)
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

    const commentsByPostId = new Map();

    comments.forEach((comment) => {
      if (!commentsByPostId.has(comment.post_id)) {
        commentsByPostId.set(comment.post_id, []);
      }

      commentsByPostId
        .get(comment.post_id)
        .push(comment);
    });

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

      const initial =
        username
          .trim()
          .charAt(0)
          .toUpperCase() || "L";

      const article = document.createElement("article");
      article.className = "community-post";

      const header = document.createElement("div");
      header.className = "community-post-header";

      const avatar = document.createElement("div");
      avatar.className = "community-post-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = initial;

      const authorBlock = document.createElement("div");
      authorBlock.className = "community-post-author-block";

      const author = document.createElement("strong");
      author.className = "community-post-author";
      author.textContent = username;

      const time = document.createElement("time");
      time.className = "community-post-time";
      time.dateTime = post.created_at || "";
      time.textContent = formatPostDate(post.created_at);

      authorBlock.append(author, time);
      header.append(avatar, authorBlock);

      const body = document.createElement("div");
      body.className = "community-post-content";
      body.textContent = post.content || "";

      const actions = document.createElement("div");
      actions.className = "community-post-actions";

      const conversationLabel =
        document.createElement("span");

      conversationLabel.className =
        "community-post-conversation";

      conversationLabel.textContent =
        "LinguaLog Community";

      actions.appendChild(conversationLabel);

      if (post.author_id === user.id) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "community-post-delete";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
          "aria-label",
          "Delete this community post"
        );

        deleteButton.addEventListener("click", async () => {
          const confirmed = window.confirm(
            "Delete this post? This cannot be undone."
          );

          if (!confirmed) {
            return;
          }

          deleteButton.disabled = true;
          deleteButton.textContent = "Deleting...";

          const { error: deleteError } = await supabaseClient
            .from("posts")
            .delete()
            .eq("id", post.id)
            .eq("author_id", user.id);

          if (deleteError) {
            console.error(
              "Community post delete failed:",
              deleteError
            );

            deleteButton.disabled = false;
            deleteButton.textContent = "Delete";

            window.alert(
              "Could not delete the post. Please try again."
            );
            return;
          }

          await loadCommunityPosts();
        });

        actions.appendChild(deleteButton);
      }

      const commentsSection = document.createElement("div");
      commentsSection.className = "community-comments";

      const postComments =
        commentsByPostId.get(post.id) || [];

      const commentsHeading = document.createElement("div");
      commentsHeading.className = "community-comments-heading";

      commentsHeading.textContent =
        postComments.length === 1
          ? "1 comment"
          : `${postComments.length} comments`;

      commentsSection.appendChild(commentsHeading);

      if (postComments.length > 0) {
        const commentsList = document.createElement("div");
        commentsList.className = "community-comments-list";

        postComments.forEach((comment) => {
          const commentProfile =
            profilesById.get(comment.author_id);

          const commentUsername =
            commentProfile?.username || "LinguaLog user";

          const commentInitial =
            commentUsername
              .trim()
              .charAt(0)
              .toUpperCase() || "L";

          const commentItem =
            document.createElement("div");

          commentItem.className = "community-comment";

          const commentAvatar =
            document.createElement("div");

          commentAvatar.className =
            "community-comment-avatar";

          commentAvatar.setAttribute(
            "aria-hidden",
            "true"
          );

          commentAvatar.textContent = commentInitial;

          const commentMain =
            document.createElement("div");

          commentMain.className =
            "community-comment-main";

          const commentMeta =
            document.createElement("div");

          commentMeta.className =
            "community-comment-meta";

          const commentAuthor =
            document.createElement("strong");

          commentAuthor.className =
            "community-comment-author";

          commentAuthor.textContent =
            commentUsername;

          const commentTime =
            document.createElement("time");

          commentTime.className =
            "community-comment-time";

          commentTime.dateTime =
            comment.created_at || "";

          commentTime.textContent =
            formatPostDate(comment.created_at);

          commentMeta.append(
            commentAuthor,
            commentTime
          );

          const commentBody =
            document.createElement("div");

          commentBody.className =
            "community-comment-content";

          commentBody.textContent =
            comment.content || "";

          commentMain.append(
            commentMeta,
            commentBody
          );

          if (comment.author_id === user.id) {
            const commentDelete =
              document.createElement("button");

            commentDelete.type = "button";

            commentDelete.className =
              "community-comment-delete";

            commentDelete.textContent = "Delete";

            commentDelete.setAttribute(
              "aria-label",
              "Delete this comment"
            );

            commentDelete.addEventListener(
              "click",
              async () => {
                const confirmed = window.confirm(
                  "Delete this comment? This cannot be undone."
                );

                if (!confirmed) {
                  return;
                }

                commentDelete.disabled = true;
                commentDelete.textContent =
                  "Deleting...";

                const {
                  error: commentDeleteError
                } = await supabaseClient
                  .from("comments")
                  .delete()
                  .eq("id", comment.id)
                  .eq("author_id", user.id);

                if (commentDeleteError) {
                  console.error(
                    "Community comment delete failed:",
                    commentDeleteError
                  );

                  commentDelete.disabled = false;
                  commentDelete.textContent =
                    "Delete";

                  window.alert(
                    "Could not delete the comment. Please try again."
                  );

                  return;
                }

                await loadCommunityPosts();
              }
            );

            commentMain.appendChild(
              commentDelete
            );
          }

          commentItem.append(
            commentAvatar,
            commentMain
          );

          commentsList.appendChild(
            commentItem
          );
        });

        commentsSection.appendChild(
          commentsList
        );
      }

      const commentForm =
        document.createElement("form");

      commentForm.className =
        "community-comment-form";

      const commentInput =
        document.createElement("textarea");

      commentInput.className =
        "community-comment-input";

      commentInput.rows = 2;
      commentInput.maxLength =
        MAX_COMMENT_LENGTH;

      commentInput.placeholder =
        "Write a comment...";

      commentInput.setAttribute(
        "aria-label",
        "Write a comment"
      );

      const commentSubmit =
        document.createElement("button");

      commentSubmit.type = "submit";

      commentSubmit.className =
        "community-comment-submit";

      commentSubmit.textContent = "Reply";

      const commentStatus =
        document.createElement("div");

      commentStatus.className =
        "community-comment-status";

      commentStatus.setAttribute(
        "aria-live",
        "polite"
      );

      commentForm.append(
        commentInput,
        commentSubmit,
        commentStatus
      );

      commentForm.addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();

          const content =
            commentInput.value.trim();

          if (!content) {
            commentStatus.textContent =
              "Write a comment first.";

            commentInput.focus();
            return;
          }

          if (
            content.length >
            MAX_COMMENT_LENGTH
          ) {
            commentStatus.textContent =
              `Comments can be up to ${MAX_COMMENT_LENGTH} characters.`;

            return;
          }

          commentSubmit.disabled = true;
          commentSubmit.textContent =
            "Replying...";

          commentStatus.textContent = "";

          const {
            error: commentInsertError
          } = await supabaseClient
            .from("comments")
            .insert({
              post_id: post.id,
              author_id: user.id,
              content
            });

          if (commentInsertError) {
            console.error(
              "Community comment failed:",
              commentInsertError
            );

            commentStatus.textContent =
              "Could not post your comment. Please try again.";

            commentSubmit.disabled = false;
            commentSubmit.textContent =
              "Reply";

            return;
          }

          await loadCommunityPosts();
        }
      );

      commentsSection.appendChild(
        commentForm
      );

      article.append(
        header,
        body,
        actions,
        commentsSection
      );

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
    window.updateConnectionNotificationBadge?.();
  }

  window.initializeCommunity = initializeCommunity;
  window.loadCommunityPosts = loadCommunityPosts;
})();

