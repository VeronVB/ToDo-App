import { type ITag } from 'shared';
import * as api from '$lib/api/client';

class TagsStore {
    tags = $state<ITag[]>([]);

    constructor() {
        this.fetchTags();
    }

    async fetchTags() {
        try {
            this.tags = await api.getTags();
        } catch (e) {
            console.error(e);
        }
    }
}

export const tagsStore = new TagsStore();
