"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";

type StoreProviderProps = {
  children: React.ReactNode;
};

/**
 * Next.js App Router 는 Server Component 가 기본이라
 * Redux Provider 는 Client Component 로 한 번 감싸 준다.
 */
export default function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
