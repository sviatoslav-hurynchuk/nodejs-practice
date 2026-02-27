import { fetchUserProfiles } from './async-funcs';

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