<script>
	import ActivityList from './ActivityList.svelte';
	import TimerControls from './TimerControls.svelte';
</script>

<h1>Welcome to SvelteKit</h1>

<div>
	<h2>Timer Controls:</h2>
	<br />
	<TimerControls />
</div>

<ActivityList limit={10} />
