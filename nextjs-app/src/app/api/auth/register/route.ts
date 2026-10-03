import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  whatsappNumber: z.string().min(10, "WhatsApp number must be at least 10 digits"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Registration request body:", body);

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation error:", validation.error.errors);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, companyName, whatsappNumber } = validation.data;

    console.log("Validated data:", { name, email, companyName, whatsappNumber });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        companyName,
        whatsappNumber,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        whatsappNumber: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("User created:", user);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        entity: "User",
        entityId: user.id,
        details: {
          email: user.email,
          companyName: user.companyName,
          whatsappNumber: user.whatsappNumber,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
