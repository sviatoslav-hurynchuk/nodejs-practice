import {fetchUserProfiles, processInBatches, raceWithTimeout, retryOperation} from '../async-funcs';

describe('fetchUserProfiles', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('має повертати порожній масив, якщо передано порожній масив ID', async () => {
        const result = await fetchUserProfiles([]);
        expect(result).toEqual([]);
    });

    it('має повертати масив профілів з правильними даними', async () => {
        const promise = fetchUserProfiles(['1', '2']);

        await jest.advanceTimersByTimeAsync(150);

        const result = await promise;

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: '1',
            name: 'User 1',
            email: 'user1@example.com'
        });
    });

    it('має успішно виконуватись (resolve) з правильним об\'єктом', async () => {
        const promise = fetchUserProfiles(['99']);

        await jest.advanceTimersByTimeAsync(150);

        await expect(promise).resolves.toEqual([
            { id: '99', name: 'User 99', email: 'user99@example.com' }
        ]);
    });
});

describe('retryOperation', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        
        jest.useFakeTimers();
        
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        
        jest.useRealTimers();
        consoleSpy.mockRestore();
    });

    
    it('має успішно виконатися з першої спроби', async () => {
        
        const operation = jest.fn().mockResolvedValue('Успіх');

        const result = await retryOperation(operation, 3);

        expect(result).toBe('Успіх'); 
        expect(operation).toHaveBeenCalledTimes(1); 
        expect(consoleSpy).toHaveBeenCalledWith('Спроба 1...'); 
    });

    
    it('має повторити спробу після помилки та успішно виконатись', async () => {
        
        const operation = jest.fn()
            .mockRejectedValueOnce(new Error('Помилка 1'))
            .mockResolvedValueOnce('Успіх з 2 спроби');

        const promise = retryOperation(operation, 3);

        
        await jest.advanceTimersByTimeAsync(1000);

        const result = await promise;

        expect(result).toBe('Успіх з 2 спроби');
        expect(operation).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith('Помилка, чекаємо 1000мс...');
    });

    
    it('має викинути помилку після вичерпання всіх спроб (дефолтний параметр)', async () => {
        const error = new Error('Фатальна помилка');
        
        const operation = jest.fn().mockRejectedValue(error);

        
        const promise = retryOperation(operation);

        
        const assertion = expect(promise).rejects.toThrow('Фатальна помилка');

        
        await jest.advanceTimersByTimeAsync(2000);

        await assertion;
        expect(operation).toHaveBeenCalledTimes(3); 
    });
});

describe('processInBatches', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore(); 
    });

    
    it('має коректно обробляти дані партіями та повертати об\'єднаний результат', async () => {
        
        const processor = jest.fn(async (batch: number[]) => batch.map(n => n * 2));

        const result = await processInBatches([1, 2, 3, 4, 5], 2, processor);

        expect(result).toEqual([2, 4, 6, 8, 10]); 
        
        expect(processor).toHaveBeenCalledTimes(3);
    });

    
    it('має повертати порожній масив, якщо на вхід передано порожній масив', async () => {
        const processor = jest.fn();

        const result = await processInBatches([], 2, processor);

        expect(result).toEqual([]);
        expect(processor).not.toHaveBeenCalled(); 
    });

    
    it('має логувати прогрес обробки кожної партії', async () => {
        const processor = jest.fn(async (batch: number[]) => batch);

        await processInBatches([1, 2, 3], 2, processor);

        
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Обробка партії 1/2'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Обробка партії 2/2'));
    });
});

describe('raceWithTimeout', () => {
    beforeEach(() => {
        jest.useFakeTimers(); 
    });

    afterEach(() => {
        jest.useRealTimers(); 
    });

    
    it('має повертати результат промісу, якщо він завершився швидше за таймаут', async () => {
        
        const fastPromise = Promise.resolve('Успіх');

        const result = await raceWithTimeout(fastPromise, 1000);

        expect(result).toBe('Успіх'); 
    });

    
    it('має викидати помилку, якщо проміс не встиг завершитися за відведений час', async () => {
        
        const slowPromise = new Promise(resolve => setTimeout(resolve, 2000));

        const racePromise = raceWithTimeout(slowPromise, 1000);

        
        
        const assertion = expect(racePromise).rejects.toThrow('Operation timed out after 1000ms');

        
        await jest.advanceTimersByTimeAsync(1000);

        
        await assertion;
    });
});