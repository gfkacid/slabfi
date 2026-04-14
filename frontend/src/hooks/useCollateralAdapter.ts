import { useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

export function useLockAndNotify() {
  const queryClient = useQueryClient();

  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}
