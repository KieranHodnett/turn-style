// src/server/api/routers/station.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const stationRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.station.findMany();
  }),
  
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.station.findUnique({
        where: { id: input.id },
        include: { reports: true },
      });
    }),
});