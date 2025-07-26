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

    const user = await prisma.client.user.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!user) {
      return new GSStatus(false, 404, undefined, {message: "User not found"});
    }

    return new GSStatus(true, 200, undefined, user);
  } catch (error: any) {
    ctx.logger.error("Error getting user by ID:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while retrieving the user.",
      error: error.message,
    });
  }
}