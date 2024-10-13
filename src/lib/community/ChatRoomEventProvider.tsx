import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface ChatRoomEventContextType {
  emitOpen: (id: string) => void;
  subscribe: (callback: (id: string) => void) => () => void;
}

export const ChatRoomEventContext = createContext<ChatRoomEventContextType>({
  emitOpen: () => {},
  subscribe: () => () => {},
});

interface ChatRoomEventProviderProps {
  children: ReactNode;
}

export const ChatRoomEventProvider: React.FC<ChatRoomEventProviderProps> = ({
  children,
}) => {
  const [subscribers, setSubscribers] = useState<((id: string) => void)[]>([]);

  const emitOpen = useCallback(
    (id: string) => {
      subscribers.forEach((callback) => callback(id));
    },
    [subscribers]
  );

  const subscribe = useCallback((callback: (id: string) => void) => {
    setSubscribers((prev) => [...prev, callback]);

    return () => {
      setSubscribers((prev) => prev.filter((sub) => sub !== callback));
    };
  }, []);

  return (
    <ChatRoomEventContext.Provider value={{ emitOpen, subscribe }}>
      {children}
    </ChatRoomEventContext.Provider>
  );
};
