interface UserProfile {
    id: string;
    name: string;
    email: string;
}

export async function delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function fetchUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) {
        return [];
    }

    const promiseArray = userIds.map((id) => {
        return new Promise<UserProfile>((resolve) => {
            const delayTime = Math.floor(Math.random() * 101) + 50;

            setTimeout(() => {
                const profile: UserProfile = {
                    id: id,
                    name: `User ${id}`,
                    email: `user${id}@example.com`,
                };
                resolve(profile);
            }, delayTime);
        });
    });

    return await Promise.all(promiseArray);
}

export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Спроба ${attempt}...`);
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            console.log('Помилка, чекаємо 1000мс...');
            await delay(1000);
        }
    }
    throw new Error('Unknown error');
}

export async function processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
    const results: R[] = [];
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        const currentBatchNumber = Math.floor(i / batchSize) + 1;

        console.log(`Обробка партії ${currentBatchNumber}/${totalBatches}(${batch})...`);

        const batchResults = await processor(batch);

        results.push(...batchResults);
    }
    return results;
}

export async function raceWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
}