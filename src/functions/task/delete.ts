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

    const taskExists = await prisma.client.task.findUnique({
      where: {
        id: params.taskId,
      },
    });

    if (!taskExists) {
      return new GSStatus(false, 404, undefined, {
        message: "Task not found",
      });
    }

    // Check if the user is authorized to delete the task
    if (taskExists.userId !== params.userId) {
      return new GSStatus(false, 403, undefined, {
        message: "User not authorized to delete this task",
      });
    }

    const task = await prisma.client.task.delete({
      where: {
        id: params.taskId,
      },
    });

    return new GSStatus(true, 204, undefined, {
      message: "Task deleted successfully",
      task,
    });
  } catch (error: any) {
    ctx.logger.error("Error deleting task:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while deleting the task",
      error: error.message,
    });
  }
}