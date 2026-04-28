import { prisma } from "@/lib/prisma.ts";
import bcrypt from "bcrypt";
import type { CreateUserInput } from "@/validators/user.schema.ts";
import { sendPasswordEmail } from "@/lib/mailer.ts";

const createUser = async (input: CreateUserInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });
  if (user) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  await sendPasswordEmail(input.email, input.password);
  switch (input.type) {
    case "student":
      return await prisma.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          passwordHash: hashedPassword,
          student: {
            create: {
              classId: input.classId,
              studentCode: input.studentCode,
            },
          },
        },
      });
    case "staff":
      return await prisma.user.create({
        data: {
          email: input.email,
          passwordHash: hashedPassword,
          fullName: input.fullName,
          staff: {
            create: {
              role: input.role,
            },
          },
        },
      });
  }
};

export { createUser };
