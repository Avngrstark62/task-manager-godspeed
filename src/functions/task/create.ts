import { GSContext, GSStatus } from "@godspeedsystems/core";

export default async function (ctx: GSContext) {
  try {
    const {
      inputs: {
        data: { body },
      },
      datasources,
    } = ctx;

    if (!body.title || body.title.trim() === '') {
        return new GSStatus(false, 400, undefined, { message: "Title cannot be empty" });
    }

    const prisma = datasources.schema;
    
    const userExists = await prisma.client.user.findUnique({
      where: {
        id: body.userId,
      },
    });

    if (!userExists) {
      return new GSStatus(false, 404, undefined, { message: "User not found" });
    }

    const task = await prisma.client.task.create({
      data: {
        title: body.title,
        description: body.description,
        userId: body.userId,
      },
    });

    return new GSStatus(true, 201, undefined, task);
  } catch (error: any) {
    ctx.logger.error("Error creating task:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while creating the task",
      error: error.message,
    });
  }
}