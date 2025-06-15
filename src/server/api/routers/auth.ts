// src/server/api/routers/auth.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import jwt from "jsonwebtoken";

export const authRouter = createTRPCRouter({
  // Exchange Discord OAuth code for session
  loginWithDiscord: publicProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string(),
        codeVerifier: z.string(), // Add PKCE code verifier
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // ADD DEBUG LOGGING
        console.log('🚀 ===== DISCORD OAUTH DEBUG START =====');
        console.log('📥 Input received:', {
          codeLength: input.code.length,
          codePreview: input.code.substring(0, 10) + '...',
          redirectUri: input.redirectUri,
          codeVerifierLength: input.codeVerifier.length,
          codeVerifierPreview: input.codeVerifier.substring(0, 10) + '...',
          timestamp: new Date().toISOString()
        });

        // Check environment variables
        const clientId = process.env.AUTH_DISCORD_ID;
        const clientSecret = process.env.AUTH_DISCORD_SECRET;
        
        console.log('🔧 Environment check:', {
          hasClientId: !!clientId,
          clientIdPreview: clientId ? clientId.substring(0, 8) + '...' : 'MISSING',
          hasClientSecret: !!clientSecret,
          clientSecretPreview: clientSecret ? 'EXISTS (hidden)' : 'MISSING'
        });

        if (!clientId || !clientSecret) {
          console.error('❌ Missing Discord credentials in environment');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Discord credentials not configured'
          });
        }

        // Include code_verifier in the token exchange for PKCE
        const params = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: input.code,
          grant_type: "authorization_code",
          redirect_uri: input.redirectUri,
          code_verifier: input.codeVerifier, // This is required for PKCE
        });

        console.log('📤 Token exchange request details (with PKCE):', {
          url: 'https://discord.com/api/oauth2/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          bodyString: params.toString(),
          hasPKCE: !!input.codeVerifier,
        });

        console.log('🌐 Making request to Discord...');
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        });

        console.log('📨 Discord response received:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          ok: tokenResponse.ok
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          console.error('❌ Discord API Error Details:', {
            status: tokenResponse.status,
            error: tokenData.error,
            errorDescription: tokenData.error_description,
            fullResponse: tokenData
          });

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Discord OAuth failed: ${tokenData.error_description || tokenData.error}`,
          });
        }

        console.log('✅ Discord token exchange successful with PKCE:', {
          hasAccessToken: !!tokenData.access_token,
          tokenType: tokenData.token_type,
          scope: tokenData.scope
        });

        // Get Discord user info
        console.log('👤 Fetching user info from Discord...');
        const userResponse = await fetch("https://discord.com/api/users/@me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          console.error('❌ Failed to fetch Discord user info:', {
            status: userResponse.status,
            statusText: userResponse.statusText
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to fetch Discord user info",
          });
        }

        const discordUser = await userResponse.json();
        console.log('✅ Discord user info received:', {
          id: discordUser.id,
          username: discordUser.username,
          email: discordUser.email ? 'present' : 'missing'
        });

        // Check if user exists, create if not
        let user = await ctx.db.user.findUnique({
          where: { email: discordUser.email },
        });

        if (!user) {
          console.log('👤 Creating new user in database...');
          user = await ctx.db.user.create({
            data: {
              name: discordUser.username,
              email: discordUser.email,
              image: discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null,
            },
          });
          console.log('✅ New user created:', user.id);
        } else {
          console.log('✅ Existing user found:', user.id);
        }

        // Create session token
        const sessionToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.AUTH_SECRET!,
          { expiresIn: "30d" }
        );

        console.log('🎉 ===== DISCORD OAUTH DEBUG END (SUCCESS) =====');

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          sessionToken,
        };
      } catch (error) {
        console.error('💥 ===== DISCORD OAUTH DEBUG END (ERROR) =====');
        console.error("Discord auth error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Authentication failed",
        });
      }
    }),

  // Verify session token
  verifySession: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const decoded = jwt.verify(input.sessionToken, process.env.AUTH_SECRET!) as {
          userId: string;
          email: string;
        };

        const user = await ctx.db.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found",
          });
        }

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid session token",
        });
      }
    }),

  // Logout (invalidate token on client side)
  logout: publicProcedure.mutation(() => {
    return { success: true };
  }),
});