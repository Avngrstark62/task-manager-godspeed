import { GSContext, GSStatus } from "@godspeedsystems/core";

export default async function (ctx: GSContext) {
  try {
    const {
      inputs: {
        data: { params },
      },
      datasources,
    } = ctx;

    const prisma = datasources.schema;
    
    const userExists = await prisma.client.user.findUnique({
      where: {
        id: params.userId,
      },
    });

    if (!userExists) {
      return new GSStatus(false, 404, undefined, {
        message: "User not found",
      });
    }

    const task = await prisma.client.task.findUnique({
      where: {
        id: params.taskId,
      },
    });

    if (!task) {
      return new GSStatus(false, 404, undefined, {
        message: "Task not found",
      });
    }
    
    // Check if the task belongs to the user
    if (task.userId !== params.userId) {
      return new GSStatus(false, 403, undefined, {
        message: "User does not have permission to access this task",
      });
    }

    return new GSStatus(true, 200, undefined, task);
  } catch (error: any) {
    ctx.logger.error("Error getting task by ID:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while retrieving the task",
      error: error.message,
    });
  }
}