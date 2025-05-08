import NextAuth from "next-auth";
import { authConfig } from "./config";

// Simpler export without cache wrapper
export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);