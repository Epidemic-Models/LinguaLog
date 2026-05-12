let realtimeChannel = null;

async function startRealtimeSync() {
  const user = await getCurrentUser?.();

  if (!user) return;
  if (realtimeChannel) return;

  realtimeChannel = supabaseClient
    .channel(`journals-sync-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "journals",
        filter: `user_id=eq.${user.id}`
      },
      async () => {
        console.log("Realtime journal update received");

        if (hasLocalChanges?.()) {
          console.log("Skipped cloud sync because local edits are unsaved");
          return;
        }

        await syncCloudJournalsIntoLocal?.();
      }
    )
    .subscribe();
}

window.startRealtimeSync = startRealtimeSync;