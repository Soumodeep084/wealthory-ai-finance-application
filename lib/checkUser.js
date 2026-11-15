import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null;

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      email?.split("@")[0] ||
      "User";

    if (email) {
      const existingByEmail = await db.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        return await db.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkUserId: user.id,
            name,
            imageUrl: user.imageUrl,
          },
        });
      }
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email,
      },
    });

    return newUser;
  } catch (error) {
    if (error?.code === "P2002") {
      return await db.user.findUnique({
        where: { clerkUserId: user.id },
      });
    }
    console.log(error.message);
    return null;
  }
};