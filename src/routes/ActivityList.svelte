<script lang="ts">
	import { db } from '$lib/db';
	import { stateQuery } from '$lib/stateQuery.svelte';
	import ActivityItem from './ActivityItem.svelte';

	let { limit = 10 }: { limit: number } = $props();

	let _activities = stateQuery(
		() => db.activities.orderBy('start').reverse().limit(limit).toArray(),
		() => [limit]
	);
	let activities = $derived(_activities.current || []);
</script>

<h2>Activity Feed:</h2>
<br />
<ol>
	{#if activities}
		{#each activities as activity (activity.id)}
			<ActivityItem id={activity.id} />
		{/each}
	{/if}
</ol>
