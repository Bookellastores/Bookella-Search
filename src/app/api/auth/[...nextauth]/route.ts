import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getUsers } from "../../../../lib/usersDb";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email", placeholder: "user@example.com" },
        password: { label: "كلمة المرور", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        }

        const users = getUsers();
        const user = users.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        );

        if (!user) {
          throw new Error("لا توجد حسابات مسجلة بهذا البريد الإلكتروني");
        }

        if (user.password !== credentials.password) {
          throw new Error("كلمة المرور التي أدخلتها غير صحيحة");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image || null,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
    })
  ],
  pages: {
    signIn: "/", // We will render the beautiful login screen directly at parent route for maximum usability and sleek view
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).name = token.name;
        (session.user as any).email = token.email;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "bookella-sleek-secret-key-12345",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
