import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api.js';

export function useTasksQuery(searchQuery, category) {
  const queryClient = useQueryClient();

  const queryKey = ['tasks', { search: searchQuery.trim().toLowerCase(), category }];

  const tasksQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => api.fetchTasks(searchQuery, category, signal),
    staleTime: 3000,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, patch }) => api.updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['tasks'] });

      // Optimistically update all task caches
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((task) => (task.id === id ? { ...task, ...patch } : task));
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([k, data]) => {
          queryClient.setQueryData(k, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (updates) => api.batchUpdateTasks(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['tasks'] });

      const updatesMap = new Map();
      updates.forEach(({ id, patch }) => updatesMap.set(id, patch));

      // Optimistically update
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((task) => {
          if (updatesMap.has(task.id)) {
            return { ...task, ...updatesMap.get(task.id) };
          }
          return task;
        });
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([k, data]) => {
          queryClient.setQueryData(k, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    isFetching: tasksQuery.isFetching,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    updateTask: updateTaskMutation.mutateAsync,
    batchUpdate: batchUpdateMutation.mutateAsync,
    isMutating: updateTaskMutation.isPending || batchUpdateMutation.isPending,
  };
}
