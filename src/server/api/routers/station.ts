// src/server/api/routers/station.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const stationRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Use ctx.db instead of ctx.prisma
    return ctx.db.station.findMany();
  }),
  
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Use ctx.db instead of ctx.prisma
      return ctx.db.station.findUnique({
        where: { stationId: input.id },
        include: { reports: true },
      });
    }),
});