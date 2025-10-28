import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Profile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const userResponse = await fetch("http://localhost:3000/api/users/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await userResponse.json();
          const user: User = userData;
          const profile: Profile | null = 'profile' in userData ? userData.profile : {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar_url: null
          };

          setUser(user);
          setProfile(profile);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("profile", JSON.stringify(profile));
        } catch (error) {
          console.error("Auth init error:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("profile");
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  async function signUp(email: string, password: string, username: string) {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      const { user, profile } = data;

      setUser(user);
      setProfile(profile);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("profile", JSON.stringify(profile));
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const { token } = await response.json();
      localStorage.setItem("token", token);

      const userResponse = await fetch("http://localhost:3000/api/users/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();
      const user: User = userData;
      const profile: Profile | null = 'profile' in userData ? userData.profile : {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: null
      };

      setUser(user);
      setProfile(profile);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("profile", JSON.stringify(profile));
    } catch (error) {
      console.error("Sign in error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      setUser(null);
      setProfile(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    localStorage.removeItem("token");
  }

  return <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
