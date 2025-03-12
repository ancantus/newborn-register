import Dexie, { type EntityTable } from 'dexie';

interface RecordIdentifier {
	id: number;
	tableName: 'feedings' | 'sleeps';
}

interface ActivityRecord {
	id: number;
	start: number;
	end?: number;
	recordId: RecordIdentifier;
}

interface FeedingRecord {
	id: number;
	start?: number;
	end?: number;
	comment?: string;

	// feeding specific metadata
	type?: "BREAST" | "BREAST_R" | "BREAST_L" | "BOTTLE";
	liquid?: "BREAST_MILK" | "FORMULA" | "WATER" | "JUCE";
	amount?: number;
}

interface SleepingRecord {
	id: number;
	start?: number;
	end?: number;
	comment?: string;
}

// create the database types for typescript & indexing schema for indexeddb
const db = new Dexie('newborn-register') as Dexie & {
	activities: EntityTable<ActivityRecord, 'id'>;
	feedings: EntityTable<FeedingRecord, 'id'>;
	sleeps: EntityTable<SleepingRecord, 'id'>;
};
db.version(1).stores({
	activities: '++id, start, end',
	feedings: '++id, start, end, [type+liquid]',
	sleeps: '++id, start, end',
});

export type { RecordIdentifier, ActivityRecord, FeedingRecord, SleepingRecord };

export { db };

