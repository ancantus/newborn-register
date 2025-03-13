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

<h2 class="text-xl">Activity Feed:</h2>
<ol class="container max-w-1/2 p-2">
	{#if activities}
		{#each activities as activity (activity.id)}
			<li class="p-2"><ActivityItem id={activity.id} /></li>
		{/each}
	{/if}
</ol>
