import * as api from '$lib/api/client';

class HabitStore {
  habits = $state<api.IHabit[]>([]);
  overview = $state<api.IHabitOverview | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  async fetchHabits() {
    this.loading = true;
    this.error = null;
    try {
      this.habits = await api.getHabits();
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  async fetchOverview() {
    try {
      this.overview = await api.getHabitOverview();
    } catch (err: any) {
      this.error = err.message;
    }
  }

  async createHabit(taskId: number) {
    try {
      await api.createHabit(taskId);
      await this.fetchHabits();
      await this.fetchOverview();
    } catch (err: any) {
      this.error = err.message;
    }
  }

  async deleteHabit(habitId: number) {
    const index = this.habits.findIndex(h => h.id === habitId);
    if (index !== -1) {
      this.habits.splice(index, 1);
    }
    
    try {
      await api.deleteHabit(habitId);
      await this.fetchOverview();
    } catch (err: any) {
      this.error = err.message;
      await this.fetchHabits();
    }
  }

  async completeHabit(taskId: number) {
    try {
      await api.completeHabit(taskId);
      await this.fetchHabits();
      await this.fetchOverview();
    } catch (err: any) {
      this.error = err.message;
    }
  }

  async uncompleteHabit(taskId: number, date: string) {
    try {
      await api.uncompleteHabit(taskId, date);
      await this.fetchHabits();
      await this.fetchOverview();
    } catch (err: any) {
      this.error = err.message;
    }
  }

  getHabitById(id: number): api.IHabit | undefined {
    return this.habits.find(h => h.id === id);
  }

  isCompletedToday(habitId: number): boolean {
    const habit = this.getHabitById(habitId);
    if (!habit || !habit.lastCompletedDate) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return habit.lastCompletedDate === today;
  }
}

export const habitsStore = new HabitStore();
