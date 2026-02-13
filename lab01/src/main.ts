import {
    delay,
    fetchUserProfiles,
    retryOperation,
    processInBatches,
    raceWithTimeout
} from './async-funcs';

async function main(): Promise<void> {
    console.log('=== Тест 1: Паралельне завантаження ===');
    console.time('fetchUserProfiles');
    const profiles = await fetchUserProfiles(['1', '2', '3', '4', '5']);
    console.timeEnd('fetchUserProfiles');
    console.log(`Завантажено ${profiles.length} профілів`);
    console.log('\n=== Тест 2: Retry механізм ===');
    let attempt = 0;
    const result = await retryOperation(async () => {
        attempt++;
        if (attempt < 2) throw new Error('Помилка');
        return 'Успіх!';
    }, 3);
    console.log(result);
    console.log('\n=== Тест 3: Batch обробка ===');
    const items: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const processed = await processInBatches(
        items,
        3,
        async (batch: number[]) => {
            await delay(50);
            return batch.map(n => n * 2);
        }
    );
    console.log('Оброблено:', processed);
    console.log('\n=== Тест 4: Timeout ===');
    try {
        await raceWithTimeout(delay(200), 100);
    } catch (err) {
        if (err instanceof Error) {
            console.error('Timeout:', err.message);
        }
    }
}

main().catch(console.error);