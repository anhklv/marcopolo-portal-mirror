"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Admin, CommunityScope, Customer, Event } from "@/lib/types";
import { admins } from "@/lib/data/mock";

type Resource = "customer" | "event" | "admin";

interface AuthContextType {
  currentAdmin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: Resource, targetData?: any) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化時にlocalStorageからセッションを復元
  useEffect(() => {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      try {
        const { adminId } = JSON.parse(storedSession);
        const admin = admins.find((a) => a.id === adminId);
        if (admin) {
          setCurrentAdmin(admin);
          setIsAuthenticated(true);
        } else {
          // 管理者が見つからない場合はセッションをクリア
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // モックデータから認証
    const admin = admins.find((a) => a.email === email && a.password === password);

    if (admin) {
      // 最終ログイン日時を更新（モックなので実際には更新されない）
      const now = new Date().toISOString();
      const updatedAdmin = { ...admin, lastLoginAt: now };

      setCurrentAdmin(updatedAdmin);
      setIsAuthenticated(true);

      // localStorageにセッションを保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ adminId: admin.id }));

      return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasPermission = (resource: Resource, targetData?: any): boolean => {
    if (!currentAdmin) return false;

    // 特権管理者はすべてにアクセス可能
    if (currentAdmin.role === "super") return true;

    // 管理者管理は特権管理者のみ
    if (resource === "admin") return false;

    // コミュニティ管理者の権限チェック
    if (currentAdmin.role === "community_admin") {
      if (!currentAdmin.communityScopes || currentAdmin.communityScopes.length === 0) {
        return false;
      }

      // 顧客の権限チェック
      if (resource === "customer" && targetData) {
        const customer = targetData as Partial<Customer>;
        if (!customer.communities) return false;

        // 顧客が所属するコミュニティに管理者のスコープが含まれているか
        return customer.communities.some((community) =>
          currentAdmin.communityScopes!.includes(community)
        );
      }

      // イベントの権限チェック
      if (resource === "event" && targetData) {
        const event = targetData as Partial<Event>;
        if (!event.eventType) return false;

        // イベントタイプが管理者のスコープに含まれているか
        return currentAdmin.communityScopes.includes(event.eventType as CommunityScope);
      }
    }

    return false;
  };

  // 初期化が完了するまでは何も表示しない
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        currentAdmin,
        isAuthenticated,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
