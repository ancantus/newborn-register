<script lang="ts">
	import { db } from '$lib/db';

	async function startFeedingTimer() {
		const startTime = Date.now();
		await db.transaction('rw', db.activities, db.feedings, async () => {
			const id = await db.feedings.put({
				start: startTime,
				type: 'BREAST',
				liquid: 'BREAST_MILK'
			});
			await db.activities.put({
				start: startTime,
				recordId: { id: id, tableName: 'feedings' }
			});
		});
	}

	async function startSleepingTimer() {
		const startTime = Date.now();
		await db.transaction('rw', db.activities, db.sleeps, async () => {
			const id = await db.sleeps.put({
				start: startTime
			});
			await db.activities.put({
				start: startTime,
				recordId: { id: id, tableName: 'sleeps' }
			});
		});
	}
</script>

<div>
	<button onclick={startFeedingTimer}
		><img class="h-24" src="images/bottle.svg" alt="Start Feed Timer" /></button
	>
	<button onclick={startSleepingTimer}
		><img class="h-24" src="images/sleep.svg" alt="Start Sleep Timer" /></button
	>
</div>
