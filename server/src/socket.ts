import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { verifyToken } from "./utils/jwt.js";
import { prisma } from "./db.js";

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.on("join-cookbook", async (cookbookId: string) => {
      const membership = await prisma.cookbookMember.findUnique({
        where: { userId_cookbookId: { userId, cookbookId } },
      });

      if (!membership || membership.status !== "ACCEPTED") {
        socket.emit("error", { message: "You are not a member of this cookbook" });
        return;
      }

      socket.join(`cookbook:${cookbookId}`);
    });

    socket.on("leave-cookbook", (cookbookId: string) => {
      socket.leave(`cookbook:${cookbookId}`);
    });

    socket.on("send-message", async (data: { cookbookId: string; content: string }) => {
      const { cookbookId, content } = data;

      const membership = await prisma.cookbookMember.findUnique({
        where: { userId_cookbookId: { userId, cookbookId } },
      });

      if (!membership || membership.status !== "ACCEPTED") {
        socket.emit("error", { message: "You are not a member of this cookbook" });
        return;
      }

      const message = await prisma.message.create({
        data: { content, userId, cookbookId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      });

      io.to(`cookbook:${cookbookId}`).emit("new-message", message);
    });

    socket.on("edit-message", async (data: { messageId: string; content: string }) => {
      const { messageId, content } = data;

      const existing = await prisma.message.findUnique({ where: { id: messageId } });
      if (!existing || existing.userId !== userId) {
        socket.emit("error", { message: "You cannot edit this message" });
        return;
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      });

      io.to(`cookbook:${existing.cookbookId}`).emit("message-updated", updated);
    });

    socket.on("delete-message", async (data: { messageId: string }) => {
      const { messageId } = data;

      const existing = await prisma.message.findUnique({ where: { id: messageId } });
      if (!existing || existing.userId !== userId) {
        socket.emit("error", { message: "You cannot delete this message" });
        return;
      }

      await prisma.message.delete({ where: { id: messageId } });

      io.to(`cookbook:${existing.cookbookId}`).emit("message-deleted", { messageId, cookbookId: existing.cookbookId });
    });
  });

  return io;
}
