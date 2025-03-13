<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import type { ActivityRecord, RecordIdentifier } from '$lib/db';
	import { stateQuery } from '$lib/stateQuery.svelte';
	import TimerControls from './TimerControls.svelte';

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
		const timestamp = formatDatetime(record.start);
		const elapsedTime = formatElapsedTime(currentTime - record.start);
		const name = activityName(record.recordId.tableName);
		return `${timestamp}: ${name} for ${elapsedTime}`;
	}

	function formatDatetime(timestamp: number) {
		const d = new Date(timestamp);
		const hours = Math.floor(d.getHours() % 12)
			.toString()
			.padStart(2, '0');
		const minutes = d.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes} ${d.getHours() / 12 < 1 ? 'AM' : 'PM'}`;
	}

	function formatElapsedTime(duration: number) {
		const totalSeconds = Math.floor(duration / 1000);
		const seconds = `${totalSeconds % 60}s`;
		if (totalSeconds < 60) {
			return seconds;
		}

		const minutes = `${Math.floor((totalSeconds / 60) % 60)}m`;
		if (totalSeconds < 60 * 60) {
			return `${minutes} ${seconds}`;
		}

		const hours = `${Math.floor(totalSeconds / (60 * 60))}h`;
		return `${hours} ${minutes} ${seconds}`;
	}

	function activityName(tableName: string) {
		switch (tableName) {
			case 'feedings':
				return `Feed`;
			case 'sleeps':
				return `Sleep`;
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
	<div class="justify-streach flex items-center rounded border p-2 shadow-lg">
		{#if active}
			<button class="" onclick={play}
				><img class="h-8 object-contain" src="images/play.svg" alt="Play" /></button
			>
			<span class="flex-grow text-lg">{activityStatus(activity, activity.end || 0)}</span>
		{:else}
			<button class="" onclick={pause}
				><img class="h-8 object-contain" src="images/pause.svg" alt="Pause" /></button
			>
			<span class="flex-grow text-lg">{activityStatus(activity, time)}</span>
		{/if}
		<span class="right-0">
			<button onclick={edit}
				><img class="h-8 object-contain" src="images/edit.svg" alt="Edit" /></button
			>
			<button onclick={trash}
				><img class="h-8 object-contain" src="images/delete.svg" alt="Delete" /></button
			>
		</span>
	</div>
{/if}
