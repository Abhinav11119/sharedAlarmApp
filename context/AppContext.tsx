import React, { createContext, useContext, useState } from "react";

type Friend = {
  name: string;
  status: "requested" | "approved";
};

type Alarm = {
  time: Date;
  forUser: string;
};

type AppContextType = {
  friends: Friend[];
  sendRequest: (name: string) => void;
  approveRequest: (name: string) => void;
  alarms: Alarm[];
  addAlarm: (time: Date, user: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: any) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const sendRequest = (name: string) => {
    setFriends((prev) => {
      const exists = prev.find((f) => f.name === name);
      if (exists) return prev;

      return [...prev, { name, status: "requested" }];
    });
  };

  const approveRequest = (name: string) => {
    setFriends((prev) =>
      prev.map((f) =>
        f.name === name ? { ...f, status: "approved" } : f
      )
    );
  };

  const addAlarm = (time: Date, user: string) => {
    setAlarms((prev) => [...prev, { time, forUser: user }]);
  };

  return (
    <AppContext.Provider
      value={{ friends, sendRequest, approveRequest, alarms, addAlarm }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};