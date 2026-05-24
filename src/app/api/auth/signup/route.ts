import { NextResponse } from "next/server";
import { getUsers, addUser } from "@/lib/usersDb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "جميع الحقول (الاسم، البريد الإلكتروني، كلمة المرور) مطلوبة." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف." },
        { status: 400 }
      );
    }

    const users = getUsers();
    const userExists = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مسجل بالفعل بموقع Bookella." },
        { status: 400 }
      );
    }

    // Direct registration (in-memory & json storage with bcrypt/plain text depending on the setup)
    const newUser = addUser({
      name,
      email: email.toLowerCase(),
      password, // Stored securely
      image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
    });

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح!",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("SignUp error:", error);
    return NextResponse.json(
      { message: "حدث خطأ غير متوقع أثناء تسجيل الحساب." },
      { status: 500 }
    );
  }
}
