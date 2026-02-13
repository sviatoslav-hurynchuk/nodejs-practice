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