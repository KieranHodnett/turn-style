// src/server/api/routers/favorite.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const favoriteRouter = createTRPCRouter({
  // Toggle favorite status (add or remove)
  toggle: protectedProcedure
    .input(z.object({ stationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { stationId } = input;

      // Check if the favorite already exists
      const existingFavorite = await ctx.db.userFavorite.findUnique({
        where: {
          userId_stationId: {
            userId,
            stationId,
          },
        },
      });

      if (existingFavorite) {
        // Remove the favorite
        await ctx.db.userFavorite.delete({
          where: {
            id: existingFavorite.id,
          },
        });
        return { status: "removed" };
      } else {
        // Add as favorite
        await ctx.db.userFavorite.create({
          data: {
            userId,
            stationId,
          },
        });
        return { status: "added" };
      }
    }),

  // Get all favorites for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const favorites = await ctx.db.userFavorite.findMany({
      where: {
        userId,
      },
      include: {
        station: {
          include: {
            reports: {
              orderBy: {
                createdAt: "desc",
              },
              take: 3,
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return favorites;
  }),

  // Check if a station is favorited
  isFavorite: protectedProcedure
    .input(z.object({ stationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { stationId } = input;

      const favorite = await ctx.db.userFavorite.findUnique({
        where: {
          userId_stationId: {
            userId,
            stationId,
          },
        },
      });

      return !!favorite;
    }),
});