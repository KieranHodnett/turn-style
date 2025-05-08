// src/server/api/routers/report.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const reportRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        stationId: z.string(),
        content: z.string().min(1, "Report content is required"),
        policePresent: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { stationId, content, policePresent } = input;
      
      // Check if station exists
      const station = await ctx.db.station.findUnique({
        where: { id: stationId },
      });
      
      if (!station) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Station not found",
        });
      }
      
      // Create the report
      const report = await ctx.db.report.create({
        data: {
          text: content,
          policePresent,
          stationId,
          userId: ctx.session.user.id,
        },
      });
      
      // Update station police presence based on latest report
      await ctx.db.station.update({
        where: { id: stationId },
        data: { policeRecent: policePresent },
      });
      
      return report;
    }),
    
  getByStation: publicProcedure
    .input(z.object({ stationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.report.findMany({
        where: { stationId: input.stationId },
        orderBy: { createdAt: "desc" },
        take: 10, // Limit to most recent 10 reports
        include: { user: { select: { name: true, image: true } } },
      });
    }),
    
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.report.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { station: true },
    });
  }),
});