import { GSContext, GSDataSource, GSStatus } from "@godspeedsystems/core";

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
        id: params.id,
      },
    });

    if (!userExists) {
      return new GSStatus(false, 404, undefined, {message: "User not found"});
    }

    const user = await prisma.client.user.delete({
      where: {
        id: params.id,
      },
    });

    return new GSStatus(true, 204, undefined, {message: "User deleted successfully", user});
  } catch (error: any) {
    ctx.logger.error("Error deleting user:", error);
    return new GSStatus(false, 500, undefined, {message: "An error occurred while deleting the user", error: error.message});
  }
}