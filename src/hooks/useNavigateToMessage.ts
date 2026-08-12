import { useNavigate } from "react-router-dom";

export function useNavigateToMessage() {
  const navigate = useNavigate();

  const navigateToMessage = (userId: string) => {
    navigate("/dashboard/messages", {
      state: { startConversationWith: userId },
    });
  };

  return { navigateToMessage };
}
