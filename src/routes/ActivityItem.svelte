<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import type { ActivityRecord, RecordIdentifier } from '$lib/db';
	import { stateQuery } from '$lib/stateQuery.svelte';

	// primary key of the activity this item renders
	let { id }: { id: number } = $props();

	// setup liveQuery tracker on the activity
	let _activity = stateQuery(
		() => db.activities.get(id),
		() => [id]
	);
	let activity = $derived(_activity.current);
	let active = $derived(activity?.end ? true : false);

	// setup a 1s ticking clock
	let time = $state(Date.now());
	onMount(() => {
		const interval = setInterval(() => {
			time = Date.now();
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	});

	async function play() {
		if (activity) {
			let startTime = Date.now();
			await db.transaction('rw', db.activities, activity.recordId.tableName, async () => {
				const copiedId = await copyRecord(activity.recordId, startTime);
				if (copiedId) {
					await db.activities.put({
						start: startTime,
						recordId: { id: copiedId, tableName: activity.recordId.tableName }
					});
				}
			});
		}
	}

	async function copyRecord(recordId: RecordIdentifier, startTime: number) {
		switch (recordId.tableName) {
			case 'feedings': {
				return await db.transaction('rw', db.feedings, async () => {
					// copy over type and liquid metadata that's often the same between records
					const src = await db.feedings.get(recordId.id);
					if (src) {
						return await db.feedings.put({
							start: startTime,
							type: src.type,
							liquid: src.liquid
						});
					}
				});
			}
			case 'sleeps': {
				// sleep contains no metadata that's transferrable
				return await db.sleeps.put({
					start: startTime
				});
			}
		}
	}

	async function pause() {
		if (activity) {
			let endTime = Date.now();
			await db.transaction('rw', 'activities', activity.recordId.tableName, async () => {
				await db.activities.update(activity.id, { end: endTime });
				await db[activity.recordId.tableName].update(activity.recordId.id, { end: endTime });
			});
		}
	}

	function activityStatus(record: ActivityRecord, currentTime: number) {
		const elapsedTime = currentTime - record.start;
		switch (record.recordId.tableName) {
			case 'feedings':
				return `Feed: ${elapsedTime}`;
			case 'sleeps':
				return `Sleep: ${elapsedTime}`;
		}
	}

	async function trash() {
		if (activity) {
			await db.activities.delete(activity.id);
			await db[activity.recordId.tableName].delete(activity.recordId.id);
		}
	}

	function edit() {}
</script>

{#if activity}
	<div>
		{#if active}
			<button onclick={play}>Play</button>
			<span>{activityStatus(activity, activity.end || 0)}</span>
		{:else}
			<button onclick={pause}>Pause</button>
			<span>{activityStatus(activity, time)}</span>
		{/if}
		<span>
			<button onclick={edit}>Edit</button>
			<button onclick={trash}>Delete</button>
		</span>
	</div>
{/if}
