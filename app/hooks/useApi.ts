import { ApiService } from "@/api/apiService";
import { useMemo } from "react"; // think of usememo like a singleton, it ensures only one instance exists
import useLocalStorage from "@/hooks/useLocalStorage";

export const useApi = () => {
  const { value: token } = useLocalStorage<string>("token", "");
  // Only if ApiService or token changes, the memo gets updated and useEffect
  // in app/users/page.tsx gets triggered.
  // The token is automatically injected as a Bearer header in every request.
  return useMemo(() => new ApiService(token || undefined), [token]);
};
